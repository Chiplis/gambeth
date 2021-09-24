// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.11;
pragma experimental ABIEncoderV2;

import "github.com/provable-things/ethereum-api/blob/master/provableAPI_0.6.sol";
    
contract WeiStakingByDecentralizedDegenerates is usingProvable {
    
    
    address payable owner;
    
    uint256 constant fixedCommission = 1e15 / 2;

    // Events are useful for the frontend to present information about each bet
    
    // Sender, required funds for Provable query
    event LackingFunds(address indexed, uint256);

    // Winner, amount won
    event WonBet(address indexed, uint256);

    // Loser
    event LostBet(address indexed);

    // Refunded user
    event UnwonBet(address indexed);

    // Creator, betId, betId, schedule, initialPool, description
    event CreatedBet(address indexed, string indexed, string, uint64, uint256, string);

    // User betting, betId, results, betId, results
    event PlacedBets(address indexed, string indexed, string[] indexed, string, string[]);

    constructor() public payable {
        owner = msg.sender;
    }
    
    // BetId -> Deadline to place new bets
    mapping(string => uint64) public betDeadlines;

    // BetId -> Query
    mapping(string => string) public betQueries;
    
    // BetId -> Minimum bet entry
    mapping(string => uint256) public betMinimums;

    // Keep track of all createdBets to prevent duplicates
    mapping(string => bool) public createdBets;

    // Once a query is executed, associate its ID with the bet's ID to handle updating the bet's state in __callback
    mapping(bytes32 => string) public queryBets;
    
    // Keep track of all owners to handle awarding commission fees
    mapping(string => address payable) public betOwners; 
    mapping(string => uint256) public betCommissions;

    // To help people avoid overpaying for the oracle contract querying service, its last price is saved and then suggested in the frontend
    uint256 public lastQueryPrice;
    
    function createBet(string calldata betId, string calldata query, uint64 deadline, uint64 schedule, uint256 commission, uint256 minimum, uint256 initialPool, string calldata description) public payable {
        
        
        // Initial pool can't be higher than transferred value, commission can't be higher than 50%, minimum bet is 1 finney
        require(msg.value >= initialPool && commission > 1 && minimum >= 1e15 && !createdBets[betId] && deadline <= schedule && deadline > block.timestamp);
        uint256 balance = msg.value;
        balance -= initialPool;

        lastQueryPrice = provable_getPrice("URL");
        if (lastQueryPrice > balance) {
            emit LackingFunds(msg.sender, lastQueryPrice);
            msg.sender.transfer(msg.value);
            return;
        }
        
        createdBets[betId] = true;
        bytes32 queryId = provable_query(schedule, "URL", query);
        queryBets[queryId] = betId;
        betOwners[betId] = msg.sender;
        betCommissions[betId] = commission;
        betDeadlines[betId] = deadline;
        betMinimums[betId] = minimum;
        betQueries[betId] = query;

        // Owner's pool of bets is set to refund them in case nobody wins
        userPools[betId][msg.sender] += initialPool;
        betPools[betId] = initialPool;
        
        emit CreatedBet(msg.sender, betId, betId, schedule, initialPool, description);
    }
    
    // BetId -> Result -> Total pooled per result
    mapping(string => mapping(string => uint256)) public resultPools;
    
    // BetId -> User -> Total spent per user
    mapping(string => mapping(address => uint256)) public userPools;

    // BetId -> Total pooled
    mapping(string => uint256) public betPools;
    
    // BetId -> User -> Result -> How much user 
    mapping(string => mapping(address => mapping(string => uint256))) public userBets;
    
    function placeBets(string calldata betId, string[] calldata results, uint256[] calldata amounts) public payable {
        require(results.length == amounts.length && createdBets[betId] && !finishedBets[betId] && betDeadlines[betId] >= block.timestamp);
        uint256 total = msg.value;
        for (uint i = 0; i < results.length; i++) {

            // More than one bet can be placed at the same time, need to be careful the deposited amount is never less than all combined bets
            // When the oracle fails an empty string is returned, so by not allowing anyone to bet on an empty string bets can be refunded if an error happens
            uint256 bet = amounts[i];
            require(bytes(results[i]).length > 0 && total >= bet && bet >= betMinimums[betId]);
            total -= bet;

            bet -= fixedCommission;

            // Update all required state and emit the event for the frontend
            resultPools[betId][results[i]] += bet;
            userPools[betId][msg.sender] += bet;
            betPools[betId] += bet;
            userBets[betId][msg.sender][results[i]] += bet;
        }

        owner.transfer(fixedCommission * results.length); // Commission transfer
        
        if (total != 0) {
            msg.sender.transfer(total);
        }

        emit PlacedBets(msg.sender, betId, results, betId, results);
    }
    
    // Keep track of which rewards have already been granted
    mapping(string => mapping(address => bool)) public claimedBets;
    

    function claimBet(string calldata betId) public {
        require(finishedBets[betId] && !claimedBets[betId][msg.sender] && userPools[betId][msg.sender] != 0);
        
        claimedBets[betId][msg.sender] = true;

        // What's the final result?
        string memory result = betResults[betId];
        
        // Did the user bet on the correct result?
        uint256 userBet = userBets[betId][msg.sender][result];
        
        uint256 winnerPool = resultPools[betId][result];
        
        uint256 reward;
        
        // If no one won then all bets get refunded
        if (winnerPool == 0) {
            emit UnwonBet(msg.sender);
            reward = userPools[betId][msg.sender];
        } else if (userBet != 0) {
            emit WonBet(msg.sender, reward);
        	uint256 loserPool = betPools[betId] - winnerPool;
            // User gets their corresponding fraction of the loser's pool, along with their original bet
        	reward = loserPool / (winnerPool / userBet) + userBet;
        } else {
            emit LostBet(msg.sender);
            return;
        }
        
        if (reward > 0) {
            uint256 ownerFee = reward / betCommissions[betId];
            uint256 generalFee = reward / 200;
            reward -= generalFee;
            reward -= ownerFee;
            msg.sender.transfer(reward);
            owner.transfer(generalFee);
            betOwners[betId].transfer(ownerFee);
        }
    }
    
    // Keep track of when a bet ends and what its result was
    mapping(string => bool) public finishedBets;
    mapping(string => string) public betResults;

    function __callback(bytes32 queryId, string memory result) override public {
        string memory betId = queryBets[queryId];
        require(msg.sender == provable_cbAddress() && !finishedBets[betId]);
        betResults[betId] = result;
        finishedBets[betId] = true;
    }
}
