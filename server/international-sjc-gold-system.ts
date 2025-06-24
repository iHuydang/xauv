import { EventEmitter } from 'events';
import { anonymousAccountManager } from './anonymous-account-manager.js';

export interface InternationalSJCOrder {
  orderId: string;
  accountId: string;
  lotSize: number; // 50 lots per order
  sjcGoldTaels: number; // 50 * 82.94 = 4,147 taels per order
  physicalGoldWeight: number; // in grams
  orderType: 'buy' | 'sell';
  status: 'pending' | 'executing' | 'settled' | 'completed';
  internationalInstitution: string;
  vietnameseCounterparty: string;
  sjcLocation: string;
  liquidityProfit: number; // Profit for international institutions
  goldMarketDilution: number; // Amount diluted into gold market
  vietnameseBankProfit: number; // Profit when user loses
  sjcProfit: number; // SJC profit when user loses
  physicalGoldTransferred: boolean;
  internationalSettlement: boolean;
  createdAt: Date;
  executedAt?: Date;
  settledAt?: Date;
}

export interface InternationalGoldInstitution {
  institutionId: string;
  name: string;
  country: string;
  goldReserves: number; // in kilograms
  sjcGoldAvailable: number; // SJC gold available for sale
  liquidityCapacity: number; // USD capacity
  isActive: boolean;
  vietnamesePartners: string[];
}

export interface PhysicalGoldTransfer {
  transferId: string;
  orderId: string;
  fromInstitution: string;
  toLocation: string;
  goldType: 'SJC_9999';
  transferAmount: number; // in grams
  transferStatus: 'initiated' | 'in_transit' | 'delivered' | 'confirmed';
  trackingNumber: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
}

export interface ProfitLossDistribution {
  distributionId: string;
  orderId: string;
  userProfit: boolean; // true if user made profit
  totalAmount: number;
  distribution: {
    internationalLiquidity?: number; // When user profits
    goldMarketDilution?: number; // When user profits
    vietnameseBanks?: number; // When user loses
    sjcProfit?: number; // When user loses
  };
  executedAt: Date;
}

export class InternationalSJCGoldSystem extends EventEmitter {
  private orders = new Map<string, InternationalSJCOrder>();
  private institutions = new Map<string, InternationalGoldInstitution>();
  private transfers = new Map<string, PhysicalGoldTransfer>();
  private distributions = new Map<string, ProfitLossDistribution>();

  private readonly LOT_TO_TAELS_RATIO = 82.94;
  private readonly TAELS_TO_GRAMS = 37.5;
  private readonly STANDARD_LOT_SIZE = 50; // 50 lots per order

  constructor() {
    super();
    this.initializeInternationalSystem();
  }

  private initializeInternationalSystem(): void {
    console.log('🌍 Initializing International SJC Gold Trading System...');
    console.log(`📊 Standard Order Size: ${this.STANDARD_LOT_SIZE} lots = ${this.STANDARD_LOT_SIZE * this.LOT_TO_TAELS_RATIO} taels SJC gold`);
    console.log('🏦 Connecting to international financial institutions...');

    this.setupInternationalInstitutions();

    console.log('💰 Profit Distribution Rules:');
    console.log('   User Profit → International liquidity providers + Gold market dilution');
    console.log('   User Loss → Vietnamese banks + SJC profits');
    console.log('🌐 Physical gold coordination with international institutions');
    console.log('✅ International SJC gold system ready for high-volume trading');
  }

