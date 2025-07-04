import { EventEmitter } from "events";
import { execSync } from "child_process";

export interface ScanResult {
  timestamp: string;
  symbol: string;
  side: "buy" | "sell" | "both";
  startTime: string;
  endTime: string;
  startPrice: number;
  endPrice: number;
  priceChange: number;
  liquidityData: {
    buyLiquidity: number;
    sellLiquidity: number;
    buyPercent: number;
    sellPercent: number;
    totalLiquidity: number;
  };
  marketPressure: string;
  opportunities: string[];
  riskScore: number;
}

export interface DepthLevel {
  level: number;
  price: number;
  volume: number;
  percentage: number;
  strength: "WEAK" | "MEDIUM" | "STRONG";
}

export interface DepthAnalysis {
  symbol: string;
  side: "buy" | "sell";
  currentPrice: number;
  levels: DepthLevel[];
  totalVolume: number;
  marketImpact: number;
  slippageRisk: number;
  optimalOrderSize: number;
  breakdownProbability?: number;
  supportLevels?: number[];
  resistanceLevels?: number[];
}

export class LiquidityScannerAPI extends EventEmitter {
  private activeScanners = new Map<string, NodeJS.Timeout>();
  private scanHistory: ScanResult[] = [];

  constructor() {
    super();
  }

  // Single scan for buy/sell/both sides
  async performSingleScan(
    side: "buy" | "sell" | "both" = "both",
  ): Promise<ScanResult> {
    const startTime = new Date().toISOString();
    const startPrice = 2680 + (Math.random() * 20 - 10);

    console.log(`Starting ${side} liquidity scan at $${startPrice.toFixed(2)}`);

    // Simulate scan delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const endPrice = startPrice + (Math.random() - 0.5) * 8;
    const priceChange = ((endPrice - startPrice) / startPrice) * 100;

    // Generate realistic liquidity data
    const buyLiquidity = Math.random() * 5000000 + 2000000;
    const sellLiquidity = Math.random() * 5000000 + 2000000;
    const totalLiquidity = buyLiquidity + sellLiquidity;

    const buyPercent = (buyLiquidity / totalLiquidity) * 100;
    const sellPercent = (sellLiquidity / totalLiquidity) * 100;

    // Determine market pressure
    let marketPressure: string;
    if (buyPercent > 60) {
      marketPressure = "STRONG_BUY_PRESSURE";
    } else if (sellPercent > 60) {
      marketPressure = "STRONG_SELL_PRESSURE";
    } else {
      marketPressure = "BALANCED_LIQUIDITY";
    }

    // Generate opportunities
    const opportunities: string[] = [];
    const signal = Math.random();
    if (signal > 0.7) {
      opportunities.push("Strong breakout potential detected");
      opportunities.push("High volume confirmation signal");
    } else if (signal < 0.3) {
      opportunities.push("Breakdown risk identified");
      opportunities.push("Bearish momentum building");
    } else {
      opportunities.push("Range-bound conditions");
      opportunities.push("Wait for clearer direction");
    }

    const result: ScanResult = {
      timestamp: startTime,
      symbol: "XAUUSD",
      side,
      startTime: startTime.split("T")[1].split(".")[0],
      endTime: new Date().toISOString().split("T")[1].split(".")[0],
      startPrice,
      endPrice,
      priceChange: parseFloat(priceChange.toFixed(2)),
      liquidityData: {
        buyLiquidity: Math.round(buyLiquidity),
        sellLiquidity: Math.round(sellLiquidity),
        buyPercent: parseFloat(buyPercent.toFixed(1)),
        sellPercent: parseFloat(sellPercent.toFixed(1)),
        totalLiquidity: Math.round(totalLiquidity),
      },
      marketPressure,
      opportunities,
      riskScore: Math.round(Math.random() * 100),
    };

    this.scanHistory.push(result);
    if (this.scanHistory.length > 50) {
      this.scanHistory.shift();
    }

    this.emit("scanComplete", result);
    console.log(`Scan completed: ${marketPressure} detected`);

    return result;
  }

  // Start continuous monitoring
  startMonitoring(
    side: "buy" | "sell" | "both" = "both",
    intervalSeconds: number = 15,
  ): string {
    const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    console.log(
      `Starting continuous monitoring: ${side} side, ${intervalSeconds}s interval`,
    );

    const monitor = setInterval(async () => {
      try {
        const result = await this.performSingleScan(side);
        this.emit("monitorUpdate", { monitorId, result });

        // Check for significant changes
        if (Math.abs(result.priceChange) > 2) {
          this.emit("significantChange", {
            monitorId,
            change: result.priceChange,
            pressure: result.marketPressure,
            price: result.endPrice,
          });
        }
      } catch (error) {
        console.error("Monitor scan error:", error);
      }
    }, intervalSeconds * 1000);

    this.activeScanners.set(monitorId, monitor);

    // Perform initial scan
    this.performSingleScan(side);

    return monitorId;
  }

