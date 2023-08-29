pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "https://github.com/UMAprotocol/protocol/blob/master/packages/core/contracts/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol";
import "./GambethState.sol";

contract GambethOptimisticOracle is OptimisticRequester {

    address public contractOwner;
    GambethState public state = GambethState(address(0x5cF2974B18d6cE6bb67a8223318061515d7b6906));

    address public constant OO_ADDRESS = 0xA5B9d8a0B0Fa04Ba71BDD68069661ED5C0848884;
    OptimisticOracleV2Interface public oo = OptimisticOracleV2Interface(OO_ADDRESS);
    bytes32 public PRICE_ID = bytes32("NUMERICAL");

    mapping(bytes32 => uint256) public betRequestTimes;
    mapping(bytes32 => bool) public finishedBets;
    mapping(bytes32 => mapping(uint => string)) public betChoices;
    mapping(bytes32 => uint256) public betResults;
    mapping(bytes32 => mapping(uint256 => mapping(bytes => bytes32))) public requestBets;
    mapping(bytes32 => int256) public betProposals;
    mapping(bytes32 => mapping(bytes32 => bool)) public betQueries;
    mapping(bytes32 => address) public betRequester;

    event CreatedOptimisticBet(bytes32 indexed betId, string query);

    function createOptimisticBet(address currency, bytes32 betId, uint64 deadline, uint64 schedule, uint256 commissionDenominator, uint256 commission, uint256 initialPool, string[] memory results, string calldata query) public {
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
        state.createBet(GambethState.BetKind.OPTIMISTIC_ORACLE, msg.sender, currency, betId, commissionDenominator, commission, deadline, schedule, initialPool, query);
        emit CreatedOptimisticBet(betId, query);
    }

    function claimBet(bytes32 betId, string calldata query) public {
        require(betQueries[betId][keccak256(bytes(query))], "Invalid query for bet");
        bool hasPrice = oo.hasPrice(address(this), PRICE_ID, betRequestTimes[betId], bytes(query));
        bool betExpired = state.betSchedules(betId) + state.BET_THRESHOLD() < block.timestamp;

        if (!hasPrice) {
            require(betExpired, "Bet result not yet settled");
        }

        state.claimBet(betId, msg.sender, getResult(betId));
    }

    // Submit a data request to the Optimistic oracle.
    function requestBetResolution(bytes32 betId, string calldata query) public {
        require(betQueries[betId][keccak256(bytes(query))], "Invalid query for bet");
        require(state.betSchedules(betId) <= block.timestamp, "Bet still not scheduled to run");
        betRequestTimes[betId] = block.timestamp; // Set the request time to the current block time.
        IERC20 bondCurrency = state.betTokens(betId);
        uint256 reward = 0; // Set the reward to 0 (so we dont have to fund it from this contract).

        // Now, make the price request to the Optimistic oracle and set the liveness to 30 so it will settle quickly.
        oo.requestPrice(PRICE_ID, betRequestTimes[betId], bytes(query), bondCurrency, reward);
        oo.setEventBased(PRICE_ID, betRequestTimes[betId], bytes(query));
        oo.setCustomLiveness(PRICE_ID, betRequestTimes[betId], bytes(query), 30);
        oo.setCallbacks(PRICE_ID, betRequestTimes[betId], bytes(query), false, false, true);
        requestBets[PRICE_ID][betRequestTimes[betId]][bytes(query)] = betId;
        betRequester[betId] = msg.sender;
    }

    function getResult(bytes32 betId) public view returns (string memory) {
        if (!finishedBets[betId]) {
            return "";
        }
        return betChoices[betId][betResults[betId]];
    }

    function priceSettled(bytes32 identifier, uint256 timestamp, bytes calldata query, int256 price) public {
        bytes32 betId = requestBets[identifier][timestamp][query];
        betResults[betId] = uint(price) / 1e18;
        finishedBets[betId] = true;
        state.claimBet(betId, betRequester[betId], getResult(betId));
    }

    function fillOrder(uint[] calldata orderAmounts, uint[] calldata numerators, uint[] calldata denominators, GambethState.OrderType orderType, bytes32 betId, string[] calldata results, uint[][] calldata idxs) public {
        state.fillOrder(msg.sender, orderAmounts, numerators, denominators, orderType, betId, results, idxs);
    }

    function priceProposed(bytes32 identifier, uint256 timestamp, bytes calldata query) public {
    }

    function priceDisputed(bytes32 identifier, uint256 timestamp, bytes calldata data, uint256 refund) public {
    }

    modifier validateClaimedBet(bytes32 betId) {
        require(state.createdBets(betId), "Invalid bet state while claiming reward.");
        _;
    }

    function approveToken(address token) ownerOnly public {
        IERC20(token).approve(OO_ADDRESS, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    }

    function setState(address newState) public ownerOnly {
        state = GambethState(newState);
    }

    modifier ownerOnly() {
        require(msg.sender == contractOwner);
        _;
    }

    function placeBets(bytes32 betId, string[] calldata results, uint256[] calldata amounts) virtual public {
        state.placeBets(betId, msg.sender, results, amounts);
    }

    constructor() {
        contractOwner = msg.sender;
        approveToken(0x07865c6E87B9F70255377e024ace6630C1Eaa37F);
    }
}