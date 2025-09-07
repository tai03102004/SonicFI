import { useState, useCallback, useEffect } from "react";
import { useContract } from "./useContract";
import { useWallet } from "./useWallet";

export const useSToken = () => {
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useWallet();
  const { callContract, isReady } = useContract();

  const getTokenBalance = useCallback(
    async (userAddress?: string) => {
      const targetAddress = userAddress || address;
      if (!isReady || !targetAddress) return "0";

      try {
        const balance = await callContract("SToken", "balanceOf", [
          targetAddress,
        ]);

        // Convert from wei to token (assuming 18 decimals)
        const balanceFormatted = (
          parseInt(balance, 16) / Math.pow(10, 18)
        ).toFixed(4);
        setTokenBalance(balanceFormatted);
        return balanceFormatted;
      } catch (err: any) {
        console.error("Failed to get token balance:", err);
        setError(err.message || "Failed to get token balance");
        return "0";
      }
    },
    [callContract, isReady, address]
  );

  const getTotalSupply = useCallback(async () => {
    if (!isReady) return "0";

    try {
      const supply = await callContract("SToken", "totalSupply", []);

      const supplyFormatted = (parseInt(supply, 16) / Math.pow(10, 18)).toFixed(
        0
      );
      setTotalSupply(supplyFormatted);
      return supplyFormatted;
    } catch (err: any) {
      console.error("Failed to get total supply:", err);
      return "0";
    }
  }, [callContract, isReady]);

  const transfer = useCallback(
    async (to: string, amount: string) => {
      if (!isReady) {
        throw new Error("Contract not ready");
      }

      try {
        setLoading(true);
        setError(null);

        // Convert amount to wei (assuming 18 decimals)
        const amountWei = Math.floor(parseFloat(amount) * Math.pow(10, 18));

        const txHash = await callContract(
          "SToken",
          "transfer",
          [to, amountWei],
          true
        );

        console.log("Transfer submitted:", txHash);

        // Refresh balance after transfer
        setTimeout(() => {
          getTokenBalance();
        }, 3000);

        return txHash;
      } catch (err: any) {
        setError(err.message || "Transfer failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [callContract, isReady, getTokenBalance]
  );

  // Auto-fetch balance when wallet connects
  useEffect(() => {
    if (isReady && address) {
      getTokenBalance();
      getTotalSupply();
    }
  }, [isReady, address, getTokenBalance, getTotalSupply]);

  return {
    tokenBalance,
    totalSupply,
    loading,
    error,
    getTokenBalance,
    getTotalSupply,
    transfer,
    isReady,
    contractAddress: "0x4a80c79ba53e1ecd18c3f340d8c5181e618b559c",
  };
};
