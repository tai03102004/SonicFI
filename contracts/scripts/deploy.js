const {
    ethers
} = require("hardhat");

async function main() {
    console.log("🚀 Starting SocialFi Platform Deployment...\n");

    // ✅ Add connection retry with timeout handling
    const maxRetries = 3;
    let deployer;

    console.log("🔗 Connecting to Sonic Testnet...");

    for (let i = 0; i < maxRetries; i++) {
        try {
            // Test connection first
            const network = await ethers.provider.getNetwork();
            console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

            [deployer] = await ethers.getSigners();
            console.log("✅ Connected to deployer:", deployer.address);
            break;
        } catch (error) {
            console.log(`❌ Connection attempt ${i + 1} failed:`, error.message);
            if (i === maxRetries - 1) {
                console.log("💡 Try using backup RPC: npx hardhat run scripts/deploy.js --network sonicTestnetBackup");
                throw error;
            }
            console.log("⏳ Waiting 10 seconds before retry...");
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "S");

    if (balance === 0n) {
        console.log("❌ Insufficient balance! Get testnet tokens from: https://faucet.testnet.sonic.network");
        return;
    }

    console.log("─────────────────────────────────────────────────────────────\n");

    // ✅ Deploy function with retries and delays
    async function deployWithRetry(contractName, args = [], displayName = null) {
        const name = displayName || contractName;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📦 ${attempt > 1 ? `Retry ${attempt}: ` : ''}Deploying ${name}...`);

                const ContractFactory = await ethers.getContractFactory(contractName);

                // Add gas estimation
                const deployTx = await ContractFactory.getDeployTransaction(...args);
                const gasEstimate = await ethers.provider.estimateGas(deployTx);
                console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

                const contract = await ContractFactory.deploy(...args, {
                    gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
                });

                console.log(`⏳ Waiting for ${name} deployment confirmation...`);
                await contract.waitForDeployment();

                const address = await contract.getAddress();
                console.log(`✅ ${name} deployed to: ${address}\n`);

                return {
                    contract,
                    address
                };

            } catch (error) {
                console.log(`❌ ${name} deployment attempt ${attempt} failed:`, error.message);

                if (attempt === maxRetries) {
                    throw error;
                }

                const waitTime = attempt * 15000; // Increase wait time with each retry
                console.log(`⏳ Waiting ${waitTime/1000} seconds before retry...\n`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    try {
        // 1. Deploy SToken
        const {
            contract: sToken,
            address: sTokenAddress
        } = await deployWithRetry("STokenERC20", [
            "SocialFi Token",
            "STOKEN",
            ethers.parseEther("100000000"),
            deployer.address
        ], "SToken");

        // 2. Deploy ReputationSystem
        const {
            contract: reputationSystem,
            address: reputationAddress
        } = await deployWithRetry("ReputationSystem", [
            deployer.address
        ], "Reputation System");

        // 3. Deploy KnowledgeDAO
        const {
            contract: knowledgeDAO,
            address: knowledgeDAOAddress
        } = await deployWithRetry("KnowledgeDAO", [
            deployer.address,
            sTokenAddress
        ], "Knowledge DAO");

        // 4. Deploy AIModelRegistry
        const {
            contract: aiModelRegistry,
            address: aiModelAddress
        } = await deployWithRetry("AIModelRegistry", [], "AI Model Registry");

        // 5. Setup permissions with retry
        console.log("⚙️ Setting up permissions...");

        try {
            console.log("Setting KnowledgeDAO address...");
            const tx1 = await sToken.setKnowledgeDAO(knowledgeDAOAddress);
            await tx1.wait();

            console.log("Adding minter permission...");
            const tx2 = await sToken.addMinter(deployer.address);
            await tx2.wait();

            console.log("Authorizing oracle...");
            const tx3 = await reputationSystem.authorizeOracle(deployer.address);
            await tx3.wait();

            console.log("✅ All permissions configured!\n");
        } catch (error) {
            console.log("⚠️ Some permissions failed:", error.message);
        }

        // Save deployment info
        const deploymentInfo = {
            network: "Sonic Testnet",
            chainId: 14601,
            deployer: deployer.address,
            timestamp: new Date().toISOString(),
            contracts: {
                SToken: sTokenAddress,
                KnowledgeDAO: knowledgeDAOAddress,
                ReputationSystem: reputationAddress,
                AIModelRegistry: aiModelAddress
            },
            gasUsed: "Estimated deployment cost: ~0.1 S"
        };

        const fs = require('fs');
        if (!fs.existsSync('./deployments')) {
            fs.mkdirSync('./deployments');
        }

        fs.writeFileSync(
            './deployments/sonic-testnet-deployment.json',
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
        console.log("════════════════════════════════════════════════════════════");
        console.log("📋 Contract Addresses:");
        console.log(`   🪙 SToken (ERC20):      ${sTokenAddress}`);
        console.log(`   🏛️  Knowledge DAO:       ${knowledgeDAOAddress}`);
        console.log(`   ⭐ Reputation System:   ${reputationAddress}`);
        console.log(`   🤖 AI Model Registry:   ${aiModelAddress}`);
        console.log("════════════════════════════════════════════════════════════");

        console.log("\n🔗 Sonic Testnet Explorer Links:");
        console.log(`   SToken:         https://testnet.sonicscan.org/address/${sTokenAddress}`);
        console.log(`   Knowledge DAO:  https://testnet.sonicscan.org/address/${knowledgeDAOAddress}`);
        console.log(`   Reputation:     https://testnet.sonicscan.org/address/${reputationAddress}`);
        console.log(`   AI Registry:    https://testnet.sonicscan.org/address/${aiModelAddress}`);

        console.log("\n💾 Deployment details saved to: ./deployments/sonic-testnet-deployment.json");

        return deploymentInfo;

    } catch (error) {
        console.error("💥 Deployment failed with error:", error.message);
        console.log("\n🔧 Troubleshooting suggestions:");
        console.log("1. Check internet connection");
        console.log("2. Verify you have testnet S tokens");
        console.log("3. Try backup RPC: --network sonicTestnetBackup");
        console.log("4. Check Sonic Testnet status: https://testnet.sonicscan.org");
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Script failed:", error);
            process.exit(1);
        });
}

module.exports = main;