
import express from 'express';
import { vietnamGoldBroker } from './vietnam-gold-broker';

const router = express.Router();

// Get current Vietnamese gold prices through broker
router.get('/vietnam-gold/prices', async (req, res) => {
  try {
    const prices = vietnamGoldBroker.getAllVietnameseGoldPrices();
    
    res.json({
      success: true,
      data: {
        prices,
        source_count: prices.length,
        timestamp: Date.now(),
        broker_status: 'active'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Vietnamese gold prices'
    });
  }
});

// Execute pressure attack through broker
router.post('/vietnam-gold/pressure-attack', async (req, res) => {
  try {
    const { targets, intensity, duration, stealth_mode } = req.body;
    
    const config = {
      target_sources: targets || ['SJC', 'DOJI', 'PNJ'],
      intensity: intensity || 'moderate',
      duration_minutes: duration || 15,
      max_spread_threshold: 70000,
      stealth_mode: stealth_mode !== false,
      use_proxy_rotation: true
    };
    
    const attackId = await vietnamGoldBroker.executePressureAttack(config);
    
    res.json({
      success: true,
      data: {
        attack_id: attackId,
        config,
        status: 'executing',
        message: 'Pressure attack initiated through broker'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute pressure attack'
    });
  }
});

// Quick attack on specific target
router.post('/vietnam-gold/quick-attack/:target', async (req, res) => {
  try {
    const { target } = req.params;
    const { intensity } = req.body;
    
    if (!['SJC', 'DOJI', 'PNJ', 'TYGIA_SJC'].includes(target)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target. Must be SJC, DOJI, PNJ, or TYGIA_SJC'
      });
    }
    
    const attackId = await vietnamGoldBroker.executeQuickPressureAttack([target], intensity);
    
    res.json({
      success: true,
      data: {
        attack_id: attackId,
        target,
        intensity: intensity || 'moderate',
        status: 'executing',
        message: `Quick pressure attack on ${target} initiated`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to execute quick attack on ${req.params.target}`
    });
  }
});

// Get broker system status
router.get('/vietnam-gold/broker-status', async (req, res) => {
  try {
    const status = vietnamGoldBroker.getBrokerSystemStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get broker status'
    });
  }
});

// Get active broker orders
router.get('/vietnam-gold/broker-orders', async (req, res) => {
  try {
    const orders = vietnamGoldBroker.getActiveBrokerOrders();
    
    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get broker orders'
    });
  }
});

// Coordinate multi-target devastation attack
router.post('/vietnam-gold/devastation-attack', async (req, res) => {
  try {
    console.log('💀 KHỞI ĐỘNG TẤN CÔNG DEVASTATION QUA BROKER...');
    
    const devastationConfig = {
      target_sources: ['SJC', 'DOJI', 'PNJ', 'TYGIA_SJC'],
      intensity: 'devastating',
      duration_minutes: 30,
      max_spread_threshold: 40000,
      stealth_mode: false, // Maximum aggression
      use_proxy_rotation: true
    };
    
    const attackId = await vietnamGoldBroker.executePressureAttack(devastationConfig);
    
    res.json({
      success: true,
      data: {
        attack_id: attackId,
        attack_type: 'DEVASTATION',
        targets: devastationConfig.target_sources,
        intensity: 'DEVASTATING',
        estimated_duration: '30 minutes',
        status: 'EXECUTING',
        warning: 'Maximum market disruption attack in progress'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute devastation attack'
    });
  }
});

// Get vulnerability analysis
router.get('/vietnam-gold/vulnerability-analysis', async (req, res) => {
  try {
    const prices = vietnamGoldBroker.getAllVietnameseGoldPrices();
    
    const analysis = prices.map(price => ({
      source: price.source,
      vulnerability_score: price.vulnerability_score,
      spread: price.spread,
      spread_percent: (price.spread / price.buy * 100).toFixed(2),
      attack_recommendation: price.vulnerability_score > 7 ? 'IMMEDIATE_ATTACK' : 
                           price.vulnerability_score > 5 ? 'PREPARE_ATTACK' : 'MONITOR',
      optimal_time: price.vulnerability_score > 5 ? 'NOW' : 'WAIT_FOR_OPPORTUNITY'
    }));
    
    // Sort by vulnerability score descending
    analysis.sort((a, b) => b.vulnerability_score - a.vulnerability_score);
    
    res.json({
      success: true,
      data: {
        analysis,
        highest_vulnerability: analysis[0]?.source || 'NONE',
        attack_ready_count: analysis.filter(a => a.vulnerability_score > 7).length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze vulnerabilities'
    });
  }
});

export { router as vietnamGoldBrokerRoutes };
