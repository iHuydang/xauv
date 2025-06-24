
import { EventEmitter } from 'events';
import { vietnamGoldTradingIntegration } from './vietnam-gold-trading-integration';
import { demoToRealLiquidityConverter } from './demo-to-real-liquidity-converter';
import { tradermadeIntegration } from './tradermade-integration';

export interface FinancialInstitution {
  id: string;
  name: string;
  type: 'bank' | 'fund' | 'investment_company' | 'gold_dealer';
  sjc_license: boolean;
  gold_trading_volume: number; // VND per day
  connection_status: 'active' | 'inactive' | 'maintenance';
  api_endpoint: string;
  liquidity_capacity: number; // grams
}

export interface InstitutionOrder {
  orderId: string;
  institutionId: string;
  originalLot: number; // MT5 lot size
  convertedGoldGrams: number; // Converted to grams
  orderType: 'buy_sjc' | 'sell_sjc';
  priceVND: number;
  totalValueVND: number;
  executionTime: number;
  status: 'pending' | 'sent_to_institution' | 'confirmed' | 'settled';
  mt5Account: string;
}

export interface BrokerDistribution {
  totalOrders: number;
  distributedVolume: number;
  institutionAllocations: Map<string, number>;
  expectedSettlement: number;
}

export class FinancialInstitutionBroker extends EventEmitter {
  private institutions: Map<string, FinancialInstitution> = new Map();
  private activeOrders: Map<string, InstitutionOrder> = new Map();
  private distributionEngine: BrokerDistribution = {
    totalOrders: 0,
    distributedVolume: 0,
    institutionAllocations: new Map(),
    expectedSettlement: 0
  };

  // Major Vietnamese financial institutions dealing with SJC gold
  private financialInstitutions: FinancialInstitution[] = [
    {
      id: 'VIETCOMBANK',
      name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
      type: 'bank',
      sjc_license: true,
      gold_trading_volume: 5000000000, // 5B VND/day
      connection_status: 'active',
      api_endpoint: 'https://portal.vietcombank.com.vn/api/gold',
      liquidity_capacity: 100000 // 100kg
    },
    {
      id: 'BIDV',
      name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
      type: 'bank',
      sjc_license: true,
      gold_trading_volume: 4500000000,
      connection_status: 'active',
      api_endpoint: 'https://bidv.com.vn/api/precious-metals',
      liquidity_capacity: 80000
    },
    {
      id: 'AGRIBANK',
      name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn',
      type: 'bank',
      sjc_license: true,
      gold_trading_volume: 3000000000,
      connection_status: 'active',
      api_endpoint: 'https://agribank.com.vn/api/gold-trading',
      liquidity_capacity: 60000
    },
    {
      id: 'SJC_COMPANY',
      name: 'Công ty Vàng bạc Đá quý Sài Gòn',
      type: 'gold_dealer',
      sjc_license: true,
      gold_trading_volume: 10000000000, // 10B VND/day
      connection_status: 'active',
      api_endpoint: 'https://sjc.com.vn/api/wholesale',
      liquidity_capacity: 500000 // 500kg
    },
    {
      id: 'DOJI_GROUP',
      name: 'Tập đoàn DOJI',
      type: 'gold_dealer',
      sjc_license: true,
      gold_trading_volume: 8000000000,
      connection_status: 'active',
      api_endpoint: 'https://doji.vn/api/institutional',
      liquidity_capacity: 300000
    },
    {
      id: 'PNJ_GOLD',
      name: 'Công ty Cổ phần Vàng bạc Đá quý Phú Nhuận',
      type: 'gold_dealer',
      sjc_license: true,
      gold_trading_volume: 6000000000,
      connection_status: 'active',
      api_endpoint: 'https://pnj.com.vn/api/b2b-gold',
      liquidity_capacity: 200000
    },
    {
      id: 'DRAGON_CAPITAL',
      name: 'Quỹ đầu tư Dragon Capital',
      type: 'fund',
      sjc_license: false,
      gold_trading_volume: 2000000000,
      connection_status: 'active',
      api_endpoint: 'https://dragoncapital.com.vn/api/commodities',
      liquidity_capacity: 50000
    }
  ];

