// filepath: /Users/macbookpro14m1pro/Desktop/SocialFi/contracts/scripts/test-deployment.js
const {
    ethers
} = require("hardhat");

async function main() {
    console.log("🧪 Testing deployed contracts...\n");

    // Load latest deployment
    const fs = require('fs');
    const path = require('path');

    const network = await ethers.provider.getNetwork();
    const deploymentPath = path.join(__dirname, '../deployments', `latest-${network.name}.json`);

    if (!fs.existsSync(deploymentPath)) {
        console.error("❌ No deployment found for network:", network.name);
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath));
    console.log("📋 Using deployment:", deployment.timestamp);
    console.log("📍 Network:", deployment.network, "Chain ID:", deployment.chainId);

    const [deployer, user1, user2] = await ethers.getSigners();
    console.log("👤 Test accounts:");
    console.log("   Deployer:", deployer.address);
    console.log("   User1:", user1.address);
    console.log("   User2:", user2.address);

    // Get contract instances
    const SToken = await ethers.getContractFactory("STokenERC20");
    const sToken = SToken.attach(deployment.contracts.SToken);

    const KnowledgeDAO = await ethers.getContractFactory("KnowledgeDAO");
    const knowledgeDAO = KnowledgeDAO.attach(deployment.contracts.KnowledgeDAO);

    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    const reputationSystem = ReputationSystem.attach(deployment.contracts.ReputationSystem);

    const AIModelRegistry = await ethers.getContractFactory("AIModelRegistry");
    const aiModelRegistry = AIModelRegistry.attach(deployment.contracts.AIModelRegistry);

    console.log("\n" + "─".repeat(50));

    try {
        // Test 1: Check SToken basic info
        console.log("🧪 Test 1: SToken Basic Info");
        const name = await sToken.name();
        const symbol = await sToken.symbol();
        const totalSupply = await sToken.totalSupply();
        const deployerBalance = await sToken.balanceOf(deployer.address);

        console.log("   Name:", name);
        console.log("   Symbol:", symbol);
        console.log("   Total Supply:", ethers.formatEther(totalSupply), "S");
        console.log("   Deployer Balance:", ethers.formatEther(deployerBalance), "S");
        console.log("✅ SToken test passed");

        // Test 2: Transfer tokens to test users
        console.log("\n🧪 Test 2: Token Transfer");
        const transferAmount = ethers.parseEther("1000"); // 1000 S tokens

        await sToken.transfer(user1.address, transferAmount);
        await sToken.transfer(user2.address, transferAmount);

        const user1Balance = await sToken.balanceOf(user1.address);
        const user2Balance = await sToken.balanceOf(user2.address);

        console.log("   User1 Balance:", ethers.formatEther(user1Balance), "S");
        console.log("   User2 Balance:", ethers.formatEther(user2Balance), "S");
        console.log("✅ Token transfer test passed");

        // Test 3: Knowledge DAO setup
        console.log("\n🧪 Test 3: Knowledge DAO");
        const daoSToken = await knowledgeDAO.sToken();
        const minStake = await knowledgeDAO.minStakeAmount();

        console.log("   DAO SToken Address:", daoSToken);
        console.log("   Min Stake Amount:", ethers.formatEther(minStake), "S");
        console.log("✅ Knowledge DAO test passed");

        // Test 4: AI Model Registry
        console.log("\n🧪 Test 4: AI Model Registry");
        const registrySToken = await aiModelRegistry.sToken();
        const modelCounter = await aiModelRegistry.modelCounter();
        const baseStaking = await aiModelRegistry.BASE_STAKING_REQUIREMENT();

        console.log("   Registry SToken Address:", registrySToken);
        console.log("   Model Counter:", modelCounter.toString());
        console.log("   Base Staking Requirement:", ethers.formatEther(baseStaking), "S");
        console.log("✅ AI Model Registry test passed");

        // Test 5: Reputation System
        console.log("\n🧪 Test 5: Reputation System");
        const [totalScore, votingAccuracy, stakingHistory, communityContribution, aiValidationScore, isInfluencer] =
        await reputationSystem.getUserReputation(deployer.address);

        console.log("   Deployer Reputation:");
        console.log("     Total Score:", totalScore.toString());
        console.log("     Voting Accuracy:", votingAccuracy.toString());
        console.log("     Is Influencer:", isInfluencer);
        console.log("✅ Reputation System test passed");

        // Test 6: Create a test AI model
        console.log("\n🧪 Test 6: Create Test AI Model");

        // Approve tokens for staking
        const stakingAmount = ethers.parseEther("1000");
        await sToken.connect(user1).approve(aiModelRegistry.getAddress(), stakingAmount);

        // Register a test model
        const modelTx = await aiModelRegistry.connect(user1).registerModel(
            "Test BTC Predictor",
            "1.0.0",
            "A test AI model for Bitcoin price prediction",
            "QmTestModelHash123456789",
            "https://ipfs.io/ipfs/QmTestMetadata",
            ["Price Prediction", "DeFi"],
            true, // isPublic
            stakingAmount
        );

        await modelTx.wait();

        const newModelCounter = await aiModelRegistry.modelCounter();
        console.log("   Created Model ID:", (newModelCounter - 1n).toString());
        console.log("✅ AI Model creation test passed");

        console.log("\n" + "=".repeat(50));
        console.log("🎉 ALL TESTS PASSED!");
        console.log("=".repeat(50));

    } catch (error) {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });