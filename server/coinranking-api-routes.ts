import express from 'express';
import { coinrankingMarketMaker } from './coinranking-market-maker';

const router = express.Router();

// Get market maker status and overview
router.get('/coinranking/status', async (req, res) => {
  try {
    const status = coinrankingMarketMaker.getMarketStatus();
    const prices = coinrankingMarketMaker.getCurrentPrices();
    const orders = coinrankingMarketMaker.getActiveOrders();
    const positions = coinrankingMarketMaker.getPositions();
    
    // Convert positions Map to object for JSON response
    const positionsObj = Object.fromEntries(positions);
    
    res.json({
      success: true,
      data: {
        status,
        market_data: {
          assets_monitored: prices.length,
          active_orders: orders.length,
          open_positions: positions.size,
          positions: positionsObj
        },
        recent_prices: prices.slice(0, 10), // Latest 10 prices
        performance: {
          total_exposure: status.totalExposure,
          market_making_active: status.marketMakingActive,
          connection_status: status.connected ? 'connected' : 'disconnected'
        },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get market maker status'
    });
  }
});

// Get real-time gold market analysis
router.get('/coinranking/gold/analysis', async (req, res) => {
  try {
    const prices = coinrankingMarketMaker.getCurrentPrices();
    const goldAssets = prices.filter(asset => 
      asset.symbol.includes('GOLD') || 
      asset.name.toLowerCase().includes('gold') ||
      asset.symbol === 'BTC' || // Bitcoin as digital gold
      asset.symbol === 'ETH'    // Ethereum as comparison
    );
    
    if (goldAssets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No gold-related assets currently tracked'
      });
    }
    
    // Calculate gold market metrics
    const btc = goldAssets.find(a => a.symbol === 'BTC');
    const totalGoldMarketCap = goldAssets.reduce((sum, asset) => sum + asset.marketCap, 0);
    const avgGoldVolatility = goldAssets.reduce((sum, asset) => sum + Math.abs(asset.change), 0) / goldAssets.length;
    
    // Gold market analysis
    const goldAnalysis = {
      total_assets: goldAssets.length,
      total_market_cap: totalGoldMarketCap,
      average_volatility: avgGoldVolatility,
      btc_dominance: btc ? (btc.marketCap / totalGoldMarketCap * 100) : 0,
      market_sentiment: avgGoldVolatility > 5 ? 'volatile' : avgGoldVolatility > 2 ? 'active' : 'stable',
      arbitrage_opportunities: goldAssets.filter(a => Math.abs(a.change) > 3).length,
      vietnam_gold_equivalent: btc ? {
        btc_price_usd: btc.price,
        vietnam_estimate: btc.price * 24500, // Rough VND conversion
        sjc_comparison: 'Real-time comparison với SJC cần API riêng'
      } : null
    };
    
    res.json({
      success: true,
      data: {
        analysis: goldAnalysis,
        gold_assets: goldAssets,
        market_maker_focus: 'gold_markets',
        recommendations: {
          high_volatility_assets: goldAssets.filter(a => Math.abs(a.change) > 5),
          arbitrage_candidates: goldAssets.filter(a => Math.abs(a.change) > 3),
          stable_assets: goldAssets.filter(a => Math.abs(a.change) < 1)
        },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze gold markets'
    });
  }
});

