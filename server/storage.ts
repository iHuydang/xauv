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
      { symbol: "XAUUSD", name: "Gold vs US Dollar", bid: "2032.45", ask: "2032.69", change: "2.84", changePercent: "0.14" },
      { symbol: "EURUSD", name: "Euro vs US Dollar", bid: "1.0734", ask: "1.0736", change: "-0.0009", changePercent: "-0.08" },
      { symbol: "GBPUSD", name: "British Pound vs US Dollar", bid: "1.2543", ask: "1.2545", change: "0.0019", changePercent: "0.15" },
      { symbol: "USDJPY", name: "US Dollar vs Japanese Yen", bid: "149.72", ask: "149.74", change: "0.00", changePercent: "0.00" },
      { symbol: "BTCUSD", name: "Bitcoin vs US Dollar", bid: "43287.50", ask: "43312.50", change: "985.23", changePercent: "2.34" },
    ];

    defaultSymbols.forEach((symbolData, index) => {
      const symbol: Symbol = {
        id: index + 1,
        symbol: symbolData.symbol,
        name: symbolData.name,
        bid: symbolData.bid,
        ask: symbolData.ask,
        change: symbolData.change,
        changePercent: symbolData.changePercent,
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
