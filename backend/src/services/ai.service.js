import axios from "axios";

export class AIService {
  constructor() {
    this.aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:3001";
  }

  /**
   * Get comprehensive market analysis from AI engine
   */
  async getMarketAnalysis(tokens) {
    // try {
    console.log(`🤖 Requesting AI analysis for: ${tokens.join(", ")}`);

    const response = await axios.post(
      `${this.aiEngineUrl}/analyze`, {
        tokens,
      }, {
        headers: {
          "Content-Type": "application/json"
        },
      }
    );

    console.log("Response", response);

    if (!response.data || !response.data.success) {
      throw new Error("AI engine returned invalid response");
    }

    return response.data;
    // } catch (error) {
    //   console.error("❌ AI analysis failed:", error.message);
    //   throw new Error(`AI analysis failed: ${error.message}`);
    // }
  }

  /**
   * Get price predictions from AI engine
   */
  async getPredictions(tokens, userAddress) {
    try {
      console.log(`🎯 Requesting predictions for: ${tokens.join(", ")}`);

      const response = await axios.post(
        `${this.aiEngineUrl}/predict`, {
          tokens,
          user_address: userAddress,
          timeframes: ["1h", "24h", "7d"],
        }, {
          timeout: 30000
        }
      );

      if (!response.data || !response.data.success) {
        throw new Error("AI prediction service returned invalid response");
      }

      return response.data.predictions;
    } catch (error) {
      console.error("❌ AI prediction failed:", error.message);
      throw new Error(`AI prediction failed: ${error.message}`);
    }
  }

  /**
   * Get research report from AI engine
   */
  async getResearchReport(tokens) {
    try {
      console.log(`📊 Requesting research report for: ${tokens.join(", ")}`);

      const response = await axios.post(
        `${this.aiEngineUrl}/research`, {
          tokens,
        }, {
          timeout: 45000
        }
      );

      return response.data;
    } catch (error) {
      console.error("❌ Research generation failed:", error.message);
      throw new Error(`Research generation failed: ${error.message}`);
    }
  }

  /**
   * Check AI engine health
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.aiEngineUrl}/health`, {
        timeout: 5000,
      });

      return {
        status: "healthy",
        ai_engine: response.data,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }
}