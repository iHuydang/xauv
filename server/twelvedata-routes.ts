import express from 'express';
import { twelveDataIntegration } from './twelvedata-integration';
import { twelveDataAdvancedAnalytics } from './twelvedata-advanced-analytics';

const router = express.Router();

// Get all available exchanges
router.get('/twelvedata/exchanges', (req, res) => {
  try {
    const type = req.query.type as 'stock' | 'crypto' | undefined;
    const exchanges = twelveDataIntegration.getExchanges(type);
    
    res.json({
      success: true,
      data: {
        exchanges,
        total_count: exchanges.length,
        type: type || 'all'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get exchanges'
    });
  }
});

// Get forex pairs
router.get('/twelvedata/forex-pairs', (req, res) => {
  try {
    const forexPairs = twelveDataIntegration.getForexPairs();
    
    res.json({
      success: true,
      data: {
        forex_pairs: forexPairs,
        total_count: forexPairs.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get forex pairs'
    });
  }
});

// Get crypto pairs
router.get('/twelvedata/crypto-pairs', (req, res) => {
  try {
    const cryptoPairs = twelveDataIntegration.getCryptoPairs();
    
    res.json({
      success: true,
      data: {
        crypto_pairs: cryptoPairs,
        total_count: cryptoPairs.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get crypto pairs'
    });
  }
});

// Get real-time price for a symbol
router.get('/twelvedata/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    const priceData = await twelveDataIntegration.getRealTimePrice(symbol.toUpperCase());
    
    if (!priceData) {
      return res.status(404).json({
        success: false,
        error: `Price data not found for symbol: ${symbol}`
      });
    }

    res.json({
      success: true,
      data: priceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get price for ${req.params.symbol}`
    });
  }
});

// Get time series data
router.get('/twelvedata/time-series/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1min', outputsize = '30' } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required'
      });
    }

    const timeSeriesData = await twelveDataIntegration.getTimeSeries(
      symbol.toUpperCase(),
      interval as string,
      parseInt(outputsize as string)
    );
    
    if (!timeSeriesData) {
      return res.status(404).json({
        success: false,
        error: `Time series data not found for symbol: ${symbol}`
      });
    }

    res.json({
      success: true,
      data: timeSeriesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get time series for ${req.params.symbol}`
    });
  }
});

// Subscribe to real-time data
router.post('/twelvedata/subscribe', (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Symbols array is required'
      });
    }

    const results = symbols.map(symbol => ({
      symbol,
      subscribed: twelveDataIntegration.subscribeToSymbol(symbol.toUpperCase())
    }));

    const successCount = results.filter(r => r.subscribed).length;

    res.json({
      success: true,
      data: {
        subscription_results: results,
        success_count: successCount,
        total_requested: symbols.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to symbols'
    });
  }
});

// Unsubscribe from real-time data
router.post('/twelvedata/unsubscribe', (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Symbols array is required'
      });
    }

    const results = symbols.map(symbol => ({
      symbol,
      unsubscribed: twelveDataIntegration.unsubscribeFromSymbol(symbol.toUpperCase())
    }));

    const successCount = results.filter(r => r.unsubscribed).length;

    res.json({
      success: true,
      data: {
        unsubscription_results: results,
        success_count: successCount,
        total_requested: symbols.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from symbols'
    });
  }
});

// Get current market data cache
router.get('/twelvedata/market-data', (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (symbol) {
      const data = twelveDataIntegration.getMarketData(symbol as string);
      if (!data) {
        return res.status(404).json({
          success: false,
          error: `No market data found for symbol: ${symbol}`
        });
      }
      
      res.json({
        success: true,
        data: data
      });
    } else {
      const allData = twelveDataIntegration.getMarketData() as Map<string, any>;
      const dataArray = Array.from(allData.values());
      
      res.json({
        success: true,
        data: {
          market_data: dataArray,
          total_symbols: dataArray.length
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get market data'
    });
  }
});

// Get subscribed symbols
router.get('/twelvedata/subscriptions', (req, res) => {
  try {
    const subscribedSymbols = twelveDataIntegration.getSubscribedSymbols();
    
    res.json({
      success: true,
      data: {
        subscribed_symbols: subscribedSymbols,
        total_count: subscribedSymbols.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get subscriptions'
    });
  }
});

// Get connection status
router.get('/twelvedata/status', (req, res) => {
  try {
    const status = twelveDataIntegration.getConnectionStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get connection status'
    });
  }
});