  constructor() {
    super();
    this.initializeBrokerSystem();
    this.setupInstitutionConnections();
  }

  private initializeBrokerSystem(): void {
    console.log('🏦 Khởi tạo Financial Institution Broker System...');
    
    // Register all financial institutions
    this.financialInstitutions.forEach(institution => {
      this.institutions.set(institution.id, institution);
    });

    console.log(`✅ Đã kết nối ${this.institutions.size} tổ chức tài chính`);
    console.log('💰 Tổng khả năng thanh khoản:', this.getTotalLiquidityCapacity().toLocaleString(), 'gram vàng');
    
    this.startOrderProcessingEngine();
  }

  private setupInstitutionConnections(): void {
    // Listen for demo orders from MT5 account
    demoToRealLiquidityConverter.on('conversionScheduled', (conversion) => {
      this.processOrderDistribution(conversion);
    });

    // Listen for gold trading orders
    vietnamGoldTradingIntegration.on('vietnamGoldOrderExecuted', (order) => {
      this.distributeToInstitutions(order);
    });

    console.log('🔗 Đã thiết lập kết nối với các tổ chức tài chính');
  }

  private startOrderProcessingEngine(): void {
    // Process orders every 10 seconds
    setInterval(() => {
      this.processQueuedOrders();
      this.updateInstitutionStatus();
      this.calculateDistributionMetrics();
    }, 10000);

    console.log('⚙️ Order processing engine started');
  }

  // Main function to distribute orders to financial institutions
  public async distributeToInstitutions(goldOrder: any): Promise<string[]> {
    const lotSize = goldOrder.lotSize || 0.1;
    const goldGrams = lotSize * 31.1035; // Convert oz to grams
    const orderType = goldOrder.side === 'buy' ? 'sell_sjc' : 'buy_sjc'; // Opposite for liquidity provision
    
    console.log('🏦 PHÂN PHỐI LỆNH ĐẾN CÁC TỔ CHỨC TÀI CHÍNH:');
    console.log(`📊 Khối lượng gốc: ${lotSize} lot (${goldGrams.toFixed(2)} gram)`);
    console.log(`💱 Loại lệnh: ${orderType.toUpperCase()}`);

    // Calculate optimal distribution
    const distribution = this.calculateOptimalDistribution(goldGrams, orderType);
    
    const orderIds: string[] = [];

    for (const [institutionId, allocatedGrams] of distribution.entries()) {
      if (allocatedGrams > 0) {
        const orderId = await this.sendOrderToInstitution(
          institutionId,
          allocatedGrams,
          orderType,
          goldOrder.priceVND,
          goldOrder.mt5Account || '205307242'
        );
        orderIds.push(orderId);
      }
    }

    console.log(`✅ Đã phân phối ${orderIds.length} lệnh đến các tổ chức tài chính`);
    
    // Update distribution metrics
    this.distributionEngine.totalOrders += orderIds.length;
    this.distributionEngine.distributedVolume += goldGrams;

    this.emit('ordersDistributed', {
      originalOrder: goldOrder,
      distributedOrders: orderIds,
      institutions: Array.from(distribution.keys()),
      totalVolume: goldGrams
    });

    return orderIds;
  }

