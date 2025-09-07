import { ethers } from "ethers";

export const debugContractIssue = async () => {
  console.log("🔍 DEBUGGING CONTRACT ISSUE - Step by step...\n");

  // 1. Check MetaMask Provider
  if (!window.ethereum) {
    console.error("❌ MetaMask not found");
    return;
  }

  try {
    console.log("1️⃣ MetaMask Provider Check:");
    console.log("   Provider exists:", !!window.ethereum);
    console.log("   Is MetaMask:", window.ethereum.isMetaMask);

    // 2. Create Provider
    console.log("\n2️⃣ Creating Provider...");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    console.log("   Network:", {
      chainId: Number(network.chainId),
      name: network.name,
    });

    // 3. Check Account
    console.log("\n3️⃣ Account Check...");
    const accounts = await provider.listAccounts();
    console.log(
      "   Accounts:",
      accounts.map((acc) => acc.address)
    );

    // 4. Test Contract Address - Your EXACT address
    const TEST_ADDRESS = "0x9CD763b9a34c43123a70e69168C447C3dB1d51b7";

    console.log(`\n4️⃣ Testing Contract: ${TEST_ADDRESS}`);

    // Direct call through MetaMask
    console.log("   Method 1: Through MetaMask Provider...");
    const metamaskCode = await provider.getCode(TEST_ADDRESS);
    console.log("   MetaMask result:", {
      hasCode: metamaskCode !== "0x",
      length: metamaskCode.length,
      preview: metamaskCode.substring(0, 42) + "...",
    });

    // Direct RPC call
    console.log("\n   Method 2: Direct RPC call...");
    const directProvider = new ethers.JsonRpcProvider(
      "https://rpc.testnet.soniclabs.com"
    );
    const directCode = await directProvider.getCode(TEST_ADDRESS);
    console.log("   Direct RPC result:", {
      hasCode: directCode !== "0x",
      length: directCode.length,
      preview: directCode.substring(0, 42) + "...",
    });

    // 5. Compare Results
    console.log("\n5️⃣ COMPARISON:");
    console.log("   Codes match:", metamaskCode === directCode);
    console.log(
      "   MetaMask working:",
      metamaskCode !== "0x" && metamaskCode.length > 2
    );
    console.log(
      "   Direct RPC working:",
      directCode !== "0x" && directCode.length > 2
    );

    // 6. Test Raw JSON-RPC Call through MetaMask
    console.log("\n6️⃣ Raw JSON-RPC through MetaMask...");
    try {
      const rawResult = await window.ethereum.request({
        method: "eth_getCode",
        params: [TEST_ADDRESS, "latest"],
      });
      console.log("   Raw MetaMask eth_getCode:", {
        result: rawResult,
        hasCode: rawResult !== "0x",
        length: rawResult.length,
      });
    } catch (rawError) {
      console.error("   Raw call failed:", rawError);
    }

    // 7. Final Assessment
    console.log("\n🎯 FINAL ASSESSMENT:");
    const metamaskWorks = metamaskCode !== "0x" && metamaskCode.length > 2;
    const directWorks = directCode !== "0x" && directCode.length > 2;

    if (metamaskWorks && directWorks) {
      console.log("✅ BOTH WORK - Issue elsewhere!");
      return "BOTH_WORK";
    } else if (!metamaskWorks && directWorks) {
      console.log("❌ METAMASK ISSUE - Contract exists but MM can't see it");
      return "METAMASK_ISSUE";
    } else if (!metamaskWorks && !directWorks) {
      console.log("❌ CONTRACT NOT DEPLOYED - Both fail");
      return "NO_CONTRACT";
    } else {
      console.log("⚠️ WEIRD STATE - Direct fails but MM works");
      return "WEIRD_STATE";
    }
  } catch (error: any) {
    console.error("❌ Debug failed:", error.message);
    return "DEBUG_FAILED";
  }
};

// Export for browser console
(window as any).debugContract = debugContractIssue;
