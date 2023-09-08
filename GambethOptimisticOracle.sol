pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";


contract GambethOptimisticOracle is OptimisticRequester {

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

    function createOptimisticBet(address currency, string calldata betId, uint64 deadline, uint64 schedule, uint256 commissionDenominator, uint256 commission, uint256 initialPool, string[] calldata results, string calldata query) public {
        require(
            bytes(betId).length != 0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule // Users should only be able to place bets before it is actually executed
            && !createdBets[betId], // Can't have duplicate bets
            "Unable to create bet, check arguments."
        );
        betQueries[betId][keccak256(bytes(query))] = true;
        createBet(BetKind.OPTIMISTIC_ORACLE, msg.sender, currency, betId, commissionDenominator, commission, deadline, schedule, initialPool, query, results);
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
        uint256 reward = 0; // Set the reward to 0 (so we dont have to fund it from this contract).

        // Now, make the price request to the Optimistic oracle and set the liveness to 30 so it will settle quickly.
        oo.requestPrice(PRICE_ID, betRequestTimes[betId], bytes(query), bondCurrency, reward);
        // oo.setBond(PRICE_ID, betRequestTimes[betId], bytes(query), 1750 * 1e6);
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

    function changeOrder(uint[] calldata orderAmounts, uint[] calldata numerators, uint[] calldata denominators, string calldata betId, string[] calldata results, uint256[] calldata ids) public {
        changeOrder(msg.sender, orderAmounts, numerators, denominators, betId, results, ids);
    }

    function fillOrder(uint[] calldata orderAmounts, uint[] calldata numerators, uint[] calldata denominators, OrderType[] calldata orderTypes, string calldata betId, string[] calldata results, uint[][] calldata idxs) public {
        fillOrder(msg.sender, orderAmounts, numerators, denominators, orderTypes, betId, results, idxs);
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

    function placeBets(string calldata betId, string[] calldata results, uint256[] calldata amounts) virtual public {
        _placeBets(betId, msg.sender, results, amounts);
    }

    constructor() {
        contractCreator = msg.sender;
        approvedTokens[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = true;
        tokenDecimals[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = 1e6;
    }

    enum BetKind {
        OPTIMISTIC_ORACLE,
        HUMAN
    }

    mapping(string => BetKind) public betKinds;
    address contractCreator;
    mapping(address => uint256) public tokenDecimals;
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

    function getOutcomes(string calldata betId) {
        string[] memory results = new string[](betResults[betId].length);
        for (uint i = 0; i < results.length; i++) {
            results[i] = betResults[i];
        }
        return results;
    }

    function createBet(BetKind kind, address sender, address token, string calldata betId, uint256 commissionDenominator, uint256 commission, uint64 deadline, uint64 schedule, uint256 initialPool, string calldata query, string[] calldata results) public {
        require(approvedTokens[token] && !createdBets[betId], "Unapproved token for creating bets");
        require(commissionDenominator > 0, "Invalid commission denominator");
        bool success = IERC20(token).transferFrom(sender, address(this), initialPool);
        require(success, "Not enough balance for initial pool");

        // Nothing fancy going on here, just boring old state updates
        betKinds[betId] = kind;
        betOwners[betId] = sender;
        betTokens[betId] = IERC20(token);
        betCommissions[betId] = commission;
        betCommissionDenominator[betId] = commissionDenominator;
        betDeadlines[betId] = deadline;
        betSchedules[betId] = schedule;
        betResults[betId] = results;

        /* By adding the initial pool to the bet creator's, but not associating it with any results,
        we allow the creator to incentivize people to participate. */
        userPools[betId][sender] += initialPool;
        betPools[betId] = initialPool;

        for (uint i = 0; i < results.length; i++) {
            resultPools[betId][results[i]] += initialPool / results.length;
            resultTransfers[betId][results[i]] += initialPool / results.length;
        }

        // Bet creation should succeed from this point onward
        createdBets[betId] = true;

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
            cost += resultPools[betId][betResults[betId][i]] ** 2;
        }
        return sqrt(cost);
    }

    function calculatePrice(string calldata betId, string calldata result) public view returns (uint256 nominator, uint256 denominator) {
        return (resultPools[betId][result], calculateCost(betId));
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

        bool success = token.transferFrom(sender, address(this), total);

        require(success, "Error transferring funds to contract while placing bet.");

        emit PlacedBets(sender, betId, betId, results);
    }

    function _claimBet(string memory betId, address sender, string memory result) private {
        // Does the user have any pending buys?
        uint256 pending = pendingBuys[betId][sender];
        if (pending != 0) {
            pendingBuys[betId][sender] = 0;
            betTokens[betId].transfer(sender, pending);
        }
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
        bool success = token.transfer(sender, reward);
        require(success, "Failed to transfer reward to user.");
        success = token.transfer(betOwners[betId], ownerFee);
        require(success, "Failed to transfer commission to bet owner.");
    }

    function calculateContractCommission(uint256, string[] calldata, uint256[] calldata) pure public returns (uint256) {
        return 0;
    }

    enum OrderType {BUY, SELL}

    mapping(string => Order[]) public orders;
    mapping(string => mapping(address => uint256)) public pendingBuys;
    mapping(string => mapping(address => mapping(string => uint256))) public pendingSells;

    function addOrder(address sender, string calldata betId, Order memory order) internal {
        require(order.amount != 0, "Invalid new order state");
        // If before pool lockout, should be able to simply place a bet
        if (betDeadlines[betId] >= block.timestamp && order.orderType == OrderType.BUY) {
            uint[] memory amounts = new uint[](1);
            amounts[0] = order.amount;
            string[] memory results = new string[](1);
            results[0] = order.result;
            _placeBets(betId, sender, results, amounts);
            return;
        }

        if (order.orderType == OrderType.BUY) {
            uint transferAmount = (order.amount * order.ratioNumerator) / order.ratioDenominator;
            pendingBuys[betId][sender] += transferAmount;
            betTokens[betId].transferFrom(sender, address(this), transferAmount);
        } else if (order.orderType == OrderType.SELL) {
            pendingSells[betId][sender][order.result] += order.amount;
            require(pendingSells[betId][sender][order.result] <= userBets[betId][sender][order.result], "Exceeded valid sell amount when adding order");
        }
        orders[betId].push(order);
    }

    function changeOrder(address sender, uint[] calldata orderAmounts, uint[] calldata numerators, uint[] calldata denominators, string calldata betId, string[] calldata results, uint256[] calldata ids) public {
        require(ids.length == orderAmounts.length && ids.length == numerators.length && ids.length == denominators.length && ids.length == results.length, "Invalid change order");
        for (uint i = 0; i < ids.length; i++) {
            Order storage order = orders[betId][i];
            require(order.user == sender, "User did not create specified order");

            if (order.orderType == OrderType.BUY) {
                uint256 newAmount = (orderAmounts[i] * numerators[i]) / denominators[i];
                uint256 previousAmount = (order.amount * order.ratioNumerator) / order.ratioDenominator;
                bool success = true;
                pendingBuys[betId][sender] -= previousAmount;
                pendingBuys[betId][sender] += newAmount;
                if (newAmount > previousAmount) {
                    success = betTokens[betId].transferFrom(sender, address(this), newAmount - previousAmount);
                } else if (newAmount < previousAmount) {
                    success = betTokens[betId].transfer(sender, previousAmount - newAmount);
                }
                require(success, "Failed token transfer after updating amounts");
            } else if (order.orderType == OrderType.SELL) {
                pendingSells[betId][sender][order.result] -= order.amount;
                pendingSells[betId][sender][results[i]] += orderAmounts[i];
                require(pendingSells[betId][sender][results[i]] <= userBets[betId][sender][results[i]], "Exceeded valid sell amount when changing order");
            }
            order.result = results[i];
            order.amount = orderAmounts[i];
            order.ratioDenominator = denominators[i];
            order.ratioNumerator = numerators[i];
        }
    }

    function getOrders(string calldata betId, uint256 start, uint256 amount) public view returns (Order[] memory) {
        Order[] memory list;
        if (start > orders[betId].length) {
            return list;
        }
        if (orders[betId].length - start > amount) {
            list = new Order[](amount);
        } else {
            list = new Order[](orders[betId].length - start);
        }
        for (uint i = 0; i < list.length; i++) {
            list[i] = orders[betId][i + start];
        }
        return list;
    }

    function fillOrder(address sender, uint[] calldata orderAmounts, uint[] calldata numerators, uint[] calldata denominators, OrderType[] calldata orderTypes, string calldata betId, string[] calldata results, uint[][] calldata idxs) public {

        for (uint r = 0; r < results.length; r++) {
            string calldata result = results[r];
            uint orderAmount = orderAmounts[r];
            uint numerator = numerators[r];
            uint denominator = denominators[r];
            uint[] calldata indexes = idxs[r];
            OrderType orderType = orderTypes[r];
            for (uint i = 0; i < indexes.length && orderAmount != 0; i++) {
                uint index = indexes[i];
                Order storage matchedOrder = orders[betId][index];

                require(
                    matchedOrder.orderType != orderType
                    && matchedOrder.amount > 0
                    && orderType == OrderType.BUY
                        ? numerator * matchedOrder.ratioDenominator >= matchedOrder.ratioNumerator * denominator
                        : numerator * matchedOrder.ratioDenominator <= matchedOrder.ratioNumerator * denominator
                    && keccak256(bytes(matchedOrder.result)) == keccak256(bytes(result)),
                    "Invalid matching order state"
                );

                uint shareAmount = matchedOrder.amount < orderAmount ? matchedOrder.amount : orderAmount;

                orderAmount -= shareAmount;
                matchedOrder.amount -= shareAmount;

                address seller = orderType == OrderType.BUY ? matchedOrder.user : sender;
                address buyer = orderType == OrderType.BUY ? sender : matchedOrder.user;

                uint transferAmount = (shareAmount * numerator) / denominator;

                userPools[betId][buyer] += shareAmount;
                userBets[betId][buyer][result] += shareAmount;

                userPools[betId][seller] -= shareAmount;
                userBets[betId][seller][result] -= shareAmount;

                userTransfers[betId][seller][result] -= int(transferAmount);
                userTransfers[betId][buyer][result] += int(transferAmount);

                if (orderType == OrderType.BUY) {
                    require(pendingSells[betId][seller][result] >= shareAmount, "Seller does not have enough shares to complete buy order");
                    require(
                        betTokens[betId].transferFrom(buyer, address(this), transferAmount),
                        "Error while transferring tokens from buyer for matching order"
                    );
                    pendingSells[betId][seller][result] -= shareAmount;
                } else if (orderType == OrderType.SELL) {
                    require(pendingBuys[betId][buyer] >= transferAmount, "Buyer does not have enough tokens to complete sell order");
                    pendingBuys[betId][buyer] -= transferAmount;
                }

                require(
                    betTokens[betId].transfer(seller, transferAmount),
                    "Error while transferring tokens for matching order"
                );
            }
            if (orderAmount != 0) {
                Order memory newOrder = Order({
                    orderType: orderType,
                    ratioNumerator: numerator,
                    ratioDenominator: denominator,
                    result: result,
                    amount: orderAmount,
                    user: sender
                });
                addOrder(sender, betId, newOrder);
            }
        }
    }

    struct Order {
        OrderType orderType;
        uint ratioNumerator;
        uint ratioDenominator;
        string result;
        uint amount;
        address user;
    }
}