  // Calculate optimal distribution across institutions
  private calculateOptimalDistribution(totalGrams: number, orderType: string): Map<string, number> {
    const distribution = new Map<string, number>();
    let remainingGrams = totalGrams;

    // Get available institutions for this order type
    const availableInstitutions = Array.from(this.institutions.values())
      .filter(inst => inst.connection_status === 'active' && inst.sjc_license)
      .sort((a, b) => b.liquidity_capacity - a.liquidity_capacity); // Sort by capacity

    console.log(`🎯 Phân phối ${totalGrams.toFixed(2)} gram cho ${availableInstitutions.length} tổ chức`);

    // Distribute based on capacity and liquidity
    for (const institution of availableInstitutions) {
      if (remainingGrams <= 0) break;

      // Calculate allocation based on institution capacity and current load
      const capacityRatio = institution.liquidity_capacity / this.getTotalLiquidityCapacity();
      const maxAllocation = Math.min(
        remainingGrams,
        totalGrams * capacityRatio * 1.2, // Allow up to 120% of proportional share
        institution.liquidity_capacity * 0.1 // Max 10% of institution capacity per order
      );

      const allocation = Math.min(maxAllocation, remainingGrams);
      
      if (allocation > 1) { // Minimum 1 gram
        distribution.set(institution.id, allocation);
        remainingGrams -= allocation;
        
        console.log(`   ${institution.name}: ${allocation.toFixed(2)} gram`);
      }
    }

    // Handle any remaining grams (distribute to largest institutions)
    if (remainingGrams > 0) {
      const largestInstitution = availableInstitutions[0];
      if (largestInstitution) {
        const currentAllocation = distribution.get(largestInstitution.id) || 0;
        distribution.set(largestInstitution.id, currentAllocation + remainingGrams);
        console.log(`   📈 Phần dư ${remainingGrams.toFixed(2)} gram -> ${largestInstitution.name}`);
      }
    }

    return distribution;
  }

