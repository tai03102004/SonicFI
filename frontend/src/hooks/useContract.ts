import { useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import { DEPLOYMENT_CONFIG, getContractConfig } from "../contracts/config";

export const useContract = () => {
  const { isConnected, chainId } = useWallet();

  const callContract = useCallback(
    async (
      contractName: keyof typeof DEPLOYMENT_CONFIG.contracts,
      method: string,
      params: any[] = [],
      isWrite: boolean = false
    ) => {
      if (!window.ethereum || !isConnected) {
        throw new Error("Wallet not connected");
      }

      // Fix: Check both hex and decimal format
      const targetChainId = 14601; // Sonic Testnet
      const currentChainId =
        typeof chainId === "string" ? parseInt(chainId, 16) : chainId;

      if (currentChainId !== targetChainId) {
        throw new Error(
          `Please switch to Sonic Testnet (Chain ID: ${targetChainId})`
        );
      }

      // try {
      // Debug: Log contract info trước khi gọi getContractConfig
      console.log("🔍 Contract lookup debug:", {
        contractName,
        contractNameType: typeof contractName,
        isValidKey: contractName in DEPLOYMENT_CONFIG.contracts,
        availableKeys: Object.keys(DEPLOYMENT_CONFIG.contracts),
        directLookup: DEPLOYMENT_CONFIG.contracts[contractName],
      });

      // Lấy contract config
      const { address, abi } = getContractConfig(contractName);

      console.log("🔍 Contract config retrieved:", {
        contractName,
        address,
        abiLength: abi?.length || 0,
      });

      // Validate address
      if (!address || !ethers.isAddress(address)) {
        throw new Error(
          `Invalid contract address for ${contractName}: ${address}`
        );
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // 🆕 Kiểm tra xem có code tại địa chỉ contract không
      const code = await provider.getCode(address);
      console.log("🔍 Contract code check:", {
        address,
        hasCode: code !== "0x",
        codeLength: code.length,
      });

      if (code === "0x") {
        throw new Error(
          `No contract deployed at address ${address} on chain ${currentChainId}`
        );
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(address, abi, signer);

      // 🔧 FIX: Kiểm tra method cho Human Readable ABI
      let methodExists = false;

      if (typeof abi[0] === "string") {
        // Human Readable ABI (string format)
        methodExists = abi.some((signature: string) =>
          signature.includes(`function ${method}(`)
        );

        console.log("🔍 Method check (Human Readable ABI):", {
          method,
          exists: methodExists,
          availableMethods: abi
            .filter((sig: string) => sig.includes("function"))
            .map((sig: string) => {
              const match = sig.match(/function\s+(\w+)\(/);
              return match ? match[1] : sig;
            }),
        });
      } else {
        // JSON ABI format
        methodExists = abi.some(
          (item: any) => item.type === "function" && item.name === method
        );

        console.log("🔍 Method check (JSON ABI):", {
          method,
          exists: methodExists,
          availableMethods: abi
            .filter((item: any) => item.type === "function")
            .map((item: any) => item.name),
        });
      }

      if (!methodExists) {
        throw new Error(`Method '${method}' not found in contract ABI`);
      }

      if (isWrite) {
        // Write transaction
        console.log(`📝 Writing to ${contractName}.${method}`, params);
        const tx = await contract[method](...params);
        console.log("⏳ Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed:", receipt.hash);
        return receipt;
      } else {
        // Read call
        console.log(`📖 Reading from ${contractName}.${method}`, params);

        // 🆕 Thêm try-catch riêng cho contract call
        try {
          const result = await contract[method](...params);
          console.log("✅ Read result:", result);
          return result;
        } catch (callError: any) {
          console.error("❌ Contract method call failed:", {
            method,
            params,
            error: callError.message,
            code: callError.code,
            data: callError.data,
          });

          // 🆕 Thử gọi với staticCall để debug thêm
          try {
            const staticResult = await contract[method].staticCall(...params);
            console.log("✅ Static call succeeded:", staticResult);
            return staticResult;
          } catch (staticError: any) {
            console.error("❌ Static call also failed:", staticError.message);
            throw callError;
          }
        }
      }
      // } catch (error: any) {
      //   console.error("❌ Contract call failed:", {
      //     contractName,
      //     method,
      //     params,
      //     error: error.message,
      //     stack: error.stack,
      //   });
      //   throw error;
      // }
    },
    [isConnected, chainId]
  );

  return {
    callContract,
    isReady:
      isConnected &&
      (typeof chainId === "string"
        ? parseInt(chainId, 16) === 14601
        : chainId === 14601),
  };
};