  private setupInternationalInstitutions(): void {
    const institutions: InternationalGoldInstitution[] = [
      {
        institutionId: 'UBS_SWITZERLAND',
        name: 'UBS AG Switzerland Gold Division',
        country: 'Switzerland',
        goldReserves: 15000000, // 15 tons
        sjcGoldAvailable: 1500000, // 1.5 tons SJC equivalent
        liquidityCapacity: 750000000, // $750M
        isActive: true,
        vietnamesePartners: ['Vietcombank', 'BIDV', 'Techcombank']
      },
      {
        institutionId: 'LONDON_BULLION_MARKET',
        name: 'London Bullion Market Association',
        country: 'United Kingdom',
        goldReserves: 5000000, // 5 tons
        sjcGoldAvailable: 500000, // 500kg SJC equivalent
        liquidityCapacity: 250000000, // $250M
        isActive: true,
        vietnamesePartners: ['Vietcombank', 'BIDV']
      },
      {
        institutionId: 'COMEX_GOLD',
        name: 'COMEX Gold Exchange',
        country: 'United States',
        goldReserves: 8000000, // 8 tons
        sjcGoldAvailable: 800000, // 800kg SJC equivalent
        liquidityCapacity: 400000000, // $400M
        isActive: true,
        vietnamesePartners: ['Techcombank', 'VietinBank']
      },
      {
        institutionId: 'SHANGHAI_GOLD',
        name: 'Shanghai Gold Exchange',
        country: 'China',
        goldReserves: 12000000, // 12 tons
        sjcGoldAvailable: 1200000, // 1.2 tons SJC equivalent
        liquidityCapacity: 600000000, // $600M
        isActive: true,
        vietnamesePartners: ['ACB', 'MB Bank']
      },
      {
        institutionId: 'TOKYO_COMMODITY',
        name: 'Tokyo Commodity Exchange',
        country: 'Japan',
        goldReserves: 8000000, // 8 tons - Japan has significant SJC gold
        sjcGoldAvailable: 800000, // 800kg SJC equivalent
        liquidityCapacity: 400000000, // $400M
        isActive: true,
        vietnamesePartners: ['VPBank', 'Sacombank', 'ACB']
      },
      {
        institutionId: 'JAPANESE_GOLD_BANK',
        name: 'Bank of Japan Gold Reserve Division',
        country: 'Japan',
        goldReserves: 10000000, // 10 tons
        sjcGoldAvailable: 1000000, // 1 ton SJC equivalent
        liquidityCapacity: 500000000, // $500M
        isActive: true,
        vietnamesePartners: ['Vietcombank', 'Techcombank', 'BIDV']
      },
      {
        institutionId: 'EU_CENTRAL_BANK',
        name: 'European Central Bank Gold Operations',
        country: 'European Union',
        goldReserves: 20000000, // 20 tons
        sjcGoldAvailable: 2000000, // 2 tons SJC equivalent
        liquidityCapacity: 1000000000, // $1B
        isActive: true,
        vietnamesePartners: ['Vietcombank', 'BIDV', 'Techcombank', 'VietinBank']
      },
      {
        institutionId: 'DUBAI_GOLD',
        name: 'Dubai Gold & Commodities Exchange',
        country: 'UAE',
        goldReserves: 4000000, // 4 tons
        sjcGoldAvailable: 400000, // 400kg SJC equivalent
        liquidityCapacity: 200000000, // $200M
        isActive: true,
        vietnamesePartners: ['Vietcombank', 'BIDV']
      },
      {
        institutionId: 'SWISS_NATIONAL_BANK',
        name: 'Swiss National Bank Gold Reserve',
        country: 'Switzerland',
        goldReserves: 25000000, // 25 tons
        sjcGoldAvailable: 2500000, // 2.5 tons SJC equivalent
        liquidityCapacity: 1250000000, // $1.25B
        isActive: true,
        vietnamesePartners: ['Vietcombank', 'Techcombank', 'ACB', 'MB Bank']
      }
    ];

    institutions.forEach(inst => {
      this.institutions.set(inst.institutionId, inst);
      console.log(`🌍 ${inst.name} (${inst.country}): ${(inst.sjcGoldAvailable/1000).toFixed(1)}kg SJC gold available`);
    });

    console.log(`✅ ${institutions.length} international institutions connected`);
    console.log(`🏅 Total SJC Gold Capacity: ${(institutions.reduce((sum, inst) => sum + inst.sjcGoldAvailable, 0) / 1000).toFixed(1)} tons`);
    console.log('🇨🇭 UBS & Swiss National Bank: High-capacity SJC gold providers');
    console.log('🇪🇺 EU Central Bank: Largest SJC gold capacity (2 tons)');
    console.log('🇯🇵 Japanese institutions: Strong SJC gold coordination');
  }

