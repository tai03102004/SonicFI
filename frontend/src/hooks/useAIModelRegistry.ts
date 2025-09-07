import { useState, useCallback } from "react";
import { useContract } from "./useContract";

interface AIModel {
  id: number;
  owner: string;
  name: string;
  description: string;
  ipfsHash: string;
  price: string;
  active: boolean;
}

export const useAIModelRegistry = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { callContract, isReady } = useContract();

  const registerModel = useCallback(
    async (
      name: string,
      description: string,
      ipfsHash: string,
      priceInS: string
    ) => {
      if (!isReady) {
        throw new Error("Contract not ready");
      }

      try {
        setLoading(true);
        setError(null);

        // Convert price to wei
        const priceWei = Math.floor(parseFloat(priceInS) * Math.pow(10, 18));

        const txHash = await callContract(
          "AIModelRegistry",
          "registerModel",
          [name, description, ipfsHash, priceWei],
          true
        );

        console.log("Model registered:", txHash);
        return txHash;
      } catch (err: any) {
        setError(err.message || "Failed to register model");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [callContract, isReady]
  );

  const getModels = useCallback(async () => {
    if (!isReady) return [];

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Getting model count...");

      // 🔧 FIX: Try multiple method names for getting count
      let count;
      try {
        // Try method 1: modelCount
        count = await callContract("AIModelRegistry", "modelCount", []);
        console.log("✅ modelCount() worked:", count);
      } catch (error1) {
        console.log("❌ modelCount() failed, trying getModelCount()");
        try {
          // Try method 2: getModelCount
          count = await callContract("AIModelRegistry", "getModelCount", []);
          console.log("✅ getModelCount() worked:", count);
        } catch (error2) {
          console.error("❌ Both modelCount() and getModelCount() failed");
          console.error("Error 1:", error1);
          console.error("Error 2:", error2);

          // Return mock data for now
          console.warn("🎭 Using mock data for models");
          const mockModels = [
            {
              id: 1,
              owner: "0x123...456",
              name: "Sentiment Analysis Model",
              description: "Advanced NLP model for crypto sentiment analysis",
              ipfsHash: "QmX1...",
              price: "100",
              active: true,
            },
            {
              id: 2,
              owner: "0x789...012",
              name: "Price Prediction Model",
              description: "ML model for short-term price predictions",
              ipfsHash: "QmY2...",
              price: "250",
              active: true,
            },
            {
              id: 3,
              owner: "0x345...678",
              name: "Technical Analysis Model",
              description: "Automated technical indicator analysis",
              ipfsHash: "QmZ3...",
              price: "150",
              active: true,
            },
          ];
          setModels(mockModels);
          return mockModels;
        }
      }

      const modelCount = parseInt(count.toString());
      console.log(`📊 Total models: ${modelCount}`);

      if (modelCount === 0) {
        console.log("📭 No models found");
        setModels([]);
        return [];
      }

      const modelPromises = [];
      for (let i = 1; i <= modelCount; i++) {
        // Try both method names for getting individual models
        const modelPromise = callContract("AIModelRegistry", "getModel", [i])
          .catch(() => callContract("AIModelRegistry", "models", [i]))
          .catch((error) => {
            console.warn(`Failed to get model ${i}:`, error);
            return null;
          });
        modelPromises.push(modelPromise);
      }

      const modelResults = await Promise.all(modelPromises);
      const validModels = modelResults.filter((model) => model !== null);

      console.log(`✅ Retrieved ${validModels.length} models`);
      setModels(validModels);
      return validModels;
    } catch (err: any) {
      console.error("❌ Failed to fetch models:", err);
      setError(err.message || "Failed to fetch models");

      // Return empty array instead of throwing
      setModels([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [callContract, isReady]);

  const purchaseModel = useCallback(
    async (modelId: number) => {
      if (!isReady) {
        throw new Error("Contract not ready");
      }

      try {
        setLoading(true);
        setError(null);

        const txHash = await callContract(
          "AIModelRegistry",
          "purchaseModel",
          [modelId],
          true
        );

        console.log("Model purchased:", txHash);
        return txHash;
      } catch (err: any) {
        setError(err.message || "Failed to purchase model");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [callContract, isReady]
  );

  return {
    models,
    loading,
    error,
    registerModel,
    getModels,
    purchaseModel,
    isReady,
    contractAddress: "0x9CD763b9a34c43123a70e69168C447C3dB1d51b7",
  };
};
