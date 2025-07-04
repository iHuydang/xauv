import express from "express";
import { tradermadeIntegration } from "./tradermade-integration";
import { exnessDealingDeskSystem } from "./exness-dealing-desk";
import { liquidityScanner } from "./liquidity-scanner";

const router = express.Router();

// Get real-time market data from Tradermade
router.get("/tradermade/prices", async (req, res) => {
  try {
    const prices = tradermadeIntegration.getAllPrices();
    const status = tradermadeIntegration.getDealingDeskStatus();

    res.json({
      success: true,
      data: {
        prices,
        connection_status: status,
        total_instruments: prices.length,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get market prices",
    });
  }
});

// Get specific instrument price
router.get("/tradermade/price/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = tradermadeIntegration.getCurrentPrice(symbol.toUpperCase());

    if (price) {
      res.json({
        success: true,
        data: price,
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Symbol not found or no recent data",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get symbol price",
    });
  }
});

// Execute dealing desk order
router.post("/tradermade/dealing-desk/order", async (req, res) => {
  try {
    const { symbol, side, volume } = req.body;

    if (!symbol || !side || !volume) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: symbol, side, volume",
      });
    }

    const orderId = await tradermadeIntegration.executeDealingDeskOrder(
      symbol.toUpperCase(),
      side,
      parseFloat(volume),
    );

    res.json({
      success: true,
      data: {
        order_id: orderId,
        symbol: symbol.toUpperCase(),
        side,
        volume: parseFloat(volume),
        message: "Dealing desk order executed with market manipulation",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to execute dealing desk order",
    });
  }
});

// Get active liquidity orders
router.get("/tradermade/liquidity/orders", async (req, res) => {
  try {
    const orders = tradermadeIntegration.getActiveLiquidityOrders();

    res.json({
      success: true,
      data: {
        orders,
        total_orders: orders.length,
        accounts_used: ["405691964", "205251387"],
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get liquidity orders",
    });
  }
});

// Execute liquidity sweep
router.post("/tradermade/liquidity/sweep", async (req, res) => {
  try {
    const { symbol, force_sweep = false } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: "Symbol parameter is required",
      });
    }

    const price = tradermadeIntegration.getCurrentPrice(symbol.toUpperCase());
    if (!price) {
      return res.status(404).json({
        success: false,
        error: "No price data available for symbol",
      });
    }

    // Force liquidity sweep regardless of spread conditions
    if (force_sweep) {
      await tradermadeIntegration.executeLiquiditySweep(
        symbol.toUpperCase(),
        price.bid,
        price.ask,
      );

      res.json({
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          action: "forced_liquidity_sweep",
          price: price.mid,
          spread: price.spread * 10000,
          message: "Forced liquidity sweep executed using both Exness accounts",
        },
      });
    } else {
      // Check natural conditions
      const spreadPips = price.spread * 10000;
      if (spreadPips > 3.0) {
        await tradermadeIntegration.executeLiquiditySweep(
          symbol.toUpperCase(),
          price.bid,
          price.ask,
        );

        res.json({
          success: true,
          data: {
            symbol: symbol.toUpperCase(),
            action: "natural_liquidity_sweep",
            spread_pips: spreadPips.toFixed(1),
            message: "Liquidity sweep triggered by wide spread",
          },
        });
      } else {
        res.json({
          success: false,
          message: "Spread too tight for natural liquidity sweep",
          data: {
            current_spread: spreadPips.toFixed(1),
            required_spread: "3.0",
            suggestion: "Use force_sweep=true to override",
          },
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to execute liquidity sweep",
    });
  }
});