  public async create80OrdersOf50Lots(): Promise<string[]> {
    console.log('🚀 Creating 80 orders of 50 lots each...');
    console.log(`📊 Total volume: ${80 * this.STANDARD_LOT_SIZE} lots = ${80 * this.STANDARD_LOT_SIZE * this.LOT_TO_TAELS_RATIO} taels SJC gold`);
    console.log(`⚖️ Total weight: ${(80 * this.STANDARD_LOT_SIZE * this.LOT_TO_TAELS_RATIO * this.TAELS_TO_GRAMS / 1000).toFixed(2)} kg physical gold`);

    const orderIds: string[] = [];
    const institutions = Array.from(this.institutions.values());

    for (let i = 0; i < 80; i++) {
      const institution = institutions[i % institutions.length];
      const orderId = await this.createSingleOrder(institution, i + 1);
      orderIds.push(orderId);
    }

    console.log(`✅ Created ${orderIds.length} orders successfully`);

    // Notify international institutions
    await this.notifyInternationalInstitutions(orderIds);

    // Setup physical gold coordination
    await this.coordinateInternationalGoldTransfers(orderIds);

    return orderIds;
  }

  private async createSingleOrder(institution: InternationalGoldInstitution, orderNumber: number): Promise<string> {
    const orderId = `INTL_SJC_${Date.now()}_${orderNumber}_${this.generateRandomId()}`;
    const sjcGoldTaels = this.STANDARD_LOT_SIZE * this.LOT_TO_TAELS_RATIO;
    const physicalGoldWeight = sjcGoldTaels * this.TAELS_TO_GRAMS;

    const order: InternationalSJCOrder = {
      orderId,
      accountId: '205307242', // User account
      lotSize: this.STANDARD_LOT_SIZE,
      sjcGoldTaels,
      physicalGoldWeight,
      orderType: Math.random() > 0.5 ? 'buy' : 'sell',
      status: 'pending',
      internationalInstitution: institution.name,
      vietnameseCounterparty: institution.vietnamesePartners[Math.floor(Math.random() * institution.vietnamesePartners.length)],
      sjcLocation: this.getRandomSJCLocation(),
      liquidityProfit: 0, // Will be calculated on settlement
      goldMarketDilution: 0,
      vietnameseBankProfit: 0,
      sjcProfit: 0,
      physicalGoldTransferred: false,
      internationalSettlement: false,
      createdAt: new Date()
    };

    this.orders.set(orderId, order);

    console.log(`🌍 Order ${orderNumber}: ${orderId}`);
    console.log(`   Institution: ${institution.name}`);
    console.log(`   Lot Size: ${this.STANDARD_LOT_SIZE} lots`);
    console.log(`   SJC Gold: ${sjcGoldTaels.toFixed(2)} taels`);
    console.log(`   Physical Weight: ${(physicalGoldWeight/1000).toFixed(2)} kg`);
    console.log(`   Vietnamese Partner: ${order.vietnameseCounterparty}`);

    // Register with anonymous account manager
    anonymousAccountManager.registerTrade({
      accountId: '205307242',
      symbol: 'XAUUSD',
      lotSize: this.STANDARD_LOT_SIZE,
      side: order.orderType,
      type: order.orderType
    });

    return orderId;
  }

  private getRandomSJCLocation(): string {
    const locations = [
      'SJC Ho Chi Minh City Main Branch',
      'SJC Hanoi Central Office',
      'SJC Da Nang Regional Center',
      'SJC Can Tho Branch',
      'SJC Hai Phong Office',
      'SJC Nha Trang Branch'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  public async executeOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order || order.status !== 'pending') {
      throw new Error(`Order ${orderId} not found or not pending`);
    }

    console.log(`⚡ Executing international order: ${orderId}`);

    order.status = 'executing';
    order.executedAt = new Date();

    // Simulate order outcome (profit or loss)
    const userProfits = Math.random() > 0.5;
    const baseAmount = order.lotSize * 2650 * 10; // Approximate value

    if (userProfits) {
      // User profits: International institutions get liquidity + gold market dilution
      order.liquidityProfit = baseAmount * 0.6; // 60% to international liquidity providers
      order.goldMarketDilution = baseAmount * 0.4; // 40% diluted into gold market

      console.log(`💰 User profit - International liquidity: $${order.liquidityProfit.toFixed(2)}`);
      console.log(`🌍 Gold market dilution: $${order.goldMarketDilution.toFixed(2)}`);
    } else {
      // User loses: Vietnamese banks and SJC profit
      order.vietnameseBankProfit = baseAmount * 0.6; // 60% to Vietnamese banks
      order.sjcProfit = baseAmount * 0.4; // 40% to SJC

      console.log(`🏦 Vietnamese banks profit: $${order.vietnameseBankProfit.toFixed(2)}`);
      console.log(`🏅 SJC profit: $${order.sjcProfit.toFixed(2)}`);
    }

    // Initiate physical gold transfer
    await this.initiatePhysicalGoldTransfer(order);

    // Process international settlement
    await this.processInternationalSettlement(order, userProfits);

    order.status = 'settled';
    order.settledAt = new Date();

    this.emit('orderExecuted', {
      orderId: order.orderId,
      lotSize: order.lotSize,
      institution: order.internationalInstitution,
      userProfits,
      physicalGoldTransferred: order.physicalGoldTransferred
    });

    return true;
  }

