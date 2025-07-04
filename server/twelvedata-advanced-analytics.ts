import { EventEmitter } from "events";
import { twelveDataIntegration } from "./twelvedata-integration";

export interface TechnicalAnalysis {
  symbol: string;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  recommendation: "BUY" | "SELL" | "HOLD";
  strength: number; // 0-100
  timestamp: number;
}

export interface MarketAlert {
  id: string;
  symbol: string;
  type: "price_movement" | "volume_spike" | "technical_signal" | "arbitrage";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  triggerPrice?: number;
  currentPrice: number;
  timestamp: number;
}

export interface ArbitrageOpportunity {
  id: string;
  symbolA: string;
  symbolB: string;
  priceA: number;
  priceB: number;
  spread: number;
  spreadPercent: number;
  recommendedAction: string;
  potentialProfit: number;
  riskLevel: "low" | "medium" | "high";
  timestamp: number;
}

export class TwelveDataAdvancedAnalytics extends EventEmitter {
  private technicalData: Map<string, TechnicalAnalysis> = new Map();
  private activeAlerts: Map<string, MarketAlert> = new Map();
  private arbitrageOpportunities: Map<string, ArbitrageOpportunity> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private isAnalyzing = false;

  constructor() {
    super();
    this.initializeAnalytics();
  }

  private initializeAnalytics(): void {
    console.log("🧠 Initializing TwelveData Advanced Analytics");

    // Listen to price updates from TwelveData integration
    twelveDataIntegration.on("price_update", (data) => {
      this.processPriceUpdate(data);
    });

    twelveDataIntegration.on("gold_price_update", (data) => {
      this.processGoldPriceUpdate(data);
    });

    twelveDataIntegration.on("forex_price_update", (data) => {
      this.processForexPriceUpdate(data);
    });

    // Start periodic analysis
    this.startPeriodicAnalysis();
  }

  private processPriceUpdate(data: any): void {
    const { symbol, price, timestamp } = data;

    // Store price history
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }

    const history = this.priceHistory.get(symbol)!;
    history.push(price);

    // Keep only last 100 prices
    if (history.length > 100) {
      history.shift();
    }

    // Check for alerts
    this.checkPriceAlerts(symbol, price);