// Get gold market data for SJC attacks
router.get("/tradermade/gold/analysis", async (req, res) => {
  try {
    const goldPrice = tradermadeIntegration.getCurrentPrice("XAUUSD");

    if (!goldPrice) {
      return res.status(404).json({
        success: false,
        error: "Gold price data not available",
      });
    }

    // Calculate Vietnam gold equivalent
    const vietnamGoldPrice = goldPrice.mid * 31.1035 * 24500; // USD/oz to VND/tael
    const priceDeviation = Math.abs(goldPrice.mid - 2000) / 2000;

    res.json({
      success: true,
      data: {
        international: {
          price_usd: goldPrice.mid,
          bid: goldPrice.bid,
          ask: goldPrice.ask,
          spread_cents: (goldPrice.spread * 100).toFixed(1),
        },
        vietnam_equivalent: {
          price_vnd: Math.round(vietnamGoldPrice),
          formatted: vietnamGoldPrice.toLocaleString("vi-VN") + " VND/tael",
        },
        attack_analysis: {
          price_deviation: (priceDeviation * 100).toFixed(2) + "%",
          attack_feasibility:
            priceDeviation > 0.05
              ? "high"
              : priceDeviation > 0.02
                ? "medium"
                : "low",
          recommended_action:
            priceDeviation > 0.05 ? "strong_attack" : "monitor",
          sjc_opportunity: priceDeviation > 0.02,
        },
        timestamp: goldPrice.timestamp,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to analyze gold market",
    });
  }
});

// Execute coordinated gold attack
router.post("/tradermade/gold/attack", async (req, res) => {
  try {
    const { attack_type = "moderate", target_deviation = 0.03 } = req.body;

    const goldPrice = tradermadeIntegration.getCurrentPrice("XAUUSD");
    if (!goldPrice) {
      return res.status(404).json({
        success: false,
        error: "Gold price data not available",
      });
    }

    const vietnamGoldPrice = goldPrice.mid * 31.1035 * 24500;
    const currentDeviation = Math.abs(goldPrice.mid - 2000) / 2000;

    if (currentDeviation >= target_deviation || attack_type === "forced") {
      // Trigger coordinated attack
      const attackSignal = {
        international_price: goldPrice.mid,
        vietnam_price: vietnamGoldPrice,
        deviation: currentDeviation,
        recommendation:
          attack_type === "strong" || currentDeviation > 0.05
            ? "strong_attack"
            : "moderate_attack",
      };

      tradermadeIntegration.emit("sjc_attack_signal", attackSignal);

      res.json({
        success: true,
        data: {
          attack_type,
          gold_price: goldPrice.mid,
          deviation: (currentDeviation * 100).toFixed(2) + "%",
          vietnam_equivalent: Math.round(vietnamGoldPrice),
          accounts_used: ["405691964", "205251387"],
          expected_impact: "High liquidity pressure on international gold",
          message: "Coordinated gold attack initiated",
        },
      });
    } else {
      res.json({
        success: false,
        message: "Conditions not optimal for gold attack",
        data: {
          current_deviation: (currentDeviation * 100).toFixed(2) + "%",
          required_deviation: (target_deviation * 100).toFixed(1) + "%",
          gold_price: goldPrice.mid,
          suggestion:
            "Wait for higher price deviation or use attack_type=forced",
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to execute gold attack",
    });
  }
});

// Get dealing desk system status
router.get("/tradermade/system/status", async (req, res) => {
  try {
    const tradermadeStatus = tradermadeIntegration.getDealingDeskStatus();
    const exnessStatus = exnessDealingDeskSystem.getDealingDeskStatus();
    const liquidityOrders = tradermadeIntegration.getActiveLiquidityOrders();

    res.json({
      success: true,
      data: {
        tradermade: {
          connected: tradermadeStatus.connected,
          instruments_tracked: tradermadeStatus.tracked_instruments,
          api_status: "State Bank of Vietnam authorized",
        },
        exness_dealing_desk: {
          primary_socket: exnessStatus.primarySocketConnected,
          secondary_socket: exnessStatus.secondarySocketConnected,
          accounts: exnessStatus.activeAccountsCount,
          manipulation_enabled: exnessStatus.marketManipulationEnabled,
        },
        liquidity_operations: {
          active_orders: liquidityOrders.length,
          order_types: liquidityOrders.reduce(
            (acc, order) => {
              acc[order.purpose] = (acc[order.purpose] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
        integration_status: "Fully operational with real-time coordination",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get system status",
    });
  }
});

// Execute SJC Vietnam gold attack integration
router.post("/tradermade/sjc/coordinate-attack", async (req, res) => {
  try {
    const { intensity = "medium", duration_minutes = 30 } = req.body;

    const goldPrice = tradermadeIntegration.getCurrentPrice("XAUUSD");
    if (!goldPrice) {
      return res.status(404).json({
        success: false,
        error: "Gold price data required for SJC coordination",
      });
    }

    // Coordinate with existing SJC attack systems
    const attackParams = {
      international_gold_price: goldPrice.mid,
      attack_intensity: intensity,
      duration: duration_minutes,
      exness_accounts: ["405691964", "205251387"],
      coordination_mode: "tradermade_integrated",
    };

    // Trigger SJC liquidity scanner with international data
    const scanResult = await liquidityScanner.scanSJCLiquidity();

    res.json({
      success: true,
      data: {
        attack_coordinated: true,
        international_gold: goldPrice.mid,
        sjc_scan_result: scanResult,
        attack_parameters: attackParams,
        expected_outcome:
          "Coordinated pressure on Vietnam gold market using international liquidity",
        message: "SJC attack coordinated with Tradermade real-time data",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to coordinate SJC attack",
    });
  }
});

// Test market manipulation
router.post("/tradermade/test/manipulation", async (req, res) => {
  try {
    const { symbol, direction, strength = "medium" } = req.body;

    if (!symbol || !direction) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters: symbol, direction (up/down)",
      });
    }

    const price = tradermadeIntegration.getCurrentPrice(symbol.toUpperCase());
    if (!price) {
      return res.status(404).json({
        success: false,
        error: "Symbol price data not available",
      });
    }

    // Calculate manipulation parameters
    const baseManipulation =
      strength === "strong" ? 0.0005 : strength === "medium" ? 0.0003 : 0.0001;
    const manipulationPips = baseManipulation * 10000;

    // Test order execution
    const testOrder = {
      symbol: symbol.toUpperCase(),
      side: direction === "up" ? "buy" : "sell",
      volume: 0.05,
      manipulation_strength: baseManipulation,
      test_mode: true,
    };

    res.json({
      success: true,
      data: {
        test_order: testOrder,
        current_price: price.mid,
        expected_movement: `${direction === "up" ? "+" : "-"}${manipulationPips.toFixed(1)} pips`,
        accounts_simulated: ["405691964", "205251387"],
        reverse_timing: "30 seconds for absorption",
        message: "Market manipulation test configured (simulation mode)",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to test manipulation",
    });
  }
});

export default router;
