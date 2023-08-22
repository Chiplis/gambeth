pragma solidity 0.8.20;

import "./GambethOracle.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol";

contract GambethOptimisticOracle is GambethOracle {

    address ooAddress = 0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884;
    OptimisticOracleV2Interface oo = OptimisticOracleV2Interface(ooAddress);
    bytes32 priceIdentifier = bytes32("NUMERICAL");
    mapping(bytes32 => uint256) public betRequestTimes;
    mapping(bytes32 => bool) public finishedBets;
    mapping(bytes32 => mapping(uint => string)) public betChoices;
    mapping(bytes32 => uint) public betResults;
    mapping(bytes32 => mapping(bytes32 => bool)) betQueries;

    function getResult(bytes32 betId) override public view returns (string memory) {
        if (!finishedBets[betId]) {
            return "";
        }
        return betChoices[betId][betResults[betId]];
    }

    modifier validateClaimedBet(bytes32 betId) override {
        require(state.createdBets(betId), "Invalid bet state while claiming reward.");
        _;
    }

    function createOptimisticBet(address currency, bytes32 betId, uint64 deadline, uint64 schedule, uint256 commission, uint256 minimum, uint256 initialPool, string[] memory results, string calldata query) public {
        require(
            betId != 0x0
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule // Users should only be able to place bets before it is actually executed
            && !state.createdBets(betId), // Can't have duplicate bets
            "Unable to create bet, check arguments."
        );
        for (uint i = 0; i < results.length; i++) {
            betChoices[betId][i] = results[i];
        }
        betQueries[betId][keccak256(bytes(query))] = true;
        state.createBet(GambethState.BetKind.OO, msg.sender, currency, betId, commission, deadline, schedule, minimum, initialPool, query);
        emit CreatedOptimisticBet(betId, query);
    }

    event CreatedOptimisticBet(bytes32 indexed betId, string query);

    function settleAndClaimBet(bytes32 betId, string calldata query) public {
        require(betQueries[betId][keccak256(bytes(query))], "Invalid query for bet");
        finishedBets[betId] = true;
        betResults[betId] = uint(oo.settleAndGetPrice(priceIdentifier, betRequestTimes[betId], bytes(query))) / 1e18;
        bool hasPrice = oo.hasPrice(address(this), priceIdentifier, betRequestTimes[betId], bytes(query));
        bool betExpired = state.betSchedules(betId) + state.BET_THRESHOLD() < block.timestamp;

        if (!hasPrice) {
            require(betExpired, "Bet result not yet settled");
        }

        claimBet(betId);
    }

    // Submit a data request to the Optimistic oracle.
    function decideBet(bytes32 betId, string calldata query) public {
        require(betQueries[betId][keccak256(bytes(query))], "Invalid query for bet");
        require(state.betSchedules(betId) <= block.timestamp, "Bet still not scheduled to run");
        betRequestTimes[betId] = block.timestamp; // Set the request time to the current block time.
        IERC20 bondCurrency = state.betTokens(betId);
        uint256 reward = 0; // Set the reward to 0 (so we dont have to fund it from this contract).

        // Now, make the price request to the Optimistic oracle and set the liveness to 30 so it will settle quickly.
        oo.requestPrice(priceIdentifier, betRequestTimes[betId], bytes(query), bondCurrency, reward);
        oo.setCustomLiveness(priceIdentifier, betRequestTimes[betId], bytes(query), 30);
    }

    function approveToken(address token) ownerOnly public {
        IERC20(token).approve(ooAddress, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    }
}