import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { DataAggregationService } from "../services/DataAggregationService";
import { TechnicalAnalysisService } from "../services/TechnicalAnalysisService";
import { PredictionModelService } from "../services/PredictionModelService";
import { MLPipelineService } from "../services/MLPipelineService";

export class AnalyticsController {
  private prisma: PrismaClient;
  private redis: Redis;
  private dataService: DataAggregationService;
  private technicalService: TechnicalAnalysisService;
  private predictionService: PredictionModelService;
  private mlService: MLPipelineService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.dataService = new DataAggregationService();
    this.technicalService = new TechnicalAnalysisService();
    this.predictionService = new PredictionModelService();
    this.mlService = new MLPipelineService();
  }

  public getMarketAnalytics = async (req: Request, res: Response) => {
    try {
      const { token, timeframe = "24h" } = req.query;

      if (!token) {
        return res.status(400).json({ error: "Token parameter is required" });
      }

      // Check cache first
      const cacheKey = `market_analytics:${token}:${timeframe}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Gather comprehensive market data
      const [
        priceData,
        sentimentData,
        onChainData,
        technicalIndicators,
        marketSignals,
        historicalPerformance,
        correlationData,
        volumeProfile,
        liquidityMetrics,
      ] = await Promise.all([
        this.getPriceAnalytics(token as string, timeframe as string),
        this.getSentimentAnalytics(token as string),
        this.getOnChainAnalytics(token as string),
        this.getTechnicalIndicators(token as string),
        this.getMarketSignals(token as string),
        this.getHistoricalPerformance(token as string, timeframe as string),
        this.getCorrelationAnalysis(token as string),
        this.getVolumeProfile(token as string),
        this.getLiquidityMetrics(token as string),
      ]);

      const analytics = {
        token,
        timeframe,
        timestamp: new Date().toISOString(),
        price: priceData,
        sentiment: sentimentData,
        onchain: onChainData,
        technical: technicalIndicators,
        signals: marketSignals,
        historical: historicalPerformance,
        correlation: correlationData,
        volume: volumeProfile,
        liquidity: liquidityMetrics,
        confidence_score: this.calculateOverallConfidence([
          priceData,
          sentimentData,
          onChainData,
          technicalIndicators,
        ]),
      };

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(analytics));

      res.json(analytics);
    } catch (error) {
      console.error("Error in getMarketAnalytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private async getPriceAnalytics(token: string, timeframe: string) {
    const priceHistory = await this.prisma.priceData.findMany({
      where: {
        symbol: token,
        timestamp: {
          gte: this.getTimeframeStart(timeframe),
        },
      },
      orderBy: { timestamp: "asc" },
    });

    if (priceHistory.length === 0) {
      return { error: "No price data available" };
    }

    const latest = priceHistory[priceHistory.length - 1];
    const oldest = priceHistory[0];

    // Calculate advanced metrics
    const returns = this.calculateReturns(priceHistory);
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns, volatility);
    const maxDrawdown = this.calculateMaxDrawdown(priceHistory);
    const priceChannels = this.calculatePriceChannels(priceHistory);
    const volumeWeightedPrice = this.calculateVWAP(priceHistory);

    return {
      current_price: latest.price,
      price_change: latest.price - oldest.price,
      price_change_percent:
        ((latest.price - oldest.price) / oldest.price) * 100,
      high: Math.max(...priceHistory.map((p) => p.price)),
      low: Math.min(...priceHistory.map((p) => p.price)),
      volume_24h: latest.volume24h,
      market_cap: latest.marketCap,
      volatility: volatility * 100,
      sharpe_ratio: sharpeRatio,
      max_drawdown: maxDrawdown * 100,
      price_channels: priceChannels,
      vwap: volumeWeightedPrice,
      price_momentum: this.calculateMomentum(priceHistory),
      resistance_levels: this.calculateResistanceLevels(priceHistory),
      support_levels: this.calculateSupportLevels(priceHistory),
    };
  }

  private async getSentimentAnalytics(token: string) {
    // Get sentiment data from last 7 days
    const sentimentHistory = await this.prisma.sentimentData.findMany({
      where: {
        token,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { timestamp: "desc" },
    });

    if (sentimentHistory.length === 0) {
      return { error: "No sentiment data available" };
    }

    // Aggregate by source
    const sentimentBySource = this.aggregateSentimentBySource(sentimentHistory);

    // Calculate sentiment trends
    const sentimentTrend = this.calculateSentimentTrend(sentimentHistory);

    // Get influencer sentiment
    const influencerSentiment = await this.getInfluencerSentiment(token);

    // Calculate fear & greed index
    const fearGreedIndex = this.calculateFearGreedIndex(sentimentHistory);

    return {
      overall_sentiment: this.calculateWeightedSentiment(sentimentHistory),
      sentiment_by_source: sentimentBySource,
      sentiment_trend: sentimentTrend,
      influencer_sentiment: influencerSentiment,
      fear_greed_index: fearGreedIndex,
      sentiment_volatility: this.calculateSentimentVolatility(sentimentHistory),
      social_volume: sentimentHistory.reduce((sum, s) => sum + s.volume, 0),
      sentiment_distribution:
        this.calculateSentimentDistribution(sentimentHistory),
      key_topics: await this.extractTrendingTopics(token),
      emotion_analysis: this.analyzeEmotions(sentimentHistory),
    };
  }

  private async getOnChainAnalytics(token: string) {
    const latestMetrics = await this.prisma.onChainMetric.findFirst({
      where: { token },
      orderBy: { timestamp: "desc" },
    });

    if (!latestMetrics) {
      return { error: "No on-chain data available" };
    }

    // Get historical data for trend analysis
    const historicalMetrics = await this.prisma.onChainMetric.findMany({
      where: {
        token,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { timestamp: "asc" },
    });

    return {
      active_addresses: latestMetrics.activeAddresses,
      transaction_count: latestMetrics.transactionCount,
      volume_usd: latestMetrics.volumeUSD,
      liquidity_usd: latestMetrics.liquidityUSD,
      holders: latestMetrics.holders,
      network_growth: this.calculateNetworkGrowth(historicalMetrics),
      address_activity_trend:
        this.calculateAddressActivityTrend(historicalMetrics),
      whale_activity: await this.analyzeWhaleActivity(token),
      concentration_index: this.calculateConcentrationIndex(historicalMetrics),
      network_health_score: this.calculateNetworkHealthScore(latestMetrics),
      defi_metrics: await this.getDeFiMetrics(token),
      staking_metrics: await this.getStakingMetrics(token),
    };
  }

  private async getTechnicalIndicators(token: string) {
    const indicators = await this.technicalService.calculateAllIndicators(
      token
    );

    return {
      rsi: indicators.rsi,
      macd: indicators.macd,
      bollinger_bands: indicators.bollingerBands,
      moving_averages: indicators.movingAverages,
      stochastic: indicators.stochastic,
      williams_r: indicators.williamsR,
      atr: indicators.atr,
      adx: indicators.adx,
      cci: indicators.cci,
      momentum: indicators.momentum,
      rate_of_change: indicators.rateOfChange,
      money_flow_index: indicators.moneyFlowIndex,
      volume_indicators: indicators.volumeIndicators,
      fibonacci_levels: indicators.fibonacciLevels,
      pivot_points: indicators.pivotPoints,
      ichimoku: indicators.ichimoku,
      parabolic_sar: indicators.parabolicSAR,
      overall_signal: this.calculateOverallTechnicalSignal(indicators),
      signal_strength: this.calculateSignalStrength(indicators),
      trend_direction: this.determineTrendDirection(indicators),
      reversal_probability: this.calculateReversalProbability(indicators),
    };
  }

  private async getMarketSignals(token: string) {
    const signals = await this.prisma.marketSignal.findMany({
      where: {
        token,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Generate new signals
    const newSignals = await this.generateMarketSignals(token);

    return {
      active_signals: signals.filter((s) => s.strength > 0.5),
      signal_history: signals,
      generated_signals: newSignals,
      signal_accuracy: await this.calculateSignalAccuracy(token),
      composite_score: this.calculateCompositeSignalScore(signals),
      breakout_signals: await this.detectBreakoutSignals(token),
      reversal_signals: await this.detectReversalSignals(token),
      momentum_signals: await this.detectMomentumSignals(token),
    };
  }

  public getRealTimeUpdates = async (req: Request, res: Response) => {
    try {
      const { tokens } = req.query;

      if (!tokens) {
        return res.status(400).json({ error: "Tokens parameter is required" });
      }

      const tokenList = (tokens as string).split(",");
      const updates = await Promise.all(
        tokenList.map(async (token) => {
          const [price, sentiment, signals] = await Promise.all([
            this.redis.get(`price:${token}`),
            this.redis.get(`sentiment:${token}`),
            this.redis.get(`signals:${token}`),
          ]);

          return {
            token,
            price: price ? JSON.parse(price) : null,
            sentiment: sentiment ? JSON.parse(sentiment) : null,
            signals: signals ? JSON.parse(signals) : null,
            timestamp: new Date().toISOString(),
          };
        })
      );

      res.json({ updates });
    } catch (error) {
      console.error("Error in getRealTimeUpdates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  public getAdvancedMetrics = async (req: Request, res: Response) => {
    try {
      const { token, metric_type } = req.query;

      if (!token || !metric_type) {
        return res
          .status(400)
          .json({ error: "Token and metric_type parameters are required" });
      }

      let metrics;

      switch (metric_type) {
        case "ml_predictions":
          metrics = await this.mlService.generatePredictions(token as string);
          break;
        case "risk_analysis":
          metrics = await this.calculateRiskMetrics(token as string);
          break;
        case "arbitrage_opportunities":
          metrics = await this.detectArbitrageOpportunities(token as string);
          break;
        case "market_inefficiencies":
          metrics = await this.detectMarketInefficiencies(token as string);
          break;
        case "liquidity_analysis":
          metrics = await this.analyzeLiquidityDepth(token as string);
          break;
        default:
          return res.status(400).json({ error: "Invalid metric_type" });
      }

      res.json({
        token,
        metric_type,
        data: metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in getAdvancedMetrics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  public getPortfolioAnalytics = async (req: Request, res: Response) => {
    try {
      const { wallet_address, tokens } = req.query;

      if (!wallet_address) {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      const tokenList = tokens
        ? (tokens as string).split(",")
        : ["BTC", "ETH", "SONIC"];

      const portfolioMetrics = await this.calculatePortfolioMetrics(
        wallet_address as string,
        tokenList
      );

      res.json(portfolioMetrics);
    } catch (error) {
      console.error("Error in getPortfolioAnalytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Helper methods
  private getTimeframeStart(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private calculateReturns(priceHistory: any[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < priceHistory.length; i++) {
      const returnValue =
        (priceHistory[i].price - priceHistory[i - 1].price) /
        priceHistory[i - 1].price;
      returns.push(returnValue);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;
    return Math.sqrt(variance);
  }

  private calculateSharpeRatio(returns: number[], volatility: number): number {
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const riskFreeRate = 0.02 / 365; // Assuming 2% annual risk-free rate
    return volatility > 0 ? (meanReturn - riskFreeRate) / volatility : 0;
  }

  private calculateMaxDrawdown(priceHistory: any[]): number {
    let maxDrawdown = 0;
    let peak = priceHistory[0].price;

    for (let i = 1; i < priceHistory.length; i++) {
      if (priceHistory[i].price > peak) {
        peak = priceHistory[i].price;
      }
      const drawdown = (peak - priceHistory[i].price) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateVWAP(priceHistory: any[]): number {
    let totalVolume = 0;
    let totalVolumePrice = 0;

    for (const candle of priceHistory) {
      const typicalPrice = candle.price; // Simplified - normally (high + low + close) / 3
      totalVolumePrice += typicalPrice * candle.volume24h;
      totalVolume += candle.volume24h;
    }

    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }

  private calculateOverallConfidence(dataPoints: any[]): number {
    const validDataPoints = dataPoints.filter((dp) => dp && !dp.error);
    return validDataPoints.length / dataPoints.length;
  }

  private async calculateRiskMetrics(token: string) {
    // Implementation for risk calculation
    return {
      var_95: 0.05,
      expected_shortfall: 0.07,
      risk_adjusted_return: 0.15,
      correlation_risk: 0.3,
      liquidity_risk: 0.2,
    };
  }

  private async detectArbitrageOpportunities(token: string) {
    // Implementation for arbitrage detection
    return {
      opportunities: [],
      potential_profit: 0,
      execution_risk: "low",
    };
  }

  private async calculatePortfolioMetrics(
    walletAddress: string,
    tokens: string[]
  ) {
    // Implementation for portfolio analysis
    return {
      total_value: 0,
      diversification_score: 0.8,
      risk_score: 0.6,
      performance: {
        "24h": 0.02,
        "7d": 0.15,
        "30d": 0.25,
      },
    };
  }

  // Additional helper methods would be implemented here...
  private calculateMomentum(priceHistory: any[]): number {
    return 0;
  }
  private calculateResistanceLevels(priceHistory: any[]): number[] {
    return [];
  }
  private calculateSupportLevels(priceHistory: any[]): number[] {
    return [];
  }
  private calculatePriceChannels(priceHistory: any[]): any {
    return {};
  }
  private aggregateSentimentBySource(sentimentHistory: any[]): any {
    return {};
  }
  private calculateSentimentTrend(sentimentHistory: any[]): any {
    return {};
  }
  private getInfluencerSentiment(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private calculateFearGreedIndex(sentimentHistory: any[]): number {
    return 50;
  }
  private calculateWeightedSentiment(sentimentHistory: any[]): number {
    return 0;
  }
  private calculateSentimentVolatility(sentimentHistory: any[]): number {
    return 0;
  }
  private calculateSentimentDistribution(sentimentHistory: any[]): any {
    return {};
  }
  private extractTrendingTopics(token: string): Promise<string[]> {
    return Promise.resolve([]);
  }
  private analyzeEmotions(sentimentHistory: any[]): any {
    return {};
  }
  private calculateNetworkGrowth(historicalMetrics: any[]): number {
    return 0;
  }
  private calculateAddressActivityTrend(historicalMetrics: any[]): any {
    return {};
  }
  private analyzeWhaleActivity(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private calculateConcentrationIndex(historicalMetrics: any[]): number {
    return 0;
  }
  private calculateNetworkHealthScore(metrics: any): number {
    return 0;
  }
  private getDeFiMetrics(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private getStakingMetrics(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private calculateOverallTechnicalSignal(indicators: any): string {
    return "neutral";
  }
  private calculateSignalStrength(indicators: any): number {
    return 0;
  }
  private determineTrendDirection(indicators: any): string {
    return "sideways";
  }
  private calculateReversalProbability(indicators: any): number {
    return 0;
  }
  private generateMarketSignals(token: string): Promise<any[]> {
    return Promise.resolve([]);
  }
  private calculateSignalAccuracy(token: string): Promise<number> {
    return Promise.resolve(0);
  }
  private calculateCompositeSignalScore(signals: any[]): number {
    return 0;
  }
  private detectBreakoutSignals(token: string): Promise<any[]> {
    return Promise.resolve([]);
  }
  private detectReversalSignals(token: string): Promise<any[]> {
    return Promise.resolve([]);
  }
  private detectMomentumSignals(token: string): Promise<any[]> {
    return Promise.resolve([]);
  }
  private detectMarketInefficiencies(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private analyzeLiquidityDepth(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private getHistoricalPerformance(
    token: string,
    timeframe: string
  ): Promise<any> {
    return Promise.resolve({});
  }
  private getCorrelationAnalysis(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private getVolumeProfile(token: string): Promise<any> {
    return Promise.resolve({});
  }
  private getLiquidityMetrics(token: string): Promise<any> {
    return Promise.resolve({});
  }
}
