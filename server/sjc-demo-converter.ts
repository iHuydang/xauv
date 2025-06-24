import { EventEmitter } from 'events';
import { sjcGoldBridge } from './sjc-gold-bridge.js';

export interface DemoTradeConversion {
  conversionId: string;
  exnessAccountId: string;
  demoTradeData: {
    ticket: number;
    symbol: string;
    type: 'buy' | 'sell';
    volume: number;
    openPrice: number;
    currentPrice: number;
    profit: number;
  };
  sjcEquivalent: {
    goldGrams: number;
    priceVND: number;
    totalValueVND: number;
    goldType: 'SJC_9999' | 'SJC_COIN' | 'SJC_BAR';
  };
  conversionRate: number;
  status: 'converting' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export class SJCDemoConverter extends EventEmitter {
  private conversions = new Map<string, DemoTradeConversion>();
  private conversionRate = 0.85; // 85% of demo profit converts to real SJC value
  
  // Enhanced account for SJC conversion
  private targetAccount = {
    accountId: '205307242',
    server: 'Exness-MT5Trial7',
    wsUrl: 'wss://rtapi-sg.excalls.mobi/rtapi/mt5/trial7',
    sjcBridgeActive: true,
    conversionMode: 'real_gold_physical'
  };

  constructor() {
    super();
    this.initializeConverter();
    this.monitorDemoAccount();
  }

  private initializeConverter(): void {
    console.log('🔄 Initializing SJC Demo-to-Real Gold Converter...');
    console.log(`📊 Target Account: ${this.targetAccount.accountId}`);
    console.log(`🌐 Server: ${this.targetAccount.server}`);
    console.log(`💰 Conversion Rate: ${(this.conversionRate * 100)}%`);
    console.log('✅ SJC Demo Converter initialized');
  }

  private monitorDemoAccount(): void {
    // Monitor the specific demo account for trades
    setInterval(() => {
      this.checkForNewTrades();
    }, 5000); // Check every 5 seconds

    console.log(`👁️ Monitoring demo account ${this.targetAccount.accountId} for gold trades`);
  }

  private async checkForNewTrades(): Promise<void> {
    try {
      // Simulate detecting new trades on the demo account
      // In real implementation, this would connect to the actual MT5 API
      
      const simulatedTrades = await this.getActiveDemoTrades();
      
      for (const trade of simulatedTrades) {
        if (this.isGoldTrade(trade.symbol) && !this.isAlreadyConverted(trade.ticket)) {
          await this.convertDemoTradeToSJC(trade);
        }
      }
    } catch (error) {
      console.error('❌ Error checking for new trades:', error);
    }
  }

  private async getActiveDemoTrades(): Promise<any[]> {
    // Simulate active demo trades on the account
    return [
      {
        ticket: Math.floor(Math.random() * 1000000000),
        symbol: 'XAUUSD',
        type: 'buy',
        volume: 0.1,
        openPrice: 2650.50,
        currentPrice: 2652.75,
        profit: 22.50,
        openTime: new Date()
      }
    ];
  }

  private isGoldTrade(symbol: string): boolean {
    const goldSymbols = ['XAUUSD', 'XAUEUR', 'XAUGBP', 'XAUJPY', 'GOLD'];
    return goldSymbols.some(goldSymbol => symbol.toUpperCase().includes(goldSymbol));
  }

  private isAlreadyConverted(ticket: number): boolean {
    for (const conversion of this.conversions.values()) {
      if (conversion.demoTradeData.ticket === ticket) {
        return true;
      }
    }
    return false;
  }

  public async convertDemoTradeToSJC(demoTrade: any): Promise<string> {
    try {
      const conversionId = `CONV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate SJC gold equivalent
      const goldGrams = this.calculateGoldGrams(demoTrade.volume, demoTrade.symbol);
      const sjcPrice = await this.getCurrentSJCPrice();
      const totalValueVND = goldGrams * sjcPrice.buy;
      
      // Apply conversion rate (demo profits are reduced for real conversion)
      const adjustedValue = totalValueVND * this.conversionRate;
      const adjustedGrams = goldGrams * this.conversionRate;

      const conversion: DemoTradeConversion = {
        conversionId,
        exnessAccountId: this.targetAccount.accountId,
        demoTradeData: demoTrade,
        sjcEquivalent: {
          goldGrams: adjustedGrams,
          priceVND: sjcPrice.buy,
          totalValueVND: adjustedValue,
          goldType: 'SJC_9999'
        },
        conversionRate: this.conversionRate,
        status: 'converting',
        createdAt: new Date()
      };

      this.conversions.set(conversionId, conversion);

      console.log(`🔄 Converting demo trade to SJC gold:`);
      console.log(`   Demo Trade: ${demoTrade.symbol} ${demoTrade.type} ${demoTrade.volume} lots`);
      console.log(`   Profit: $${demoTrade.profit}`);
      console.log(`   SJC Equivalent: ${adjustedGrams.toFixed(2)} grams`);
      console.log(`   Value: ${adjustedValue.toLocaleString()} VND`);

      // Execute conversion through SJC Gold Bridge
      await this.executeSJCConversion(conversion);

      return conversionId;

    } catch (error) {
      console.error('❌ Failed to convert demo trade to SJC gold:', error);
      throw error;
    }
  }

  private calculateGoldGrams(volume: number, symbol: string): number {
    // Standard calculation for gold trading
    // 1 lot = 100 ounces for XAUUSD, 1 ounce = 31.1035 grams
    const ouncesPerLot = 100;
    const gramsPerOunce = 31.1035;
    
    return volume * ouncesPerLot * gramsPerOunce;
  }

  private async getCurrentSJCPrice(): Promise<{buy: number, sell: number}> {
    // Get current SJC gold price in VND per gram
    // In real implementation, this would fetch from SJC API
    const basePrice = 85000; // 85,000 VND per gram
    const spread = 500; // 500 VND spread
    
    return {
      buy: basePrice + spread,
      sell: basePrice - spread
    };
  }

  private async executeSJCConversion(conversion: DemoTradeConversion): Promise<void> {
    try {
      // Convert demo trade data to format expected by SJC Gold Bridge
      const exnessOrder = {
        ticket: conversion.demoTradeData.ticket,
        symbol: conversion.demoTradeData.symbol,
        type: conversion.demoTradeData.type,
        volume: conversion.demoTradeData.volume,
        openPrice: conversion.demoTradeData.openPrice,
        currentPrice: conversion.demoTradeData.currentPrice,
        profit: conversion.demoTradeData.profit
      };

      // Execute through SJC Gold Bridge
      const sjcOrderId = await sjcGoldBridge.convertExnessOrderToSJCGold(exnessOrder);

      conversion.status = 'completed';
      conversion.completedAt = new Date();

      console.log(`✅ Demo trade conversion completed:`);
      console.log(`   Conversion ID: ${conversion.conversionId}`);
      console.log(`   SJC Order ID: ${sjcOrderId}`);
      console.log(`   Real gold: ${conversion.sjcEquivalent.goldGrams.toFixed(2)} grams`);

      this.emit('conversionCompleted', {
        conversionId: conversion.conversionId,
        sjcOrderId,
        realGoldGrams: conversion.sjcEquivalent.goldGrams,
        totalValueVND: conversion.sjcEquivalent.totalValueVND
      });

    } catch (error) {
      console.error(`❌ Failed to execute SJC conversion ${conversion.conversionId}:`, error);
      conversion.status = 'failed';
    }
  }

  // Public API methods
  public async simulateDemoTrade(tradeParams: any): Promise<string> {
    const simulatedTrade = {
      ticket: Math.floor(Math.random() * 1000000000),
      symbol: tradeParams.symbol || 'XAUUSD',
      type: tradeParams.type || 'buy',
      volume: tradeParams.volume || 0.1,
      openPrice: tradeParams.openPrice || 2650.50,
      currentPrice: tradeParams.currentPrice || 2652.75,
      profit: tradeParams.profit || 22.50,
      openTime: new Date()
    };

    // Calculate realistic profit
    if (simulatedTrade.type === 'buy') {
      simulatedTrade.profit = (simulatedTrade.currentPrice - simulatedTrade.openPrice) * simulatedTrade.volume * 100;
    } else {
      simulatedTrade.profit = (simulatedTrade.openPrice - simulatedTrade.currentPrice) * simulatedTrade.volume * 100;
    }

    console.log(`🎮 Simulating demo trade on account ${this.targetAccount.accountId}:`);
    console.log(`   ${simulatedTrade.symbol} ${simulatedTrade.type} ${simulatedTrade.volume} lots`);
    console.log(`   Open: ${simulatedTrade.openPrice}, Current: ${simulatedTrade.currentPrice}`);
    console.log(`   Profit: $${simulatedTrade.profit.toFixed(2)}`);

    return await this.convertDemoTradeToSJC(simulatedTrade);
  }

  public getConversions(): DemoTradeConversion[] {
    return Array.from(this.conversions.values());
  }

  public getConversionById(conversionId: string): DemoTradeConversion | undefined {
    return this.conversions.get(conversionId);
  }

  public getAccountStatus(): any {
    return {
      ...this.targetAccount,
      totalConversions: this.conversions.size,
      completedConversions: Array.from(this.conversions.values()).filter(c => c.status === 'completed').length,
      totalRealGoldGenerated: Array.from(this.conversions.values())
        .filter(c => c.status === 'completed')
        .reduce((total, c) => total + c.sjcEquivalent.goldGrams, 0),
      totalValueVND: Array.from(this.conversions.values())
        .filter(c => c.status === 'completed')
        .reduce((total, c) => total + c.sjcEquivalent.totalValueVND, 0),
      conversionRate: this.conversionRate,
      lastActivity: new Date()
    };
  }

  public updateConversionRate(newRate: number): void {
    if (newRate > 0 && newRate <= 1) {
      this.conversionRate = newRate;
      console.log(`🔄 Updated conversion rate to ${(newRate * 100)}%`);
    } else {
      throw new Error('Conversion rate must be between 0 and 1');
    }
  }
}

export const sjcDemoConverter = new SJCDemoConverter();