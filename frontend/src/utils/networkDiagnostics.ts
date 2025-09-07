import { ethers } from "ethers";
import { DEPLOYMENT_CONFIG } from "../contracts/config";

export const diagnoseNetworkIssue = async () => {
  console.log("🔍 Starting network diagnostics...\n");

  // 1. Check MetaMask connection
  if (!window.ethereum) {
    console.error("❌ MetaMask not found");
    return { success: false, error: "MetaMask not installed" };
  }

  try {
    // 2. Get current network from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const accounts = await provider.listAccounts();

    console.log("🔍 MetaMask Network Info:");
    console.log(`   Chain ID: ${Number(network.chainId)} (expected: 14601)`);
    console.log(`   Network Name: ${network.name}`);
    console.log(`   Connected Account: ${accounts[0]?.address || "None"}`);

    // 3. Check if on correct network
    if (Number(network.chainId) !== 14601) {
      console.error("❌ Wrong network! Please switch to Sonic Testnet");
      return {
        success: false,
        error: `Wrong network. Current: ${Number(
          network.chainId
        )}, Expected: 14601`,
      };
    }

    // 4. Test direct RPC connection
    console.log("\n🔍 Testing direct RPC connection...");
    const directProvider = new ethers.JsonRpcProvider(
      "https://rpc.testnet.soniclabs.com"
    );
    const directNetwork = await directProvider.getNetwork();
    console.log(`   Direct RPC Chain ID: ${Number(directNetwork.chainId)}`);

    // 5. Compare contract code between providers
    console.log("\n🔍 Comparing contract code between providers...");
    const results = [];

    for (const [name, address] of Object.entries(DEPLOYMENT_CONFIG.contracts)) {
      try {
        // MetaMask provider
        const metamaskCode = await provider.getCode(address);

        // Direct RPC provider
        const directCode = await directProvider.getCode(address);

        const metamaskHasCode =
          metamaskCode !== "0x" && metamaskCode.length > 2;
        const directHasCode = directCode !== "0x" && directCode.length > 2;

        console.log(`   ${name}:`);
        console.log(
          `     MetaMask: ${metamaskHasCode ? "✅" : "❌"} (${
            metamaskCode.length
          } bytes)`
        );
        console.log(
          `     Direct RPC: ${directHasCode ? "✅" : "❌"} (${
            directCode.length
          } bytes)`
        );
        console.log(`     Match: ${metamaskCode === directCode ? "✅" : "❌"}`);

        results.push({
          contract: name,
          address,
          metamaskWorking: metamaskHasCode,
          directWorking: directHasCode,
          codesMatch: metamaskCode === directCode,
        });
      } catch (error: any) {
        console.error(`     Error checking ${name}: ${error.message}`);
        results.push({
          contract: name,
          address,
          error: error.message,
        });
      }
    }

    console.log("\n📊 Summary:");
    console.table(results);

    const allWorking = results.every(
      (r) => r.metamaskWorking && r.directWorking
    );

    if (allWorking) {
      console.log("✅ All contracts accessible through MetaMask!");
      return { success: true, results };
    } else {
      console.log("❌ Some contracts not accessible through MetaMask");
      return { success: false, results };
    }
  } catch (error: any) {
    console.error("❌ Diagnostic failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Helper to switch to Sonic Testnet
export const switchToSonicTestnet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    // First try to switch
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x3909" }], // 14601 in hex
    });

    console.log("✅ Switched to Sonic Testnet");
    return true;
  } catch (switchError: any) {
    // If network not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x3909",
              chainName: "Sonic Testnet",
              nativeCurrency: {
                name: "Sonic",
                symbol: "S",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.testnet.soniclabs.com"],
              blockExplorerUrls: ["https://testnet.soniclabs.com"],
            },
          ],
        });

        console.log("✅ Added and switched to Sonic Testnet");
        return true;
      } catch (addError) {
        console.error("❌ Failed to add Sonic Testnet:", addError);
        throw addError;
      }
    } else {
      console.error("❌ Failed to switch network:", switchError);
      throw switchError;
    }
  }
};

// Export for browser console
(window as any).diagnoseNetwork = diagnoseNetworkIssue;
(window as any).switchToSonic = switchToSonicTestnet;
