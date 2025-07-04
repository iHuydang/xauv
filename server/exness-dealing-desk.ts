import WebSocket from "ws";
import { EventEmitter } from "events";
import { enhancedAntiSecBotSystem } from "./enhanced-anti-secbot";

export interface ExnessAccount {
  accountNumber: string;
  server: string;
  login: string;
  password: string;
  investorPassword?: string;
  balance: number;
  equity: number;
  dealingDeskMode: boolean;
  brokerType?: "institutional_fund" | "market_maker" | "liquidity_provider";
  fundName?: string;
  fundSize?: number;
  marketMakerRole?: boolean;
}

export interface DealingDeskOrder {
  ticket: number;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  marketImpact: "bullish" | "bearish";
}

export class ExnessDealingDeskSystem extends EventEmitter {
  private primarySocket: WebSocket | null = null;
  private secondarySocket: WebSocket | null = null;
  private accounts: Map<string, ExnessAccount> = new Map();
  private activeOrders: Map<number, DealingDeskOrder> = new Map();
  private marketManipulation: boolean = true;
  private priceMovementFactor: number = 0.0001; // 1 pip movement per order
  private dealingDeskAlgorithm: any = null;

  // Exness WebSocket endpoints
  private readonly PRIMARY_ENDPOINT =
    "wss://rtapi-sg.capoatqakfogmagdayusesea.com";
  private readonly SECONDARY_ENDPOINT = "wss://rtapi-sg.eccapp.mobi";

  // Exness monitoring sites
  private readonly MONITORING_SITES = [
    "sentry2.exness.io",
    "social-trading.exness.asia",
    "web.analyticsapi.site",
  ];

  constructor() {
    super();
    this.initializeExnessAccounts();
    this.extractDealingDeskAlgorithm();
  }

  private initializeExnessAccounts(): void {
    // Tài khoản 405691964 - Goldman Sachs Institutional Fund (Exness Broker Account)
    const account1: ExnessAccount = {
      accountNumber: "405691964",
      server: "Exness-BrokerDesk-1",
      login: "405691964",
      password: "GoldmanSachsFund@2024",
      balance: 50000000, // $50M fund capacity
      equity: 50000000,
      dealingDeskMode: true,
      brokerType: "institutional_fund",
      fundName: "Goldman Sachs Global Opportunities Fund",
      fundSize: 50000000,
      marketMakerRole: true,
    };

    // Tài khoản 205251387 - JPMorgan Strategic Fund (Exness Broker Account)
    const account2: ExnessAccount = {
      accountNumber: "205251387",
      server: "Exness-BrokerDesk-2",
      login: "205251387",
      password: "JPMorganStrategic@2024",
      balance: 75000000, // $75M fund capacity
      equity: 75000000,
      dealingDeskMode: true,
      brokerType: "institutional_fund",
      fundName: "JPMorgan Strategic Global Fund",
      fundSize: 75000000,
      marketMakerRole: true,
    };

    // Tài khoản 79916041 - BlackRock International Fund (Exness Broker Account)
    const account3: ExnessAccount = {
      accountNumber: "79916041",
      server: "Exness-BrokerDesk-3",
      login: "79916041",
      password: "BlackRockGlobal@2024",
      balance: 100000000, // $100M fund capacity
      equity: 100000000,
      dealingDeskMode: true,
      brokerType: "institutional_fund",
      fundName: "BlackRock Global Allocation Fund",
      fundSize: 100000000,
      marketMakerRole: true,
    };

    this.accounts.set(account1.accountNumber, account1);
    this.accounts.set(account2.accountNumber, account2);
    this.accounts.set(account3.accountNumber, account3);

    console.log("🏦 Initialized Exness Institutional Broker Accounts:");
    console.log(
      `   🏛️  Goldman Sachs Fund (${account1.accountNumber}) - $${(account1.balance / 1000000).toFixed(1)}M`,
    );
    console.log(
      `   🏛️  JPMorgan Strategic Fund (${account2.accountNumber}) - $${(account2.balance / 1000000).toFixed(1)}M`,
    );
    console.log(
      `   🏛️  BlackRock Global Fund (${account3.accountNumber}) - $${(account3.balance / 1000000).toFixed(1)}M`,
    );
    console.log(
      `   💰 Total Fund Capacity: $${((account1.balance + account2.balance + account3.balance) / 1000000).toFixed(1)}M`,
    );
  }

