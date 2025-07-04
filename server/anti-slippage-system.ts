
import { EventEmitter } from 'events';
import { marketControlAlgorithm } from './market-control-algorithm';
import { accountManager } from './account-manager';

export interface SlippageEvent {
  accountId: string;
  orderId: string;
  symbol: string;
  expectedDirection: 'up' | 'down';
  actualDirection: 'up' | 'down';
  slippagePips: number;
  timestamp: Date;
  correctionApplied: boolean;
}

export interface OrderDirection {
  accountId: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  expectedPriceDirection: 'up' | 'down';
  timestamp: Date;
}

export class AntiSlippageSystem extends EventEmitter {
  private recentOrders: Map<string, OrderDirection> = new Map();
  private slippageEvents: SlippageEvent[] = [];
  private correctionThreshold = 2; // Pips
  
  // Accounts to monitor and protect
  private protectedAccounts = [
    'exness-405691964',
    'exness-205251387', 
    'exness-405311421',
    'anonymous-demo-001',
    'anonymous-demo-002'
  ];

  constructor() {
    super();
    this.initializeAntiSlippage();
    this.startSlippageMonitoring();
  }

  private initializeAntiSlippage(): void {
    console.log('🛡️ KHỞI TẠO HỆ THỐNG CHỐNG SLIPPAGE NGHỊCH ĐẢO');
    console.log('⚡ Anti-Slippage Enforcement System Active');
    console.log(`🔒 Protecting ${this.protectedAccounts.length} accounts`);
    
    // Listen to market control events
    marketControlAlgorithm.on('priceMovement', this.handlePriceMovement.bind(this));
    
    // Listen to account order events - temporarily disabled
    // accountManager.on('orderPlaced', this.trackOrder.bind(this));
  }

  // Track new orders to monitor their expected direction
  public trackOrder(accountId: string, orderData: any): void {
    if (!this.protectedAccounts.includes(accountId)) return;

    const expectedDirection = orderData.side === 'buy' ? 'up' : 'down';
    
    const orderDirection: OrderDirection = {
      accountId,
      symbol: orderData.symbol,
      side: orderData.side,
      volume: orderData.volume,
      expectedPriceDirection: expectedDirection,
      timestamp: new Date()
    };

    const trackingKey = `${accountId}_${orderData.symbol}_${Date.now()}`;
    this.recentOrders.set(trackingKey, orderDirection);

    console.log(`📊 TRACKING ORDER: ${accountId}`);
    console.log(`💱 ${orderData.symbol} ${orderData.side.toUpperCase()} ${orderData.volume} lots`);
    console.log(`🎯 Expected price direction: ${expectedDirection.toUpperCase()}`);

    // Force immediate market compliance
    this.enforceOrderDirection(orderDirection);

    // Clean up old orders after 5 minutes
    setTimeout(() => {
      this.recentOrders.delete(trackingKey);
    }, 300000);
  }

  // Enforce the expected price direction immediately
  private async enforceOrderDirection(orderDirection: OrderDirection): Promise<void> {
    const { accountId, symbol, side, volume, expectedPriceDirection } = orderDirection;

    console.log(`⚡ ENFORCING ORDER DIRECTION:`);
    console.log(`🔥 Account: ${accountId}`);
    console.log(`💱 ${symbol} ${side.toUpperCase()} -> Price must go ${expectedPriceDirection.toUpperCase()}`);

    try {
      // Use market control algorithm to force compliance
      await marketControlAlgorithm.forceMarketCompliance(accountId, symbol, side, volume);
      
      console.log(`✅ Market compliance forced for ${symbol} ${side.toUpperCase()}`);
      
      // Monitor for next 30 seconds to prevent reversal
      this.preventImmediateReversal(symbol, expectedPriceDirection, 30000);
      
    } catch (error) {
      console.error(`❌ Failed to enforce order direction:`, error);
    }
  }

  // Prevent immediate price reversal after order
  private preventImmediateReversal(symbol: string, direction: 'up' | 'down', duration: number): void {
    console.log(`🚫 PREVENTING REVERSAL: ${symbol} must stay ${direction.toUpperCase()} for ${duration/1000}s`);
    
    const interval = setInterval(async () => {
      // Continuously enforce the direction
      const pips = 3; // Minimum 3 pips movement
      await marketControlAlgorithm.forceImmediatePriceMove(symbol, direction, pips);
    }, 2000); // Every 2 seconds

    setTimeout(() => {
      clearInterval(interval);
      console.log(`✅ Reversal prevention completed for ${symbol}`);
    }, duration);
  }

