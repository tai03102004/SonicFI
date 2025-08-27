import { PrismaClient } from "@prisma/client";
import {
  SMA,
  EMA,
  RSI,
  MACD,
  BollingerBands,
  Stochastic,
  WilliamsR,
  ATR,
  ADX,
  CCI,
} from "technicalindicators";

interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    position: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  williamsR: number;
  atr: number;
  adx: number;
  cci: number;
  momentum: number;
  rateOfChange: number;
  moneyFlowIndex: number;
  volumeIndicators: {
    obv: number;
    volumeMA: number;
    volumeRatio: number;
  };
  fibonacciLevels: number[];
  pivotPoints: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
  ichimoku: {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
  };
  parabolicSAR: number;
}

export class TechnicalAnalysisService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async calculateAllIndicators(
    token: string
  ): Promise<TechnicalIndicators> {
    // Get price data for last 200 periods for accurate calculations
    const priceData = await this.prisma.priceData.findMany({
      where: { symbol: token },
      orderBy: { timestamp: "desc" },
      take: 200,
    });

    if (priceData.length < 50) {
      throw new Error(
        `Insufficient data for ${token}. Need at least 50 data points.`
      );
    }

    // Convert to OHLCV format (simplified - using price as all OHLC values)
    const ohlcv: OHLCV[] = priceData.reverse().map((p) => ({
      timestamp: p.timestamp,
      open: p.price,
      high: p.price * 1.005, // Simulated high
      low: p.price * 0.995, // Simulated low
      close: p.price,
      volume: p.volume24h,
    }));

    const closes = ohlcv.map((d) => d.close);
    const highs = ohlcv.map((d) => d.high);
    const lows = ohlcv.map((d) => d.low);
    const volumes = ohlcv.map((d) => d.volume);

    return {
      rsi: this.calculateRSI(closes),
      macd: this.calculateMACD(closes),
      bollingerBands: this.calculateBollingerBands(closes),
      movingAverages: this.calculateMovingAverages(closes),
      stochastic: this.calculateStochastic(highs, lows, closes),
      williamsR: this.calculateWilliamsR(highs, lows, closes),
      atr: this.calculateATR(highs, lows, closes),
      adx: this.calculateADX(highs, lows, closes),
      cci: this.calculateCCI(highs, lows, closes),
      momentum: this.calculateMomentum(closes),
      rateOfChange: this.calculateRateOfChange(closes),
      moneyFlowIndex: this.calculateMoneyFlowIndex(
        highs,
        lows,
        closes,
        volumes
      ),
      volumeIndicators: this.calculateVolumeIndicators(closes, volumes),
      fibonacciLevels: this.calculateFibonacciLevels(highs, lows),
      pivotPoints: this.calculatePivotPoints(
        highs[highs.length - 1],
        lows[lows.length - 1],
        closes[closes.length - 1]
      ),
      ichimoku: this.calculateIchimoku(highs, lows, closes),
      parabolicSAR: this.calculateParabolicSAR(highs, lows),
    };
  }

  private calculateRSI(closes: number[], period: number = 14): number {
    try {
      const rsiValues = RSI.calculate({ values: closes, period });
      return rsiValues[rsiValues.length - 1] || 50;
    } catch {
      return 50; // Neutral RSI
    }
  }

  private calculateMACD(closes: number[]): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    try {
      const macdValues = MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });

      const latest = macdValues[macdValues.length - 1];
      return {
        macd: latest?.MACD || 0,
        signal: latest?.signal || 0,
        histogram: latest?.histogram || 0,
      };
    } catch {
      return { macd: 0, signal: 0, histogram: 0 };
    }
  }

  private calculateBollingerBands(
    closes: number[],
    period: number = 20,
    stdDev: number = 2
  ): {
    upper: number;
    middle: number;
    lower: number;
    position: number;
  } {
    try {
      const bbValues = BollingerBands.calculate({
        values: closes,
        period,
        stdDev,
      });

      const latest = bbValues[bbValues.length - 1];
      const currentPrice = closes[closes.length - 1];

      if (!latest) {
        return {
          upper: currentPrice,
          middle: currentPrice,
          lower: currentPrice,
          position: 0.5,
        };
      }

      const position =
        (currentPrice - latest.lower) / (latest.upper - latest.lower);

      return {
        upper: latest.upper,
        middle: latest.middle,
        lower: latest.lower,
        position: Math.max(0, Math.min(1, position)),
      };
    } catch {
      const currentPrice = closes[closes.length - 1];
      return {
        upper: currentPrice,
        middle: currentPrice,
        lower: currentPrice,
        position: 0.5,
      };
    }
  }

  private calculateMovingAverages(closes: number[]): {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  } {
    try {
      const sma20 = SMA.calculate({ values: closes, period: 20 });
      const sma50 = SMA.calculate({ values: closes, period: 50 });
      const sma200 = SMA.calculate({ values: closes, period: 200 });
      const ema12 = EMA.calculate({ values: closes, period: 12 });
      const ema26 = EMA.calculate({ values: closes, period: 26 });

      return {
        sma20: sma20[sma20.length - 1] || closes[closes.length - 1],
        sma50: sma50[sma50.length - 1] || closes[closes.length - 1],
        sma200: sma200[sma200.length - 1] || closes[closes.length - 1],
        ema12: ema12[ema12.length - 1] || closes[closes.length - 1],
        ema26: ema26[ema26.length - 1] || closes[closes.length - 1],
      };
    } catch {
      const currentPrice = closes[closes.length - 1];
      return {
        sma20: currentPrice,
        sma50: currentPrice,
        sma200: currentPrice,
        ema12: currentPrice,
        ema26: currentPrice,
      };
    }
  }

  private calculateStochastic(
    highs: number[],
    lows: number[],
    closes: number[],
    kPeriod: number = 14,
    dPeriod: number = 3
  ): {
    k: number;
    d: number;
  } {
    try {
      const stochValues = Stochastic.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: kPeriod,
        signalPeriod: dPeriod,
      });

      const latest = stochValues[stochValues.length - 1];
      return {
        k: latest?.k || 50,
        d: latest?.d || 50,
      };
    } catch {
      return { k: 50, d: 50 };
    }
  }

  private calculateWilliamsR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number {
    try {
      const wrValues = WilliamsR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });
      return wrValues[wrValues.length - 1] || -50;
    } catch {
      return -50;
    }
  }

  private calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number {
    try {
      const atrValues = ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });
      return atrValues[atrValues.length - 1] || 0;
    } catch {
      return 0;
    }
  }

  private calculateADX(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
  ): number {
    try {
      const adxValues = ADX.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });
      return adxValues[adxValues.length - 1]?.adx || 25;
    } catch {
      return 25; // Neutral ADX
    }
  }

  private calculateCCI(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 20
  ): number {
    try {
      const cciValues = CCI.calculate({
        high: highs,
        low: lows,
        close: closes,
        period,
      });
      return cciValues[cciValues.length - 1] || 0;
    } catch {
      return 0;
    }
  }

  private calculateMomentum(closes: number[], period: number = 10): number {
    if (closes.length < period + 1) return 0;

    const current = closes[closes.length - 1];
    const previous = closes[closes.length - 1 - period];

    return ((current - previous) / previous) * 100;
  }

  private calculateRateOfChange(closes: number[], period: number = 12): number {
    if (closes.length < period + 1) return 0;

    const current = closes[closes.length - 1];
    const previous = closes[closes.length - 1 - period];

    return ((current - previous) / previous) * 100;
  }

  private calculateMoneyFlowIndex(
    highs: number[],
    lows: number[],
    closes: number[],
    volumes: number[],
    period: number = 14
  ): number {
    if (closes.length < period + 1) return 50;

    const typicalPrices = closes.map(
      (close, i) => (highs[i] + lows[i] + close) / 3
    );
    const rawMoneyFlows = typicalPrices.map((tp, i) => tp * volumes[i]);

    let positiveFlow = 0;
    let negativeFlow = 0;

    for (
      let i = Math.max(0, closes.length - period);
      i < closes.length - 1;
      i++
    ) {
      if (typicalPrices[i + 1] > typicalPrices[i]) {
        positiveFlow += rawMoneyFlows[i + 1];
      } else {
        negativeFlow += rawMoneyFlows[i + 1];
      }
    }

    if (negativeFlow === 0) return 100;
    if (positiveFlow === 0) return 0;

    const moneyRatio = positiveFlow / negativeFlow;
    return 100 - 100 / (1 + moneyRatio);
  }

  private calculateVolumeIndicators(
    closes: number[],
    volumes: number[]
  ): {
    obv: number;
    volumeMA: number;
    volumeRatio: number;
  } {
    // On-Balance Volume
    let obv = 0;
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv += volumes[i];
      } else if (closes[i] < closes[i - 1]) {
        obv -= volumes[i];
      }
    }

    // Volume Moving Average (20 periods)
    const volumeMA =
      volumes.slice(-20).reduce((sum, vol) => sum + vol, 0) /
      Math.min(20, volumes.length);

    // Current volume ratio to average
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = volumeMA > 0 ? currentVolume / volumeMA : 1;

    return {
      obv,
      volumeMA,
      volumeRatio,
    };
  }

  private calculateFibonacciLevels(highs: number[], lows: number[]): number[] {
    const recentHighs = highs.slice(-50);
    const recentLows = lows.slice(-50);

    const high = Math.max(...recentHighs);
    const low = Math.min(...recentLows);
    const diff = high - low;

    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

    return fibLevels.map((level) => high - diff * level);
  }

  private calculatePivotPoints(
    high: number,
    low: number,
    close: number
  ): {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  } {
    const pivot = (high + low + close) / 3;

    return {
      pivot,
      r1: 2 * pivot - low,
      r2: pivot + (high - low),
      r3: high + 2 * (pivot - low),
      s1: 2 * pivot - high,
      s2: pivot - (high - low),
      s3: low - 2 * (high - pivot),
    };
  }

  private calculateIchimoku(
    highs: number[],
    lows: number[],
    closes: number[]
  ): {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
  } {
    const len = closes.length;

    // Tenkan-sen (Conversion Line): (9-period high + 9-period low)/2
    const tenkanHigh = Math.max(...highs.slice(-9));
    const tenkanLow = Math.min(...lows.slice(-9));
    const tenkanSen = (tenkanHigh + tenkanLow) / 2;

    // Kijun-sen (Base Line): (26-period high + 26-period low)/2
    const kijunHigh = Math.max(...highs.slice(-26));
    const kijunLow = Math.min(...lows.slice(-26));
    const kijunSen = (kijunHigh + kijunLow) / 2;

    // Senkou Span A (Leading Span A): (Conversion Line + Base Line)/2
    const senkouSpanA = (tenkanSen + kijunSen) / 2;

    // Senkou Span B (Leading Span B): (52-period high + 52-period low)/2
    const senkouHigh = Math.max(...highs.slice(-52));
    const senkouLow = Math.min(...lows.slice(-52));
    const senkouSpanB = (senkouHigh + senkouLow) / 2;

    // Chikou Span (Lagging Span): Close plotted 26 periods in the past
    const chikouSpan = len >= 26 ? closes[len - 26] : closes[0];

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan,
    };
  }

  private calculateParabolicSAR(
    highs: number[],
    lows: number[],
    step: number = 0.02,
    max: number = 0.2
  ): number {
    if (highs.length < 2) return highs[highs.length - 1] || 0;

    // Simplified Parabolic SAR calculation
    // In a real implementation, you'd track the full SAR state
    let sar = lows[0];
    let ep = highs[0];
    let af = step;
    let isUpTrend = true;

    for (let i = 1; i < highs.length; i++) {
      const prevSar = sar;

      if (isUpTrend) {
        sar = prevSar + af * (ep - prevSar);

        if (highs[i] > ep) {
          ep = highs[i];
          af = Math.min(af + step, max);
        }

        if (lows[i] <= sar) {
          isUpTrend = false;
          sar = ep;
          ep = lows[i];
          af = step;
        }
      } else {
        sar = prevSar + af * (ep - prevSar);

        if (lows[i] < ep) {
          ep = lows[i];
          af = Math.min(af + step, max);
        }

        if (highs[i] >= sar) {
          isUpTrend = true;
          sar = ep;
          ep = highs[i];
          af = step;
        }
      }
    }

    return sar;
  }

  // ...existing code...

  public async getSignalStrength(token: string): Promise<{
    overall: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
    score: number;
    breakdown: Record<string, number>;
  }> {
    try {
      const indicators = await this.calculateAllIndicators(token);

      // Calculate individual signal scores (-1 to 1)
      const signals = {
        rsi: this.getRSISignal(indicators.rsi),
        macd: this.getMACDSignal(indicators.macd),
        bollingerBands: this.getBollingerSignal(indicators.bollingerBands),
        movingAverages: this.getMASignal(indicators.movingAverages),
        stochastic: this.getStochasticSignal(indicators.stochastic),
        williamsR: this.getWilliamsRSignal(indicators.williamsR),
        adx: this.getADXSignal(indicators.adx),
        cci: this.getCCISignal(indicators.cci),
        momentum: this.getMomentumSignal(indicators.momentum),
        volumeIndicators: this.getVolumeSignal(indicators.volumeIndicators),
        ichimoku: this.getIchimokuSignal(indicators.ichimoku),
        parabolicSAR: this.getParabolicSARSignal(indicators.parabolicSAR),
      };

      // Calculate weighted average (some indicators are more reliable)
      const weights = {
        rsi: 0.12,
        macd: 0.15,
        bollingerBands: 0.1,
        movingAverages: 0.18,
        stochastic: 0.08,
        williamsR: 0.06,
        adx: 0.1,
        cci: 0.06,
        momentum: 0.08,
        volumeIndicators: 0.12,
        ichimoku: 0.1,
        parabolicSAR: 0.05,
      };

      let weightedScore = 0;
      let totalWeight = 0;

      for (const [indicator, signal] of Object.entries(signals)) {
        const weight = weights[indicator as keyof typeof weights];
        weightedScore += signal * weight;
        totalWeight += weight;
      }

      const finalScore = weightedScore / totalWeight;

      // Determine overall signal
      let overall: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
      if (finalScore >= 0.6) overall = "strong_buy";
      else if (finalScore >= 0.2) overall = "buy";
      else if (finalScore >= -0.2) overall = "neutral";
      else if (finalScore >= -0.6) overall = "sell";
      else overall = "strong_sell";

      return {
        overall,
        score: finalScore,
        breakdown: signals,
      };
    } catch (error) {
      return {
        overall: "neutral",
        score: 0,
        breakdown: {},
      };
    }
  }

  private getRSISignal(rsi: number): number {
    if (rsi >= 70) return -0.8; // Overbought
    if (rsi >= 60) return -0.4;
    if (rsi >= 40) return 0; // Neutral
    if (rsi >= 30) return 0.4;
    return 0.8; // Oversold
  }

  private getMACDSignal(macd: {
    macd: number;
    signal: number;
    histogram: number;
  }): number {
    let score = 0;

    // MACD line vs Signal line
    if (macd.macd > macd.signal) score += 0.5;
    else score -= 0.5;

    // Histogram direction
    if (macd.histogram > 0) score += 0.3;
    else score -= 0.3;

    // MACD line direction (simplified)
    if (macd.macd > 0) score += 0.2;
    else score -= 0.2;

    return Math.max(-1, Math.min(1, score));
  }

  private getBollingerSignal(bb: {
    upper: number;
    middle: number;
    lower: number;
    position: number;
  }): number {
    if (bb.position >= 0.8) return -0.6; // Near upper band
    if (bb.position >= 0.6) return -0.3;
    if (bb.position >= 0.4) return 0; // Middle area
    if (bb.position >= 0.2) return 0.3;
    return 0.6; // Near lower band
  }

  private getMASignal(ma: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  }): number {
    let score = 0;

    // Short-term trend (EMA12 vs EMA26)
    if (ma.ema12 > ma.ema26) score += 0.3;
    else score -= 0.3;

    // Medium-term trend (SMA20 vs SMA50)
    if (ma.sma20 > ma.sma50) score += 0.4;
    else score -= 0.4;

    // Long-term trend (SMA50 vs SMA200)
    if (ma.sma50 > ma.sma200) score += 0.3;
    else score -= 0.3;

    return Math.max(-1, Math.min(1, score));
  }

  private getStochasticSignal(stoch: { k: number; d: number }): number {
    let score = 0;

    // Overbought/Oversold levels
    if (stoch.k >= 80) score -= 0.6;
    else if (stoch.k >= 20) score = 0;
    else score += 0.6;

    // K vs D crossover
    if (stoch.k > stoch.d) score += 0.4;
    else score -= 0.4;

    return Math.max(-1, Math.min(1, score));
  }

  private getWilliamsRSignal(wr: number): number {
    if (wr >= -20) return -0.8; // Overbought
    if (wr >= -50) return 0; // Neutral
    return 0.8; // Oversold
  }

  private getADXSignal(adx: number): number {
    // ADX doesn't indicate direction, just trend strength
    // We use it as a filter - strong trends are more reliable
    if (adx >= 40) return 0.3; // Strong trend
    if (adx >= 25) return 0.1; // Moderate trend
    return -0.1; // Weak trend
  }

  private getCCISignal(cci: number): number {
    if (cci >= 100) return -0.7; // Overbought
    if (cci >= 50) return -0.3;
    if (cci >= -50) return 0; // Neutral
    if (cci >= -100) return 0.3;
    return 0.7; // Oversold
  }

  private getMomentumSignal(momentum: number): number {
    if (momentum >= 5) return 0.8;
    if (momentum >= 2) return 0.4;
    if (momentum >= -2) return 0;
    if (momentum >= -5) return -0.4;
    return -0.8;
  }

  private getVolumeSignal(volume: {
    obv: number;
    volumeMA: number;
    volumeRatio: number;
  }): number {
    let score = 0;

    // Volume ratio (current vs average)
    if (volume.volumeRatio >= 1.5) score += 0.4; // High volume
    else if (volume.volumeRatio >= 0.8) score += 0.1;
    else score -= 0.2; // Low volume

    // OBV trend (simplified)
    if (volume.obv > 0) score += 0.3;
    else score -= 0.3;

    return Math.max(-1, Math.min(1, score));
  }

  private getIchimokuSignal(ichimoku: {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
  }): number {
    let score = 0;

    // Tenkan-sen vs Kijun-sen
    if (ichimoku.tenkanSen > ichimoku.kijunSen) score += 0.3;
    else score -= 0.3;

    // Cloud analysis (Senkou Spans)
    if (ichimoku.senkouSpanA > ichimoku.senkouSpanB) score += 0.4;
    else score -= 0.4;

    // Chikou Span
    if (ichimoku.chikouSpan > 0) score += 0.3; // Simplified
    else score -= 0.3;

    return Math.max(-1, Math.min(1, score));
  }

  private getParabolicSARSignal(sar: number): number {
    // This is simplified - in reality, you'd compare SAR with current price
    // and track the trend direction
    return 0; // Neutral for simplified implementation
  }
}
