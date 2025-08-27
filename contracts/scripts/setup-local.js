const {
    ethers
} = require("hardhat");

async function main() {
    console.log("🏗️  Setting up local development environment...\n");

    // Deploy contracts
    const deployedContracts = await require('../deploy.js')();

    const [deployer, user1, user2, user3] = await ethers.getSigners();

    // Get contract instances
    const sToken = deployedContracts.SToken.contract;
    const knowledgeDAO = deployedContracts.KnowledgeDAO.contract;
    const reputationSystem = deployedContracts.ReputationSystem.contract;
    const aiModelRegistry = deployedContracts.AIModelRegistry.contract;

    console.log("\n🎭 Setting up test data...");

    // Distribute tokens to test users
    const testAmount = ethers.parseEther("10000"); // 10,000 S tokens each
    console.log("   - Distributing tokens to test users...");

    await sToken.transfer(user1.address, testAmount);
    await sToken.transfer(user2.address, testAmount);
    await sToken.transfer(user3.address, testAmount);

    // Create test AI models
    console.log("   - Creating test AI models...");

    const stakingAmount = ethers.parseEther("1000");

    // Model 1: BTC Predictor
    await sToken.connect(user1).approve(aiModelRegistry.getAddress(), stakingAmount);
    await aiModelRegistry.connect(user1).registerModel(
        "BTC Price Predictor",
        "1.0.0",
        "Advanced ML model for Bitcoin price prediction using technical indicators",
        "QmBTCModelHash123456789",
        "https://ipfs.io/ipfs/QmBTCMetadata",
        ["Price Prediction", "DeFi"],
        true,
        stakingAmount
    );

    // Model 2: ETH Sentiment Analyzer  
    await sToken.connect(user2).approve(aiModelRegistry.getAddress(), stakingAmount);
    await aiModelRegistry.connect(user2).registerModel(
        "ETH Sentiment Analyzer",
        "1.0.0",
        "Sentiment analysis model for Ethereum market sentiment",
        "QmETHSentimentHash987654321",
        "https://ipfs.io/ipfs/QmETHMetadata",
        ["Sentiment Analysis", "Market Making"],
        true,
        stakingAmount
    );

    // Model 3: DeFi Risk Assessment
    await sToken.connect(user3).approve(aiModelRegistry.getAddress(), stakingAmount);
    await aiModelRegistry.connect(user3).registerModel(
        "DeFi Risk Assessor",
        "1.0.0",
        "Risk assessment model for DeFi protocols and investments",
        "QmDeFiRiskHash456789123",
        "https://ipfs.io/ipfs/QmDeFiMetadata",
        ["Risk Assessment", "DeFi"],
        true,
        stakingAmount
    );

    // Setup initial reputation
    console.log("   - Setting up initial reputation scores...");

    await reputationSystem.updateReputation(
        user1.address,
        "early_adoption",
        100,
        ethers.keccak256(ethers.toUtf8Bytes("early_adopter_evidence")),
        true
    );

    await reputationSystem.updateReputation(
        user2.address,
        "content_creation",
        150,
        ethers.keccak256(ethers.toUtf8Bytes("content_creator_evidence")),
        true
    );

    await reputationSystem.updateReputation(
        user3.address,
        "expert_analysis",
        200,
        ethers.keccak256(ethers.toUtf8Bytes("expert_analysis_evidence")),
        true
    );

    console.log("✅ Local development environment setup completed!");

    // Display summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 LOCAL DEVELOPMENT ENVIRONMENT READY!");
    console.log("=".repeat(60));

    console.log("\n👥 Test Accounts:");
    console.log("   Deployer:", deployer.address);
    console.log("   User1 (BTC Model Creator):", user1.address);
    console.log("   User2 (ETH Model Creator):", user2.address);
    console.log("   User3 (DeFi Model Creator):", user3.address);

    console.log("\n💰 Token Balances (S):");
    console.log("   User1:", ethers.formatEther(await sToken.balanceOf(user1.address)));
    console.log("   User2:", ethers.formatEther(await sToken.balanceOf(user2.address)));
    console.log("   User3:", ethers.formatEther(await sToken.balanceOf(user3.address)));

    console.log("\n🤖 AI Models Created:");
    console.log("   Model ID 0: BTC Price Predictor (by User1)");
    console.log("   Model ID 1: ETH Sentiment Analyzer (by User2)");
    console.log("   Model ID 2: DeFi Risk Assessor (by User3)");

    console.log("\n🚀 Ready for frontend development and testing!");
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });