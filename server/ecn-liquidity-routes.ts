import express from "express";
import { demoToRealLiquidityConverter } from "./demo-to-real-liquidity-converter";
import { vietnamGoldTradingIntegration } from "./vietnam-gold-trading-integration";

const router = express.Router();

// Register demo order for potential conversion
router.post("/ecn/register-demo-order", async (req, res) => {
  try {
    const {
      orderId,
      symbol,
      side,
      volume,
      openPrice,
      currentPrice,
      profit,
      mt5Account,
    } = req.body;

    if (!orderId || !symbol || !side || !volume || profit === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
      });
    }

    const demoOrder = {
      orderId,
      symbol: symbol.toUpperCase(),
      side,
      volume: parseFloat(volume),
      openPrice: parseFloat(openPrice || 0),
      currentPrice: parseFloat(currentPrice || 0),
      profit: parseFloat(profit),
      mt5Account: mt5Account || "205307242",
      isDemoOrder: true,
    };

    demoToRealLiquidityConverter.registerDemoOrder(demoOrder);

    res.json({
      success: true,
      data: {
        demoOrder,
        message: "Demo order registered for liquidity conversion tracking",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to register demo order",
    });
  }
});

// Force convert demo profit to real SJC liquidity
router.post("/ecn/convert-profit", async (req, res) => {
  try {
    const { orderId, forceConversion = false } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const conversionId = await demoToRealLiquidityConverter.convertDemoProfit(
      orderId,
      forceConversion,
    );

    res.json({
      success: true,
      data: {
        conversionId,
        orderId,
        message: "Demo profit conversion initiated",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Conversion failed",
    });
  }
});

// Get ECN engine status
router.get("/ecn/status", (req, res) => {
  try {
    const status = demoToRealLiquidityConverter.getECNStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get ECN status",
    });
  }
});

// Get conversion history
router.get("/ecn/conversions", (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = demoToRealLiquidityConverter.getConversionHistory();

    // Sort by timestamp and limit results
    const sortedHistory = history
      .sort((a, b) => b.executionTimestamp - a.executionTimestamp)
      .slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        conversions: sortedHistory,
        total: history.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get conversion history",
    });
  }
});

// Update conversion rates
router.post("/ecn/update-rates", async (req, res) => {
  try {
    const {
      demoToRealMultiplier,
      minProfitThreshold,
      maxSingleConversion,
      ecnSpreadImpact,
    } = req.body;

    const rates: any = {};
    if (demoToRealMultiplier !== undefined)
      rates.demoToRealMultiplier = parseFloat(demoToRealMultiplier);
    if (minProfitThreshold !== undefined)
      rates.minProfitThreshold = parseInt(minProfitThreshold);
    if (maxSingleConversion !== undefined)
      rates.maxSingleConversion = parseInt(maxSingleConversion);
    if (ecnSpreadImpact !== undefined)
      rates.ecnSpreadImpact = parseFloat(ecnSpreadImpact);

    demoToRealLiquidityConverter.updateConversionRates(rates);

    res.json({
      success: true,
      data: {
        updatedRates: rates,
        message: "Conversion rates updated successfully",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update conversion rates",
    });
  }
});

// Emergency liquidity injection
router.post("/ecn/inject-liquidity", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required",
      });
    }

    await demoToRealLiquidityConverter.injectEmergencyLiquidity(
      parseInt(amount),
    );

    res.json({
      success: true,
      data: {
        injectedAmount: parseInt(amount),
        message: "Emergency liquidity injected successfully",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to inject liquidity",
    });
  }
});

// Simulate demo order with profit for testing
router.post("/ecn/simulate-demo-order", async (req, res) => {
  try {
    const { symbol = "XAUUSD", side = "buy", volume = 0.1, profit } = req.body;

    if (profit === undefined) {
      return res.status(400).json({
        success: false,
        error: "Profit parameter is required for simulation",
      });
    }

    const mockOrder = {
      orderId: `DEMO_SIM_${Date.now()}`,
      symbol: symbol.toUpperCase(),
      side,
      volume: parseFloat(volume),
      openPrice: 2000 + Math.random() * 100,
      currentPrice: 2000 + Math.random() * 100,
      profit: parseFloat(profit),
      mt5Account: "205307242",
      isDemoOrder: true,
    };

    demoToRealLiquidityConverter.registerDemoOrder(mockOrder);

    // If profitable, trigger conversion
    let conversionResult = null;
    if (mockOrder.profit > 50000) {
      try {
        const conversionId =
          await demoToRealLiquidityConverter.convertDemoProfit(
            mockOrder.orderId,
          );
        conversionResult = { conversionId, status: "conversion_triggered" };
      } catch (error) {
        conversionResult = {
          error: error instanceof Error ? error.message : "Conversion failed",
        };
      }
    }

    res.json({
      success: true,
      data: {
        simulatedOrder: mockOrder,
        conversion: conversionResult,
        message: "Demo order simulated and registered",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to simulate demo order",
    });
  }
});

export default router;
