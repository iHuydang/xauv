import express from 'express';
import { accountManager } from './account-manager';
import { realForexWebSocketManager } from './real-forex-websocket';
import { enhancedAntiSecBotSystem } from './enhanced-anti-secbot';
import { multiBrokerWebSocketManager } from './multi-broker-websocket';

const router = express.Router();

// Get real-time forex prices from multiple sources
router.get('/forex/prices', async (req, res) => {
  try {
    const prices = realForexWebSocketManager.getCurrentPrices();
    const connectionStatus = realForexWebSocketManager.getConnectionStatus();
    
    res.json({
      success: true,
      data: {
        prices,
        connectionStatus,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get forex prices'
    });
  }
});

// Get specific symbol price
router.get('/forex/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = realForexWebSocketManager.getLatestPrice(symbol);
    
    if (price) {
      res.json({
        success: true,
        data: price
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Symbol not found or no recent data'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get symbol price'
    });
  }
});

// Get anti-secbot system status
router.get('/secbot/status', async (req, res) => {
  try {
    const status = enhancedAntiSecBotSystem.getBypassStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get secbot status'
    });
  }
});

// Test broker connection with anti-secbot protection
router.post('/broker/test-connection', async (req, res) => {
  try {
    const { broker } = req.body;
    
    if (!broker) {
      return res.status(400).json({
        success: false,
        error: 'Broker parameter is required'
      });
    }
    
    const testResult = await enhancedAntiSecBotSystem.testConnection(broker);
    
    res.json({
      success: true,
      data: {
        broker,
        connected: testResult,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Connection test failed'
    });
  }
});

// Get multi-broker connection status
router.get('/brokers/status', async (req, res) => {
  try {
    const status = multiBrokerWebSocketManager.getConnectionStatus();
    
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

// Execute trade through multi-broker system
router.post('/trade/execute', async (req, res) => {
  try {
    const { broker, symbol, side, quantity, type = 'market', price } = req.body;
    
    if (!broker || !symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: broker, symbol, side, quantity'
      });
    }
    
    const order = {
      symbol,
      side,
      quantity,
      type,
      price
    };
    
    const result = await multiBrokerWebSocketManager.placeOrder(broker, order);
    
    if (result) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to execute trade'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Trade execution failed'
    });
  }
});

// Get account information with real market data
router.get('/accounts', async (req, res) => {
  try {
    const accounts = accountManager.getAllAccounts();
    const connectionStatus = realForexWebSocketManager.getConnectionStatus();
    const currentPrices = realForexWebSocketManager.getCurrentPrices();
    
    res.json({
      success: true,
      data: {
        accounts,
        forexConnections: connectionStatus,
        marketData: currentPrices,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get account information'
    });
  }
});

// Get specific account with real-time updates
router.get('/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = accountManager.getAccount(accountId);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }
    
    // Get latest forex prices for account currency pairs
    const relevantPrices = realForexWebSocketManager.getCurrentPrices()
      .filter(price => price.symbol.includes(account.currency));
    
    res.json({
      success: true,
      data: {
        account,
        marketData: relevantPrices,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get account details'
    });
  }
});

// Start enhanced forex system
router.post('/system/start', async (req, res) => {
  try {
    // Start real forex connections
    await realForexWebSocketManager.startRealConnections();
    
    // Start multi-broker connections
    await multiBrokerWebSocketManager.startAllConnections();
    
    res.json({
      success: true,
      message: 'Enhanced forex system started successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start enhanced forex system'
    });
  }
});

// Stop enhanced forex system
router.post('/system/stop', async (req, res) => {
  try {
    await realForexWebSocketManager.stopAllConnections();
    await multiBrokerWebSocketManager.stopAllConnections();
    
    res.json({
      success: true,
      message: 'Enhanced forex system stopped successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop enhanced forex system'
    });
  }
});

// Get arbitrage opportunities
router.get('/arbitrage/opportunities', async (req, res) => {
  try {
    const prices = realForexWebSocketManager.getCurrentPrices();
    const opportunities = [];
    
    // Group prices by symbol
    const pricesBySymbol = new Map();
    prices.forEach(price => {
      if (!pricesBySymbol.has(price.symbol)) {
        pricesBySymbol.set(price.symbol, []);
      }
      pricesBySymbol.get(price.symbol).push(price);
    });
    
    // Find arbitrage opportunities
    pricesBySymbol.forEach((symbolPrices, symbol) => {
      if (symbolPrices.length >= 2) {
        const bestBid = Math.max(...symbolPrices.map(p => p.bid));
        const bestAsk = Math.min(...symbolPrices.map(p => p.ask));
        const spread = bestBid - bestAsk;
        
        if (spread > 0.0003) { // 3 pips minimum
          const bidProvider = symbolPrices.find(p => p.bid === bestBid);
          const askProvider = symbolPrices.find(p => p.ask === bestAsk);
          
          opportunities.push({
            symbol,
            buyPrice: bestAsk,
            sellPrice: bestBid,
            spread,
            profit: spread,
            buyProvider: askProvider?.source,
            sellProvider: bidProvider?.source,
            profitPips: (spread * 10000).toFixed(1)
          });
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        opportunities,
        totalOpportunities: opportunities.length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get arbitrage opportunities'
    });
  }
});

// Execute arbitrage trade
router.post('/arbitrage/execute', async (req, res) => {
  try {
    const { symbol, buyProvider, sellProvider, volume = 0.01 } = req.body;
    
    if (!symbol || !buyProvider || !sellProvider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: symbol, buyProvider, sellProvider'
      });
    }
    
    const currentPrice = realForexWebSocketManager.getLatestPrice(symbol);
    if (!currentPrice) {
      return res.status(404).json({
        success: false,
        error: 'Current price not available for symbol'
      });
    }
    
    // Simulate arbitrage execution
    const profit = Math.random() * 0.001; // Simulated profit
    const accounts = accountManager.getActiveAccounts();
    
    if (accounts.length > 0) {
      const account = accounts[0];
      
      // Update account with arbitrage profit
      const profitAmount = profit * volume * 100000; // Convert to currency amount
      account.equity += profitAmount;
      account.balance += profitAmount;
      account.lastSync = new Date();
      
      res.json({
        success: true,
        data: {
          symbol,
          volume,
          profit: profitAmount,
          account: account.accountNumber,
          timestamp: Date.now()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No active accounts available for arbitrage'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Arbitrage execution failed'
    });
  }
});

export default router;