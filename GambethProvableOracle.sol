import "./GambethOracle.sol";
import "https://github.com/provable-things/ethereum-api/blob/master/provableAPI.sol";

contract GambethProvableOracle is GambethOracle, usingProvable {

    mapping(string => string) public betResults;
    mapping(string => string) public betTypes;
    mapping(bytes32 => string) public queryBets;
    mapping(string => bool) public finishedBets;
    // Once a query is executed by the oracle, associate its ID with the bet's ID to handle updating the bet's state in __callback
    mapping(string => string) public queries;

    // Queries can't be scheduled more than 60 days in the future
    uint64 constant public SCHEDULE_THRESHOLD = 60 * 24 * 60 * 60;
    // So we use recursive queries that get continuously rescheduled until the deadline
    uint64 constant public NEXT_SCHEDULE = (SCHEDULE_THRESHOLD / 100) * 95;

    /* To help people avoid overpaying for the oracle contract querying service,
    its last price is saved and then suggested in the frontend. */
    mapping(string => uint256) public lastQueryPrice;

    /* Provable's API requires some initial funds to cover the cost of the query.
    If they are not enough to pay for it, the user should be informed and their funds returned. */
    event LackingFunds(address indexed sender, uint256 funds);

    function getResult(string calldata betId) override view public returns (string memory) {
        return betResults[betId];
    }

    // Function executed by Provable's oracle when the bet is scheduled to run
    function __callback(bytes32 queryId, string memory result) public {
        string memory betId = queryBets[queryId];

        /* Callback is sometimes executed twice,  so we add an additional check
        to make sure state is only modified the first time. */
        require(msg.sender == provable_cbAddress() && !finishedBets[betId]);

        // Recursive query required since scheduled execution is after 60 day max threshold
        if (state.betSchedules(betId) > block.timestamp) {
            uint256 nextSchedule = state.betSchedules(betId);
            if (nextSchedule > block.timestamp + SCHEDULE_THRESHOLD) {
                nextSchedule = block.timestamp + NEXT_SCHEDULE;
            }
            bytes32 nextQueryId = provable_query(nextSchedule, betTypes[betId], queries[betId]);
            queryBets[nextQueryId] = betId;
            return;
        }

        betResults[betId] = result;
        finishedBets[betId] = true;
    }

    modifier validateClaimedBet(string calldata betId) override {
        // If the bet has not finished but its threshold has been reached, let the user get back their funds
        bool betExpired = state.betSchedules(betId) + state.BET_THRESHOLD() < block.timestamp;
        require(
            finishedBets[betId] || betExpired,
            "Invalid bet state while claiming reward."
        );
        _;
    }

    function createProvableBet(address currency, string memory betType, string memory betId, string calldata query, uint64 deadline, uint64 schedule, uint256 commission, uint256 minimum, uint256 initialPool) public payable {

        require(
            bytes(betId).length > 0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule, // Users should only be able to place bets before it is actually executed
            "Unable to create bet, check arguments."
        );

        require(state.betTokens(betId).transferFrom(msg.sender, address(this), initialPool), "Not enough balance for initial pool");

        lastQueryPrice[betType] = provable_getPrice(betType);
        if (lastQueryPrice[betType] * oracleMultiplier(schedule) > msg.value) {
            emit LackingFunds(msg.sender, lastQueryPrice[betType] * oracleMultiplier(schedule));
            return;
        }

        /* Even though the oracle query is scheduled to run in the future,
        it immediately returns a query ID which we associate with the newly created bet. */
        uint256 querySchedule = schedule;
        if (schedule > block.timestamp + SCHEDULE_THRESHOLD) {
            querySchedule = block.timestamp + NEXT_SCHEDULE;
        }

        bytes32 queryId = provable_query(querySchedule, betType, query);
        betTypes[betId] = betType;
        queries[betId] = query;
        queryBets[queryId] = betId;

        state.createBet(GambethState.BetKind.PROVABLE, msg.sender, currency, betId, commission, deadline, schedule, minimum, initialPool);
    }

    function oracleMultiplier(uint256 schedule) public view returns (uint256) {
        // The farther in the future the query is scheduled, the more we should allocate for the oracle to run
        return (schedule - block.timestamp) / SCHEDULE_THRESHOLD + 2;
    }
}