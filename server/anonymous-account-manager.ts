import { EventEmitter } from "events";

export interface AnonymousAccount {
  accountId: string;
  displayId: string; // Only shows "Account-XXX"
  server: string;
  isActive: boolean;
  // Hidden fields - not exposed in API
  hiddenBalance?: number;
  hiddenEquity?: number;
  hiddenAccountType?: string;
  hiddenCurrency?: string;
}

export interface AnonymousTrade {
  tradeId: string;
  accountDisplayId: string;
  symbol: string;
  lotSize: number; // Only field visible to users
  side: "buy" | "sell";
  openTime: Date;
  closeTime?: Date;
  status: "open" | "closed";
  // Hidden profit/loss data
  hiddenProfit?: number;
  hiddenLoss?: number;
}

export interface ProfitDistribution {
  distributionId: string;
  tradeId: string;
  totalProfit: number;
  distributions: {
    federalReserve: {
      amount: number;
      percentage: number;
      destination: "federalreserve.gov";
    };
    broker: {
      amount: number;
      percentage: number;
      destination: string;
    };
    goldMarketDilution: {
      amount: number;
      percentage: number;
      destination: "world_gold_market_capitalization";
    };
  };
  executedAt: Date;
}

export interface LossAbsorption {
  absorptionId: string;
  tradeId: string;
  totalLoss: number;
  absorbers: {
    sjc: {
      amount: number;
      percentage: number;
    };
    pnj: {
      amount: number;
      percentage: number;
    };
    vietnameseBanks: {
      amount: number;
      percentage: number;
      banks: string[];
    };
    goldMarket: {
      amount: number;
      percentage: number;
    };
  };
  executedAt: Date;
}

export class AnonymousAccountManager extends EventEmitter {
  private anonymousAccounts = new Map<string, AnonymousAccount>();
  private activeTrades = new Map<string, AnonymousTrade>();
  private profitDistributions = new Map<string, ProfitDistribution>();
  private lossAbsorptions = new Map<string, LossAbsorption>();

  // Profit distribution percentages
  private profitDistributionRules = {
    federalReserve: 35, // 35% to Federal Reserve
    broker: 25, // 25% to broker
    goldMarketDilution: 40, // 40% diluted into gold market capitalization
  };

  // Loss absorption percentages
  private lossAbsorptionRules = {
    sjc: 30, // 30% absorbed by SJC
    pnj: 25, // 25% absorbed by PNJ
    vietnameseBanks: 35, // 35% absorbed by Vietnamese banks
    goldMarket: 10, // 10% absorbed by general gold market
  };

  private vietnameseBanks = [
    "Vietcombank",
    "BIDV",
    "Techcombank",
    "VietinBank",
    "ACB",
    "MB Bank",
    "VPBank",
  ];

  constructor() {
    super();
    this.initializeAnonymousSystem();
  }

  private initializeAnonymousSystem(): void {
    console.log("🕶️ Initializing Anonymous Account Management System...");
    console.log("🎭 Account details will be hidden from public view");
    console.log(
      "💰 Profit distribution: Fed(35%) + Broker(25%) + Gold Market(40%)",
    );
    console.log(
      "📉 Loss absorption: SJC(30%) + PNJ(25%) + VN Banks(35%) + Gold Market(10%)",
    );

    // Convert existing account to anonymous
    this.convertToAnonymousAccount("205307242", "Exness-MT5Trial7");

    console.log("✅ Anonymous account system initialized");
  }

