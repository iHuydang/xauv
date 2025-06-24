
import { EventEmitter } from 'events';
import { vietnamGoldTradingIntegration } from './vietnam-gold-trading-integration';
import { vietnamGoldBroker } from './vietnam-gold-broker';
import { tradermadeIntegration } from './tradermade-integration';

export interface DemoOrder {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  mt5Account: string;
  isDemoOrder: boolean;
}

export interface RealLiquidityImpact {
  conversionId: string;
  originalDemoOrder: DemoOrder;
  realSJCVolume: number; // Khối lượng vàng SJC thật (gram)
  realSJCValue: number; // Giá trị VND thật
  liquidityProviderAccount: string;
  ecnImpact: 'positive' | 'negative' | 'neutral';
  marketImpactBps: number; // Tác động thị trường tính bằng basis points
  executionTimestamp: number;
  status: 'pending' | 'executed' | 'settled';
}

export interface ECNLiquidityEngine {
  totalVolumeProvided: number;
  totalProfitConverted: number;
  activeConversions: number;
  sjcBrokerBalance: number;
  ecnEfficiencyRating: number;
}

export class DemoToRealLiquidityConverter extends EventEmitter {
  private demoOrders: Map<string, DemoOrder> = new Map();
  private realLiquidityImpacts: Map<string, RealLiquidityImpact> = new Map();
  private ecnEngine: ECNLiquidityEngine = {
    totalVolumeProvided: 0,
    totalProfitConverted: 0,
    activeConversions: 0,
    sjcBrokerBalance: 500000000, // 500M VND initial
    ecnEfficiencyRating: 0.85 // 85% efficiency
  };

  // SJC Broker liquidity accounts
  private sjcLiquidityAccounts = [
    'SJC_LP_001', // Primary liquidity provider
    'SJC_LP_002', // Secondary provider
    'SJC_LP_003', // Emergency provider
    'SJC_ECN_MAIN', // Main ECN account
    'SJC_ECN_BACKUP' // Backup ECN account
  ];

  private conversionRates = {
    demoToRealMultiplier: 0.75, // 75% của profit demo chuyển thành thanh khoản thật
    minProfitThreshold: 50000, // Minimum 50k VND profit to convert
    maxSingleConversion: 10000000, // Max 10M VND per conversion
    ecnSpreadImpact: 0.0015, // 1.5 bps spread impact per conversion
  };

  constructor() {
    super();
    this.initializeLiquidityConverter();
    this.startConversionEngine();
  }

  private initializeLiquidityConverter(): void {
    console.log('🔄 Khởi tạo Demo-to-Real Liquidity Converter...');
    console.log(`💰 SJC Broker Balance: ${this.ecnEngine.sjcBrokerBalance.toLocaleString()} VND`);
    console.log(`📊 ECN Efficiency: ${(this.ecnEngine.ecnEfficiencyRating * 100).toFixed(1)}%`);
    console.log('✅ Liquidity converter sẵn sàng');
  }

  private startConversionEngine(): void {
    // Monitor demo orders và chuyển đổi khi có profit
    setInterval(() => {
      this.processEligibleDemoOrders();
      this.executeRealLiquidityProvision();
      this.updateECNMetrics();
    }, 5000); // Check every 5 seconds

    // Background settlement process
    setInterval(() => {
      this.settlePendingConversions();
    }, 30000); // Settlement every 30 seconds
  }

  // Register demo order for potential conversion
  public registerDemoOrder(order: DemoOrder): void {
    this.demoOrders.set(order.orderId, order);
    
    console.log(`📝 Đăng ký Demo Order: ${order.orderId}`);
    console.log(`   Symbol: ${order.symbol} | Side: ${order.side.toUpperCase()}`);
    console.log(`   Volume: ${order.volume} | Profit: ${order.profit.toLocaleString()} VND`);
    
    // Immediate check for profitable orders
    if (order.profit > this.conversionRates.minProfitThreshold) {
      console.log(`💡 Order có profit, chuẩn bị chuyển đổi thanh khoản...`);
      this.scheduleConversion(order);
    }
  }

