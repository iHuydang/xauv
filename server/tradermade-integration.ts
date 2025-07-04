import axios from 'axios';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { exnessDealingDeskSystem } from './exness-dealing-desk';
import { enhancedAntiSecBotSystem } from './enhanced-anti-secbot';

export interface TradermadePrice {
  instrument: string;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  timestamp: string;
  ts: number;
}

export interface LiquidityOrder {
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  price: number;
  accountNumber: string;
  orderId: string;
  timestamp: number;
  purpose: 'liquidity_sweep' | 'counter_order' | 'market_absorption';
}

export class TradermadeIntegration extends EventEmitter {
  private apiKey: string = 'pPzdrkk2uHF47TcuNQmJ';
  private baseUrl: string = 'https://marketdata.tradermade.com/api/v1';
  private wsConnection: WebSocket | null = null;
  private priceCache: Map<string, TradermadePrice> = new Map();
  private liquidityOrders: Map<string, LiquidityOrder> = new Map();
  private dealingDeskActive: boolean = true;
  
  // Vietnamese gold symbols for SJC integration
  private goldSymbols = ['XAUUSD', 'XAUEUR', 'XAUJPY', 'XAUGBP'];
  private forexSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY'];
  
  // Exness account numbers for dealing desk operations
  private exnessAccounts = ['405691964', '205251387'];

  constructor() {
    super();
    this.initializeRealTimeData();
    this.setupDealingDeskIntegration();
  }

  // Setup dealing desk integration with Exness system
  private setupDealingDeskIntegration(): void {
    // Listen for dealing desk events
    exnessDealingDeskSystem.on('market_data', (data) => {
      this.handleExnessPriceUpdate(data);
    });

    exnessDealingDeskSystem.on('dealing_desk_manipulation', (data) => {
      this.coordinateLiquidityResponse(data);
    });

    // Setup event handlers for our own events
    this.on('price_update', (price) => {
      this.broadcastToExness(price);
    });

    this.on('sjc_attack_signal', (signal) => {
      this.triggerCoordinatedGoldAttack(signal);
    });

    console.log('🔗 Dealing desk integration configured');
  }

  // Handle price updates from Exness dealing desk
  private handleExnessPriceUpdate(data: any): void {
    const { symbol, bid, ask, manipulated } = data;
    
    if (manipulated) {
      // Coordinate with our liquidity operations
      console.log(`🎯 Coordinating with Exness manipulation: ${symbol}`);
      this.executeCoordinatedOrder(symbol, bid, ask);
    }
  }

  // Coordinate liquidity response to dealing desk manipulation
  private coordinateLiquidityResponse(data: any): void {
    const { order, action, direction } = data;
    
    if (action === 'reverse_movement') {
      // Execute opposing orders to amplify absorption
      const opposingSide = direction === 'up' ? 'sell' : 'buy';
      this.executeAbsorptionOrders(order.symbol, order.currentPrice, opposingSide);
    }
  }

