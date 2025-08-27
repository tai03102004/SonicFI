const {
    ethers,
    upgrades
} = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting SocialFi Platform Deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId);
    console.log("Gas Price:", (await ethers.provider.getFeeData()).gasPrice?.toString());
    console.log("─────────────────────────────────────────────────────────────\n");

    // Contract deployment results
    const deployedContracts = {};

    try {
        // 1. Deploy SToken (ERC20) first
        console.log("📦 1. Deploying SToken ERC20...");
        const SToken = await ethers.getContractFactory("STokenERC20");
        const treasuryWallet = process.env.TREASURY_WALLET || deployer.address;
        const rewardPool = process.env.REWARD_POOL || deployer.address;

        const sToken = await SToken.deploy(treasuryWallet, rewardPool);
        await sToken.waitForDeployment();
        const sTokenAddress = await sToken.getAddress();

        console.log("✅ SToken deployed to:", sTokenAddress);
        console.log("   Treasury Wallet:", treasuryWallet);
        console.log("   Reward Pool:", rewardPool);

        deployedContracts.SToken = {
            address: sTokenAddress,
            contract: sToken
        };

        // 2. Deploy Knowledge DAO
        console.log("\n📦 2. Deploying Knowledge DAO...");
        const KnowledgeDAO = await ethers.getContractFactory("KnowledgeDAO");
        const knowledgeDAO = await KnowledgeDAO.deploy(sTokenAddress);
        await knowledgeDAO.waitForDeployment();
        const knowledgeDAOAddress = await knowledgeDAO.getAddress();

        console.log("✅ Knowledge DAO deployed to:", knowledgeDAOAddress);

        deployedContracts.KnowledgeDAO = {
            address: knowledgeDAOAddress,
            contract: knowledgeDAO
        };

        // 3. Deploy Reputation System
        console.log("\n📦 3. Deploying Reputation System...");
        const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
        const reputationSystem = await ReputationSystem.deploy();
        await reputationSystem.waitForDeployment();
        const reputationSystemAddress = await reputationSystem.getAddress();

        console.log("✅ Reputation System deployed to:", reputationSystemAddress);

        deployedContracts.ReputationSystem = {
            address: reputationSystemAddress,
            contract: reputationSystem
        };

        // 4. Deploy AI Model Registry
        console.log("\n📦 4. Deploying AI Model Registry...");
        const AIModelRegistry = await ethers.getContractFactory("AIModelRegistry");
        const aiModelRegistry = await AIModelRegistry.deploy(sTokenAddress);
        await aiModelRegistry.waitForDeployment();
        const aiModelRegistryAddress = await aiModelRegistry.getAddress();

        console.log("✅ AI Model Registry deployed to:", aiModelRegistryAddress);

        deployedContracts.AIModelRegistry = {
            address: aiModelRegistryAddress,
            contract: aiModelRegistry
        };

        // 5. Setup initial configuration
        console.log("\n⚙️  5. Setting up initial configuration...");

        // Set Knowledge DAO in SToken
        console.log("   - Setting Knowledge DAO in SToken...");
        await sToken.setKnowledgeDAO(knowledgeDAOAddress);

        // Add AI Model Registry as minter
        console.log("   - Adding AI Model Registry as minter...");
        await sToken.addMinter(aiModelRegistryAddress);

        // Add Knowledge DAO as minter for rewards
        console.log("   - Adding Knowledge DAO as minter...");
        await sToken.addMinter(knowledgeDAOAddress);

        // Authorize reputation system oracle
        console.log("   - Authorizing reputation system oracle...");
        await reputationSystem.authorizeOracle(deployer.address);

        // Grant oracle role to deployer in AI Model Registry
        console.log("   - Granting oracle role in AI Model Registry...");
        const ORACLE_ROLE = await aiModelRegistry.ORACLE_ROLE();
        await aiModelRegistry.grantRole(ORACLE_ROLE, deployer.address);

        console.log("✅ Initial configuration completed!");

        // 6. Verify deployment
        console.log("\n🔍 6. Verifying deployment...");

        // Check SToken total supply
        const totalSupply = await sToken.totalSupply();
        console.log("   - SToken Total Supply:", ethers.formatEther(totalSupply), "S");

        // Check Knowledge DAO setup
        const daoSToken = await knowledgeDAO.sToken();
        console.log("   - Knowledge DAO sToken:", daoSToken);

        // Check AI Model Registry setup
        const registrySToken = await aiModelRegistry.sToken();
        console.log("   - AI Model Registry sToken:", registrySToken);

        console.log("✅ Deployment verification completed!");

        // 7. Save deployment info
        console.log("\n💾 7. Saving deployment information...");
        const deploymentInfo = {
            network: network.name,
            chainId: network.chainId.toString(),
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {
                SToken: sTokenAddress,
                KnowledgeDAO: knowledgeDAOAddress,
                ReputationSystem: reputationSystemAddress,
                AIModelRegistry: aiModelRegistryAddress
            },
            configuration: {
                treasuryWallet,
                rewardPool
            }
        };

        // Write to file
        const fs = require('fs');
        const path = require('path');
        const deploymentsDir = path.join(__dirname, '../deployments');

        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, {
                recursive: true
            });
        }

        const filename = `deployment-${network.name}-${Date.now()}.json`;
        fs.writeFileSync(
            path.join(deploymentsDir, filename),
            JSON.stringify(deploymentInfo, null, 2)
        );

        // Also write latest deployment
        fs.writeFileSync(
            path.join(deploymentsDir, `latest-${network.name}.json`),
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("✅ Deployment info saved to:", filename);

        // 8. Display summary
        console.log("\n" + "=".repeat(60));
        console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(60));
        console.log("\n📋 Contract Addresses:");
        console.log("   SToken (ERC20):", sTokenAddress);
        console.log("   Knowledge DAO:", knowledgeDAOAddress);
        console.log("   Reputation System:", reputationSystemAddress);
        console.log("   AI Model Registry:", aiModelRegistryAddress);

        console.log("\n🔗 Network Info:");
        console.log("   Network:", network.name);
        console.log("   Chain ID:", network.chainId.toString());
        console.log("   Deployer:", deployer.address);

        console.log("\n📖 Next Steps:");
        console.log("   1. Verify contracts on block explorer");
        console.log("   2. Update frontend configuration with contract addresses");
        console.log("   3. Test basic functionality");
        console.log("   4. Set up monitoring and alerts");

        if (network.name !== "hardhat" && network.name !== "localhost") {
            console.log("\n🔍 Verification Command:");
            console.log(`   npx hardhat verify --network ${network.name} ${sTokenAddress} "${treasuryWallet}" "${rewardPool}"`);
            console.log(`   npx hardhat verify --network ${network.name} ${knowledgeDAOAddress} "${sTokenAddress}"`);
            console.log(`   npx hardhat verify --network ${network.name} ${reputationSystemAddress}`);
            console.log(`   npx hardhat verify --network ${network.name} ${aiModelRegistryAddress} "${sTokenAddress}"`);
        }

        console.log("\n" + "=".repeat(60));

        return deployedContracts;

    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;