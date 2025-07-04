import { EventEmitter } from "events";
import { accountManager } from "./account-manager";
import WebSocket from "ws";

export interface InternationalPortfolioHolding {
  symbol: string;
  name: string;
  market: string;
  type: "ETF" | "INDEX";
  shares: number;
  currentPrice: number;
  marketValue: number;
  currency: string;
  dailyChange: number;
  dailyChangePercent: number;
}

export interface InternationalAccount {
  accountNumber: string;
  server: string;
  password: string;
  accountType: "international_portfolio";
  totalValue: number;
  currency: string;
  holdings: Map<string, InternationalPortfolioHolding>;
  isActive: boolean;
  lastSync: Date;
}

export class InternationalPortfolioAccountManager extends EventEmitter {
  private account: InternationalAccount;
  private priceConnections: Map<string, WebSocket> = new Map();
  private portfolioValue: number = 0;

  constructor() {
    super();
    this.initializeAccount();
    this.setupPortfolioHoldings();
    this.startRealTimeTracking();
  }

  private initializeAccount(): void {
    console.log("🌍 Khởi tạo tài khoản đầu tư quốc tế Exness...");

    this.account = {
      accountNumber: "79916041",
      server: "Exness-MT5Trial8",
      password: "Dmcs@1959",
      accountType: "international_portfolio",
      totalValue: 0,
      currency: "USD",
      holdings: new Map(),
      isActive: true,
      lastSync: new Date(),
    };

    console.log(`✅ Tài khoản ${this.account.accountNumber} đã được khởi tạo`);
    console.log(`📡 Server: ${this.account.server}`);
    console.log(`🔐 Mật khẩu: ${this.account.password}`);
  }

  private setupPortfolioHoldings(): void {
    console.log("📊 Thiết lập danh mục đầu tư quốc tế...");

    const internationalHoldings: InternationalPortfolioHolding[] = [
      {
        symbol: "VNM.ETF",
        name: "Vietnam ETF",
        market: "Vietnam",
        type: "ETF",
        shares: 50000,
        currentPrice: 85.4,
        marketValue: 4270000,
        currency: "USD",
        dailyChange: 2.15,
        dailyChangePercent: 2.58,
      },
      {
        symbol: "DE30",
        name: "Germany 30 Index (DAX)",
        market: "Germany",
        type: "INDEX",
        shares: 100,
        currentPrice: 18500.25,
        marketValue: 1850025,
        currency: "EUR",
        dailyChange: -45.8,
        dailyChangePercent: -0.25,
      },
      {
        symbol: "US500",
        name: "US S&P 500 Index",
        market: "United States",
        type: "INDEX",
        shares: 200,
        currentPrice: 5850.75,
        marketValue: 1170150,
        currency: "USD",
        dailyChange: 18.25,
        dailyChangePercent: 0.31,
      },
      {
        symbol: "UK100",
        name: "UK 100 Index (FTSE)",
        market: "United Kingdom",
        type: "INDEX",
        shares: 150,
        currentPrice: 8200.4,
        marketValue: 1230060,
        currency: "GBP",
        dailyChange: -12.35,
        dailyChangePercent: -0.15,
      },
      {
        symbol: "STOXX50",
        name: "EU Stocks 50 Index",
        market: "European Union",
        type: "INDEX",
        shares: 120,
        currentPrice: 4950.8,
        marketValue: 594096,
        currency: "EUR",
        dailyChange: 8.9,
        dailyChangePercent: 0.18,
      },
      {
        symbol: "JP225",
        name: "Japan 225 Index (Nikkei)",
        market: "Japan",
        type: "INDEX",
        shares: 80,
        currentPrice: 39500.6,
        marketValue: 3160048,
        currency: "JPY",
        dailyChange: 125.4,
        dailyChangePercent: 0.32,
      },
      {
        symbol: "FR40",
        name: "France 40 Index (CAC)",
        market: "France",
        type: "INDEX",
        shares: 90,
        currentPrice: 7650.3,
        marketValue: 688527,
        currency: "EUR",
        dailyChange: -15.75,
        dailyChangePercent: -0.21,
      },
      {
        symbol: "AUS200",
        name: "Australia S&P ASX 200 Index",
        market: "Australia",
        type: "INDEX",
        shares: 110,
        currentPrice: 8300.85,
        marketValue: 913093.5,
        currency: "AUD",
        dailyChange: 22.6,
        dailyChangePercent: 0.27,
      },
    ];

    // Thêm các holdings vào tài khoản
    internationalHoldings.forEach((holding) => {
      this.account.holdings.set(holding.symbol, holding);
    });

    // Tính tổng giá trị danh mục
    this.calculatePortfolioValue();

    console.log("🌍 DANH MỤC ĐẦU TƯ QUỐC TẾ:");
    console.log(`📊 Tổng số holdings: ${this.account.holdings.size}`);
    console.log(`💰 Tổng giá trị: $${this.portfolioValue.toLocaleString()}`);

    this.account.holdings.forEach((holding, symbol) => {
      console.log(
        `   📈 ${symbol}: ${holding.shares.toLocaleString()} shares, $${holding.marketValue.toLocaleString()}`,
      );
    });
  }

  private calculatePortfolioValue(): void {
    this.portfolioValue = 0;

    this.account.holdings.forEach((holding) => {
      // Chuyển đổi tất cả về USD
      let valueInUSD = holding.marketValue;

      switch (holding.currency) {
        case "EUR":
          valueInUSD = holding.marketValue * 1.08; // EUR to USD
          break;
        case "GBP":
          valueInUSD = holding.marketValue * 1.25; // GBP to USD
          break;
        case "JPY":
          valueInUSD = holding.marketValue * 0.0065; // JPY to USD
          break;
        case "AUD":
          valueInUSD = holding.marketValue * 0.62; // AUD to USD
          break;
        case "USD":
        default:
          valueInUSD = holding.marketValue;
          break;
      }

      this.portfolioValue += valueInUSD;
    });

    this.account.totalValue = this.portfolioValue;
  }

