import "./GambethOracle.sol";
import "https://github.com/provable-things/ethereum-api/blob/master/provableAPI.sol";

contract GambethProvableOracle is GambethOracle, usingProvable {

    mapping(bytes32 => string) public betResults;
    mapping(bytes32 => string) public betTypes;
    mapping(bytes32 => bytes32) public queryBets;
    mapping(bytes32 => bool) public finishedBets;

    // Queries can't be scheduled more than 60 days in the future
    uint64 constant public SCHEDULE_THRESHOLD = 60 * 24 * 60 * 60;
    // So we use recursive queries that get continuously rescheduled until the deadline
    uint64 constant public NEXT_SCHEDULE = (SCHEDULE_THRESHOLD / 100) * 95;

    /* To help people avoid overpaying for the oracle contract querying service,
    its last price is saved and then suggested in the frontend. */
    mapping(bytes32 => uint256) public lastQueryPrice;

    /* Provable's API requires some initial funds to cover the cost of the query.
    If they are not enough to pay for it, the user should be informed and their funds returned. */
    event LackingFunds(address indexed sender, uint256 funds);

    function getResult(bytes32 betId) override view public returns (string memory) {
        return betResults[betId];
    }

    // Function executed by Provable's oracle when the bet is scheduled to run
    function __callback(bytes32 queryId, string memory result) public {
        bytes32 betId = queryBets[queryId];

        /* Callback is sometimes executed twice,  so we add an additional check
        to make sure state is only modified the first time. */
        require(msg.sender == provable_cbAddress() && !finishedBets[betId]);

        // Recursive query required since scheduled execution is after 60 day max threshold
        if (state.marketDeadline(betId) > block.timestamp) {
            uint256 nextSchedule = state.marketDeadline(betId);
            if (nextSchedule > block.timestamp + SCHEDULE_THRESHOLD) {
                nextSchedule = block.timestamp + NEXT_SCHEDULE;
            }

            bytes32 nextQueryId = provable_query(nextSchedule, betTypes[betId], state.marketQuery(betId));
            queryBets[nextQueryId] = betId;
            return;
        }

        betResults[betId] = result;
        finishedBets[betId] = true;
    }

    modifier validateClaimedBet(bytes32 betId) override {
        // If the bet has not finished but its threshold has been reached, let the user get back their funds
        bool betExpired = state.marketDeadline(betId) + state.BET_THRESHOLD() < block.timestamp;
        require(
            finishedBets[betId] || betExpired,
            "Invalid bet state while claiming reward."
        );
        _;
    }

    function createProvableBet(address currency, uint64 deadline, uint64 schedule, uint256 commission, uint256 minimum, uint256 initialPool, bytes32 betType, bytes32 betId, string memory query) public payable {

        require(
            betId != 0x0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule, // Users should only be able to place bets before it is actually executed
            "Unable to Create market, check arguments."
        );

        lastQueryPrice[betType] = provable_getPrice(string(abi.encodePacked(betType)));
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

        betTypes[betId] = string(abi.encodePacked(betType));
        state.setQuery(betId, query);
        queryBets[provable_query(querySchedule, string(abi.encodePacked(betType)), query)] = betId;

        state.createBet(GambethState.BetKind.PROVABLE, msg.sender, currency, betId, commission, deadline, schedule, minimum, initialPool, query);
    }


    event DescribedProvableBet(bytes32 indexed betId, string description);
    function describeProvableBet(bytes32 betId, string calldata description) public {
        emit DescribedProvableBet(betId, description);
    }

    function oracleMultiplier(uint256 schedule) public view returns (uint256) {
        // The farther in the future the query is scheduled, the more we should allocate for the oracle to run
        return (schedule - block.timestamp) / SCHEDULE_THRESHOLD + 2;
    }
}