import WebSocket from "ws";
import { EventEmitter } from "events";

export interface XTBCredentials {
  userId: string;
  password: string;
  accountType: "demo" | "real";
}

export interface XTBMarketData {
  symbol: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  timestamp: number;
  volume?: number;
}

export interface XTBLoginResponse {
  status: boolean;
  streamSessionId?: string;
  returnData?: any;
}

export class XTBXAPIIntegration extends EventEmitter {
  private mainSocket: WebSocket | null = null;
  private streamSocket: WebSocket | null = null;
  private isLoggedIn: boolean = false;
  private streamSessionId: string | null = null;
  private credentials: XTBCredentials | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private requestId: number = 1;
  private marketData: Map<string, XTBMarketData> = new Map();

  // XTB API endpoints
  private readonly endpoints = {
    demo: {
      main: "wss://ws.xapi.pro/demo",
      stream: "wss://ws.xapi.pro/demoStream",
    },
    real: {
      main: "wss://ws.xapi.pro/real",
      stream: "wss://ws.xapi.pro/realStream",
    },
  };

  constructor() {
    super();
    this.setupHeartbeat();
  }

  async connect(credentials: XTBCredentials): Promise<boolean> {
    try {
      this.credentials = credentials;
      console.log(`🔗 Connecting to XTB xAPI (${credentials.accountType})...`);

      const endpoint = this.endpoints[credentials.accountType];

      // Connect to main socket
      this.mainSocket = new WebSocket(endpoint.main, {
        headers: {
          "User-Agent": "XTB-Scanner/1.0",
          Accept: "application/json",
        },
      });

      this.setupMainSocketHandlers();

      return new Promise((resolve) => {
        this.mainSocket!.on("open", async () => {
          console.log("✅ XTB main socket connected");
          const loginSuccess = await this.login();
          resolve(loginSuccess);
        });

        this.mainSocket!.on("error", (error) => {
          console.error("❌ XTB main socket error:", error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error("❌ XTB connection failed:", error);
      return false;
    }
  }

  private setupMainSocketHandlers(): void {
    if (!this.mainSocket) return;

    this.mainSocket.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMainSocketMessage(message);
      } catch (error) {
        console.error("❌ XTB message parse error:", error);
      }
    });

    this.mainSocket.on("close", () => {
      console.log("🔄 XTB main socket disconnected");
      this.isLoggedIn = false;
      this.attemptReconnect();
    });

    this.mainSocket.on("error", (error) => {
      console.error("❌ XTB main socket error:", error);
    });
  }

  private async login(): Promise<boolean> {
    if (!this.mainSocket || !this.credentials) return false;

    const loginCommand = {
      command: "login",
      arguments: {
        userId: this.credentials.userId,
        password: this.credentials.password,
      },
    };

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 10000);

      this.once("loginResponse", (response: XTBLoginResponse) => {
        clearTimeout(timeout);
        if (response.status) {
          this.isLoggedIn = true;
          this.streamSessionId = response.streamSessionId || null;
          console.log("✅ XTB login successful");
          this.connectStreamSocket();
          resolve(true);
        } else {
          console.error("❌ XTB login failed:", response);
          resolve(false);
        }
      });

      this.sendCommand(loginCommand);
    });
  }

  private connectStreamSocket(): void {
    if (!this.credentials || !this.streamSessionId) return;

    const endpoint = this.endpoints[this.credentials.accountType];

    this.streamSocket = new WebSocket(endpoint.stream, {
      headers: {
        "User-Agent": "XTB-Scanner/1.0",
      },
    });

    this.streamSocket.on("open", () => {
      console.log("✅ XTB stream socket connected");
      this.subscribeToSymbols([
        "EURUSD",
        "GBPUSD",
        "USDJPY",
        "XAUUSD",
        "USDCAD",
        "AUDUSD",
      ]);
    });

    this.streamSocket.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleStreamMessage(message);
      } catch (error) {
        console.error("❌ XTB stream message parse error:", error);
      }
    });

    this.streamSocket.on("close", () => {
      console.log("🔄 XTB stream socket disconnected");
    });

    this.streamSocket.on("error", (error) => {
      console.error("❌ XTB stream socket error:", error);
    });
  }

  private subscribeToSymbols(symbols: string[]): void {
    for (const symbol of symbols) {
      const subscribeCommand = {
        command: "getTickPrices",
        streamSessionId: this.streamSessionId,
        symbol: symbol,
      };

      if (this.streamSocket?.readyState === WebSocket.OPEN) {
        this.streamSocket.send(JSON.stringify(subscribeCommand));
        console.log(`📊 Subscribed to ${symbol} tick prices`);
      }
    }
  }

  private handleMainSocketMessage(message: any): void {
    if (message.status !== undefined) {
      // Login response
      this.emit("loginResponse", {
        status: message.status,
        streamSessionId: message.streamSessionId,
        returnData: message.returnData,
      });
    } else if (message.returnData) {
      // Other command responses
      this.emit("commandResponse", message);
    }
  }

  private handleStreamMessage(message: any): void {
    if (message.command === "tickPrices") {
      const data = message.data;
      const marketData: XTBMarketData = {
        symbol: data.symbol,
        bid: data.bid,
        ask: data.ask,
        high: data.high,
        low: data.low,
        timestamp: data.timestamp,
        volume: data.volume,
      };

      this.marketData.set(data.symbol, marketData);
      this.emit("marketData", marketData);

      // Emit specific gold data for integration with existing scanners
      if (data.symbol === "XAUUSD") {
        this.emit("goldPrice", {
          price: (data.bid + data.ask) / 2,
          bid: data.bid,
          ask: data.ask,
          source: "XTB_xAPI",
          timestamp: data.timestamp,
        });
      }
    }
  }

  private sendCommand(command: any): void {
    if (this.mainSocket?.readyState === WebSocket.OPEN) {
      this.mainSocket.send(JSON.stringify(command));
    }
  }

  async getSymbolInfo(symbol: string): Promise<any> {
    return new Promise((resolve) => {
      const command = {
        command: "getSymbol",
        arguments: {
          symbol: symbol,
        },
      };

      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      this.once("commandResponse", (response) => {
        clearTimeout(timeout);
        resolve(response.returnData);
      });

      this.sendCommand(command);
    });
  }

  async getCurrentPrices(
    symbols: string[],
  ): Promise<Map<string, XTBMarketData>> {
    const prices = new Map<string, XTBMarketData>();

    for (const symbol of symbols) {
      const data = this.marketData.get(symbol);
      if (data) {
        prices.set(symbol, data);
      }
    }

    return prices;
  }

  getGoldPrice(): XTBMarketData | null {
    return this.marketData.get("XAUUSD") || null;
  }

  private setupHeartbeat(): void {
    setInterval(() => {
      if (this.isLoggedIn && this.mainSocket?.readyState === WebSocket.OPEN) {
        const pingCommand = {
          command: "ping",
        };
        this.sendCommand(pingCommand);
      }
    }, 30000); // Ping every 30 seconds
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ XTB max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 XTB reconnecting... attempt ${this.reconnectAttempts}`);

    setTimeout(() => {
      if (this.credentials) {
        this.connect(this.credentials);
      }
    }, 5000 * this.reconnectAttempts);
  }

  async getAllSymbols(): Promise<any[]> {
    return new Promise((resolve) => {
      const command = {
        command: "getAllSymbols",
      };

      const timeout = setTimeout(() => {
        resolve([]);
      }, 10000);

      this.once("commandResponse", (response) => {
        clearTimeout(timeout);
        resolve(response.returnData || []);
      });

      this.sendCommand(command);
    });
  }

  disconnect(): void {
    console.log("🔌 Disconnecting from XTB xAPI...");

    if (this.mainSocket) {
      this.mainSocket.close();
      this.mainSocket = null;
    }

    if (this.streamSocket) {
      this.streamSocket.close();
      this.streamSocket = null;
    }

    this.isLoggedIn = false;
    this.streamSessionId = null;
    this.reconnectAttempts = 0;
  }

  getConnectionStatus(): any {
    return {
      isConnected: this.isLoggedIn,
      mainSocketState: this.mainSocket?.readyState,
      streamSocketState: this.streamSocket?.readyState,
      reconnectAttempts: this.reconnectAttempts,
      marketDataCount: this.marketData.size,
      availableSymbols: Array.from(this.marketData.keys()),
    };
  }
}

export const xtbIntegration = new XTBXAPIIntegration();
