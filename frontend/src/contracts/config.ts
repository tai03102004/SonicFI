import { CONTRACT_ABIS } from "./abis";
import { ContractConfig, DeploymentInfo } from "./types";
import { ethers } from "ethers";

export const DEPLOYMENT_CONFIG: DeploymentInfo = {
  network: "Sonic Testnet",
  chainId: 14601,
  deployer: "0x3b188255700eb8fcf4bc8F604441AB3bb4a30163",
  timestamp: "2025-09-07T07:55:24.020Z",
  contracts: {
    SToken: "0x4A80C79Ba53e1ecD18c3f340d8C5181e618B559C",
    KnowledgeDAO: "0xD59Da846F02A6C84D79C05F80CFB3B7ae2F21879",
    ReputationSystem: "0x97a2c3CA5a565F0C0c4Ee66968B382B542C01070",
    AIModelRegistry: "0x9CD763b9a34c43123a70e69168C447C3dB1d51b7",
  },
  gasUsed: "Total deployment: ~0.2 S",
  verified: true,
};

export const getContractConfig = (
  contractName: keyof typeof DEPLOYMENT_CONFIG.contracts
): ContractConfig => {
  console.log("🔍 getContractConfig called with:", contractName);
  console.log(
    "🔍 Available contracts:",
    Object.keys(DEPLOYMENT_CONFIG.contracts)
  );

  const rawAddress = DEPLOYMENT_CONFIG.contracts[contractName];
  const abi = CONTRACT_ABIS[contractName];

  console.log("🔍 Raw lookup:", { contractName, rawAddress, hasAbi: !!abi });

  if (!rawAddress) {
    throw new Error(
      `Contract address not found for: ${contractName}. Available contracts: ${Object.keys(
        DEPLOYMENT_CONFIG.contracts
      ).join(", ")}`
    );
  }

  if (!abi || !Array.isArray(abi)) {
    throw new Error(
      `Contract ABI not found for: ${contractName}. Available ABIs: ${Object.keys(
        CONTRACT_ABIS
      ).join(", ")}`
    );
  }

  // 🔧 FIX: Use ethers.getAddress for proper checksumming
  let checksummedAddress: string;
  try {
    checksummedAddress = ethers.getAddress(rawAddress);
  } catch (error) {
    console.error(
      `❌ Invalid address format for ${contractName}: ${rawAddress}`
    );
    throw new Error(
      `Invalid address format for ${contractName}: ${rawAddress}`
    );
  }

  console.log("🔍 Final config:", {
    contractName,
    original: rawAddress,
    checksummed: checksummedAddress,
    abiLength: abi.length,
  });

  return {
    address: checksummedAddress,
    abi,
  };
};

// Enhanced contract validation with better error messages
export const validateContractsOnChain = async () => {
  if (!window.ethereum) {
    console.error("❌ No wallet found");
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contracts = Object.entries(DEPLOYMENT_CONFIG.contracts);

    console.log("🔍 Validating contracts on Sonic Testnet...");

    const results = [];
    let allValid = true;

    for (const [name, address] of contracts) {
      try {
        console.log(`🔍 Checking ${name} at ${address}...`);

        // Ensure proper checksum
        const checksummedAddress = ethers.getAddress(address);
        console.log(`   Checksummed: ${checksummedAddress}`);

        const code = await provider.getCode(checksummedAddress);
        const hasCode = code !== "0x" && code.length > 2;

        if (hasCode) {
          console.log(`✅ ${name}: Contract found (${code.length} bytes)`);
          results.push({
            name,
            address: checksummedAddress,
            deployed: true,
            codeLength: code.length,
          });
        } else {
          console.error(`❌ ${name}: NO CONTRACT at ${checksummedAddress}`);
          results.push({
            name,
            address: checksummedAddress,
            deployed: false,
          });
          allValid = false;
        }
      } catch (error: any) {
        console.error(`❌ ${name}: Error - ${error.message}`);
        results.push({
          name,
          address,
          error: error.message,
        });
        allValid = false;
      }
    }

    // Show detailed results
    console.table(results);

    const deployedCount = results.filter((r) => r.deployed).length;
    const totalCount = results.length;

    console.log(
      `\n📊 Validation Summary: ${deployedCount}/${totalCount} contracts valid`
    );

    return allValid;
  } catch (error) {
    console.error("❌ Failed to validate contracts:", error);
    return false;
  }
};

// Helper function to validate all contracts
export const validateDeployment = () => {
  console.log("🔍 Validating deployment configuration...");
  console.log("📋 Config contracts:", DEPLOYMENT_CONFIG.contracts);
  console.log("📋 Available ABIs:", Object.keys(CONTRACT_ABIS));

  const contractNames = Object.keys(DEPLOYMENT_CONFIG.contracts) as Array<
    keyof typeof DEPLOYMENT_CONFIG.contracts
  >;
  const errors: string[] = [];

  contractNames.forEach((contractName) => {
    try {
      const config = getContractConfig(contractName);
      console.log(
        `✅ ${contractName}: ${config.address} (ABI: ${config.abi.length} entries)`
      );
    } catch (error: any) {
      console.error(`❌ ${contractName}: ${error.message}`);
      errors.push(`${contractName}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error("❌ Contract validation failed:", errors);
    return false;
  }

  console.log("✅ All contract configurations validated successfully");
  return true;
};

// Test function to verify addresses work
export const testContractAddresses = async () => {
  console.log("🧪 Testing contract addresses...");

  try {
    const provider = new ethers.JsonRpcProvider(
      "https://rpc.testnet.soniclabs.com"
    );

    const tests = [
      // Test the exact addresses from your verification
      { name: "SToken", address: "0x4A80C79Ba53e1ecD18c3f340d8C5181e618B559C" },
      {
        name: "KnowledgeDAO",
        address: "0xD59Da846F02A6C84D79C05F80CFB3B7ae2F21879",
      },
      {
        name: "ReputationSystem",
        address: "0x97a2c3CA5a565F0C0c4Ee66968B382B542C01070",
      },
      {
        name: "AIModelRegistry",
        address: "0x9CD763b9a34c43123a70e69168C447C3dB1d51b7",
      },
    ];

    for (const test of tests) {
      const code = await provider.getCode(test.address);
      const hasContract = code !== "0x" && code.length > 2;
      console.log(
        `${hasContract ? "✅" : "❌"} ${test.name}: ${test.address} (${
          code.length
        } bytes)`
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};