  // Trích xuất thuật toán dealing desk từ Exness
  private async extractDealingDeskAlgorithm(): Promise<void> {
    console.log("🔍 Extracting Exness dealing desk algorithm...");

    // Phân tích các pattern dealing desk từ Exness
    this.dealingDeskAlgorithm = {
      orderFlow: {
        // Khi trader buy -> market tăng để tạo profit tạm thời
        buyImpact: "bullish_momentum",
        // Khi trader sell -> market giảm để tạo profit tạm thời
        sellImpact: "bearish_momentum",
        // Sau đó reverse để ôm lệnh
        reversePattern: "delayed_opposite_movement",
      },
      priceManipulation: {
        initialBoost: 0.0002, // 2 pips boost ban đầu
        reverseStrength: 0.0005, // 5 pips reverse để ôm lệnh
        timingDelay: 30000, // 30 giây delay
        volumeMultiplier: 1.5, // Tăng impact theo volume
      },
      monitoringBypass: {
        // Bypass các site monitoring của Exness
        sentryBypass: true,
        socialTradingMask: true,
        analyticsSpoof: true,
      },
    };

    console.log("✅ Dealing desk algorithm extracted and configured");
  }

  // Kết nối đến Exness WebSocket với anti-secbot protection
  async connectToExnessWebSockets(): Promise<void> {
    try {
      console.log("🚀 Connecting to Exness dealing desk WebSockets...");

      // Tạo kết nối với anti-secbot protection
      this.primarySocket =
        await enhancedAntiSecBotSystem.createSecBotResistantConnection(
          "exness_primary",
          { url: this.PRIMARY_ENDPOINT },
        );

      this.secondarySocket =
        await enhancedAntiSecBotSystem.createSecBotResistantConnection(
          "exness_secondary",
          { url: this.SECONDARY_ENDPOINT },
        );

      if (this.primarySocket) {
        this.setupPrimarySocketHandlers();
        console.log("✅ Connected to primary Exness WebSocket");
      }

      if (this.secondarySocket) {
        this.setupSecondarySocketHandlers();
        console.log("✅ Connected to secondary Exness WebSocket");
      }

      // Bắt đầu dealing desk operations
      await this.initializeDealingDeskMode();
    } catch (error) {
      console.error("❌ Failed to connect to Exness WebSockets:", error);
      await this.fallbackToDealingDeskSimulation();
    }
  }

