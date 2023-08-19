import "./GambethInterface.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GambethOptimisticOracle is GambethInterface {

    OptimisticOracleV2Interface oo = OptimisticOracleV2Interface(0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884);
    bytes32 priceIdentifier = bytes32("NUMERICAL");
    mapping(string => uint256) public betRequestTimes;

    function calculateContractCommission(uint256 total, string[] calldata results, uint256[] calldata amounts) override public returns (uint256) {
        return 0;
    }

    function getResult(string calldata betId) override public returns (string memory) {
        return Strings.toString(getSettledData(betId) / 1e18);
    }

    modifier validateClaimedBet(string calldata betId) override {
        bool betExpired = betSchedules[betId] + BET_THRESHOLD < block.timestamp;
        // If the bet has not finished but its threshold has been reached, let the user get back their funds
        require(
            (finishedBets[betId] || betExpired)
            && !claimedBets[betId][msg.sender]
            && userPools[betId][msg.sender] != 0,
            "Invalid bet state while claiming reward."
        );
        _;
    }

    // Fetch the resolved price from the Optimistic Oracle that was settled.
    function getSettledData(string calldata betId) public view returns (int256) {
        require(oo.hasPrice(address(this), priceIdentifier, betRequestTimes[betId], bytes(queries[betId])));
        return oo.getRequest(address(this), priceIdentifier, betRequestTimes[betId], bytes(queries[betId])).resolvedPrice;
    }

    function createOptimisticOracleBet(address currency, string memory betId, uint64 deadline, uint64 schedule, uint256 commission, uint256 minimum, uint256 initialPool, string calldata description) public payable {
        require(
            bytes(betId).length > 0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule // Users should only be able to place bets before it is actually executed
            && !createdBets[betId], // Can't have duplicate bets
            "Unable to create bet, check arguments."
        );
        queries[betId] = description;
        createBet(msg.sender, currency, betId, commission, deadline, schedule, minimum, initialPool);
        emit CreatedBet(betId, initialPool, description);
    }

    // Submit a data request to the Optimistic oracle.
    function requestOptimisticOracleDecision(string calldata betId) public {
        betRequestTimes[betId] = block.timestamp; // Set the request time to the current block time.
        IERC20 bondCurrency = betTokens[betId]; // Use Görli WETH as the bond currency.
        uint256 reward = 0; // Set the reward to 0 (so we dont have to fund it from this contract).

        // Now, make the price request to the Optimistic oracle and set the liveness to 30 so it will settle quickly.
        oo.requestPrice(priceIdentifier, betRequestTimes[betId], bytes(queries[betId]), bondCurrency, reward);
        oo.setCustomLiveness(priceIdentifier, betRequestTimes[betId], bytes(queries[betId]), 30);
    }
}