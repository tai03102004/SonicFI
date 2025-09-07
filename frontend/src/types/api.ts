// API Response - match với backend
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp?: string;
    tokens_analyzed?: number;
    [key: string]: any;
  };
}

// Backend AI Analysis Response (theo /api/ai/analyze)
export interface AIAnalysisResult {
  tokens: string[];
  analysis: {
    social_sentiment: any;
    news_sentiment: any;
    technical_analysis: any;
    research_report: {
      summary: string;
      key_insights: string[];
      recommendation: string;
      confidence_level: string;
    };
    confidence_score: number;
  };
  timestamp: string;
}

// Backend Prediction Response (theo /api/ai/predict)
export interface PredictionResult {
  predictions: Array<{
    token: string;
    current_price?: number;
    predictions?: { "24h": number; "7d": number };
    confidence?: number;
    [key: string]: any;
  }>;
  blockchain_submissions: Array<{
    token: string;
    error?: string;
    [key: string]: any;
  }>;
  user_address: string;
  stake_amount: string;
  total_predictions: number;
}

// Backend Balance Response (theo /api/blockchain/balance/:address)
export interface UserBalance {
  address: string;
  balance: string;
  currency: string;
  timestamp: string;
}

// Backend Network Response (theo /api/blockchain/network)
export interface NetworkStatus {
  [key: string]: any; // Flexible vì BE chưa define rõ structure
}

// Backend Health Response (theo /health)
export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  services: {
    ai_engine: string;
    blockchain: string;
  };
  contracts: {
    sToken: string;
    aiRegistry: string;
    knowledgeDAO: string;
    reputation: string;
  };
}
