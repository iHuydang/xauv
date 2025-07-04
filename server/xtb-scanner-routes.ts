import { Router } from "express";
import { xtbIntegration } from "./xtb-xapi-integration.js";

const router = Router();

// Connect to XTB xAPI
router.post("/api/xtb/connect", async (req, res) => {
  try {
    const { userId, password, accountType = "demo" } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing credentials",
      });
    }

    const success = await xtbIntegration.connect({
      userId,
      password,
      accountType,
    });

    res.json({
      success,
      message: success ? "Connected to XTB xAPI" : "Failed to connect",
      accountType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get XTB connection status
router.get("/api/xtb/status", (req, res) => {
  try {
    const status = xtbIntegration.getConnectionStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get current gold price from XTB
router.get("/api/xtb/gold-price", (req, res) => {
  try {
    const goldData = xtbIntegration.getGoldPrice();

    if (!goldData) {
      return res.status(404).json({
        success: false,
        error: "No gold price data available",
      });
    }

    res.json({
      success: true,
      data: {
        symbol: goldData.symbol,
        price: (goldData.bid + goldData.ask) / 2,
        bid: goldData.bid,
        ask: goldData.ask,
        spread: goldData.ask - goldData.bid,
        timestamp: goldData.timestamp,
        source: "XTB_xAPI",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get current prices for multiple symbols
router.get("/api/xtb/prices", async (req, res) => {
  try {
    const { symbols } = req.query;
    const symbolList = symbols
      ? symbols.toString().split(",")
      : ["XAUUSD", "EURUSD", "GBPUSD"];

    const prices = await xtbIntegration.getCurrentPrices(symbolList);
    const priceData = Array.from(prices.entries()).map(([symbol, data]) => ({
      symbol,
      price: (data.bid + data.ask) / 2,
      bid: data.bid,
      ask: data.ask,
      spread: data.ask - data.bid,
      high: data.high,
      low: data.low,
      timestamp: data.timestamp,
    }));

    res.json({
      success: true,
      data: priceData,
      count: priceData.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get symbol information
router.get("/api/xtb/symbol/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const symbolInfo = await xtbIntegration.getSymbolInfo(symbol);

    if (!symbolInfo) {
      return res.status(404).json({
        success: false,
        error: "Symbol not found",
      });
    }

    res.json({
      success: true,
      data: symbolInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all available symbols
router.get("/api/xtb/symbols", async (req, res) => {
  try {
    const symbols = await xtbIntegration.getAllSymbols();

    // Filter for forex and commodity symbols
    const relevantSymbols = symbols.filter(
      (symbol) =>
        symbol.categoryName === "FX" ||
        symbol.categoryName === "CMD" ||
        symbol.symbol.includes("XAU") ||
        symbol.symbol.includes("USD"),
    );

    res.json({
      success: true,
      data: relevantSymbols,
      total: symbols.length,
      filtered: relevantSymbols.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Disconnect from XTB
router.post("/api/xtb/disconnect", (req, res) => {
  try {
    xtbIntegration.disconnect();
    res.json({
      success: true,
      message: "Disconnected from XTB xAPI",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Enhanced liquidity scan using XTB data
router.get("/api/xtb/liquidity-scan", async (req, res) => {
  try {
    const { symbol = "XAUUSD", range_min, range_max } = req.query;

    const marketData = xtbIntegration.getGoldPrice();
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: "No market data available",
      });
    }

    const currentPrice = (marketData.bid + marketData.ask) / 2;
    const spread = marketData.ask - marketData.bid;

    // Analyze liquidity based on spread and price levels
    const liquidityAnalysis = {
      currentPrice,
      bid: marketData.bid,
      ask: marketData.ask,
      spread,
      spreadPercent: ((spread / currentPrice) * 100).toFixed(4),
      liquidityScore: spread < 0.5 ? "HIGH" : spread < 1.0 ? "MEDIUM" : "LOW",
      timestamp: marketData.timestamp,
      source: "XTB_xAPI",
    };

    // Range analysis if provided
    if (range_min && range_max) {
      const minPrice = parseFloat(range_min.toString());
      const maxPrice = parseFloat(range_max.toString());

      liquidityAnalysis["rangeAnalysis"] = {
        min: minPrice,
        max: maxPrice,
        inRange: currentPrice >= minPrice && currentPrice <= maxPrice,
        distanceFromMin:
          (((currentPrice - minPrice) / minPrice) * 100).toFixed(2) + "%",
        distanceFromMax:
          (((maxPrice - currentPrice) / maxPrice) * 100).toFixed(2) + "%",
        positionInRange:
          (((currentPrice - minPrice) / (maxPrice - minPrice)) * 100).toFixed(
            1,
          ) + "%",
      };
    }

    res.json({
      success: true,
      data: liquidityAnalysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
