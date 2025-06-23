
import express from 'express';
import { vietnamGoldTradingIntegration } from './vietnam-gold-trading-integration';
import { tradermadeIntegration } from './tradermade-integration';

const router = express.Router();

// API thực hiện lệnh mua vàng SJC
router.post('/vietnam-gold/buy', async (req, res) => {
  try {
    const { lot_size = 0.1 } = req.body;
    
    console.log(`🥇 Nhận lệnh MUA vàng SJC: ${lot_size} oz`);
    
    const order = await vietnamGoldTradingIntegration.executeTradingOrder('buy', lot_size);
    
    res.json({
      success: true,
      message: 'Lệnh mua vàng SJC đã được thực hiện',
      data: {
        order_id: order.orderId,
        type: 'MUA_VANG_SJC',
        lot_size_oz: order.lotSize,
        vietnam_gold_tael: order.vietnamGoldTael.toFixed(3),
        vietnam_gold_gram: order.vietnamGoldWeight.toFixed(2),
        price_usd: order.priceUSD,
        price_vnd: order.priceVND.toLocaleString(),
        total_vnd: (order.priceVND * order.vietnamGoldTael).toLocaleString(),
        mt5_account: order.mt5Account,
        status: order.status,
        execution_time: new Date(order.executionTime).toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Lỗi lệnh mua vàng SJC:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể thực hiện lệnh mua vàng SJC',
      details: error.message
    });
  }
});

// API thực hiện lệnh bán vàng SJC  
router.post('/vietnam-gold/sell', async (req, res) => {
  try {
    const { lot_size = 0.1 } = req.body;
    
    console.log(`🥇 Nhận lệnh BÁN vàng SJC: ${lot_size} oz`);
    
    const order = await vietnamGoldTradingIntegration.executeTradingOrder('sell', lot_size);
    
    res.json({
      success: true,
      message: 'Lệnh bán vàng SJC đã được thực hiện',
      data: {
        order_id: order.orderId,
        type: 'BAN_VANG_SJC',
        lot_size_oz: order.lotSize,
        vietnam_gold_tael: order.vietnamGoldTael.toFixed(3),
        vietnam_gold_gram: order.vietnamGoldWeight.toFixed(2),
        price_usd: order.priceUSD,
        price_vnd: order.priceVND.toLocaleString(),
        total_vnd: (order.priceVND * order.vietnamGoldTael).toLocaleString(),
        mt5_account: order.mt5Account,
        status: order.status,
        execution_time: new Date(order.executionTime).toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Lỗi lệnh bán vàng SJC:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể thực hiện lệnh bán vàng SJC',
      details: error.message
    });
  }
});

// API lấy thông tin chuyển đổi và giá hiện tại
router.get('/vietnam-gold/conversion-info', async (req, res) => {
  try {
    const { lot_size = 0.1 } = req.query;
    const lotSize = parseFloat(lot_size as string);
    
    const goldPrice = tradermadeIntegration.getCurrentPrice('XAUUSD');
    
    if (!goldPrice) {
      return res.status(404).json({
        success: false,
        error: 'Không thể lấy giá vàng hiện tại'
      });
    }
    
    const conversionInfo = vietnamGoldTradingIntegration.getConversionInfo(
      lotSize, 
      goldPrice.mid
    );
    
    res.json({
      success: true,
      data: {
        current_gold_price: {
          symbol: 'XAUUSD',
          bid: goldPrice.bid,
          ask: goldPrice.ask,
          mid: goldPrice.mid,
          spread: goldPrice.spread,
          timestamp: goldPrice.timestamp
        },
        vietnam_conversion: conversionInfo,
        trading_ready: true,
        mt5_account: '205307242',
        server: 'Exness-MT5Trial7'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy thông tin chuyển đổi'
    });
  }
});

// API lấy danh sách lệnh đã thực hiện
router.get('/vietnam-gold/orders', async (req, res) => {
  try {
    const orders = vietnamGoldTradingIntegration.getActiveOrders();
    
    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          order_id: order.orderId,
          type: order.side === 'buy' ? 'MUA_VANG_SJC' : 'BAN_VANG_SJC',
          lot_size_oz: order.lotSize,
          vietnam_gold_tael: order.vietnamGoldTael.toFixed(3),
          vietnam_gold_gram: order.vietnamGoldWeight.toFixed(2),
          price_usd: order.priceUSD,
          price_vnd: order.priceVND.toLocaleString(),
          total_vnd: (order.priceVND * order.vietnamGoldTael).toLocaleString(),
          status: order.status,
          execution_time: new Date(order.executionTime).toISOString()
        })),
        total_orders: orders.length,
        mt5_account: '205307242'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy danh sách lệnh'
    });
  }
});

// API kiểm tra trạng thái kết nối MT5
router.get('/vietnam-gold/status', async (req, res) => {
  try {
    const status = vietnamGoldTradingIntegration.getConnectionStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi kiểm tra trạng thái'
    });
  }
});

// API cập nhật tỷ giá chuyển đổi
router.post('/vietnam-gold/update-rates', async (req, res) => {
  try {
    const { usd_to_vnd, sjc_premium } = req.body;
    
    const updates: any = {};
    if (usd_to_vnd) updates.usdToVnd = usd_to_vnd;
    if (sjc_premium) updates.sjcPremium = sjc_premium;
    
    vietnamGoldTradingIntegration.updateConversionRates(updates);
    
    res.json({
      success: true,
      message: 'Đã cập nhật tỷ giá chuyển đổi',
      data: updates
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi cập nhật tỷ giá'
    });
  }
});

export default router;
