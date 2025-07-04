import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { antiSecBotSystem } from './anti-secbot-system';
import axios from 'axios';

export interface BrokerConfig {
  name: string;
  websocketUrl: string;
  restApiUrl?: string;
  authMethod: 'token' | 'credentials' | 'certificate' | 'none';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    secret?: string;
  };
  subscriptions: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: number;
  volume?: number;
  high?: number;
  low?: number;
  broker: string;
}

export interface TradeExecution {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  status: 'pending' | 'filled' | 'rejected' | 'cancelled';
  broker: string;
  timestamp: number;
}

export class MultiBrokerWebSocketManager extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private brokerConfigs: Map<string, BrokerConfig> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this.initializeBrokerConfigs();
  }

  private initializeBrokerConfigs(): void {
    // Interactive Brokers WebSocket API
    const ibConfig: BrokerConfig = {
      name: 'Interactive Brokers',
      websocketUrl: 'wss://localhost:5555/v1/api/ws',
      restApiUrl: 'https://localhost:5555/v1/api',
      authMethod: 'none', // Uses TWS/Gateway authentication
      subscriptions: [
        'EURUSD',
        'GBPUSD',
        'USDJPY',
        'USDCHF',
        'AUDUSD',
        'USDCAD',
        'NZDUSD',
        'EURJPY',
        'GBPJPY',
        'XAUUSD'
      ],
      reconnectInterval: 5000,
      maxReconnectAttempts: 10
    };

    // Exness MT5 WebSocket
    const exnessConfig: BrokerConfig = {
      name: 'Exness',
      websocketUrl: 'wss://rtapi-sg.excalls.mobi/rtapi/mt5/',
      authMethod: 'credentials',
      credentials: {
        username: '405691964',
        password: 'Dmcs@1975',
        apiKey: 'exness_mt5_api_key'
      },
      subscriptions: [
        'EURUSD',
        'GBPUSD',
        'USDJPY',
        'XAUUSD',
        'USDCAD',
        'AUDUSD'
      ],
      reconnectInterval: 3000,
      maxReconnectAttempts: 15
    };

    // OANDA WebSocket API
    const oandaConfig: BrokerConfig = {
      name: 'OANDA',
      websocketUrl: 'wss://stream-fxpractice.oanda.com/v3/accounts/{account_id}/pricing/stream',
      restApiUrl: 'https://api-fxpractice.oanda.com/v3',
      authMethod: 'token',
      credentials: {
        token: 'oanda_access_token',
        apiKey: 'oanda_api_key'
      },
      subscriptions: [
        'EUR_USD',
        'GBP_USD',
        'USD_JPY',
        'USD_CHF',
        'AUD_USD',
        'USD_CAD',
        'NZD_USD'
      ],
      reconnectInterval: 4000,
      maxReconnectAttempts: 12
    };

    // FXCM WebSocket API
    const fxcmConfig: BrokerConfig = {
      name: 'FXCM',
      websocketUrl: 'wss://api-demo.fxcm.com/ws',
      restApiUrl: 'https://api-demo.fxcm.com',
      authMethod: 'token',
      credentials: {
        token: 'fxcm_access_token'
      },
      subscriptions: [
        'EUR/USD',
        'GBP/USD',
        'USD/JPY',
        'USD/CHF',
        'AUD/USD',
        'USD/CAD'
      ],
      reconnectInterval: 5000,
      maxReconnectAttempts: 8
    };

    // MetaTrader 5 WebSocket
    const mt5Config: BrokerConfig = {
      name: 'MetaTrader5',
      websocketUrl: 'wss://mt5-api.metaquotes.net/ws',
      authMethod: 'credentials',
      credentials: {
        username: 'mt5_account',
        password: 'mt5_password'
      },
      subscriptions: [
        'EURUSD',
        'GBPUSD',
        'USDJPY',
        'XAUUSD',
        'USOIL',
        'BTCUSD'
      ],
      reconnectInterval: 4000,
      maxReconnectAttempts: 10
    };

    // TradingView WebSocket (for additional data)
    const tradingViewConfig: BrokerConfig = {
      name: 'TradingView',
      websocketUrl: 'wss://data.tradingview.com/socket.io/websocket',
      authMethod: 'none',
      subscriptions: [
        'FX:EURUSD',
        'FX:GBPUSD',
        'FX:USDJPY',
        'OANDA:XAUUSD',
        'FXCM:USDCAD'
      ],
      reconnectInterval: 6000,
      maxReconnectAttempts: 5
    };

    this.brokerConfigs.set('ib', ibConfig);
    this.brokerConfigs.set('exness', exnessConfig);
    this.brokerConfigs.set('oanda', oandaConfig);
    this.brokerConfigs.set('fxcm', fxcmConfig);
    this.brokerConfigs.set('mt5', mt5Config);
    this.brokerConfigs.set('tradingview', tradingViewConfig);
  }

  async startAllConnections(): Promise<void> {
    if (this.isRunning) {
      console.log('Multi-broker connections already running');
      return;
    }

    console.log('🚀 Starting multi-broker WebSocket connections...');
    this.isRunning = true;

    const connectionPromises = Array.from(this.brokerConfigs.entries()).map(
      ([brokerId, config]) => this.connectToBroker(brokerId, config)
    );

    await Promise.allSettled(connectionPromises);
    
    console.log(`✅ Connected to ${this.connections.size} brokers out of ${this.brokerConfigs.size} configured`);
    this.emit('all_connections_started', {
      connected: this.connections.size,
      total: this.brokerConfigs.size
    });
  }

  private async connectToBroker(brokerId: string, config: BrokerConfig): Promise<void> {
    try {
      console.log(`🔗 Connecting to ${config.name}...`);

      // Use anti-secbot protection for WebSocket creation
      const ws = await antiSecBotSystem.createProtectedWebSocket(
        config.websocketUrl,
        this.buildWebSocketOptions(config)
      );

      this.setupWebSocketHandlers(brokerId, ws, config);
      this.connections.set(brokerId, ws);
      this.reconnectAttempts.set(brokerId, 0);

      // Start heartbeat for this connection
      this.startHeartbeat(brokerId, ws);

      console.log(`✅ Connected to ${config.name}`);

    } catch (error) {
      console.error(`❌ Failed to connect to ${config.name}:`, error);
      this.scheduleReconnection(brokerId, config);
    }
  }

  private buildWebSocketOptions(config: BrokerConfig): any {
    const options: any = {
      headers: {}
    };

    switch (config.authMethod) {
      case 'token':
        if (config.credentials?.token) {
          options.headers['Authorization'] = `Bearer ${config.credentials.token}`;
        }
        break;
      case 'credentials':
        if (config.credentials?.username && config.credentials?.password) {
          const auth = Buffer.from(
            `${config.credentials.username}:${config.credentials.password}`
          ).toString('base64');
          options.headers['Authorization'] = `Basic ${auth}`;
        }
        break;
    }

    return options;
  }

  private setupWebSocketHandlers(brokerId: string, ws: WebSocket, config: BrokerConfig): void {
    ws.on('open', () => {
      console.log(`🟢 ${config.name} WebSocket opened`);
      this.authenticateConnection(brokerId, ws, config);
      this.subscribeToSymbols(brokerId, ws, config);
      this.emit('broker_connected', { brokerId, broker: config.name });
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.processMessage(brokerId, message, config);
      } catch (error) {
        console.error(`❌ Error parsing message from ${config.name}:`, error);
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ ${config.name} WebSocket error:`, error);
      this.emit('broker_error', { brokerId, broker: config.name, error });
    });

    ws.on('close', (code, reason) => {
      console.log(`🔴 ${config.name} WebSocket closed: ${code} ${reason}`);
      this.cleanupConnection(brokerId);
      this.scheduleReconnection(brokerId, config);
      this.emit('broker_disconnected', { brokerId, broker: config.name, code, reason });
    });
  }

  private async authenticateConnection(brokerId: string, ws: WebSocket, config: BrokerConfig): Promise<void> {
    switch (brokerId) {
      case 'ib':
        // Interactive Brokers authentication via TWS/Gateway
        ws.send(JSON.stringify({
          method: 'authenticate',
          params: {
            version: 'v1'
          }
        }));
        break;

      case 'exness':
        // Exness MT5 authentication
        ws.send(JSON.stringify({
          action: 'auth',
          login: config.credentials?.username,
          password: config.credentials?.password,
          server: 'Exness-MT5Real8'
        }));
        break;

      case 'oanda':
        // OANDA uses token in headers, no additional auth needed
        break;

      case 'fxcm':
        // FXCM authentication
        ws.send(JSON.stringify({
          action: 'authenticate',
          access_token: config.credentials?.token
        }));
        break;

      case 'mt5':
        // MetaTrader 5 authentication
        ws.send(JSON.stringify({
          type: 'auth',
          login: config.credentials?.username,
          password: config.credentials?.password
        }));
        break;

      case 'tradingview':
        // TradingView uses socket.io protocol
        ws.send('42["set_auth_token",""]');
        break;
    }
  }

  private subscribeToSymbols(brokerId: string, ws: WebSocket, config: BrokerConfig): void {
    setTimeout(() => {
      switch (brokerId) {
        case 'ib':
          config.subscriptions.forEach(symbol => {
            ws.send(JSON.stringify({
              method: 'subscribe',
              params: {
                conid: this.getIBConId(symbol),
                fields: ['31', '55', '70', '71'] // bid, ask, high, low
              }
            }));
          });
          break;

        case 'exness':
          config.subscriptions.forEach(symbol => {
            ws.send(JSON.stringify({
              action: 'subscribe',
              symbol: symbol,
              type: 'quotes'
            }));
          });
          break;

        case 'oanda':
          const instruments = config.subscriptions.join(',');
          // OANDA subscription is done via URL parameters
          break;

        case 'fxcm':
          config.subscriptions.forEach(symbol => {
            ws.send(JSON.stringify({
              action: 'subscribe',
              symbol: symbol
            }));
          });
          break;

        case 'mt5':
          config.subscriptions.forEach(symbol => {
            ws.send(JSON.stringify({
              type: 'subscribe',
              symbol: symbol,
              period: 'M1'
            }));
          });
          break;

        case 'tradingview':
          config.subscriptions.forEach(symbol => {
            ws.send(`42["quote_add_symbols",["${symbol}"]]`);
          });
          break;
      }
    }, 2000); // Wait 2 seconds after connection before subscribing
  }

  private processMessage(brokerId: string, message: any, config: BrokerConfig): void {
    try {
      let marketData: MarketData | null = null;

      switch (brokerId) {
        case 'ib':
          marketData = this.parseIBMessage(message, config.name);
          break;
        case 'exness':
          marketData = this.parseExnessMessage(message, config.name);
          break;
        case 'oanda':
          marketData = this.parseOandaMessage(message, config.name);
          break;
        case 'fxcm':
          marketData = this.parseFXCMMessage(message, config.name);
          break;
        case 'mt5':
          marketData = this.parseMT5Message(message, config.name);
          break;
        case 'tradingview':
          marketData = this.parseTradingViewMessage(message, config.name);
          break;
      }

      if (marketData) {
        this.emit('market_data', marketData);
      }

    } catch (error) {
      console.error(`❌ Error processing message from ${config.name}:`, error);
    }
  }

  private parseIBMessage(message: any, broker: string): MarketData | null {
    if (message.topic === 'smd' && message.data) {
      const data = message.data;
      return {
        symbol: this.getSymbolFromIBConId(data.conid),
        bid: data['31'],
        ask: data['55'],
        spread: data['55'] - data['31'],
        timestamp: Date.now(),
        high: data['70'],
        low: data['71'],
        broker
      };
    }
    return null;
  }

  private parseExnessMessage(message: any, broker: string): MarketData | null {
    if (message.type === 'quote' && message.data) {
      const data = message.data;
      return {
        symbol: data.symbol,
        bid: data.bid,
        ask: data.ask,
        spread: data.ask - data.bid,
        timestamp: data.time || Date.now(),
        volume: data.volume,
        broker
      };
    }
    return null;
  }

  private parseOandaMessage(message: any, broker: string): MarketData | null {
    if (message.type === 'PRICE' && message.instrument) {
      return {
        symbol: message.instrument.replace('_', ''),
        bid: parseFloat(message.bids[0]?.price || '0'),
        ask: parseFloat(message.asks[0]?.price || '0'),
        spread: parseFloat(message.asks[0]?.price || '0') - parseFloat(message.bids[0]?.price || '0'),
        timestamp: new Date(message.time).getTime(),
        broker
      };
    }
    return null;
  }

  private parseFXCMMessage(message: any, broker: string): MarketData | null {
    if (message.type === 'price_update' && message.data) {
      const data = message.data;
      return {
        symbol: data.symbol.replace('/', ''),
        bid: data.bid,
        ask: data.ask,
        spread: data.ask - data.bid,
        timestamp: data.timestamp || Date.now(),
        broker
      };
    }
    return null;
  }

  private parseMT5Message(message: any, broker: string): MarketData | null {
    if (message.type === 'tick' && message.data) {
      const data = message.data;
      return {
        symbol: data.symbol,
        bid: data.bid,
        ask: data.ask,
        spread: data.ask - data.bid,
        timestamp: data.time || Date.now(),
        volume: data.volume,
        broker
      };
    }
    return null;
  }

  private parseTradingViewMessage(message: any, broker: string): MarketData | null {
    // TradingView socket.io message parsing
    if (typeof message === 'string' && message.startsWith('42')) {
      try {
        const data = JSON.parse(message.slice(2));
        if (data[0] === 'quote_completed' && data[1]) {
          const quote = data[1];
          return {
            symbol: quote.n?.replace('FX:', '').replace('OANDA:', '').replace('FXCM:', ''),
            bid: quote.v?.bid,
            ask: quote.v?.ask,
            spread: quote.v?.ask - quote.v?.bid,
            timestamp: Date.now(),
            broker
          };
        }
      } catch (error) {
        // Ignore parsing errors for TradingView
      }
    }
    return null;
  }

  private getIBConId(symbol: string): number {
    const conIdMap: Record<string, number> = {
      'EURUSD': 12087792,
      'GBPUSD': 12087797,
      'USDJPY': 12087881,
      'USDCHF': 12087820,
      'AUDUSD': 15016062,
      'USDCAD': 12087802,
      'NZDUSD': 15016059,
      'XAUUSD': 69067924
    };
    return conIdMap[symbol] || 12087792;
  }

  private getSymbolFromIBConId(conid: number): string {
    const symbolMap: Record<number, string> = {
      12087792: 'EURUSD',
      12087797: 'GBPUSD',
      12087881: 'USDJPY',
      12087820: 'USDCHF',
      15016062: 'AUDUSD',
      12087802: 'USDCAD',
      15016059: 'NZDUSD',
      69067924: 'XAUUSD'
    };
    return symbolMap[conid] || 'UNKNOWN';
  }

  private startHeartbeat(brokerId: string, ws: WebSocket): void {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        this.clearHeartbeat(brokerId);
      }
    }, 30000); // Ping every 30 seconds

    this.heartbeatIntervals.set(brokerId, interval);
  }

  private clearHeartbeat(brokerId: string): void {
    const interval = this.heartbeatIntervals.get(brokerId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(brokerId);
    }
  }

  private cleanupConnection(brokerId: string): void {
    this.connections.delete(brokerId);
    this.clearHeartbeat(brokerId);
  }

  private scheduleReconnection(brokerId: string, config: BrokerConfig): void {
    const attempts = this.reconnectAttempts.get(brokerId) || 0;
    
    if (attempts >= config.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${config.name}`);
      this.emit('broker_failed', { brokerId, broker: config.name });
      return;
    }

    const delay = config.reconnectInterval * Math.pow(2, attempts); // Exponential backoff
    console.log(`🔄 Scheduling reconnection to ${config.name} in ${delay}ms (attempt ${attempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts.set(brokerId, attempts + 1);
      this.connectToBroker(brokerId, config);
    }, delay);
  }

  async placeOrder(brokerId: string, order: any): Promise<TradeExecution | null> {
    const ws = this.connections.get(brokerId);
    const config = this.brokerConfigs.get(brokerId);

    if (!ws || !config || ws.readyState !== WebSocket.OPEN) {
      console.error(`❌ Cannot place order: ${config?.name || brokerId} not connected`);
      return null;
    }

    try {
      const orderMessage = this.buildOrderMessage(brokerId, order);
      ws.send(JSON.stringify(orderMessage));

      // Return a pending trade execution
      return {
        orderId: `${brokerId}_${Date.now()}`,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price,
        status: 'pending',
        broker: config.name,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`❌ Error placing order on ${config.name}:`, error);
      return null;
    }
  }

  private buildOrderMessage(brokerId: string, order: any): any {
    switch (brokerId) {
      case 'ib':
        return {
          method: 'place_order',
          params: {
            conid: this.getIBConId(order.symbol),
            orderType: order.type || 'MKT',
            side: order.side.toUpperCase(),
            quantity: order.quantity,
            price: order.price
          }
        };

      case 'exness':
        return {
          action: 'trade',
          symbol: order.symbol,
          cmd: order.side === 'buy' ? 0 : 1,
          volume: order.quantity,
          price: order.price,
          type: order.type || 'market'
        };

      default:
        return {
          action: 'place_order',
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          price: order.price,
          type: order.type || 'market'
        };
    }
  }

  getConnectionStatus(): any {
    const status: any = {};
    
    this.brokerConfigs.forEach((config, brokerId) => {
      const ws = this.connections.get(brokerId);
      status[brokerId] = {
        name: config.name,
        connected: ws ? ws.readyState === WebSocket.OPEN : false,
        reconnectAttempts: this.reconnectAttempts.get(brokerId) || 0,
        maxAttempts: config.maxReconnectAttempts
      };
    });

    return status;
  }

  async stopAllConnections(): Promise<void> {
    console.log('🛑 Stopping all broker connections...');
    this.isRunning = false;

    this.connections.forEach((ws, brokerId) => {
      this.clearHeartbeat(brokerId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    this.connections.clear();
    this.reconnectAttempts.clear();
    
    console.log('✅ All broker connections stopped');
    this.emit('all_connections_stopped');
  }
}

export const multiBrokerWebSocketManager = new MultiBrokerWebSocketManager();