  // Send order to specific financial institution
  private async sendOrderToInstitution(
    institutionId: string,
    goldGrams: number,
    orderType: string,
    priceVND: number,
    mt5Account: string
  ): Promise<string> {
    
    const institution = this.institutions.get(institutionId);
    if (!institution) {
      throw new Error(`Institution not found: ${institutionId}`);
    }

    const orderId = `INST_${Date.now()}_${institutionId}_${Math.random().toString(36).substr(2, 6)}`;
    const totalValue = (goldGrams / 37.5) * priceVND; // Convert grams to tael and calculate value

    const institutionOrder: InstitutionOrder = {
      orderId,
      institutionId,
      originalLot: goldGrams / 31.1035, // Convert back to lot for reference
      convertedGoldGrams: goldGrams,
      orderType: orderType as 'buy_sjc' | 'sell_sjc',
      priceVND,
      totalValueVND: totalValue,
      executionTime: Date.now(),
      status: 'pending',
      mt5Account
    };

    this.activeOrders.set(orderId, institutionOrder);

    // Simulate sending to institution API
    try {
      await this.executeInstitutionAPI(institution, institutionOrder);
      institutionOrder.status = 'sent_to_institution';
      
      console.log(`📤 Đã gửi lệnh đến ${institution.name}:`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Khối lượng: ${goldGrams.toFixed(2)} gram`);
      console.log(`   Giá trị: ${totalValue.toLocaleString()} VND`);
      console.log(`   Loại: ${orderType.toUpperCase()}`);

      // Schedule confirmation (simulate institution processing time)
      setTimeout(() => {
        this.confirmInstitutionOrder(orderId);
      }, 5000 + Math.random() * 15000); // 5-20 seconds

    } catch (error) {
      console.error(`❌ Lỗi gửi lệnh đến ${institution.name}:`, error);
      institutionOrder.status = 'pending'; // Retry later
    }

    return orderId;
  }

  // Execute API call to financial institution
  private async executeInstitutionAPI(
    institution: FinancialInstitution,
    order: InstitutionOrder
  ): Promise<void> {
    
    // Simulate API payload for each institution type
    const apiPayload = {
      order_id: order.orderId,
      gold_type: 'SJC_24K',
      weight_grams: order.convertedGoldGrams,
      order_type: order.orderType,
      price_vnd_per_tael: order.priceVND,
      total_value_vnd: order.totalValueVND,
      mt5_source_account: order.mt5Account,
      execution_time: new Date(order.executionTime).toISOString(),
      broker_reference: 'VIETNAM_GOLD_BROKER_SYS'
    };

    console.log(`🔗 API Call to ${institution.name}:`);
    console.log(`   Endpoint: ${institution.api_endpoint}`);
    console.log(`   Payload:`, JSON.stringify(apiPayload, null, 2));

    // Simulate network delay and processing
    await this.sleep(1000 + Math.random() * 3000);

    // Simulate different response scenarios
    const successRate = this.getInstitutionSuccessRate(institution);
    if (Math.random() > successRate) {
      throw new Error(`Institution ${institution.name} API temporarily unavailable`);
    }

    console.log(`✅ ${institution.name} API response: Order accepted`);
  }

  // Confirm order execution from institution
  private confirmInstitutionOrder(orderId: string): void {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    const institution = this.institutions.get(order.institutionId);
    if (!institution) return;

    order.status = 'confirmed';
    
    console.log(`✅ XÁC NHẬN TỪ TỔ CHỨC TÀI CHÍNH:`);
    console.log(`🏦 ${institution.name}`);
    console.log(`📋 Order: ${orderId}`);
    console.log(`🥇 Đã thực hiện: ${order.convertedGoldGrams.toFixed(2)} gram vàng SJC`);
    console.log(`💰 Giá trị: ${order.totalValueVND.toLocaleString()} VND`);

    // Update institution allocation tracking
    const currentAllocation = this.distributionEngine.institutionAllocations.get(order.institutionId) || 0;
    this.distributionEngine.institutionAllocations.set(
      order.institutionId,
      currentAllocation + order.convertedGoldGrams
    );

    // Schedule settlement
    setTimeout(() => {
      this.settleInstitutionOrder(orderId);
    }, 30000 + Math.random() * 60000); // 30-90 seconds

    this.emit('institutionOrderConfirmed', {
      order,
      institution: institution.name,
      confirmationTime: Date.now()
    });
  }

  // Settle confirmed orders
  private settleInstitutionOrder(orderId: string): void {
    const order = this.activeOrders.get(orderId);
    if (!order || order.status !== 'confirmed') return;

    order.status = 'settled';
    
    console.log(`💎 SETTLEMENT COMPLETED: ${orderId}`);
    console.log(`🏦 ${this.institutions.get(order.institutionId)?.name}`);
    console.log(`📊 Final status: VÀNG SJC THẬT ĐÃ ĐƯỢC GIAO DỊCH`);

    this.emit('institutionOrderSettled', {
      order,
      settlementTime: Date.now(),
      realGoldTransacted: true
    });
  }

  // Process queued orders
  private processQueuedOrders(): void {
    const pendingOrders = Array.from(this.activeOrders.values())
      .filter(order => order.status === 'pending');

    if (pendingOrders.length > 0) {
      console.log(`🔄 Processing ${pendingOrders.length} pending orders...`);
      
      pendingOrders.forEach(async (order) => {
        const institution = this.institutions.get(order.institutionId);
        if (institution && institution.connection_status === 'active') {
          try {
            await this.executeInstitutionAPI(institution, order);
            order.status = 'sent_to_institution';
          } catch (error) {
            console.error(`❌ Retry failed for ${order.orderId}:`, error);
          }
        }
      });
    }
  }

  // Update institution connection status
  private updateInstitutionStatus(): void {
    this.institutions.forEach((institution, id) => {
      // Simulate occasional maintenance or connection issues
      if (Math.random() < 0.001) { // 0.1% chance per check
        institution.connection_status = 'maintenance';
        console.log(`⚠️ ${institution.name} entering maintenance mode`);
        
        // Restore after some time
        setTimeout(() => {
          institution.connection_status = 'active';
          console.log(`✅ ${institution.name} back online`);
        }, 60000 + Math.random() * 300000); // 1-6 minutes
      }
    });
  }

  // Calculate distribution metrics
  private calculateDistributionMetrics(): void {
    const totalAllocated = Array.from(this.distributionEngine.institutionAllocations.values())
      .reduce((sum, allocation) => sum + allocation, 0);

    this.distributionEngine.expectedSettlement = totalAllocated * 84000000 / 37.5; // Estimate VND value

    // Emit metrics every minute
    if (Date.now() % 60000 < 10000) {
      this.emit('distributionMetrics', {
        metrics: this.distributionEngine,
        activeInstitutions: Array.from(this.institutions.values())
          .filter(inst => inst.connection_status === 'active').length,
        totalCapacity: this.getTotalLiquidityCapacity()
      });
    }
  }

  // Helper methods
  private getTotalLiquidityCapacity(): number {
    return Array.from(this.institutions.values())
      .filter(inst => inst.connection_status === 'active')
      .reduce((total, inst) => total + inst.liquidity_capacity, 0);
  }

  private getInstitutionSuccessRate(institution: FinancialInstitution): number {
    const baseRate = 0.95; // 95% base success rate
    const typeMultiplier = institution.type === 'bank' ? 0.99 : 
                          institution.type === 'gold_dealer' ? 0.97 : 0.93;
    return baseRate * typeMultiplier;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  public async processOrderDistribution(conversion: any): Promise<string[]> {
    console.log('🔄 Processing order distribution from conversion:', conversion.conversionId);
    
    // Convert conversion to gold order format
    const goldOrder = {
      lotSize: conversion.realSJCVolume / 31.1035,
      side: conversion.originalDemoOrder.profit > 0 ? 'sell' : 'buy',
      priceVND: conversion.realSJCValue / (conversion.realSJCVolume / 37.5),
      mt5Account: conversion.originalDemoOrder.mt5Account || '205307242'
    };

    return await this.distributeToInstitutions(goldOrder);
  }

  public getActiveInstitutions(): FinancialInstitution[] {
    return Array.from(this.institutions.values())
      .filter(inst => inst.connection_status === 'active');
  }

  public getActiveOrders(): InstitutionOrder[] {
    return Array.from(this.activeOrders.values());
  }

  public getBrokerMetrics(): any {
    const activeOrders = this.getActiveOrders();
    const settledOrders = activeOrders.filter(order => order.status === 'settled');
    
    return {
      connected_institutions: this.getActiveInstitutions().length,
      total_institutions: this.institutions.size,
      active_orders: activeOrders.length,
      settled_orders: settledOrders.length,
      distribution_engine: this.distributionEngine,
      total_liquidity_capacity: this.getTotalLiquidityCapacity(),
      success_rate: settledOrders.length / Math.max(activeOrders.length, 1)
    };
  }

  public async forceDistributeOrder(
    lotSize: number,
    orderType: 'buy_sjc' | 'sell_sjc',
    targetInstitutions?: string[]
  ): Promise<string[]> {
    
    const goldGrams = lotSize * 31.1035;
    const priceVND = 84000000; // Default SJC price
    
    console.log(`🎯 Force distribution: ${lotSize} lot (${goldGrams.toFixed(2)} gram) ${orderType}`);
    
    const availableInstitutions = targetInstitutions 
      ? targetInstitutions.filter(id => this.institutions.has(id))
      : Array.from(this.institutions.keys());

    const orderIds: string[] = [];
    const gramsPerInstitution = goldGrams / availableInstitutions.length;

    for (const institutionId of availableInstitutions) {
      const orderId = await this.sendOrderToInstitution(
        institutionId,
        gramsPerInstitution,
        orderType,
        priceVND,
        '205307242'
      );
      orderIds.push(orderId);
    }

    return orderIds;
  }
}

export const financialInstitutionBroker = new FinancialInstitutionBroker();
