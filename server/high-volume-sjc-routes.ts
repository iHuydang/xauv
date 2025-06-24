import express from 'express';
import { highVolumeSJCOrderSystem } from './high-volume-sjc-order-system.js';

const router = express.Router();

// Create 61 high-volume SJC gold orders
router.post('/high-volume-sjc/create-orders', async (req, res) => {
  try {
    const { totalOrders = 61 } = req.body;
    
    console.log(`🚀 Creating ${totalOrders} high-volume SJC gold orders...`);
    
    const orderIds = await highVolumeSJCOrderSystem.createHighVolumeOrders(totalOrders);
    
    res.json({
      success: true,
      data: {
        orderIds,
        totalOrders: orderIds.length,
        conversion: '1 lot = 82.94 taels SJC Vietnam gold',
        physicalDeliveryRequired: true,
        financialInstitutionCoordination: true
      },
      message: `Successfully created ${orderIds.length} high-volume SJC gold orders`
    });
  } catch (error) {
    console.error('Error creating high-volume orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create high-volume orders'
    });
  }
});

// Execute all pending orders
router.post('/high-volume-sjc/execute-all', async (req, res) => {
  try {
    console.log('⚡ Executing all high-volume SJC orders...');
    
    await highVolumeSJCOrderSystem.executeAllOrders();
    
    const status = highVolumeSJCOrderSystem.getOrderStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        note: 'All orders executed with physical SJC gold delivery',
        brokerSpreadDistribution: 'Real profits distributed to broker dealing desk',
        physicalGoldDelivery: 'Coordinated with Vietnamese financial institutions'
      },
      message: 'All high-volume orders executed successfully'
    });
  } catch (error) {
    console.error('Error executing orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute orders'
    });
  }
});

// Get order status and statistics
router.get('/high-volume-sjc/status', async (req, res) => {
  try {
    const status = highVolumeSJCOrderSystem.getOrderStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        lotToTaelsConversion: '1 lot = 82.94 taels SJC Vietnam gold',
        taelsToGrams: '1 tael = 37.5 grams',
        physicalGoldRequired: `${(status.totalPhysicalWeight / 1000).toFixed(2)} kg`,
        brokerProfitDistribution: '100% spread profits to broker dealing desk'
      },
      message: 'High-volume SJC order status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order status'
    });
  }
});

// Get orders by financial institution
router.get('/high-volume-sjc/by-institution', async (req, res) => {
  try {
    const institutionSummary = highVolumeSJCOrderSystem.getOrdersByInstitution();
    
    res.json({
      success: true,
      data: {
        institutions: institutionSummary,
        totalInstitutions: institutionSummary.length,
        physicalGoldCoordination: 'Each institution responsible for physical gold delivery to SJC',
        brokerSpreadDistribution: 'Real profits from spread distributed to broker after settlement'
      },
      message: 'Orders by financial institution retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting orders by institution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders by institution'
    });
  }
});

// Execute specific order
router.post('/high-volume-sjc/execute/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`⚡ Executing order: ${orderId}`);
    
    const success = await highVolumeSJCOrderSystem.executeOrder(orderId);
    
    if (success) {
      res.json({
        success: true,
        data: {
          orderId,
          status: 'executed',
          physicalGoldDelivery: 'Scheduled with financial institution',
          brokerSpreadProfit: 'Distributed to broker dealing desk',
          sjcCoordination: 'Physical gold transaction coordinated with SJC'
        },
        message: `Order ${orderId} executed successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Failed to execute order ${orderId}`
      });
    }
  } catch (error) {
    console.error('Error executing order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute order'
    });
  }
});

// Get physical gold delivery schedule
router.get('/high-volume-sjc/delivery-schedule', async (req, res) => {
  try {
    const status = highVolumeSJCOrderSystem.getOrderStatus();
    const institutionSummary = highVolumeSJCOrderSystem.getOrdersByInstitution();
    
    res.json({
      success: true,
      data: {
        totalDeliveries: status.scheduledDeliveries,
        totalPhysicalGold: `${(status.totalPhysicalWeight / 1000).toFixed(2)} kg`,
        totalSJCTaels: `${status.totalSJCTaels.toFixed(2)} taels`,
        institutionDeliveries: institutionSummary.map(inst => ({
          institution: inst.institution,
          ordersToDeliver: inst.orderCount,
          goldWeight: `${(inst.totalWeight / 1000).toFixed(2)} kg`,
          sjcTaels: `${inst.totalTaels.toFixed(2)} taels`
        })),
        deliveryCoordination: 'Financial institutions coordinate physical gold transport to SJC locations',
        goldStandard: 'SJC 9999 purity gold bars and coins'
      },
      message: 'Physical gold delivery schedule retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting delivery schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get delivery schedule'
    });
  }
});

// Create and execute 61 orders immediately
router.post('/high-volume-sjc/create-and-execute', async (req, res) => {
  try {
    const { totalOrders = 61 } = req.body;
    
    console.log(`🚀 Creating and executing ${totalOrders} high-volume SJC orders...`);
    
    // Create orders
    const orderIds = await highVolumeSJCOrderSystem.createHighVolumeOrders(totalOrders);
    
    // Execute all orders
    await highVolumeSJCOrderSystem.executeAllOrders();
    
    const status = highVolumeSJCOrderSystem.getOrderStatus();
    const institutionSummary = highVolumeSJCOrderSystem.getOrdersByInstitution();
    
    res.json({
      success: true,
      data: {
        orderIds,
        totalOrders: orderIds.length,
        executionStatus: status,
        institutionSummary,
        physicalGoldDelivery: {
          totalWeight: `${(status.totalPhysicalWeight / 1000).toFixed(2)} kg`,
          totalTaels: `${status.totalSJCTaels.toFixed(2)} taels`,
          conversion: '1 lot = 82.94 taels SJC Vietnam gold',
          deliveryCoordination: 'All financial institutions notified for physical gold transport'
        },
        brokerProfit: {
          totalSpreadProfit: `$${status.totalBrokerProfit.toFixed(2)}`,
          distribution: '100% spread profits to broker dealing desk',
          realProfitAfterSettlement: true
        }
      },
      message: `Successfully created and executed ${orderIds.length} high-volume SJC gold orders with physical delivery coordination`
    });
  } catch (error) {
    console.error('Error creating and executing orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create and execute orders'
    });
  }
});

export { router as highVolumeSJCRoutes };