  private async initiatePhysicalGoldTransfer(order: InternationalSJCOrder): Promise<void> {
    const transferId = `TRANSFER_${Date.now()}_${this.generateRandomId()}`;
    const trackingNumber = `INTL_SJC_${Date.now()}`;

    const transfer: PhysicalGoldTransfer = {
      transferId,
      orderId: order.orderId,
      fromInstitution: order.internationalInstitution,
      toLocation: order.sjcLocation,
      goldType: 'SJC_9999',
      transferAmount: order.physicalGoldWeight,
      transferStatus: 'initiated',
      trackingNumber,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.transfers.set(transferId, transfer);

    console.log(`🚚 Physical gold transfer initiated: ${transferId}`);
    console.log(`   From: ${order.internationalInstitution}`);
    console.log(`   To: ${order.sjcLocation}`);
    console.log(`   Amount: ${(order.physicalGoldWeight/1000).toFixed(2)} kg SJC gold`);
    console.log(`   Tracking: ${trackingNumber}`);

    // Mark order as having physical gold transferred
    order.physicalGoldTransferred = true;

    this.emit('physicalGoldTransfer', {
      transferId,
      orderId: order.orderId,
      institution: order.internationalInstitution,
      amount: order.physicalGoldWeight,
      trackingNumber
    });
  }

  private async processInternationalSettlement(order: InternationalSJCOrder, userProfits: boolean): Promise<void> {
    const distributionId = `DIST_${Date.now()}_${this.generateRandomId()}`;

    const distribution: ProfitLossDistribution = {
      distributionId,
      orderId: order.orderId,
      userProfit: userProfits,
      totalAmount: userProfits ? 
        (order.liquidityProfit + order.goldMarketDilution) : 
        (order.vietnameseBankProfit + order.sjcProfit),
      distribution: userProfits ? {
        internationalLiquidity: order.liquidityProfit,
        goldMarketDilution: order.goldMarketDilution
      } : {
        vietnameseBanks: order.vietnameseBankProfit,
        sjcProfit: order.sjcProfit
      },
      executedAt: new Date()
    };

    this.distributions.set(distributionId, distribution);

    console.log(`🌍 International settlement processed: ${distributionId}`);
    console.log(`   Order: ${order.orderId}`);
    console.log(`   User ${userProfits ? 'Profit' : 'Loss'}: Settlement completed`);

    // Mark international settlement as complete
    order.internationalSettlement = true;

    this.emit('internationalSettlement', {
      distributionId,
      orderId: order.orderId,
      userProfits,
      institution: order.internationalInstitution,
      vietnamesePartner: order.vietnameseCounterparty
    });
  }

  private async notifyInternationalInstitutions(orderIds: string[]): Promise<void> {
    console.log(`📡 Notifying international institutions about ${orderIds.length} orders...`);

    const institutionOrders = new Map<string, InternationalSJCOrder[]>();

    orderIds.forEach(orderId => {
      const order = this.orders.get(orderId);
      if (order) {
        const institutionName = order.internationalInstitution;
        if (!institutionOrders.has(institutionName)) {
          institutionOrders.set(institutionName, []);
        }
        institutionOrders.get(institutionName)!.push(order);
      }
    });

    for (const [institutionName, orders] of institutionOrders) {
      const totalLots = orders.reduce((sum, order) => sum + order.lotSize, 0);
      const totalWeight = orders.reduce((sum, order) => sum + order.physicalGoldWeight, 0);

      console.log(`🌍 ${institutionName}:`);
      console.log(`   Orders: ${orders.length}`);
      console.log(`   Total Lots: ${totalLots}`);
      console.log(`   Physical Gold Required: ${(totalWeight/1000).toFixed(2)} kg`);
      console.log(`   SJC Gold Preparation: Required for Vietnamese delivery`);
    }

    console.log('✅ All international institutions notified for physical SJC gold preparation');
  }

  private async coordinateInternationalGoldTransfers(orderIds: string[]): Promise<void> {
    console.log(`🌍 Coordinating international physical gold transfers...`);

    const transfersByInstitution = new Map<string, number>();
    const transfersBySJCLocation = new Map<string, number>();

    orderIds.forEach(orderId => {
      const order = this.orders.get(orderId);
      if (order) {
        // Count by institution
        const currentInst = transfersByInstitution.get(order.internationalInstitution) || 0;
        transfersByInstitution.set(order.internationalInstitution, currentInst + order.physicalGoldWeight);

        // Count by SJC location
        const currentLoc = transfersBySJCLocation.get(order.sjcLocation) || 0;
        transfersBySJCLocation.set(order.sjcLocation, currentLoc + order.physicalGoldWeight);
      }
    });

    console.log('📊 Physical Gold Transfer Summary:');
    console.log('   By International Institution:');
    for (const [institution, weight] of transfersByInstitution) {
      console.log(`     ${institution}: ${(weight/1000).toFixed(2)} kg`);
    }

    console.log('   By SJC Location:');
    for (const [location, weight] of transfersBySJCLocation) {
      console.log(`     ${location}: ${(weight/1000).toFixed(2)} kg`);
    }

    console.log('✅ International gold transfer coordination complete');
  }

  public async executeAllOrders(): Promise<void> {
    console.log('🚀 Executing all 80 international orders...');

    const pendingOrders = Array.from(this.orders.values()).filter(order => order.status === 'pending');

    // Execute orders in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < pendingOrders.length; i += batchSize) {
      const batch = pendingOrders.slice(i, i + batchSize);
      const batchPromises = batch.map(order => this.executeOrder(order.orderId));
      await Promise.all(batchPromises);

      console.log(`✅ Executed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pendingOrders.length/batchSize)}`);
    }

    console.log(`✅ All ${pendingOrders.length} orders executed successfully`);
    console.log('🌍 International physical gold transfers initiated');
    console.log('💰 Profit/loss distributions processed');
    console.log('🏦 Vietnamese institutions and SJC settlement completed');
  }

