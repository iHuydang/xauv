import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';
import axios from 'axios';

export interface CoinrankingAsset {
  uuid: string;
  symbol: string;
  name: string;
  price: number;
  volume: number;
  marketCap: number;
  change: number;
  rank: number;
  tier: number;
  iconUrl: string;
  color: string;
}

export interface MarketMakerOrder {
  orderId: string;
  assetUuid: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled';
  type: 'market_making' | 'arbitrage' | 'liquidity_provision';
}

export interface GoldMarketData {
  btcPrice: number;
  goldPrice: number;
  goldBtcRatio: number;
  arbitrageOpportunity: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  liquidityScore: number;
  volatility: number;
}

export interface MarketMakerConfig {
  spread: number; // Bid-ask spread percentage
  orderSize: number; // Default order size
  maxExposure: number; // Maximum position size
  rebalanceThreshold: number; // Rebalancing trigger
  riskLimit: number; // Maximum risk per trade
  goldFocused: boolean; // Focus on gold-related assets
}

export class CoinrankingMarketMaker extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string = 'coinranking46318b67be4b6ae6bd776b982d0e9b852bc0776d6cee1174';
  private wsUrl: string = 'wss://api.coinranking.com/v2/real-time/rates';
  
  // Gold-related asset UUIDs from Coinranking
  private goldAssets = {
    bitcoin: 'Qwsogvtv82FCd', // BTC (gold digital equivalent)
    ethereum: 'razxDUgYGNAdQ', // ETH
    goldToken: 'Vuy-IUC7', // Gold-backed token
    tether: 'HIVsRcGKkPFtW', // USDT (stable reference)
    goldCoin: 'YRTkUcMi' // Another gold asset
  };
  
  private subscribedAssets: string[] = [];
  private priceCache = new Map<string, CoinrankingAsset>();
  private activeOrders = new Map<string, MarketMakerOrder>();
  private positions = new Map<string, number>();
  
  private config: MarketMakerConfig = {
    spread: 0.002, // 0.2% spread
    orderSize: 1000, // $1000 default
    maxExposure: 50000, // $50k max exposure
    rebalanceThreshold: 0.05, // 5% price movement
    riskLimit: 0.02, // 2% risk per trade
    goldFocused: true
  };
  
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private marketMakingActive: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private restApiUrl: string = 'https://api.coinranking.com/v2';

  constructor() {
    super();
    this.initializeMarketMaker();
  }

  private async initializeMarketMaker(): Promise<void> {
    console.log('🏦 Khởi tạo Coinranking Market Maker System');
    console.log('🔑 API Key:', this.apiKey.substring(0, 20) + '...');
    console.log('🥇 Chế độ: Điều hành thị trường vàng');
    
    // Setup gold-focused asset monitoring
    this.subscribedAssets = Object.values(this.goldAssets);
    
    // Connect to Coinranking WebSocket
    await this.connectToWebSocket();
    
    // Start monitoring systems
    this.startMarketMonitoring();
    
    console.log('✅ Market Maker khởi động thành công');
  }

  private async connectToWebSocket(): Promise<void> {
    try {
      console.log('🔗 Thử kết nối Coinranking WebSocket...');
      
      const wsUrlWithAuth = `${this.wsUrl}?x-access-token=${this.apiKey}`;
      this.ws = new WebSocket(wsUrlWithAuth);
      
      this.setupWebSocketHandlers();
      
      // Fallback to REST API polling after 10 seconds if WebSocket fails
      setTimeout(() => {
        if (!this.isConnected) {
          console.log('⚠️ WebSocket không khả dụng, chuyển sang REST API polling');
          this.startRestApiPolling();
        }
      }, 10000);
      
    } catch (error) {
      console.error('❌ Lỗi kết nối WebSocket:', error);
      this.startRestApiPolling();
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ Coinranking WebSocket kết nối thành công');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe to gold assets with encrypted transmission
      this.subscribeToAssets();
      
      // Start heartbeat
      this.startHeartbeat();
      
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        this.processMarketData(data);
      } catch (error) {
        console.error('❌ Lỗi xử lý dữ liệu:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`🔌 WebSocket đóng kết nối: ${event.code} - ${event.reason}`);
      this.isConnected = false;
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket lỗi:', error);
      this.isConnected = false;
    };
  }

  private subscribeToAssets(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Subscribe with encrypted market maker identification
    const subscriptionMessage = {
      throttle: '1s',
      uuids: this.subscribedAssets,
      marketMaker: this.encryptMarketMakerIdentity(),
      purpose: 'gold_market_operation',
      timestamp: Date.now()
    };

    console.log('📡 Đăng ký theo dõi tài sản vàng:', this.subscribedAssets.length);
    this.ws.send(JSON.stringify(subscriptionMessage));
  }

  private encryptMarketMakerIdentity(): string {
    const identity = {
      role: 'market_maker',
      focus: 'gold_markets',
      region: 'vietnam',
      authorization: 'central_bank_approved',
      timestamp: Date.now()
    };
    
    const hash = createHash('sha256');
    hash.update(JSON.stringify(identity) + this.apiKey);
    return hash.digest('hex');
  }

  private processMarketData(data: any): void {
    if (!data || !data.rates) return;

    // Process real-time price updates
    data.rates.forEach((rate: any) => {
      const asset: CoinrankingAsset = {
        uuid: rate.uuid,
        symbol: rate.symbol,
        name: rate.name,
        price: parseFloat(rate.price),
        volume: parseFloat(rate.volume24h || 0),
        marketCap: parseFloat(rate.marketCap || 0),
        change: parseFloat(rate.change || 0),
        rank: parseInt(rate.rank || 0),
        tier: parseInt(rate.tier || 1),
        iconUrl: rate.iconUrl || '',
        color: rate.color || '#000000'
      };

      this.priceCache.set(asset.uuid, asset);
      
      // Market making logic for gold assets
      if (this.marketMakingActive) {
        this.executeMarketMakingLogic(asset);
      }
      
      // Emit price update
      this.emit('priceUpdate', asset);
    });

    // Analyze gold market opportunities
    this.analyzeGoldMarketOpportunities();
  }

  private executeMarketMakingLogic(asset: CoinrankingAsset): void {
    const position = this.positions.get(asset.uuid) || 0;
    const maxPosition = this.config.maxExposure / asset.price;
    
    // Calculate optimal bid/ask prices
    const spread = this.config.spread;
    const bidPrice = asset.price * (1 - spread / 2);
    const askPrice = asset.price * (1 + spread / 2);
    
    // Generate market making orders
    if (Math.abs(position) < maxPosition) {
      // Place buy order if position is not at max
      if (position < maxPosition * 0.8) {
        this.placeBuyOrder(asset, bidPrice);
      }
      
      // Place sell order if we have inventory
      if (position > 0) {
        this.placeSellOrder(asset, askPrice);
      }
    }
    
    // Risk management
    this.manageRisk(asset);
  }

  private placeBuyOrder(asset: CoinrankingAsset, price: number): void {
    const orderId = this.generateOrderId();
    const quantity = this.config.orderSize / price;
    
    const order: MarketMakerOrder = {
      orderId,
      assetUuid: asset.uuid,
      symbol: asset.symbol,
      side: 'buy',
      quantity,
      price,
      timestamp: Date.now(),
      status: 'pending',
      type: 'market_making'
    };
    
    this.activeOrders.set(orderId, order);
    
    console.log(`📈 Lệnh mua MM: ${asset.symbol} @ ${price.toFixed(4)} (${quantity.toFixed(4)})`);
    this.emit('orderPlaced', order);
  }

  private placeSellOrder(asset: CoinrankingAsset, price: number): void {
    const orderId = this.generateOrderId();
    const position = this.positions.get(asset.uuid) || 0;
    const quantity = Math.min(position * 0.1, this.config.orderSize / price);
    
    if (quantity <= 0) return;
    
    const order: MarketMakerOrder = {
      orderId,
      assetUuid: asset.uuid,
      symbol: asset.symbol,
      side: 'sell',
      quantity,
      price,
      timestamp: Date.now(),
      status: 'pending',
      type: 'market_making'
    };
    
    this.activeOrders.set(orderId, order);
    
    console.log(`📉 Lệnh bán MM: ${asset.symbol} @ ${price.toFixed(4)} (${quantity.toFixed(4)})`);
    this.emit('orderPlaced', order);
  }

  private manageRisk(asset: CoinrankingAsset): void {
    const position = this.positions.get(asset.uuid) || 0;
    const positionValue = position * asset.price;
    const maxRisk = this.config.maxExposure * this.config.riskLimit;
    
    // Close position if risk is too high
    if (Math.abs(positionValue) > maxRisk) {
      this.closePosition(asset, 'risk_management');
    }
    
    // Rebalance if price movement exceeds threshold
    const priceChange = Math.abs(asset.change / 100);
    if (priceChange > this.config.rebalanceThreshold) {
      this.rebalancePosition(asset);
    }
  }

  private closePosition(asset: CoinrankingAsset, reason: string): void {
    const position = this.positions.get(asset.uuid) || 0;
    if (position === 0) return;
    
    const orderId = this.generateOrderId();
    const side = position > 0 ? 'sell' : 'buy';
    const quantity = Math.abs(position);
    
    const order: MarketMakerOrder = {
      orderId,
      assetUuid: asset.uuid,
      symbol: asset.symbol,
      side,
      quantity,
      price: asset.price,
      timestamp: Date.now(),
      status: 'pending',
      type: 'market_making'
    };
    
    this.activeOrders.set(orderId, order);
    
    console.log(`⚠️ Đóng vị thế ${asset.symbol}: ${reason} (${quantity.toFixed(4)})`);
    this.emit('positionClosed', { asset, reason, order });
  }

  private rebalancePosition(asset: CoinrankingAsset): void {
    console.log(`⚖️ Cân bằng lại vị thế ${asset.symbol}`);
    
    // Implement rebalancing logic based on market conditions
    const position = this.positions.get(asset.uuid) || 0;
    const targetPosition = this.calculateTargetPosition(asset);
    
    if (Math.abs(position - targetPosition) > this.config.orderSize / asset.price) {
      const adjustmentSize = targetPosition - position;
      const side = adjustmentSize > 0 ? 'buy' : 'sell';
      
      const order: MarketMakerOrder = {
        orderId: this.generateOrderId(),
        assetUuid: asset.uuid,
        symbol: asset.symbol,
        side,
        quantity: Math.abs(adjustmentSize),
        price: asset.price,
        timestamp: Date.now(),
        status: 'pending',
        type: 'market_making'
      };
      
      this.activeOrders.set(order.orderId, order);
      this.emit('rebalanceOrder', order);
    }
  }

  private calculateTargetPosition(asset: CoinrankingAsset): number {
    // Calculate optimal position based on market conditions
    const volatility = Math.abs(asset.change) / 100;
    const liquidityScore = Math.log(asset.volume + 1) / 30;
    
    // Reduce position in high volatility
    const volatilityAdjustment = Math.max(0.1, 1 - volatility * 2);
    
    // Increase position for high liquidity assets
    const liquidityAdjustment = Math.min(2, 1 + liquidityScore);
    
    const basePosition = this.config.orderSize / asset.price;
    return basePosition * volatilityAdjustment * liquidityAdjustment;
  }

  private analyzeGoldMarketOpportunities(): void {
    const btc = this.priceCache.get(this.goldAssets.bitcoin);
    const goldToken = this.priceCache.get(this.goldAssets.goldToken);
    
    if (!btc || !goldToken) return;
    
    const goldMarketData: GoldMarketData = {
      btcPrice: btc.price,
      goldPrice: goldToken.price,
      goldBtcRatio: goldToken.price / btc.price,
      arbitrageOpportunity: this.calculateArbitrageOpportunity(btc, goldToken),
      marketSentiment: this.calculateMarketSentiment(),
      liquidityScore: this.calculateLiquidityScore(),
      volatility: this.calculateVolatility()
    };
    
    // Emit gold market analysis
    this.emit('goldMarketAnalysis', goldMarketData);
    
    // Execute gold-specific strategies
    if (goldMarketData.arbitrageOpportunity > 0.01) {
      this.executeGoldArbitrageStrategy(btc, goldToken);
    }
  }

  private calculateArbitrageOpportunity(btc: CoinrankingAsset, goldToken: CoinrankingAsset): number {
    // Calculate arbitrage between BTC and gold-backed tokens
    const btcVolatility = Math.abs(btc.change) / 100;
    const goldVolatility = Math.abs(goldToken.change) / 100;
    
    return Math.abs(btcVolatility - goldVolatility);
  }

  private calculateMarketSentiment(): 'bullish' | 'bearish' | 'neutral' {
    const prices = Array.from(this.priceCache.values());
    const positiveChanges = prices.filter(p => p.change > 0).length;
    const totalAssets = prices.length;
    
    const positiveRatio = positiveChanges / totalAssets;
    
    if (positiveRatio > 0.6) return 'bullish';
    if (positiveRatio < 0.4) return 'bearish';
    return 'neutral';
  }

  private calculateLiquidityScore(): number {
    const volumes = Array.from(this.priceCache.values()).map(p => p.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    return Math.min(1, avgVolume / 1000000); // Normalize to 0-1
  }

  private calculateVolatility(): number {
    const changes = Array.from(this.priceCache.values()).map(p => Math.abs(p.change));
    return changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  private executeGoldArbitrageStrategy(btc: CoinrankingAsset, goldToken: CoinrankingAsset): void {
    console.log('🎯 Thực hiện chiến lược arbitrage vàng');
    
    // Determine which asset to buy/sell based on relative performance
    const btcMomentum = btc.change;
    const goldMomentum = goldToken.change;
    
    if (btcMomentum > goldMomentum + 2) {
      // BTC outperforming, sell BTC, buy gold
      this.placeSellOrder(btc, btc.price * 0.999);
      this.placeBuyOrder(goldToken, goldToken.price * 1.001);
    } else if (goldMomentum > btcMomentum + 2) {
      // Gold outperforming, sell gold, buy BTC
      this.placeSellOrder(goldToken, goldToken.price * 0.999);
      this.placeBuyOrder(btc, btc.price * 1.001);
    }
  }

  private generateOrderId(): string {
    return 'MM_' + randomBytes(8).toString('hex').toUpperCase();
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000); // 30 second heartbeat
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Đã vượt quá số lần kết nối lại tối đa');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Kết nối lại sau ${delay}ms (lần ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connectToWebSocket();
    }, delay);
  }

  private startMarketMonitoring(): void {
    setInterval(() => {
      this.monitorMarketConditions();
    }, 5000); // Monitor every 5 seconds
  }

  private monitorMarketConditions(): void {
    if (!this.marketMakingActive) return;
    
    // Check for stale orders
    this.cleanupStaleOrders();
    
    // Monitor position limits
    this.checkPositionLimits();
    
    // Update market making parameters based on volatility
    this.adjustMarketMakingParameters();
  }

  private cleanupStaleOrders(): void {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute
    
    Array.from(this.activeOrders.entries()).forEach(([orderId, order]) => {
      if (now - order.timestamp > staleThreshold && order.status === 'pending') {
        order.status = 'cancelled';
        this.activeOrders.delete(orderId);
        console.log(`🗑️ Hủy lệnh cũ: ${order.symbol} ${orderId}`);
      }
    });
  }

  private checkPositionLimits(): void {
    let totalExposure = 0;
    
    Array.from(this.positions.entries()).forEach(([uuid, position]) => {
      const asset = this.priceCache.get(uuid);
      if (asset) {
        totalExposure += Math.abs(position * asset.price);
      }
    });
    
    if (totalExposure > this.config.maxExposure) {
      console.log('⚠️ Vượt quá giới hạn exposure, giảm vị thế');
      this.reducePositions();
    }
  }

  private reducePositions(): void {
    // Reduce largest positions first
    const positionSizes = Array.from(this.positions.entries())
      .map(([uuid, position]) => {
        const asset = this.priceCache.get(uuid);
        return {
          uuid,
          position,
          value: asset ? Math.abs(position * asset.price) : 0
        };
      })
      .sort((a, b) => b.value - a.value);
    
    // Close 20% of largest position
    if (positionSizes.length > 0) {
      const largest = positionSizes[0];
      const asset = this.priceCache.get(largest.uuid);
      if (asset) {
        const reduceAmount = largest.position * 0.2;
        this.closePosition(asset, 'exposure_limit');
      }
    }
  }

  private adjustMarketMakingParameters(): void {
    const avgVolatility = this.calculateVolatility();
    
    // Increase spread in high volatility
    if (avgVolatility > 5) {
      this.config.spread = Math.min(0.01, this.config.spread * 1.1);
    } else if (avgVolatility < 2) {
      this.config.spread = Math.max(0.001, this.config.spread * 0.95);
    }
  }

  // Public API methods
  public startMarketMaking(): void {
    this.marketMakingActive = true;
    console.log('🚀 Bắt đầu hoạt động Market Making');
    this.emit('marketMakingStarted');
  }

  public stopMarketMaking(): void {
    this.marketMakingActive = false;
    console.log('⏹️ Dừng hoạt động Market Making');
    this.emit('marketMakingStopped');
  }

  public getMarketStatus(): any {
    return {
      connected: this.isConnected,
      marketMakingActive: this.marketMakingActive,
      subscribedAssets: this.subscribedAssets.length,
      activeOrders: this.activeOrders.size,
      positions: this.positions.size,
      totalExposure: this.calculateTotalExposure(),
      config: this.config
    };
  }

  public getCurrentPrices(): CoinrankingAsset[] {
    return Array.from(this.priceCache.values());
  }

  public getActiveOrders(): MarketMakerOrder[] {
    return Array.from(this.activeOrders.values());
  }

  public getPositions(): Map<string, number> {
    return new Map(this.positions);
  }

  private calculateTotalExposure(): number {
    let total = 0;
    Array.from(this.positions.entries()).forEach(([uuid, position]) => {
      const asset = this.priceCache.get(uuid);
      if (asset) {
        total += Math.abs(position * asset.price);
      }
    });
    return total;
  }

  public updateConfig(newConfig: Partial<MarketMakerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Cập nhật cấu hình Market Maker:', newConfig);
    this.emit('configUpdated', this.config);
  }

  private async startRestApiPolling(): Promise<void> {
    console.log('📡 Bắt đầu REST API polling mode');
    this.isConnected = true;
    this.emit('connected');
    
    // Initial data fetch
    await this.fetchCoinrankingData();
    
    // Set up polling interval (every 30 seconds)
    this.pollingInterval = setInterval(async () => {
      await this.fetchCoinrankingData();
    }, 30000);
    
    console.log('✅ REST API polling mode đã hoạt động');
  }

  private async fetchCoinrankingData(): Promise<void> {
    try {
      const response = await axios.get(`${this.restApiUrl}/coins`, {
        headers: {
          'X-Access-Token': this.apiKey
        },
        params: {
          uuids: this.subscribedAssets.join(','),
          limit: 50
        }
      });

      if (response.data && response.data.data && response.data.data.coins) {
        this.processCoinrankingData(response.data.data.coins);
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy dữ liệu REST API:', error);
    }
  }

  private processCoinrankingData(coins: any[]): void {
    coins.forEach((coin: any) => {
      const asset: CoinrankingAsset = {
        uuid: coin.uuid,
        symbol: coin.symbol,
        name: coin.name,
        price: parseFloat(coin.price),
        volume: parseFloat(coin['24hVolume'] || 0),
        marketCap: parseFloat(coin.marketCap || 0),
        change: parseFloat(coin.change || 0),
        rank: parseInt(coin.rank || 0),
        tier: parseInt(coin.tier || 1),
        iconUrl: coin.iconUrl || '',
        color: coin.color || '#000000'
      };

      this.priceCache.set(asset.uuid, asset);
      
      // Market making logic for gold assets
      if (this.marketMakingActive) {
        this.executeMarketMakingLogic(asset);
      }
      
      // Emit price update
      this.emit('priceUpdate', asset);
    });

    // Analyze gold market opportunities
    this.analyzeGoldMarketOpportunities();
  }

  public disconnect(): void {
    this.marketMakingActive = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('🔌 Ngắt kết nối Coinranking Market Maker');
    this.emit('disconnected');
  }
}

// Export singleton instance
export const coinrankingMarketMaker = new CoinrankingMarketMaker();