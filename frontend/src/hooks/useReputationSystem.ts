import { useState, useCallback } from "react";
import { useContract } from "./useContract";
import { useWallet } from "./useWallet";

export const useReputationSystem = () => {
  const [reputation, setReputation] = useState<string>("0");
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useWallet();
  const { callContract, isReady } = useContract();

  const getReputation = useCallback(
    async (userAddress?: string) => {
      const targetAddress = userAddress || address;
      if (!isReady || !targetAddress) return "0";

      try {
        const rep = await callContract("ReputationSystem", "getReputation", [
          targetAddress,
        ]);

        const reputationValue = parseInt(rep, 16).toString();
        setReputation(reputationValue);
        return reputationValue;
      } catch (err: any) {
        console.error("Failed to get reputation:", err);
        setError(err.message || "Failed to get reputation");
        return "0";
      }
    },
    [callContract, isReady, address]
  );

  return {
    reputation,
    loading,
    error,
    getReputation,
    isReady,
    contractAddress: "0x97a2c3ca5a565f0c0c4ee66968b382b542c01070",
  };
};
