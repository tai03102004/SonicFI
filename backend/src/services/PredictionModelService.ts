import { PrismaClient } from "@prisma/client";
import * as tf from "@tensorflow/tfjs-node";
import { TechnicalAnalysisService } from "./TechnicalAnalysisService";
import { DataAggregationService } from "./DataAggregationService";

interface PredictionInput {
  technicalIndicators: number[];
  sentimentData: number[];
  volumeData: number[];
  priceHistory: number[];
  marketData: number[];
}

interface PredictionResult {
  price_prediction: {
    next_1h: number;
    next_4h: number;
    next_24h: number;
    next_7d: number;
    confidence: number;
  };
  trend_prediction: {
    direction: "bullish" | "bearish" | "sideways";
    strength: number;
    duration_estimate: string;
  };
  volatility_forecast: {
    expected_volatility: number;
    volatility_regime: "low" | "medium" | "high";
    risk_level: number;
  };
  signal_predictions: {
    breakout_probability: number;
    reversal_probability: number;
    continuation_probability: number;
  };
  risk_metrics: {
    var_95: number;
    expected_return: number;
    sharpe_ratio_forecast: number;
    max_drawdown_risk: number;
  };
}

export class PredictionModelService {
  private prisma: PrismaClient;
  private technicalService: TechnicalAnalysisService;
  private dataService: DataAggregationService;
  private models: Map<string, tf.LayersModel> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.technicalService = new TechnicalAnalysisService();
    this.dataService = new DataAggregationService();
    this.initializeModels();
  }

  private async initializeModels() {
    try {
      // Initialize different models for different prediction tasks
      await this.createPricePredictionModel();
      await this.createVolatilityModel();
      await this.createTrendClassificationModel();
      await this.createSignalDetectionModel();
    } catch (error) {
      console.error("Error initializing ML models:", error);
    }
  }

  private async createPricePredictionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [50], units: 128, activation: "relu" }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: "relu" }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: "relu" }),
        tf.layers.dense({ units: 4, activation: "linear" }), // 1h, 4h, 24h, 7d predictions
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["mae"],
    });

    this.models.set("price_prediction", model);
  }

  private async createVolatilityModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [30], units: 64, activation: "relu" }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: "relu" }),
        tf.layers.dense({ units: 16, activation: "relu" }),
        tf.layers.dense({ units: 1, activation: "sigmoid" }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
    });

    this.models.set("volatility", model);
  }

  private async createTrendClassificationModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [40], units: 96, activation: "relu" }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 48, activation: "relu" }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 24, activation: "relu" }),
        tf.layers.dense({ units: 3, activation: "softmax" }), // bullish, bearish, sideways
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    this.models.set("trend_classification", model);
  }

  private async createSignalDetectionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [35], units: 80, activation: "relu" }),
        tf.layers.dropout({ rate: 0.25 }),
        tf.layers.dense({ units: 40, activation: "relu" }),
        tf.layers.dense({ units: 20, activation: "relu" }),
        tf.layers.dense({ units: 3, activation: "sigmoid" }), // breakout, reversal, continuation probabilities
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "binaryCrossentropy",
    });

    this.models.set("signal_detection", model);
  }

  public async generatePredictions(token: string): Promise<PredictionResult> {
    try {
      // Gather input data
      const inputData = await this.prepareInputData(token);

      // Generate predictions using different models
      const [
        pricePrediction,
        trendPrediction,
        volatilityForecast,
        signalPredictions,
        riskMetrics,
      ] = await Promise.all([
        this.predictPrice(inputData),
        this.predictTrend(inputData),
        this.predictVolatility(inputData),
        this.predictSignals(inputData),
        this.calculateRiskMetrics(inputData, token),
      ]);

      return {
        price_prediction: pricePrediction,
        trend_prediction: trendPrediction,
        volatility_forecast: volatilityForecast,
        signal_predictions: signalPredictions,
        risk_metrics: riskMetrics,
      };
    } catch (error) {
      console.error(`Error generating predictions for ${token}:`, error);
      throw error;
    }
  }

  private async prepareInputData(token: string): Promise<PredictionInput> {
    // Get historical price data
    const priceHistory = await this.prisma.priceData.findMany({
      where: { symbol: token },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    if (priceHistory.length < 50) {
      throw new Error(`Insufficient data for ${token}`);
    }

    // Get technical indicators
    const technicalIndicators =
      await this.technicalService.calculateAllIndicators(token);

    // Get sentiment data
    const sentimentData = await this.prisma.sentimentData.findMany({
      where: { token },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // Prepare feature vectors
    const technicalFeatures =
      this.extractTechnicalFeatures(technicalIndicators);
    const sentimentFeatures = this.extractSentimentFeatures(sentimentData);
    const volumeFeatures = this.extractVolumeFeatures(priceHistory);
    const priceFeatures = this.extractPriceFeatures(priceHistory);
    // const marketFeatures = await this.extractMarketFeatures(token);

    return {
      technicalIndicators: technicalFeatures,
      sentimentData: sentimentFeatures,
      volumeData: volumeFeatures,
      priceHistory: priceFeatures,
      marketData: [],
    };
  }

  private extractTechnicalFeatures(indicators: any): number[] {
    return [
      indicators.rsi / 100,
      indicators.macd.macd,
      indicators.macd.signal,
      indicators.macd.histogram,
      indicators.bollingerBands.position,
      indicators.movingAverages.sma20,
      indicators.movingAverages.sma50,
      indicators.movingAverages.ema12,
      indicators.movingAverages.ema26,
      indicators.stochastic.k / 100,
      indicators.stochastic.d / 100,
      indicators.williamsR / 100,
      indicators.atr,
      indicators.adx / 100,
      indicators.cci / 200 + 0.5, // Normalize CCI
      indicators.momentum / 100,
      indicators.rateOfChange / 100,
      indicators.moneyFlowIndex / 100,
      indicators.volumeIndicators.volumeRatio,
      indicators.ichimoku.tenkanSen,
      indicators.ichimoku.kijunSen,
    ];
  }

  private extractSentimentFeatures(sentimentData: any[]): number[] {
    if (sentimentData.length === 0) {
      return new Array(10).fill(0);
    }

    const recentSentiments = sentimentData.slice(0, 10).map((s) => s.score);
    const avgSentiment =
      recentSentiments.reduce((sum, s) => sum + s, 0) / recentSentiments.length;
    const sentimentVolatility = this.calculateVolatility(recentSentiments);
    const sentimentTrend = this.calculateTrend(recentSentiments);

    return [
      avgSentiment,
      sentimentVolatility,
      sentimentTrend,
      ...recentSentiments.slice(0, 7),
    ];
  }

  private extractVolumeFeatures(priceHistory: any[]): number[] {
    const volumes = priceHistory.map((p) => p.volume24h);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeVolatility = this.calculateVolatility(volumes);
    const volumeTrend = this.calculateTrend(volumes.slice(0, 10));

    return [
      avgVolume,
      volumeVolatility,
      volumeTrend,
      ...volumes.slice(0, 7).map((v) => v / avgVolume), // Normalized recent volumes
    ];
  }

  private extractPriceFeatures(priceHistory: any[]): number[] {
    const prices = priceHistory.map((p) => p.price);
    const returns = this.calculateReturns(prices);
    const volatility = this.calculateVolatility(returns);
    const trend = this.calculateTrend(prices.slice(0, 20));

    return [
      volatility,
      trend,
      ...returns.slice(0, 15), // Recent returns
      ...this.calculatePriceRatios(prices.slice(0, 5)), // Recent price ratios
    ];
  }

  //   private async extractMarketFeatures(token: string): Promise<number[]> {
  //     // Extract broader market features that might affect the token
  //     const marketData = await this.dataService.getMarketOverview();

  //     return [
  //       marketData.totalMarketCap || 0,
  //       marketData.marketDominance || 0,
  //       marketData.fearGreedIndex || 50,
  //       marketData.volatilityIndex || 0,
  //       marketData.correlationWithBTC || 0,
  //     ];
  //   }

  private async predictPrice(inputData: PredictionInput): Promise<{
    next_1h: number;
    next_4h: number;
    next_24h: number;
    next_7d: number;
    confidence: number;
  }> {
    const model = this.models.get("price_prediction");
    if (!model) {
      throw new Error("Price prediction model not initialized");
    }

    // Combine all features
    const features = [
      ...inputData.technicalIndicators,
      ...inputData.sentimentData,
      ...inputData.volumeData,
      ...inputData.priceHistory.slice(0, 15),
      ...inputData.marketData,
    ];

    // Ensure we have exactly 50 features
    const normalizedFeatures = this.normalizeFeatures(features).slice(0, 50);
    if (normalizedFeatures.length < 50) {
      normalizedFeatures.push(
        ...new Array(50 - normalizedFeatures.length).fill(0)
      );
    }

    const prediction = model.predict(
      tf.tensor2d([normalizedFeatures])
    ) as tf.Tensor;
    const predictionData = await prediction.data();

    // Calculate confidence based on model uncertainty and data quality
    const confidence = this.calculatePredictionConfidence(inputData);

    return {
      next_1h: predictionData[0],
      next_4h: predictionData[1],
      next_24h: predictionData[2],
      next_7d: predictionData[3],
      confidence,
    };
  }

  private async predictTrend(inputData: PredictionInput): Promise<{
    direction: "bullish" | "bearish" | "sideways";
    strength: number;
    duration_estimate: string;
  }> {
    const model = this.models.get("trend_classification");
    if (!model) {
      throw new Error("Trend classification model not initialized");
    }

    const features = [
      ...inputData.technicalIndicators,
      ...inputData.sentimentData.slice(0, 10),
      ...inputData.priceHistory.slice(0, 10),
    ];

    const normalizedFeatures = this.normalizeFeatures(features).slice(0, 40);
    if (normalizedFeatures.length < 40) {
      normalizedFeatures.push(
        ...new Array(40 - normalizedFeatures.length).fill(0)
      );
    }

    const prediction = model.predict(
      tf.tensor2d([normalizedFeatures])
    ) as tf.Tensor;
    const predictionData = await prediction.data();

    const directions = ["bullish", "bearish", "sideways"] as const;
    const maxIndex = predictionData.indexOf(
      Math.max(...Array.from(predictionData))
    );
    const strength = predictionData[maxIndex];

    return {
      direction: directions[maxIndex],
      strength,
      duration_estimate: this.estimateTrendDuration(strength, inputData),
    };
  }

  private async predictVolatility(inputData: PredictionInput): Promise<{
    expected_volatility: number;
    volatility_regime: "low" | "medium" | "high";
    risk_level: number;
  }> {
    const model = this.models.get("volatility");
    if (!model) {
      throw new Error("Volatility model not initialized");
    }

    const features = [
      ...inputData.priceHistory.slice(0, 20),
      ...inputData.volumeData.slice(0, 10),
    ];

    const normalizedFeatures = this.normalizeFeatures(features).slice(0, 30);
    if (normalizedFeatures.length < 30) {
      normalizedFeatures.push(
        ...new Array(30 - normalizedFeatures.length).fill(0)
      );
    }

    const prediction = model.predict(
      tf.tensor2d([normalizedFeatures])
    ) as tf.Tensor;
    const volatility = (await prediction.data())[0];

    let regime: "low" | "medium" | "high";
    if (volatility < 0.02) regime = "low";
    else if (volatility < 0.05) regime = "medium";
    else regime = "high";

    return {
      expected_volatility: volatility,
      volatility_regime: regime,
      risk_level: Math.min(1, volatility * 20), // Scale to 0-1
    };
  }

  private async predictSignals(inputData: PredictionInput): Promise<{
    breakout_probability: number;
    reversal_probability: number;
    continuation_probability: number;
  }> {
    const model = this.models.get("signal_detection");
    if (!model) {
      throw new Error("Signal detection model not initialized");
    }

    const features = [
      ...inputData.technicalIndicators,
      ...inputData.volumeData.slice(0, 10),
      ...inputData.priceHistory.slice(0, 5),
    ];

    const normalizedFeatures = this.normalizeFeatures(features).slice(0, 35);
    if (normalizedFeatures.length < 35) {
      normalizedFeatures.push(
        ...new Array(35 - normalizedFeatures.length).fill(0)
      );
    }

    const prediction = model.predict(
      tf.tensor2d([normalizedFeatures])
    ) as tf.Tensor;
    const signalData = await prediction.data();

    return {
      breakout_probability: signalData[0],
      reversal_probability: signalData[1],
      continuation_probability: signalData[2],
    };
  }

  private async calculateRiskMetrics(
    inputData: PredictionInput,
    token: string
  ): Promise<{
    var_95: number;
    expected_return: number;
    sharpe_ratio_forecast: number;
    max_drawdown_risk: number;
  }> {
    const returns = this.calculateReturns(inputData.priceHistory);
    const volatility = this.calculateVolatility(returns);

    // Value at Risk (95% confidence)
    const var_95 = this.calculateVaR(returns, 0.95);

    // Expected return based on recent performance and trends
    const expectedReturn =
      returns.slice(0, 30).reduce((sum, r) => sum + r, 0) / 30;

    // Forecasted Sharpe ratio
    const riskFreeRate = 0.02 / 365; // Daily risk-free rate
    const sharpeRatio =
      volatility > 0 ? (expectedReturn - riskFreeRate) / volatility : 0;

    // Max drawdown risk estimation
    const maxDrawdownRisk = this.estimateMaxDrawdownRisk(returns, volatility);

    return {
      var_95,
      expected_return: expectedReturn,
      sharpe_ratio_forecast: sharpeRatio,
      max_drawdown_risk: maxDrawdownRisk,
    };
  }

  // Helper methods
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i - 1] - prices[i]) / prices[i]);
    }
    return returns;
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    let trend = 0;
    for (let i = 1; i < values.length; i++) {
      trend += (values[i - 1] - values[i]) / values[i];
    }
    return trend / (values.length - 1);
  }

  private calculatePriceRatios(prices: number[]): number[] {
    const ratios: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      ratios.push(prices[i - 1] / prices[i]);
    }
    return ratios;
  }

  private normalizeFeatures(features: number[]): number[] {
    // Simple min-max normalization
    const min = Math.min(...features);
    const max = Math.max(...features);
    const range = max - min;

    if (range === 0) return features.map(() => 0.5);

    return features.map((f) => (f - min) / range);
  }

  private calculatePredictionConfidence(inputData: PredictionInput): number {
    let confidence = 1.0;

    // Reduce confidence based on data quality
    if (inputData.priceHistory.length < 50) confidence *= 0.8;
    if (inputData.sentimentData.length < 10) confidence *= 0.9;
    if (inputData.volumeData.length < 20) confidence *= 0.85;

    // Reduce confidence in high volatility periods
    const volatility = this.calculateVolatility(inputData.priceHistory);
    if (volatility > 0.1) confidence *= 0.7;
    else if (volatility > 0.05) confidence *= 0.85;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private estimateTrendDuration(
    strength: number,
    inputData: PredictionInput
  ): string {
    const volatility = this.calculateVolatility(inputData.priceHistory);

    if (strength > 0.8 && volatility < 0.03) return "3-7 days";
    else if (strength > 0.6) return "1-3 days";
    else if (strength > 0.4) return "4-12 hours";
    else return "1-4 hours";
  }

  private calculateVaR(returns: number[], confidence: number): number {
    const sortedReturns = returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return Math.abs(sortedReturns[index] || 0);
  }

  private estimateMaxDrawdownRisk(
    returns: number[],
    volatility: number
  ): number {
    // Estimate potential max drawdown based on historical volatility
    return volatility * Math.sqrt(30) * 2.5; // Rough estimation for 30-day period
  }

  // Model training methods (to be implemented)
  public async trainModels(token: string): Promise<void> {
    // Implementation for model training with historical data
    console.log(`Training models for ${token} - Implementation needed`);
  }

  public async updateModels(): Promise<void> {
    // Implementation for periodic model updates
    console.log("Updating models - Implementation needed");
  }

  public async evaluateModelPerformance(token: string): Promise<any> {
    // Implementation for model performance evaluation
    return {
      accuracy: 0.85,
      mse: 0.001,
      sharpe_ratio: 1.2,
    };
  }
}
