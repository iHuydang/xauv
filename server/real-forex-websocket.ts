import WebSocket from "ws";
import { EventEmitter } from "events";
import axios from "axios";

export interface ForexConnection {
  name: string;
  url: string;
  protocol: "ws" | "socketio" | "custom";
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
    // Binance WebSocket (Public, no auth required)
    this.connectionConfigs.set("binance", {
      name: "Binance",
      url: "wss://stream.binance.com:9443/ws/!ticker@arr",
      protocol: "ws",
      authenticated: false,
      lastPing: 0,
      symbols: ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT"],
    });

    // CoinGecko WebSocket (Public)
    this.connectionConfigs.set("coingecko", {
      name: "CoinGecko",
      url: "wss://ws.coingecko.com/ws",
      protocol: "ws",
      authenticated: false,
      lastPing: 0,
      symbols: ["bitcoin", "ethereum", "tether", "binancecoin"],
    });

    // Kraken WebSocket (Public)
    this.connectionConfigs.set("kraken", {
      name: "Kraken",
      url: "wss://ws.kraken.com",
      protocol: "ws",
      authenticated: false,
      lastPing: 0,
      symbols: ["XBT/USD", "ETH/USD", "XAU/USD", "EUR/USD"],
    });

    // BitMEX WebSocket (Public)
    this.connectionConfigs.set("bitmex", {
      name: "BitMEX",
      url: "wss://ws.bitmex.com/realtime",
      protocol: "ws",
      authenticated: false,
      lastPing: 0,
      symbols: ["XBTUSD", "ETHUSD", "XAUUSD"],
    });

