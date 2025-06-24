import express from 'express';
import { sjcGoldBridge } from './sjc-gold-bridge.js';

const router = express.Router();

// Get SJC Gold Bridge system status
router.get('/sjc-bridge/status', async (req, res) => {
  try {
    const status = sjcGoldBridge.getSystemStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'SJC Gold Bridge system status retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

// Get active SJC gold orders
router.get('/sjc-bridge/orders', async (req, res) => {
  try {
    const orders = sjcGoldBridge.getActiveOrders();
    
    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
        timestamp: new Date().toISOString()
      },
      message: 'Active SJC gold orders retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get active orders'
    });
  }
});

// Manually trigger order conversion from Exness to SJC gold
router.post('/sjc-bridge/convert-order', async (req, res) => {
  try {
    const { 
      ticket, 
      symbol, 
      type, 
      volume, 
      openPrice, 
      currentPrice, 
      profit 
    } = req.body;

    if (!ticket || !symbol || !type || !volume) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order parameters'
      });
    }

    const exnessOrder = {
      ticket,
      symbol,
      type,
      volume,
      openPrice: openPrice || 0,
      currentPrice: currentPrice || openPrice || 0,
      profit: profit || 0
    };

    const orderId = await sjcGoldBridge.convertExnessOrderToSJCGold(exnessOrder);

    res.json({
      success: true,
      data: {
        orderId,
        exnessOrder,
        status: 'conversion_initiated'
      },
      message: 'Exness order converted to SJC gold order successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to convert order to SJC gold'
    });
  }
});

// Force execute a pending SJC order
router.post('/sjc-bridge/execute-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const success = await sjcGoldBridge.forceOrderExecution(orderId);
    
    if (success) {
      res.json({
        success: true,
        data: { orderId },
        message: 'SJC order execution forced successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Order not found or not in pending status'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to force order execution'
    });
  }
});

// Update liquidity provider settings
router.patch('/sjc-bridge/liquidity-provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const updates = req.body;

    sjcGoldBridge.updateLiquidityProvider(providerId, updates);

    res.json({
      success: true,
      data: { providerId, updates },
      message: 'Liquidity provider updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update liquidity provider'
    });
  }
});

// Simulate Exness demo trade to trigger SJC conversion
router.post('/sjc-bridge/simulate-trade', async (req, res) => {
  try {
    const {
      symbol = 'XAUUSD',
      type = 'buy',
      volume = 0.1, // 0.1 lot = 10 ounces = ~311 grams
      openPrice,
      currentPrice
    } = req.body;

    // Generate simulated trade data
    const simulatedTrade = {
      ticket: Math.floor(Math.random() * 1000000000),
      symbol,
      type,
      volume,
      openPrice: openPrice || (symbol === 'XAUUSD' ? 2650.50 : 85000000),
      currentPrice: currentPrice || (symbol === 'XAUUSD' ? 2651.00 : 85050000),
      profit: 0
    };

    // Calculate profit
    if (type === 'buy') {
      simulatedTrade.profit = (simulatedTrade.currentPrice - simulatedTrade.openPrice) * volume * 100;
    } else {
      simulatedTrade.profit = (simulatedTrade.openPrice - simulatedTrade.currentPrice) * volume * 100;
    }

    const orderId = await sjcGoldBridge.convertExnessOrderToSJCGold(simulatedTrade);

    res.json({
      success: true,
      data: {
        simulatedTrade,
        sjcOrderId: orderId,
        conversion: 'demo_to_real_gold'
      },
      message: 'Demo trade simulated and converted to real SJC gold order'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to simulate trade and convert to SJC gold'
    });
  }
});

// Get liquidity provider performance metrics
router.get('/sjc-bridge/liquidity-metrics', async (req, res) => {
  try {
    const status = sjcGoldBridge.getSystemStatus();
    const providers = status.liquidityProviders;

    const metrics = providers.map(provider => ({
      institutionId: provider.institutionId,
      institutionName: provider.institutionName,
      availableLiquidity: provider.availableLiquidity,
      liquidityUtilization: ((provider.availableLiquidity / 50000000000) * 100).toFixed(2) + '%',
      goldInventoryTotal: provider.goldInventory.SJC_9999 + provider.goldInventory.SJC_COIN + provider.goldInventory.SJC_BAR,
      averageExecutionTime: provider.averageExecutionTime,
      successRate: provider.successRate,
      connectionStatus: provider.connectionStatus,
      performanceScore: (
        (provider.successRate * 0.4) + 
        ((1000 / provider.averageExecutionTime) * 0.3) + 
        ((provider.availableLiquidity / 50000000000) * 100 * 0.3)
      ).toFixed(2)
    }));

    // Sort by performance score
    metrics.sort((a, b) => parseFloat(b.performanceScore) - parseFloat(a.performanceScore));

    res.json({
      success: true,
      data: {
        metrics,
        totalProviders: providers.length,
        totalLiquidity: status.totalLiquidity,
        systemHealth: status.systemHealth,
        timestamp: new Date().toISOString()
      },
      message: 'Liquidity provider metrics retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get liquidity metrics'
    });
  }
});

// Emergency liquidity injection
router.post('/sjc-bridge/emergency-liquidity', async (req, res) => {
  try {
    const { 
      providerId, 
      liquidityAmount, 
      goldInventory 
    } = req.body;

    if (!providerId || !liquidityAmount) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID and liquidity amount are required'
      });
    }

    const updates = {
      availableLiquidity: liquidityAmount
    };

    if (goldInventory) {
      updates.goldInventory = goldInventory;
    }

    sjcGoldBridge.updateLiquidityProvider(providerId, updates);

    res.json({
      success: true,
      data: {
        providerId,
        injectedLiquidity: liquidityAmount,
        goldInventory: goldInventory || 'unchanged'
      },
      message: 'Emergency liquidity injection completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to inject emergency liquidity'
    });
  }
});

export { router as sjcGoldBridgeRoutes };