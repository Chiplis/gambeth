import "./GambethOracle.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol";

contract GambethOptimisticOracle is GambethOracle {

    address ooAddress = 0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884;
    OptimisticOracleV2Interface oo = OptimisticOracleV2Interface(ooAddress);
    bytes32 priceIdentifier = bytes32("NUMERICAL");
    mapping(bytes32 => uint256) public betRequestTimes;

    function getResult(bytes32 betId) override public view returns (string memory) {
        return Strings.toString(getSettledData(betId) / 1e18);
    }

    modifier validateClaimedBet(bytes32 betId) override {
        bool betExpired = state.betSchedules(betId) + state.BET_THRESHOLD() < block.timestamp;
        bool hasPrice = oo.hasPrice(address(this), priceIdentifier, betRequestTimes[betId], bytes(state.betQueries(betId)));
        // If the bet has not finished but its threshold has been reached, let the user get back their funds
        require(
            (hasPrice || betExpired),
            "Invalid bet state while claiming reward."
        );
        _;
    }

    // Fetch the resolved price from the Optimistic Oracle that was settled.
    function getSettledData(bytes32 betId) public view returns (int256) {
        require(oo.hasPrice(address(this), priceIdentifier, betRequestTimes[betId], bytes(state.betQueries(betId))));
        return oo.getRequest(address(this), priceIdentifier, betRequestTimes[betId], bytes(state.betQueries(betId))).resolvedPrice;
    }

    function createOptimisticBet(address currency, bytes32 betId, uint64 deadline, uint64 schedule, uint256 commission, uint256 minimum, uint256 initialPool, string calldata query) public {
        require(
            betId != 0x0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule // Users should only be able to place bets before it is actually executed
            && !state.createdBets(betId), // Can't have duplicate bets
            "Unable to create bet, check arguments."
        );
        state.createBet(GambethState.BetKind.OO, msg.sender, currency, betId, commission, deadline, schedule, minimum, initialPool, query);
        state.setQuery(betId, query);
    }

    // Submit a data request to the Optimistic oracle.
    function requestOptimisticOracleDecision(bytes32 betId) public {
        require(state.betSchedules(betId) <= block.timestamp, "Bet still not scheduled to run");
        betRequestTimes[betId] = block.timestamp; // Set the request time to the current block time.
        IERC20 bondCurrency = state.betTokens(betId); // Use Görli WETH as the bond currency.
        uint256 reward = 0; // Set the reward to 0 (so we dont have to fund it from this contract).

        // Now, make the price request to the Optimistic oracle and set the liveness to 30 so it will settle quickly.
        oo.requestPrice(priceIdentifier, betRequestTimes[betId], bytes(state.betQueries(betId)), bondCurrency, reward);
        oo.setCustomLiveness(priceIdentifier, betRequestTimes[betId], bytes(state.betQueries(betId)), 30);
    }

    function approveToken(address token) ownerOnly public {
        IERC20(token).approve(ooAddress, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    }
}