    // Bybit WebSocket (Public)
    this.connectionConfigs.set("bybit", {
      name: "Bybit",
      url: "wss://stream.bybit.com/v5/public/spot",
      protocol: "ws",
      authenticated: false,
      lastPing: 0,
      symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    });
  }

  async startRealConnections(): Promise<void> {
    if (this.isRunning) {
      console.log("Real forex connections already running");
      return;
    }

    console.log("Starting real forex WebSocket connections...");
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
    this.emit("connections_ready", { connected: this.connections.size });
  }

  private async connectToProvider(
    providerId: string,
    config: ForexConnection,
  ): Promise<void> {
    try {
      console.log(`Connecting to ${config.name}...`);

      // Enhanced headers for better authentication
      const headers: any = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Origin: "https://tradingview.com",
        Referer: "https://tradingview.com/",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      };

      // Add specific authentication for different providers
      if (providerId === "finnhub") {
        headers["Authorization"] = "Bearer demo";
      } else if (providerId === "polygon") {
        headers["Authorization"] = "Bearer demo";
      }

      const ws = new WebSocket(config.url, {
        headers,
        handshakeTimeout: 30000,
        perMessageDeflate: false,
      });

      this.setupProviderHandlers(providerId, ws, config);
      this.connections.set(providerId, ws);
    } catch (error) {
      console.error(`Failed to connect to ${config.name}:`, error);
      this.scheduleReconnection(providerId, config);
    }
  }

  private setupProviderHandlers(
    providerId: string,
    ws: WebSocket,
    config: ForexConnection,
  ): void {
    ws.on("open", () => {
      console.log(`Connected to ${config.name}`);
      config.authenticated = true;
      config.lastPing = Date.now();

      // Send subscription messages based on provider protocol
      this.subscribeToSymbols(providerId, ws, config);
      this.emit("provider_connected", { providerId, name: config.name });
    });

    ws.on("message", (data: Buffer) => {
      try {
        const message = data.toString();
        this.processProviderMessage(providerId, message, config);
      } catch (error) {
        console.error(`Error processing message from ${config.name}:`, error);
      }
    });

    ws.on("error", (error) => {
      console.error(`${config.name} WebSocket error:`, error);
      this.emit("provider_error", { providerId, error });
    });

    ws.on("close", (code, reason) => {
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

  private subscribeToSymbols(
    providerId: string,
    ws: WebSocket,
    config: ForexConnection,
  ): void {
    setTimeout(() => {
      switch (providerId) {
        case "binance":
          // Binance uses stream names in URL, no additional subscription needed
          console.log(
            `✅ Binance stream active for ${config.symbols.length} symbols`,
          );
          break;

        case "coingecko":
          ws.send(
            JSON.stringify({
              method: "SUBSCRIBE",
              params: config.symbols,
              id: 1,
            }),
          );
          break;

        case "kraken":
          ws.send(
            JSON.stringify({
              event: "subscribe",
              pair: config.symbols,
              subscription: { name: "ticker" },
            }),
          );
          break;

        case "bitmex":
          ws.send(
            JSON.stringify({
              op: "subscribe",
              args: config.symbols.map((symbol) => `quote:${symbol}`),
            }),
          );
          break;

        case "bybit":
          ws.send(
            JSON.stringify({
              op: "subscribe",
              args: config.symbols.map((symbol) => `tickers.${symbol}`),
            }),
          );
          break;
      }
    }, 2000);
  }

  private processProviderMessage(
    providerId: string,
    message: string,
    config: ForexConnection,
  ): void {
    try {
      let priceData: ForexPrice | null = null;

      switch (providerId) {
        case "finnhub":
          priceData = this.parseFinnhubMessage(message, config.name);
          break;
        case "tradingview":
          priceData = this.parseTradingViewMessage(message, config.name);
          break;
        case "twelvedata":
          priceData = this.parseTwelveDataMessage(message, config.name);
          break;
        case "polygon":
          priceData = this.parsePolygonMessage(message, config.name);
          break;
        case "alphavantage":
          priceData = this.parseAlphaVantageMessage(message, config.name);
          break;
      }

      if (priceData) {
        this.priceCache.set(`${priceData.symbol}_${providerId}`, priceData);
        this.emit("price_update", priceData);

        // Check for arbitrage opportunities
        this.checkCrossBrokerArbitrage(priceData);
      }
    } catch (error) {
      console.error(`Error parsing message from ${config.name}:`, error);
    }
  }

  private parseFinnhubMessage(
    message: string,
    source: string,
  ): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.type === "trade" && data.data) {
        const trade = data.data[0];
        return {
          symbol: this.normalizeSymbol(trade.s),
          bid: trade.p - 0.0001, // Estimate bid from trade price
          ask: trade.p + 0.0001, // Estimate ask from trade price
          spread: 0.0002,
          timestamp: trade.t,
          source,
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parseTradingViewMessage(
    message: string,
    source: string,
  ): ForexPrice | null {
    try {
      if (message.startsWith("42")) {
        const data = JSON.parse(message.slice(2));
        if (data[0] === "quote_completed" && data[1]) {
          const quote = data[1];
          return {
            symbol: this.normalizeSymbol(quote.n),
            bid: quote.v?.bid || 0,
            ask: quote.v?.ask || 0,
            spread: (quote.v?.ask || 0) - (quote.v?.bid || 0),
            timestamp: Date.now(),
            source,
          };
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parseTwelveDataMessage(
    message: string,
    source: string,
  ): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.event === "price" && data.symbol && data.price) {
        return {
          symbol: this.normalizeSymbol(data.symbol),
          bid: data.price - 0.0001,
          ask: data.price + 0.0001,
          spread: 0.0002,
          timestamp: Date.now(),
          source,
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parsePolygonMessage(
    message: string,
    source: string,
  ): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.ev === "C" && data.pair) {
        return {
          symbol: this.normalizeSymbol(data.pair),
          bid: data.b || 0,
          ask: data.a || 0,
          spread: (data.a || 0) - (data.b || 0),
          timestamp: data.t || Date.now(),
          source,
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  private parseAlphaVantageMessage(
    message: string,
    source: string,
  ): ForexPrice | null {
    try {
      const data = JSON.parse(message);
      if (data.symbol && data.price) {
        return {
          symbol: this.normalizeSymbol(data.symbol),
          bid: data.price - 0.0001,
          ask: data.price + 0.0001,
          spread: 0.0002,
          timestamp: Date.now(),
          source,
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
      .replace(/[^A-Z]/g, "")
      .replace("FX:", "")
      .replace("OANDA:", "")
      .replace("C:", "")
      .replace("_", "")
      .replace("/", "")
      .substring(0, 6); // Take first 6 characters for currency pairs
  }

  private checkCrossBrokerArbitrage(newPrice: ForexPrice): void {
    const symbol = newPrice.symbol;

    // Get all prices for this symbol from different providers
    const allPrices: ForexPrice[] = [];
    this.priceCache.forEach((price, key) => {
      if (
        key.startsWith(symbol + "_") &&
        Date.now() - price.timestamp < 30000
      ) {
        allPrices.push(price);
      }
    });

    if (allPrices.length >= 2) {
      // Find best buy and sell opportunities
      const bestBid = Math.max(...allPrices.map((p) => p.bid));
      const bestAsk = Math.min(...allPrices.map((p) => p.ask));
      const arbitrageSpread = bestBid - bestAsk;

      if (arbitrageSpread > 0.0003) {
        // 3 pips minimum profit
        const bidProvider = allPrices.find((p) => p.bid === bestBid);
        const askProvider = allPrices.find((p) => p.ask === bestAsk);

        console.log(`Arbitrage opportunity detected for ${symbol}:`);
        console.log(`  Buy from ${askProvider?.source} at ${bestAsk}`);
        console.log(`  Sell to ${bidProvider?.source} at ${bestBid}`);
        console.log(
          `  Potential profit: ${arbitrageSpread} (${(arbitrageSpread * 10000).toFixed(1)} pips)`,
        );

        this.emit("arbitrage_opportunity", {
          symbol,
          buyPrice: bestAsk,
          sellPrice: bestBid,
          profit: arbitrageSpread,
          buyProvider: askProvider?.source,
          sellProvider: bidProvider?.source,
        });
      }
    }
  }

  private sendHeartbeat(
    providerId: string,
    ws: WebSocket,
    config: ForexConnection,
  ): void {
    if (ws.readyState === WebSocket.OPEN) {
      switch (providerId) {
        case "tradingview":
          ws.send("2");
          break;
        case "finnhub":
          ws.send(JSON.stringify({ type: "ping" }));
          break;
        default:
          ws.ping();
          break;
      }
      config.lastPing = Date.now();
    }
  }

  private scheduleReconnection(
    providerId: string,
    config: ForexConnection,
  ): void {
    // Disable auto-reconnection for frequently failing providers
    const failingProviders = [
      "finnhub",
      "tradingview",
      "twelvedata",
      "polygon",
      "alphavantage",
    ];

    if (failingProviders.includes(providerId)) {
      console.log(
        `🔴 Auto-reconnection disabled for ${config.name} - provider requires authentication`,
      );
      this.emit("provider_failed", {
        providerId,
        provider: config.name,
        reason: "authentication_required",
      });
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
    }, 60000); // Try every 60 seconds (less frequent)

    this.reconnectIntervals.set(providerId, interval);
  }

  getCurrentPrices(): ForexPrice[] {
    const currentPrices: ForexPrice[] = [];
    const now = Date.now();

    this.priceCache.forEach((price) => {
      if (now - price.timestamp < 60000) {
        // Only prices from last minute
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
      if (
        key.startsWith(normalizedSymbol + "_") &&
        price.timestamp > latestTimestamp
      ) {
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
        symbols: config.symbols.length,
      };
    });

    return status;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async stopAllConnections(): Promise<void> {
    console.log("Stopping all forex connections...");
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

    console.log("All forex connections stopped");
  }
}

export const realForexWebSocketManager = new RealForexWebSocketManager();
