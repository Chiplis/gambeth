pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";

contract GambethOptimisticOracle is OptimisticRequester {

    using SafeERC20 for IERC20;

    address public contractOwner;

    address public constant OO_ADDRESS = 0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884;
    OptimisticOracleV2Interface public oo = OptimisticOracleV2Interface(OO_ADDRESS);
    bytes32 public PRICE_ID = bytes32("NUMERICAL");

    mapping(string => uint256) public betRequestTimes;
    mapping(string => bool) public finishedBets;
    mapping(string => uint256) public betChoices;
    mapping(bytes32 => mapping(uint256 => mapping(bytes => string))) public requestBets;
    mapping(string => int256) public betProposals;
    mapping(string => mapping(bytes32 => bool)) public betQueries;
    mapping(string => address) public betRequester;

    event CreatedOptimisticBet(string indexed betId, string query);

    function createOptimisticBet(address currency, string calldata betId, uint64 deadline, uint64 schedule, uint256 commissionDenominator, uint256 commission, uint256 initialPool, string[] calldata results, uint256[] calldata ratios, string calldata query) public {
        require(
            bytes(betId).length != 0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule // Users should only be able to place bets before it is actually executed
            && !createdBets[betId], // Can't have duplicate bets
            "Unable to Create market, check arguments."
        );
        betQueries[betId][keccak256(bytes(query))] = true;
        createBet(BetKind.OPTIMISTIC_ORACLE, msg.sender, currency, betId, commissionDenominator, commission, deadline, schedule, initialPool, query, results, ratios);
        emit CreatedOptimisticBet(betId, query);
    }

    function claimBet(string calldata betId, string calldata query) public {
        require(betQueries[betId][keccak256(bytes(query))], "Invalid query for bet");
        bool hasPrice = oo.hasPrice(address(this), PRICE_ID, betRequestTimes[betId], bytes(query));
        bool betExpired = betSchedules[betId] + BET_THRESHOLD < block.timestamp;

        if (!hasPrice) {
            require(betExpired, "Bet result not yet settled");
        }

        _claimBet(betId, msg.sender, getResult(betId));
    }

    // Submit a data request to the Optimistic oracle.
    function requestBetResolution(string calldata betId, string calldata query) public {
        require(betQueries[betId][keccak256(bytes(query))], "Invalid query for bet");
        require(betSchedules[betId] <= block.timestamp, "Bet still not scheduled to run");
        betRequestTimes[betId] = block.timestamp; // Set the request time to the current block time.
        IERC20 bondCurrency = betTokens[betId];
        uint256 reward = tokenFees[address(betTokens[betId])];

        // Now, make the price request to the Optimistic oracle and set the liveness to 30 so it will settle quickly.
        oo.requestPrice(PRICE_ID, betRequestTimes[betId], bytes(query), bondCurrency, reward);
        oo.setBond(PRICE_ID, betRequestTimes[betId], bytes(query), 1750 * 1e6);
        oo.setEventBased(PRICE_ID, betRequestTimes[betId], bytes(query));
        oo.setCustomLiveness(PRICE_ID, betRequestTimes[betId], bytes(query), 1);
        oo.setCallbacks(PRICE_ID, betRequestTimes[betId], bytes(query), false, false, true);
        requestBets[PRICE_ID][betRequestTimes[betId]][bytes(query)] = betId;
        betRequester[betId] = msg.sender;
    }

    function getResult(string memory betId) public view returns (string memory) {
        if (!finishedBets[betId]) {
            return "";
        }
        return betResults[betId][betChoices[betId]];
    }

    function priceSettled(bytes32 identifier, uint256 timestamp, bytes calldata query, int256 price) public {
        require(msg.sender == OO_ADDRESS);
        string memory betId = requestBets[identifier][timestamp][query];
        betChoices[betId] = uint(price) / 1e18;
        finishedBets[betId] = true;
        _claimBet(betId, betRequester[betId], getResult(betId));
    }

    function changeOrder(uint[] calldata orderAmounts, uint[] calldata prices, string calldata betId, string[] calldata results, uint256[] calldata ids) public {
        _changeOrder(msg.sender, orderAmounts, prices, betId, results, ids);
    }

    function fillOrder(uint[] calldata orderAmounts, uint[] calldata prices, OrderPosition[] calldata orderPositions, string calldata betId, string[] calldata results, uint[][] calldata idxs) public {
        fillOrder(msg.sender, orderAmounts, prices, orderPositions, betId, results, idxs);
    }

    function priceProposed(bytes32 identifier, uint256 timestamp, bytes calldata query) public {
    }

    function priceDisputed(bytes32 identifier, uint256 timestamp, bytes calldata data, uint256 refund) public {
    }

    modifier validateClaimedBet(string calldata betId) {
        require(createdBets[betId], "Invalid bet state while claiming reward.");
        _;
    }

    function approveToken(address token) ownerOnly public {
        IERC20(token).approve(OO_ADDRESS, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    }

    modifier ownerOnly() {
        require(msg.sender == contractOwner);
        _;
    }

    function placeBets(string calldata betId, string[] calldata results, uint256[] memory amounts) virtual public {
        _placeBets(betId, msg.sender, results, amounts);
    }

    constructor() {
        contractCreator = msg.sender;
        approvedTokens[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = true;
        tokenDecimals[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = 1e6;
        tokenFees[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = 5e6;
    }

    enum BetKind {
        OPTIMISTIC_ORACLE,
        HUMAN
    }

    mapping(string => BetKind) public betKinds;
    address contractCreator;
    mapping(address => uint256) public tokenDecimals;
    mapping(address => uint256) public tokenFees;
    // For each bet, track which users have already claimed their potential reward
    mapping(string => mapping(address => bool)) public claimedBets;

    mapping(string => uint256) public betCommissionDenominator;

    /* If the oracle service's scheduled callback was not executed after 5 days,
    a user can reclaim his funds after the bet's execution threshold has passed.
    Note that even if the callback execution is delayed,
    Provable's oracle should've extracted the result at the originally scheduled time. */
    uint64 constant public BET_THRESHOLD = 5 * 24 * 60 * 60;

    // If the user wins the bet, let them know along with the reward amount.
    event WonBet(address indexed winner, uint256 won);

    // If the user lost no funds are claimable.
    event LostBet(address indexed loser);

    /* If no one wins the bet the funds can be refunded to the user,
    after the bet's creator takes their cut. */
    event UnwonBet(address indexed refunded);

    mapping(address => bool) public approvedTokens;
    mapping(string => IERC20) public betTokens;

    /* There are two different dates associated with each created bet:
    one for the deadline where a user can no longer place new bets,
    and another one that tells the smart oracle contract when to actually
    run. */
    mapping(string => uint64) public betDeadlines;
    mapping(string => uint64) public betSchedules;

    // Keep track of all createdBets to prevent duplicates
    mapping(string => bool) public createdBets;

    // Keep track of all owners to handle commission fees
    mapping(string => address) public betOwners;
    mapping(string => uint256) public betCommissions;

    // For each bet, how much each has each user put into that bet's pool?
    mapping(string => mapping(address => uint256)) public userPools;

    // What is the total pooled per bet?
    mapping(string => uint256) public betPools;

    /* Contains all the information that does not need to be saved as a state variable,
    but which can prove useful to people taking a look at the bet in the frontend. */
    event CreatedBet(string indexed _id, uint256 initialPool, string description);

    // For each bet, how much is the total pooled per result?
    mapping(string => mapping(string => uint256)) public resultPools;

    // For each bet, track how much each user has put into each result
    mapping(string => mapping(address => mapping(string => uint256))) public userBets;

    // Track token transfers
    mapping(string => mapping(address => mapping(string => int256))) public userTransfers;
    mapping(string => mapping(string => uint256)) public resultTransfers;

    mapping(string => string[]) public betResults;

    // The table representing each bet's pool is populated according to these events.
    event PlacedBets(address indexed user, string indexed _id, string id, string[] results);

    function manageToken(address token, uint256 decimals, bool approved) ownerOnly public {
        approvedTokens[token] = approved;
        tokenDecimals[token] = decimals;
    }

    function getOutcomes(string calldata betId) public view returns (string[] memory) {
        string[] memory results = new string[](betResults[betId].length);
        for (uint i = 0; i < results.length; i++) {
            results[i] = betResults[betId][i];
        }
        return results;
    }

    function createBet(BetKind kind, address sender, address token, string calldata betId, uint256 commissionDenominator, uint256 commission, uint64 deadline, uint64 schedule, uint256 initialPool, string calldata query, string[] calldata results, uint256[] calldata ratios) public {
        require(approvedTokens[token] && !createdBets[betId], "Unapproved token for creating bets.");
        require(commissionDenominator > 0, "Invalid commission denominator.");
        require(results.length == ratios.length, "Each outcome should have a corresponding ratio to split initial pool.");
        uint totalRatio = 0;
        for (uint i = 0; i < ratios.length; i++) {
            totalRatio += ratios[i];
        }
        require(totalRatio == 100, "Share ratio should add up to 100.");
        IERC20(token).safeTransferFrom(sender, address(this), tokenFees[token]);

        // Nothing fancy going on here, just boring old state updates
        betKinds[betId] = kind;
        betOwners[betId] = sender;
        betTokens[betId] = IERC20(token);
        betCommissions[betId] = commission;
        betCommissionDenominator[betId] = commissionDenominator;
        betDeadlines[betId] = deadline;
        betSchedules[betId] = schedule;
        betResults[betId] = results;

        userPools[betId][sender] = initialPool;
        betPools[betId] = initialPool;

        // Bet creation should succeed from this point onward
        createdBets[betId] = true;

        uint256[] memory shares = new uint256[](results.length);
        for (uint i = 0; i < results.length; i++) {
            shares[i] = initialPool / 100 * ratios[i];
        }
        placeBets(betId, results, shares);

        emit CreatedBet(betId, initialPool, query);
    }

    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function calculateCost(string memory betId) public view returns (uint256) {
        uint cost = 0;
        for (uint i = 0; i < betResults[betId].length; i++) {
            cost += (resultPools[betId][betResults[betId][i]] * tokenDecimals[address(betTokens[betId])]) ** 2;
        }
        return sqrt(cost);
    }

    function _placeBets(string calldata betId, address sender, string[] memory results, uint256[] memory amounts) private {
        require(
            results.length > 0
            && results.length == amounts.length
            && createdBets[betId]
            && betDeadlines[betId] >= block.timestamp,
            "Unable to place bets, check arguments."
        );


        uint total = 0;
        IERC20 token = betTokens[betId];
        for (uint i = 0; i < results.length; i++) {
            uint previousCost = calculateCost(betId);
            // By not allowing anyone to bet on an empty string bets can be refunded if an error happens.
            require(bytes(results[i]).length > 0 && amounts[i] > 0,
                "Attempted to place invalid bet, check amounts and results"
            );

            // Update all required state
            resultPools[betId][results[i]] += amounts[i];
            userPools[betId][sender] += amounts[i];
            betPools[betId] += amounts[i];
            userBets[betId][sender][results[i]] += amounts[i];
            uint transfer = calculateCost(betId) - previousCost;
            userTransfers[betId][sender][results[i]] += int(transfer);
            resultTransfers[betId][results[i]] += transfer;
            total += transfer;
        }

        token.safeTransferFrom(sender, address(this), total);

        emit PlacedBets(sender, betId, betId, results);
    }

    function _claimBet(string memory betId, address sender, string memory result) private {
        // Does the user have any pending buys?
        uint256 pending = pendingBuys[betId][sender];
        pendingBuys[betId][sender] = 0;
        betTokens[betId].safeTransfer(sender, pending);

        // Did the user bet on the correct result?
        uint256 userBet = userBets[betId][sender][result];

        // How much did everyone pool into the correct result?
        uint256 winnerPool = resultPools[betId][result];

        if (claimedBets[betId][sender] || (userBet == 0 && winnerPool != 0)) {
            return;
        }

        claimedBets[betId][sender] = true;

        uint256 reward = (calculateCost(betId) * userBet) / winnerPool;

        // Bet owner gets their commission
        int256 totalTransfers = userTransfers[betId][sender][result];
        uint256 ownerFee = ((reward - uint(totalTransfers <= 0 ? int(0) : totalTransfers)) / betCommissionDenominator[betId]) * betCommissions[betId];
        reward -= ownerFee;
        emit WonBet(sender, reward);

        IERC20 token = betTokens[betId];
        token.safeTransfer(sender, reward);
        token.safeTransfer(betOwners[betId], ownerFee);
    }

    function calculateContractCommission(uint256, string[] calldata, uint256[] calldata) pure public returns (uint256) {
        return 0;
    }

    struct Order {
        OrderPosition orderPosition;
        uint pricePerShare;
        string result;
        uint amount;
        address user;
    }
    enum OrderPosition {BUY, SELL}
    enum OrderType{MARKET, LIMIT}
    enum OrderStatus {FILLED, UNFILLED}

    mapping(string => Order[]) public orders;
    mapping(string => mapping(address => uint256)) public pendingBuys;
    mapping(string => mapping(address => mapping(string => uint256))) public pendingSells;

    function addOrder(address sender, string calldata betId, Order memory order) private {
        require(order.amount != 0, "Invalid new order state");
        // If before pool lockout, should be able to simply place a bet
        if (betDeadlines[betId] >= block.timestamp && order.orderPosition == OrderPosition.BUY) {
            uint[] memory amounts = new uint[](1);
            amounts[0] = order.amount;
            string[] memory results = new string[](1);
            results[0] = order.result;
            _placeBets(betId, sender, results, amounts);
            return;
        }

        if (order.orderPosition == OrderPosition.BUY) {
            uint transferAmount = order.amount * order.pricePerShare;
            pendingBuys[betId][sender] += transferAmount;
            betTokens[betId].safeTransferFrom(sender, address(this), transferAmount);
        } else if (order.orderPosition == OrderPosition.SELL) {
            pendingSells[betId][sender][order.result] += order.amount;
            require(pendingSells[betId][sender][order.result] <= userBets[betId][sender][order.result], "Exceeded valid sell amount when adding order");
        }
        orders[betId].push(order);
    }

    function _changeOrder(address sender, uint[] calldata orderAmounts, uint[] calldata prices, string calldata betId, string[] calldata results, uint256[] calldata ids) private {
        require(ids.length == orderAmounts.length && ids.length == prices.length && ids.length == results.length, "Invalid change order");
        for (uint i = 0; i < ids.length; i++) {
            Order storage order = orders[betId][i];
            require(order.user == sender, "User did not create specified order");

            if (order.orderPosition == OrderPosition.BUY) {
                uint256 newCost = orderAmounts[i] * prices[i];
                uint256 previousCost = order.amount * order.pricePerShare;
                pendingBuys[betId][sender] -= previousCost;
                pendingBuys[betId][sender] += newCost;
                if (newCost > previousCost) {
                    betTokens[betId].safeTransferFrom(sender, address(this), newCost - previousCost);
                } else if (newCost < previousCost) {
                    betTokens[betId].safeTransfer(sender, previousCost - newCost);
                }
            } else if (order.orderPosition == OrderPosition.SELL) {
                pendingSells[betId][sender][order.result] -= order.amount;
                pendingSells[betId][sender][results[i]] += orderAmounts[i];
                require(pendingSells[betId][sender][results[i]] <= userBets[betId][sender][results[i]], "Exceeded valid sell amount when changing order");
            }
            order.result = results[i];
            order.amount = orderAmounts[i];
            order.pricePerShare = prices[i];
        }
    }

    function getOrders(string calldata betId, uint256 start, uint256 amount) public view returns (Order[] memory) {
        Order[] memory list;
        if (start >= orders[betId].length) {
            return list;
        }
        if (orders[betId].length - start > amount) {
            list = new Order[](amount);
        } else {
            list = new Order[](orders[betId].length - start);
        }
        for (uint i = 0; i < list.length && i + start < orders[betId].length; i++) {
            list[i] = orders[betId][i + start];
        }
        return list;
    }

    function fillOrder(address sender, uint[] calldata orderAmounts, uint[] calldata prices, OrderPosition[] calldata orderPositions, string calldata betId, string[] calldata results, uint[][] calldata idxs) private {

        for (uint r = 0; r < results.length; r++) {
            string calldata result = results[r];
            uint orderAmount = orderAmounts[r];
            uint pricePerShare = prices[r];
            uint[] calldata indexes = idxs[r];
            OrderPosition orderPosition = orderPositions[r];
            for (uint i = 0; i < indexes.length && orderAmount != 0; i++) {
                uint index = indexes[i];
                Order storage matchedOrder = orders[betId][index];

                require(
                    matchedOrder.orderPosition != orderPosition
                    && matchedOrder.amount > 0
                    && orderPosition == OrderPosition.BUY
                        ? pricePerShare >= matchedOrder.pricePerShare
                        : pricePerShare <= matchedOrder.pricePerShare
                    && keccak256(bytes(matchedOrder.result)) == keccak256(bytes(result)),
                    "Invalid matching order state"
                );
            }
        }

        for (uint r = 0; r < results.length; r++) {
            string calldata result = results[r];
            uint orderAmount = orderAmounts[r];
            uint pricePerShare = prices[r];
            uint[] calldata indexes = idxs[r];
            OrderPosition orderPosition = orderPositions[r];
            for (uint i = 0; i < indexes.length && orderAmount != 0; i++) {
                uint index = indexes[i];
                Order storage matchedOrder = orders[betId][index];

                uint shareAmount = matchedOrder.amount < orderAmount ? matchedOrder.amount : orderAmount;

                orderAmount -= shareAmount;
                matchedOrder.amount -= shareAmount;

                address seller = orderPosition == OrderPosition.BUY ? matchedOrder.user : sender;
                address buyer = orderPosition == OrderPosition.BUY ? sender : matchedOrder.user;

                uint transferAmount = shareAmount * pricePerShare;

                userPools[betId][buyer] += shareAmount;
                userBets[betId][buyer][result] += shareAmount;

                userPools[betId][seller] -= shareAmount;
                userBets[betId][seller][result] -= shareAmount;

                userTransfers[betId][seller][result] -= int(transferAmount);
                userTransfers[betId][buyer][result] += int(transferAmount);

                if (orderPosition == OrderPosition.BUY) {
                    require(pendingSells[betId][seller][result] >= shareAmount, "Seller does not have enough shares to complete buy order");
                    betTokens[betId].safeTransferFrom(buyer, address(this), transferAmount);
                    pendingSells[betId][seller][result] -= shareAmount;
                } else if (orderPosition == OrderPosition.SELL) {
                    require(pendingBuys[betId][buyer] >= transferAmount, "Buyer does not have enough tokens to complete sell order");
                    pendingBuys[betId][buyer] -= transferAmount;
                }
                betTokens[betId].safeTransfer(seller, transferAmount);
            }
            if (orderAmount != 0) {
                Order memory newOrder = Order({
                    orderPosition: orderPosition,
                    pricePerShare: pricePerShare,
                    result: result,
                    amount: orderAmount,
                    user: sender
                });
                addOrder(sender, betId, newOrder);
            }
        }
    }
}