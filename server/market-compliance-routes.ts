import express from 'express';
import { marketControlAlgorithm } from './market-control-algorithm';
import { antiSlippageSystem } from './anti-slippage-system';
import { agiAntiSlippageSystem } from './agi-anti-slippage-system';

const router = express.Router();

// Force market compliance for specific order
router.post('/force-compliance', async (req, res) => {
  try {
    const { accountId, symbol, side, volume } = req.body;

    if (!accountId || !symbol || !side || !volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, symbol, side, volume'
      });
    }

    console.log(`🚨 API: Force compliance request for ${accountId}`);

    const response = await marketControlAlgorithm.forceMarketCompliance(
      accountId,
      symbol,
      side,
      volume
    );

    res.json({
      success: true,
      data: response,
      message: `Market compliance forced: ${symbol} ${side.toUpperCase()}`
    });

  } catch (error) {
    console.error('❌ Force compliance API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force market compliance'
    });
  }
});

// Force immediate price movement
router.post('/force-price-move', async (req, res) => {
  try {
    const { symbol, direction, pips } = req.body;

    if (!symbol || !direction || !pips) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, direction, pips'
      });
    }

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({
        success: false,
        error: 'Direction must be "up" or "down"'
      });
    }

    console.log(`⚡ API: Force price move ${symbol} ${direction.toUpperCase()} ${pips} pips`);

    await marketControlAlgorithm.forceImmediatePriceMove(symbol, direction, pips);

    res.json({
      success: true,
      message: `Price movement forced: ${symbol} ${direction.toUpperCase()} ${pips} pips`
    });

  } catch (error) {
    console.error('❌ Force price move API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force price movement'
    });
  }
});

// Track new order for anti-slippage
router.post('/track-order', async (req, res) => {
  try {
    const { accountId, symbol, side, volume } = req.body;

    if (!accountId || !symbol || !side || !volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, symbol, side, volume'
      });
    }

    console.log(`📊 API: Tracking order ${accountId} ${symbol} ${side.toUpperCase()}`);

    antiSlippageSystem.trackOrder(accountId, { symbol, side, volume });

    res.json({
      success: true,
      message: `Order tracked and compliance enforced: ${symbol} ${side.toUpperCase()}`
    });

  } catch (error) {
    console.error('❌ Track order API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track order'
    });
  }
});

// Get active market controls
router.get('/active-controls', async (req, res) => {
  try {
    const activeControls = marketControlAlgorithm.getActiveControls();

    res.json({
      success: true,
      data: {
        activeControls,
        totalActive: activeControls.length,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ Get active controls API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active controls'
    });
  }
});

// Get slippage statistics
router.get('/slippage-stats', async (req, res) => {
  try {
    const stats = antiSlippageSystem.getSlippageStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get slippage stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get slippage statistics'
    });
  }
});

// Emergency stop all slippage
router.post('/emergency-stop-slippage', async (req, res) => {
  try {
    console.log('🚨 API: Emergency stop slippage activated');

    antiSlippageSystem.emergencyStopSlippage();

    res.json({
      success: true,
      message: 'Emergency slippage stop activated - All orders forced to compliance'
    });

  } catch (error) {
    console.error('❌ Emergency stop API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop'
    });
  }
});

// AGI Anti-Slippage Endpoints

// Track order with AGI
router.post('/agi-track-order', async (req, res) => {
  try {
    const { accountId, symbol, side, volume } = req.body;

    if (!accountId || !symbol || !side || !volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, symbol, side, volume'
      });
    }

    console.log(`🧠 AGI API: Tracking order ${accountId} ${symbol} ${side.toUpperCase()}`);

    await agiAntiSlippageSystem.trackOrderWithAGI(accountId, { symbol, side, volume });

    res.json({
      success: true,
      message: `AGI order tracking activated: ${symbol} ${side.toUpperCase()}`,
      agiLevel: 'ARTIFICIAL GENERAL INTELLIGENCE'
    });

  } catch (error) {
    console.error('❌ AGI track order API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track order with AGI'
    });
  }
});

// Force AGI compliance
router.post('/agi-force-compliance', async (req, res) => {
  try {
    const { accountId, symbol, side, volume } = req.body;

    if (!accountId || !symbol || !side || !volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, symbol, side, volume'
      });
    }

    console.log(`🤖 AGI API: Force compliance ${accountId} ${symbol} ${side.toUpperCase()}`);

    await agiAntiSlippageSystem.forceAGICompliance(accountId, symbol, side, volume);

    res.json({
      success: true,
      message: `AGI compliance forced: ${accountId} ${symbol} ${side.toUpperCase()}`,
      technology: 'Neural Network + Quantum Analysis + Emergent Strategy'
    });

  } catch (error) {
    console.error('❌ AGI force compliance API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force AGI compliance'
    });
  }
});

// Get AGI statistics
router.get('/agi-stats', async (req, res) => {
  try {
    const stats = agiAntiSlippageSystem.getAGIStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get AGI stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AGI statistics'
    });
  }
});

// Emergency AGI Override
router.post('/emergency-agi-override', async (req, res) => {
  try {
    console.log('🚨 AGI API: Emergency AGI override activated');

    agiAntiSlippageSystem.emergencyAGIOverride();

    res.json({
      success: true,
      message: 'Emergency AGI override activated - Maximum intelligence deployed',
      level: 'ARTIFICIAL GENERAL INTELLIGENCE MAXIMUM OVERRIDE'
    });

  } catch (error) {
    console.error('❌ Emergency AGI override API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency AGI override'
    });
  }
});

// Manual force compliance for specific order
router.post('/manual-force-compliance', async (req, res) => {
  try {
    const { accountId, symbol, side, volume } = req.body;

    if (!accountId || !symbol || !side || !volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, symbol, side, volume'
      });
    }

    console.log(`🔧 API: Manual force compliance ${accountId} ${symbol} ${side.toUpperCase()}`);

    await antiSlippageSystem.forceOrderCompliance(accountId, symbol, side, volume);

    res.json({
      success: true,
      message: `Manual compliance forced: ${accountId} ${symbol} ${side.toUpperCase()}`
    });

  } catch (error) {
    console.error('❌ Manual force compliance API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to manually force compliance'
    });
  }
});

// Batch force compliance for multiple orders
router.post('/batch-force-compliance', async (req, res) => {
  try {
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({
        success: false,
        error: 'Orders array is required'
      });
    }

    console.log(`🚨 API: Batch force compliance for ${orders.length} orders`);

    const results = [];

    for (const order of orders) {
      try {
        const response = await marketControlAlgorithm.forceMarketCompliance(
          order.accountId,
          order.symbol,
          order.side,
          order.volume
        );

        results.push({
          success: true,
          order,
          response
        });

      } catch (error) {
        results.push({
          success: false,
          order,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      data: {
        results,
        totalOrders: orders.length,
        successCount,
        failureCount: orders.length - successCount
      }
    });

  } catch (error) {
    console.error('❌ Batch force compliance API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute batch compliance'
    });
  }
});

export default router;