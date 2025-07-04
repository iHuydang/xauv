import WebSocket from 'ws';
import { EventEmitter } from 'events';
import axios from 'axios';

export interface ForexConnection {
  name: string;
  url: string;
  protocol: 'ws' | 'socketio' | 'custom';
  authenticated: boolean;
  lastPing: number;
  symbols: string[];
}

export interface ForexPrice {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: number;
  source: string;
}

export class RealForexWebSocketManager extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private priceCache: Map<string, ForexPrice> = new Map();
  private connectionConfigs: Map<string, ForexConnection> = new Map();
  private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this.initializeRealConnections();
  }

  private initializeRealConnections(): void {
    // Alpha Vantage WebSocket (Free tier available)
    this.connectionConfigs.set('alphavantage', {
      name: 'Alpha Vantage',
      url: 'wss://ws.finnhub.io?token=demo',
      protocol: 'ws',
      authenticated: false,
      lastPing: 0,
      symbols: ['OANDA:EUR_USD', 'OANDA:GBP_USD', 'OANDA:USD_JPY', 'OANDA:USD_CHF']
    });

    // Finnhub WebSocket (Demo available)
    this.connectionConfigs.set('finnhub', {
      name: 'Finnhub',
      url: 'wss://ws.finnhub.io?token=demo',
      protocol: 'ws',
      authenticated: false,
      lastPing: 0,
      symbols: ['FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY', 'FX:USDCHF']
    });

    // TradingView Public WebSocket
    this.connectionConfigs.set('tradingview', {
      name: 'TradingView',
      url: 'wss://data.tradingview.com/socket.io/websocket',
      protocol: 'socketio',
      authenticated: false,
      lastPing: 0,
      symbols: ['FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY', 'OANDA:XAUUSD']
    });

    // Twelve Data WebSocket (Free tier)
    this.connectionConfigs.set('twelvedata', {
      name: 'Twelve Data',
      url: 'wss://ws.twelvedata.com/v1/quotes/price',
      protocol: 'ws',
      authenticated: false,
      lastPing: 0,
      symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF']
    });

    // Polygon.io WebSocket (Free tier available)
    this.connectionConfigs.set('polygon', {
      name: 'Polygon.io',
      url: 'wss://socket.polygon.io/forex',
      protocol: 'ws',
      authenticated: false,
      lastPing: 0,
      symbols: ['C:EURUSD', 'C:GBPUSD', 'C:USDJPY', 'C:USDCHF']
    });
  }

  async startRealConnections(): Promise<void> {
    if (this.isRunning) {
      console.log('Real forex connections already running');
      return;
    }

    console.log('Starting real forex WebSocket connections...');
    this.isRunning = true;

    for (const [providerId, config] of this.connectionConfigs) {
      try {
        await this.connectToProvider(providerId, config);
        await this.delay(1000); // Stagger connections
      } catch (error) {
        console.error(`Failed to connect to ${config.name}:`, error);
      }
    }

    console.log(`Connected to ${this.connections.size} forex data providers`);
    this.emit('connections_ready', { connected: this.connections.size });
  }

  private async connectToProvider(providerId: string, config: ForexConnection): Promise<void> {
    try {
      console.log(`Connecting to ${config.name}...`);

      const ws = new WebSocket(config.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://tradingview.com'
        }
      });

      this.setupProviderHandlers(providerId, ws, config);
      this.connections.set(providerId, ws);

    } catch (error) {
      console.error(`Failed to connect to ${config.name}:`, error);
      this.scheduleReconnection(providerId, config);
    }
  }

  private setupProviderHandlers(providerId: string, ws: WebSocket, config: ForexConnection): void {
    ws.on('open', () => {
      console.log(`Connected to ${config.name}`);
      config.authenticated = true;
      config.lastPing = Date.now();
      
      // Send subscription messages based on provider protocol
      this.subscribeToSymbols(providerId, ws, config);
      this.emit('provider_connected', { providerId, name: config.name });
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = data.toString();
        this.processProviderMessage(providerId, message, config);
      } catch (error) {
        console.error(`Error processing message from ${config.name}:`, error);
      }
    });

    ws.on('error', (error) => {
      console.error(`${config.name} WebSocket error:`, error);
      this.emit('provider_error', { providerId, error });
    });

    ws.on('close', (code, reason) => {
      console.log(`${config.name} disconnected: ${code} ${reason}`);
      config.authenticated = false;
      this.connections.delete(providerId);
      this.scheduleReconnection(providerId, config);
    });

    // Set up heartbeat
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendHeartbeat(providerId, ws, config);
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
  }

  private subscribeToSymbols(providerId: string, ws: WebSocket, config: ForexConnection): void {
    setTimeout(() => {
      switch (providerId) {
        case 'finnhub':
          config.symbols.forEach(symbol => {
            ws.send(JSON.stringify({
              type: 'subscribe',
              symbol: symbol
            }));
          });
          break;

        case 'tradingview':
          // TradingView Socket.IO protocol
          ws.send('40');
          setTimeout(() => {
            config.symbols.forEach(symbol => {
              ws.send(`42["quote_add_symbols",["${symbol}"]]`);
            });
          }, 1000);
          break;

        case 'twelvedata':
          ws.send(JSON.stringify({
            action: 'subscribe',
            params: {
              symbols: config.symbols.join(',')
            }
          }));
          break;

        case 'polygon':
          ws.send(JSON.stringify({
            action: 'auth',
            params: 'demo'
          }));
          setTimeout(() => {
            config.symbols.forEach(symbol => {
              ws.send(JSON.stringify({
                action: 'subscribe',
                params: symbol
              }));
            });
          }, 1000);
          break;

        case 'alphavantage':
          config.symbols.forEach(symbol => {
            ws.send(JSON.stringify({
              type: 'subscribe',
              symbol: symbol
            }));
          });
          break;
      }
    }, 2000);
  }

  private processProviderMessage(providerId: string, message: string, config: ForexConnection): void {
    try {
      let priceData: ForexPrice | null = null;

      switch (providerId) {
        case 'finnhub':
          priceData = this.parseFinnhubMessage(message, config.name);
          break;
        case 'tradingview':
          priceData = this.parseTradingViewMessage(message, config.name);
          break;
        case 'twelvedata':
          priceData = this.parseTwelveDataMessage(message, config.name);
          break;
        case 'polygon':
          priceData = this.parsePolygonMessage(message, config.name);
          break;
        case 'alphavantage':
          priceData = this.parseAlphaVantageMessage(message, config.name);
          break;
      }

      if (priceData) {
        this.priceCache.set(`${priceData.symbol}_${providerId}`, priceData);
        this.emit('price_update', priceData);
        
        // Check for arbitrage opportunities
        this.checkCrossBrokerArbitrage(priceData);
      }

    } catch (error) {
      console.error(`Error parsing message from ${config.name}:`, error);
    }
  }

  private parseFinnhubMessage(message: string, source: string): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.type === 'trade' && data.data) {
        const trade = data.data[0];
        return {
          symbol: this.normalizeSymbol(trade.s),
          bid: trade.p - 0.0001, // Estimate bid from trade price
          ask: trade.p + 0.0001, // Estimate ask from trade price
          spread: 0.0002,
          timestamp: trade.t,
          source
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parseTradingViewMessage(message: string, source: string): ForexPrice | null {
    try {
      if (message.startsWith('42')) {
        const data = JSON.parse(message.slice(2));
        if (data[0] === 'quote_completed' && data[1]) {
          const quote = data[1];
          return {
            symbol: this.normalizeSymbol(quote.n),
            bid: quote.v?.bid || 0,
            ask: quote.v?.ask || 0,
            spread: (quote.v?.ask || 0) - (quote.v?.bid || 0),
            timestamp: Date.now(),
            source
          };
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parseTwelveDataMessage(message: string, source: string): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.event === 'price' && data.symbol && data.price) {
        return {
          symbol: this.normalizeSymbol(data.symbol),
          bid: data.price - 0.0001,
          ask: data.price + 0.0001,
          spread: 0.0002,
          timestamp: Date.now(),
          source
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parsePolygonMessage(message: string, source: string): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.ev === 'C' && data.pair) {
        return {
          symbol: this.normalizeSymbol(data.pair),
          bid: data.b || 0,
          ask: data.a || 0,
          spread: (data.a || 0) - (data.b || 0),
          timestamp: data.t || Date.now(),
          source
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parseAlphaVantageMessage(message: string, source: string): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.symbol && data.price) {
        return {
          symbol: this.normalizeSymbol(data.symbol),
          bid: data.price - 0.0001,
          ask: data.price + 0.0001,
          spread: 0.0002,
          timestamp: Date.now(),
          source
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private normalizeSymbol(symbol: string): string {
    // Normalize different symbol formats to standard format
    return symbol
      .replace(/[^A-Z]/g, '')
      .replace('FX:', '')
      .replace('OANDA:', '')
      .replace('C:', '')
      .replace('_', '')
      .replace('/', '')
      .substring(0, 6); // Take first 6 characters for currency pairs
  }

  private checkCrossBrokerArbitrage(newPrice: ForexPrice): void {
    const symbol = newPrice.symbol;
    
    // Get all prices for this symbol from different providers
    const allPrices: ForexPrice[] = [];
    this.priceCache.forEach((price, key) => {
      if (key.startsWith(symbol + '_') && Date.now() - price.timestamp < 30000) {
        allPrices.push(price);
      }
    });

    if (allPrices.length >= 2) {
      // Find best buy and sell opportunities
      const bestBid = Math.max(...allPrices.map(p => p.bid));
      const bestAsk = Math.min(...allPrices.map(p => p.ask));
      const arbitrageSpread = bestBid - bestAsk;

      if (arbitrageSpread > 0.0003) { // 3 pips minimum profit
        const bidProvider = allPrices.find(p => p.bid === bestBid);
        const askProvider = allPrices.find(p => p.ask === bestAsk);
        
        console.log(`Arbitrage opportunity detected for ${symbol}:`);
        console.log(`  Buy from ${askProvider?.source} at ${bestAsk}`);
        console.log(`  Sell to ${bidProvider?.source} at ${bestBid}`);
        console.log(`  Potential profit: ${arbitrageSpread} (${(arbitrageSpread * 10000).toFixed(1)} pips)`);
        
        this.emit('arbitrage_opportunity', {
          symbol,
          buyPrice: bestAsk,
          sellPrice: bestBid,
          profit: arbitrageSpread,
          buyProvider: askProvider?.source,
          sellProvider: bidProvider?.source
        });
      }
    }
  }

  private sendHeartbeat(providerId: string, ws: WebSocket, config: ForexConnection): void {
    if (ws.readyState === WebSocket.OPEN) {
      switch (providerId) {
        case 'tradingview':
          ws.send('2');
          break;
        case 'finnhub':
          ws.send(JSON.stringify({ type: 'ping' }));
          break;
        default:
          ws.ping();
          break;
      }
      config.lastPing = Date.now();
    }
  }

  private scheduleReconnection(providerId: string, config: ForexConnection): void {
    // Tắt auto-reconnection cho Exness-related providers để tránh restart liên tục
    if (providerId.toLowerCase().includes('exness') || config.name.toLowerCase().includes('exness')) {
      console.log(`🔴 Auto-reconnection disabled for ${config.name} - manual reconnection required`);
      this.emit('provider_failed', { providerId, provider: config.name, reason: 'auto_reconnect_disabled' });
      return;
    }

    if (this.reconnectIntervals.has(providerId)) {
      return; // Already scheduled
    }

    const interval = setInterval(async () => {
      if (this.isRunning && !this.connections.has(providerId)) {
        console.log(`Attempting to reconnect to ${config.name}...`);
        try {
          await this.connectToProvider(providerId, config);
          clearInterval(interval);
          this.reconnectIntervals.delete(providerId);
        } catch (error) {
          console.error(`Reconnection failed for ${config.name}:`, error);
        }
      } else {
        clearInterval(interval);
        this.reconnectIntervals.delete(providerId);
      }
    }, 30000); // Try every 30 seconds

    this.reconnectIntervals.set(providerId, interval);
  }

  getCurrentPrices(): ForexPrice[] {
    const currentPrices: ForexPrice[] = [];
    const now = Date.now();
    
    this.priceCache.forEach((price) => {
      if (now - price.timestamp < 60000) { // Only prices from last minute
        currentPrices.push(price);
      }
    });

    return currentPrices;
  }

  getLatestPrice(symbol: string): ForexPrice | null {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    let latestPrice: ForexPrice | null = null;
    let latestTimestamp = 0;

    this.priceCache.forEach((price, key) => {
      if (key.startsWith(normalizedSymbol + '_') && price.timestamp > latestTimestamp) {
        latestPrice = price;
        latestTimestamp = price.timestamp;
      }
    });

    return latestPrice;
  }

  getConnectionStatus(): any {
    const status: any = {};
    
    this.connectionConfigs.forEach((config, providerId) => {
      const ws = this.connections.get(providerId);
      status[providerId] = {
        name: config.name,
        connected: ws ? ws.readyState === WebSocket.OPEN : false,
        authenticated: config.authenticated,
        lastPing: config.lastPing,
        symbols: config.symbols.length
      };
    });

    return status;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stopAllConnections(): Promise<void> {
    console.log('Stopping all forex connections...');
    this.isRunning = false;

    this.connections.forEach((ws, providerId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    this.reconnectIntervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.connections.clear();
    this.reconnectIntervals.clear();
    this.priceCache.clear();
    
    console.log('All forex connections stopped');
  }
}

export const realForexWebSocketManager = new RealForexWebSocketManager();