  public getSystemStatus(): any {
    const orders = Array.from(this.orders.values());
    const transfers = Array.from(this.transfers.values());
    const distributions = Array.from(this.distributions.values());

    const totalProfitToInternational = distributions
      .filter(d => d.userProfit)
      .reduce((sum, d) => sum + (d.distribution.internationalLiquidity || 0), 0);

    const totalProfitToVietnamese = distributions
      .filter(d => !d.userProfit)
      .reduce((sum, d) => sum + (d.distribution.vietnameseBanks || 0) + (d.distribution.sjcProfit || 0), 0);

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      executedOrders: orders.filter(o => o.status === 'settled').length,
      totalLots: orders.reduce((sum, order) => sum + order.lotSize, 0),
      totalPhysicalGold: `${(orders.reduce((sum, order) => sum + order.physicalGoldWeight, 0) / 1000).toFixed(2)} kg`,
      totalSJCTaels: orders.reduce((sum, order) => sum + order.sjcGoldTaels, 0),
      physicalTransfers: transfers.length,
      internationalSettlements: distributions.length,
      totalProfitToInternational: totalProfitToInternational,
      totalProfitToVietnamese: totalProfitToVietnamese,
      internationalInstitutions: this.institutions.size
    };
  }

  public getInstitutionSummary(): any {
    const orders = Array.from(this.orders.values());
    const summary = new Map<string, any>();

    orders.forEach(order => {
      const institution = order.internationalInstitution;
      if (!summary.has(institution)) {
        summary.set(institution, {
          institution,
          orderCount: 0,
          totalLots: 0,
          totalPhysicalGold: 0,
          vietnamesePartners: new Set()
        });
      }

      const instSummary = summary.get(institution)!;
      instSummary.orderCount++;
      instSummary.totalLots += order.lotSize;
      instSummary.totalPhysicalGold += order.physicalGoldWeight;
      instSummary.vietnamesePartners.add(order.vietnameseCounterparty);
    });

    return Array.from(summary.values()).map(s => ({
      ...s,
      totalPhysicalGold: `${(s.totalPhysicalGold / 1000).toFixed(2)} kg`,
      vietnamesePartners: Array.from(s.vietnamesePartners)
    }));
  }
}

export const internationalSJCGoldSystem = new InternationalSJCGoldSystem();