  // Schedule conversion for profitable demo order
  private scheduleConversion(order: DemoOrder): void {
    const profitVND = Math.abs(order.profit);
    
    if (profitVND < this.conversionRates.minProfitThreshold) {
      return; // Not profitable enough
    }

    // Calculate real SJC equivalent
    const realConversionAmount = Math.min(
      profitVND * this.conversionRates.demoToRealMultiplier,
      this.conversionRates.maxSingleConversion
    );

    // Convert to SJC gold volume (approximately)
    const currentGoldPriceVND = 84000000; // ~84M VND per tael
    const sjcVolumeGram = (realConversionAmount / currentGoldPriceVND) * 37.5; // Convert to grams

    const conversion: RealLiquidityImpact = {
      conversionId: `CONV_${Date.now()}_${order.orderId.slice(-6)}`,
      originalDemoOrder: order,
      realSJCVolume: sjcVolumeGram,
      realSJCValue: realConversionAmount,
      liquidityProviderAccount: this.selectOptimalLiquidityProvider(),
      ecnImpact: order.profit > 0 ? 'positive' : 'negative',
      marketImpactBps: this.calculateMarketImpact(realConversionAmount),
      executionTimestamp: Date.now(),
      status: 'pending'
    };

    this.realLiquidityImpacts.set(conversion.conversionId, conversion);
    this.ecnEngine.activeConversions++;

    console.log('⚡ CONVERSION SCHEDULED:');
    console.log(`🆔 ID: ${conversion.conversionId}`);
    console.log(`💰 Demo Profit: ${order.profit.toLocaleString()} VND`);
    console.log(`🥇 Real SJC: ${sjcVolumeGram.toFixed(2)} gram (${realConversionAmount.toLocaleString()} VND)`);
    console.log(`🏦 LP Account: ${conversion.liquidityProviderAccount}`);
    console.log(`📊 Market Impact: ${conversion.marketImpactBps.toFixed(1)} bps`);

    this.emit('conversionScheduled', conversion);
  }

  // Process eligible demo orders for conversion
  private processEligibleDemoOrders(): void {
    const eligibleOrders = Array.from(this.demoOrders.values()).filter(order => {
      const profitVND = Math.abs(order.profit);
      return profitVND >= this.conversionRates.minProfitThreshold && 
             !this.isOrderAlreadyConverted(order.orderId);
    });

    eligibleOrders.forEach(order => {
      this.scheduleConversion(order);
    });
  }

  // Execute real liquidity provision to SJC market
  private async executeRealLiquidityProvision(): Promise<void> {
    const pendingConversions = Array.from(this.realLiquidityImpacts.values())
      .filter(conv => conv.status === 'pending');

    for (const conversion of pendingConversions) {
      try {
        await this.executeConversion(conversion);
      } catch (error) {
        console.error(`❌ Conversion failed: ${conversion.conversionId}`, error);
      }
    }
  }

  // Execute individual conversion
  private async executeConversion(conversion: RealLiquidityImpact): Promise<void> {
    console.log(`🔄 Executing conversion: ${conversion.conversionId}`);

    // Step 1: Reserve SJC broker balance
    if (this.ecnEngine.sjcBrokerBalance < conversion.realSJCValue) {
      console.log(`⚠️ Insufficient SJC broker balance for ${conversion.conversionId}`);
      return;
    }

    // Step 2: Execute real SJC transaction
    const sjcOrder = {
      symbol: 'SJC_GOLD_VN',
      side: conversion.originalDemoOrder.profit > 0 ? 'sell' : 'buy', // Opposite to provide liquidity
      volume: conversion.realSJCVolume,
      price: conversion.realSJCValue / conversion.realSJCVolume,
      accountNumber: conversion.liquidityProviderAccount,
      orderId: `REAL_${conversion.conversionId}`,
      timestamp: Date.now(),
      purpose: 'demo_profit_liquidity_conversion'
    };

    // Send to Vietnam Gold Broker for real execution
    vietnamGoldBroker.emit('realLiquidityProvision', sjcOrder);

    // Step 3: Update ECN impact
    await this.applyECNMarketImpact(conversion);

    // Step 4: Update balances and status
    this.ecnEngine.sjcBrokerBalance -= conversion.realSJCValue;
    this.ecnEngine.totalVolumeProvided += conversion.realSJCVolume;
    this.ecnEngine.totalProfitConverted += Math.abs(conversion.originalDemoOrder.profit);
    
    conversion.status = 'executed';

    console.log('✅ CONVERSION EXECUTED:');
    console.log(`🆔 ${conversion.conversionId}`);
    console.log(`🥇 Provided ${conversion.realSJCVolume.toFixed(2)}g SJC liquidity`);
    console.log(`💰 Value: ${conversion.realSJCValue.toLocaleString()} VND`);
    console.log(`📊 Remaining Balance: ${this.ecnEngine.sjcBrokerBalance.toLocaleString()} VND`);

    this.emit('conversionExecuted', conversion);
  }

