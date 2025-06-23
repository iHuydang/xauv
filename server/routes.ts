import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertOrderSchema, insertPositionSchema } from "@shared/schema";
import { z } from "zod";
import newsRoutes from "./news-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Register news routes
  app.use(newsRoutes);

  // Create WebSocket server for real-time price updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected WebSocket clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });
  });

  // Broadcast price updates to all connected clients
  function broadcastPriceUpdate(priceData: any) {
    const message = JSON.stringify({ type: 'priceUpdate', data: priceData });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Simulate real-time price updates
  setInterval(async () => {
    const symbols = await storage.getSymbols();
    const priceUpdates: any = {};

    for (const symbol of symbols) {
      // Generate realistic price fluctuations
      const currentBid = parseFloat(symbol.bid);
      const volatility = symbol.symbol === 'BTCUSD' ? 100 : (symbol.symbol === 'XAUUSD' ? 2 : 0.0005);
      const change = (Math.random() - 0.5) * volatility * 0.1;
      
      const newBid = Math.max(0.00001, currentBid + change);
      const spread = symbol.symbol === 'BTCUSD' ? 25 : (symbol.symbol === 'XAUUSD' ? 0.24 : 0.0002);
      const newAsk = newBid + spread;
      
      const priceChange = newBid - currentBid;
      const changePercent = (priceChange / currentBid) * 100;

      await storage.updateSymbolPrice(
        symbol.symbol,
        newBid.toFixed(symbol.symbol === 'USDJPY' ? 2 : (symbol.symbol === 'BTCUSD' ? 2 : 5)),
        newAsk.toFixed(symbol.symbol === 'USDJPY' ? 2 : (symbol.symbol === 'BTCUSD' ? 2 : 5)),
        priceChange.toFixed(5),
        changePercent.toFixed(2)
      );

      priceUpdates[symbol.symbol] = {
        bid: newBid.toFixed(symbol.symbol === 'USDJPY' ? 2 : (symbol.symbol === 'BTCUSD' ? 2 : 5)),
        ask: newAsk.toFixed(symbol.symbol === 'USDJPY' ? 2 : (symbol.symbol === 'BTCUSD' ? 2 : 5)),
        change: priceChange.toFixed(5),
        changePercent: changePercent.toFixed(2)
      };
    }

    broadcastPriceUpdate(priceUpdates);
  }, 1000);

  // API Routes
  app.get("/api/symbols", async (req, res) => {
    try {
      const symbols = await storage.getSymbols();
      res.json(symbols);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch symbols" });
    }
  });

  app.get("/api/positions", async (req, res) => {
    try {
      // For demo purposes, using userId = 1
      const positions = await storage.getPositions(1);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      // For demo purposes, using userId = 1
      const orders = await storage.getOrders(1);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // API endpoint to manually update symbol prices
  app.put("/api/symbols/:symbol/price", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { bid, ask } = req.body;
      
      if (!bid || !ask) {
        return res.status(400).json({ error: "Bid and ask prices are required" });
      }

      const currentSymbol = await storage.getSymbol(symbol);
      if (!currentSymbol) {
        return res.status(404).json({ error: "Symbol not found" });
      }

      const currentBid = parseFloat(currentSymbol.bid);
      const newBid = parseFloat(bid);
      const priceChange = newBid - currentBid;
      const changePercent = currentBid > 0 ? (priceChange / currentBid) * 100 : 0;

      await storage.updateSymbolPrice(
        symbol,
        bid,
        ask,
        priceChange.toFixed(5),
        changePercent.toFixed(2)
      );

      // Broadcast the price update to all connected clients
      const priceUpdate = {
        [symbol]: {
          bid,
          ask,
          change: priceChange.toFixed(5),
          changePercent: changePercent.toFixed(2)
        }
      };
      
      broadcastPriceUpdate(priceUpdate);
      
      res.json({ success: true, message: "Price updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      // For demo purposes, using userId = 1
      const order = await storage.createOrder({ ...orderData, userId: 1 });
      
      // For market orders, immediately execute them
      if (orderData.orderType === "market") {
        const symbol = await storage.getSymbol(orderData.symbol);
        if (symbol) {
          const executionPrice = orderData.type === "buy" ? parseFloat(symbol.ask) : parseFloat(symbol.bid);
          
          // Create position
          const position = await storage.createPosition({
            userId: 1,
            symbol: orderData.symbol,
            type: orderData.type,
            volume: orderData.volume,
            openPrice: executionPrice.toString(),
            stopLoss: orderData.stopLoss,
            takeProfit: orderData.takeProfit,
          });
          
          // Mark order as executed
          await storage.updateOrderStatus(order.id, "executed", new Date());
          
          res.json({ order, position });
        } else {
          res.status(400).json({ error: "Symbol not found" });
        }
      } else {
        res.json(order);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.post("/api/positions/:id/close", async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      await storage.closePosition(positionId, new Date());
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to close position" });
    }
  });

  app.get("/api/account", async (req, res) => {
    try {
      // For demo purposes, return mock account data
      const positions = await storage.getPositions(1);
      let totalPnL = 0;
      
      for (const position of positions) {
        totalPnL += parseFloat(position.pnl);
      }
      
      const balance = 10247.83;
      const equity = balance + totalPnL;
      const usedMargin = positions.length * 203.25; // Simplified margin calculation
      const freeMargin = equity - usedMargin;
      const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;
      
      res.json({
        balance: balance.toFixed(2),
        equity: equity.toFixed(2),
        pnl: totalPnL.toFixed(2),
        usedMargin: usedMargin.toFixed(2),
        freeMargin: freeMargin.toFixed(2),
        marginLevel: marginLevel.toFixed(1)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account data" });
    }
  });

  return httpServer;
}
