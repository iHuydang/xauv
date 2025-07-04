import {
  users,
  symbols,
  positions,
  orders,
  type User,
  type UpsertUser,
  type Symbol,
  type InsertSymbol,
  type Position,
  type InsertPosition,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserBalance(
    userId: string,
    balance: string,
    equity: string,
  ): Promise<void>;

  // Symbol methods
  getSymbols(): Promise<Symbol[]>;
  getSymbol(symbol: string): Promise<Symbol | undefined>;
  updateSymbolPrice(
    symbol: string,
    bid: string,
    ask: string,
    change: string,
    changePercent: string,
  ): Promise<void>;
  createSymbol(symbol: InsertSymbol): Promise<Symbol>;

  // Position methods
  getPositions(userId: string): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, currentPrice: string, pnl: string): Promise<void>;
  closePosition(id: number, closedAt: Date): Promise<void>;

  // Order methods
  getOrders(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(
    id: number,
    status: string,
    executedAt?: Date,
  ): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default symbols on first run
    this.initializeDefaultSymbols();
  }

  private async initializeDefaultSymbols() {
    const defaultSymbols = [
      // Forex Major Pairs
      {
        symbol: "EURUSD",
        name: "Euro vs US Dollar",
        bid: "1.08520",
        ask: "1.08535",
      },
      {
        symbol: "GBPUSD",
        name: "British Pound vs US Dollar",
        bid: "1.27485",
        ask: "1.27500",
      },
      {
        symbol: "USDJPY",
        name: "US Dollar vs Japanese Yen",
        bid: "148.205",
        ask: "148.225",
      },
      {
        symbol: "USDCHF",
        name: "US Dollar vs Swiss Franc",
        bid: "0.87325",
        ask: "0.87340",
      },
      {
        symbol: "AUDUSD",
        name: "Australian Dollar vs US Dollar",
        bid: "0.66485",
        ask: "0.66500",
      },
      {
        symbol: "USDCAD",
        name: "US Dollar vs Canadian Dollar",
        bid: "1.35720",
        ask: "1.35735",
      },
      {
        symbol: "NZDUSD",
        name: "New Zealand Dollar vs US Dollar",
        bid: "0.61250",
        ask: "0.61265",
      },

      // Forex Minor Pairs
      {
        symbol: "EURJPY",
        name: "Euro vs Japanese Yen",
        bid: "160.845",
        ask: "160.875",
      },
      {
        symbol: "GBPJPY",
        name: "British Pound vs Japanese Yen",
        bid: "188.925",
        ask: "188.965",
      },
      {
        symbol: "EURGBP",
        name: "Euro vs British Pound",
        bid: "0.85125",
        ask: "0.85145",
      },
      {
        symbol: "AUDCAD",
        name: "Australian Dollar vs Canadian Dollar",
        bid: "0.90245",
        ask: "0.90265",
      },
      {
        symbol: "EURCHF",
        name: "Euro vs Swiss Franc",
        bid: "0.94785",
        ask: "0.94805",
      },

      // Precious Metals
      {
        symbol: "XAUUSD",
        name: "Gold vs US Dollar",
        bid: "2685.50",
        ask: "2686.00",
      },
      {
        symbol: "XAGUSD",
        name: "Silver vs US Dollar",
        bid: "30.245",
        ask: "30.285",
      },
      {
        symbol: "XPTUSD",
        name: "Platinum vs US Dollar",
        bid: "965.80",
        ask: "968.20",
      },
      {
        symbol: "XPDUSD",
        name: "Palladium vs US Dollar",
        bid: "985.50",
        ask: "988.50",
      },

      // Oil & Energy
      { symbol: "USOIL", name: "US Crude Oil", bid: "68.425", ask: "68.485" },
      { symbol: "UKOIL", name: "UK Brent Oil", bid: "72.650", ask: "72.710" },

      // Indices
      {
        symbol: "US30",
        name: "Dow Jones Industrial Average",
        bid: "44285.5",
        ask: "44295.5",
      },
      { symbol: "US500", name: "S&P 500", bid: "5998.2", ask: "6002.8" },
      { symbol: "NAS100", name: "NASDAQ 100", bid: "20845.3", ask: "20855.7" },
      { symbol: "GER40", name: "DAX 40", bid: "19425.8", ask: "19435.2" },
      { symbol: "UK100", name: "FTSE 100", bid: "8245.6", ask: "8250.4" },
      { symbol: "JPN225", name: "Nikkei 225", bid: "39385.2", ask: "39395.8" },

      // Cryptocurrencies
      {
        symbol: "BTCUSD",
        name: "Bitcoin vs US Dollar",
        bid: "94250.5",
        ask: "94285.5",
      },
      {
        symbol: "ETHUSD",
        name: "Ethereum vs US Dollar",
        bid: "3485.25",
        ask: "3488.75",
      },
      {
        symbol: "ADAUSD",
        name: "Cardano vs US Dollar",
        bid: "1.0845",
        ask: "1.0865",
      },
      {
        symbol: "SOLUSD",
        name: "Solana vs US Dollar",
        bid: "238.45",
        ask: "238.85",
      },
    ];

    try {
      // Check if symbols already exist
      const existingSymbols = await db.select().from(symbols).limit(1);
      if (existingSymbols.length > 0) {
        return; // Symbols already initialized
      }

      // Insert default symbols
      for (const symbolData of defaultSymbols) {
        await db
          .insert(symbols)
          .values({
            symbol: symbolData.symbol,
            name: symbolData.name,
            bid: symbolData.bid,
            ask: symbolData.ask,
            change: (Math.random() * 2 - 1).toFixed(5),
            changePercent: (Math.random() * 4 - 2).toFixed(2),
          })
          .onConflictDoNothing();
      }
    } catch (error) {
      console.error("Error initializing default symbols:", error);
    }
  }

  // User methods for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserBalance(
    userId: string,
    balance: string,
    equity: string,
  ): Promise<void> {
    await db
      .update(users)
      .set({ balance, equity, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Symbol methods
  async getSymbols(): Promise<Symbol[]> {
    return await db.select().from(symbols);
  }

  async getSymbol(symbol: string): Promise<Symbol | undefined> {
    const [symbolData] = await db
      .select()
      .from(symbols)
      .where(eq(symbols.symbol, symbol));
    return symbolData || undefined;
  }

  async updateSymbolPrice(
    symbol: string,
    bid: string,
    ask: string,
    change: string,
    changePercent: string,
  ): Promise<void> {
    await db
      .update(symbols)
      .set({
        bid,
        ask,
        change,
        changePercent,
        updatedAt: new Date(),
      })
      .where(eq(symbols.symbol, symbol));
  }

  async createSymbol(insertSymbol: InsertSymbol): Promise<Symbol> {
    const [symbol] = await db
      .insert(symbols)
      .values({
        ...insertSymbol,
        change: insertSymbol.change || "0",
        changePercent: insertSymbol.changePercent || "0",
      })
      .returning();
    return symbol;
  }

  // Position methods
  async getPositions(userId: string): Promise<Position[]> {
    return await db
      .select()
      .from(positions)
      .where(eq(positions.userId, userId));
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values({
        ...insertPosition,
        currentPrice: insertPosition.openPrice,
        pnl: "0.00",
        status: "open",
      })
      .returning();
    return position;
  }

  async updatePosition(
    id: number,
    currentPrice: string,
    pnl: string,
  ): Promise<void> {
    await db
      .update(positions)
      .set({ currentPrice, pnl })
      .where(eq(positions.id, id));
  }

  async closePosition(id: number, closedAt: Date): Promise<void> {
    await db
      .update(positions)
      .set({ status: "closed", closedAt })
      .where(eq(positions.id, id));
  }

  // Order methods
  async getOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        ...insertOrder,
        status: "pending",
      })
      .returning();
    return order;
  }

  async updateOrderStatus(
    id: number,
    status: string,
    executedAt?: Date,
  ): Promise<void> {
    await db
      .update(orders)
      .set({ status, executedAt })
      .where(eq(orders.id, id));
  }
}

export const storage = new DatabaseStorage();
