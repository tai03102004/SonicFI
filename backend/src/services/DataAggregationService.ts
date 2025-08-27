import axios from "axios";
import WebSocket from "ws";
import Redis from "ioredis";
import { EventEmitter } from "events";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import cron from "node-cron";

interface NewsSource {
  name: string;
  url: string;
  apiKey?: string;
  rateLimitPerMinute: number;
  lastRequestTime: number;
  requestCount: number;
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: number;
}

interface SentimentData {
  source: string;
  text: string;
  sentiment: number;
  confidence: number;
  engagement: number;
  timestamp: number;
  metadata: Record<string, any>;
}

interface OnChainMetric {
  tokenAddress: string;
  activeAddresses: number;
  transactionCount: number;
  volumeUSD: number;
  liquidityUSD: number;
  holders: number;
  timestamp: number;
}

export class DataAggregationService extends EventEmitter {
  private redis: Redis;
  private prisma: PrismaClient;
  private openai: OpenAI;
  private webSockets: Map<string, WebSocket> = new Map();

  private newsSources: NewsSource[] = [
    {
      name: "CoinDesk",
      url: "https://api.coindesk.com/v1/news",
      rateLimitPerMinute: 100,
      lastRequestTime: 0,
      requestCount: 0,
    },
    {
      name: "CryptoSlate",
      url: "https://api.cryptoslate.com/v1/news",
      apiKey: process.env.CRYPTOSLATE_API_KEY,
      rateLimitPerMinute: 60,
      lastRequestTime: 0,
      requestCount: 0,
    },
    {
      name: "NewsAPI",
      url: "https://newsapi.org/v2/everything",
      apiKey: process.env.NEWSAPI_KEY,
      rateLimitPerMinute: 100,
      lastRequestTime: 0,
      requestCount: 0,
    },
    {
      name: "CoinTelegraph",
      url: "https://cointelegraph.com/api/news",
      rateLimitPerMinute: 120,
      lastRequestTime: 0,
      requestCount: 0,
    },
  ];

  private trackedTokens = [
    "BTC",
    "ETH",
    "SONIC",
    "USDT",
    "BNB",
    "ADA",
    "SOL",
    "AVAX",
    "MATIC",
    "DOT",
  ];

  constructor() {
    super();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    this.initializeWebSockets();
    this.setupCronJobs();
    this.startRealTimeDataStreams();
  }

  private initializeWebSockets() {
    // Binance WebSocket for real-time price data
    const binanceWs = new WebSocket(
      "wss://stream.binance.com:9443/ws/!ticker@arr"
    );
    binanceWs.on("message", (data) => {
      try {
        const tickers = JSON.parse(data.toString());
        this.processBinanceTickers(tickers);
      } catch (error) {
        console.error("Error processing Binance data:", error);
      }
    });
    this.webSockets.set("binance", binanceWs);

    // CoinGecko WebSocket for additional market data
    const coingeckoWs = new WebSocket("wss://api.coingecko.com/ws");
    coingeckoWs.on("message", (data) => {
      try {
        const marketData = JSON.parse(data.toString());
        this.processCoinGeckoData(marketData);
      } catch (error) {
        console.error("Error processing CoinGecko data:", error);
      }
    });
    this.webSockets.set("coingecko", coingeckoWs);
  }

  private async processBinanceTickers(tickers: any[]) {
    for (const ticker of tickers) {
      const symbol = ticker.s.replace("USDT", "");
      if (this.trackedTokens.includes(symbol)) {
        const priceData: PriceData = {
          symbol,
          price: parseFloat(ticker.c),
          change24h: parseFloat(ticker.P),
          volume24h: parseFloat(ticker.v),
          marketCap: 0, // Will be enriched from other sources
          timestamp: Date.now(),
        };

        // Cache in Redis with 1-minute expiry
        await this.redis.setex(
          `price:${symbol}`,
          60,
          JSON.stringify(priceData)
        );

        // Store in database for historical analysis
        await this.prisma.priceData.create({
          data: {
            symbol,
            price: priceData.price,
            change24h: priceData.change24h,
            volume24h: priceData.volume24h,
            timestamp: new Date(priceData.timestamp),
          },
        });

        this.emit("priceUpdate", priceData);
      }
    }
  }

  private async processCoinGeckoData(data: any) {
    // Process CoinGecko market data
    if (data.type === "market_data") {
      for (const token of this.trackedTokens) {
        const tokenData = data.data[token.toLowerCase()];
        if (tokenData) {
          await this.redis.setex(
            `market:${token}`,
            300, // 5 minutes
            JSON.stringify({
              marketCap: tokenData.market_cap,
              totalVolume: tokenData.total_volume,
              circulatingSupply: tokenData.circulating_supply,
              timestamp: Date.now(),
            })
          );
        }
      }
    }
  }

