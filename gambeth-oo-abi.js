window.optimisticOracleAbi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "_id",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "initialPool",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "CreatedBet",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "query",
                "type": "string"
            }
        ],
        "name": "CreatedOptimisticBet",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "loser",
                "type": "address"
            }
        ],
        "name": "LostBet",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "string",
                "name": "_id",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "id",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            }
        ],
        "name": "PlacedBets",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "refunded",
                "type": "address"
            }
        ],
        "name": "UnwonBet",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "winner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "won",
                "type": "uint256"
            }
        ],
        "name": "WonBet",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "BET_THRESHOLD",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "OO_ADDRESS",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "PRICE_ID",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "approveToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "approvedTokens",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betChoices",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betCommissionDenominator",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betCommissions",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betDeadlines",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betKinds",
        "outputs": [
            {
                "internalType": "enum GambethOptimisticOracle.BetKind",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betOwners",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betPools",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betProposals",
        "outputs": [
            {
                "internalType": "int256",
                "name": "",
                "type": "int256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "betQueries",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betRequestTimes",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betRequester",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "betResults",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betSchedules",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "betTokens",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            },
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "name": "calculateContractCommission",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            }
        ],
        "name": "calculateCost",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "result",
                "type": "string"
            }
        ],
        "name": "calculatePrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "nominator",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "denominator",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256[]",
                "name": "orderAmounts",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "numerators",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "denominators",
                "type": "uint256[]"
            },
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            },
            {
                "internalType": "uint256[]",
                "name": "ids",
                "type": "uint256[]"
            }
        ],
        "name": "changeOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "orderAmounts",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "numerators",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "denominators",
                "type": "uint256[]"
            },
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            },
            {
                "internalType": "uint256[]",
                "name": "ids",
                "type": "uint256[]"
            }
        ],
        "name": "changeOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "query",
                "type": "string"
            }
        ],
        "name": "claimBet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "claimedBets",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "contractOwner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum GambethOptimisticOracle.BetKind",
                "name": "kind",
                "type": "uint8"
            },
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "commissionDenominator",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "commission",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "deadline",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "schedule",
                "type": "uint64"
            },
            {
                "internalType": "uint256",
                "name": "initialPool",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "query",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            }
        ],
        "name": "createBet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "currency",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "uint64",
                "name": "deadline",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "schedule",
                "type": "uint64"
            },
            {
                "internalType": "uint256",
                "name": "commissionDenominator",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "commission",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "initialPool",
                "type": "uint256"
            },
            {
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            },
            {
                "internalType": "string",
                "name": "query",
                "type": "string"
            }
        ],
        "name": "createOptimisticBet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "createdBets",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "orderAmounts",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "numerators",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "denominators",
                "type": "uint256[]"
            },
            {
                "internalType": "enum GambethOptimisticOracle.OrderType[]",
                "name": "orderTypes",
                "type": "uint8[]"
            },
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            },
            {
                "internalType": "uint256[][]",
                "name": "idxs",
                "type": "uint256[][]"
            }
        ],
        "name": "fillOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256[]",
                "name": "orderAmounts",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "numerators",
                "type": "uint256[]"
            },
            {
                "internalType": "uint256[]",
                "name": "denominators",
                "type": "uint256[]"
            },
            {
                "internalType": "enum GambethOptimisticOracle.OrderType[]",
                "name": "orderTypes",
                "type": "uint8[]"
            },
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            },
            {
                "internalType": "uint256[][]",
                "name": "idxs",
                "type": "uint256[][]"
            }
        ],
        "name": "fillOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "finishedBets",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "start",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "getOrders",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "enum GambethOptimisticOracle.OrderType",
                        "name": "orderType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "ratioNumerator",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "ratioDenominator",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "result",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "user",
                        "type": "address"
                    }
                ],
                "internalType": "struct GambethOptimisticOracle.Order[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            }
        ],
        "name": "getOutcomes",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            }
        ],
        "name": "getResult",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "decimals",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "approved",
                "type": "bool"
            }
        ],
        "name": "manageToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "oo",
        "outputs": [
            {
                "internalType": "contract OptimisticOracleV2Interface",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "orders",
        "outputs": [
            {
                "internalType": "enum GambethOptimisticOracle.OrderType",
                "name": "orderType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "ratioNumerator",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "ratioDenominator",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "result",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "pendingBuys",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "pendingSells",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "results",
                "type": "string[]"
            },
            {
                "internalType": "uint256[]",
                "name": "amounts",
                "type": "uint256[]"
            }
        ],
        "name": "placeBets",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "identifier",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "uint256",
                "name": "refund",
                "type": "uint256"
            }
        ],
        "name": "priceDisputed",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "identifier",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "query",
                "type": "bytes"
            }
        ],
        "name": "priceProposed",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "identifier",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "query",
                "type": "bytes"
            },
            {
                "internalType": "int256",
                "name": "price",
                "type": "int256"
            }
        ],
        "name": "priceSettled",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "betId",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "query",
                "type": "string"
            }
        ],
        "name": "requestBetResolution",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "name": "requestBets",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "resultPools",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "resultTransfers",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "tokenDecimals",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "userBets",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "userPools",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "userTransfers",
        "outputs": [
            {
                "internalType": "int256",
                "name": "",
                "type": "int256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]