  // Stop monitoring
  stopMonitoring(monitorId: string): boolean {
    const monitor = this.activeScanners.get(monitorId);
    if (monitor) {
      clearInterval(monitor);
      this.activeScanners.delete(monitorId);
      console.log(`Stopped monitoring: ${monitorId}`);
      return true;
    }
    return false;
  }

  // Stop all monitoring
  stopAllMonitoring(): number {
    const count = this.activeScanners.size;
    this.activeScanners.forEach((monitor, id) => {
      clearInterval(monitor);
    });
    this.activeScanners.clear();
    console.log(`Stopped ${count} active monitors`);
    return count;
  }

  // Perform deep depth analysis
  async performDepthAnalysis(
    side: "buy" | "sell" = "buy",
  ): Promise<DepthAnalysis> {
    const currentPrice = 2680 + (Math.random() * 20 - 10);

    console.log(
      `Performing deep ${side} depth analysis at $${currentPrice.toFixed(2)}`,
    );

    // Generate 10 depth levels
    const levels: DepthLevel[] = [];
    let totalVolume = 0;

    for (let i = 1; i <= 10; i++) {
      const levelPrice =
        side === "buy"
          ? currentPrice - i * 0.25 // Below current price for buy orders
          : currentPrice + i * 0.25; // Above current price for sell orders

      const volume = Math.random() * 800000 + 200000;
      totalVolume += volume;

      const percentage = (volume / 7000000) * 100;
      const strength: "WEAK" | "MEDIUM" | "STRONG" =
        i <= 3 ? "WEAK" : i <= 6 ? "MEDIUM" : "STRONG";

      levels.push({
        level: i,
        price: parseFloat(levelPrice.toFixed(2)),
        volume: Math.round(volume),
        percentage: parseFloat(percentage.toFixed(1)),
        strength,
      });
    }

    const analysis: DepthAnalysis = {
      symbol: "XAUUSD",
      side,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      levels,
      totalVolume: Math.round(totalVolume),
      marketImpact: parseFloat((Math.random() * 5 + 1).toFixed(2)),
      slippageRisk: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      optimalOrderSize: Math.round(Math.random() * 100 + 50),
    };

    // Add side-specific analysis
    if (side === "sell") {
      analysis.breakdownProbability = parseFloat(
        (Math.random() * 100).toFixed(1),
      );
      analysis.resistanceLevels = levels.slice(0, 5).map((l) => l.price);
    } else {
      analysis.supportLevels = levels.slice(0, 5).map((l) => l.price);
    }

    this.emit("depthAnalysisComplete", analysis);
    console.log(
      `Depth analysis completed: ${totalVolume.toLocaleString()} total volume`,
    );

    return analysis;
  }

  // Get scan history
  getScanHistory(limit: number = 20): ScanResult[] {
    return this.scanHistory.slice(-limit);
  }

  // Get active monitors
  getActiveMonitors(): string[] {
    return Array.from(this.activeScanners.keys());
  }

  // Get scanner statistics
  getStatistics(): any {
    const totalScans = this.scanHistory.length;
    const buyScans = this.scanHistory.filter(
      (s) => s.side === "buy" || s.side === "both",
    ).length;
    const sellScans = this.scanHistory.filter(
      (s) => s.side === "sell" || s.side === "both",
    ).length;

    const avgBuyPressure =
      this.scanHistory
        .filter((s) => s.liquidityData.buyPercent > 0)
        .reduce((sum, s) => sum + s.liquidityData.buyPercent, 0) / totalScans;

    const avgSellPressure =
      this.scanHistory
        .filter((s) => s.liquidityData.sellPercent > 0)
        .reduce((sum, s) => sum + s.liquidityData.sellPercent, 0) / totalScans;

    return {
      totalScans,
      buyScans,
      sellScans,
      activeMonitors: this.activeScanners.size,
      avgBuyPressure: parseFloat(avgBuyPressure.toFixed(1)),
      avgSellPressure: parseFloat(avgSellPressure.toFixed(1)),
      lastScan: this.scanHistory[this.scanHistory.length - 1]?.timestamp,
    };
  }

  // Execute shell scanner (for advanced users)
  async executeShellScanner(
    type: "enhanced" | "sell",
    command: "single" | "depth",
    side?: string,
  ): Promise<any> {
    try {
      const scriptPath =
        type === "enhanced"
          ? "./scripts/xauusd-enhanced-scanner.sh"
          : "./scripts/xauusd-sell-scanner.sh";

      const fullCommand = side
        ? `${scriptPath} ${command} ${side}`
        : `${scriptPath} ${command}`;

      console.log(`Executing shell scanner: ${fullCommand}`);

      // Note: In production, use spawn instead of execSync for better control
      const output = execSync(fullCommand, {
        encoding: "utf8",
        timeout: 30000,
        cwd: process.cwd(),
      });

      return {
        success: true,
        output: output.toString(),
        command: fullCommand,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Shell scanner execution error:", error);
      return {
        success: false,
        error: error.message,
        command: `${type} ${command}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const liquidityScannerAPI = new LiquidityScannerAPI();
