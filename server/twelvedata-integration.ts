import axios from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface TwelveDataConfig {
  apiKey: string;
  baseUrl: string;
  websocketUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface MarketDataPoint {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  change?: number;
  changePercent?: number;
  source: 'twelvedata';
}

export interface ExchangeInfo {
  name: string;
  code: string;
  country: string;
  timezone: string;
  market_type: 'stock' | 'forex' | 'crypto';
}

export interface ForexPair {
  symbol: string;
  currency_group: string;
  currency_base: string;
  currency_quote: string;
}

export interface CryptoPair {
  symbol: string;
  currency_base: string;
  currency_quote: string;
  exchange: string;
}

export class TwelveDataIntegration extends EventEmitter {
  private config: TwelveDataConfig;
  private websocket: WebSocket | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private marketData: Map<string, MarketDataPoint> = new Map();
  private exchanges: Map<string, ExchangeInfo[]> = new Map();
  private forexPairs: ForexPair[] = [];
  private cryptoPairs: CryptoPair[] = [];
  private requestCount = { minute: 0, day: 0 };
  private lastReset = { minute: Date.now(), day: Date.now() };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000;

  constructor() {
    super();
    this.config = {
      apiKey: 'de39a13c0b504693bf837709dddbd9c2',
      baseUrl: 'https://api.twelvedata.com',
      websocketUrl: 'wss://ws.twelvedata.com',
      rateLimit: {
        requestsPerMinute: 55, // TwelveData free plan limit
        requestsPerDay: 800
      }
    };

    this.initializeIntegration();
  }

  private async initializeIntegration(): Promise<void> {
    console.log('🔗 Initializing TwelveData integration...');
    
    try {
      // Load exchanges data
      await this.loadExchanges();
      
      // Load forex pairs
      await this.loadForexPairs();
      
      // Load crypto pairs
      await this.loadCryptoPairs();
      
      // Initialize WebSocket connection
      await this.connectWebSocket();
      
      console.log('✅ TwelveData integration initialized successfully');
      this.emit('initialized', {
        exchanges: this.exchanges.size,
        forex_pairs: this.forexPairs.length,
        crypto_pairs: this.cryptoPairs.length
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize TwelveData integration:', error);
      this.emit('error', error);
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset minute counter
    if (now - this.lastReset.minute >= 60000) {
      this.requestCount.minute = 0;
      this.lastReset.minute = now;
    }
    
    // Reset day counter
    if (now - this.lastReset.day >= 86400000) {
      this.requestCount.day = 0;
      this.lastReset.day = now;
    }
    
    return this.requestCount.minute < this.config.rateLimit.requestsPerMinute &&
           this.requestCount.day < this.config.rateLimit.requestsPerDay;
  }

  private incrementRequestCount(): void {
    this.requestCount.minute++;
    this.requestCount.day++;
  }

  private async makeApiRequest(endpoint: string, params: any = {}): Promise<any> {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    this.incrementRequestCount();

    const url = `${this.config.baseUrl}${endpoint}`;
    const fullParams = { ...params, apikey: this.config.apiKey };

    try {
      const response = await axios.get(url, { 
        params: fullParams,
        timeout: 10000
      });
      
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'API Error');
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ TwelveData API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Load stock exchanges
  private async loadExchanges(): Promise<void> {
    try {
      const stockExchanges = await this.makeApiRequest('/exchanges', { type: 'stock' });
      const cryptoExchanges = await this.makeApiRequest('/cryptocurrency_exchanges');
      
      if (stockExchanges.data) {
        this.exchanges.set('stock', stockExchanges.data);
        console.log(`📈 Loaded ${stockExchanges.data.length} stock exchanges`);
      }
      
      if (cryptoExchanges.data) {
        this.exchanges.set('crypto', cryptoExchanges.data);
        console.log(`₿ Loaded ${cryptoExchanges.data.length} crypto exchanges`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load exchanges:', error);
    }
  }

  // Load forex pairs
  private async loadForexPairs(): Promise<void> {
    try {
      const response = await this.makeApiRequest('/forex_pairs');
      
      if (response.data) {
        this.forexPairs = response.data;
        console.log(`💱 Loaded ${this.forexPairs.length} forex pairs`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load forex pairs:', error);
    }
  }

  // Load crypto pairs
  private async loadCryptoPairs(): Promise<void> {
    try {
      // Get major crypto pairs for popular exchanges
      const exchanges = ['Binance', 'Coinbase Pro', 'Kraken'];
      this.cryptoPairs = [];
      
      for (const exchange of exchanges) {
        try {
          const response = await this.makeApiRequest('/cryptocurrencies', { 
            exchange: exchange.toLowerCase() 
          });
          
          if (response.data) {
            const exchangePairs = response.data.map((crypto: any) => ({
              symbol: crypto.symbol,
              currency_base: crypto.currency_base,
              currency_quote: crypto.currency_quote,
              exchange: exchange
            }));
            
            this.cryptoPairs.push(...exchangePairs);
          }
        } catch (error) {
          console.log(`⚠️ Could not load crypto pairs for ${exchange}`);
        }
      }
      
      console.log(`₿ Loaded ${this.cryptoPairs.length} crypto pairs`);
      
    } catch (error) {
      console.error('❌ Failed to load crypto pairs:', error);
    }
  }

  // WebSocket connection management
  private async connectWebSocket(): Promise<void> {
    try {
      // TwelveData WebSocket format
      const wsUrl = `${this.config.websocketUrl}/v1/quotes/price?apikey=${this.config.apiKey}`;
      
      console.log('🔗 Connecting to TwelveData WebSocket...');
      this.websocket = new WebSocket(wsUrl, {
        headers: {
          'User-Agent': 'TwelveData-Integration/1.0'
        }
      });
      
      this.websocket.on('open', () => {
        console.log('✅ TwelveData WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.emit('websocket_connected');
        
        // Subscribe to initial symbols
        this.websocket?.send(JSON.stringify({
          action: "subscribe",
          params: {
            symbols: "EURUSD,GBPUSD,XAUUSD"
          }
        }));
      });

      this.websocket.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      this.websocket.on('close', () => {
        console.log('🔌 TwelveData WebSocket disconnected');
        this.emit('websocket_disconnected');
        // Don't auto-reconnect on close to avoid spam
      });

      this.websocket.on('error', (error: Error) => {
        console.log('⚠️ TwelveData WebSocket connection failed - using REST API fallback');
        this.emit('websocket_error', error);
        // Use REST API as fallback
        this.startRESTPolling();
      });

    } catch (error) {
      console.log('⚠️ WebSocket unavailable, using REST API fallback');
      this.startRESTPolling();
    }
  }

  // REST API polling as fallback
  private startRESTPolling(): void {
    console.log('📡 Starting REST API polling for price updates');
    
    const symbols = ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY'];
    
    setInterval(async () => {
      for (const symbol of symbols) {
        try {
          const priceData = await this.getRealTimePrice(symbol);
          if (priceData) {
            this.emit('price_update', priceData);
            
            if (symbol.includes('XAU')) {
              this.emit('gold_price_update', priceData);
            }
            
            if (this.isForexSymbol(symbol)) {
              this.emit('forex_price_update', priceData);
            }
          }
        } catch (error) {
          // Silent fail for individual symbols
        }
      }
    }, 5000); // Poll every 5 seconds
  }

  private handleWebSocketMessage(message: any): void {
    try {
      if (message.event === 'price') {
        const dataPoint: MarketDataPoint = {
          symbol: message.symbol,
          price: parseFloat(message.price),
          timestamp: message.timestamp || Date.now(),
          volume: message.volume ? parseFloat(message.volume) : undefined,
          high: message.high ? parseFloat(message.high) : undefined,
          low: message.low ? parseFloat(message.low) : undefined,
          open: message.open ? parseFloat(message.open) : undefined,
          close: message.close ? parseFloat(message.close) : undefined,
          change: message.change ? parseFloat(message.change) : undefined,
          changePercent: message.percent_change ? parseFloat(message.percent_change) : undefined,
          source: 'twelvedata'
        };

        this.marketData.set(message.symbol, dataPoint);
        this.emit('price_update', dataPoint);
        
        // Integrate with existing gold attack system if gold-related
        if (message.symbol.includes('XAU') || message.symbol.includes('GOLD')) {
          this.emit('gold_price_update', dataPoint);
        }
        
        // Integrate with forex systems
        if (this.isForexSymbol(message.symbol)) {
          this.emit('forex_price_update', dataPoint);
        }
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  }

  private isForexSymbol(symbol: string): boolean {
    return this.forexPairs.some(pair => 
      pair.symbol === symbol || 
      `${pair.currency_base}${pair.currency_quote}` === symbol
    );
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max WebSocket reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  // Public API methods
  public async getRealTimePrice(symbol: string): Promise<MarketDataPoint | null> {
    try {
      const response = await this.makeApiRequest('/price', { symbol });
      
      if (response.price) {
        const dataPoint: MarketDataPoint = {
          symbol: symbol,
          price: parseFloat(response.price),
          timestamp: Date.now(),
          source: 'twelvedata'
        };
        
        this.marketData.set(symbol, dataPoint);
        return dataPoint;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Failed to get real-time price for ${symbol}:`, error);
      return null;
    }
  }

  public async getTimeSeries(symbol: string, interval: string = '1min', outputsize: number = 30): Promise<any> {
    try {
      return await this.makeApiRequest('/time_series', {
        symbol,
        interval,
        outputsize
      });
    } catch (error) {
      console.error(`❌ Failed to get time series for ${symbol}:`, error);
      return null;
    }
  }

  public subscribeToSymbol(symbol: string): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    this.subscribedSymbols.add(symbol);
    
    this.websocket.send(JSON.stringify({
      action: "subscribe",
      params: {
        symbols: symbol
      }
    }));
    
    console.log(`📊 Subscribed to ${symbol}`);
    return true;
  }

  public unsubscribeFromSymbol(symbol: string): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.subscribedSymbols.delete(symbol);
    
    this.websocket.send(JSON.stringify({
      action: "unsubscribe",
      params: {
        symbols: symbol
      }
    }));
    
    console.log(`📊 Unsubscribed from ${symbol}`);
    return true;
  }

  // Getters for data
  public getExchanges(type?: 'stock' | 'crypto'): ExchangeInfo[] {
    if (type) {
      return this.exchanges.get(type) || [];
    }
    
    const allExchanges: ExchangeInfo[] = [];
    this.exchanges.forEach(exchanges => allExchanges.push(...exchanges));
    return allExchanges;
  }

  public getForexPairs(): ForexPair[] {
    return this.forexPairs;
  }

  public getCryptoPairs(): CryptoPair[] {
    return this.cryptoPairs;
  }

  public getMarketData(symbol?: string): MarketDataPoint | Map<string, MarketDataPoint> {
    if (symbol) {
      return this.marketData.get(symbol) || null;
    }
    return this.marketData;
  }

  public getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  public getConnectionStatus(): any {
    return {
      websocket_connected: this.websocket?.readyState === WebSocket.OPEN,
      subscribed_symbols: this.subscribedSymbols.size,
      market_data_cached: this.marketData.size,
      rate_limit_status: {
        requests_per_minute: this.requestCount.minute,
        requests_per_day: this.requestCount.day,
        limit_per_minute: this.config.rateLimit.requestsPerMinute,
        limit_per_day: this.config.rateLimit.requestsPerDay
      }
    };
  }

  public async getTechnicalIndicators(symbol: string, indicator: string, interval: string = '1day'): Promise<any> {
    try {
      const endpoint = `/${indicator.toLowerCase()}`;
      return await this.makeApiRequest(endpoint, {
        symbol,
        interval
      });
    } catch (error) {
      console.error(`❌ Failed to get ${indicator} for ${symbol}:`, error);
      return null;
    }
  }

  // Integration with existing systems
  public integrateWithGoldAttackSystem(): void {
    // Subscribe to gold-related symbols
    const goldSymbols = ['XAUUSD', 'XAUEUR', 'XAUJPY', 'XAUGBP'];
    goldSymbols.forEach(symbol => this.subscribeToSymbol(symbol));
    
    this.on('gold_price_update', (data: MarketDataPoint) => {
      console.log(`🥇 TwelveData Gold Update: ${data.symbol} = $${data.price}`);
    });
  }

  public integrateWithForexSystem(): void {
    // Subscribe to major forex pairs
    const majorPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'];
    majorPairs.forEach(symbol => this.subscribeToSymbol(symbol));
    
    this.on('forex_price_update', (data: MarketDataPoint) => {
      console.log(`💱 TwelveData Forex Update: ${data.symbol} = ${data.price}`);
    });
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    console.log('🔌 TwelveData integration disconnected');
  }
}

export const twelveDataIntegration = new TwelveDataIntegration();