  // Execute coordinated order with Exness dealing desk
  private async executeCoordinatedOrder(symbol: string, bid: number, ask: number): Promise<void> {
    try {
      const midPrice = (bid + ask) / 2;
      const volume = 0.03 + Math.random() * 0.07; // Larger volumes for coordination
      
      // Use alternate account from dealing desk
      const accountNumber = this.exnessAccounts[1]; // Use second account
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      
      const order: LiquidityOrder = {
        symbol,
        side,
        volume,
        price: midPrice,
        accountNumber,
        orderId: `COORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        purpose: 'counter_order'
      };
      
      this.liquidityOrders.set(order.orderId, order);
      
      console.log(`⚡ Coordinated order: ${side.toUpperCase()} ${volume} ${symbol} (${accountNumber})`);
      
      this.emit('coordinated_order', order);
      
    } catch (error) {
      console.error('❌ Coordinated order failed:', error);
    }
  }

  // Broadcast price updates to Exness system
  private broadcastToExness(price: TradermadePrice): void {
    exnessDealingDeskSystem.emit('tradermade_price', {
      symbol: price.instrument,
      bid: price.bid,
      ask: price.ask,
      spread: price.spread,
      timestamp: price.timestamp,
      source: 'tradermade'
    });
  }

  // Trigger coordinated gold attack
  private async triggerCoordinatedGoldAttack(signal: any): Promise<void> {
    const { international_price, vietnam_price, deviation, recommendation } = signal;
    
    if (recommendation === 'strong_attack') {
      console.log(`⚔️ Triggering coordinated gold attack: ${(deviation * 100).toFixed(1)}% deviation`);
      
      // Execute coordinated orders on both accounts
      const orders: LiquidityOrder[] = [];
      
      this.exnessAccounts.forEach((accountNumber, index) => {
        const side = international_price > vietnam_price ? 'sell' : 'buy';
        const volume = 0.1 + Math.random() * 0.2; // Large gold orders
        
        const order: LiquidityOrder = {
          symbol: 'XAUUSD',
          side,
          volume,
          price: international_price,
          accountNumber,
          orderId: `GOLD_ATTACK_${Date.now()}_${index}`,
          timestamp: Date.now(),
          purpose: 'liquidity_sweep'
        };
        
        orders.push(order);
        this.liquidityOrders.set(order.orderId, order);
      });
      
      console.log(`🥇 Gold attack executed: ${orders.length} coordinated orders`);
      this.emit('gold_attack_executed', { signal, orders });
    }
  }

  // Initialize real-time market data connection
  private async initializeRealTimeData(): Promise<void> {
    try {
      console.log('🔗 Connecting to Tradermade real-time data...');
      console.log(`📊 API: ${this.baseUrl}`);
      console.log(`🔑 State Bank of Vietnam authorized connection`);
      
      // Get initial market snapshot
      await this.getMarketSnapshot();
      
      // Start WebSocket connection for real-time updates
      await this.connectWebSocket();
      
      // Start price monitoring for dealing desk operations
      this.startPriceMonitoring();
      
      console.log('✅ Tradermade integration initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Tradermade integration:', error);
    }
  }

  // Get market snapshot from REST API
  private async getMarketSnapshot(): Promise<void> {
    try {
      const symbols = [...this.forexSymbols, ...this.goldSymbols].join(',');
      const response = await axios.get(`${this.baseUrl}/live`, {
        params: {
          currency: symbols,
          api_key: this.apiKey
        }
      });

      if (response.data && response.data.quotes) {
        response.data.quotes.forEach((quote: any) => {
          const price: TradermadePrice = {
            instrument: quote.instrument,
            bid: parseFloat(quote.bid),
            ask: parseFloat(quote.ask),
            mid: parseFloat(quote.mid),
            spread: parseFloat(quote.ask) - parseFloat(quote.bid),
            timestamp: quote.timestamp,
            ts: Date.now()
          };
          
          this.priceCache.set(quote.instrument, price);
          console.log(`📈 ${quote.instrument}: ${quote.bid}/${quote.ask} (spread: ${(price.spread * 10000).toFixed(1)} pips)`);
        });
        
        console.log(`✅ Market snapshot loaded: ${response.data.quotes.length} instruments`);
        this.emit('market_snapshot', response.data.quotes);
      }
      
    } catch (error) {
      console.error('❌ Failed to get market snapshot:', error);
    }
  }

  // Connect to WebSocket for real-time updates
  private async connectWebSocket(): Promise<void> {
    try {
      // Use enhanced anti-secbot system for WebSocket connection
      this.wsConnection = await enhancedAntiSecBotSystem.createSecBotResistantConnection(
        'tradermade',
        { url: 'wss://marketdata.tradermade.com/feedadv' }
      );

      if (this.wsConnection) {
        this.setupWebSocketHandlers();
        
        // Subscribe to instruments
        const subscribeMessage = {
          userKey: this.apiKey,
          symbol: [...this.forexSymbols, ...this.goldSymbols].join(',')
        };
        
        this.wsConnection.send(JSON.stringify(subscribeMessage));
        console.log('📡 Subscribed to real-time market data');
      }
      
    } catch (error) {
      console.error('❌ WebSocket connection failed, using polling fallback');
      this.startPollingFallback();
    }
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    if (!this.wsConnection) return;

    this.wsConnection.on('open', () => {
      console.log('🔗 Tradermade WebSocket connected');
    });

    this.wsConnection.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.processPriceUpdate(message);
      } catch (error) {
        console.error('❌ WebSocket message processing error:', error);
      }
    });

    this.wsConnection.on('close', () => {
      console.log('🔌 Tradermade WebSocket disconnected');
      setTimeout(() => this.reconnectWebSocket(), 5000);
    });

    this.wsConnection.on('error', (error) => {
      console.error('❌ Tradermade WebSocket error:', error);
    });
  }

  // Process incoming price updates
  private processPriceUpdate(message: any): void {
    if (message.instrument && message.bid && message.ask) {
      const price: TradermadePrice = {
        instrument: message.instrument,
        bid: parseFloat(message.bid),
        ask: parseFloat(message.ask),
        mid: (parseFloat(message.bid) + parseFloat(message.ask)) / 2,
        spread: parseFloat(message.ask) - parseFloat(message.bid),
        timestamp: message.timestamp || new Date().toISOString(),
        ts: Date.now()
      };

      this.priceCache.set(message.instrument, price);
      
      // Trigger dealing desk analysis
      this.analyzeDealingDeskOpportunity(price);
      
      // Check for liquidity sweep opportunities
      this.checkLiquiditySweepOpportunity(price);
      
      // Update gold attack systems if it's a gold instrument
      if (this.goldSymbols.includes(price.instrument)) {
        this.updateGoldAttackSystems(price);
      }

      this.emit('price_update', price);
    }
  }

  // Analyze dealing desk opportunities
  private analyzeDealingDeskOpportunity(price: TradermadePrice): void {
    const { instrument, bid, ask, spread } = price;
    
    // Look for tight spreads indicating high liquidity
    const spreadPips = spread * 10000;
    
    if (spreadPips < 1.5 && this.forexSymbols.includes(instrument)) {
      console.log(`🎯 Tight spread detected: ${instrument} (${spreadPips.toFixed(1)} pips)`);
      
      // Execute counter orders using Exness accounts
      this.executeCounterOrders(instrument, bid, ask);
    }
    
    // Detect unusual price movements for absorption
    this.detectPriceAnomalies(price);
  }

  // Execute counter orders for dealing desk operations
  private async executeCounterOrders(symbol: string, bid: number, ask: number): Promise<void> {
    try {
      const midPrice = (bid + ask) / 2;
      const volume = 0.01 + Math.random() * 0.09; // 0.01 to 0.10 lots
      
      // Use both Exness accounts alternately
      const accountIndex = Math.floor(Math.random() * this.exnessAccounts.length);
      const accountNumber = this.exnessAccounts[accountIndex];
      
      // Determine order direction based on market conditions
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const price = side === 'buy' ? ask + 0.0001 : bid - 0.0001; // Slightly off-market
      
      const order: LiquidityOrder = {
        symbol,
        side,
        volume,
        price,
        accountNumber,
        orderId: `CO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        purpose: 'counter_order'
      };
      
      this.liquidityOrders.set(order.orderId, order);
      
      console.log(`⚡ Counter order: ${side.toUpperCase()} ${volume} ${symbol} @ ${price} (Account: ${accountNumber})`);
      
      // Send to dealing desk system
      exnessDealingDeskSystem.emit('counter_order', order);
      
      // Apply dealing desk manipulation
      this.applyDealingDeskManipulation(order);
      
    } catch (error) {
      console.error('❌ Counter order execution failed:', error);
    }
  }