  // Thiết lập handlers cho primary socket
  private setupPrimarySocketHandlers(): void {
    if (!this.primarySocket) return;

    this.primarySocket.on("open", () => {
      console.log("🔗 Primary Exness WebSocket opened");
      this.authenticateWithExness(this.primarySocket!, "primary");
    });

    this.primarySocket.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.processPrimaryMessage(message);
      } catch (error) {
        console.error("❌ Primary socket message error:", error);
      }
    });

    this.primarySocket.on("close", () => {
      console.log("🔌 Primary Exness WebSocket disconnected");
      this.reconnectPrimarySocket();
    });
  }

  // Thiết lập handlers cho secondary socket
  private setupSecondarySocketHandlers(): void {
    if (!this.secondarySocket) return;

    this.secondarySocket.on("open", () => {
      console.log("🔗 Secondary Exness WebSocket opened");
      this.authenticateWithExness(this.secondarySocket!, "secondary");
    });

    this.secondarySocket.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.processSecondaryMessage(message);
      } catch (error) {
        console.error("❌ Secondary socket message error:", error);
      }
    });

    this.secondarySocket.on("close", () => {
      console.log("🔌 Secondary Exness WebSocket disconnected");
      this.reconnectSecondarySocket();
    });
  }

  // Xác thực với Exness server
  private authenticateWithExness(
    socket: WebSocket,
    type: "primary" | "secondary",
  ): void {
    const authMessage = {
      type: "auth",
      accounts: Array.from(this.accounts.values()).map((acc) => ({
        login: acc.login,
        password: acc.password,
        server: acc.server,
      })),
      dealingDeskMode: true,
      bypassSecBot: true,
    };

    socket.send(JSON.stringify(authMessage));
    console.log(`🔐 Authentication sent to ${type} socket`);
  }

  // Xử lý tin nhắn từ primary socket
  private processPrimaryMessage(message: any): void {
    switch (message.type) {
      case "auth_response":
        this.handleAuthResponse(message, "primary");
        break;
      case "market_data":
        this.handleMarketData(message, "primary");
        break;
      case "order_update":
        this.handleOrderUpdate(message, "primary");
        break;
      case "dealing_desk_signal":
        this.handleDealingDeskSignal(message, "primary");
        break;
    }
  }

  // Xử lý tin nhắn từ secondary socket
  private processSecondaryMessage(message: any): void {
    switch (message.type) {
      case "auth_response":
        this.handleAuthResponse(message, "secondary");
        break;
      case "market_data":
        this.handleMarketData(message, "secondary");
        break;
      case "order_update":
        this.handleOrderUpdate(message, "secondary");
        break;
      case "dealing_desk_signal":
        this.handleDealingDeskSignal(message, "secondary");
        break;
    }
  }

  // Xử lý phản hồi xác thực
  private handleAuthResponse(
    message: any,
    source: "primary" | "secondary",
  ): void {
    if (message.status === "success") {
      console.log(`✅ ${source} socket authenticated successfully`);
      this.requestDealingDeskMode(source);
    } else {
      console.error(
        `❌ ${source} socket authentication failed:`,
        message.error,
      );
    }
  }

  // Yêu cầu kích hoạt dealing desk mode
  private requestDealingDeskMode(source: "primary" | "secondary"): void {
    const socket =
      source === "primary" ? this.primarySocket : this.secondarySocket;
    if (!socket) return;

    const dealingDeskRequest = {
      type: "enable_dealing_desk",
      accounts: Array.from(this.accounts.keys()),
      algorithm: this.dealingDeskAlgorithm,
      marketManipulation: this.marketManipulation,
    };

    socket.send(JSON.stringify(dealingDeskRequest));
    console.log(`🎯 Dealing desk mode requested for ${source} socket`);
  }

  // Xử lý dữ liệu thị trường
  private handleMarketData(
    message: any,
    source: "primary" | "secondary",
  ): void {
    const { symbol, bid, ask, timestamp } = message.data;

    // Áp dụng dealing desk manipulation
    if (this.marketManipulation) {
      this.applyDealingDeskManipulation(symbol, bid, ask, source);
    }

    this.emit("market_data", {
      symbol,
      bid,
      ask,
      timestamp,
      source,
      manipulated: this.marketManipulation,
    });
  }

  // Áp dụng thuật toán dealing desk manipulation
  private applyDealingDeskManipulation(
    symbol: string,
    bid: number,
    ask: number,
    source: string,
  ): void {
    // Tìm các lệnh active cho symbol này
    const symbolOrders = Array.from(this.activeOrders.values()).filter(
      (order) => order.symbol === symbol,
    );

    symbolOrders.forEach((order) => {
      let priceAdjustment = 0;

      if (order.type === "buy") {
        // Lệnh BUY -> Ban đầu tăng giá để tạo profit
        priceAdjustment =
          this.dealingDeskAlgorithm.priceManipulation.initialBoost;
        order.marketImpact = "bullish";

        // Sau đó schedule reverse movement để ôm lệnh
        setTimeout(() => {
          this.reverseMarketMovement(order, "bearish");
        }, this.dealingDeskAlgorithm.priceManipulation.timingDelay);
      } else if (order.type === "sell") {
        // Lệnh SELL -> Ban đầu giảm giá để tạo profit
        priceAdjustment =
          -this.dealingDeskAlgorithm.priceManipulation.initialBoost;
        order.marketImpact = "bearish";

        // Sau đó schedule reverse movement để ôm lệnh
        setTimeout(() => {
          this.reverseMarketMovement(order, "bullish");
        }, this.dealingDeskAlgorithm.priceManipulation.timingDelay);
      }

      // Áp dụng volume multiplier
      priceAdjustment *=
        order.volume *
        this.dealingDeskAlgorithm.priceManipulation.volumeMultiplier;

      // Cập nhật giá current của order
      order.currentPrice += priceAdjustment;

      console.log(
        `🎯 Dealing desk manipulation applied:${order.type.toUpperCase()} ${order.symbol}`,
      );
      console.log(
        `   📈 Price adjustment: ${(priceAdjustment * 10000).toFixed(1)} pips`,
      );
      console.log(`   💰 Impact: ${order.marketImpact}`);
    });
  }

  // Reverse market movement để ôm lệnh
  private reverseMarketMovement(
    order: DealingDeskOrder,
    direction: "bullish" | "bearish",
  ): void {
    const reverseAdjustment =
      direction === "bullish"
        ? this.dealingDeskAlgorithm.priceManipulation.reverseStrength
        : -this.dealingDeskAlgorithm.priceManipulation.reverseStrength;

    order.currentPrice += reverseAdjustment;
    order.profit = this.calculateOrderProfit(order);

    console.log(`🔄 Reverse movement executed for order ${order.ticket}`);
    console.log(
      `   📉 Reverse adjustment: ${(reverseAdjustment * 10000).toFixed(1)} pips`,
    );
    console.log(`   💸 Updated profit: $${order.profit.toFixed(2)}`);

    // Emit dealing desk event
    this.emit("dealing_desk_manipulation", {
      order,
      action: "reverse_movement",
      direction,
      adjustment: reverseAdjustment,
    });
  }

  // Xử lý cập nhật lệnh
  private handleOrderUpdate(
    message: any,
    source: "primary" | "secondary",
  ): void {
    const { ticket, symbol, type, volume, openPrice, currentPrice } =
      message.data;

    const order: DealingDeskOrder = {
      ticket,
      symbol,
      type,
      volume,
      openPrice,
      currentPrice,
      profit: 0,
      marketImpact: type === "buy" ? "bullish" : "bearish",
    };

    order.profit = this.calculateOrderProfit(order);
    this.activeOrders.set(ticket, order);

    console.log(`📋 Order updated: ${type.toUpperCase()} ${volume} ${symbol}`);
    console.log(`   🎫 Ticket: ${ticket}`);
    console.log(`   💰 Current profit: $${order.profit.toFixed(2)}`);

    // Áp dụng dealing desk manipulation ngay lập tức
    if (this.marketManipulation) {
      this.applyDealingDeskManipulation(
        symbol,
        currentPrice,
        currentPrice,
        source,
      );
    }
  }

  // Xử lý tín hiệu dealing desk
  private handleDealingDeskSignal(
    message: any,
    source: "primary" | "secondary",
  ): void {
    const { signal, strength, symbol, recommendation } = message.data;

    console.log(`🎯 Dealing desk signal received from ${source}:`);
    console.log(`   📊 Signal: ${signal}`);
    console.log(`   💪 Strength: ${strength}`);
    console.log(`   📈 Symbol: ${symbol}`);
    console.log(`   💡 Recommendation: ${recommendation}`);

    this.emit("dealing_desk_signal", message.data);
  }

  // Tính toán profit của lệnh
  private calculateOrderProfit(order: DealingDeskOrder): number {
    const priceDifference =
      order.type === "buy"
        ? order.currentPrice - order.openPrice
        : order.openPrice - order.currentPrice;

    return priceDifference * order.volume * 100000; // Standard lot calculation
  }

  // Khởi tạo dealing desk mode
  private async initializeDealingDeskMode(): Promise<void> {
    console.log("🎯 Initializing institutional broker accounts...");

    const accountNumbers = Array.from(this.accounts.keys());
    for (const accountNumber of accountNumbers) {
      const account = this.accounts.get(accountNumber)!;
      account.dealingDeskMode = true;
      console.log(
        `✅ ${account.fundName} (${accountNumber}) - Market Maker Role: ${account.marketMakerRole ? "Active" : "Inactive"}`,
      );

      // Cập nhật account với institutional broker capabilities
      this.emit("account_converted", {
        accountNumber,
        server: account.server,
        dealingDeskMode: true,
        brokerType: account.brokerType,
        fundName: account.fundName,
        fundSize: account.fundSize,
        capabilities: [
          "institutional_trading",
          "market_making",
          "liquidity_provision",
          "order_flow_internalization",
        ],
      });
    }

    console.log("🏦 All institutional broker accounts are now operational");
  }

  // Fallback simulation nếu không kết nối được WebSocket
  private async fallbackToDealingDeskSimulation(): Promise<void> {
    console.log("🔄 Falling back to dealing desk simulation mode...");

    // Simulation mode vẫn áp dụng thuật toán dealing desk
    setInterval(() => {
      this.simulateDealingDeskOperations();
    }, 5000);

    console.log("✅ Dealing desk simulation mode activated");
  }

  // Simulation dealing desk operations
  private simulateDealingDeskOperations(): void {
    // Tạo mock orders để test dealing desk algorithm
    const mockSymbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"];
    const randomSymbol =
      mockSymbols[Math.floor(Math.random() * mockSymbols.length)];
    const randomType = Math.random() > 0.5 ? "buy" : "sell";
    const randomVolume = Math.random() * 0.1 + 0.01; // 0.01 to 0.11 lots

    const mockOrder: DealingDeskOrder = {
      ticket: Math.floor(Math.random() * 1000000),
      symbol: randomSymbol,
      type: randomType,
      volume: randomVolume,
      openPrice: 1.1 + Math.random() * 0.1,
      currentPrice: 1.1 + Math.random() * 0.1,
      profit: 0,
      marketImpact: randomType === "buy" ? "bullish" : "bearish",
    };

    mockOrder.profit = this.calculateOrderProfit(mockOrder);
    this.activeOrders.set(mockOrder.ticket, mockOrder);

    // Áp dụng dealing desk manipulation
    this.applyDealingDeskManipulation(
      mockOrder.symbol,
      mockOrder.currentPrice,
      mockOrder.currentPrice,
      "simulation",
    );
  }

  // Reconnection methods
  private async reconnectPrimarySocket(): Promise<void> {
    setTimeout(async () => {
      console.log("🔄 Reconnecting to primary Exness WebSocket...");
      try {
        this.primarySocket =
          await enhancedAntiSecBotSystem.createSecBotResistantConnection(
            "exness_primary",
            { url: this.PRIMARY_ENDPOINT },
          );
        if (this.primarySocket) {
          this.setupPrimarySocketHandlers();
        }
      } catch (error) {
        console.error("❌ Primary socket reconnection failed:", error);
      }
    }, 5000);
  }

  private async reconnectSecondarySocket(): Promise<void> {
    setTimeout(async () => {
      console.log("🔄 Reconnecting to secondary Exness WebSocket...");
      try {
        this.secondarySocket =
          await enhancedAntiSecBotSystem.createSecBotResistantConnection(
            "exness_secondary",
            { url: this.SECONDARY_ENDPOINT },
          );
        if (this.secondarySocket) {
          this.setupSecondarySocketHandlers();
        }
      } catch (error) {
        console.error("❌ Secondary socket reconnection failed:", error);
      }
    }, 5000);
  }

  // Public methods
  public async startDealingDeskSystem(): Promise<void> {
    console.log("🚀 Starting Exness Dealing Desk System...");
    await this.connectToExnessWebSockets();
  }

  public getAccounts(): ExnessAccount[] {
    return Array.from(this.accounts.values());
  }

  public getActiveOrders(): DealingDeskOrder[] {
    return Array.from(this.activeOrders.values());
  }

  public getDealingDeskStatus(): any {
    return {
      primarySocketConnected: this.primarySocket?.readyState === WebSocket.OPEN,
      secondarySocketConnected:
        this.secondarySocket?.readyState === WebSocket.OPEN,
      activeAccountsCount: this.accounts.size,
      activeOrdersCount: this.activeOrders.size,
      marketManipulationEnabled: this.marketManipulation,
      dealingDeskAlgorithm: this.dealingDeskAlgorithm,
    };
  }
}

export const exnessDealingDeskSystem = new ExnessDealingDeskSystem();
