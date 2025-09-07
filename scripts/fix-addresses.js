const {
    ethers
} = require('ethers');
const fs = require('fs');
const path = require('path');

// Verified working addresses from your deployment
const VERIFIED_ADDRESSES = {
    SToken: "0x4A80C79Ba53e1ecD18c3f340d8C5181e618B559C",
    KnowledgeDAO: "0xD59Da846F02A6C84D79C05F80CFB3B7ae2F21879",
    ReputationSystem: "0x97a2c3CA5a565F0C0c4Ee66968B382B542C01070",
    AIModelRegistry: "0x9CD763b9a34c43123a70e69168C447C3dB1d51b7"
};

async function fixAddresses() {
    console.log('🔧 Fixing contract addresses in frontend config...\n');

    // 1. Verify all addresses are correct
    console.log('📋 Verifying addresses on Sonic Testnet:');
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.soniclabs.com');

    let allValid = true;

    for (const [name, address] of Object.entries(VERIFIED_ADDRESSES)) {
        try {
            const code = await provider.getCode(address);
            const hasContract = code !== '0x' && code.length > 2;

            console.log(`${hasContract ? '✅' : '❌'} ${name}: ${address} (${code.length} bytes)`);

            if (!hasContract) {
                allValid = false;
            }
        } catch (error) {
            console.error(`❌ ${name}: Error checking ${address} - ${error.message}`);
            allValid = false;
        }
    }

    if (!allValid) {
        console.error('\n❌ Some addresses are invalid. Please check deployment.');
        return;
    }

    // 2. Update the config file
    const configPath = path.join(__dirname, '../frontend/src/contracts/config.ts');

    try {
        let configContent = fs.readFileSync(configPath, 'utf8');

        // Update each address with proper checksumming
        Object.entries(VERIFIED_ADDRESSES).forEach(([contractName, address]) => {
            // Ensure proper checksum
            const checksummedAddress = ethers.getAddress(address);

            // Pattern to match contract address in config
            const pattern = new RegExp(
                `(${contractName}:\\s*")[^"]*(")`
            );

            const replacement = `$1${checksummedAddress}$2`;
            configContent = configContent.replace(pattern, replacement);

            console.log(`✅ Updated ${contractName}: ${checksummedAddress}`);
        });

        // Update timestamp
        const timestampPattern = /timestamp: "[^"]*"/;
        const newTimestamp = `timestamp: "${new Date().toISOString()}"`;
        configContent = configContent.replace(timestampPattern, newTimestamp);

        // Write back to file
        fs.writeFileSync(configPath, configContent, 'utf8');

        console.log('\n🎉 Contract addresses fixed successfully!');
        console.log('📝 Config file updated:', configPath);

        // 3. Test the updated config
        console.log('\n🧪 Testing updated configuration...');

        // Re-read and validate
        const updatedContent = fs.readFileSync(configPath, 'utf8');

        Object.entries(VERIFIED_ADDRESSES).forEach(([name, address]) => {
            const checksummedAddress = ethers.getAddress(address);
            if (updatedContent.includes(checksummedAddress)) {
                console.log(`✅ ${name}: Address correctly updated in config`);
            } else {
                console.error(`❌ ${name}: Address not found in updated config`);
            }
        });

        console.log('\n🚀 You can now start the frontend - contracts should work!');

    } catch (error) {
        console.error('❌ Failed to update config file:', error.message);
    }
}

fixAddresses().catch(console.error);