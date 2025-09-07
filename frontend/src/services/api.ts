import {
  APIResponse,
  AIAnalysisResult,
  PredictionResult,
  UserBalance,
  NetworkStatus,
  HealthStatus,
} from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const HEALTH_URL =
  import.meta.env.VITE_HEALTH_URL || "http://localhost:3001/health";

/**
 * Generic API call helper with deployment optimizations
 */
async function apiCall<T = any>(
  url: string,
  method: "GET" | "POST" = "GET",
  data?: any,
  baseUrl: string = API_BASE_URL
): Promise<APIResponse<T>> {
  try {
    console.log(`🚀 API ${method}: ${baseUrl}${url}`);

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        // Add any auth headers if needed
      },
      // Add CORS handling for production
      mode:
        import.meta.env.VITE_ENVIRONMENT === "production"
          ? "cors"
          : "same-origin",
    };

    if (data && method === "POST") {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseUrl}${url}`, config);

    console.log(
      `${response.ok ? "✅" : "❌"} API Response: ${url} - ${response.status}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.error(`❌ API Error [${method} ${url}]:`, err.message);
    return {
      success: false,
      error: err.message,
      data: null,
    } as APIResponse<T>;
  }
}

/**
 * AI Service
 */
export const aiService = {
  async getAnalysis(tokens: string[]): Promise<APIResponse<AIAnalysisResult>> {
    return apiCall<AIAnalysisResult>("/ai/analyze", "POST", { tokens });
  },

  async submitPrediction(
    tokens: string[],
    user_address: string,
    stake_amount: string = "100"
  ): Promise<APIResponse<PredictionResult>> {
    return apiCall<PredictionResult>("/ai/predict", "POST", {
      tokens,
      user_address,
      stake_amount,
    });
  },

  async getResearch(tokens: string[]): Promise<APIResponse<any>> {
    return apiCall("/ai/research", "POST", { tokens });
  },

  async checkHealth(): Promise<APIResponse<any>> {
    return apiCall("/ai/health");
  },
};

/**
 * Blockchain Service
 */
export const blockchainService = {
  async getUserBalance(address: string): Promise<APIResponse<UserBalance>> {
    return apiCall<UserBalance>(`/blockchain/balance/${address}`);
  },

  async getNetworkStatus(): Promise<APIResponse<NetworkStatus>> {
    return apiCall<NetworkStatus>("/blockchain/network");
  },
};

/**
 * Health Service
 */
export const healthService = {
  async checkHealth(): Promise<HealthStatus> {
    const response = await apiCall<HealthStatus>(
      "",
      "GET",
      undefined,
      HEALTH_URL
    );
    return response.data as HealthStatus;
  },
};

/**
 * Main API Service (for backward compatibility)
 */
class APIService {
  // AI methods
  async getAnalysis(tokens: string[]): Promise<APIResponse<AIAnalysisResult>> {
    return aiService.getAnalysis(tokens);
  }

  async submitPrediction(
    tokens: string[],
    user_address: string,
    stake_amount: string = "10"
  ): Promise<APIResponse<PredictionResult>> {
    return aiService.submitPrediction(tokens, user_address, stake_amount);
  }

  async getResearch(tokens: string[]): Promise<APIResponse<any>> {
    return aiService.getResearch(tokens);
  }

  async checkAIHealth(): Promise<APIResponse<any>> {
    return aiService.checkHealth();
  }

  // Blockchain methods
  async getUserBalance(address: string): Promise<APIResponse<UserBalance>> {
    return blockchainService.getUserBalance(address);
  }

  async getNetworkStatus(): Promise<APIResponse<NetworkStatus>> {
    return blockchainService.getNetworkStatus();
  }

  // Health method
  async checkHealth(): Promise<HealthStatus> {
    return healthService.checkHealth();
  }
}

// Export singleton
export default new APIService();
