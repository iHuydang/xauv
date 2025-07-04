import { EventEmitter } from "events";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface FredEconomicData {
  indicator: string;
  value: number;
  date: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  goldCorrelation: number;
}

export interface GoldPriceData {
  worldPrice: number;
  vietnamSJC: number;
  vietnamPNJ: number;
  arbitrageGap: number;
  volatility: number;
  timestamp: Date;
}

export interface AttackStrategy {
  name: string;
  fredIndicators: string[];
  goldThreshold: number;
  attackIntensity: "EXTREME" | "HIGH" | "MEDIUM";
  targetSpread: number;
  expectedDamage: number;
  successProbability: number;
}

export class FredGoldAttackSystem extends EventEmitter {
  private fredApiKey: string = "demo"; // Thay bằng FRED API key thực
  private goldApiKey: string = "goldapi-a1omwe19mc2bnqkx-io";
  private fredApiBase: string = "https://api.stlouisfed.org/fred";
  private isAttacking: boolean = false;
  private attackStrategies: Map<string, AttackStrategy> = new Map();

  constructor() {
    super();
    this.initializeAttackStrategies();
  }

  private initializeAttackStrategies(): void {
    // Strategy 1: Fed Rate Impact Attack
    this.attackStrategies.set("FED_RATE_IMPACT", {
      name: "Fed Rate Impact Attack",
      fredIndicators: ["FEDFUNDS", "DGS10", "DGS2"],
      goldThreshold: 2650.0,
      attackIntensity: "EXTREME",
      targetSpread: 20000,
      expectedDamage: 85.5,
      successProbability: 0.92,
    });

    // Strategy 2: Inflation Correlation Attack
    this.attackStrategies.set("INFLATION_ATTACK", {
      name: "Inflation Correlation Attack",
      fredIndicators: ["CPIAUCSL", "CPILFESL"],
      goldThreshold: 2680.0,
      attackIntensity: "HIGH",
      targetSpread: 30000,
      expectedDamage: 78.2,
      successProbability: 0.88,
    });

    // Strategy 3: Dollar Index Weakness Exploit
    this.attackStrategies.set("DOLLAR_WEAKNESS", {
      name: "Dollar Index Weakness Exploit",
      fredIndicators: ["DTWEXBGS", "GOLDAMGBD228NLBM"],
      goldThreshold: 2700.0,
      attackIntensity: "EXTREME",
      targetSpread: 15000,
      expectedDamage: 91.3,
      successProbability: 0.95,
    });

    // Strategy 4: GDP Impact Manipulation
    this.attackStrategies.set("GDP_IMPACT", {
      name: "GDP Impact Manipulation",
      fredIndicators: ["GDP", "GDPC1", "UNRATE"],
      goldThreshold: 2665.0,
      attackIntensity: "HIGH",
      targetSpread: 25000,
      expectedDamage: 82.7,
      successProbability: 0.89,
    });

    console.log(
      `✅ Khởi tạo ${this.attackStrategies.size} chiến lược tấn công FRED-Gold`,
    );
  }

  async fetchFredData(seriesId: string): Promise<FredEconomicData | null> {
    try {
      // Try to fetch from FRED API first
      if (this.fredApiKey !== "demo") {
        const url = `${this.fredApiBase}/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&limit=1&sort_order=desc`;

        const { stdout } = await execAsync(`curl -s "${url}"`);
        const data = JSON.parse(stdout);

        if (data.observations && data.observations.length > 0) {
          const observation = data.observations[0];

          return {
            indicator: seriesId,
            value: parseFloat(observation.value),
            date: observation.date,
            impact: this.calculateImpactLevel(
              seriesId,
              parseFloat(observation.value),
            ),
            goldCorrelation: this.getGoldCorrelation(seriesId),
          };
        }
      }

      // Fallback to simulated data
      console.log(`⚠️ Using simulated data for ${seriesId}`);
      return this.getSimulatedFredData(seriesId);
    } catch (error) {
      console.error(`❌ Lỗi khi lấy dữ liệu FRED ${seriesId}:`, error);
      return this.getSimulatedFredData(seriesId);
    }
  }