// Start market making operations
router.post('/coinranking/market-maker/start', async (req, res) => {
  try {
    coinrankingMarketMaker.startMarketMaking();
    
    res.json({
      success: true,
      data: {
        status: 'market_making_started',
        message: 'Coinranking Market Maker đã bắt đầu hoạt động',
        focus: 'gold_market_operations',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start market making'
    });
  }
});

// Stop market making operations
router.post('/coinranking/market-maker/stop', async (req, res) => {
  try {
    coinrankingMarketMaker.stopMarketMaking();
    
    res.json({
      success: true,
      data: {
        status: 'market_making_stopped',
        message: 'Coinranking Market Maker đã dừng hoạt động',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop market making'
    });
  }
});

// Update market maker configuration
router.post('/coinranking/market-maker/config', async (req, res) => {
  try {
    const { spread, orderSize, maxExposure, riskLimit, goldFocused } = req.body;
    
    const newConfig: any = {};
    if (spread !== undefined) newConfig.spread = parseFloat(spread);
    if (orderSize !== undefined) newConfig.orderSize = parseFloat(orderSize);
    if (maxExposure !== undefined) newConfig.maxExposure = parseFloat(maxExposure);
    if (riskLimit !== undefined) newConfig.riskLimit = parseFloat(riskLimit);
    if (goldFocused !== undefined) newConfig.goldFocused = Boolean(goldFocused);
    
    coinrankingMarketMaker.updateConfig(newConfig);
    
    res.json({
      success: true,
      data: {
        message: 'Cấu hình Market Maker đã được cập nhật',
        updated_config: newConfig,
        current_status: coinrankingMarketMaker.getMarketStatus(),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update market maker configuration'
    });
  }
});

// Get active orders
router.get('/coinranking/orders', async (req, res) => {
  try {
    const orders = coinrankingMarketMaker.getActiveOrders();
    const prices = coinrankingMarketMaker.getCurrentPrices();
    
    // Enhance orders with current market data
    const enhancedOrders = orders.map(order => {
      const currentAsset = prices.find(p => p.uuid === order.assetUuid);
      return {
        ...order,
        current_price: currentAsset?.price || 0,
        price_difference: currentAsset ? 
          ((currentAsset.price - order.price) / order.price * 100).toFixed(2) + '%' : 'N/A',
        market_value: order.quantity * (currentAsset?.price || order.price),
        age_minutes: Math.floor((Date.now() - order.timestamp) / 60000)
      };
    });
    
    res.json({
      success: true,
      data: {
        orders: enhancedOrders,
        summary: {
          total_orders: orders.length,
          buy_orders: orders.filter(o => o.side === 'buy').length,
          sell_orders: orders.filter(o => o.side === 'sell').length,
          pending_orders: orders.filter(o => o.status === 'pending').length,
          total_value: enhancedOrders.reduce((sum, o) => sum + o.market_value, 0)
        },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get active orders'
    });
  }
});

// Get current positions
router.get('/coinranking/positions', async (req, res) => {
  try {
    const positions = coinrankingMarketMaker.getPositions();
    const prices = coinrankingMarketMaker.getCurrentPrices();
    
    const positionDetails = Array.from(positions.entries()).map(([uuid, quantity]) => {
      const asset = prices.find(p => p.uuid === uuid);
      const marketValue = quantity * (asset?.price || 0);
      
      return {
        asset_uuid: uuid,
        symbol: asset?.symbol || 'UNKNOWN',
        name: asset?.name || 'Unknown Asset',
        quantity,
        current_price: asset?.price || 0,
        market_value: marketValue,
        change_24h: asset?.change || 0,
        position_type: quantity > 0 ? 'long' : 'short',
        position_size: Math.abs(quantity),
        unrealized_pnl: 'Calculation requires entry price history'
      };
    }).filter(pos => pos.quantity !== 0);
    
    const totalExposure = positionDetails.reduce((sum, pos) => sum + Math.abs(pos.market_value), 0);
    
    res.json({
      success: true,
      data: {
        positions: positionDetails,
        summary: {
          total_positions: positionDetails.length,
          long_positions: positionDetails.filter(p => p.quantity > 0).length,
          short_positions: positionDetails.filter(p => p.quantity < 0).length,
          total_exposure: totalExposure,
          largest_position: positionDetails.reduce((max, pos) => 
            Math.abs(pos.market_value) > Math.abs(max.market_value) ? pos : max, 
            { market_value: 0 }
          )
        },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get positions'
    });
  }
});

// Get real-time prices for specific assets
router.get('/coinranking/prices/:symbols?', async (req, res) => {
  try {
    const { symbols } = req.params;
    let prices = coinrankingMarketMaker.getCurrentPrices();
    
    // Filter by symbols if provided
    if (symbols) {
      const symbolList = symbols.toUpperCase().split(',');
      prices = prices.filter(price => symbolList.includes(price.symbol));
    }
    
    // Sort by market cap descending
    prices.sort((a, b) => b.marketCap - a.marketCap);
    
    res.json({
      success: true,
      data: {
        prices,
        count: prices.length,
        market_summary: {
          total_market_cap: prices.reduce((sum, p) => sum + p.marketCap, 0),
          average_change: prices.reduce((sum, p) => sum + p.change, 0) / prices.length,
          positive_performers: prices.filter(p => p.change > 0).length,
          negative_performers: prices.filter(p => p.change < 0).length
        },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get current prices'
    });
  }
});

// Execute manual trade order
router.post('/coinranking/trade', async (req, res) => {
  try {
    const { symbol, side, quantity, price, orderType = 'market' } = req.body;
    
    if (!symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: symbol, side, quantity'
      });
    }
    
    const prices = coinrankingMarketMaker.getCurrentPrices();
    const asset = prices.find(p => p.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: `Asset ${symbol} not found or not currently tracked`
      });
    }
    
    // Simulate trade execution (in real implementation, this would place actual orders)
    const executionPrice = price || asset.price;
    const tradeValue = quantity * executionPrice;
    
    const tradeResult = {
      trade_id: 'MANUAL_' + Date.now(),
      symbol: asset.symbol,
      side,
      quantity: parseFloat(quantity),
      execution_price: executionPrice,
      trade_value: tradeValue,
      market_price: asset.price,
      slippage: ((executionPrice - asset.price) / asset.price * 100).toFixed(4) + '%',
      order_type: orderType,
      status: 'executed',
      timestamp: Date.now(),
      note: 'Simulated execution via Coinranking Market Maker'
    };
    
    res.json({
      success: true,
      data: {
        trade: tradeResult,
        market_impact: {
          asset_liquidity: asset.volume,
          trade_size_ratio: (tradeValue / asset.volume * 100).toFixed(4) + '%',
          estimated_impact: tradeValue > asset.volume * 0.01 ? 'high' : 'low'
        },
        message: `Lệnh ${side} ${symbol} đã được thực hiện`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute trade'
    });
  }
});

// Get market maker performance metrics
router.get('/coinranking/performance', async (req, res) => {
  try {
    const status = coinrankingMarketMaker.getMarketStatus();
    const orders = coinrankingMarketMaker.getActiveOrders();
    const positions = coinrankingMarketMaker.getPositions();
    const prices = coinrankingMarketMaker.getCurrentPrices();
    
    // Calculate performance metrics
    const totalOrderValue = orders.reduce((sum, order) => {
      const asset = prices.find(p => p.uuid === order.assetUuid);
      return sum + (order.quantity * (asset?.price || order.price));
    }, 0);
    
    const goldAssets = prices.filter(p => 
      p.symbol === 'BTC' || 
      p.symbol.includes('GOLD') || 
      p.name.toLowerCase().includes('gold')
    );
    
    const performance = {
      market_maker_status: status.marketMakingActive ? 'active' : 'inactive',
      connection_uptime: status.connected ? 'stable' : 'disconnected',
      portfolio_metrics: {
        total_exposure: status.totalExposure,
        active_positions: positions.size,
        pending_orders: orders.filter(o => o.status === 'pending').length,
        total_order_value: totalOrderValue
      },
      gold_market_focus: {
        gold_assets_tracked: goldAssets.length,
        avg_gold_volatility: goldAssets.length > 0 ? 
          goldAssets.reduce((sum, a) => sum + Math.abs(a.change), 0) / goldAssets.length : 0,
        btc_price: goldAssets.find(a => a.symbol === 'BTC')?.price || 0
      },
      risk_metrics: {
        risk_limit: status.config.riskLimit,
        max_exposure: status.config.maxExposure,
        current_exposure_ratio: status.totalExposure / status.config.maxExposure,
        risk_status: status.totalExposure > status.config.maxExposure * 0.8 ? 'high' : 'normal'
      }
    };
    
    res.json({
      success: true,
      data: {
        performance,
        recommendations: {
          risk_management: performance.risk_metrics.risk_status === 'high' ? 
            'Consider reducing positions' : 'Risk levels normal',
          market_opportunities: goldAssets.filter(a => Math.abs(a.change) > 3).length > 0 ? 
            'High volatility detected in gold markets' : 'Markets stable',
          action_required: !status.marketMakingActive ? 
            'Start market making to begin operations' : 'System operating normally'
        },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

export default router;