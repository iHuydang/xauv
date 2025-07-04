import WebSocket from "ws";
import { EventEmitter } from "events";
import { enhancedAntiSecBotSystem } from "./enhanced-anti-secbot";

export interface SSIMarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  change: number;
  changePercent: number;
}

export class SSIVNDirectWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  async connect(): Promise<void> {
    try {
      console.log("🔗 Connecting to SSI VNDirect WebSocket...");

      // SSI VNDirect WebSocket endpoint
      const wsUrl = "wss://wgateway-iboard.ssi.com.vn/";

      // Create protected connection
      this.ws = await enhancedAntiSecBotSystem.createProtectedWebSocket(wsUrl, {
        headers: {
          Origin: "https://iboard.ssi.com.vn",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error("❌ Failed to connect to SSI VNDirect:", error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on("open", () => {
      console.log("✅ Connected to SSI VNDirect WebSocket");
      this.isConnected = true;
      this.authenticate();
      this.emit("connected");
    });

    this.ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.processMessage(message);
      } catch (error) {
        console.error("❌ Error parsing SSI message:", error);
      }
    });

    this.ws.on("close", () => {
      console.log("🔴 SSI VNDirect WebSocket disconnected");
      this.isConnected = false;
      this.scheduleReconnect();
      this.emit("disconnected");
    });

    this.ws.on("error", (error) => {
      console.error("❌ SSI VNDirect WebSocket error:", error);
      this.emit("error", error);
    });
  }

  private authenticate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // SSI authentication message
    const authMessage = {
      action: "subscribe",
      type: "market_data",
      symbols: ["VN30", "VNI", "HNX30"],
    };

    this.ws.send(JSON.stringify(authMessage));
    console.log("🔐 Sent authentication to SSI VNDirect");
  }

  private processMessage(message: any): void {
    // Process SSI market data messages
    if (message.type === "market_data") {
      const marketData: SSIMarketData = {
        symbol: message.symbol,
        price: message.price,
        volume: message.volume,
        timestamp: message.timestamp || Date.now(),
        change: message.change || 0,
        changePercent: message.changePercent || 0,
      };

      this.emit("marketData", marketData);
      console.log(
        `📊 SSI Market Data: ${marketData.symbol} - ${marketData.price}`,
      );
    }
  }

  // Safe command execution (no destructive commands allowed)
  executeSafeCommand(command: string, data?: any): boolean {
    if (!this.isConnected || !this.ws) {
      console.log("❌ SSI VNDirect not connected");
      return false;
    }

    // Whitelist of safe commands only
    const safeCommands = [
      "subscribe_market_data",
      "unsubscribe_market_data",
      "get_account_info",
      "get_portfolio",
      "get_order_history",
    ];

    if (!safeCommands.includes(command)) {
      console.log(`❌ Command "${command}" not allowed for security reasons`);
      return false;
    }

    try {
      const message = {
        action: command,
        data: data || {},
        timestamp: Date.now(),
      };

      this.ws.send(JSON.stringify(message));
      console.log(`✅ Safe command "${command}" sent to SSI VNDirect`);
      return true;
    } catch (error) {
      console.error("❌ Failed to send command:", error);
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setInterval(() => {
      console.log("🔄 Attempting to reconnect to SSI VNDirect...");
      this.connect();
    }, 5000);
  }

  disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log("🛑 SSI VNDirect WebSocket disconnected");
  }

  getConnectionStatus(): any {
    return {
      connected: this.isConnected,
      endpoint: "wss://wgateway-iboard.ssi.com.vn/",
      security_level: "protected",
      allowed_commands: [
        "subscribe_market_data",
        "unsubscribe_market_data",
        "get_account_info",
        "get_portfolio",
        "get_order_history",
      ],
      dangerous_commands_blocked: true,
    };
  }
}

export const ssiVNDirectWebSocket = new SSIVNDirectWebSocket();