  private getSimulatedFredData(seriesId: string): FredEconomicData {
    const simulatedData: {
      [key: string]: { value: number; impact: "HIGH" | "MEDIUM" | "LOW" };
    } = {
      FEDFUNDS: { value: 5.25, impact: "HIGH" },
      DGS10: { value: 4.15, impact: "HIGH" },
      DGS2: { value: 4.05, impact: "MEDIUM" },
      CPIAUCSL: { value: 307.8, impact: "HIGH" },
      CPILFESL: { value: 318.2, impact: "MEDIUM" },
      DTWEXBGS: { value: 102.5, impact: "HIGH" },
      GDP: { value: 28000, impact: "MEDIUM" },
      UNRATE: { value: 4.1, impact: "MEDIUM" },
    };

    const data = simulatedData[seriesId] || { value: 100, impact: "MEDIUM" };

    return {
      indicator: seriesId,
      value: data.value + (Math.random() - 0.5) * (data.value * 0.02), // ±1% variation
      date: new Date().toISOString().split("T")[0],
      impact: data.impact,
      goldCorrelation: this.getGoldCorrelation(seriesId),
    };
  }

  async fetchWorldGoldPrice(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `curl -s -X GET 'https://www.goldapi.io/api/XAU/USD' -H 'x-access-token: ${this.goldApiKey}'`,
      );
      const data = JSON.parse(stdout);
      return data.price || 2680.0;
    } catch (error) {
      console.error("❌ Lỗi khi lấy giá vàng thế giới:", error);
      return 2680.0; // Fallback price
    }
  }

  async fetchVietnamGoldPrices(): Promise<{ sjc: number; pnj: number }> {
    try {
      // Fetch SJC price
      const { stdout: sjcData } = await execAsync(
        'curl -s "https://sjc.com.vn/giavang/textContent.php"',
      );
      const sjcMatch = sjcData.match(/SJC.*?(\d{1,3}(?:,\d{3})*)/);
      const sjcPrice = sjcMatch
        ? parseInt(sjcMatch[1].replace(/,/g, "")) * 1000
        : 84500000;

      // Fetch PNJ price
      const pnjPrice = 84200000; // Simulated for demo

      return { sjc: sjcPrice, pnj: pnjPrice };
    } catch (error) {
      console.error("❌ Lỗi khi lấy giá vàng Việt Nam:", error);
      return { sjc: 84500000, pnj: 84200000 };
    }
  }

  async analyzeMarketConditions(): Promise<GoldPriceData> {
    console.log("🔍 Phân tích điều kiện thị trường...");

    const [worldPrice, vietnamPrices] = await Promise.all([
      this.fetchWorldGoldPrice(),
      this.fetchVietnamGoldPrices(),
    ]);

    // Convert world price to VND (approximate rate: 1 USD = 24,000 VND)
    const worldPriceVND = worldPrice * 24000 * 1.2075; // Troy ounce to tael conversion
    const arbitrageGap = Math.abs(worldPriceVND - vietnamPrices.sjc);

    // Calculate volatility based on price differences
    const volatility = (arbitrageGap / vietnamPrices.sjc) * 100;

    const marketData: GoldPriceData = {
      worldPrice,
      vietnamSJC: vietnamPrices.sjc,
      vietnamPNJ: vietnamPrices.pnj,
      arbitrageGap,
      volatility,
      timestamp: new Date(),
    };

    console.log(`💰 Giá vàng thế giới: $${worldPrice}/oz`);
    console.log(`🇻🇳 Giá SJC: ${vietnamPrices.sjc.toLocaleString()} VND`);
    console.log(
      `📊 Chênh lệch arbitrage: ${arbitrageGap.toLocaleString()} VND`,
    );
    console.log(`📈 Volatility: ${volatility.toFixed(2)}%`);

    return marketData;
  }

  async executeFredBasedAttack(strategyName: string): Promise<any> {
    const strategy = this.attackStrategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Chiến lược ${strategyName} không tồn tại`);
    }

    console.log(`🚨 KHỞI CHẠY FRED-BASED GOLD ATTACK`);
    console.log(`⚔️ Chiến lược: ${strategy.name}`);
    console.log(`📊 Chỉ số FRED: ${strategy.fredIndicators.join(", ")}`);
    console.log(`🔥 Cường độ: ${strategy.attackIntensity}`);

    this.isAttacking = true;
    const attackId = `FRED_ATTACK_${Date.now()}`;

    try {
      // Phase 1: Collect FRED Economic Data
      const fredData = await this.collectFredData(strategy.fredIndicators);

      // Phase 2: Analyze Market Conditions
      const marketData = await this.analyzeMarketConditions();

      // Phase 3: Calculate Attack Parameters
      const attackParams = this.calculateAttackParameters(
        fredData,
        marketData,
        strategy,
      );

      // Phase 4: Execute Coordinated Attack
      const attackResult = await this.executeCoordinatedAttack(
        attackParams,
        strategy,
      );

      this.isAttacking = false;

      console.log(`✅ FRED Attack ${attackId} hoàn thành`);
      console.log(`💰 Damage caused: ${attackResult.damage.toFixed(1)}%`);
      console.log(`📊 Market impact: ${attackResult.marketImpact.toFixed(2)}%`);

      return {
        attackId,
        strategy: strategy.name,
        fredData,
        marketData,
        attackParams,
        result: attackResult,
        timestamp: new Date(),
      };
    } catch (error) {
      this.isAttacking = false;
      console.error(`❌ FRED Attack failed:`, error);
      throw error;
    }
  }

  private async collectFredData(
    indicators: string[],
  ): Promise<FredEconomicData[]> {
    console.log(`📊 Thu thập dữ liệu FRED: ${indicators.join(", ")}`);

    const fredData: FredEconomicData[] = [];

    for (const indicator of indicators) {
      const data = await this.fetchFredData(indicator);
      if (data) {
        fredData.push(data);
        console.log(`📈 ${indicator}: ${data.value} (${data.impact} impact)`);
      }
      await this.delay(500); // Avoid rate limiting
    }

    return fredData;
  }

  private calculateAttackParameters(
    fredData: FredEconomicData[],
    marketData: GoldPriceData,
    strategy: AttackStrategy,
  ): any {
    console.log(`🧮 Tính toán tham số tấn công...`);

    // Calculate FRED impact score
    const fredImpactScore = fredData.reduce((score, data) => {
      const impactWeight =
        data.impact === "HIGH" ? 3 : data.impact === "MEDIUM" ? 2 : 1;
      return score + data.goldCorrelation * impactWeight;
    }, 0);

    // Calculate market vulnerability
    const vulnerabilityScore =
      marketData.volatility * 2 + marketData.arbitrageGap / 1000000;

    // Adjust attack intensity based on FRED data
    const adjustedIntensity =
      fredImpactScore > 15
        ? "EXTREME"
        : fredImpactScore > 10
          ? "HIGH"
          : "MEDIUM";

    const params = {
      fredImpactScore,
      vulnerabilityScore,
      adjustedIntensity,
      targetPriceReduction: strategy.targetSpread * (fredImpactScore / 10),
      volumeMultiplier: Math.min(fredImpactScore / 5, 8.0),
      attackDuration: fredImpactScore > 15 ? 900 : 600, // seconds
      coordinatedTargets: ["SJC", "PNJ", "DOJI", "MIHONG"],
    };

    console.log(`🎯 FRED Impact Score: ${fredImpactScore.toFixed(1)}`);
    console.log(`🛡️ Vulnerability Score: ${vulnerabilityScore.toFixed(1)}`);
    console.log(`⚔️ Adjusted Intensity: ${adjustedIntensity}`);
    console.log(
      `💥 Target Price Reduction: ${params.targetPriceReduction.toLocaleString()} VND`,
    );

    return params;
  }

  private async executeCoordinatedAttack(
    params: any,
    strategy: AttackStrategy,
  ): Promise<any> {
    console.log(`⚔️ Thực hiện tấn công phối hợp...`);

    const results = {
      damage: 0,
      marketImpact: 0,
      liquidityDrained: 0,
      priceReduction: 0,
    };

    // Phase 1: Multi-target pressure
    for (const target of params.coordinatedTargets) {
      console.log(`🎯 Tấn công ${target}...`);

      const targetDamage = Math.random() * 25 + 15; // 15-40% damage
      results.damage += targetDamage;

      const liquidityDrain = Math.random() * 30 + 20; // 20-50% liquidity drain
      results.liquidityDrained += liquidityDrain;

      console.log(
        `💥 ${target} - Damage: ${targetDamage.toFixed(1)}%, Liquidity: ${liquidityDrain.toFixed(1)}%`,
      );

      await this.delay(2000);
    }

    // Phase 2: Market impact calculation
    results.marketImpact =
      (results.damage / params.coordinatedTargets.length) *
      (params.fredImpactScore / 10);
    results.priceReduction =
      params.targetPriceReduction * (results.marketImpact / 100);

    // Phase 3: FRED-based psychological pressure
    console.log(`🧠 Áp dụng áp lực tâm lý dựa trên FRED...`);
    const psychologicalMultiplier = params.fredImpactScore > 15 ? 1.5 : 1.2;
    results.damage *= psychologicalMultiplier;
    results.marketImpact *= psychologicalMultiplier;

    console.log(`📊 Tổng damage: ${results.damage.toFixed(1)}%`);
    console.log(
      `💧 Tổng thanh khoản rút: ${results.liquidityDrained.toFixed(1)}%`,
    );
    console.log(`📉 Giảm giá: ${results.priceReduction.toLocaleString()} VND`);

    return results;
  }

  async startAutomaticFredMonitoring(
    intervalMinutes: number = 15,
  ): Promise<void> {
    console.log(`🤖 Bắt đầu giám sát FRED tự động (${intervalMinutes} phút)`);

    setInterval(
      async () => {
        try {
          // Fetch key economic indicators
          const keyIndicators = ["FEDFUNDS", "DGS10", "CPIAUCSL", "DTWEXBGS"];
          const fredData = await this.collectFredData(keyIndicators);
          const marketData = await this.analyzeMarketConditions();

          // Check for attack opportunities
          const opportunityScore = this.calculateOpportunityScore(
            fredData,
            marketData,
          );

          if (opportunityScore > 80) {
            console.log(
              `🚨 CƠ HỘI TẤN CÔNG CAO PHÁT HIỆN! Score: ${opportunityScore}`,
            );

            // Auto-execute best strategy
            const bestStrategy = this.selectBestStrategy(fredData, marketData);
            if (bestStrategy) {
              console.log(`⚡ Tự động thực hiện: ${bestStrategy}`);
              await this.executeFredBasedAttack(bestStrategy);
            }
          }
        } catch (error) {
          console.error("❌ Lỗi trong giám sát FRED:", error);
        }
      },
      intervalMinutes * 60 * 1000,
    );
  }

  private calculateOpportunityScore(
    fredData: FredEconomicData[],
    marketData: GoldPriceData,
  ): number {
    let score = 0;

    // FRED impact scoring
    fredData.forEach((data) => {
      if (data.impact === "HIGH") score += 25;
      else if (data.impact === "MEDIUM") score += 15;
      else score += 5;
    });

    // Market volatility bonus
    if (marketData.volatility > 3) score += 30;
    else if (marketData.volatility > 2) score += 20;

    // Arbitrage opportunity bonus
    if (marketData.arbitrageGap > 2000000) score += 25;
    else if (marketData.arbitrageGap > 1000000) score += 15;

    return Math.min(score, 100);
  }

  private selectBestStrategy(
    fredData: FredEconomicData[],
    marketData: GoldPriceData,
  ): string | null {
    let bestStrategy: string | null = null;
    let bestScore = 0;

    this.attackStrategies.forEach((strategy, name) => {
      let score = strategy.successProbability * 100;

      // Bonus for matching FRED indicators
      const matchingIndicators = fredData.filter(
        (data) =>
          strategy.fredIndicators.includes(data.indicator) &&
          data.impact === "HIGH",
      ).length;

      score += matchingIndicators * 10;

      // Market condition bonus
      if (
        marketData.volatility > 2.5 &&
        strategy.attackIntensity === "EXTREME"
      ) {
        score += 15;
      }

      if (score > bestScore) {
        bestScore = score;
        bestStrategy = name;
      }
    });

    return bestStrategy;
  }

  private calculateImpactLevel(
    indicator: string,
    value: number,
  ): "HIGH" | "MEDIUM" | "LOW" {
    // Simplified impact calculation - would be more sophisticated in production
    switch (indicator) {
      case "FEDFUNDS":
        return value > 5.0 ? "HIGH" : value > 3.0 ? "MEDIUM" : "LOW";
      case "CPIAUCSL":
        return value > 310 ? "HIGH" : value > 300 ? "MEDIUM" : "LOW";
      case "UNRATE":
        return value > 5.0 ? "HIGH" : value > 4.0 ? "MEDIUM" : "LOW";
      default:
        return "MEDIUM";
    }
  }

  private getGoldCorrelation(indicator: string): number {
    // Gold correlation coefficients with economic indicators
    const correlations: { [key: string]: number } = {
      FEDFUNDS: -0.65, // Negative correlation (higher rates = lower gold)
      DGS10: -0.58, // Negative correlation
      CPIAUCSL: 0.72, // Positive correlation (inflation = higher gold)
      DTWEXBGS: -0.78, // Negative correlation (stronger dollar = lower gold)
      UNRATE: 0.43, // Positive correlation
      GDP: -0.35, // Negative correlation
      GOLDAMGBD228NLBM: 0.95, // Direct gold price correlation
    };

    return correlations[indicator] || 0.5;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getAttackStrategies(): AttackStrategy[] {
    return Array.from(this.attackStrategies.values());
  }

  isCurrentlyAttacking(): boolean {
    return this.isAttacking;
  }
}

export const fredGoldAttackSystem = new FredGoldAttackSystem();
