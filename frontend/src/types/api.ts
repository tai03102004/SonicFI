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

// Updated AI Analysis Response - khớp với dữ liệu thực tế
export interface AIAnalysisResult {
  nlp_analysis: {
    social_sentiment: any;
    news_sentiment: any;
    technical_analysis: any;
    confidence_score?: number;
    status?: string;
    processing_time?: string;
    data_sources?: string[];
  };
  research_report: {
    analysis: {
      executive_summary: string;
      key_findings: any;
      market_sentiment: string;
      risk_assessment: string;
      price_targets: any;
      confidence_score: number;
    };
    content_hash: string;
    timestamp: string;
    blockchain_verified: boolean;
    ai_models_used: string[];
  };
  tokens_analyzed: string[];
  timestamp: string;
  overall_confidence: number;
  market_signals: Array<{
    token: string;
    signal: string;
    strength: number;
    timeframe: string;
    risk_reward: string;
    stop_loss: number;
    take_profit: number;
  }>;
}

// Giữ nguyên legacy interface cho compatibility (nếu cần)
export interface LegacyAIAnalysisResult {
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
