import express from "express";
import { enhancedGoldAttackSystem } from "./enhanced-gold-attack-system";

const router = express.Router();

// Get all available attack vectors
router.get("/gold-attack/vectors", async (req, res) => {
  try {
    const vectors = enhancedGoldAttackSystem.getAllAttackVectors();

    res.json({
      success: true,
      data: {
        vectors,
        total_vectors: vectors.length,
        most_effective: vectors
          .sort((a, b) => b.effectiveness_rate - a.effectiveness_rate)
          .slice(0, 3),
        recommended_fsapi: vectors.filter(
          (v) => v.target === "FSAPI" || v.target === "ALL",
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get attack vectors",
    });
  }
});

// Get current market data and opportunities
router.get("/gold-attack/market-data", async (req, res) => {
  try {
    const marketData = enhancedGoldAttackSystem.getMarketData();
    const dataArray = Array.from(marketData.entries()).map(
      ([source, data]) => ({
        source,
        ...data,
      }),
    );

    res.json({
      success: true,
      data: {
        markets: dataArray,
        total_markets: dataArray.length,
        highest_vulnerability: dataArray
          .sort(
            (a, b) =>
              (b.vulnerability_score || 0) - (a.vulnerability_score || 0),
          )
          .slice(0, 3),
        best_targets: dataArray.filter(
          (d) => (d.vulnerability_score || 0) > 60,
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get market data",
    });
  }
});

// Execute specific attack vector
router.post("/gold-attack/execute", async (req, res) => {
  try {
    const { vector_name, custom_params } = req.body;

    if (!vector_name) {
      return res.status(400).json({
        success: false,
        error: "vector_name is required",
      });
    }

    const result = await enhancedGoldAttackSystem.executeEnhancedAttack(
      vector_name,
      custom_params,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Attack execution failed",
    });
  }
});

// Execute SJC pressure attack (enhanced)
router.post("/gold-attack/sjc-pressure", async (req, res) => {
  try {
    const {
      intensity = "EXTREME",
      duration_minutes = 30,
      volume_multiplier = 8.5,
    } = req.body;

    const customParams = {
      intensity,
      duration_minutes,
      volume_multiplier,
    };

    const result = await enhancedGoldAttackSystem.executeEnhancedAttack(
      "SJC_PRESSURE_EXTREME",
      customParams,
    );

    res.json({
      success: true,
      data: {
        attack_type: "SJC_PRESSURE_EXTREME",
        parameters: customParams,
        result,
        message: "SJC pressure attack executed with enhanced algorithms",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "SJC pressure attack failed",
    });
  }
});

// Execute FSAPI liquidity drain attack (most effective)
router.post("/gold-attack/fsapi-drain", async (req, res) => {
  try {
    const { intensity = "MAXIMUM", volume_multiplier = 15.0 } = req.body;

    const customParams = {
      intensity,
      volume_multiplier,
    };

    const result = await enhancedGoldAttackSystem.executeEnhancedAttack(
      "FSAPI_LIQUIDITY_DRAIN",
      customParams,
    );

    res.json({
      success: true,
      data: {
        attack_type: "FSAPI_LIQUIDITY_DRAIN",
        effectiveness_rate: "96%",
        parameters: customParams,
        result,
        message:
          "FSAPI liquidity drain attack - highest effectiveness against fsapi.gold.org",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "FSAPI liquidity drain attack failed",
    });
  }
});

// Execute coordinated multi-target attack
router.post("/gold-attack/coordinated", async (req, res) => {
  try {
    const {
      intensity = "MAXIMUM",
      duration_minutes = 90,
      volume_multiplier = 20.0,
    } = req.body;

    const customParams = {
      intensity,
      duration_minutes,
      volume_multiplier,
    };

    const result = await enhancedGoldAttackSystem.executeEnhancedAttack(
      "MULTI_TARGET_COORDINATED",
      customParams,
    );

    res.json({
      success: true,
      data: {
        attack_type: "MULTI_TARGET_COORDINATED",
        targets: ["SJC", "PNJ", "FSAPI", "WORLD"],
        parameters: customParams,
        result,
        message: "Coordinated attack across all gold markets",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Coordinated attack failed",
    });
  }
});

// Execute world arbitrage attack
router.post("/gold-attack/world-arbitrage", async (req, res) => {
  try {
    const { intensity = "HIGH", volume_multiplier = 12.0 } = req.body;

    const customParams = {
      intensity,
      volume_multiplier,
    };

    const result = await enhancedGoldAttackSystem.executeEnhancedAttack(
      "WORLD_ARBITRAGE_COORDINATED",
      customParams,
    );

    res.json({
      success: true,
      data: {
        attack_type: "WORLD_ARBITRAGE_COORDINATED",
        effectiveness_rate: "89%",
        parameters: customParams,
        result,
        message:
          "World gold arbitrage attack using international price differences",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "World arbitrage attack failed",
    });
  }
});

// Execute stealth continuous attack
router.post("/gold-attack/stealth", async (req, res) => {
  try {
    const { duration_minutes = 180, cycles = 20 } = req.body;

    const customParams = {
      duration_minutes,
      cycles,
      stealth_mode: true,
    };

    const result = await enhancedGoldAttackSystem.executeEnhancedAttack(
      "STEALTH_CONTINUOUS",
      customParams,
    );

    res.json({
      success: true,
      data: {
        attack_type: "STEALTH_CONTINUOUS",
        stealth_cycles: cycles,
        parameters: customParams,
        result,
        message: "Stealth attack - low detection, sustained pressure",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Stealth attack failed",
    });
  }
});

// Get attack status and history
router.get("/gold-attack/status", async (req, res) => {
  try {
    const systemStatus = await enhancedGoldAttackSystem.getSystemStatus();
    const activeAttacks = enhancedGoldAttackSystem.getActiveAttacks();
    const attackHistory = enhancedGoldAttackSystem.getAttackHistory();

    res.json({
      success: true,
      data: {
        system: systemStatus,
        active_attacks: activeAttacks,
        recent_history: attackHistory.slice(-10),
        performance_summary: {
          total_attacks: attackHistory.length,
          success_rate:
            attackHistory.length > 0
              ? (
                  (attackHistory.filter((a) => a.success).length /
                    attackHistory.length) *
                  100
                ).toFixed(1) + "%"
              : "0%",
          avg_effectiveness:
            attackHistory.length > 0
              ? (
                  attackHistory.reduce((sum, a) => sum + a.effectiveness, 0) /
                  attackHistory.length
                ).toFixed(1) + "%"
              : "0%",
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get attack status",
    });
  }
});

// Stop all active attacks
router.post("/gold-attack/stop-all", async (req, res) => {
  try {
    const activeAttacks = enhancedGoldAttackSystem.getActiveAttacks();
    const stoppedCount = activeAttacks.length;

    // Clear all active attacks
    for (const attack of activeAttacks) {
      enhancedGoldAttackSystem.emit("force_stop_attack", attack.attack_id);
    }

    res.json({
      success: true,
      data: {
        stopped_attacks: stoppedCount,
        message: `Stopped ${stoppedCount} active attacks`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to stop attacks",
    });
  }
});

// Get optimal attack recommendations
router.get("/gold-attack/recommendations", async (req, res) => {
  try {
    const marketData = enhancedGoldAttackSystem.getMarketData();
    const vectors = enhancedGoldAttackSystem.getAllAttackVectors();

    const recommendations = [];

    // Analyze each market for opportunities
    for (const [source, data] of marketData) {
      if (data.vulnerability_score && data.vulnerability_score > 60) {
        const suitableVectors = vectors.filter(
          (v) =>
            v.target === "ALL" ||
            v.target === source.toUpperCase() ||
            (source.includes("FSAPI") && v.target === "FSAPI"),
        );

        const bestVector = suitableVectors.sort(
          (a, b) => b.effectiveness_rate - a.effectiveness_rate,
        )[0];

        if (bestVector) {
          recommendations.push({
            target: source,
            vulnerability: data.vulnerability_score,
            liquidity: data.liquidity_score,
            recommended_vector: bestVector.name,
            effectiveness: bestVector.effectiveness_rate * 100,
            optimal_timing: "IMMEDIATE",
            reason: `High vulnerability (${data.vulnerability_score.toFixed(1)}%) detected`,
          });
        }
      }
    }

    // Sort by opportunity score
    recommendations.sort(
      (a, b) =>
        b.vulnerability * b.effectiveness - a.vulnerability * a.effectiveness,
    );

    res.json({
      success: true,
      data: {
        recommendations: recommendations.slice(0, 5), // Top 5
        total_opportunities: recommendations.length,
        immediate_actions: recommendations.filter((r) => r.vulnerability > 80),
        fsapi_specific: recommendations.filter((r) =>
          r.target.includes("FSAPI"),
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
    });
  }
});

// Quick attack selector - automatically choose best attack
router.post("/gold-attack/quick", async (req, res) => {
  try {
    const { target_preference, intensity_preference = "HIGH" } = req.body;

    const marketData = enhancedGoldAttackSystem.getMarketData();
    const vectors = enhancedGoldAttackSystem.getAllAttackVectors();

    // Find best target if not specified
    let bestTarget = target_preference;
    let bestVulnerability = 0;

    if (!bestTarget) {
      for (const [source, data] of marketData) {
        if (
          data.vulnerability_score &&
          data.vulnerability_score > bestVulnerability
        ) {
          bestVulnerability = data.vulnerability_score;
          bestTarget = source;
        }
      }
    }

    // Select best vector for target
    const suitableVectors = vectors
      .filter(
        (v) =>
          v.target === "ALL" ||
          v.target === (bestTarget || "").toUpperCase() ||
          (bestTarget?.includes("FSAPI") && v.target === "FSAPI"),
      )
      .filter(
        (v) =>
          v.intensity === intensity_preference || v.intensity === "MAXIMUM",
      );

    if (suitableVectors.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No suitable attack vectors found for target",
      });
    }

    const selectedVector = suitableVectors.sort(
      (a, b) => b.effectiveness_rate - a.effectiveness_rate,
    )[0];

    // Execute the attack
    const result = await enhancedGoldAttackSystem.executeEnhancedAttack(
      selectedVector.name,
    );

    res.json({
      success: true,
      data: {
        quick_attack: true,
        selected_target: bestTarget,
        selected_vector: selectedVector.name,
        auto_selection_reason: `Best effectiveness (${(selectedVector.effectiveness_rate * 100).toFixed(1)}%) for current market conditions`,
        result,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Quick attack failed",
    });
  }
});

export default router;
