// Update this address after deploying RPGZama on Sepolia
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// ABI for RPGZama contract
export const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "address", "name": "previousOwner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
    ], "name": "OwnershipTransferred", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "address", "name": "by", "type": "address"}
    ], "name": "AnswersInitialized", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "requestId", "type": "uint256"}
    ], "name": "ChoicesSubmitted", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ], "name": "WinnerMinted", "type": "event" },

  { "inputs": [], "name": "owner", "outputs": [{"internalType":"address","name":"","type":"address"}], "stateMutability":"view", "type":"function" },
  { "inputs": [{"internalType":"address","name":"newOwner","type":"address"}], "name":"transferOwnership", "outputs": [], "stateMutability":"nonpayable", "type":"function" },

  { "inputs": [], "name": "initialized", "outputs": [{"internalType":"bool","name":"","type":"bool"}], "stateMutability":"view", "type":"function" },
  { "inputs": [
      {"internalType":"externalEuint8","name":"a1","type":"bytes32"},
      {"internalType":"externalEuint8","name":"a2","type":"bytes32"},
      {"internalType":"externalEuint8","name":"a3","type":"bytes32"},
      {"internalType":"externalEuint8","name":"a4","type":"bytes32"},
      {"internalType":"bytes","name":"inputProof","type":"bytes"}
    ], "name":"initializeAnswers", "outputs":[], "stateMutability":"nonpayable", "type":"function" },

  { "inputs": [
      {"internalType":"externalEuint8","name":"c1","type":"bytes32"},
      {"internalType":"externalEuint8","name":"c2","type":"bytes32"},
      {"internalType":"externalEuint8","name":"c3","type":"bytes32"},
      {"internalType":"externalEuint8","name":"c4","type":"bytes32"},
      {"internalType":"bytes","name":"inputProof","type":"bytes"}
    ], "name":"submitChoices", "outputs":[], "stateMutability":"nonpayable", "type":"function" },

  { "inputs": [
      {"internalType":"uint256","name":"requestId","type":"uint256"},
      {"internalType":"bytes","name":"cleartexts","type":"bytes"},
      {"internalType":"bytes","name":"decryptionProof","type":"bytes"}
    ], "name":"decryptionCallback", "outputs":[{"internalType":"bool","name":"","type":"bool"}], "stateMutability":"nonpayable", "type":"function" },

  { "inputs": [{"internalType":"address","name":"user","type":"address"}], "name":"getStatus", "outputs": [
      {"internalType":"bool","name":"submitted","type":"bool"},
      {"internalType":"bool","name":"pending","type":"bool"},
      {"internalType":"bool","name":"won","type":"bool"}
    ], "stateMutability":"view", "type":"function" },

  { "inputs": [{"internalType":"address","name":"user","type":"address"}], "name":"getLastAllCorrect", "outputs": [
      {"internalType":"ebool","name":"","type":"bytes32"}
    ], "stateMutability":"view", "type":"function" },

  { "inputs": [], "name": "name", "outputs": [{"internalType":"string","name":"","type":"string"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "symbol", "outputs": [{"internalType":"string","name":"","type":"string"}], "stateMutability":"view", "type":"function" },
  { "inputs": [{"internalType":"address","name":"account","type":"address"}], "name":"balanceOf", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [{"internalType":"uint256","name":"tokenId","type":"uint256"}], "name":"ownerOf", "outputs": [{"internalType":"address","name":"","type":"address"}], "stateMutability":"view", "type":"function" }
] as const;
