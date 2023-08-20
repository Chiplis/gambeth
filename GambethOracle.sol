pragma solidity 0.8.20;

import "./GambethState.sol";

abstract contract GambethOracle {

    GambethState state = GambethState(address(0x0));

    function getResult(bytes32 betId) public virtual returns (string memory);

    modifier validateClaimedBet(bytes32 betId) virtual;

    function claimBet(bytes32 betId) validateClaimedBet(betId) public {
        state.claimBet(betId, getResult(betId));
    }

    function setState(address newState) public ownerOnly {
        state = GambethState(newState);
    }

    modifier ownerOnly() {
        require(msg.sender == contractCreator);
        _;
    }

    function placeBets(bytes32 betId, string[] calldata results, uint256[] calldata amounts) public {
        state.placeBets(betId, results, amounts);
    }

    address contractCreator;

    constructor() payable {
        contractCreator = msg.sender;
    }
}