  // Apply ECN market impact
  private async applyECNMarketImpact(conversion: RealLiquidityImpact): Promise<void> {
    const impactDirection = conversion.ecnImpact === 'positive' ? 1 : -1;
    const spreadAdjustment = conversion.marketImpactBps * impactDirection;

    // Apply to current gold prices
    const currentGoldPrice = tradermadeIntegration.getCurrentPrice('XAUUSD');
    if (currentGoldPrice) {
      const adjustedBid = currentGoldPrice.bid * (1 + spreadAdjustment / 10000);
      const adjustedAsk = currentGoldPrice.ask * (1 + spreadAdjustment / 10000);

      console.log(`📊 ECN Impact Applied:`);
      console.log(`   Spread adjustment: ${spreadAdjustment.toFixed(1)} bps`);
      console.log(`   Original: ${currentGoldPrice.bid}/${currentGoldPrice.ask}`);
      console.log(`   Adjusted: ${adjustedBid.toFixed(5)}/${adjustedAsk.toFixed(5)}`);

      // Broadcast ECN price adjustment
      this.emit('ecnPriceAdjustment', {
        symbol: 'XAUUSD',
        originalBid: currentGoldPrice.bid,
        originalAsk: currentGoldPrice.ask,
        adjustedBid,
        adjustedAsk,
        impactBps: spreadAdjustment,
        source: 'demo_liquidity_conversion'
      });
    }
  }

  // Settle completed conversions
  private settlePendingConversions(): void {
    const executedConversions = Array.from(this.realLiquidityImpacts.values())
      .filter(conv => conv.status === 'executed');

    executedConversions.forEach(conversion => {
      // Final settlement
      conversion.status = 'settled';
      this.ecnEngine.activeConversions--;

      console.log(`✅ Settled: ${conversion.conversionId}`);
      
      // Remove from active tracking after 5 minutes
      setTimeout(() => {
        this.realLiquidityImpacts.delete(conversion.conversionId);
      }, 300000);
    });
  }

  // Helper methods
  private selectOptimalLiquidityProvider(): string {
    // Rotate between accounts for distribution
    const timestamp = Date.now();
    const index = timestamp % this.sjcLiquidityAccounts.length;
    return this.sjcLiquidityAccounts[index];
  }

  private calculateMarketImpact(conversionAmount: number): number {
    // Calculate market impact based on conversion size
    const baseImpact = this.conversionRates.ecnSpreadImpact;
    const sizeMultiplier = Math.log10(conversionAmount / 1000000); // Log scale for large amounts
    return baseImpact * (1 + sizeMultiplier * 0.1);
  }

  private isOrderAlreadyConverted(orderId: string): boolean {
    return Array.from(this.realLiquidityImpacts.values())
      .some(conv => conv.originalDemoOrder.orderId === orderId);
  }

  private updateECNMetrics(): void {
    const totalConversions = this.realLiquidityImpacts.size;
    const successfulConversions = Array.from(this.realLiquidityImpacts.values())
      .filter(conv => conv.status === 'settled').length;

    if (totalConversions > 0) {
      this.ecnEngine.ecnEfficiencyRating = successfulConversions / totalConversions;
    }
  }

  // Public API methods
  public async convertDemoProfit(
    orderId: string,
    forceConversion: boolean = false
  ): Promise<string> {
    const order = this.demoOrders.get(orderId);
    if (!order) {
      throw new Error(`Demo order not found: ${orderId}`);
    }

    if (!forceConversion && Math.abs(order.profit) < this.conversionRates.minProfitThreshold) {
      throw new Error(`Profit too low for conversion: ${order.profit}`);
    }

    this.scheduleConversion(order);
    
    const conversions = Array.from(this.realLiquidityImpacts.values())
      .filter(conv => conv.originalDemoOrder.orderId === orderId);
    
    return conversions.length > 0 ? conversions[0].conversionId : '';
  }

  public getECNStatus(): any {
    return {
      engine: this.ecnEngine,
      active_demo_orders: this.demoOrders.size,
      active_conversions: this.ecnEngine.activeConversions,
      total_conversions: this.realLiquidityImpacts.size,
      liquidity_accounts: this.sjcLiquidityAccounts,
      conversion_rates: this.conversionRates
    };
  }

  public getConversionHistory(): RealLiquidityImpact[] {
    return Array.from(this.realLiquidityImpacts.values());
  }

  public updateConversionRates(rates: Partial<typeof this.conversionRates>): void {
    this.conversionRates = { ...this.conversionRates, ...rates };
    console.log('💱 Updated conversion rates:', this.conversionRates);
  }

  // Emergency liquidity injection
  public async injectEmergencyLiquidity(amountVND: number): Promise<void> {
    this.ecnEngine.sjcBrokerBalance += amountVND;
    console.log(`🚨 Emergency liquidity injected: ${amountVND.toLocaleString()} VND`);
    console.log(`💰 New balance: ${this.ecnEngine.sjcBrokerBalance.toLocaleString()} VND`);
    
    this.emit('emergencyLiquidityInjected', {
      amount: amountVND,
      newBalance: this.ecnEngine.sjcBrokerBalance,
      timestamp: Date.now()
    });
  }
}

export const demoToRealLiquidityConverter = new DemoToRealLiquidityConverter();