  // Handle price movement events and check for slippage
  private handlePriceMovement(event: any): void {
    const { symbol, movement, orderId } = event;
    
    // Find matching orders for this symbol
    this.recentOrders.forEach((order, key) => {
      if (order.symbol === symbol) {
        const actualDirection = movement > 0 ? 'up' : 'down';
        
        // Check if price moved in wrong direction
        if (order.expectedPriceDirection !== actualDirection) {
          console.log(`🚨 SLIPPAGE DETECTED:`);
          console.log(`📊 ${symbol}: Expected ${order.expectedPriceDirection.toUpperCase()}, Got ${actualDirection.toUpperCase()}`);
          
          this.correctSlippage(order, movement);
        }
      }
    });
  }

  // Correct detected slippage immediately
  private async correctSlippage(order: OrderDirection, wrongMovement: number): Promise<void> {
    const { accountId, symbol, expectedPriceDirection } = order;
    
    console.log(`🔧 CORRECTING SLIPPAGE:`);
    console.log(`💱 ${symbol} for account ${accountId}`);
    console.log(`🎯 Forcing direction: ${expectedPriceDirection.toUpperCase()}`);
    
    try {
      // Calculate correction needed
      const correctionPips = Math.abs(wrongMovement) + this.correctionThreshold;
      
      // Force immediate correction
      await marketControlAlgorithm.forceImmediatePriceMove(
        symbol, 
        expectedPriceDirection, 
        correctionPips
      );
      
      // Record slippage event
      const slippageEvent: SlippageEvent = {
        accountId,
        orderId: `SLIP_${Date.now()}`,
        symbol,
        expectedDirection: expectedPriceDirection,
        actualDirection: wrongMovement > 0 ? 'up' : 'down',
        slippagePips: Math.abs(wrongMovement),
        timestamp: new Date(),
        correctionApplied: true
      };
      
      this.slippageEvents.push(slippageEvent);
      
      console.log(`✅ Slippage corrected: ${correctionPips} pips forced ${expectedPriceDirection.toUpperCase()}`);
      
    } catch (error) {
      console.error(`❌ Failed to correct slippage:`, error);
    }
  }

  // Start continuous slippage monitoring
  private startSlippageMonitoring(): void {
    console.log('🔄 Starting continuous slippage monitoring...');
    
    setInterval(() => {
      this.scanForSlippageViolations();
    }, 2000); // Check every 2 seconds

    setInterval(() => {
      this.enforceAllActiveOrders();
    }, 10000); // Re-enforce every 10 seconds
  }

  // Scan for any slippage violations
  private scanForSlippageViolations(): void {
    this.recentOrders.forEach((order, key) => {
      // Check if enough time has passed to expect price movement
      const orderAge = Date.now() - order.timestamp.getTime();
      
      if (orderAge > 3000) { // After 3 seconds, price should have moved
        // Force compliance if not already moved correctly
        this.enforceOrderDirection(order);
      }
    });
  }

  // Enforce all active orders
  private enforceAllActiveOrders(): void {
    this.recentOrders.forEach((order, key) => {
      if (Date.now() - order.timestamp.getTime() < 60000) { // Within 1 minute
        console.log(`🔧 Re-enforcing: ${order.symbol} ${order.side.toUpperCase()}`);
        this.enforceOrderDirection(order);
      }
    });
  }

  // Manual force compliance for specific order
  public async forceOrderCompliance(
    accountId: string,
    symbol: string,
    side: 'buy' | 'sell',
    volume: number
  ): Promise<void> {
    console.log(`🚨 MANUAL FORCE COMPLIANCE:`);
    console.log(`📊 ${accountId}: ${symbol} ${side.toUpperCase()} ${volume} lots`);
    
    const orderDirection: OrderDirection = {
      accountId,
      symbol,
      side,
      volume,
      expectedPriceDirection: side === 'buy' ? 'up' : 'down',
      timestamp: new Date()
    };
    
    await this.enforceOrderDirection(orderDirection);
  }

  // Get slippage statistics
  public getSlippageStats(): any {
    const totalEvents = this.slippageEvents.length;
    const correctedEvents = this.slippageEvents.filter(e => e.correctionApplied).length;
    const avgSlippage = this.slippageEvents.reduce((sum, e) => sum + e.slippagePips, 0) / totalEvents || 0;
    
    return {
      totalSlippageEvents: totalEvents,
      correctedEvents,
      correctionRate: totalEvents > 0 ? (correctedEvents / totalEvents * 100).toFixed(2) + '%' : '0%',
      averageSlippagePips: avgSlippage.toFixed(2),
      recentEvents: this.slippageEvents.slice(-10),
      activeOrders: this.recentOrders.size,
      protectedAccounts: this.protectedAccounts.length
    };
  }

  // Emergency stop all slippage
  public emergencyStopSlippage(): void {
    console.log('🚨 EMERGENCY STOP SLIPPAGE - FORCING ALL COMPLIANCE');
    
    this.recentOrders.forEach((order, key) => {
      this.enforceOrderDirection(order);
    });
  }
}

export const antiSlippageSystem = new AntiSlippageSystem();
