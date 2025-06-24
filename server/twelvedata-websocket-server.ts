import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { twelveDataIntegration } from './twelvedata-integration';

export interface TwelveDataWebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'price_update' | 'status' | 'error';
  symbol?: string;
  symbols?: string[];
  data?: any;
  message?: string;
  timestamp: number;
}

export class TwelveDataWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private subscribedSymbols: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    this.setupTwelveDataEventListeners();
  }

  public initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server: server, 
      path: '/ws/twelvedata' 
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('📡 New TwelveData WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message with current status
      this.sendToClient(ws, {
        type: 'status',
        data: {
          connected: true,
          available_endpoints: this.getAvailableEndpoints(),
          connection_status: twelveDataIntegration.getConnectionStatus()
        },
        timestamp: Date.now()
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          this.sendError(ws, 'Invalid JSON message format');
        }
      });

      ws.on('close', () => {
        console.log('📡 TwelveData WebSocket client disconnected');
        this.clients.delete(ws);
        this.removeClientFromAllSubscriptions(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('❌ TwelveData WebSocket client error:', error);
        this.clients.delete(ws);
        this.removeClientFromAllSubscriptions(ws);
      });
    });

    console.log('🚀 TwelveData WebSocket server initialized on /ws/twelvedata');
  }

  private setupTwelveDataEventListeners(): void {
    // Listen for price updates from TwelveData integration
    twelveDataIntegration.on('price_update', (data) => {
      this.broadcastPriceUpdate(data.symbol, data);
    });

    // Listen for gold price updates
    twelveDataIntegration.on('gold_price_update', (data) => {
      this.broadcastToAllClients({
        type: 'price_update',
        symbol: data.symbol,
        data: {
          ...data,
          category: 'gold',
          integration_source: 'twelvedata'
        },
        timestamp: Date.now()
      });
    });

    // Listen for forex price updates
    twelveDataIntegration.on('forex_price_update', (data) => {
      this.broadcastToAllClients({
        type: 'price_update',
        symbol: data.symbol,
        data: {
          ...data,
          category: 'forex',
          integration_source: 'twelvedata'
        },
        timestamp: Date.now()
      });
    });

    // Listen for connection events
    twelveDataIntegration.on('websocket_connected', () => {
      this.broadcastToAllClients({
        type: 'status',
        data: {
          twelvedata_websocket: 'connected',
          message: 'TwelveData WebSocket connection established'
        },
        timestamp: Date.now()
      });
    });

    twelveDataIntegration.on('websocket_disconnected', () => {
      this.broadcastToAllClients({
        type: 'status',
        data: {
          twelvedata_websocket: 'disconnected',
          message: 'TwelveData WebSocket connection lost'
        },
        timestamp: Date.now()
      });
    });

    twelveDataIntegration.on('error', (error) => {
      this.broadcastToAllClients({
        type: 'error',
        data: {
          error: error.message || 'Unknown TwelveData error',
          source: 'twelvedata_integration'
        },
        timestamp: Date.now()
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    try {
      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(ws, message);
          break;
        
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message);
          break;
        
        case 'get_status':
          this.sendToClient(ws, {
            type: 'status',
            data: twelveDataIntegration.getConnectionStatus(),
            timestamp: Date.now()
          });
          break;
        
        case 'get_exchanges':
          this.handleGetExchanges(ws, message);
          break;
        
        case 'get_forex_pairs':
          this.sendToClient(ws, {
            type: 'forex_pairs',
            data: twelveDataIntegration.getForexPairs(),
            timestamp: Date.now()
          });
          break;
        
        case 'get_crypto_pairs':
          this.sendToClient(ws, {
            type: 'crypto_pairs',
            data: twelveDataIntegration.getCryptoPairs(),
            timestamp: Date.now()
          });
          break;
        
        case 'get_price':
          this.handleGetPrice(ws, message);
          break;
        
        default:
          this.sendError(ws, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.sendError(ws, `Error processing message: ${error}`);
    }
  }

  private handleSubscribe(ws: WebSocket, message: any): void {
    const symbols = Array.isArray(message.symbols) ? message.symbols : [message.symbol];
    const results: any[] = [];

    symbols.forEach((symbol: string) => {
      if (!symbol) return;

      const upperSymbol = symbol.toUpperCase();
      
      // Add client to symbol subscription
      if (!this.subscribedSymbols.has(upperSymbol)) {
        this.subscribedSymbols.set(upperSymbol, new Set());
      }
      this.subscribedSymbols.get(upperSymbol)!.add(ws);

      // Subscribe to TwelveData if not already subscribed
      const success = twelveDataIntegration.subscribeToSymbol(upperSymbol);
      
      results.push({
        symbol: upperSymbol,
        subscribed: success,
        clients_count: this.subscribedSymbols.get(upperSymbol)!.size
      });
    });

    this.sendToClient(ws, {
      type: 'subscribe',
      data: {
        results,
        total_symbols: results.length,
        success_count: results.filter(r => r.subscribed).length
      },
      timestamp: Date.now()
    });
  }

  private handleUnsubscribe(ws: WebSocket, message: any): void {
    const symbols = Array.isArray(message.symbols) ? message.symbols : [message.symbol];
    const results: any[] = [];

    symbols.forEach((symbol: string) => {
      if (!symbol) return;

      const upperSymbol = symbol.toUpperCase();
      
      if (this.subscribedSymbols.has(upperSymbol)) {
        this.subscribedSymbols.get(upperSymbol)!.delete(ws);
        
        // If no clients left for this symbol, unsubscribe from TwelveData
        if (this.subscribedSymbols.get(upperSymbol)!.size === 0) {
          this.subscribedSymbols.delete(upperSymbol);
          twelveDataIntegration.unsubscribeFromSymbol(upperSymbol);
        }
      }

      results.push({
        symbol: upperSymbol,
        unsubscribed: true,
        remaining_clients: this.subscribedSymbols.get(upperSymbol)?.size || 0
      });
    });

    this.sendToClient(ws, {
      type: 'unsubscribe',
      data: {
        results,
        total_symbols: results.length
      },
      timestamp: Date.now()
    });
  }

  private handleGetExchanges(ws: WebSocket, message: any): void {
    const type = message.exchange_type as 'stock' | 'crypto' | undefined;
    const exchanges = twelveDataIntegration.getExchanges(type);
    
    this.sendToClient(ws, {
      type: 'exchanges',
      data: {
        exchanges,
        total_count: exchanges.length,
        type: type || 'all'
      },
      timestamp: Date.now()
    });
  }

  private async handleGetPrice(ws: WebSocket, message: any): Promise<void> {
    const symbol = message.symbol;
    
    if (!symbol) {
      this.sendError(ws, 'Symbol is required for price request');
      return;
    }

    try {
      const priceData = await twelveDataIntegration.getRealTimePrice(symbol.toUpperCase());
      
      this.sendToClient(ws, {
        type: 'price_update',
        symbol: symbol.toUpperCase(),
        data: priceData,
        timestamp: Date.now()
      });
    } catch (error) {
      this.sendError(ws, `Failed to get price for ${symbol}: ${error}`);
    }
  }

  private broadcastPriceUpdate(symbol: string, data: any): void {
    if (this.subscribedSymbols.has(symbol)) {
      const clients = this.subscribedSymbols.get(symbol)!;
      const message: TwelveDataWebSocketMessage = {
        type: 'price_update',
        symbol: symbol,
        data: data,
        timestamp: Date.now()
      };

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, message);
        }
      });
    }
  }

  private broadcastToAllClients(message: TwelveDataWebSocketMessage): void {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: TwelveDataWebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, errorMessage: string): void {
    this.sendToClient(ws, {
      type: 'error',
      message: errorMessage,
      timestamp: Date.now()
    });
  }

  private removeClientFromAllSubscriptions(ws: WebSocket): void {
    this.subscribedSymbols.forEach((clients, symbol) => {
      clients.delete(ws);
      if (clients.size === 0) {
        this.subscribedSymbols.delete(symbol);
        twelveDataIntegration.unsubscribeFromSymbol(symbol);
      }
    });
  }

  private getAvailableEndpoints(): string[] {
    return [
      'subscribe',
      'unsubscribe', 
      'get_status',
      'get_exchanges',
      'get_forex_pairs',
      'get_crypto_pairs',
      'get_price'
    ];
  }

  public getStats(): any {
    return {
      total_clients: this.clients.size,
      subscribed_symbols: Array.from(this.subscribedSymbols.keys()),
      symbol_subscriptions: Object.fromEntries(
        Array.from(this.subscribedSymbols.entries()).map(([symbol, clients]) => [
          symbol,
          clients.size
        ])
      )
    };
  }

  public disconnect(): void {
    if (this.wss) {
      this.clients.forEach(client => client.close());
      this.wss.close();
      this.clients.clear();
      this.subscribedSymbols.clear();
      console.log('🔌 TwelveData WebSocket server disconnected');
    }
  }
}

export const twelveDataWebSocketServer = new TwelveDataWebSocketServer();