import { EventEmitter } from "events";

export interface TradeEntry {
  id: string;
  timestamp: Date;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
  commission: number;
  swap: number;
  duration?: number; // in seconds
  accountId: string;
  broker: string;
  reason: string; // signal reason that triggered the trade
  signalStrength: "weak" | "medium" | "strong" | "very_strong";
  marketCondition: "trending" | "ranging" | "volatile" | "calm";
  success: boolean;
}

export interface TradeAnalysis {
  tradeId: string;
  entryQuality: number; // 0-100 score
  exitQuality: number; // 0-100 score
  timingScore: number; // 0-100 score
  riskManagement: number; // 0-100 score
  overallScore: number; // 0-100 score
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  marketContext: {
    volatility: number;
    trend: "up" | "down" | "sideways";
    support: number;
    resistance: number;
    newsImpact: "low" | "medium" | "high";
  };
  replay: {
    keyMoments: Array<{
      timestamp: Date;
      event: string;
      priceAction: number;
      decision: string;
    }>;
    alternativeOutcomes: Array<{
      scenario: string;
      potentialProfit: number;
      probability: number;
    }>;
  };
}

export interface ReplayRequest {
  tradeId?: string;
  accountId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  symbol?: string;
  minProfit?: number;
  maxProfit?: number;
  analysisType: "single" | "batch" | "pattern" | "comparison";
}

export class TradeReplayAnalyzer extends EventEmitter {
  private tradeHistory: Map<string, TradeEntry> = new Map();
  private analysisCache: Map<string, TradeAnalysis> = new Map();
  private isAnalyzing: boolean = false;

  constructor() {
    super();
    this.initializeMockTradeHistory();
  }

  private initializeMockTradeHistory(): void {
    // Initialize with some realistic trade data based on the current system
    const mockTrades: TradeEntry[] = [
      {
        id: "trade_001",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        symbol: "XAUUSD",
        type: "buy",
        volume: 0.1,
        openPrice: 2658.45,
        closePrice: 2661.2,
        stopLoss: 2650.0,
        takeProfit: 2670.0,
        profit: 275.5,
        commission: -3.5,
        swap: -0.25,
        duration: 2400, // 40 minutes
        accountId: "205251387",
        broker: "Exness",
        reason: "World Gold Scanner - London Fix Pressure",
        signalStrength: "strong",
        marketCondition: "trending",
        success: true,
      },
      {
        id: "trade_002",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        symbol: "XAUUSD",
        type: "sell",
        volume: 0.05,
        openPrice: 2662.8,
        closePrice: 2659.15,
        stopLoss: 2668.0,
        takeProfit: 2655.0,
        profit: 182.5,
        commission: -1.75,
        swap: 0.15,
        duration: 1800, // 30 minutes
        accountId: "405691964",
        broker: "Exness",
        reason: "SJC Pressure Attack - Spread Arbitrage",
        signalStrength: "very_strong",
        marketCondition: "volatile",
        success: true,
      },
      {
        id: "trade_003",
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        symbol: "XAUUSD",
        type: "buy",
        volume: 0.08,
        openPrice: 2655.2,
        closePrice: 2652.9,
        stopLoss: 2650.0,
        takeProfit: 2665.0,
        profit: -184.0,
        commission: -2.8,
        swap: -0.2,
        duration: 900, // 15 minutes
        accountId: "205251387",
        broker: "Exness",
        reason: "FED Signal - Rate Decision Impact",
        signalStrength: "medium",
        marketCondition: "volatile",
        success: false,
      },
    ];

    mockTrades.forEach((trade) => {
      this.tradeHistory.set(trade.id, trade);
    });
  }

  async performOneClickAnalysis(
    request: ReplayRequest,
  ): Promise<TradeAnalysis[]> {
    this.isAnalyzing = true;
    this.emit("analysisStarted", { request });

    try {
      let tradesToAnalyze: TradeEntry[] = [];

      if (request.tradeId) {
        const trade = this.tradeHistory.get(request.tradeId);
        if (trade) tradesToAnalyze = [trade];
      } else {
        tradesToAnalyze = Array.from(this.tradeHistory.values()).filter(
          (trade) => this.matchesFilters(trade, request),
        );
      }

      const analyses: TradeAnalysis[] = [];

      for (const trade of tradesToAnalyze) {
        const analysis = await this.analyzeTrade(trade);
        analyses.push(analysis);
        this.analysisCache.set(trade.id, analysis);

        this.emit("tradeAnalyzed", { tradeId: trade.id, analysis });
      }

      this.emit("analysisCompleted", {
        totalTrades: analyses.length,
        successfulTrades: analyses.filter((a) => a.overallScore >= 70).length,
        averageScore:
          analyses.reduce((sum, a) => sum + a.overallScore, 0) /
          analyses.length,
      });

      return analyses;
    } finally {
      this.isAnalyzing = false;
    }
  }