  private startRealTimeTracking(): void {
    console.log("📡 Bắt đầu theo dõi thời gian thực...");

    // Cập nhật giá mỗi 10 giây
    setInterval(() => {
      this.updatePrices();
      this.calculatePortfolioValue();
      this.broadcastPortfolioUpdate();
    }, 10000);

    // Báo cáo hiệu suất mỗi phút
    setInterval(() => {
      this.generatePerformanceReport();
    }, 60000);
  }

  private updatePrices(): void {
    this.account.holdings.forEach((holding) => {
      // Mô phỏng biến động giá thực tế
      const volatility = this.getMarketVolatility(holding.market);
      const priceChange =
        (Math.random() - 0.5) * volatility * holding.currentPrice;

      holding.currentPrice += priceChange;
      holding.marketValue = holding.shares * holding.currentPrice;
      holding.dailyChange = priceChange;
      holding.dailyChangePercent =
        (priceChange / (holding.currentPrice - priceChange)) * 100;
    });

    this.account.lastSync = new Date();
  }

  private getMarketVolatility(market: string): number {
    const volatilityMap: { [key: string]: number } = {
      Vietnam: 0.015,
      Germany: 0.008,
      "United States": 0.006,
      "United Kingdom": 0.009,
      "European Union": 0.007,
      Japan: 0.01,
      France: 0.008,
      Australia: 0.012,
    };

    return volatilityMap[market] || 0.008;
  }

  private broadcastPortfolioUpdate(): void {
    this.emit("portfolioUpdate", {
      accountNumber: this.account.accountNumber,
      totalValue: this.portfolioValue,
      holdings: Array.from(this.account.holdings.values()),
      timestamp: new Date(),
    });
  }

  private generatePerformanceReport(): void {
    const totalGainLoss = Array.from(this.account.holdings.values()).reduce(
      (sum, holding) => sum + holding.dailyChange * holding.shares,
      0,
    );

    const performancePercent = (totalGainLoss / this.portfolioValue) * 100;

    console.log("📊 BÁO CÁO HIỆU SUẤT DANH MỤC:");
    console.log(`   Tài khoản: ${this.account.accountNumber}`);
    console.log(`   Tổng giá trị: $${this.portfolioValue.toLocaleString()}`);
    console.log(
      `   Thay đổi hôm nay: ${totalGainLoss > 0 ? "+" : ""}$${totalGainLoss.toLocaleString()}`,
    );
    console.log(
      `   Hiệu suất: ${performancePercent > 0 ? "+" : ""}${performancePercent.toFixed(2)}%`,
    );

    this.emit("performanceReport", {
      accountNumber: this.account.accountNumber,
      totalValue: this.portfolioValue,
      dailyGainLoss: totalGainLoss,
      performancePercent,
      timestamp: new Date(),
    });
  }

  // Public API methods
  public getAccount(): InternationalAccount {
    return this.account;
  }

  public getHolding(symbol: string): InternationalPortfolioHolding | undefined {
    return this.account.holdings.get(symbol);
  }

  public getAllHoldings(): InternationalPortfolioHolding[] {
    return Array.from(this.account.holdings.values());
  }

  public getPortfolioValue(): number {
    return this.portfolioValue;
  }

  public addHolding(holding: InternationalPortfolioHolding): void {
    this.account.holdings.set(holding.symbol, holding);
    this.calculatePortfolioValue();
    console.log(
      `✅ Đã thêm holding: ${holding.symbol} - ${holding.shares} shares`,
    );
  }

  public removeHolding(symbol: string): boolean {
    const removed = this.account.holdings.delete(symbol);
    if (removed) {
      this.calculatePortfolioValue();
      console.log(`🗑️ Đã xóa holding: ${symbol}`);
    }
    return removed;
  }

  public updateHoldingShares(symbol: string, newShares: number): boolean {
    const holding = this.account.holdings.get(symbol);
    if (holding) {
      holding.shares = newShares;
      holding.marketValue = holding.shares * holding.currentPrice;
      this.calculatePortfolioValue();
      console.log(`📊 Đã cập nhật shares cho ${symbol}: ${newShares}`);
      return true;
    }
    return false;
  }

  public getTopPerformers(count: number = 3): InternationalPortfolioHolding[] {
    return Array.from(this.account.holdings.values())
      .sort((a, b) => b.dailyChangePercent - a.dailyChangePercent)
      .slice(0, count);
  }

  public getWorstPerformers(
    count: number = 3,
  ): InternationalPortfolioHolding[] {
    return Array.from(this.account.holdings.values())
      .sort((a, b) => a.dailyChangePercent - b.dailyChangePercent)
      .slice(0, count);
  }

  public getDiversificationMetrics(): any {
    const byMarket = new Map<string, number>();
    const byType = new Map<string, number>();

    this.account.holdings.forEach((holding) => {
      const marketValue = byMarket.get(holding.market) || 0;
      byMarket.set(holding.market, marketValue + holding.marketValue);

      const typeValue = byType.get(holding.type) || 0;
      byType.set(holding.type, typeValue + holding.marketValue);
    });

    return {
      totalValue: this.portfolioValue,
      marketDistribution: Object.fromEntries(byMarket),
      typeDistribution: Object.fromEntries(byType),
      numberOfHoldings: this.account.holdings.size,
      averageHoldingSize: this.portfolioValue / this.account.holdings.size,
    };
  }
}

export const internationalPortfolioAccountManager =
  new InternationalPortfolioAccountManager();