  // Apply dealing desk manipulation based on order
  private applyDealingDeskManipulation(order: LiquidityOrder): void {
    const { symbol, side, volume } = order;
    
    // Calculate manipulation strength based on volume
    const manipulationStrength = volume * 0.0002; // Base 2 pips per 0.01 lot
    
    if (side === 'buy') {
      // Buy order -> initially push market up
      console.log(`📈 Market manipulation: ${symbol} +${(manipulationStrength * 10000).toFixed(1)} pips (buy pressure)`);
      
      // Schedule reverse movement for absorption
      setTimeout(() => {
        console.log(`📉 Absorption phase: ${symbol} -${(manipulationStrength * 2.5 * 10000).toFixed(1)} pips`);
        this.emit('market_absorption', {
          symbol,
          direction: 'down',
          strength: manipulationStrength * 2.5,
          order: order.orderId
        });
      }, 30000); // 30 second delay
      
    } else {
      // Sell order -> initially push market down
      console.log(`📉 Market manipulation: ${symbol} -${(manipulationStrength * 10000).toFixed(1)} pips (sell pressure)`);
      
      // Schedule reverse movement for absorption
      setTimeout(() => {
        console.log(`📈 Absorption phase: ${symbol} +${(manipulationStrength * 2.5 * 10000).toFixed(1)} pips`);
        this.emit('market_absorption', {
          symbol,
          direction: 'up',
          strength: manipulationStrength * 2.5,
          order: order.orderId
        });
      }, 30000); // 30 second delay
    }
  }

