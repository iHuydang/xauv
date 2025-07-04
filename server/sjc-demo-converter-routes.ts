import express from "express";
import { sjcDemoConverter } from "./sjc-demo-converter.js";

const router = express.Router();

// Get SJC Demo Converter status
router.get("/sjc-demo/status", async (req, res) => {
  try {
    const status = sjcDemoConverter.getAccountStatus();

    res.json({
      success: true,
      data: status,
      message: "SJC Demo Converter status retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get converter status",
    });
  }
});

// Get all conversions
router.get("/sjc-demo/conversions", async (req, res) => {
  try {
    const conversions = sjcDemoConverter.getConversions();

    res.json({
      success: true,
      data: {
        conversions,
        count: conversions.length,
        summary: {
          completed: conversions.filter((c) => c.status === "completed").length,
          converting: conversions.filter((c) => c.status === "converting")
            .length,
          failed: conversions.filter((c) => c.status === "failed").length,
          totalRealGold: conversions
            .filter((c) => c.status === "completed")
            .reduce((total, c) => total + c.sjcEquivalent.goldGrams, 0),
          totalValueVND: conversions
            .filter((c) => c.status === "completed")
            .reduce((total, c) => total + c.sjcEquivalent.totalValueVND, 0),
        },
      },
      message: "Conversions retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get conversions",
    });
  }
});

// Get specific conversion
router.get("/sjc-demo/conversions/:conversionId", async (req, res) => {
  try {
    const { conversionId } = req.params;
    const conversion = sjcDemoConverter.getConversionById(conversionId);

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: "Conversion not found",
      });
    }

    res.json({
      success: true,
      data: conversion,
      message: "Conversion details retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get conversion details",
    });
  }
});

// Simulate demo trade and convert to SJC gold
router.post("/sjc-demo/simulate-trade", async (req, res) => {
  try {
    const {
      symbol = "XAUUSD",
      type = "buy",
      volume = 0.1,
      openPrice,
      currentPrice,
      profit,
    } = req.body;

    const tradeParams = {
      symbol,
      type,
      volume,
      openPrice: openPrice || (symbol === "XAUUSD" ? 2650.5 : 85000),
      currentPrice: currentPrice || (symbol === "XAUUSD" ? 2652.75 : 85200),
      profit,
    };

    const conversionId = await sjcDemoConverter.simulateDemoTrade(tradeParams);

    res.json({
      success: true,
      data: {
        conversionId,
        tradeParams,
        message: "Demo trade simulated and conversion initiated",
      },
      message: "Demo trade converted to real SJC gold successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to simulate trade and convert",
    });
  }
});

// Update conversion rate
router.patch("/sjc-demo/conversion-rate", async (req, res) => {
  try {
    const { rate } = req.body;

    if (!rate || typeof rate !== "number") {
      return res.status(400).json({
        success: false,
        error: "Valid conversion rate is required (0-1)",
      });
    }

    sjcDemoConverter.updateConversionRate(rate);

    res.json({
      success: true,
      data: {
        newRate: rate,
        percentage: `${rate * 100}%`,
      },
      message: "Conversion rate updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to update conversion rate",
    });
  }
});

// Force convert existing demo trade
router.post("/sjc-demo/convert-trade", async (req, res) => {
  try {
    const { ticket, symbol, type, volume, openPrice, currentPrice, profit } =
      req.body;

    if (!ticket || !symbol || !type || !volume) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required trade parameters (ticket, symbol, type, volume)",
      });
    }

    const demoTrade = {
      ticket,
      symbol,
      type,
      volume,
      openPrice: openPrice || 0,
      currentPrice: currentPrice || openPrice || 0,
      profit: profit || 0,
      openTime: new Date(),
    };

    const conversionId =
      await sjcDemoConverter.convertDemoTradeToSJC(demoTrade);

    res.json({
      success: true,
      data: {
        conversionId,
        demoTrade,
      },
      message: "Demo trade converted to SJC gold successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to convert demo trade",
    });
  }
});

// Get conversion statistics
router.get("/sjc-demo/statistics", async (req, res) => {
  try {
    const status = sjcDemoConverter.getAccountStatus();
    const conversions = sjcDemoConverter.getConversions();

    // Calculate detailed statistics
    const stats = {
      account: {
        accountId: status.accountId,
        server: status.server,
        conversionRate: status.conversionRate,
        lastActivity: status.lastActivity,
      },
      conversions: {
        total: conversions.length,
        completed: conversions.filter((c) => c.status === "completed").length,
        converting: conversions.filter((c) => c.status === "converting").length,
        failed: conversions.filter((c) => c.status === "failed").length,
        successRate:
          conversions.length > 0
            ? (
                (conversions.filter((c) => c.status === "completed").length /
                  conversions.length) *
                100
              ).toFixed(2) + "%"
            : "0%",
      },
      realGold: {
        totalGrams: status.totalRealGoldGenerated,
        totalValueVND: status.totalValueVND,
        averagePerTrade:
          conversions.length > 0
            ? (
                status.totalRealGoldGenerated /
                conversions.filter((c) => c.status === "completed").length
              ).toFixed(2)
            : 0,
        goldTypes: {
          SJC_9999: conversions.filter(
            (c) =>
              c.status === "completed" &&
              c.sjcEquivalent.goldType === "SJC_9999",
          ).length,
          SJC_COIN: conversions.filter(
            (c) =>
              c.status === "completed" &&
              c.sjcEquivalent.goldType === "SJC_COIN",
          ).length,
          SJC_BAR: conversions.filter(
            (c) =>
              c.status === "completed" &&
              c.sjcEquivalent.goldType === "SJC_BAR",
          ).length,
        },
      },
      performance: {
        averageConversionTime:
          conversions
            .filter((c) => c.status === "completed" && c.completedAt)
            .reduce(
              (sum, c) =>
                sum + (c.completedAt!.getTime() - c.createdAt.getTime()),
              0,
            ) /
          Math.max(
            1,
            conversions.filter((c) => c.status === "completed").length,
          ),
        totalConversionsToday: conversions.filter(
          (c) => c.createdAt.toDateString() === new Date().toDateString(),
        ).length,
      },
    };

    res.json({
      success: true,
      data: stats,
      message: "Conversion statistics retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get conversion statistics",
    });
  }
});

export { router as sjcDemoConverterRoutes };