// Get technical indicators
router.get('/twelvedata/indicators/:indicator/:symbol', async (req, res) => {
  try {
    const { indicator, symbol } = req.params;
    const { interval = '1day' } = req.query;
    
    if (!indicator || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Indicator and symbol are required'
      });
    }

    const indicatorData = await twelveDataIntegration.getTechnicalIndicators(
      symbol.toUpperCase(),
      indicator.toUpperCase(),
      interval as string
    );
    
    if (!indicatorData) {
      return res.status(404).json({
        success: false,
        error: `Technical indicator data not found for ${indicator}/${symbol}`
      });
    }

    res.json({
      success: true,
      data: indicatorData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get ${req.params.indicator} for ${req.params.symbol}`
    });
  }
});

// Integration commands
router.post('/twelvedata/integrate/gold-system', (req, res) => {
  try {
    twelveDataIntegration.integrateWithGoldAttackSystem();
    
    res.json({
      success: true,
      message: 'TwelveData integrated with gold attack system',
      subscribed_symbols: ['XAUUSD', 'XAUEUR', 'XAUJPY', 'XAUGBP']
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to integrate with gold system'
    });
  }
});

router.post('/twelvedata/integrate/forex-system', (req, res) => {
  try {
    twelveDataIntegration.integrateWithForexSystem();
    
    res.json({
      success: true,
      message: 'TwelveData integrated with forex system',
      subscribed_symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD']
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to integrate with forex system'
    });
  }
});

// Advanced search endpoints
router.get('/twelvedata/search/forex', (req, res) => {
  try {
    const { base, quote } = req.query;
    const forexPairs = twelveDataIntegration.getForexPairs();
    
    let filteredPairs = forexPairs;
    
    if (base) {
      filteredPairs = filteredPairs.filter(pair => 
        pair.currency_base.toLowerCase() === (base as string).toLowerCase()
      );
    }
    
    if (quote) {
      filteredPairs = filteredPairs.filter(pair => 
        pair.currency_quote.toLowerCase() === (quote as string).toLowerCase()
      );
    }
    
    res.json({
      success: true,
      data: {
        forex_pairs: filteredPairs,
        total_count: filteredPairs.length,
        filters: { base, quote }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search forex pairs'
    });
  }
});

router.get('/twelvedata/search/crypto', (req, res) => {
  try {
    const { base, quote, exchange } = req.query;
    const cryptoPairs = twelveDataIntegration.getCryptoPairs();
    
    let filteredPairs = cryptoPairs;
    
    if (base) {
      filteredPairs = filteredPairs.filter(pair => 
        pair.currency_base.toLowerCase() === (base as string).toLowerCase()
      );
    }
    
    if (quote) {
      filteredPairs = filteredPairs.filter(pair => 
        pair.currency_quote.toLowerCase() === (quote as string).toLowerCase()
      );
    }
    
    if (exchange) {
      filteredPairs = filteredPairs.filter(pair => 
        pair.exchange.toLowerCase() === (exchange as string).toLowerCase()
      );
    }
    
    res.json({
      success: true,
      data: {
        crypto_pairs: filteredPairs,
        total_count: filteredPairs.length,
        filters: { base, quote, exchange }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search crypto pairs'
    });
  }
});

// Advanced Analytics Routes
router.get('/twelvedata/analytics/technical/:symbol?', (req, res) => {
  try {
    const { symbol } = req.params;
    const analysis = twelveDataAdvancedAnalytics.getTechnicalAnalysis(symbol?.toUpperCase());
    
    if (symbol && !analysis) {
      return res.status(404).json({
        success: false,
        error: `No technical analysis found for ${symbol}`
      });
    }

    res.json({
      success: true,
      data: analysis instanceof Map ? Array.from(analysis.values()) : analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get technical analysis'
    });
  }
});

router.get('/twelvedata/analytics/alerts', (req, res) => {
  try {
    const alerts = twelveDataAdvancedAnalytics.getActiveAlerts();
    
    res.json({
      success: true,
      data: {
        alerts,
        total_count: alerts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

router.get('/twelvedata/analytics/arbitrage', (req, res) => {
  try {
    const opportunities = twelveDataAdvancedAnalytics.getArbitrageOpportunities();
    
    res.json({
      success: true,
      data: {
        opportunities,
        total_count: opportunities.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get arbitrage opportunities'
    });
  }
});

router.get('/twelvedata/analytics/status', (req, res) => {
  try {
    const status = twelveDataAdvancedAnalytics.getAnalyticsStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics status'
    });
  }
});

router.delete('/twelvedata/analytics/alerts', (req, res) => {
  try {
    twelveDataAdvancedAnalytics.clearAlerts();
    
    res.json({
      success: true,
      message: 'All alerts cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear alerts'
    });
  }
});

router.delete('/twelvedata/analytics/arbitrage', (req, res) => {
  try {
    twelveDataAdvancedAnalytics.clearArbitrageOpportunities();
    
    res.json({
      success: true,
      message: 'All arbitrage opportunities cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear arbitrage opportunities'
    });
  }
});

export default router;