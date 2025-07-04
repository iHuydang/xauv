import express from "express";
import { tradermadeIntegration } from "./tradermade-integration";

const router = express.Router();

// Market impact check endpoint
router.post("/impact-check", async (req, res) => {
  try {
    const { symbols, timeframe, analysis_depth, include_correlations } =
      req.body;

    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: "Symbols are required",
      });
    }

    const symbolArray =
      typeof symbols === "string"
        ? symbols.split(",").map((s) => s.trim())
        : symbols;

    console.log(`📊 Market impact check for: ${symbolArray.join(", ")}`);

    // Calculate impact score based on multiple factors
    const impactScore = calculateImpactScore(symbolArray, timeframe);
    const volatilityIncrease = calculateVolatilityIncrease(impactScore);
    const correlationAnalysis = include_correlations
      ? await analyzeCorrelations(symbolArray)
      : null;

    const result = {
      success: true,
      impact_score: impactScore,
      affected_symbols: symbolArray,
      timeframe: timeframe || "1h",
      volatility_increase: `${volatilityIncrease}%`,
      correlation_analysis: correlationAnalysis || {
        positive: ["EURUSD", "GBPUSD"],
        negative: ["USDJPY", "USDCHF"],
        neutral: ["GBPJPY", "EURJPY"],
      },
      recommendation: generateRecommendation(impactScore),
      timestamp: new Date().toISOString(),
      analysis_depth: analysis_depth || "standard",
    };

    console.log(`✅ Impact analysis completed: Score ${impactScore}`);

    res.json(result);
  } catch (error) {
    console.error("❌ Market impact check failed:", error);
    res.status(500).json({
      success: false,
      error: "Market impact analysis failed",
      details: error.message,
    });
  }
});

// Real-time market impact monitoring
router.get("/impact-monitor", async (req, res) => {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: "Symbols parameter is required",
      });
    }

    const symbolArray = symbols
      .toString()
      .split(",")
      .map((s) => s.trim());

    const monitoring = {
      symbols: symbolArray,
      current_impact: calculateImpactScore(symbolArray, "5m"),
      alert_threshold: 8.0,
      monitoring_active: true,
      last_update: new Date().toISOString(),
    };

    res.json({
      success: true,
      monitoring,
    });
  } catch (error) {
    console.error("❌ Impact monitoring failed:", error);
    res.status(500).json({
      success: false,
      error: "Impact monitoring failed",
    });
  }
});

// Helper functions
function calculateImpactScore(
  symbols: string[],
  timeframe: string = "1h",
): number {
  let baseScore = 3.0;

  // Symbol count factor
  baseScore += symbols.length * 0.8;

  // Major pairs have higher impact
  const majorPairs = [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "USDCHF",
    "AUDUSD",
    "USDCAD",
  ];
  const majorCount = symbols.filter((s) =>
    majorPairs.includes(s.toUpperCase()),
  ).length;
  baseScore += majorCount * 1.2;

  // Gold/commodities have high impact
  const commodities = ["XAUUSD", "XAGUSD", "USOIL", "UKOIL"];
  const commodityCount = symbols.filter((s) =>
    commodities.includes(s.toUpperCase()),
  ).length;
  baseScore += commodityCount * 1.8;

  // Timeframe adjustment
  const timeframeFactor = {
    "1m": 0.8,
    "5m": 0.9,
    "15m": 1.0,
    "1h": 1.2,
    "4h": 1.5,
    "1d": 2.0,
  };

  baseScore *= timeframeFactor[timeframe] || 1.0;

  // Add some randomness for market volatility
  baseScore += (Math.random() - 0.5) * 2;

  return Math.min(10.0, Math.max(1.0, Number(baseScore.toFixed(2))));
}

function calculateVolatilityIncrease(impactScore: number): number {
  const baseVolatility = 5.0;
  const increase = baseVolatility + impactScore * 1.8;
  return Number(increase.toFixed(1));
}

async function analyzeCorrelations(symbols: string[]): Promise<any> {
  // Simplified correlation analysis
  const correlations = {
    positive: [],
    negative: [],
    neutral: [],
  };

  // EUR pairs tend to correlate positively
  const eurPairs = symbols.filter((s) => s.startsWith("EUR"));
  if (eurPairs.length > 1) {
    correlations.positive.push(...eurPairs);
  }

  // USD strength pairs correlate negatively with EUR/GBP
  const usdStrengthPairs = symbols.filter((s) =>
    ["USDJPY", "USDCHF", "USDCAD"].includes(s.toUpperCase()),
  );
  if (usdStrengthPairs.length > 0) {
    correlations.negative.push(...usdStrengthPairs);
  }

  // Everything else is neutral
  correlations.neutral = symbols.filter(
    (s) =>
      !correlations.positive.includes(s) && !correlations.negative.includes(s),
  );

  return correlations;
}

function generateRecommendation(impactScore: number): string {
  if (impactScore >= 8.0) {
    return "HIGH IMPACT: Reduce position sizes and monitor closely for next 6+ hours";
  } else if (impactScore >= 6.0) {
    return "MEDIUM IMPACT: Exercise caution and monitor for next 4 hours";
  } else if (impactScore >= 4.0) {
    return "MODERATE IMPACT: Normal monitoring for next 2 hours";
  } else {
    return "LOW IMPACT: Standard trading conditions";
  }
}

export default router;
