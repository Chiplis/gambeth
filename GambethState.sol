pragma solidity 0.8.20;

import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";

contract GambethState {

    constructor() {
        contractCreator = msg.sender;
        approvedTokens[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = true;
        approvedContracts[0x24D9A48c6F2464B9DAa9bC550F17F6520055991b] = true;
        tokenDecimals[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = 1e6;
    }

    enum BetKind {
        OPTIMISTIC_ORACLE,
        HUMAN
    }

    mapping(bytes32 => BetKind) public betKinds;
    address contractCreator;
    mapping(address => bool) public approvedContracts;
    mapping(address => uint256) public tokenDecimals;
    // For each bet, track which users have already claimed their potential reward
    mapping(bytes32 => mapping(address => bool)) public claimedBets;

    mapping(bytes32 => uint256) public betCommissionDenominator;

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
    mapping(bytes32 => IERC20) public betTokens;

    /* There are two different dates associated with each created bet:
    one for the deadline where a user can no longer place new bets,
    and another one that tells the smart oracle contract when to actually
    run. */
    mapping(bytes32 => uint64) public betDeadlines;
    mapping(bytes32 => uint64) public betSchedules;

    // Keep track of all createdBets to prevent duplicates
    mapping(bytes32 => bool) public createdBets;

    // Keep track of all owners to handle commission fees
    mapping(bytes32 => address) public betOwners;
    mapping(bytes32 => uint256) public betCommissions;

    // For each bet, how much each has each user put into that bet's pool?
    mapping(bytes32 => mapping(address => uint256)) public userPools;

    // What is the total pooled per bet?
    mapping(bytes32 => uint256) public betPools;

    /* Contains all the information that does not need to be saved as a state variable,
    but which can prove useful to people taking a look at the bet in the frontend. */
    event CreatedBet(bytes32 indexed _id, uint256 initialPool, string description);

    // For each bet, how much is the total pooled per result?
    mapping(bytes32 => mapping(string => uint256)) public resultPools;

    // For each bet, track how much each user has put into each result
    mapping(bytes32 => mapping(address => mapping(string => uint256))) public userBets;

    // The table representing each bet's pool is populated according to these events.
    event PlacedBets(address indexed user, bytes32 indexed _id, bytes32 id, string[] results);

    modifier ownerOnly() {
        require(msg.sender == contractCreator);
        _;
    }

    modifier approvedContractOnly {
        require(approvedContracts[msg.sender], "Contract not approved to call function");
        _;
    }

    function manageContract(address c, bool approved) public ownerOnly {
        approvedContracts[c] = approved;
    }

    function manageToken(address token, uint256 decimals, bool approved) ownerOnly public {
        approvedTokens[token] = approved;
        tokenDecimals[token] = decimals;
    }

    function createBet(BetKind kind, address sender, address token, bytes32 betId, uint256 commissionDenominator, uint256 commission, uint64 deadline, uint64 schedule, uint256 initialPool, string calldata query)
    approvedContractOnly public {
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

        /* By adding the initial pool to the bet creator's, but not associating it with any results,
        we allow the creator to incentivize people to participate. */
        userPools[betId][sender] += initialPool;
        betPools[betId] = initialPool;

        // Bet creation should succeed from this point onward
        createdBets[betId] = true;

        emit CreatedBet(betId, initialPool, query);
    }

    function placeBets(bytes32 betId, address sender, string[] memory results, uint256[] memory amounts)
    approvedContractOnly public {
        require(
            results.length > 0
            && results.length == amounts.length
            && createdBets[betId]
            && betDeadlines[betId] >= block.timestamp,
            "Unable to place bets, check arguments."
        );

        IERC20 token = betTokens[betId];
        uint256 total = 0;
        for (uint i = 0; i < results.length; i++) {
            // By not allowing anyone to bet on an empty string bets can be refunded if an error happens.
            total += amounts[i];
            require(bytes(results[i]).length > 0 && amounts[i] > 0,
                "Attempted to place invalid bet, check amounts and results"
            );

            // Update all required state
            resultPools[betId][results[i]] += amounts[i];
            userPools[betId][sender] += amounts[i];
            betPools[betId] += amounts[i];
            userBets[betId][sender][results[i]] += amounts[i];
        }

        bool success = token.transferFrom(sender, address(this), total);

        require(success, "Error transferring funds to contract while placing bet.");

        emit PlacedBets(sender, betId, betId, results);
    }

    function claimBet(bytes32 betId, address sender, string memory result)
    approvedContractOnly public {
        // Did the user bet on the correct result?
        uint256 userBet = userBets[betId][sender][result];

        // How much did everyone pool into the correct result?
        uint256 winnerPool = resultPools[betId][result];

        if (claimedBets[betId][sender] || (userBet == 0 && winnerPool != 0)) {
            return;
        }

        claimedBets[betId][sender] = true;

        uint256 reward = 0;
        if (userBet == 0) {
            emit UnwonBet(sender);
        } else {
            // User won the bet and receives their corresponding share of the loser's pool
            uint256 loserPool = betPools[betId] - winnerPool;
            // User gets their corresponding fraction of the loser's pool, along with their original bet
            reward = loserPool / (winnerPool / userBet);
            emit WonBet(sender, reward + userBet);
        }

        // Bet owner gets their commission
        uint256 ownerFee = (reward / betCommissionDenominator[betId]) * betCommissions[betId];
        reward -= ownerFee;
        // Guarantee owner's take never makes the winner lose money
        reward += userBet;
        IERC20 token = betTokens[betId];
        bool success = token.transfer(sender, reward);
        require(success, "Failed to transfer reward to user.");
        success = token.transfer(betOwners[betId], ownerFee);
        require(success, "Failed to transfer commission to bet owner.");
    }

    function calculateContractCommission(uint256, string[] calldata, uint256[] calldata) pure public returns (uint256) {
        return 0;
    }

    enum OrderType { BUY, SELL }

    mapping(bytes32 => Order[]) public orders;

    function addOrder(address sender, bytes32 betId, Order memory order) internal {
        require(order.amount != 0, "Invalid new order state");
        // If before pool lockout, should be able to simply place a bet
        if (betDeadlines[betId] >= block.timestamp && order.orderType == OrderType.BUY) {
            uint[] memory amounts = new uint[](1);
            amounts[0] = order.amount;
            string[] memory results = new string[](1);
            results[0] = order.result;
            placeBets(betId, sender, results, amounts);
        } else {
            orders[betId].push(order);
        }
    }

    function fillOrder(address sender, uint[] calldata orderAmounts, uint[] calldata numerators, uint[] calldata denominators, OrderType orderType, bytes32 betId, string[] calldata results, uint[][] calldata idxs) approvedContractOnly public {

        for (uint r = 0; r < results.length; r++) {
            string calldata result = results[r];
            uint orderAmount = orderAmounts[r];
            uint numerator = numerators[r];
            uint denominator = denominators[r];
            uint[] calldata indexes = idxs[r];
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

                userPools[betId][buyer] += shareAmount;
                userBets[betId][buyer][result] += shareAmount;

                userPools[betId][seller] -= shareAmount;
                userBets[betId][seller][result] -= shareAmount;

                uint transferAmount = (shareAmount * numerator) / denominator;

                require(
                    betTokens[betId].transferFrom(buyer, address(this), transferAmount)
                    && betTokens[betId].transfer(seller, transferAmount),
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