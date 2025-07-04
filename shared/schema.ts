import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  decimal,
  timestamp,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("10000.00"),
  equity: decimal("equity", { precision: 15, scale: 2 }).notNull().default("10000.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const symbols = pgTable("symbols", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  bid: decimal("bid", { precision: 10, scale: 5 }).notNull(),
  ask: decimal("ask", { precision: 10, scale: 5 }).notNull(),
  change: decimal("change", { precision: 10, scale: 5 }).notNull().default("0"),
  changePercent: decimal("change_percent", { precision: 10, scale: 5 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy' or 'sell'
  volume: decimal("volume", { precision: 10, scale: 2 }).notNull(),
  openPrice: decimal("open_price", { precision: 10, scale: 5 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 5 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }),
  pnl: decimal("pnl", { precision: 15, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("open"), // 'open', 'closed'
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy', 'sell'
  orderType: text("order_type").notNull().default("market"), // 'market', 'limit', 'stop'
  volume: decimal("volume", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 5 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }),
  status: text("status").notNull().default("pending"), // 'pending', 'executed', 'cancelled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  executedAt: timestamp("executed_at"),
});

// Replit Auth schemas
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  balance: true,
  equity: true,
});

export const insertSymbolSchema = createInsertSchema(symbols).omit({
  id: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  currentPrice: true,
  pnl: true,
  openedAt: true,
  closedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  status: true,
  createdAt: true,
  executedAt: true,
});

// Types for Replit Auth
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Symbol = typeof symbols.$inferSelect;
export type InsertSymbol = z.infer<typeof insertSymbolSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