  private matchesFilters(trade: TradeEntry, request: ReplayRequest): boolean {
    if (request.accountId && trade.accountId !== request.accountId)
      return false;
    if (request.symbol && trade.symbol !== request.symbol) return false;
    if (request.timeRange) {
      if (
        trade.timestamp < request.timeRange.start ||
        trade.timestamp > request.timeRange.end
      ) {
        return false;
      }
    }
    if (
      request.minProfit !== undefined &&
      (trade.profit || 0) < request.minProfit
    )
      return false;
    if (
      request.maxProfit !== undefined &&
      (trade.profit || 0) > request.maxProfit
    )
      return false;

    return true;
  }

  private async analyzeTrade(trade: TradeEntry): Promise<TradeAnalysis> {
    // Simulate analysis processing
    await this.delay(500);

    const entryQuality = this.calculateEntryQuality(trade);
    const exitQuality = this.calculateExitQuality(trade);
    const timingScore = this.calculateTimingScore(trade);
    const riskManagement = this.calculateRiskManagement(trade);
    const overallScore =
      (entryQuality + exitQuality + timingScore + riskManagement) / 4;

    const analysis: TradeAnalysis = {
      tradeId: trade.id,
      entryQuality,
      exitQuality,
      timingScore,
      riskManagement,
      overallScore,
      strengths: this.identifyStrengths(trade),
      weaknesses: this.identifyWeaknesses(trade),
      improvements: this.suggestImprovements(trade),
      marketContext: this.analyzeMarketContext(trade),
      replay: {
        keyMoments: this.generateKeyMoments(trade),
        alternativeOutcomes: this.generateAlternativeOutcomes(trade),
      },
    };

    return analysis;
  }

  private calculateEntryQuality(trade: TradeEntry): number {
    let score = 50; // base score

    // Signal strength bonus
    const signalBonus = {
      weak: 0,
      medium: 10,
      strong: 20,
      very_strong: 30,
    };
    score += signalBonus[trade.signalStrength];

    // Market condition factor
    if (trade.marketCondition === "trending" && trade.success) score += 15;
    if (trade.marketCondition === "volatile" && !trade.success) score -= 10;

    // Specific signal type bonus
    if (trade.reason.includes("SJC Pressure Attack")) score += 15;
    if (trade.reason.includes("World Gold Scanner")) score += 10;
    if (trade.reason.includes("FED Signal")) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }

  private calculateExitQuality(trade: TradeEntry): number {
    if (!trade.closePrice) return 50;

    let score = 50;
    const priceDiff = Math.abs(
      ((trade.closePrice - trade.openPrice) / trade.openPrice) * 100,
    );

    // Profit factor
    if (trade.success && trade.profit && trade.profit > 100) score += 25;
    if (trade.success && trade.profit && trade.profit > 200) score += 15;
    if (!trade.success && trade.profit && trade.profit < -50) score -= 20;

    // Duration factor
    if (trade.duration) {
      if (trade.duration < 1800 && trade.success) score += 10; // Quick profitable exit
      if (trade.duration > 3600 && !trade.success) score -= 15; // Held losing position too long
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private calculateTimingScore(trade: TradeEntry): number {
    let score = 60;

    // Market timing based on hour
    const hour = trade.timestamp.getHours();
    if (hour >= 8 && hour <= 10) score += 15; // London open
    if (hour >= 13 && hour <= 15) score += 10; // NY open
    if (hour >= 22 || hour <= 2) score -= 10; // Low liquidity hours

    // Day of week factor
    const day = trade.timestamp.getDay();
    if (day >= 1 && day <= 4) score += 5; // Weekdays
    if (day === 5) score -= 5; // Friday
    if (day === 0 || day === 6) score -= 15; // Weekend

    return Math.min(Math.max(score, 0), 100);
  }

  private calculateRiskManagement(trade: TradeEntry): number {
    let score = 50;

    // Stop loss presence
    if (trade.stopLoss) score += 20;

    // Take profit presence
    if (trade.takeProfit) score += 15;

    // Risk-reward ratio
    if (trade.stopLoss && trade.takeProfit) {
      const risk = Math.abs(trade.openPrice - trade.stopLoss);
      const reward = Math.abs(trade.takeProfit - trade.openPrice);
      const ratio = reward / risk;

      if (ratio >= 2) score += 15;
      else if (ratio >= 1.5) score += 10;
      else if (ratio < 1) score -= 10;
    }

    // Position size relative to account
    if (trade.volume <= 0.1) score += 10; // Conservative sizing
    if (trade.volume > 0.2) score -= 15; // Aggressive sizing

    return Math.min(Math.max(score, 0), 100);
  }

  private identifyStrengths(trade: TradeEntry): string[] {
    const strengths: string[] = [];

    if (
      trade.signalStrength === "very_strong" ||
      trade.signalStrength === "strong"
    ) {
      strengths.push("Strong signal confirmation");
    }

    if (trade.success && trade.profit && trade.profit > 150) {
      strengths.push("Excellent profit capture");
    }

    if (trade.stopLoss && trade.takeProfit) {
      strengths.push("Proper risk management setup");
    }

    if (trade.duration && trade.duration < 1800 && trade.success) {
      strengths.push("Quick profit realization");
    }

    if (trade.reason.includes("SJC Pressure Attack")) {
      strengths.push("Utilized proprietary SJC attack strategy");
    }

    return strengths;
  }

  private identifyWeaknesses(trade: TradeEntry): string[] {
    const weaknesses: string[] = [];

    if (!trade.success) {
      weaknesses.push("Trade resulted in loss");
    }

    if (!trade.stopLoss) {
      weaknesses.push("No stop loss protection");
    }

    if (!trade.takeProfit) {
      weaknesses.push("No defined profit target");
    }

    if (trade.duration && trade.duration > 3600 && !trade.success) {
      weaknesses.push("Held losing position too long");
    }

    if (trade.signalStrength === "weak") {
      weaknesses.push("Weak signal strength");
    }

    return weaknesses;
  }

  private suggestImprovements(trade: TradeEntry): string[] {
    const improvements: string[] = [];

    if (!trade.stopLoss) {
      improvements.push("Always set stop loss before entering position");
    }

    if (!trade.takeProfit) {
      improvements.push("Define profit targets based on technical analysis");
    }

    if (!trade.success && trade.signalStrength !== "very_strong") {
      improvements.push(
        "Only trade very strong signals in volatile conditions",
      );
    }

    if (trade.volume > 0.15) {
      improvements.push(
        "Consider smaller position sizes for better risk management",
      );
    }

    improvements.push("Combine multiple signal sources for confirmation");
    improvements.push(
      "Monitor SJC pressure attack opportunities more frequently",
    );

    return improvements;
  }

  private analyzeMarketContext(
    trade: TradeEntry,
  ): TradeAnalysis["marketContext"] {
    return {
      volatility: Math.random() * 30 + 10, // 10-40%
      trend: trade.type === "buy" ? "up" : "down",
      support: trade.openPrice - (Math.random() * 5 + 2),
      resistance: trade.openPrice + (Math.random() * 5 + 2),
      newsImpact: trade.reason.includes("FED")
        ? "high"
        : trade.reason.includes("SJC")
          ? "medium"
          : "low",
    };
  }

  private generateKeyMoments(
    trade: TradeEntry,
  ): TradeAnalysis["replay"]["keyMoments"] {
    const moments = [];

    moments.push({
      timestamp: trade.timestamp,
      event: "Signal Generated",
      priceAction: trade.openPrice,
      decision: `${trade.reason} triggered ${trade.type} signal`,
    });

    if (trade.duration) {
      const midTime = new Date(
        trade.timestamp.getTime() + trade.duration * 500,
      );
      moments.push({
        timestamp: midTime,
        event: "Mid-trade Analysis",
        priceAction: trade.openPrice + (Math.random() - 0.5) * 2,
        decision: trade.success
          ? "Position moving favorably"
          : "Position under pressure",
      });
    }

    if (trade.closePrice) {
      const closeTime = new Date(
        trade.timestamp.getTime() + (trade.duration || 1800) * 1000,
      );
      moments.push({
        timestamp: closeTime,
        event: "Trade Closed",
        priceAction: trade.closePrice,
        decision: trade.success
          ? "Profit target reached"
          : "Stop loss triggered",
      });
    }

    return moments;
  }

  private generateAlternativeOutcomes(
    trade: TradeEntry,
  ): TradeAnalysis["replay"]["alternativeOutcomes"] {
    return [
      {
        scenario: "Hold position longer",
        potentialProfit: (trade.profit || 0) + (Math.random() * 200 - 100),
        probability: 0.6,
      },
      {
        scenario: "Tighter stop loss",
        potentialProfit: (trade.profit || 0) * 0.7,
        probability: 0.8,
      },
      {
        scenario: "Larger position size",
        potentialProfit: (trade.profit || 0) * 1.5,
        probability: 0.4,
      },
      {
        scenario: "Wait for stronger signal",
        potentialProfit: trade.success ? (trade.profit || 0) * 1.2 : 0,
        probability: 0.7,
      },
    ];
  }

  async addTrade(trade: TradeEntry): Promise<void> {
    this.tradeHistory.set(trade.id, trade);
    this.emit("tradeAdded", { trade });
  }

  getTradeHistory(accountId?: string): TradeEntry[] {
    const trades = Array.from(this.tradeHistory.values());
    return accountId ? trades.filter((t) => t.accountId === accountId) : trades;
  }

  getCachedAnalysis(tradeId: string): TradeAnalysis | undefined {
    return this.analysisCache.get(tradeId);
  }

  isAnalysisInProgress(): boolean {
    return this.isAnalyzing;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const tradeReplayAnalyzer = new TradeReplayAnalyzer();
