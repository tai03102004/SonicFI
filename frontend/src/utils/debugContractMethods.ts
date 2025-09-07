import { ethers } from "ethers";

export const debugContractMethods = async () => {
  console.log("🔍 DEBUGGING CONTRACT METHODS...\n");

  const CONTRACT_ADDRESS = "0x9CD763b9a34c43123a70e69168C447C3dB1d51b7";

  if (!window.ethereum) {
    console.error("❌ MetaMask not found");
    return;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);

    console.log("1️⃣ Testing direct method calls...");

    // Test possible method names and their function selectors
    const methodTests = [
      { name: "modelCount()", selector: "0x4989dbb0" },
      { name: "getModelCount()", selector: "0xef8a4c39" },
      { name: "totalModels()", selector: "0x??? " },
    ];

    for (const test of methodTests) {
      try {
        console.log(`\n🧪 Testing ${test.name}...`);

        // Raw call with function selector
        const result = await provider.call({
          to: CONTRACT_ADDRESS,
          data: test.selector,
        });

        console.log(`✅ ${test.name} result:`, result);

        // Try to decode as uint256
        if (result !== "0x") {
          const decoded = parseInt(result, 16);
          console.log(`   Decoded value: ${decoded}`);
        }
      } catch (error: any) {
        console.log(`❌ ${test.name} failed:`, error.message);
      }
    }

    console.log("\n2️⃣ Checking contract interface...");

    // Get contract bytecode to understand what methods exist
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log(`Contract size: ${code.length} bytes`);

    // Common function selectors for count methods
    const commonSelectors = [
      "0x4989dbb0", // modelCount()
      "0xef8a4c39", // getModelCount()
      "0x8da5cb5b", // owner()
      "0x06fdde03", // name()
    ];

    console.log("\n3️⃣ Testing common selectors...");

    for (const selector of commonSelectors) {
      try {
        const result = await provider.call({
          to: CONTRACT_ADDRESS,
          data: selector,
        });

        if (result !== "0x") {
          console.log(
            `✅ Selector ${selector}: ${result} (decoded: ${parseInt(
              result,
              16
            )})`
          );
        } else {
          console.log(`⚪ Selector ${selector}: empty response`);
        }
      } catch (error: any) {
        console.log(`❌ Selector ${selector}: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Debug failed:", error);
  }
};

// Export for browser console
(window as any).debugContractMethods = debugContractMethods;
