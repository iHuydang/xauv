import { users, symbols, positions, orders, type User, type InsertUser, type Symbol, type InsertSymbol, type Position, type InsertPosition, type Order, type InsertOrder } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, balance: string, equity: string): Promise<void>;

  // Symbol methods
  getSymbols(): Promise<Symbol[]>;
  getSymbol(symbol: string): Promise<Symbol | undefined>;
  updateSymbolPrice(symbol: string, bid: string, ask: string, change: string, changePercent: string): Promise<void>;
  createSymbol(symbol: InsertSymbol): Promise<Symbol>;

  // Position methods
  getPositions(userId: number): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, currentPrice: string, pnl: string): Promise<void>;
  closePosition(id: number, closedAt: Date): Promise<void>;

  // Order methods
  getOrders(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, executedAt?: Date): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private symbols: Map<string, Symbol>;
  private positions: Map<number, Position>;
  private orders: Map<number, Order>;
  private currentUserId: number;
  private currentPositionId: number;
  private currentOrderId: number;

  constructor() {
    this.users = new Map();
    this.symbols = new Map();
    this.positions = new Map();
    this.orders = new Map();
    this.currentUserId = 1;
    this.currentPositionId = 1;
    this.currentOrderId = 1;

    // Initialize default symbols
    this.initializeDefaultSymbols();
  }

  private initializeDefaultSymbols() {
    const defaultSymbols = [
      // Forex Major Pairs
      { symbol: "EURUSD", name: "Euro vs US Dollar", bid: "1.08520", ask: "1.08535" },
      { symbol: "GBPUSD", name: "British Pound vs US Dollar", bid: "1.27485", ask: "1.27500" },
      { symbol: "USDJPY", name: "US Dollar vs Japanese Yen", bid: "148.205", ask: "148.225" },
      { symbol: "USDCHF", name: "US Dollar vs Swiss Franc", bid: "0.87325", ask: "0.87340" },
      { symbol: "AUDUSD", name: "Australian Dollar vs US Dollar", bid: "0.66485", ask: "0.66500" },
      { symbol: "USDCAD", name: "US Dollar vs Canadian Dollar", bid: "1.35720", ask: "1.35735" },
      { symbol: "NZDUSD", name: "New Zealand Dollar vs US Dollar", bid: "0.61250", ask: "0.61265" },
      
      // Forex Minor Pairs
      { symbol: "EURJPY", name: "Euro vs Japanese Yen", bid: "160.845", ask: "160.875" },
      { symbol: "GBPJPY", name: "British Pound vs Japanese Yen", bid: "188.925", ask: "188.965" },
      { symbol: "EURGBP", name: "Euro vs British Pound", bid: "0.85125", ask: "0.85145" },
      { symbol: "AUDCAD", name: "Australian Dollar vs Canadian Dollar", bid: "0.90245", ask: "0.90265" },
      { symbol: "EURCHF", name: "Euro vs Swiss Franc", bid: "0.94785", ask: "0.94805" },
      
      // Precious Metals
      { symbol: "XAUUSD", name: "Gold vs US Dollar", bid: "2685.50", ask: "2686.00" },
      { symbol: "XAGUSD", name: "Silver vs US Dollar", bid: "30.245", ask: "30.285" },
      { symbol: "XPTUSD", name: "Platinum vs US Dollar", bid: "965.80", ask: "968.20" },
      { symbol: "XPDUSD", name: "Palladium vs US Dollar", bid: "985.50", ask: "988.50" },
      
      // Oil & Energy
      { symbol: "USOIL", name: "US Crude Oil", bid: "68.425", ask: "68.485" },
      { symbol: "UKOIL", name: "UK Brent Oil", bid: "72.650", ask: "72.710" },
      
      // Indices
      { symbol: "US30", name: "Dow Jones Industrial Average", bid: "44285.5", ask: "44295.5" },
      { symbol: "US500", name: "S&P 500", bid: "5998.2", ask: "6002.8" },
      { symbol: "NAS100", name: "NASDAQ 100", bid: "20845.3", ask: "20855.7" },
      { symbol: "GER40", name: "DAX 40", bid: "19425.8", ask: "19435.2" },
      { symbol: "UK100", name: "FTSE 100", bid: "8245.6", ask: "8250.4" },
      { symbol: "JPN225", name: "Nikkei 225", bid: "39385.2", ask: "39395.8" },
      
      // Cryptocurrencies
      { symbol: "BTCUSD", name: "Bitcoin vs US Dollar", bid: "94250.5", ask: "94285.5" },
      { symbol: "ETHUSD", name: "Ethereum vs US Dollar", bid: "3485.25", ask: "3488.75" },
      { symbol: "ADAUSD", name: "Cardano vs US Dollar", bid: "1.0845", ask: "1.0865" },
      { symbol: "SOLUSD", name: "Solana vs US Dollar", bid: "238.45", ask: "238.85" },
    ];

    defaultSymbols.forEach((symbolData, index) => {
      const symbol: Symbol = {
        id: index + 1,
        symbol: symbolData.symbol,
        name: symbolData.name,
        bid: symbolData.bid,
        ask: symbolData.ask,
        change: (Math.random() * 2 - 1).toFixed(5), // Random change between -1 and 1
        changePercent: (Math.random() * 4 - 2).toFixed(2), // Random percentage between -2% and 2%
        updatedAt: new Date(),
      };
      this.symbols.set(symbolData.symbol, symbol);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      balance: "10000.00",
      equity: "10000.00",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, balance: string, equity: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = balance;
      user.equity = equity;
      this.users.set(userId, user);
    }
  }

  async getSymbols(): Promise<Symbol[]> {
    return Array.from(this.symbols.values());
  }

  async getSymbol(symbol: string): Promise<Symbol | undefined> {
    return this.symbols.get(symbol);
  }

  async updateSymbolPrice(symbol: string, bid: string, ask: string, change: string, changePercent: string): Promise<void> {
    const symbolData = this.symbols.get(symbol);
    if (symbolData) {
      symbolData.bid = bid;
      symbolData.ask = ask;
      symbolData.change = change;
      symbolData.changePercent = changePercent;
      symbolData.updatedAt = new Date();
      this.symbols.set(symbol, symbolData);
    }
  }

  async createSymbol(insertSymbol: InsertSymbol): Promise<Symbol> {
    const id = this.symbols.size + 1;
    const symbol: Symbol = {
      ...insertSymbol,
      id,
      change: insertSymbol.change || "0",
      changePercent: insertSymbol.changePercent || "0",
      updatedAt: new Date(),
    };
    this.symbols.set(insertSymbol.symbol, symbol);
    return symbol;
  }

  async getPositions(userId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(position => position.userId === userId && position.status === "open");
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const id = this.currentPositionId++;
    const position: Position = {
      ...insertPosition,
      id,
      currentPrice: insertPosition.openPrice,
      stopLoss: insertPosition.stopLoss || null,
      takeProfit: insertPosition.takeProfit || null,
      pnl: "0.00",
      status: "open",
      openedAt: new Date(),
      closedAt: null,
    };
    this.positions.set(id, position);
    return position;
  }

  async updatePosition(id: number, currentPrice: string, pnl: string): Promise<void> {
    const position = this.positions.get(id);
    if (position) {
      position.currentPrice = currentPrice;
      position.pnl = pnl;
      this.positions.set(id, position);
    }
  }

  async closePosition(id: number, closedAt: Date): Promise<void> {
    const position = this.positions.get(id);
    if (position) {
      position.status = "closed";
      position.closedAt = closedAt;
      this.positions.set(id, position);
    }
  }

  async getOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId && order.status === "pending");
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = {
      ...insertOrder,
      id,
      stopLoss: insertOrder.stopLoss || null,
      takeProfit: insertOrder.takeProfit || null,
      orderType: insertOrder.orderType || "market",
      price: insertOrder.price || null,
      status: "pending",
      createdAt: new Date(),
      executedAt: null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string, executedAt?: Date): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      if (executedAt) {
        order.executedAt = executedAt;
      }
      this.orders.set(id, order);
    }
  }
}

export const storage = new MemStorage();