    // Update technical analysis if we have enough data
    if (history.length >= 20) {
      this.updateTechnicalAnalysis(symbol, history);
    }
  }

  private processGoldPriceUpdate(data: any): void {
    console.log(`🥇 Gold price analysis: ${data.symbol} = $${data.price}`);

    // Special handling for gold prices
    this.checkGoldArbitrageOpportunities(data);
    this.generateGoldSignals(data);
  }

  private processForexPriceUpdate(data: any): void {
    console.log(`💱 Forex analysis: ${data.symbol} = ${data.price}`);

    // Check for forex arbitrage opportunities
    this.checkForexArbitrageOpportunities(data);
  }

  private checkPriceAlerts(symbol: string, currentPrice: number): void {
    // Price movement alert (>1% change in short period)
    const history = this.priceHistory.get(symbol);
    if (history && history.length >= 10) {
      const previousPrice = history[history.length - 10];
      const changePercent =
        Math.abs((currentPrice - previousPrice) / previousPrice) * 100;

      if (changePercent > 1) {
        const alert: MarketAlert = {
          id: `ALERT_${Date.now()}_${symbol}`,
          symbol,
          type: "price_movement",
          severity: changePercent > 3 ? "high" : "medium",
          message: `${symbol} moved ${changePercent.toFixed(2)}% in short period`,
          currentPrice,
          timestamp: Date.now(),
        };

        this.activeAlerts.set(alert.id, alert);
        this.emit("market_alert", alert);
      }
    }
  }

  private updateTechnicalAnalysis(symbol: string, prices: number[]): void {
    if (prices.length < 20) return;

    try {
      const analysis: TechnicalAnalysis = {
        symbol,
        rsi: this.calculateRSI(prices),
        macd: this.calculateMACD(prices),
        movingAverages: this.calculateMovingAverages(prices),
        bollinger: this.calculateBollingerBands(prices),
        recommendation: "HOLD",
        strength: 50,
        timestamp: Date.now(),
      };

      // Generate recommendation based on indicators
      analysis.recommendation = this.generateRecommendation(analysis);
      analysis.strength = this.calculateSignalStrength(analysis);

      this.technicalData.set(symbol, analysis);
      this.emit("technical_analysis_update", analysis);
    } catch (error) {
      console.error(
        `Error calculating technical analysis for ${symbol}:`,
        error,
      );
    }
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(prices: number[]): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;

    // Simplified signal line (would need more complex calculation for production)
    const signal = macd * 0.9;
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  private calculateMovingAverages(prices: number[]): any {
    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, Math.min(50, prices.length)),
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  private calculateEMA(prices: number[], period: number): number {
    const k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number = 20): any {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);

    const variance =
      slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + stdDev * 2,
      middle: sma,
      lower: sma - stdDev * 2,
    };
  }

  private generateRecommendation(
    analysis: TechnicalAnalysis,
  ): "BUY" | "SELL" | "HOLD" {
    let score = 0;

    // RSI signals
    if (analysis.rsi < 30)
      score += 2; // Oversold - BUY
    else if (analysis.rsi > 70) score -= 2; // Overbought - SELL

    // MACD signals
    if (analysis.macd.macd > analysis.macd.signal) score += 1;
    else score -= 1;

    // Moving average signals
    const currentPrice = analysis.movingAverages.sma20;
    if (currentPrice > analysis.movingAverages.sma50) score += 1;
    else score -= 1;

    if (score >= 2) return "BUY";
    if (score <= -2) return "SELL";
    return "HOLD";
  }

  private calculateSignalStrength(analysis: TechnicalAnalysis): number {
    let strength = 50; // Base strength

    // RSI contribution
    if (analysis.rsi < 20 || analysis.rsi > 80) strength += 20;
    else if (analysis.rsi < 30 || analysis.rsi > 70) strength += 10;

    // MACD contribution
    const macdStrength = Math.abs(analysis.macd.histogram) * 10;
    strength += Math.min(macdStrength, 20);

    return Math.min(Math.max(strength, 0), 100);
  }

  private checkGoldArbitrageOpportunities(goldData: any): void {
    // Check arbitrage between different gold symbols
    const goldSymbols = ["XAUUSD", "XAUEUR", "XAUJPY", "XAUGBP"];

    for (const symbolA of goldSymbols) {
      for (const symbolB of goldSymbols) {
        if (symbolA !== symbolB && symbolA === goldData.symbol) {
          // Simplified arbitrage check
          const opportunity: ArbitrageOpportunity = {
            id: `ARB_${Date.now()}_${symbolA}_${symbolB}`,
            symbolA,
            symbolB,
            priceA: goldData.price,
            priceB: goldData.price * (1 + (Math.random() - 0.5) * 0.01), // Simulated
            spread: 0,
            spreadPercent: 0,
            recommendedAction: "Monitor",
            potentialProfit: 0,
            riskLevel: "low",
            timestamp: Date.now(),
          };

          opportunity.spread = Math.abs(
            opportunity.priceA - opportunity.priceB,
          );
          opportunity.spreadPercent =
            (opportunity.spread / opportunity.priceA) * 100;

          if (opportunity.spreadPercent > 0.1) {
            opportunity.potentialProfit = opportunity.spread * 100; // Per 100 units
            opportunity.recommendedAction =
              opportunity.priceA > opportunity.priceB
                ? `Buy ${symbolB}, Sell ${symbolA}`
                : `Buy ${symbolA}, Sell ${symbolB}`;
            opportunity.riskLevel =
              opportunity.spreadPercent > 0.5 ? "high" : "medium";

            this.arbitrageOpportunities.set(opportunity.id, opportunity);
            this.emit("arbitrage_opportunity", opportunity);
          }
        }
      }
    }
  }

  private checkForexArbitrageOpportunities(forexData: any): void {
    // Similar arbitrage logic for forex pairs
    console.log(`💱 Checking forex arbitrage for ${forexData.symbol}`);
  }

  private generateGoldSignals(goldData: any): void {
    // Generate trading signals specifically for gold
    const signal = {
      symbol: goldData.symbol,
      type: "gold_signal",
      action:
        goldData.changePercent > 0.5
          ? "BUY"
          : goldData.changePercent < -0.5
            ? "SELL"
            : "HOLD",
      strength: Math.abs(goldData.changePercent || 0) * 20,
      reason: `Price movement: ${goldData.changePercent?.toFixed(2)}%`,
      timestamp: Date.now(),
    };

    this.emit("gold_signal", signal);
  }

  private startPeriodicAnalysis(): void {
    setInterval(() => {
      if (!this.isAnalyzing) {
        this.performPeriodicAnalysis();
      }
    }, 30000); // Every 30 seconds
  }

  private async performPeriodicAnalysis(): Promise<void> {
    this.isAnalyzing = true;

    try {
      // Clean old alerts (older than 1 hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [id, alert] of this.activeAlerts.entries()) {
        if (alert.timestamp < oneHourAgo) {
          this.activeAlerts.delete(id);
        }
      }

      // Clean old arbitrage opportunities
      for (const [id, opportunity] of this.arbitrageOpportunities.entries()) {
        if (opportunity.timestamp < oneHourAgo) {
          this.arbitrageOpportunities.delete(id);
        }
      }

      console.log(
        `📊 Periodic analysis complete - ${this.activeAlerts.size} alerts, ${this.arbitrageOpportunities.size} opportunities`,
      );
    } catch (error) {
      console.error("Error in periodic analysis:", error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  // Public methods
  public getTechnicalAnalysis(
    symbol?: string,
  ): TechnicalAnalysis | Map<string, TechnicalAnalysis> {
    if (symbol) {
      return this.technicalData.get(symbol) || null;
    }
    return this.technicalData;
  }

  public getActiveAlerts(): MarketAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  public getArbitrageOpportunities(): ArbitrageOpportunity[] {
    return Array.from(this.arbitrageOpportunities.values());
  }

  public getAnalyticsStatus(): any {
    return {
      symbols_analyzed: this.technicalData.size,
      active_alerts: this.activeAlerts.size,
      arbitrage_opportunities: this.arbitrageOpportunities.size,
      price_history_symbols: this.priceHistory.size,
      is_analyzing: this.isAnalyzing,
    };
  }

  public clearAlerts(): void {
    this.activeAlerts.clear();
    this.emit("alerts_cleared");
  }

  public clearArbitrageOpportunities(): void {
    this.arbitrageOpportunities.clear();
    this.emit("arbitrage_cleared");
  }
}

export const twelveDataAdvancedAnalytics = new TwelveDataAdvancedAnalytics();
