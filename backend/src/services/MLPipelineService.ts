import * as tf from "@tensorflow/tfjs-node";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import OpenAI from "openai";
import axios from "axios";
import { EventEmitter } from "events";

interface ModelPrediction {
  token: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  features_used: string[];
  model_version: string;
  timestamp: string;
}

interface TrainingData {
  features: number[][];
  labels: number[];
  timestamps: Date[];
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  mse: number;
  mae: number;
}

export class MLPipelineService extends EventEmitter {
  private prisma: PrismaClient;
  private redis: Redis;
  private openai: OpenAI;
  private models: Map<string, tf.LayersModel> = new Map();
  private modelMetrics: Map<string, ModelMetrics> = new Map();

  private readonly FEATURE_WINDOW = 30; // 30 days of data
  private readonly PREDICTION_HORIZONS = ["1h", "24h", "7d", "30d"];
  private readonly MODEL_TYPES = ["lstm", "transformer", "ensemble"];

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    this.initializeModels();
    this.startModelTrainingSchedule();
  }

  private async initializeModels() {
    console.log("Initializing ML models...");

    for (const modelType of this.MODEL_TYPES) {
      for (const horizon of this.PREDICTION_HORIZONS) {
        const modelKey = `${modelType}_${horizon}`;

        try {
          // Try to load existing model
          const modelPath = `file://./models/${modelKey}/model.json`;
          const model = await tf.loadLayersModel(modelPath);
          this.models.set(modelKey, model);
          console.log(`Loaded existing model: ${modelKey}`);
        } catch (error) {
          // Create new model if doesn't exist
          const model = this.createModel(modelType, horizon);
          this.models.set(modelKey, model);
          console.log(`Created new model: ${modelKey}`);
        }
      }
    }
  }

  private createModel(modelType: string, horizon: string): tf.LayersModel {
    const inputShape = [this.FEATURE_WINDOW, 15]; // 30 days, 15 features

    switch (modelType) {
      case "lstm":
        return this.createLSTMModel(inputShape);
      case "transformer":
        return this.createTransformerModel(inputShape);
      case "ensemble":
        return this.createEnsembleModel(inputShape);
      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
  }

  private createLSTMModel(inputShape: number[]): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: inputShape,
          dropout: 0.2,
          recurrentDropout: 0.2,
        }),
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          dropout: 0.2,
          recurrentDropout: 0.2,
        }),
        tf.layers.lstm({
          units: 32,
          dropout: 0.2,
          recurrentDropout: 0.2,
        }),
        tf.layers.dense({ units: 16, activation: "relu" }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 8, activation: "relu" }),
        tf.layers.dense({ units: 1, activation: "linear" }), // Price prediction
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["mae"],
    });

    return model;
  }

  private createTransformerModel(inputShape: number[]): tf.LayersModel {
    // Simplified transformer architecture using TensorFlow.js
    const input = tf.input({ shape: inputShape });

    // Multi-head attention simulation
    let x = tf.layers
      .dense({ units: 128, activation: "relu" })
      .apply(input) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.1 }).apply(x) as tf.SymbolicTensor;

    // Feed forward network
    x = tf.layers
      .dense({ units: 64, activation: "relu" })
      .apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.1 }).apply(x) as tf.SymbolicTensor;

    // Global average pooling to flatten
    x = tf.layers.globalAveragePooling1d().apply(x) as tf.SymbolicTensor;

    // Final prediction layers
    x = tf.layers
      .dense({ units: 32, activation: "relu" })
      .apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;

    const output = tf.layers
      .dense({ units: 1, activation: "linear" })
      .apply(x) as tf.SymbolicTensor;

    const model = tf.model({ inputs: input, outputs: output });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["mae"],
    });

    return model;
  }

  private createEnsembleModel(inputShape: number[]): tf.LayersModel {
    // Create an ensemble of different architectures
    const input = tf.input({ shape: inputShape });

    // Branch 1: LSTM-like
    let branch1 = tf.layers
      .conv1d({ filters: 64, kernelSize: 3, activation: "relu" })
      .apply(input) as tf.SymbolicTensor;
    branch1 = tf.layers
      .globalMaxPooling1d()
      .apply(branch1) as tf.SymbolicTensor;
    branch1 = tf.layers
      .dense({ units: 32, activation: "relu" })
      .apply(branch1) as tf.SymbolicTensor;

    // Branch 2: Dense network
    let branch2 = tf.layers.flatten().apply(input) as tf.SymbolicTensor;
    branch2 = tf.layers
      .dense({ units: 128, activation: "relu" })
      .apply(branch2) as tf.SymbolicTensor;
    branch2 = tf.layers
      .dropout({ rate: 0.3 })
      .apply(branch2) as tf.SymbolicTensor;
    branch2 = tf.layers
      .dense({ units: 32, activation: "relu" })
      .apply(branch2) as tf.SymbolicTensor;

    // Combine branches
    const combined = tf.layers
      .concatenate()
      .apply([branch1, branch2]) as tf.SymbolicTensor;
    let x = tf.layers
      .dense({ units: 16, activation: "relu" })
      .apply(combined) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.2 }).apply(x) as tf.SymbolicTensor;

    const output = tf.layers
      .dense({ units: 1, activation: "linear" })
      .apply(x) as tf.SymbolicTensor;

    const model = tf.model({ inputs: input, outputs: output });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["mae"],
    });

    return model;
  }

  public async generatePredictions(token: string): Promise<ModelPrediction[]> {
    try {
      // Prepare features for prediction
      const features = await this.prepareFeatures(token);
      if (!features || features.length === 0) {
        throw new Error(`No features available for ${token}`);
      }

      const predictions: ModelPrediction[] = [];

      // Generate predictions for each model and horizon
      for (const modelType of this.MODEL_TYPES) {
        for (const horizon of this.PREDICTION_HORIZONS) {
          const modelKey = `${modelType}_${horizon}`;
          const model = this.models.get(modelKey);

          if (!model) continue;

          try {
            // Convert features to tensor
            const inputTensor = tf.tensor3d(
              [features],
              [1, features.length, features[0].length]
            );

            // Make prediction
            const predictionTensor = model.predict(inputTensor) as tf.Tensor;
            const predictionValue = await predictionTensor.data();

            // Calculate confidence based on model metrics
            const metrics = this.modelMetrics.get(modelKey);
            const confidence = metrics
              ? (1 - metrics.mse) * metrics.accuracy
              : 0.5;

            predictions.push({
              token,
              prediction: predictionValue[0],
              confidence: Math.max(0, Math.min(1, confidence)),
              timeframe: horizon,
              features_used: this.getFeatureNames(),
              model_version: `${modelType}_v1.0`,
              timestamp: new Date().toISOString(),
            });

            // Cleanup tensors
            inputTensor.dispose();
            predictionTensor.dispose();
          } catch (error) {
            console.error(`Error in model ${modelKey}:`, error);
          }
        }
      }

      // Store predictions in database
      await this.storePredictions(predictions);

      // Cache predictions
      await this.redis.setex(
        `ml_predictions:${token}`,
        3600, // 1 hour
        JSON.stringify(predictions)
      );

      return predictions;
    } catch (error) {
      console.error(`Error generating predictions for ${token}:`, error);
      return [];
    }
  }

  private async prepareFeatures(token: string): Promise<number[][]> {
    // Get historical data
    const endDate = new Date();
    const startDate = new Date(
      endDate.getTime() - this.FEATURE_WINDOW * 24 * 60 * 60 * 1000
    );

    const [priceData, sentimentData, onChainData, volumeData] =
      await Promise.all([
        this.getPriceData(token, startDate, endDate),
        this.getSentimentData(token, startDate, endDate),
        this.getOnChainData(token, startDate, endDate),
        this.getVolumeData(token, startDate, endDate),
      ]);

    if (!priceData.length) {
      return [];
    }

    // Create feature matrix
    const features: number[][] = [];

    for (let i = 0; i < Math.min(priceData.length, this.FEATURE_WINDOW); i++) {
      const dayFeatures = [
        // Price features
        priceData[i]?.price || 0,
        priceData[i]?.change24h || 0,
        priceData[i]?.volume24h || 0,
        priceData[i]?.marketCap || 0,

        // Technical indicators
        this.calculateRSI(priceData, i),
        this.calculateMACD(priceData, i),
        this.calculateBollingerPosition(priceData, i),

        // Sentiment features
        sentimentData[i]?.sentiment || 0,
        sentimentData[i]?.confidence || 0,
        sentimentData[i]?.volume || 0,

        // On-chain features
        onChainData[i]?.activeAddresses || 0,
        onChainData[i]?.transactionCount || 0,
        onChainData[i]?.volumeUSD || 0,

        // Volume features
        volumeData[i]?.volumeRatio || 1,
        volumeData[i]?.volumeMA || 0,
      ];

      // Normalize features
      features.push(this.normalizeFeatures(dayFeatures));
    }

    return features;
  }

  private normalizeFeatures(features: number[]): number[] {
    return features.map((value, index) => {
      // Apply different normalization strategies based on feature type
      switch (index) {
        case 0: // price
          return Math.log(Math.max(value, 0.01)) / 10;
        case 1: // change24h
          return Math.tanh(value / 100);
        case 2: // volume24h
          return Math.log(Math.max(value, 1)) / 20;
        case 3: // marketCap
          return Math.log(Math.max(value, 1)) / 25;
        case 7: // sentiment
        case 8: // confidence
          return Math.max(-1, Math.min(1, value));
        default:
          return Math.tanh(value / 1000);
      }
    });
  }

  private async trainModels(token: string): Promise<void> {
    console.log(`Training models for ${token}...`);

    try {
      // Prepare training data
      const trainingData = await this.prepareTrainingData(token);
      if (!trainingData || trainingData.features.length === 0) {
        console.log(`No training data available for ${token}`);
        return;
      }

      // Train each model
      for (const modelType of this.MODEL_TYPES) {
        for (const horizon of this.PREDICTION_HORIZONS) {
          const modelKey = `${modelType}_${horizon}`;
          const model = this.models.get(modelKey);

          if (!model) continue;

          try {
            await this.trainSingleModel(model, trainingData, modelKey, horizon);
          } catch (error) {
            console.error(`Error training ${modelKey}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error in training pipeline for ${token}:`, error);
    }
  }

  private async trainSingleModel(
    model: tf.LayersModel,
    data: TrainingData,
    modelKey: string,
    horizon: string
  ): Promise<void> {
    // Prepare labels based on prediction horizon
    const labels = this.prepareLabels(data, horizon);
    if (labels.length !== data.features.length) {
      console.log(`Label length mismatch for ${modelKey}`);
      return;
    }

    // Convert to tensors
    const xTrain = tf.tensor3d(data.features);
    const yTrain = tf.tensor2d(labels, [labels.length, 1]);

    // Split training/validation
    const splitIndex = Math.floor(data.features.length * 0.8);
    const xTrainSplit = xTrain.slice([0, 0, 0], [splitIndex, -1, -1]);
    const yTrainSplit = yTrain.slice([0, 0], [splitIndex, -1]);
    const xValSplit = xTrain.slice([splitIndex, 0, 0], [-1, -1, -1]);
    const yValSplit = yTrain.slice([splitIndex, 0], [-1, -1]);

    // Training configuration
    const trainConfig = {
      epochs: 50,
      batchSize: 32,
      validationData: [xValSplit, yValSplit] as [tf.Tensor, tf.Tensor],
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          if (epoch % 10 === 0) {
            console.log(
              `${modelKey} - Epoch ${epoch}: loss=${logs.loss.toFixed(
                4
              )}, val_loss=${logs.val_loss.toFixed(4)}`
            );
          }
        },
      },
    };

    // Train the model
    const history = await model.fit(xTrainSplit, yTrainSplit, trainConfig);

    // Calculate metrics
    const metrics = await this.calculateMetrics(model, xValSplit, yValSplit);
    this.modelMetrics.set(modelKey, metrics);

    // Save model
    await this.saveModel(model, modelKey);

    // Cleanup tensors
    xTrain.dispose();
    yTrain.dispose();
    xTrainSplit.dispose();
    yTrainSplit.dispose();
    xValSplit.dispose();
    yValSplit.dispose();

    console.log(
      `${modelKey} training completed. Accuracy: ${metrics.accuracy.toFixed(4)}`
    );
  }

  private prepareLabels(data: TrainingData, horizon: string): number[] {
    const labels: number[] = [];
    const shift = this.getHorizonShift(horizon);

    for (let i = 0; i < data.features.length - shift; i++) {
      // Calculate price change over the horizon
      const currentPrice = data.features[i][0]; // Assuming price is first feature
      const futurePrice = data.features[i + shift][0];
      const priceChange = (futurePrice - currentPrice) / currentPrice;
      labels.push(priceChange);
    }

    return labels;
  }

  private getHorizonShift(horizon: string): number {
    switch (horizon) {
      case "1h":
        return 1; // 1 data point ahead
      case "24h":
        return 24;
      case "7d":
        return 7 * 24;
      case "30d":
        return 30 * 24;
      default:
        return 24;
    }
  }

  private async calculateMetrics(
    model: tf.LayersModel,
    xVal: tf.Tensor,
    yVal: tf.Tensor
  ): Promise<ModelMetrics> {
    const predictions = model.predict(xVal) as tf.Tensor;
    const predData = await predictions.data();
    const trueData = await yVal.data();

    // Calculate MSE
    let mse = 0;
    let mae = 0;
    let correct = 0;

    for (let i = 0; i < predData.length; i++) {
      const pred = predData[i];
      const true_ = trueData[i];

      mse += Math.pow(pred - true_, 2);
      mae += Math.abs(pred - true_);

      // For direction accuracy
      if ((pred > 0 && true_ > 0) || (pred < 0 && true_ < 0)) {
        correct++;
      }
    }

    mse /= predData.length;
    mae /= predData.length;
    const accuracy = correct / predData.length;

    predictions.dispose();

    return {
      accuracy,
      precision: accuracy, // Simplified
      recall: accuracy,
      f1_score: accuracy,
      mse,
      mae,
    };
  }

  private async saveModel(
    model: tf.LayersModel,
    modelKey: string
  ): Promise<void> {
    try {
      const savePath = `file://./models/${modelKey}`;
      await model.save(savePath);
      console.log(`Model ${modelKey} saved successfully`);
    } catch (error) {
      console.error(`Error saving model ${modelKey}:`, error);
    }
  }

  private async prepareTrainingData(
    token: string
  ): Promise<TrainingData | null> {
    // Get 6 months of historical data for training
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    const priceData = await this.getPriceData(token, startDate, endDate);
    if (priceData.length < 100) {
      return null; // Need at least 100 data points
    }

    // Use the same feature preparation as prediction
    const features = await this.prepareFeatures(token);

    return {
      features,
      labels: [], // Will be prepared during training
      timestamps: priceData.map((p) => p.timestamp),
    };
  }

  private startModelTrainingSchedule(): void {
    // Train models daily at 2 AM
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        console.log("Starting scheduled model training...");

        const tokens = ["BTC", "ETH", "SONIC"];
        for (const token of tokens) {
          await this.trainModels(token);
        }

        console.log("Scheduled training completed");
      }
    }, 60000); // Check every minute
  }

  private async storePredictions(
    predictions: ModelPrediction[]
  ): Promise<void> {
    for (const prediction of predictions) {
      await this.prisma.aIPrediction.create({
        data: {
          token: prediction.token,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          timeframe: prediction.timeframe,
          featuresUsed: prediction.features_used,
          modelVersion: prediction.model_version,
          timestamp: new Date(prediction.timestamp),
        },
      });
    }
  }

  // Helper methods for data retrieval
  private async getPriceData(
    token: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return await this.prisma.priceData.findMany({
      where: {
        symbol: token,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: "asc" },
    });
  }

  private async getSentimentData(
    token: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return await this.prisma.sentimentData.findMany({
      where: {
        token: token,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: "asc" },
    });
  }

  private async getOnChainData(
    token: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    return await this.prisma.onChainMetric.findMany({
      where: {
        token: token,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: "asc" },
    });
  }

  private async getVolumeData(
    token: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // Simplified volume data extraction
    const priceData = await this.getPriceData(token, startDate, endDate);
    return priceData.map((p) => ({
      volumeRatio: 1,
      volumeMA: p.volume24h,
    }));
  }

  // Technical indicator calculations
  private calculateRSI(
    data: any[],
    index: number,
    period: number = 14
  ): number {
    if (index < period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = index - period + 1; i <= index; i++) {
      const change = data[i].price - data[i - 1].price;
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;

    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(data: any[], index: number): number {
    if (index < 26) return 0;

    const ema12 = this.calculateEMA(data, index, 12);
    const ema26 = this.calculateEMA(data, index, 26);

    return ema12 - ema26;
  }

  private calculateEMA(data: any[], index: number, period: number): number {
    if (index < period - 1) return data[index].price;

    const multiplier = 2 / (period + 1);
    let ema = data[index - period + 1].price;

    for (let i = index - period + 2; i <= index; i++) {
      ema = data[i].price * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  private calculateBollingerPosition(
    data: any[],
    index: number,
    period: number = 20
  ): number {
    if (index < period - 1) return 0.5;

    const prices = data
      .slice(index - period + 1, index + 1)
      .map((d) => d.price);
    const sma = prices.reduce((sum, price) => sum + price, 0) / period;
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upperBand = sma + 2 * stdDev;
    const lowerBand = sma - 2 * stdDev;
    const currentPrice = data[index].price;

    return (currentPrice - lowerBand) / (upperBand - lowerBand);
  }

  private getFeatureNames(): string[] {
    return [
      "price",
      "change24h",
      "volume24h",
      "marketCap",
      "rsi",
      "macd",
      "bollinger_position",
      "sentiment",
      "sentiment_confidence",
      "sentiment_volume",
      "active_addresses",
      "transaction_count",
      "onchain_volume",
      "volume_ratio",
      "volume_ma",
    ];
  }

  public async getModelMetrics(): Promise<Record<string, ModelMetrics>> {
    const metrics: Record<string, ModelMetrics> = {};

    for (const [key, value] of this.modelMetrics.entries()) {
      metrics[key] = value;
    }

    return metrics;
  }

  public async retrainModel(modelKey: string, token: string): Promise<boolean> {
    try {
      const model = this.models.get(modelKey);
      if (!model) return false;

      const trainingData = await this.prepareTrainingData(token);
      if (!trainingData) return false;

      const [modelType, horizon] = modelKey.split("_");
      await this.trainSingleModel(model, trainingData, modelKey, horizon);

      return true;
    } catch (error) {
      console.error(`Error retraining ${modelKey}:`, error);
      return false;
    }
  }
}
