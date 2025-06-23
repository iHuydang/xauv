import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertOrderSchema, insertPositionSchema } from "@shared/schema";
import { z } from "zod";
import newsRoutes from "./news-routes";
import { forexNewsChecker } from "./forex-news-checker";
import { tradingSignalAnalyzer } from "./trading-signals";
import { brokerIntegration } from "./broker-integration";
import { accountManager } from "./account-manager";
import { signalProcessor } from "./signal-processor";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Register news routes
  app.use(newsRoutes);

  // WebSocket news command endpoint
  app.post("/api/websocket/news", async (req, res) => {
    try {
      const { command, ...data } = req.body;
      
      // Broadcast to WebSocket clients
      const message = {
        command: command || 'curl_news_post',
        ...data,
        source: 'HTTP API',
        timestamp: new Date().toISOString()
      };

      // Send to account manager WebSocket handler
      if (accountManager.newsClients && accountManager.newsClients.size > 0) {
        accountManager.broadcastToNewsClients({
          type: 'api_command',
          data: message
        });

        res.json({
          success: true,
          message: 'Command sent to WebSocket clients',
          clients_notified: accountManager.newsClients.size,
          command: command
        });
      } else {
        // Handle directly if no WebSocket clients
        await accountManager.handleNewsWebSocketMessage(message, null);
        
        res.json({
          success: true,
          message: 'Command processed directly',
          command: command
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to process WebSocket news command',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get WebSocket server info
  app.get("/api/websocket/info", async (req, res) => {
    try {
      const info = accountManager.getNewsWebSocketInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get WebSocket info'
      });
    }
  });

  // Start automatic forex news checking
  forexNewsChecker.startAutoCheck(10); // Check every 10 minutes

  // Initialize signal tracking for Exness accounts
  setTimeout(async () => {
    await accountManager.initializeSignalTracking();
    console.log('🎯 High-impact signal tracking system activated!');
  }, 3000); // Start after 3 seconds

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

  // Forex News Checker APIs
  app.get("/api/forex-news", async (req, res) => {
    try {
      const news = await forexNewsChecker.checkAllSources();
      res.json(news);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forex news" });
    }
  });

  app.get("/api/trading-signals", async (req, res) => {
    try {
      const signals = await tradingSignalAnalyzer.analyzeForexSignals();
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading signals" });
    }
  });

  app.get("/api/broker-accounts", async (req, res) => {
    try {
      const accounts = [];
      const brokers = ['MetaTrader5', 'Exness', 'FTMO', 'TradingView'];
      
      for (const broker of brokers) {
        try {
          const account = await brokerIntegration.getAccountInfo(broker);
          accounts.push(account);
        } catch (error) {
          console.error(`Failed to get account info for ${broker}:`, error);
        }
      }
      
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch broker accounts" });
    }
  });

  app.post("/api/broker-connect", async (req, res) => {
    try {
      const { broker, credentials } = req.body;
      const connected = await brokerIntegration.connectToBroker(broker, credentials);
      res.json({ success: connected, broker });
    } catch (error) {
      res.status(500).json({ error: "Failed to connect to broker" });
    }
  });

  // Account Manager endpoints
  app.get("/api/trading-accounts", async (req, res) => {
    try {
      const accounts = accountManager.getAllAccounts();
      // Remove sensitive data before sending
      const safeAccounts = accounts.map(acc => ({
        ...acc,
        credentials: undefined
      }));
      res.json(safeAccounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading accounts" });
    }
  });

  app.post("/api/trading-accounts/:id/connect", async (req, res) => {
    try {
      const { id } = req.params;
      const { password, investorPassword } = req.body;
      
      const connected = await accountManager.connectAccount(id, password, investorPassword);
      res.json({ success: connected });
    } catch (error) {
      res.status(500).json({ error: "Failed to connect trading account" });
    }
  });

  app.get("/api/trading-accounts/:id/sync", async (req, res) => {
    try {
      const { id } = req.params;
      const account = await accountManager.syncAccountData(id);
      
      if (account) {
        res.json({
          ...account,
          credentials: undefined // Remove sensitive data
        });
      } else {
        res.status(404).json({ error: "Account not found or inactive" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to sync account data" });
    }
  });

  app.get("/api/trading-accounts/:id/market-scan-safety", async (req, res) => {
    try {
      const { id } = req.params;
      const safety = await accountManager.checkMarketScanSafety(id);
      res.json(safety);
    } catch (error) {
      res.status(500).json({ error: "Failed to check market scan safety" });
    }
  });

  // Advanced SJC Pressure Attack endpoint
  app.post("/api/attack/sjc-pressure", async (req, res) => {
    try {
      const { 
        intensity = 'HIGH'
      } = req.body;

      const { quickAttackSystem } = await import('./quick-attack-system.js');
      
      console.log(`🚨 INITIATING SJC PRESSURE ATTACK`);
      console.log(`⚔️ Intensity: ${intensity}`);

      const attackResult = await quickAttackSystem.executeSJCPressureAttack(intensity);

      res.json({
        success: true,
        message: 'SJC Pressure Attack completed successfully',
        ...attackResult
      });

    } catch (error) {
      res.status(500).json({
        error: 'SJC Pressure Attack failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get available attack vectors
  app.get("/api/attack/vectors", async (req, res) => {
    try {
      const { quickAttackSystem } = await import('./quick-attack-system.js');
      const vectors = quickAttackSystem.getAvailableVectors();
      res.json({ vectors });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attack vectors" });
    }
  });

  // Get active attacks status
  app.get("/api/attack/status", async (req, res) => {
    try {
      const { quickAttackSystem } = await import('./quick-attack-system.js');
      const activeAttacks = quickAttackSystem.getActiveAttacks();
      res.json({ activeAttacks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attack status" });
    }
  });

  // Quick liquidity scan test endpoint
  app.get("/api/attack/test-scan", async (req, res) => {
    try {
      const { quickAttackSystem } = await import('./quick-attack-system.js');
      const results = await quickAttackSystem.scanLiquidityTargets();
      
      // Analyze SJC vulnerability
      const sjcData = results.find((r: any) => r.source === 'SJC');
      let vulnerability = 'NONE';
      
      if (sjcData) {
        const spreadRatio = sjcData.spreadPercent;
        if (spreadRatio > 1.5 && sjcData.liquidityLevel === 'low') {
          vulnerability = 'HIGH';
        } else if (spreadRatio > 1.0 || sjcData.liquidityLevel === 'low') {
          vulnerability = 'MEDIUM';
        }
      }
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        results,
        analysis: {
          sjcVulnerability: vulnerability,
          recommendedAction: vulnerability === 'HIGH' ? 'IMMEDIATE_ATTACK' : 
                           vulnerability === 'MEDIUM' ? 'CAUTIOUS_ATTACK' : 'MONITOR_ONLY',
          attackVector: vulnerability === 'HIGH' ? 'HIGH_FREQUENCY_PRESSURE' : 'STEALTH_MICRO_PRESSURE'
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Scan test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // FRED-Gold Attack System endpoints
  app.get("/api/fred-gold/indicators", async (req, res) => {
    try {
      const { fredGoldAttackSystem } = await import('./fred-gold-attack-system.js');
      
      // Fetch current FRED data
      const indicators = ['FEDFUNDS', 'DGS10', 'CPIAUCSL', 'DTWEXBGS', 'UNRATE'];
      const fredData = [];
      
      for (const indicator of indicators) {
        const data = await fredGoldAttackSystem.fetchFredData(indicator);
        if (data) fredData.push(data);
      }
      
      res.json({
        success: true,
        indicators: fredData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch FRED indicators',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/fred-gold/market-analysis", async (req, res) => {
    try {
      const { fredGoldAttackSystem } = await import('./fred-gold-attack-system.js');
      const marketData = await fredGoldAttackSystem.analyzeMarketConditions();
      
      res.json({
        success: true,
        marketData,
        analysis: {
          arbitrageOpportunity: marketData.arbitrageGap > 1500000 ? 'HIGH' : 
                              marketData.arbitrageGap > 800000 ? 'MEDIUM' : 'LOW',
          volatilityLevel: marketData.volatility > 3 ? 'HIGH' : 
                          marketData.volatility > 2 ? 'MEDIUM' : 'LOW',
          recommendedAction: marketData.volatility > 3 && marketData.arbitrageGap > 1500000 ? 
                           'IMMEDIATE_ATTACK' : 'MONITOR'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to analyze market conditions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/fred-gold/attack", async (req, res) => {
    try {
      const { strategy = 'FED_RATE_IMPACT' } = req.body;
      const { fredGoldAttackSystem } = await import('./fred-gold-attack-system.js');
      
      console.log(`🚨 INITIATING FRED-GOLD ATTACK`);
      console.log(`⚔️ Strategy: ${strategy}`);

      const attackResult = await fredGoldAttackSystem.executeFredBasedAttack(strategy);

      res.json({
        success: true,
        message: 'FRED-Gold attack completed successfully',
        ...attackResult
      });

    } catch (error) {
      res.status(500).json({
        error: 'FRED-Gold attack failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/fred-gold/strategies", async (req, res) => {
    try {
      const { fredGoldAttackSystem } = await import('./fred-gold-attack-system.js');
      const strategies = fredGoldAttackSystem.getAttackStrategies();
      res.json({ success: true, strategies });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FRED-Gold strategies" });
    }
  });

  app.post("/api/fred-gold/auto-monitor", async (req, res) => {
    try {
      const { action, intervalMinutes = 15 } = req.body;
      const { fredGoldAttackSystem } = await import('./fred-gold-attack-system.js');
      
      if (action === 'start') {
        fredGoldAttackSystem.startAutomaticFredMonitoring(intervalMinutes);
        res.json({
          success: true,
          message: `Bắt đầu giám sát FRED tự động (${intervalMinutes} phút)`
        });
      } else {
        res.json({
          success: true,
          message: 'FRED monitoring control'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to control FRED monitoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced liquidity scanning endpoint
  app.get("/api/liquidity/scan", async (req, res) => {
    try {
      const { liquidityScanner } = await import('./liquidity-scanner.js');
      const results = await liquidityScanner.scanAllTargets();
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        results,
        summary: {
          totalTargets: results.length,
          highLiquidity: results.filter((r: any) => r.liquidityLevel === 'high').length,
          mediumLiquidity: results.filter((r: any) => r.liquidityLevel === 'medium').length,
          lowLiquidity: results.filter((r: any) => r.liquidityLevel === 'low').length,
          favorableSignals: results.filter((r: any) => r.botSignal === 'favorable').length
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Liquidity scan failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // World Gold Price API endpoints
  app.get("/api/world-gold/price", async (req, res) => {
    try {
      const { worldGoldScanner } = await import('./world-gold-scanner.js');
      const goldData = await worldGoldScanner.scanWorldGoldPrice();
      
      if (goldData) {
        res.json({
          success: true,
          data: goldData,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          error: 'Unable to fetch world gold price',
          message: 'Không thể lấy giá vàng thế giới'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'World gold price fetch failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/world-gold/barchart", async (req, res) => {
    try {
      const { worldGoldScanner } = await import('./world-gold-scanner.js');
      const barchartData = await worldGoldScanner.scanBarchartData();
      
      res.json({
        success: true,
        data: barchartData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Barchart data fetch failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/world-gold/attack", async (req, res) => {
    try {
      const { vector = 'SPOT_PRESSURE' } = req.body;
      const { worldGoldScanner } = await import('./world-gold-scanner.js');
      
      const attackResult = await worldGoldScanner.executeLiquidityAttack(vector);
      
      res.json({
        success: true,
        message: 'Tấn công thanh khoản vàng thế giới hoàn thành',
        data: attackResult
      });
    } catch (error) {
      res.status(500).json({
        error: 'World gold attack failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/world-gold/analyze", async (req, res) => {
    try {
      const { worldGoldScanner } = await import('./world-gold-scanner.js');
      const goldData = await worldGoldScanner.scanWorldGoldPrice();
      
      if (goldData) {
        const analysis = worldGoldScanner.analyzeLiquidityOpportunity(goldData);
        res.json({
          success: true,
          goldData,
          analysis,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          error: 'Unable to analyze - no gold data available'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Gold analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/world-gold/vectors", async (req, res) => {
    try {
      const { worldGoldScanner } = await import('./world-gold-scanner.js');
      const vectors = worldGoldScanner.getAttackVectors();
      res.json({ success: true, vectors });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch world gold attack vectors" });
    }
  });

  app.get("/api/world-gold/attacks", async (req, res) => {
    try {
      const { worldGoldScanner } = await import('./world-gold-scanner.js');
      const attacks = worldGoldScanner.getActiveAttacks();
      res.json({ success: true, attacks });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active world gold attacks" });
    }
  });

  app.post("/api/world-gold/monitor", async (req, res) => {
    try {
      const { action, intervalSeconds = 60 } = req.body;
      const { worldGoldScanner } = await import('./world-gold-scanner.js');
      
      if (action === 'start') {
        worldGoldScanner.startContinuousScanning(intervalSeconds);
        res.json({
          success: true,
          message: `Bắt đầu giám sát vàng thế giới (${intervalSeconds}s)`
        });
      } else if (action === 'stop') {
        worldGoldScanner.stopScanning();
        res.json({
          success: true,
          message: 'Dừng giám sát vàng thế giới'
        });
      } else {
        res.status(400).json({
          error: 'Invalid action. Use "start" or "stop"'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to control world gold monitoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Telegram Bot endpoints
  app.post("/api/telegram/send-gold-update", async (req, res) => {
    try {
      const { telegramGoldBot } = await import('./telegram-gold-bot.js');
      const success = await telegramGoldBot.sendGoldPriceUpdate();
      
      if (success) {
        res.json({
          success: true,
          message: 'Cập nhật giá vàng đã được gửi qua Telegram'
        });
      } else {
        res.status(500).json({
          error: 'Failed to send Telegram update'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Telegram update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const { message } = req.body;
      if (message && message.text) {
        const { telegramGoldBot } = await import('./telegram-gold-bot.js');
        await telegramGoldBot.handleTelegramCommand(message.text, message.chat.id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  app.post("/api/telegram/configure", async (req, res) => {
    try {
      const { botToken, chatId, updateInterval } = req.body;
      const { telegramGoldBot } = await import('./telegram-gold-bot.js');
      
      telegramGoldBot.updateConfig({
        botToken,
        chatId,
        updateInterval
      });

      res.json({
        success: true,
        message: 'Cấu hình Telegram bot đã được cập nhật'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to configure Telegram bot',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/telegram/auto-updates", async (req, res) => {
    try {
      const { action } = req.body;
      const { telegramGoldBot } = await import('./telegram-gold-bot.js');
      
      if (action === 'start') {
        telegramGoldBot.startAutoUpdates();
        res.json({
          success: true,
          message: 'Đã bật cập nhật tự động Telegram'
        });
      } else if (action === 'stop') {
        telegramGoldBot.stopAutoUpdates();
        res.json({
          success: true,
          message: 'Đã tắt cập nhật tự động Telegram'
        });
      } else {
        res.status(400).json({
          error: 'Invalid action. Use "start" or "stop"'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to control Telegram auto-updates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/telegram/status", async (req, res) => {
    try {
      const { telegramGoldBot } = await import('./telegram-gold-bot.js');
      res.json({
        success: true,
        isAutoUpdating: telegramGoldBot.isAutoUpdating(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get Telegram status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Start/stop liquidity monitoring
  app.post("/api/liquidity/monitor", async (req, res) => {
    try {
      const { action, intervalSeconds = 30 } = req.body;
      const { liquidityScanner } = await import('./liquidity-scanner.js');
      
      if (action === 'start') {
        liquidityScanner.startMonitoring(intervalSeconds);
        res.json({
          success: true,
          message: `Liquidity monitoring started with ${intervalSeconds}s interval`
        });
      } else if (action === 'stop') {
        liquidityScanner.stopMonitoring();
        res.json({
          success: true,
          message: 'Liquidity monitoring stopped'
        });
      } else {
        res.status(400).json({
          error: 'Invalid action. Use "start" or "stop"'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to control liquidity monitoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Signal processing endpoints
  app.get("/api/market-signals", async (req, res) => {
    try {
      const signals = signalProcessor.getActiveSignals();
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market signals" });
    }
  });

  app.get("/api/signal-orders", async (req, res) => {
    try {
      const orders = signalProcessor.getExecutedOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signal orders" });
    }
  });

  app.post("/api/trading-accounts/:id/enable-signal-tracking", async (req, res) => {
    try {
      const { id } = req.params;
      const enabled = await accountManager.enableHighImpactSignalTracking(id);
      res.json({ success: enabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to enable signal tracking" });
    }
  });

  // SecBot Bypass Status endpoint
  app.get("/api/secbot/bypass-status", async (req, res) => {
    try {
      const status = await accountManager.getSecBotBypassStatus();
      res.json({
        success: true,
        ...status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch SecBot bypass status",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return httpServer;
}
