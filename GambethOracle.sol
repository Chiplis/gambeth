pragma solidity 0.8.20;

import "./GambethState.sol";

abstract contract GambethOracle {

    GambethState state = GambethState(address(0x0));

    function getResult(string calldata betId) public virtual returns (string memory);

    modifier validateClaimedBet(string calldata betId) virtual;

    function claimBet(string calldata betId) validateClaimedBet(betId) public {
        state.claimBet(betId, getResult(betId));
    }

    function placeBets(string calldata betId, string[] calldata results, uint256[] calldata amounts) public {
        state.placeBets(betId, results, amounts);
    }
}