pragma solidity 0.8.20;

import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol";

abstract contract GambethInterface {

    address contractCreator;
    constructor() payable {
        contractCreator = msg.sender;
    }
    modifier ownerOnly() {
        require(msg.sender == contractCreator);
        _;
    }

    function manageToken(address token, bool approved) ownerOnly public {
        approvedTokens[token] = approved;
    }

    mapping(address => bool) approvedTokens;
    mapping(string => IERC20) betTokens;

    /* There are two different dates associated with each created bet:
    one for the deadline where a user can no longer place new bets,
    and another one that tells the smart oracle contract when to actually
    run. */
    mapping(string => uint64) public betDeadlines;
    mapping(string => uint64) public betSchedules;

    // Custom minimum entry for each bet, set by their creator
    mapping(string => uint256) public betMinimums;

    // Keep track of all createdBets to prevent duplicates
    mapping(string => bool) public createdBets;

    // Once a query is executed by the oracle, associate its ID with the bet's ID to handle updating the bet's state in __callback
    mapping(string => string) public queries;
    mapping(bytes32 => string) public queryBets;

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

    // The table representing each bet's pool is populated according to these events.
    event PlacedBets(address indexed user, string indexed _id, string id, string[] results);

    mapping(string => bool) public finishedBets;

    function createBet(address sender, address token, string memory betId, uint256 commission, uint64 deadline, uint64 schedule, uint256 minimum, uint256 initialPool) public {
        require(approvedTokens[token], "Unapproved token for creating bets");
        // Nothing fancy going on here, just boring old state updates
        betOwners[betId] = sender;
        betTokens[betId] = IERC20(token);
        betCommissions[betId] = commission;
        betDeadlines[betId] = deadline;
        betSchedules[betId] = schedule;
        betMinimums[betId] = minimum;

        /* By adding the initial pool to the bet creator's, but not associating it with any results,
        we allow the creator to incentivize people to participate. */
        userPools[betId][msg.sender] += initialPool;
        betPools[betId] = initialPool;

        // Bet creation should succeed from this point onward
        createdBets[betId] = true;
    }

    function placeBets(string calldata betId, string[] calldata results, uint256[] calldata amounts)
    public payable {
        require(
            results.length > 0
            && results.length == amounts.length
            && createdBets[betId]
            && !finishedBets[betId]
            && betDeadlines[betId] >= block.timestamp,
            "Unable to place bets, check arguments."
        );

        IERC20 token = betTokens[betId];
        uint256 total = 0;
        for (uint i = 0; i < results.length; i++) {
            // By not allowing anyone to bet on an empty string bets can be refunded if an error happens.
            total += amounts[i];
            require(bytes(results[i]).length > 0 && amounts[i] >= betMinimums[betId],
                "Attempted to place invalid bet, check amounts and results"
            );

            // Update all required state
            resultPools[betId][results[i]] += amounts[i];
            userPools[betId][msg.sender] += amounts[i];
            betPools[betId] += amounts[i];
            userBets[betId][msg.sender][results[i]] += amounts[i];
        }

        bool success = token.transferFrom(msg.sender, address(this), total + calculateContractCommission(total, results, amounts));

        require(success, "Error transferring funds to contract while placing bet.");

        emit PlacedBets(msg.sender, betId, betId, results);
    }

    function claimBet(string calldata betId)
    validateClaimedBet(betId) public {
        claimedBets[betId][msg.sender] = true;

        // What's the final result?
        string memory result = getResult(betId);

        // Did the user bet on the correct result?
        uint256 userBet = userBets[betId][msg.sender][result];

        // How much did everyone pool into the correct result?
        uint256 winnerPool = resultPools[betId][result];

        uint256 reward = 0;
        // If no one won then all bets are refunded
        if (winnerPool == 0) {
            emit UnwonBet(msg.sender);
            reward = userPools[betId][msg.sender];
        } else if (userBet != 0) {
            // User won the bet and receives their corresponding share of the loser's pool
            uint256 loserPool = betPools[betId] - winnerPool;
            emit WonBet(msg.sender, reward);
            // User gets their corresponding fraction of the loser's pool, along with their original bet
            reward = loserPool / (winnerPool / userBet) + userBet;
        } else {
            // Sad violin noises
            emit LostBet(msg.sender);
            return;
        }

        // Bet owner gets their commission
        uint256 ownerFee = reward / 100 * betCommissions[betId];
        reward -= ownerFee;
        IERC20 token = betTokens[betId];
        bool success = token.transfer(msg.sender, reward);
        require(success, "Failed to transfer reward to user.");
        success = token.transfer(betOwners[betId], ownerFee);
        require(success, "Failed to transfer commission to bet owner.");
    }

    // For each bet, track which users have already claimed their potential reward
    mapping(string => mapping(address => bool)) public claimedBets;

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
    after the bet creator's takes their cut. */
    event UnwonBet(address indexed refunded);

    function calculateContractCommission(uint256 total, string[] calldata results, uint256[] calldata amounts) public virtual returns (uint256);

    function getResult(string calldata betId) public virtual returns (string memory);

    modifier validateClaimedBet(string calldata betId) virtual;
}