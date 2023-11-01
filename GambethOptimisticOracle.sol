pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";

contract GambethOptimisticOracle is OptimisticRequester {

    using SafeERC20 for IERC20;

    constructor() {
        contractCreator = msg.sender;
        approvedTokens[USDC] = true;
        IERC20(USDC).approve(OO_ADDRESS, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
        tokenDecimals[USDC] = 1e6;
        tokenFees[USDC] = 5e6;
    }

    modifier ownerOnly() {
        require(msg.sender == contractCreator);
        _;
    }

    struct Order {
        OrderPosition orderPosition;
        uint pricePerShare;
        string result;
        uint amount;
        address user;
        uint index;
    }

    enum OrderPosition {BUY, SELL}
    enum OrderType{MARKET, LIMIT}
    enum OrderStatus {FILLED, UNFILLED}
    enum BetKind { OPTIMISTIC_ORACLE, HUMAN}

    // If the user wins the bet, let them know along with the reward amount.
    event WonBet(address indexed winner, uint256 won);
    // If the user lost no funds are claimable.
    event LostBet(address indexed loser);
    /* If no one wins the bet the funds can be refunded to the user,
    after the bet's creator takes their cut. */
    event UnwonBet(address indexed refunded);
    /* Contains all the information that does not need to be saved as a state variable,
    but which can prove useful to people taking a look at the bet in the frontend. */
    event CreatedOptimisticBet(string indexed betIdIndexed, string betId, string title, string query, string request);
    // The table representing each bet's pool is populated according to these events.
    event PlacedBets(address indexed user, string indexed _id, string id, string[] results);

    /* If the oracle service's scheduled callback was not executed after 5 days,
    a user can reclaim his funds after the bet's execution threshold has passed. */
    uint64 constant public BET_THRESHOLD = 5 * 24 * 60 * 60;

    mapping(string => Order[]) public orders;
    mapping(string => mapping(address => uint256)) public pendingBuys;
    mapping(string => mapping(address => mapping(string => uint256))) public pendingSells;
    mapping(bytes32 => mapping(uint256 => mapping(bytes => string))) public marketOracleRequest;

    struct Market {
        string betId;
        bool created;
        bool finished;
        uint256 creation;
        uint256 outcomeIndex;
        BetKind kind;
        uint64 lockout;
        uint64 deadline;
        address owner;
        uint256 totalShares;
        string outcomes;
        string shares;
        uint64 resolution;
    }

    mapping(string => Market) public markets;

    mapping(address => uint256) public tokenDecimals;
    mapping(address => uint256) public tokenFees;

    // For each bet, track which users have already claimed their potential reward
    mapping(string => mapping(address => bool)) public claimedBets;
    mapping(address => bool) public approvedTokens;
    mapping(string => address) public betTokens;

    // For each bet, how much is the total pooled per result?
    mapping(string => mapping(string => uint256)) public resultPools;
    // For each bet, track how much each user has put into each result
    mapping(string => mapping(address => mapping(string => uint256))) public userPools;
    // Track token transfers
    mapping(string => mapping(address => mapping(string => int256))) public userTransfers;
    mapping(string => mapping(string => uint256)) public resultTransfers;
    mapping(string => string[]) public betResults;
    mapping(string => mapping(bytes32 => bool)) public marketRequest;

    address contractCreator;

    mapping(address => uint) public contractFees;

    address public constant OO_ADDRESS = 0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884;
    OptimisticOracleV2Interface public oo = OptimisticOracleV2Interface(OO_ADDRESS);
    bytes32 public PRICE_ID = bytes32("NUMERICAL");

    string oracleTitleHeader = "q: title: ";
    string oracleDescriptionHeader = ", description: ";
    string oracleDescriptionIntro = '"This is a Gambeth multiple choice market. It should only resolve to one of the following outcomes, propose the number corresponding to it: ';

    address USDC = 0x07865c6E87B9F70255377e024ace6630C1Eaa37F;

    function createOptimisticBet(address currency, string calldata betId, uint64 deadline, uint64 schedule, uint256 initialPool, string[] calldata results, uint256[] calldata ratios, string calldata title, string calldata query) public {
        Market storage market = markets[betId];
        require(
            bytes(betId).length != 0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule // Users should only be able to place bets before it is actually executed
            && !market.created // Can't have duplicate bets
        );
        _createBet(BetKind.OPTIMISTIC_ORACLE, msg.sender, currency, betId, deadline, schedule, initialPool, results, ratios);
        string memory request = performOracleRequest(betId, title, query);
        marketRequest[betId][keccak256(bytes(request))] = true;
        emit CreatedOptimisticBet(betId, betId, title, query, request);
    }

    function claimBet(string calldata betId, string calldata request) public {
        Market storage market = markets[betId];
        require(marketRequest[betId][keccak256(bytes(request))]);
        bool hasPrice = oo.hasPrice(address(this), PRICE_ID, market.creation, bytes(request));
        bool betExpired = market.deadline + BET_THRESHOLD < block.timestamp;

        if (!hasPrice) {
            require(betExpired);
        }

        _claimBet(betId, msg.sender, getResult(betId));
    }

    // Submit a data request to the Optimistic oracle.
    function performOracleRequest(string calldata betId, string calldata title, string calldata query) private returns (string memory) {
        Market storage market = markets[betId];
        // require(market.deadline <= block.timestamp, "Bet still not scheduled to run");
        market.creation = block.timestamp; // Set the request time to the current block time.
        IERC20 bondCurrency = IERC20(betTokens[betId]);
        uint256 reward = tokenFees[betTokens[betId]];
        string memory description = "";
        for (uint i = 0; i < betResults[betId].length; i++) {
            description = string.concat(description, "Propose ", Strings.toString(i), " for ", betResults[betId][i], ". ");
        }
        description = string.concat(
            description,
            "Propose ",
            Strings.toString(betResults[betId].length),
            " if none of the previous options are a valid outcome by the following date (UNIX timestamp): ",
            Strings.toString(market.lockout),
            ". "
        );

        string memory request = string.concat(
            oracleTitleHeader,
            title,
            oracleDescriptionHeader,
            oracleDescriptionIntro,
            description,
            query,
            '"'
        );

        bytes memory requestBytes = bytes(request);
        oo.requestPrice(PRICE_ID, market.creation, requestBytes, bondCurrency, reward);
        oo.setBond(PRICE_ID, market.creation, requestBytes, 1750 * 1e6);
        oo.setEventBased(PRICE_ID, market.creation, requestBytes);
        oo.setCustomLiveness(PRICE_ID, market.creation, requestBytes, 1);
        oo.setCallbacks(PRICE_ID, market.creation, requestBytes, false, false, true);
        marketOracleRequest[PRICE_ID][market.creation][requestBytes] = betId;
        return request;
    }

    function getResult(string memory betId) public view returns (string memory) {
        Market storage market = markets[betId];
        if (!market.finished) {
            return "";
        }
        return betResults[betId][market.outcomeIndex];
    }

    function changeOrder(uint[] calldata orderAmounts, uint[] calldata prices, string calldata betId, string[] calldata results, uint256[] calldata ids) public {
        require(!markets[betId].finished && markets[betId].created);
        _changeOrder(msg.sender, orderAmounts, prices, betId, results, ids);
    }

    function fillOrder(uint[] calldata orderAmounts, uint[] calldata prices, OrderPosition[] calldata orderPositions, string calldata betId, string[] calldata results, uint[][] calldata idxs) public {
        require(!markets[betId].finished && markets[betId].created && markets[betId].deadline > block.timestamp);
        _fillOrder(msg.sender, orderAmounts, prices, orderPositions, betId, results, idxs);
    }

    function priceSettled(bytes32 identifier, uint256 timestamp, bytes calldata query, int256 price) public {
        require(msg.sender == OO_ADDRESS);
        string memory betId = marketOracleRequest[identifier][timestamp][query];
        Market storage market = markets[betId];
        require(market.created && block.timestamp >= market.resolution);
        market.outcomeIndex = uint(price) / 1e18;
        market.finished = true;
    }

    function priceProposed(bytes32 identifier, uint256 timestamp, bytes calldata query) public {
    }

    function priceDisputed(bytes32 identifier, uint256 timestamp, bytes calldata data, uint256 refund) public {
    }

    function approveToken(address token) ownerOnly public {
        IERC20(token).approve(OO_ADDRESS, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    }

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

    function _createBet(BetKind kind, address sender, address token, string calldata betId, uint64 deadline, uint64 schedule, uint256 initialPool, string[] calldata results, uint256[] calldata ratios) internal {
        Market storage market = markets[betId];
        require(approvedTokens[token] && !market.created);
        require(results.length == ratios.length);
        uint totalRatio = 0;
        for (uint i = 0; i < ratios.length; i++) {
            totalRatio += ratios[i];
        }
        require(totalRatio == 100);
        IERC20(token).safeTransferFrom(sender, address(this), tokenFees[token]);

        // Nothing fancy going on here, just boring old state updates
        market.kind = kind;
        market.owner = sender;
        betTokens[betId] = token;
        market.lockout = deadline;
        market.deadline = schedule;
        market.betId = betId;
        betResults[betId] = results;
        market.outcomes = results[0];
        for (uint i = 1; i < results.length; i++) {
            market.outcomes = string.concat(
                market.outcomes,
                " || ",
                results[i]
            );
        }

        // Bet creation should succeed from this point onward
        market.created = true;

        uint256[] memory shares = new uint256[](results.length);
        for (uint i = 0; i < results.length; i++) {
            shares[i] = initialPool * ratios[i] / 100;
        }
        marketBuy(betId, sender, results, shares, false);
    }

    function sqrt(uint y) public pure returns (uint z) {
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
            cost += (resultPools[betId][betResults[betId][i]] * tokenDecimals[betTokens[betId]]) ** 2;
        }
        return sqrt(cost);
    }

    function calculateSharesForCost(string calldata betId, string memory result, uint p) internal view returns (uint) {
        return (sqrt(2 * p * calculateCost(betId) + resultPools[betId][result] ** 2 + p ** 2) - resultPools[betId][result]) / tokenDecimals[betTokens[betId]];
    }

    function calculateSharesForPricePerShare(string calldata betId, string memory result, uint256 p) internal view returns (int) {
        uint r = 0;
        string[] memory outcomes = getOutcomes(betId);
        for (uint i = 0; i < outcomes.length; i++) {
            r += (Strings.equal(outcomes[i], result) ? 0 : resultPools[betId][outcomes[i]]) ** 2;
        }
        return int(sqrt(r) * p / sqrt(1 * tokenDecimals[betTokens[betId]] ** 2 - p ** 2) - resultPools[betId][result]);
    }

    function marketSell(string calldata betId, address sender, string memory result, uint256 amount) private returns (bool) {
        Market storage market = markets[betId];
        uint total = 0;

        // Update all required state
        uint previousCost = calculateCost(betId);
        resultPools[betId][result] -= amount;
        uint sale = previousCost - calculateCost(betId);

        if (sale > resultTransfers[betId][result]) {
            sale = resultTransfers[betId][result];
        }

        if (sale == 0) {
            resultPools[betId][result] += amount;
            return false;
        }

        market.totalShares -= amount;
        userPools[betId][sender][result] -= amount;
        userTransfers[betId][sender][result] -= int(sale);
        total += sale;

        uint256 ownerFee = (total / COMMISSION_DENOMINATOR) * COMMISSION;
        total -= ownerFee;
        emit WonBet(sender, total);
        contractFees[betTokens[betId]] += ownerFee /= 2;
        IERC20(betTokens[betId]).safeTransfer(market.owner, ownerFee);
        IERC20(betTokens[betId]).safeTransfer(sender, total);

        updateShareString(market);

        return true;
    }

    uint public COMMISSION_DENOMINATOR = 0;
    uint public COMMISSION = 0;



    function marketBuy(string calldata betId, address sender, string[] memory results, uint256[] memory amounts, bool skipTransfer) private {
        Market storage market = markets[betId];

        require(
            results.length > 0
            && results.length == amounts.length
            && market.created
            && market.lockout >= block.timestamp
        );


        uint previousCost = calculateCost(betId);
        IERC20 token = IERC20(betTokens[betId]);
        for (uint i = 0; i < results.length; i++) {

            // By not allowing anyone to bet on an empty string bets can be refunded if an error happens.
            require(bytes(results[i]).length > 0);

            // Update all required state
            resultPools[betId][results[i]] += amounts[i];
            market.totalShares += amounts[i];
            userPools[betId][sender][results[i]] += amounts[i];
        }

        uint total = calculateCost(betId) - previousCost;
        uint sellTotal = 0;
        uint[] memory transfers = new uint[](results.length);
        for (uint i = 0; i < results.length; i++) {
            uint transfer = calculateCost(betId);
            resultPools[betId][results[i]] -= amounts[i];
            transfer -= calculateCost(betId);
            resultPools[betId][results[i]] += amounts[i];
            sellTotal += transfer;
            transfers[i] += transfer;
        }
        for (uint i = 0; i < results.length; i++) {
            uint transfer = transfers[i];
            userTransfers[betId][sender][results[i]] += int(transfer * total / sellTotal);
            resultTransfers[betId][results[i]] += transfer * total / sellTotal;
        }

        if (!skipTransfer) {
            token.safeTransferFrom(sender, address(this), total);
        }

        updateShareString(market);

        emit PlacedBets(sender, betId, betId, results);
    }

    function updateShareString(Market storage mkt) private {
        mkt.shares = Strings.toString(resultPools[mkt.betId][betResults[mkt.betId][0]]);
        for (uint i = 1; i < betResults[mkt.betId].length; i++) {
            mkt.shares = string.concat(
                mkt.shares,
                " || ",
                Strings.toString(resultPools[mkt.betId][betResults[mkt.betId][i]])
            );
        }
    }

    function _claimBet(string memory betId, address sender, string memory result) private {
        Market storage market = markets[betId];
        // Does the user have any pending buys?
        uint256 pending = pendingBuys[betId][sender];
        pendingBuys[betId][sender] = 0;
        IERC20(betTokens[betId]).safeTransfer(sender, pending);

        // Did the user bet on the correct result?
        uint256 userBet = userPools[betId][sender][result];

        // How much did everyone pool into the correct result?
        uint256 winnerPool = resultPools[betId][result];

        if (claimedBets[betId][sender] || (userBet == 0 && winnerPool != 0)) {
            return;
        }

        claimedBets[betId][sender] = true;

        uint256 reward = (calculateCost(betId) * userBet) / winnerPool;

        // Bet owner gets their commission
        int256 totalTransfers = userTransfers[betId][sender][result];
        uint256 ownerFee;
        if (totalTransfers >= 0 && uint(totalTransfers) >= reward) {
            ownerFee = 0;
        } else {
            ownerFee = (reward - (totalTransfers <= 0 ? 0 : uint(totalTransfers))) / COMMISSION_DENOMINATOR * COMMISSION;
        }
        reward -= ownerFee;
        emit WonBet(sender, reward);

        IERC20 token = IERC20(betTokens[betId]);
        token.safeTransfer(sender, reward);
        contractFees[betTokens[betId]] += ownerFee /= 2;
        token.safeTransfer(market.owner, ownerFee);
    }

    function withdrawUsdc(uint total) public ownerOnly {
        withdraw(total, USDC);
    }

    function withdraw(uint total, address token) public ownerOnly {
        require(contractFees[token] >= total);
        contractFees[token] -= total;
        IERC20(token).safeTransfer(msg.sender, total);
    }

    function placeOrder(address sender, string calldata betId, Order memory order, bool pushOrder) private {
        Market storage market = markets[betId];
        require(order.amount != 0);
        bool fromMarket = order.pricePerShare == 0;
        bool newOrder = order.index == orders[betId].length;

        // If before pool lockout, should always be able to buy from market
        if (market.lockout >= block.timestamp) {
            uint[] memory amounts = new uint[](1);
            string[] memory results = new string[](1);
            if (order.orderPosition == OrderPosition.BUY && (order.pricePerShare > calculatePrice(betId, order.result) || fromMarket)) {
                results[0] = order.result;
                amounts[0] = fromMarket ? order.amount : calculateSharesForPricePerShare(betId, order.result, order.pricePerShare) < 0 ? 0 : uint(calculateSharesForPricePerShare(betId, order.result, order.pricePerShare));
                amounts[0] = amounts[0] > order.amount ? order.amount : amounts[0];
                if (newOrder) {
                    order.amount -= amounts[0];
                } else {
                    orders[betId][order.index].amount -= amounts[0];
                }
                if (amounts[0] != 0) {
                    marketBuy(betId, sender, results, amounts, !fromMarket);
                }
            } else if (order.orderPosition == OrderPosition.SELL && fromMarket) {
                if (order.amount != 0) {
                    bool soldOnMarket = marketSell(betId, sender, order.result, order.amount);
                    if (newOrder) {
                        order.amount -= soldOnMarket ? order.amount : 0;
                        order.pricePerShare = soldOnMarket ? order.pricePerShare : calculatePrice(betId, order.result);
                    } else {
                        orders[betId][order.index].amount -= soldOnMarket ? order.amount : 0;
                        orders[betId][order.index].pricePerShare = soldOnMarket ? order.pricePerShare : calculatePrice(betId, order.result);
                    }
                }
            }
        }

        if (order.amount == 0 || !newOrder || order.pricePerShare == 0) {
            return;
        }

        if (order.orderPosition == OrderPosition.BUY) {
            uint transferAmount = order.amount * order.pricePerShare;
            pendingBuys[betId][sender] += transferAmount;
            IERC20(betTokens[betId]).safeTransferFrom(sender, address(this), transferAmount);
        } else if (order.orderPosition == OrderPosition.SELL) {
            pendingSells[betId][sender][order.result] += order.amount;
            require(pendingSells[betId][sender][order.result] <= userPools[betId][sender][order.result]);
        }

        if (pushOrder) {
            orders[betId].push(order);
        }
    }

    function calculatePrice(string calldata betId, string memory result) public view returns (uint256) {
        uint256 cost = calculateCost(betId);
        return resultPools[betId][result] * tokenDecimals[betTokens[betId]] ** 2 / (cost == 0 ? 1 : cost);
    }

    function _changeOrder(address sender, uint[] calldata orderAmounts, uint[] calldata prices, string calldata betId, string[] calldata results, uint256[] calldata ids) private {
        require(ids.length == orderAmounts.length && ids.length == prices.length && ids.length == results.length);
        for (uint i = 0; i < ids.length; i++) {
            Order storage order = orders[betId][ids[i]];
            require(order.user == sender);
            require(order.amount * order.pricePerShare > 0);
            if (order.orderPosition == OrderPosition.BUY) {
                uint256 newCost = orderAmounts[i] * prices[i];
                uint256 previousCost = order.amount * order.pricePerShare;
                pendingBuys[betId][sender] -= previousCost;
                pendingBuys[betId][sender] += newCost;
                if (newCost > previousCost) {
                    IERC20(betTokens[betId]).safeTransferFrom(sender, address(this), newCost - previousCost);
                } else if (newCost < previousCost) {
                    IERC20(betTokens[betId]).safeTransfer(sender, previousCost - newCost);
                }
            } else if (order.orderPosition == OrderPosition.SELL) {
                pendingSells[betId][sender][order.result] -= order.amount;
                pendingSells[betId][sender][results[i]] += orderAmounts[i];
                require(pendingSells[betId][sender][results[i]] <= userPools[betId][sender][results[i]]);
            }
            order.result = results[i];
            order.amount = orderAmounts[i];
            order.pricePerShare = prices[i];
            if (order.amount != 0) {
                placeOrder(sender, betId, order, true);
            }
        }
    }

    mapping(string => uint256) public orderStartIndexes;

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

    function _fillOrder(address sender, uint[] calldata orderAmounts, uint[] calldata prices, OrderPosition[] calldata orderPositions, string calldata betId, string[] calldata results, uint[][] calldata idxs) private {
        for (uint r = 0; r < results.length; r++) {
            uint[] calldata indexes = idxs[r];
            Order memory newOrder = Order({
                orderPosition: orderPositions[r],
                pricePerShare: prices[r],
                result: results[r],
                amount: orderAmounts[r],
                user: sender,
                index: orders[betId].length
            });
            bool ammOrder = newOrder.pricePerShare == 0;
            for (uint i = 0; i < indexes.length && newOrder.amount != 0; i++) {
                uint index = indexes[i];
                Order storage matchedOrder = orders[betId][index];

                if (matchedOrder.amount == 0) {
                    continue;
                }

                require(
                    matchedOrder.orderPosition != newOrder.orderPosition
                    && (ammOrder || (newOrder.orderPosition == OrderPosition.BUY
                        ? newOrder.pricePerShare >= matchedOrder.pricePerShare
                        : newOrder.pricePerShare <= matchedOrder.pricePerShare))
                    && keccak256(bytes(matchedOrder.result)) == keccak256(bytes(newOrder.result)),
                    "Invalid matching order state"
                );

                if (ammOrder) {
                    newOrder.pricePerShare = matchedOrder.pricePerShare;
                }

                placeOrder(sender, betId, newOrder, false);

                uint shareAmount = matchedOrder.amount < newOrder.amount ? matchedOrder.amount : newOrder.amount;

                newOrder.amount -= shareAmount;
                matchedOrder.amount -= shareAmount;

                address seller = newOrder.orderPosition == OrderPosition.BUY ? matchedOrder.user : sender;
                address buyer = newOrder.orderPosition == OrderPosition.BUY ? sender : matchedOrder.user;

                uint transferAmount = shareAmount * newOrder.pricePerShare;

                userPools[betId][buyer][newOrder.result] += shareAmount;
                userPools[betId][seller][newOrder.result] -= shareAmount;

                userTransfers[betId][seller][newOrder.result] -= int(transferAmount);
                userTransfers[betId][buyer][newOrder.result] += int(transferAmount);

                if (newOrder.orderPosition == OrderPosition.BUY) {
                    require(pendingSells[betId][seller][newOrder.result] >= shareAmount);
                    IERC20(betTokens[betId]).safeTransferFrom(buyer, address(this), transferAmount);
                    pendingSells[betId][seller][newOrder.result] -= shareAmount;
                } else if (newOrder.orderPosition == OrderPosition.SELL) {
                    require(pendingBuys[betId][buyer] >= transferAmount);
                    pendingBuys[betId][buyer] -= transferAmount;
                }
                IERC20(betTokens[betId]).safeTransfer(seller, transferAmount);
            }
            if (newOrder.amount != 0) {
                newOrder.pricePerShare = ammOrder ? 0 : newOrder.pricePerShare;
                placeOrder(sender, betId, newOrder, true);
            }
        }
    }
}