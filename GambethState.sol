import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/interfaces/OptimisticOracleV2Interface.sol";

contract GambethState {

    constructor() {
        contractCreator = msg.sender;
        approvedContracts[0xD41f39c42EA095c0bC0539CEfeD2867D8a5f71Bf] = true;
        approvedContracts[0x03Df3D511f18c8F49997d2720d3c33EBCd399e77] = true;
        approvedTokens[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = true;
        tokenDecimals[0x07865c6E87B9F70255377e024ace6630C1Eaa37F] = 1e6;
    }

    enum BetKind {
        OO,
        HUMAN,
        PROVABLE
    }

    mapping(bytes32 => BetKind) public betKinds;
    address contractCreator;
    mapping(address => bool) approvedContracts;
    mapping(address => uint256) public tokenDecimals;
    // For each bet, track which users have already claimed their potential reward
    mapping(bytes32 => mapping(address => bool)) public claimedBets;

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

    mapping(address => bool) approvedTokens;
    mapping(bytes32 => IERC20) public betTokens;

    /* There are two different dates associated with each created bet:
    one for the deadline where a user can no longer place new bets,
    and another one that tells the smart oracle contract when to actually
    run. */
    mapping(bytes32 => uint64) public betDeadlines;
    mapping(bytes32 => uint64) public betSchedules;

    // Custom minimum entry for each bet, set by their creator
    mapping(bytes32 => uint256) public betMinimums;

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

    function createBet(BetKind kind, address sender, address token, bytes32 betId, uint256 commission, uint64 deadline, uint64 schedule, uint256 minimum, uint256 initialPool, string calldata description)
    approvedContractOnly public {
        require(approvedTokens[token] && !createdBets[betId], "Unapproved token for creating bets");
        bool success = IERC20(token).transferFrom(sender, address(this), initialPool);
        require(success, "Not enough balance for initial pool");

        // Nothing fancy going on here, just boring old state updates
        betKinds[betId] = kind;
        betOwners[betId] = sender;
        betTokens[betId] = IERC20(token);
        betCommissions[betId] = commission;
        betDeadlines[betId] = deadline;
        betSchedules[betId] = schedule;
        betMinimums[betId] = minimum;

        /* By adding the initial pool to the bet creator's, but not associating it with any results,
        we allow the creator to incentivize people to participate. */
        userPools[betId][sender] += initialPool;
        betPools[betId] = initialPool;

        // Bet creation should succeed from this point onward
        createdBets[betId] = true;

        emit CreatedBet(betId, initialPool, description);
    }

    function placeBets(bytes32 betId, address sender, string[] calldata results, uint256[] calldata amounts)
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
            require(bytes(results[i]).length > 0 && amounts[i] >= betMinimums[betId],
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
        require(!claimedBets[betId][sender] && userPools[betId][sender] != 0, "Unable to claim bet");

        claimedBets[betId][sender] = true;

        // Did the user bet on the correct result?
        uint256 userBet = userBets[betId][sender][result];

        // How much did everyone pool into the correct result?
        uint256 winnerPool = resultPools[betId][result];

        uint256 reward = 0;
        if (winnerPool == 0) {
            emit UnwonBet(sender);
            // If no one won then all bets are refunded
            if (betKinds[betId] == BetKind.PROVABLE) {
                reward = userPools[betId][sender];
            } else {
                return;
            }
        } else if (userBet != 0) {
            // User won the bet and receives their corresponding share of the loser's pool
            uint256 loserPool = betPools[betId] - winnerPool;
            // User gets their corresponding fraction of the loser's pool, along with their original bet
            reward = loserPool / (winnerPool / userBet) + userBet;
            emit WonBet(sender, reward);
        } else {
            // Sad violin noises
            emit LostBet(sender);
            return;
        }

        // Bet owner gets their commission
        uint256 ownerFee = reward / 100 * betCommissions[betId];
        reward -= ownerFee;
        IERC20 token = betTokens[betId];
        bool success = token.transfer(sender, reward);
        require(success, "Failed to transfer reward to user.");
        success = token.transfer(betOwners[betId], ownerFee);
        require(success, "Failed to transfer commission to bet owner.");
    }

    function calculateContractCommission(uint256, string[] calldata, uint256[] calldata) pure public returns (uint256) {
        return 0;
    }
}