export const CONTRACT_ABIS = {
  SToken: [
    "function balanceOf(address owner) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ],

  KnowledgeDAO: [
    "function submitProposal(string memory title, string memory description, uint256 votingDuration) returns (uint256)",
    "function vote(uint256 proposalId, bool support) returns (bool)",
    "function executeProposal(uint256 proposalId) returns (bool)",
    "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, address proposer, string title, string description, uint256 votesFor, uint256 votesAgainst, uint256 endTime, bool executed))",
    "function proposalCount() view returns (uint256)", // ← FIX: Change from getProposalCount
    "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
    "event ProposalSubmitted(uint256 indexed proposalId, address indexed proposer, string title)",
    "event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)",
  ],

  ReputationSystem: [
    "function getReputation(address user) view returns (uint256)",
    "function reputation(address user) view returns (uint256)", // ← Alternative method name
    "function updateReputation(address user, int256 change) returns (bool)",
    "function getTotalReputation() view returns (uint256)",
    "event ReputationUpdated(address indexed user, int256 change, uint256 newReputation, string reason)",
  ],

  AIModelRegistry: [
    "function registerModel(string memory name, string memory description, string memory ipfsHash, uint256 price) returns (uint256)",
    "function purchaseModel(uint256 modelId) payable returns (bool)",
    "function getModel(uint256 modelId) view returns (tuple(uint256 id, address owner, string name, string description, string ipfsHash, uint256 price, bool active))",
    "function modelCount() view returns (uint256)", // ← FIX: Change from getModelCount to modelCount
    "function models(uint256 id) view returns (tuple(uint256 id, address owner, string name, string description, string ipfsHash, uint256 price, bool active))", // ← Alternative
    "function getUserModels(address user) view returns (uint256[])",
    "function toggleModelStatus(uint256 modelId) returns (bool)",
    "event ModelRegistered(uint256 indexed modelId, address indexed owner, string name, uint256 price)",
    "event ModelPurchased(uint256 indexed modelId, address indexed buyer, uint256 price)",
  ],
};
