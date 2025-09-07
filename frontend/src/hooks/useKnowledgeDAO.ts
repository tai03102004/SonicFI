import { useState, useCallback } from "react";
import { useContract } from "./useContract";

export const useKnowledgeDAO = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { callContract, isReady } = useContract();

  const submitProposal = useCallback(
    async (
      title: string,
      description: string,
      votingDurationHours: number = 24
    ) => {
      if (!isReady) {
        throw new Error("Contract not ready");
      }

      try {
        setLoading(true);
        setError(null);

        const votingDuration = votingDurationHours * 3600; // Convert to seconds

        const txHash = await callContract(
          "KnowledgeDAO",
          "submitProposal",
          [title, description, votingDuration],
          true
        );

        console.log("Proposal submitted:", txHash);
        return txHash;
      } catch (err: any) {
        setError(err.message || "Failed to submit proposal");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [callContract, isReady]
  );

  const vote = useCallback(
    async (proposalId: number, support: boolean) => {
      if (!isReady) {
        throw new Error("Contract not ready");
      }

      try {
        setLoading(true);
        setError(null);

        const txHash = await callContract(
          "KnowledgeDAO",
          "vote",
          [proposalId, support],
          true
        );

        console.log("Vote cast:", txHash);
        return txHash;
      } catch (err: any) {
        setError(err.message || "Failed to cast vote");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [callContract, isReady]
  );

  const getProposals = useCallback(async () => {
    if (!isReady) return [];

    try {
      setLoading(true);
      setError(null);

      // 🔧 FIX: Change from getProposalCount to proposalCount
      const count = await callContract("KnowledgeDAO", "proposalCount", []);
      const proposalCount = parseInt(count.toString());

      const proposalPromises = [];
      for (let i = 1; i <= proposalCount; i++) {
        proposalPromises.push(callContract("KnowledgeDAO", "getProposal", [i]));
      }

      const proposalResults = await Promise.all(proposalPromises);
      setProposals(proposalResults);
      return proposalResults;
    } catch (err: any) {
      setError(err.message || "Failed to fetch proposals");
      return [];
    } finally {
      setLoading(false);
    }
  }, [callContract, isReady]);

  return {
    proposals,
    loading,
    error,
    submitProposal,
    vote,
    getProposals,
    isReady,
  };
};