  private setupCronJobs() {
    // Aggregate news every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
      console.log("Starting news aggregation...");
      await this.aggregateNewsData();
    });

    // Analyze sentiment every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
      console.log("Starting sentiment analysis...");
      await this.analyzeSentimentData();
    });

    // Generate research reports every hour
    cron.schedule("0 * * * *", async () => {
      console.log("Generating research reports...");
      await this.generateResearchReports();
    });

    // Cleanup old data daily at 2 AM
    cron.schedule("0 2 * * *", async () => {
      console.log("Cleaning up old data...");
      await this.cleanupOldData();
    });

    // Fetch on-chain metrics every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
      console.log("Fetching on-chain metrics...");
      await this.fetchOnChainMetrics();
    });
  }

  public async aggregateNewsData(): Promise<void> {
    const allNews: any[] = [];

    for (const source of this.newsSources) {
      try {
        await this.respectRateLimit(source);

        const newsData = await this.fetchNewsFromSource(source);
        allNews.push(...newsData);

        console.log(`Fetched ${newsData.length} articles from ${source.name}`);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
      }
    }

    // Process and store news articles
    for (const article of allNews) {
      const processedArticle = await this.processNewsArticle(article);

      if (processedArticle) {
        await this.prisma.newsArticle.upsert({
          where: { url: processedArticle.url },
          update: processedArticle,
          create: processedArticle,
        });
      }
    }

    console.log(`Processed ${allNews.length} news articles`);
  }

  private async respectRateLimit(source: NewsSource): Promise<void> {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset counter if more than a minute has passed
    if (now - source.lastRequestTime > oneMinute) {
      source.requestCount = 0;
      source.lastRequestTime = now;
    }

    // Check if we've exceeded rate limit
    if (source.requestCount >= source.rateLimitPerMinute) {
      const waitTime = oneMinute - (now - source.lastRequestTime);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      source.requestCount = 0;
      source.lastRequestTime = Date.now();
    }

    source.requestCount++;
  }

  private async fetchNewsFromSource(source: NewsSource): Promise<any[]> {
    const config: any = {
      method: "GET",
      timeout: 30000,
      headers: {
        "User-Agent": "SocialFi-Research-Bot/1.0",
      },
    };

    if (source.apiKey) {
      config.headers["X-API-Key"] = source.apiKey;
    }

    let url = source.url;

    // Add cryptocurrency-related query parameters
    if (source.name === "NewsAPI") {
      url +=
        "?q=cryptocurrency OR bitcoin OR ethereum OR blockchain&sortBy=publishedAt&language=en";
    } else if (source.name === "CoinDesk") {
      url += "?limit=50";
    }

    const response = await axios.get(url, config);

    // Normalize different API response formats
    if (source.name === "NewsAPI") {
      return response.data.articles || [];
    } else if (source.name === "CoinDesk") {
      return response.data.data || [];
    } else {
      return response.data.articles || response.data.data || [];
    }
  }

  private async processNewsArticle(article: any): Promise<any | null> {
    try {
      // Extract relevant tokens mentioned in title and description
      const text = `${article.title || ""} ${article.description || ""}`;
      const mentionedTokens = this.extractMentionedTokens(text);

      if (mentionedTokens.length === 0) {
        return null; // Skip articles that don't mention tracked tokens
      }

      // Analyze sentiment using OpenAI
      const sentimentAnalysis = await this.analyzeSentimentWithAI(text);

      return {
        title: article.title,
        description: article.description,
        url: article.url || article.link,
        publishedAt: new Date(
          article.publishedAt || article.published_at || Date.now()
        ),
        source: article.source?.name || "Unknown",
        mentionedTokens,
        sentiment: sentimentAnalysis.sentiment,
        confidence: sentimentAnalysis.confidence,
        categories: sentimentAnalysis.categories,
        keyPhrases: sentimentAnalysis.keyPhrases,
      };
    } catch (error) {
      console.error("Error processing article:", error);
      return null;
    }
  }

  private extractMentionedTokens(text: string): string[] {
    const tokens: string[] = [];
    const lowerText = text.toLowerCase();

    for (const token of this.trackedTokens) {
      const patterns = [
        new RegExp(`\\b${token.toLowerCase()}\\b`, "g"),
        new RegExp(`\\$${token.toLowerCase()}\\b`, "g"),
        new RegExp(`#${token.toLowerCase()}\\b`, "g"),
      ];

      if (patterns.some((pattern) => pattern.test(lowerText))) {
        tokens.push(token);
      }
    }

    // Also check for full names
    const tokenNames: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SONIC: "sonic",
      ADA: "cardano",
      SOL: "solana",
      AVAX: "avalanche",
      MATIC: "polygon",
      DOT: "polkadot",
    };

    for (const [symbol, name] of Object.entries(tokenNames)) {
      if (lowerText.includes(name) && !tokens.includes(symbol)) {
        tokens.push(symbol);
      }
    }

    return tokens;
  }

  private async analyzeSentimentWithAI(text: string): Promise<{
    sentiment: number;
    confidence: number;
    categories: string[];
    keyPhrases: string[];
  }> {
    try {
      const prompt = `
        Analyze the sentiment of this cryptocurrency-related text and provide a JSON response:
        "${text}"
        
        Return:
        {
          "sentiment": <number between -1 (very negative) and 1 (very positive)>,
          "confidence": <number between 0 and 1>,
          "categories": <array of relevant categories like ["price_movement", "adoption", "regulation", "technology"]>,
          "keyPhrases": <array of important phrases extracted from the text>
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0].message.content!);
      return analysis;
    } catch (error) {
      console.error("Error in AI sentiment analysis:", error);
      return {
        sentiment: 0,
        confidence: 0.1,
        categories: [],
        keyPhrases: [],
      };
    }
  }

  public async analyzeSentimentData(): Promise<void> {
    // Get recent news articles
    const recentArticles = await this.prisma.newsArticle.findMany({
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // Group by mentioned tokens
    const tokenSentiments: Record<
      string,
      {
        articles: any[];
        avgSentiment: number;
        confidence: number;
      }
    > = {};

    for (const token of this.trackedTokens) {
      const tokenArticles = recentArticles.filter((article) =>
        article.mentionedTokens.includes(token)
      );

      if (tokenArticles.length > 0) {
        const sentiments = tokenArticles.map((a) => a.sentiment);
        const confidences = tokenArticles.map((a) => a.confidence);

        // Weighted average sentiment
        const weightedSentiment =
          sentiments.reduce(
            (sum, sentiment, index) => sum + sentiment * confidences[index],
            0
          ) / confidences.reduce((sum, conf) => sum + conf, 0);

        const avgConfidence =
          confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

        tokenSentiments[token] = {
          articles: tokenArticles,
          avgSentiment: weightedSentiment,
          confidence: avgConfidence,
        };
      }
    }

    // Store aggregated sentiment data
    for (const [token, data] of Object.entries(tokenSentiments)) {
      await this.redis.setex(
        `sentiment:${token}`,
        3600, // 1 hour
        JSON.stringify({
          sentiment: data.avgSentiment,
          confidence: data.confidence,
          articleCount: data.articles.length,
          timestamp: Date.now(),
        })
      );

      await this.prisma.sentimentData.create({
        data: {
          token,
          sentiment: data.avgSentiment,
          confidence: data.confidence,
          source: "news_aggregation",
          articleCount: data.articles.length,
          timestamp: new Date(),
        },
      });
    }

    this.emit("sentimentUpdate", tokenSentiments);
  }

  public async fetchOnChainMetrics(): Promise<void> {
    // This would integrate with various blockchain APIs
    // For now, we'll simulate some metrics

    for (const token of this.trackedTokens) {
      try {
        // In a real implementation, you'd call specific APIs:
        // - Ethereum: Etherscan, The Graph
        // - Bitcoin: BlockCypher, Blockchain.info
        // - Sonic: Sonic-specific APIs

        const metrics: OnChainMetric = {
          tokenAddress: this.getTokenAddress(token),
          activeAddresses: Math.floor(Math.random() * 100000) + 10000,
          transactionCount: Math.floor(Math.random() * 50000) + 5000,
          volumeUSD: Math.floor(Math.random() * 1000000000) + 100000000,
          liquidityUSD: Math.floor(Math.random() * 500000000) + 50000000,
          holders: Math.floor(Math.random() * 1000000) + 100000,
          timestamp: Date.now(),
        };

        await this.redis.setex(
          `onchain:${token}`,
          1800, // 30 minutes
          JSON.stringify(metrics)
        );

        await this.prisma.onChainMetric.create({
          data: {
            token,
            activeAddresses: metrics.activeAddresses,
            transactionCount: metrics.transactionCount,
            volumeUSD: metrics.volumeUSD,
            liquidityUSD: metrics.liquidityUSD,
            holders: metrics.holders,
            timestamp: new Date(metrics.timestamp),
          },
        });
      } catch (error) {
        console.error(`Error fetching on-chain metrics for ${token}:`, error);
      }
    }
  }

  private getTokenAddress(token: string): string {
    const addresses: Record<string, string> = {
      BTC: "0x0000000000000000000000000000000000000000",
      ETH: "0x0000000000000000000000000000000000000000",
      SONIC: "0x1234567890123456789012345678901234567890",
      // Add other token addresses
    };
    return addresses[token] || "0x0000000000000000000000000000000000000000";
  }

  public async generateResearchReports(): Promise<void> {
    for (const token of this.trackedTokens) {
      try {
        // Gather all data for the token
        const [priceData, sentimentData, onChainData] = await Promise.all([
          this.redis.get(`price:${token}`),
          this.redis.get(`sentiment:${token}`),
          this.redis.get(`onchain:${token}`),
        ]);

        if (!priceData || !sentimentData) {
          console.log(
            `Insufficient data for ${token}, skipping report generation`
          );
          continue;
        }

        const parsedPriceData = JSON.parse(priceData);
        const parsedSentimentData = JSON.parse(sentimentData);
        const parsedOnChainData = onChainData ? JSON.parse(onChainData) : null;

        // Generate comprehensive report using AI
        const report = await this.generateAIReport(token, {
          price: parsedPriceData,
          sentiment: parsedSentimentData,
          onChain: parsedOnChainData,
        });

        if (report) {
          // Store report in database
          const savedReport = await this.prisma.researchReport.create({
            data: {
              token,
              contentHash: this.generateContentHash(report),
              executiveSummary: report.executive_summary,
              keyFindings: report.key_findings,
              marketSentiment: report.market_sentiment,
              pricePredictions: report.price_predictions,
              riskAssessment: report.risk_assessment,
              tradingRecommendations: report.trading_recommendations,
              confidence: report.confidence,
              detailedAnalysis: report.detailed_analysis,
              timestamp: new Date(),
            },
          });

          // Cache the report
          await this.redis.setex(
            `report:${token}:${savedReport.id}`,
            86400, // 24 hours
            JSON.stringify(report)
          );

          this.emit("reportGenerated", { token, report: savedReport });
        }
      } catch (error) {
        console.error(`Error generating report for ${token}:`, error);
      }
    }
  }

  private async generateAIReport(token: string, data: any): Promise<any> {
    const prompt = `
      Generate a comprehensive cryptocurrency research report for ${token} based on the following data:
      
      Price Data: ${JSON.stringify(data.price)}
      Sentiment Data: ${JSON.stringify(data.sentiment)}
      On-Chain Data: ${JSON.stringify(data.onChain)}
      
      Please provide a detailed JSON response with:
      1. executive_summary (2-3 sentences)
      2. key_findings (object with detailed findings)
      3. market_sentiment (analysis object)
      4. price_predictions (short/medium/long term)
      5. risk_assessment (detailed risk analysis)
      6. trading_recommendations (array of actionable recommendations)
      7. confidence (0-1 score)
      8. detailed_analysis (comprehensive breakdown)
      
      Focus on actionable insights and maintain professional analyst tone.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a senior cryptocurrency analyst with 10+ years experience. Provide detailed, data-driven analysis.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      });

      return JSON.parse(response.choices[0].message.content!);
    } catch (error) {
      console.error("Error generating AI report:", error);
      return null;
    }
  }

  private generateContentHash(content: any): string {
    const crypto = require("crypto");
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(content))
      .digest("hex");
  }

  private async cleanupOldData(): Promise<void> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Clean up old news articles
    await this.prisma.newsArticle.deleteMany({
      where: {
        publishedAt: {
          lt: oneWeekAgo,
        },
      },
    });

    // Clean up old price data (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await this.prisma.priceData.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log("Old data cleanup completed");
  }

  private startRealTimeDataStreams(): Promise<void> {
    // Initialize real-time data streams
    return Promise.resolve();
  }

  public async getTokenAnalytics(token: string): Promise<any> {
    const [priceData, sentimentData, onChainData] = await Promise.all([
      this.redis.get(`price:${token}`),
      this.redis.get(`sentiment:${token}`),
      this.redis.get(`onchain:${token}`),
    ]);

    return {
      price: priceData ? JSON.parse(priceData) : null,
      sentiment: sentimentData ? JSON.parse(sentimentData) : null,
      onChain: onChainData ? JSON.parse(onChainData) : null,
      timestamp: Date.now(),
    };
  }

  public async destroy(): Promise<void> {
    // Close WebSocket connections
    for (const [name, ws] of this.webSockets.entries()) {
      ws.close();
      console.log(`Closed WebSocket connection: ${name}`);
    }

    // Close database connections
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
}
