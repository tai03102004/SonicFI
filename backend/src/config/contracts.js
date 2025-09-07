export const contractConfig = {
    addresses: {
        sToken: '0x4A80C79Ba53e1ecD18c3f340d8C5181e618B559C',
        aiRegistry: '0x9CD763b9a34c43123a70e69168C447C3dB1d51b7',
        knowledgeDAO: '0xD59Da846F02A6C84D79C05F80CFB3B7ae2F21879',
        reputation: '0x97a2c3CA5a565F0C0c4Ee66968B382B542C01070'
    },

    abis: {
        sToken: [
            "function mint(address to, uint256 amount) external",
            "function balanceOf(address account) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ],

        aiRegistry: [
            "function submitPrediction(string memory token, bytes32 predictionHash, uint256 confidence, uint256 stakeAmount) external",
            "function validatePrediction(bytes32 predictionHash, bool isAccurate, uint256 rewardAmount) external",
            "function getPrediction(bytes32 predictionHash) view returns (tuple)"
        ],

        reputation: [
            "function updateReputation(address user, string memory actionType, uint256 scoreModifier, bool isPositive) external",
            "function getUserReputation(address user) view returns (tuple)"
        ],

        knowledgeDAO: [
            "function createProposal(string memory description, uint256 votingPeriod) external returns (uint256)",
            "function vote(uint256 proposalId, bool support, uint256 votes) external"
        ]
    },

    network: {
        name: 'Sonic Testnet',
        rpcUrl: 'https://rpc.testnet.sonic.network',
        chainId: 64165,
        explorer: 'https://testnet.sonicscan.org'
    }
};