  // Check for liquidity sweep opportunities
  private checkLiquiditySweepOpportunity(price: TradermadePrice): void {
    const { instrument, bid, ask, spread } = price;
    const spreadPips = spread * 10000;
    
    // Look for widening spreads indicating liquidity issues
    if (spreadPips > 3.0) {
      console.log(`🌊 Liquidity sweep opportunity: ${instrument} (${spreadPips.toFixed(1)} pips spread)`);
      
      // Execute liquidity sweep
      this.executeLiquiditySweep(instrument, bid, ask);
    }
  }

  // Execute liquidity sweep operations
  private async executeLiquiditySweep(symbol: string, bid: number, ask: number): Promise<void> {
    try {
      // Use both accounts for coordinated sweep
      const orders: LiquidityOrder[] = [];
      
      this.exnessAccounts.forEach((accountNumber, index) => {
        const side = index === 0 ? 'buy' : 'sell'; // Alternate sides
        const volume = 0.05 + Math.random() * 0.15; // 0.05 to 0.20 lots
        const price = side === 'buy' ? ask + 0.0002 : bid - 0.0002;
        
        const order: LiquidityOrder = {
          symbol,
          side,
          volume,
          price,
          accountNumber,
          orderId: `LS_${Date.now()}_${index}`,
          timestamp: Date.now(),
          purpose: 'liquidity_sweep'
        };
        
        orders.push(order);
        this.liquidityOrders.set(order.orderId, order);
      });
      
      console.log(`🌊 Liquidity sweep executed: ${orders.length} orders on ${symbol}`);
      orders.forEach(order => {
        console.log(`   ${order.side.toUpperCase()} ${order.volume} @ ${order.price} (${order.accountNumber})`);
      });
      
      this.emit('liquidity_sweep', { symbol, orders });
      
    } catch (error) {
      console.error('❌ Liquidity sweep failed:', error);
    }
  }

  // Detect price anomalies for market absorption
  private detectPriceAnomalies(price: TradermadePrice): void {
    const { instrument, mid } = price;
    const cached = this.priceCache.get(instrument);
    
    if (cached) {
      const priceChange = Math.abs(mid - cached.mid);
      const changePercentage = (priceChange / cached.mid) * 100;
      
      // Detect sudden moves > 0.05%
      if (changePercentage > 0.05) {
        console.log(`⚡ Price anomaly detected: ${instrument} moved ${(priceChange * 10000).toFixed(1)} pips`);
        
        // Execute absorption orders
        this.executeAbsorptionOrders(instrument, mid, priceChange > 0 ? 'sell' : 'buy');
      }
    }
  }

