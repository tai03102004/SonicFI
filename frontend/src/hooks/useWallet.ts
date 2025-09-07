import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (data: any) => void) => void;
      removeListener: (event: string, handler: (data: any) => void) => void;
    };
  }
}

interface WalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: string | null;
  networkName: string | null;
}

const SONIC_TESTNET = {
  chainId: "0x3909",
  chainName: "Sonic Testnet",
  nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.soniclabs.com"],
  blockExplorerUrls: ["https://testnet.soniclabs.com"],
};

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    networkName: null,
  });

  const [error, setError] = useState<string | null>(null);

  const isMetaMaskInstalled = useCallback(() => {
    return (
      typeof window !== "undefined" &&
      typeof window.ethereum !== "undefined" &&
      window.ethereum.isMetaMask === true
    );
  }, []);

  const switchToSonicTestnet = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");

    try {
      console.log("🔄 Switching to Sonic Testnet (ChainId: 14601)..."); // ✅ FIXED comment

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SONIC_TESTNET.chainId }],
      });

      console.log("✅ Switched to Sonic Testnet");
    } catch (switchError: any) {
      console.log(
        "⚠️ Network not found, adding...",
        switchError.code,
        switchError.message
      );

      // Handle various error codes
      if (
        switchError.code === 4902 ||
        switchError.code === -32603 ||
        switchError.message?.includes("Unrecognized") ||
        switchError.message?.includes("does not match")
      ) {
        try {
          console.log("🔄 Adding Sonic Testnet network...");

          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SONIC_TESTNET],
          });

          console.log("✅ Added Sonic Testnet successfully");

          // Wait a moment then try to switch again
          await new Promise((resolve) => setTimeout(resolve, 1000));

          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SONIC_TESTNET.chainId }],
          });

          console.log("✅ Switched to newly added network");
        } catch (addError: any) {
          console.error("❌ Failed to add network:", addError);
          throw new Error(`Failed to add Sonic Testnet: ${addError.message}`);
        }
      } else {
        throw switchError;
      }
    }
  };

  const getBalance = async (address: string) => {
    try {
      console.log("windown ethereum", window.ethereum);
      if (!window.ethereum) return "0.0000";

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });

      const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18);
      console.log(`💰 Raw balance: ${balance} hex = ${balanceInEther} S`);

      return balanceInEther.toFixed(4);
    } catch (err) {
      console.error("Failed to get balance:", err);
      return "0.0000";
    }
  };

  const connect = useCallback(async () => {
    console.log("🔄 Starting wallet connection...");

    if (!isMetaMaskInstalled()) {
      const errorMsg =
        "MetaMask not installed. Please install MetaMask extension.";
      console.error("❌", errorMsg);
      setError(errorMsg);
      return false;
    }

    try {
      setWallet((prev) => ({ ...prev, isConnecting: true }));
      setError(null);

      console.log("🔄 Requesting accounts...");

      const accounts = await window.ethereum!.request({
        method: "eth_requestAccounts",
      });

      console.log("📝 Accounts received:", accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];
      console.log("✅ Connected address:", address);

      const chainId = await window.ethereum!.request({
        method: "eth_chainId",
      });

      console.log(
        "🔗 Current chain ID:",
        chainId,
        "Expected:",
        SONIC_TESTNET.chainId
      );

      // Get balance first
      const balance = await getBalance(address);
      console.log("💰 Balance:", balance);

      // Update wallet state first
      setWallet({
        address,
        balance,
        isConnected: true,
        isConnecting: false,
        chainId,
        networkName:
          chainId === SONIC_TESTNET.chainId
            ? SONIC_TESTNET.chainName
            : "Unknown Network",
      });

      // Then handle network switching if needed
      if (chainId !== SONIC_TESTNET.chainId) {
        console.log("⚠️ Wrong network detected");
        setError("Please switch to Sonic Testnet for full functionality");

        // Auto-switch after a delay to let user see the wallet is connected
        setTimeout(() => {
          switchToSonicTestnet().catch((err) => {
            console.error("Auto switch failed:", err);
            setError("Please manually switch to Sonic Testnet");
          });
        }, 2000);
      } else {
        setError(null);
      }

      console.log("✅ Wallet connected successfully!");
      return true;
    } catch (err: any) {
      console.error("❌ Wallet connection failed:", err);

      let errorMessage = "Failed to connect wallet";
      if (err.code === 4001) {
        errorMessage = "User rejected connection";
      } else if (err.code === -32002) {
        errorMessage =
          "Connection request already pending. Please check MetaMask.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setWallet((prev) => ({ ...prev, isConnecting: false }));
      return false;
    }
  }, [isMetaMaskInstalled]);

  const disconnect = useCallback(() => {
    console.log("🔄 Disconnecting wallet...");
    setWallet({
      address: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      networkName: null,
    });
    setError(null);
    console.log("✅ Wallet disconnected");
  }, []);

  const refreshBalance = useCallback(async () => {
    if (wallet.address) {
      console.log("🔄 Refreshing balance...");
      const balance = await getBalance(wallet.address);
      setWallet((prev) => ({ ...prev, balance }));
    }
  }, [wallet.address]);

  // Event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("🔄 Accounts changed:", accounts);
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWallet((prev) => ({ ...prev, address: accounts[0] }));
        getBalance(accounts[0]).then((balance) =>
          setWallet((prev) => ({ ...prev, balance }))
        );
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log(
        "🔄 Chain changed to:",
        chainId,
        "Expected:",
        SONIC_TESTNET.chainId
      );

      setWallet((prev) => ({
        ...prev,
        chainId,
        networkName:
          chainId === SONIC_TESTNET.chainId
            ? SONIC_TESTNET.chainName
            : "Unknown Network",
      }));

      if (chainId !== SONIC_TESTNET.chainId) {
        setError("Please switch to Sonic Testnet for full functionality");
      } else {
        setError(null);
        console.log("✅ Now on correct Sonic Testnet");
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  // Auto-connect check
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        console.log("🔄 Checking existing connection...");

        const accounts = await window.ethereum!.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          console.log("✅ Found existing connection, auto-connecting...");

          const address = accounts[0];
          const chainId = await window.ethereum!.request({
            method: "eth_chainId",
          });
          const balance = await getBalance(address);

          setWallet({
            address,
            balance,
            isConnected: true,
            isConnecting: false,
            chainId,
            networkName:
              chainId === SONIC_TESTNET.chainId
                ? SONIC_TESTNET.chainName
                : "Unknown Network",
          });

          if (chainId !== SONIC_TESTNET.chainId) {
            setError("Please switch to Sonic Testnet for full functionality");
          }
        } else {
          console.log("ℹ️ No existing connection found");
        }
      } catch (err) {
        console.log("⚠️ Auto-connect check failed:", err);
      }
    };

    const timer = setTimeout(checkConnection, 500);
    return () => clearTimeout(timer);
  }, [isMetaMaskInstalled]);

  return {
    ...wallet,
    error,
    connect,
    disconnect,
    refreshBalance,
    switchToSonicTestnet,
    isMetaMaskInstalled,
    formatAddress: (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`,
    formatBalance: (bal: string) => `${parseFloat(bal).toFixed(2)} S`,
  };
};
