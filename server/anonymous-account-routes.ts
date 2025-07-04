import express from "express";
import { anonymousAccountManager } from "./anonymous-account-manager.js";

const router = express.Router();

// Get anonymous accounts (limited information only)
router.get("/anonymous/accounts", async (req, res) => {
  try {
    const accounts = anonymousAccountManager.getAnonymousAccounts();

    res.json({
      success: true,
      data: {
        accounts,
        count: accounts.length,
        note: "Account balances and types are hidden for privacy",
      },
      message: "Anonymous accounts retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get anonymous accounts",
    });
  }
});

// Get public trades (only lot sizes visible)
router.get("/anonymous/trades", async (req, res) => {
  try {
    const trades = anonymousAccountManager.getPublicTrades();

    res.json({
      success: true,
      data: {
        trades,
        count: trades.length,
        note: "Profit/loss information is hidden. Only lot sizes are visible.",
      },
      message: "Public trade information retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get public trades",
    });
  }
});

// Get distribution summary (percentages only, no amounts)
router.get("/anonymous/distribution-summary", async (req, res) => {
  try {
    const summary = anonymousAccountManager.getDistributionSummary();

    res.json({
      success: true,
      data: {
        ...summary,
        note: "Only distribution percentages are shown. Actual amounts are confidential.",
      },
      message: "Distribution summary retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get distribution summary",
    });
  }
});

// Simulate anonymous trade
router.post("/anonymous/simulate-trade", async (req, res) => {
  try {
    const { symbol = "XAUUSD", lotSize = 0.1 } = req.body;

    const tradeId = anonymousAccountManager.simulateAnonymousTrade(
      symbol,
      lotSize,
    );

    res.json({
      success: true,
      data: {
        tradeId,
        symbol,
        lotSize,
        note: "Trade registered anonymously. Profit/loss will be distributed according to rules.",
      },
      message: "Anonymous trade simulated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to simulate anonymous trade",
    });
  }
});

// Update distribution rules (admin only)
router.patch("/anonymous/distribution-rules", async (req, res) => {
  try {
    const { profitRules, lossRules } = req.body;

    // Validate rules add up to 100%
    if (profitRules) {
      const totalProfit = Object.values(profitRules).reduce(
        (sum: number, val: any) => sum + val,
        0,
      );
      if (Math.abs(totalProfit - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          error: "Profit distribution rules must total 100%",
        });
      }
    }

    if (lossRules) {
      const totalLoss = Object.values(lossRules).reduce(
        (sum: number, val: any) => sum + val,
        0,
      );
      if (Math.abs(totalLoss - 100) > 0.01) {
        return res.status(400).json({
          success: false,
          error: "Loss absorption rules must total 100%",
        });
      }
    }

    anonymousAccountManager.updateDistributionRules(profitRules, lossRules);

    res.json({
      success: true,
      data: {
        profitRules,
        lossRules,
      },
      message: "Distribution rules updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Failed to update distribution rules",
    });
  }
});

// Get current distribution rules
router.get("/anonymous/distribution-rules", async (req, res) => {
  try {
    const summary = anonymousAccountManager.getDistributionSummary();

    res.json({
      success: true,
      data: {
        profitDistribution: {
          federalReserve: `${summary.profitRules.federalReserve}% → federalreserve.gov`,
          broker: `${summary.profitRules.broker}% → broker dealing desk`,
          goldMarketDilution: `${summary.profitRules.goldMarketDilution}% → world gold market cap`,
        },
        lossAbsorption: {
          sjc: `${summary.lossRules.sjc}% → SJC Vietnam`,
          pnj: `${summary.lossRules.pnj}% → PNJ Vietnam`,
          vietnameseBanks: `${summary.lossRules.vietnameseBanks}% → Vietnamese banks`,
          goldMarket: `${summary.lossRules.goldMarket}% → gold market`,
        },
        vietnameseBanks: summary.vietnameseBanks,
      },
      message: "Distribution rules retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get distribution rules",
    });
  }
});

// Force close trade (admin function)
router.post("/anonymous/close-trade/:tradeId", async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { closingPrice } = req.body;

    if (!closingPrice) {
      return res.status(400).json({
        success: false,
        error: "Closing price is required",
      });
    }

    await anonymousAccountManager.closeTrade(tradeId, closingPrice);

    res.json({
      success: true,
      data: {
        tradeId,
        status: "closed",
        note: "Profit/loss has been distributed according to rules",
      },
      message: "Trade closed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to close trade",
    });
  }
});

// Anonymous trading statistics (limited view)
router.get("/anonymous/statistics", async (req, res) => {
  try {
    const trades = anonymousAccountManager.getPublicTrades();
    const summary = anonymousAccountManager.getDistributionSummary();

    const stats = {
      totalTrades: trades.length,
      openTrades: trades.filter((t) => t.status === "open").length,
      closedTrades: trades.filter((t) => t.status === "closed").length,
      symbols: [...new Set(trades.map((t) => t.symbol))],
      totalLotSize: trades.reduce((sum, t) => sum + t.lotSize, 0),
      averageLotSize:
        trades.length > 0
          ? (
              trades.reduce((sum, t) => sum + t.lotSize, 0) / trades.length
            ).toFixed(2)
          : 0,
      distributionEvents: {
        profitDistributions: summary.totalDistributions,
        lossAbsorptions: summary.totalAbsorptions,
      },
      privacy: {
        accountBalancesHidden: true,
        profitLossAmountsHidden: true,
        onlyLotSizesVisible: true,
      },
    };

    res.json({
      success: true,
      data: stats,
      message: "Anonymous trading statistics retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get trading statistics",
    });
  }
});

export { router as anonymousAccountRoutes };