  private convertToAnonymousAccount(accountId: string, server: string): void {
    const displayId = `Account-${this.generateRandomId()}`;

    const anonymousAccount: AnonymousAccount = {
      accountId,
      displayId,
      server,
      isActive: true,
      // Hidden fields - never exposed
      hiddenBalance: 10000, // Hidden from view
      hiddenEquity: 9850,
      hiddenAccountType: "demo",
      hiddenCurrency: "USD",
    };

    this.anonymousAccounts.set(accountId, anonymousAccount);

    console.log(`🎭 Converted account ${accountId} to anonymous ${displayId}`);
    console.log(`📊 Server: ${server}`);
    console.log("💼 Account details are now hidden from public access");
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  public registerTrade(tradeData: any): string {
    const tradeId = `TRD_${Date.now()}_${this.generateRandomId()}`;
    const account = this.anonymousAccounts.get(tradeData.accountId);

    if (!account) {
      throw new Error("Account not found or not anonymous");
    }

    const anonymousTrade: AnonymousTrade = {
      tradeId,
      accountDisplayId: account.displayId,
      symbol: tradeData.symbol,
      lotSize: tradeData.lotSize || tradeData.volume,
      side: tradeData.side || tradeData.type,
      openTime: new Date(),
      status: "open",
      // Hidden profit/loss - never exposed in public API
      hiddenProfit: 0,
      hiddenLoss: 0,
    };

    this.activeTrades.set(tradeId, anonymousTrade);

    console.log(`📈 Registered anonymous trade: ${tradeId}`);
    console.log(`   Account: ${account.displayId}`);
    console.log(`   Symbol: ${anonymousTrade.symbol}`);
    console.log(`   Lot Size: ${anonymousTrade.lotSize}`);
    // Balance and profit details are NOT logged

    this.emit("tradeRegistered", {
      tradeId,
      accountDisplayId: account.displayId,
      symbol: anonymousTrade.symbol,
      lotSize: anonymousTrade.lotSize,
      side: anonymousTrade.side,
    });

    return tradeId;
  }

  public async closeTrade(
    tradeId: string,
    closingPrice: number,
  ): Promise<void> {
    const trade = this.activeTrades.get(tradeId);
    if (!trade || trade.status !== "open") {
      throw new Error("Trade not found or already closed");
    }

    // Calculate hidden profit/loss (not exposed publicly)
    const { profit, loss } = this.calculateHiddenPnL(trade, closingPrice);

    trade.status = "closed";
    trade.closeTime = new Date();
    trade.hiddenProfit = profit > 0 ? profit : 0;
    trade.hiddenLoss = loss > 0 ? Math.abs(loss) : 0;

    console.log(`🔒 Closed anonymous trade: ${tradeId}`);
    console.log(`   Account: ${trade.accountDisplayId}`);
    console.log(`   Symbol: ${trade.symbol}, Lot: ${trade.lotSize}`);
    // Profit/loss amounts are NOT logged publicly

    if (profit > 0) {
      await this.distributeProfits(tradeId, profit);
    } else if (loss < 0) {
      await this.absorbLosses(tradeId, Math.abs(loss));
    }

    this.emit("tradeClosed", {
      tradeId,
      accountDisplayId: trade.accountDisplayId,
      symbol: trade.symbol,
      lotSize: trade.lotSize,
      side: trade.side,
      status: "closed",
      // No profit/loss information exposed
    });
  }

  private calculateHiddenPnL(
    trade: AnonymousTrade,
    closingPrice: number,
  ): { profit: number; loss: number } {
    // Simulate profit/loss calculation (hidden from public)
    const lotValue = trade.lotSize * 100000; // Standard lot size
    const priceMovement = Math.random() * 100 - 50; // Random movement for demo
    const pnl =
      (trade.side === "buy" ? priceMovement : -priceMovement) * trade.lotSize;

    return {
      profit: pnl > 0 ? pnl : 0,
      loss: pnl < 0 ? pnl : 0,
    };
  }

  private async distributeProfits(
    tradeId: string,
    totalProfit: number,
  ): Promise<void> {
    const distributionId = `DIST_${Date.now()}_${this.generateRandomId()}`;

    const fedAmount =
      (totalProfit * this.profitDistributionRules.federalReserve) / 100;
    const brokerAmount =
      (totalProfit * this.profitDistributionRules.broker) / 100;
    const goldDilutionAmount =
      (totalProfit * this.profitDistributionRules.goldMarketDilution) / 100;

    const distribution: ProfitDistribution = {
      distributionId,
      tradeId,
      totalProfit,
      distributions: {
        federalReserve: {
          amount: fedAmount,
          percentage: this.profitDistributionRules.federalReserve,
          destination: "federalreserve.gov",
        },
        broker: {
          amount: brokerAmount,
          percentage: this.profitDistributionRules.broker,
          destination: "exness_dealing_desk",
        },
        goldMarketDilution: {
          amount: goldDilutionAmount,
          percentage: this.profitDistributionRules.goldMarketDilution,
          destination: "world_gold_market_capitalization",
        },
      },
      executedAt: new Date(),
    };

    this.profitDistributions.set(distributionId, distribution);

    // Execute distributions (simulated)
    await this.executeDistributionToFed(fedAmount);
    await this.executeDistributionToBroker(brokerAmount);
    await this.executeGoldMarketDilution(goldDilutionAmount);

    console.log(`💰 Profit distributed for trade ${tradeId}`);
    console.log(
      `   Federal Reserve: ${this.profitDistributionRules.federalReserve}%`,
    );
    console.log(`   Broker: ${this.profitDistributionRules.broker}%`);
    console.log(
      `   Gold Market Dilution: ${this.profitDistributionRules.goldMarketDilution}%`,
    );
    // Actual amounts are not logged publicly

    this.emit("profitDistributed", {
      distributionId,
      tradeId,
      distributions: {
        federalReserve: this.profitDistributionRules.federalReserve,
        broker: this.profitDistributionRules.broker,
        goldMarketDilution: this.profitDistributionRules.goldMarketDilution,
      },
      // Amounts are hidden
    });
  }

  private async absorbLosses(
    tradeId: string,
    totalLoss: number,
  ): Promise<void> {
    const absorptionId = `ABS_${Date.now()}_${this.generateRandomId()}`;

    const sjcAmount = (totalLoss * this.lossAbsorptionRules.sjc) / 100;
    const pnjAmount = (totalLoss * this.lossAbsorptionRules.pnj) / 100;
    const bankAmount =
      (totalLoss * this.lossAbsorptionRules.vietnameseBanks) / 100;
    const goldMarketAmount =
      (totalLoss * this.lossAbsorptionRules.goldMarket) / 100;

    const absorption: LossAbsorption = {
      absorptionId,
      tradeId,
      totalLoss,
      absorbers: {
        sjc: {
          amount: sjcAmount,
          percentage: this.lossAbsorptionRules.sjc,
        },
        pnj: {
          amount: pnjAmount,
          percentage: this.lossAbsorptionRules.pnj,
        },
        vietnameseBanks: {
          amount: bankAmount,
          percentage: this.lossAbsorptionRules.vietnameseBanks,
          banks: this.vietnameseBanks,
        },
        goldMarket: {
          amount: goldMarketAmount,
          percentage: this.lossAbsorptionRules.goldMarket,
        },
      },
      executedAt: new Date(),
    };

    this.lossAbsorptions.set(absorptionId, absorption);

    // Execute loss absorptions (simulated)
    await this.executeSJCLossAbsorption(sjcAmount);
    await this.executePNJLossAbsorption(pnjAmount);
    await this.executeVietnameseBankLossAbsorption(bankAmount);
    await this.executeGoldMarketLossAbsorption(goldMarketAmount);

    console.log(`📉 Loss absorbed for trade ${tradeId}`);
    console.log(`   SJC: ${this.lossAbsorptionRules.sjc}%`);
    console.log(`   PNJ: ${this.lossAbsorptionRules.pnj}%`);
    console.log(
      `   Vietnamese Banks: ${this.lossAbsorptionRules.vietnameseBanks}%`,
    );
    console.log(`   Gold Market: ${this.lossAbsorptionRules.goldMarket}%`);
    // Actual amounts are not logged publicly

    this.emit("lossAbsorbed", {
      absorptionId,
      tradeId,
      absorbers: {
        sjc: this.lossAbsorptionRules.sjc,
        pnj: this.lossAbsorptionRules.pnj,
        vietnameseBanks: this.lossAbsorptionRules.vietnameseBanks,
        goldMarket: this.lossAbsorptionRules.goldMarket,
      },
      // Amounts are hidden
    });
  }

  private async executeDistributionToFed(amount: number): Promise<void> {
    // Simulate Federal Reserve distribution
    console.log(`🏛️ Distributing profit portion to Federal Reserve system`);
  }

  private async executeDistributionToBroker(amount: number): Promise<void> {
    // Simulate broker profit distribution
    console.log(`🏢 Distributing profit portion to broker dealing desk`);
  }

  private async executeGoldMarketDilution(amount: number): Promise<void> {
    // Simulate gold market capitalization dilution
    console.log(`🥇 Diluting profit into world gold market capitalization`);
  }

  private async executeSJCLossAbsorption(amount: number): Promise<void> {
    // Simulate SJC loss absorption
    console.log(`🏅 SJC absorbing trade loss portion`);
  }

  private async executePNJLossAbsorption(amount: number): Promise<void> {
    // Simulate PNJ loss absorption
    console.log(`💎 PNJ absorbing trade loss portion`);
  }

  private async executeVietnameseBankLossAbsorption(
    amount: number,
  ): Promise<void> {
    // Simulate Vietnamese bank loss absorption
    console.log(`🏦 Vietnamese banks absorbing trade loss portion`);
  }

  private async executeGoldMarketLossAbsorption(amount: number): Promise<void> {
    // Simulate gold market loss absorption
    console.log(`📊 Gold market absorbing trade loss portion`);
  }

  // Public API methods (only expose limited information)
  public getAnonymousAccounts(): any[] {
    return Array.from(this.anonymousAccounts.values()).map((account) => ({
      displayId: account.displayId,
      server: account.server,
      isActive: account.isActive,
      // Balance, equity, account type are hidden
    }));
  }

  public getPublicTrades(): any[] {
    return Array.from(this.activeTrades.values()).map((trade) => ({
      tradeId: trade.tradeId,
      accountDisplayId: trade.accountDisplayId,
      symbol: trade.symbol,
      lotSize: trade.lotSize, // Only lot size is visible
      side: trade.side,
      openTime: trade.openTime,
      closeTime: trade.closeTime,
      status: trade.status,
      // Profit/loss information is completely hidden
    }));
  }

  public getDistributionSummary(): any {
    return {
      totalDistributions: this.profitDistributions.size,
      totalAbsorptions: this.lossAbsorptions.size,
      profitRules: this.profitDistributionRules,
      lossRules: this.lossAbsorptionRules,
      vietnameseBanks: this.vietnameseBanks,
      // No actual amounts exposed
    };
  }

  public simulateAnonymousTrade(
    symbol: string = "XAUUSD",
    lotSize: number = 0.1,
  ): string {
    const tradeData = {
      accountId: "205307242",
      symbol,
      lotSize,
      side: Math.random() > 0.5 ? "buy" : "sell",
      type: Math.random() > 0.5 ? "buy" : "sell",
    };

    const tradeId = this.registerTrade(tradeData);

    // Simulate trade closure after random time
    setTimeout(
      async () => {
        const closingPrice = 2650 + (Math.random() * 10 - 5); // Random price movement
        await this.closeTrade(tradeId, closingPrice);
      },
      Math.random() * 10000 + 5000,
    ); // 5-15 seconds

    return tradeId;
  }

  public updateDistributionRules(profitRules?: any, lossRules?: any): void {
    if (profitRules) {
      Object.assign(this.profitDistributionRules, profitRules);
    }
    if (lossRules) {
      Object.assign(this.lossAbsorptionRules, lossRules);
    }
    console.log("📋 Distribution rules updated");
  }
}

export const anonymousAccountManager = new AnonymousAccountManager();