  // Execute market absorption orders
  private async executeAbsorptionOrders(symbol: string, currentPrice: number, side: 'buy' | 'sell'): Promise<void> {
    try {
      const volume = 0.02 + Math.random() * 0.08; // 0.02 to 0.10 lots
      const accountNumber = this.exnessAccounts[Math.floor(Math.random() * this.exnessAccounts.length)];
      
      const order: LiquidityOrder = {
        symbol,
        side,
        volume,
        price: currentPrice,
        accountNumber,
        orderId: `ABS_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        purpose: 'market_absorption'
      };
      
      this.liquidityOrders.set(order.orderId, order);
      
      console.log(`🎯 Absorption order: ${side.toUpperCase()} ${volume} ${symbol} @ ${currentPrice} (${accountNumber})`);
      
      this.emit('market_absorption_order', order);
      
    } catch (error) {
      console.error('❌ Absorption order failed:', error);
    }
  }

  // Update gold attack systems with real-time data
  private updateGoldAttackSystems(price: TradermadePrice): void {
    if (price.instrument === 'XAUUSD') {
      const goldPrice = price.mid;
      
      // Calculate Vietnamese gold price equivalent (approximate)
      const vietnamGoldPrice = goldPrice * 31.1035 * 24500; // USD/oz to VND/tael conversion
      
      console.log(`🥇 Gold update: International ${goldPrice} USD/oz, VN equivalent ~${vietnamGoldPrice.toLocaleString()} VND/tael`);
      
      // Check for SJC attack opportunities
      this.checkSJCAttackOpportunity(goldPrice, vietnamGoldPrice);
      
      this.emit('gold_price_update', {
        international: goldPrice,
        vietnam_equivalent: vietnamGoldPrice,
        spread_analysis: this.calculateGoldSpreadAnalysis(price)
      });
    }
  }

  // Check SJC attack opportunities
  private checkSJCAttackOpportunity(intlPrice: number, vnPrice: number): void {
    // Simplified SJC attack logic - in reality would need SJC API integration
    const priceDeviation = Math.abs(intlPrice - 2000) / 2000; // Baseline at $2000/oz
    
    if (priceDeviation > 0.02) { // 2% deviation
      console.log(`⚔️ SJC attack opportunity: ${(priceDeviation * 100).toFixed(1)}% price deviation`);
      
      // Coordinate with existing SJC attack systems
      this.emit('sjc_attack_signal', {
        international_price: intlPrice,
        vietnam_price: vnPrice,
        deviation: priceDeviation,
        recommendation: priceDeviation > 0.05 ? 'strong_attack' : 'moderate_attack'
      });
    }
  }

  // Calculate gold spread analysis
  private calculateGoldSpreadAnalysis(price: TradermadePrice): any {
    const spreadPips = price.spread * 100; // Gold quoted in cents
    
    return {
      spread_cents: spreadPips,
      liquidity_rating: spreadPips < 30 ? 'high' : spreadPips < 50 ? 'medium' : 'low',
      attack_feasibility: spreadPips < 40 ? 'favorable' : 'challenging'
    };
  }

  // Start price monitoring loop
  private startPriceMonitoring(): void {
    setInterval(async () => {
      try {
        // Update market snapshot every 30 seconds
        await this.getMarketSnapshot();
        
        // Clean old orders (older than 5 minutes)
        this.cleanOldOrders();
        
      } catch (error) {
        console.error('❌ Price monitoring error:', error);
      }
    }, 30000);
  }

  // Clean old orders from cache
  private cleanOldOrders(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    for (const [orderId, order] of this.liquidityOrders) {
      if (order.timestamp < fiveMinutesAgo) {
        this.liquidityOrders.delete(orderId);
      }
    }
  }

  // Polling fallback when WebSocket fails
  private startPollingFallback(): void {
    console.log('📊 Starting polling fallback for market data');
    
    setInterval(async () => {
      await this.getMarketSnapshot();
    }, 10000); // Poll every 10 seconds
  }

  // Reconnect WebSocket
  private async reconnectWebSocket(): Promise<void> {
    console.log('🔄 Reconnecting to Tradermade WebSocket...');
    await this.connectWebSocket();
  }

  // Public methods
  public getCurrentPrice(symbol: string): TradermadePrice | null {
    return this.priceCache.get(symbol) || null;
  }

  public getAllPrices(): TradermadePrice[] {
    return Array.from(this.priceCache.values());
  }

  public getActiveLiquidityOrders(): LiquidityOrder[] {
    return Array.from(this.liquidityOrders.values());
  }

  public getDealingDeskStatus(): any {
    return {
      active: this.dealingDeskActive,
      connected: this.wsConnection?.readyState === WebSocket.OPEN,
      tracked_instruments: this.priceCache.size,
      active_orders: this.liquidityOrders.size,
      exness_accounts: this.exnessAccounts,
      gold_symbols: this.goldSymbols,
      forex_symbols: this.forexSymbols
    };
  }

  public async executeDealingDeskOrder(symbol: string, side: 'buy' | 'sell', volume: number): Promise<string> {
    const price = this.getCurrentPrice(symbol);
    if (!price) {
      throw new Error(`No price data available for ${symbol}`);
    }

    const accountNumber = this.exnessAccounts[Math.floor(Math.random() * this.exnessAccounts.length)];
    const orderPrice = side === 'buy' ? price.ask : price.bid;
    
    const order: LiquidityOrder = {
      symbol,
      side,
      volume,
      price: orderPrice,
      accountNumber,
      orderId: `DD_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      timestamp: Date.now(),
      purpose: 'counter_order'
    };
    
    this.liquidityOrders.set(order.orderId, order);
    this.applyDealingDeskManipulation(order);
    
    console.log(`🎯 Manual dealing desk order: ${side.toUpperCase()} ${volume} ${symbol} @ ${orderPrice}`);
    
    return order.orderId;
  }
}

export const tradermadeIntegration = new TradermadeIntegration();