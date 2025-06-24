
import express from 'express';
import { financialInstitutionBroker } from './financial-institution-broker';

const router = express.Router();

// Get all connected financial institutions
router.get('/financial-institutions', (req, res) => {
  try {
    const institutions = financialInstitutionBroker.getActiveInstitutions();
    
    res.json({
      success: true,
      data: {
        institutions,
        total_count: institutions.length,
        total_capacity: institutions.reduce((sum, inst) => sum + inst.liquidity_capacity, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get financial institutions'
    });
  }
});

// Distribute order to financial institutions
router.post('/financial-institutions/distribute-order', async (req, res) => {
  try {
    const { lot_size, order_type, target_institutions } = req.body;
    
    if (!lot_size || !order_type) {
      return res.status(400).json({
        success: false,
        error: 'lot_size and order_type are required'
      });
    }

    const orderIds = await financialInstitutionBroker.forceDistributeOrder(
      parseFloat(lot_size),
      order_type,
      target_institutions
    );

    res.json({
      success: true,
      data: {
        distributed_orders: orderIds,
        lot_size: parseFloat(lot_size),
        order_type,
        institutions_count: orderIds.length,
        message: 'Order successfully distributed to financial institutions'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Distribution failed'
    });
  }
});

// Get active institutional orders
router.get('/financial-institutions/orders', (req, res) => {
  try {
    const { status, institution_id } = req.query;
    let orders = financialInstitutionBroker.getActiveOrders();
    
    // Filter by status if provided
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    // Filter by institution if provided
    if (institution_id) {
      orders = orders.filter(order => order.institutionId === institution_id);
    }

    // Sort by execution time (newest first)
    orders.sort((a, b) => b.executionTime - a.executionTime);

    res.json({
      success: true,
      data: {
        orders,
        total_count: orders.length,
        total_volume: orders.reduce((sum, order) => sum + order.convertedGoldGrams, 0),
        total_value: orders.reduce((sum, order) => sum + order.totalValueVND, 0)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get institutional orders'
    });
  }
});

// Get broker system metrics
router.get('/financial-institutions/metrics', (req, res) => {
  try {
    const metrics = financialInstitutionBroker.getBrokerMetrics();
    
    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get broker metrics'
    });
  }
});

// Simulate SJC sale from MT5 to institutions
router.post('/financial-institutions/simulate-sjc-sale', async (req, res) => {
  try {
    const { 
      lot_size = 0.1, 
      mt5_account = '205307242',
      profit_vnd = 100000 
    } = req.body;

    console.log(`🎯 SIMULATING SJC SALE FROM MT5:`);
    console.log(`   MT5 Account: ${mt5_account}`);
    console.log(`   Lot Size: ${lot_size}`);
    console.log(`   Simulated Profit: ${profit_vnd.toLocaleString()} VND`);

    // Create mock gold order
    const goldOrder = {
      orderId: `SJC_SALE_${Date.now()}`,
      lotSize: parseFloat(lot_size),
      side: 'sell', // Selling gold from MT5
      priceVND: 84000000, // Current SJC price per tael
      mt5Account,
      simulatedProfit: parseInt(profit_vnd)
    };

    // Distribute to financial institutions
    const orderIds = await financialInstitutionBroker.distributeToInstitutions(goldOrder);

    res.json({
      success: true,
      data: {
        simulation: 'SJC_SALE_TO_INSTITUTIONS',
        original_mt5_order: goldOrder,
        distributed_orders: orderIds,
        institutions_involved: orderIds.length,
        gold_volume_grams: (parseFloat(lot_size) * 31.1035).toFixed(2),
        expected_settlement_vnd: (parseFloat(lot_size) * 31.1035 / 37.5 * 84000000).toLocaleString(),
        message: 'SJC sale successfully distributed to financial institutions as real gold transactions'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Simulation failed'
    });
  }
});

// Batch distribute multiple orders
router.post('/financial-institutions/batch-distribute', async (req, res) => {
  try {
    const { orders } = req.body;
    
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'orders array is required'
      });
    }

    const results = [];
    
    for (const orderData of orders) {
      try {
        const orderIds = await financialInstitutionBroker.forceDistributeOrder(
          orderData.lot_size,
          orderData.order_type,
          orderData.target_institutions
        );
        
        results.push({
          order_data: orderData,
          distributed_orders: orderIds,
          status: 'success'
        });
        
      } catch (error) {
        results.push({
          order_data: orderData,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    
    res.json({
      success: true,
      data: {
        results,
        total_orders: orders.length,
        successful_distributions: successCount,
        failed_distributions: orders.length - successCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch distribution failed'
    });
  }
});

// Emergency liquidation to all institutions
router.post('/financial-institutions/emergency-liquidation', async (req, res) => {
  try {
    const { total_lots, emergency_reason = 'MARKET_CRISIS' } = req.body;
    
    if (!total_lots || total_lots <= 0) {
      return res.status(400).json({
        success: false,
        error: 'valid total_lots is required'
      });
    }

    console.log(`🚨 EMERGENCY LIQUIDATION TRIGGERED:`);
    console.log(`   Total Lots: ${total_lots}`);
    console.log(`   Reason: ${emergency_reason}`);

    const activeInstitutions = financialInstitutionBroker.getActiveInstitutions();
    const lotsPerInstitution = parseFloat(total_lots) / activeInstitutions.length;

    const emergencyOrders = [];
    
    for (const institution of activeInstitutions) {
      const orderIds = await financialInstitutionBroker.forceDistributeOrder(
        lotsPerInstitution,
        'sell_sjc', // Emergency sale
        [institution.id]
      );
      
      emergencyOrders.push({
        institution: institution.name,
        institution_id: institution.id,
        lots_allocated: lotsPerInstitution,
        order_ids: orderIds
      });
    }

    res.json({
      success: true,
      data: {
        emergency_type: 'LIQUIDATION',
        reason: emergency_reason,
        total_lots: parseFloat(total_lots),
        institutions_involved: activeInstitutions.length,
        emergency_orders: emergencyOrders,
        estimated_value_vnd: (parseFloat(total_lots) * 31.1035 / 37.5 * 84000000).toLocaleString(),
        message: 'Emergency liquidation distributed to all financial institutions'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Emergency liquidation failed'
    });
  }
});

export default router;
