pragma solidity > 0.6.1 < 0.7.0;
pragma experimental ABIEncoderV2;

import "github.com/provable-things/ethereum-api/blob/master/provableAPI_0.6.sol";

contract WeiStakesByDecentralizedDegenerates is usingProvable {
    
    address payable contractCreator;
    constructor() public payable {
        contractCreator = msg.sender;
    }
    
    /* There are two different dates associated with each created bet:
    one for the deadline where a user can no longer place new bets,
    and another one that tells the smart oracle contract when to actually
    query the specified website to parse the bet's final result. */
    mapping(string => uint64) public betDeadlines;
    mapping(string => uint64) public betSchedules;
      
    // There's a 0.0001 ETH fixed commission transferred to the contract's creator for every placed bet
    uint256 public constant fixedCommission = 1e14;
    
    // Minimum entry for all bets, bet creators cannot set it lower than this 
    uint256 public constant minimumBet = fixedCommission * 2;
    
    // Custom minimum entry for each bet, set by their creator
    mapping(string => uint256) public betMinimums;
    
    // Keep track of all createdBets to prevent duplicates
    mapping(string => bool) public createdBets;
    
    // Once a query is executed by the oracle, associate its ID with the bet's ID to handle updating the bet's state in __callback
    mapping(bytes32 => string) public queryBets;
    
    // Keep track of all owners to handle commission fees
    mapping(string => address payable) public betOwners; 
    mapping(string => uint256) public betCommissions;
    
    // For each bet, how much each has each user put into that bet's pool?
    mapping(string => mapping(address => uint256)) public userPools;
    
    // What is the total pooled per bet?
    mapping(string => uint256) public betPools;
    
    /* To help people avoid overpaying for the oracle contract querying service,
    its last price is saved and then suggested in the frontend. */
    mapping(string => uint256) public lastQueryPrice;
    
    // Queries can't be scheduled more than 60 days in the future
    uint64 constant scheduleThreshold = 60 * 24 * 60 * 60;

    /* Provable's API requires some initial funds to cover the cost of the query. 
    If they are not enough to pay for it, the user should be informed and their funds returned. */
    event LackingFunds(address indexed sender, uint256 funds);    
    
    /* Contains all the information that does not need to be saved as a state variable, 
    but which can prove useful to people taking a look at the bet in the frontend. */
    event CreatedBet(string indexed _id, uint256 initialPool, string description, string query);
    
    function createBet(string betType, string calldata betId, string calldata query, uint64 deadline, uint64 schedule, uint256 commission, uint256 minimum, uint256 initialPool, string calldata description) public payable {
        
        require(
            bytes(betId).length > 0 
            && deadline > block.timestamp // Bet can't be set in the past
            && deadline <= schedule // Users should only be able to place bets before it is actually executed
            && schedule < block.timestamp + scheduleThreshold
            && msg.value >= initialPool
            && commission > 1 // Commission can't be higher than 50%
            && minimum >= minimumBet
            && !createdBets[betId], // Can't have duplicate bets
        "Unable to create bet, check arguments.");
        
        // The remaining balance should be enough to cover the cost of the smart oracle query
        uint256 balance = msg.value - initialPool;
        
        lastQueryPrice[betType] = provable_getPrice(betType);
        if (lastQueryPrice[betType] > balance) {
            emit LackingFunds(msg.sender, lastQueryPrice[betType]);
            (bool success, ) = msg.sender.call.value(msg.value)("");
            require(success, "Error when returning funds to bet owner.");
            return;
        }
        
        // Bet creation should succeed from this point onward 
        createdBets[betId] = true;
        
        /* Even though the oracle query is scheduled to run in the future, 
        it immediately returns a query ID which we associate with the newly created bet. */
        bytes32 queryId = provable_query(schedule, betType, query);
        queryBets[queryId] = betId;
        
        // Nothing fancy going on here, just boring old state updates
        betOwners[betId] = msg.sender;
        betCommissions[betId] = commission;
        betDeadlines[betId] = deadline;
        betSchedules[betId] = schedule;
        betMinimums[betId] = minimum;
        
        /* By adding the initial pool to the bet creator's, 
        but not associating it with any results, we allow the creator to incentivize 
        people to participate without needing to place a bet themselves. */
        userPools[betId][msg.sender] += initialPool;
        betPools[betId] = initialPool;
        
        emit CreatedBet(betId, initialPool, description, query);
    }
    
    // For each bet, how much is the total pooled per result?
    mapping(string => mapping(string => uint256)) public resultPools;
      
    // For each bet, track how much each user has put into each result
    mapping(string => mapping(address => mapping(string => uint256))) public userBets;


    // The table representing each bet's pool is populated according to these events.
    event PlacedBets(address indexed user, string indexed _id, string id, string[] results);
    
    function placeBets(string calldata betId, string[] calldata results, uint256[] calldata amounts) public payable {
      
        require(
            results.length > 0 
            && results.length == amounts.length 
            && createdBets[betId] 
            && !finishedBets[betId] 
            && betDeadlines[betId] >= block.timestamp,
        "Unable to place bets, check arguments.");
        
        uint256 total = msg.value;
        for (uint i = 0; i < results.length; i++) {
        
            /* More than one bet can be placed at the same time, 
            need to be careful the transaction funds are never less than all combined bets.
            When the oracle fails an empty string is returned, 
            so by not allowing anyone to bet on an empty string bets can be refunded if an error happens. */
            uint256 bet = amounts[i];
            
            require(
                bytes(results[i]).length > 0 
                && total >= bet 
                && bet >= betMinimums[betId],
            "Attempted to place invalid bet, check amounts and results");
            
            total -= bet;
            
            bet -= fixedCommission;
            
            // Update all required state
            resultPools[betId][results[i]] += bet;
            userPools[betId][msg.sender] += bet;
            betPools[betId] += bet;
            userBets[betId][msg.sender][results[i]] += bet;
        }
        
        // Fixed commission transfer
        (bool success, ) = contractCreator.call.value(fixedCommission * results.length)("");
        require(success, "Failed to transfer fixed commission to contract creator.");
        
        emit PlacedBets(msg.sender, betId, betId, results);
    }

    // For each bet, track which users have already claimed their potential reward
    mapping(string => mapping(address => bool)) public claimedBets;
    
    /* If the oracle service's scheduled callback was not executed after 5 days, 
    a user can reclaim his funds after the bet's execution threshold has passed. 
    Note that even if the callback execution is delayed,
    Provable's oracle should've extracted the result at the originally scheduled time. */
    uint64 constant betThreshold = 5 * 24 * 60 * 60;
    
    
    // If the user wins the bet, let them know along with the reward amount.
    event WonBet(address indexed winner, uint256 won);
    
    // If the user lost no funds are claimable.
    event LostBet(address indexed loser);
    
    /* If no one wins the bet the funds can be refunded to the user, 
    after the bet creator's takes their cut. */
    event UnwonBet(address indexed refunded);
    
    function claimBet(string calldata betId) public {
        bool betExpired = betSchedules[betId] + betThreshold < block.timestamp;
        
        // If the bet has not finished but its threshold has been reached, let the user get back their funds
        require(
            (finishedBets[betId] || betExpired) 
            && !claimedBets[betId][msg.sender] 
            && userPools[betId][msg.sender] != 0,
        "Invalid bet state while claiming reward.");
        
        claimedBets[betId][msg.sender] = true;
        
        // What's the final result?
        string memory result = betResults[betId];
        
        // Did the user bet on the correct result?
        uint256 userBet = userBets[betId][msg.sender][result];
        
        // How much did everyone pool into the correct result?
        uint256 winnerPool = resultPools[betId][result];
        
        uint256 reward;
        
        // If no one won then all bets are refunded
        if (winnerPool == 0) {
            emit UnwonBet(msg.sender);
            reward = userPools[betId][msg.sender];
        } else if (userBet != 0) {
            // User won the bet and receives their corresponding share of the loser's pool
            uint256 loserPool = betPools[betId] - winnerPool;
            emit WonBet(msg.sender, reward);
            // User gets their corresponding fraction of the loser's pool, along with their original bet
            reward = loserPool / (winnerPool / userBet) + userBet;
        } else {
            // Sad violin noises
            emit LostBet(msg.sender);
            return;
        }
        
        // Bet owner gets their commission
        uint256 ownerFee = reward / betCommissions[betId];
        reward -= ownerFee;
        (bool success, ) = msg.sender.call.value(reward)("");
        require(success, "Failed to transfer reward to user.");
        (success, ) = betOwners[betId].call.value(ownerFee)("");
        require(success, "Failed to transfer commission to bet owner.");
    }
      
    // Keep track of when a bet ends and what its result was
    mapping(string => bool) public finishedBets;
    mapping(string => string) public betResults;
  
    // Function executed by Provable's oracle when the bet is scheduled to run
    function __callback(bytes32 queryId, string memory result) override public {
        string memory betId = queryBets[queryId];
        
        /* Callback is sometimes executed twice,  so we add an additional check
        to make sure state is only modified the first time. */
        require(msg.sender == provable_cbAddress() && !finishedBets[betId]);
        
        betResults[betId] = result;
        finishedBets[betId] = true;
    }
}