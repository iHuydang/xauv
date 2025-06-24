
import { Router } from 'express';
import { internationalPortfolioAccountManager } from './international-portfolio-account';

const router = Router();

// Lấy thông tin tài khoản đầu tư quốc tế
router.get('/international-portfolio/account', (req, res) => {
  try {
    const account = internationalPortfolioAccountManager.getAccount();
    
    res.json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        server: account.server,
        accountType: account.accountType,
        totalValue: account.totalValue,
        currency: account.currency,
        holdingsCount: account.holdings.size,
        isActive: account.isActive,
        lastSync: account.lastSync
      },
      message: 'Thông tin tài khoản đầu tư quốc tế'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin tài khoản'
    });
  }
});

// Lấy danh sách holdings
router.get('/international-portfolio/holdings', (req, res) => {
  try {
    const holdings = internationalPortfolioAccountManager.getAllHoldings();
    
    res.json({
      success: true,
      data: holdings,
      meta: {
        totalHoldings: holdings.length,
        totalValue: internationalPortfolioAccountManager.getPortfolioValue(),
        timestamp: new Date()
      },
      message: 'Danh sách đầu tư quốc tế'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách holdings'
    });
  }
});

// Lấy thông tin holding cụ thể
router.get('/international-portfolio/holdings/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const holding = internationalPortfolioAccountManager.getHolding(symbol);
    
    if (!holding) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy holding ${symbol}`
      });
    }
    
    res.json({
      success: true,
      data: holding,
      message: `Thông tin holding ${symbol}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin holding'
    });
  }
});

// Cập nhật số lượng cổ phiếu
router.put('/international-portfolio/holdings/:symbol/shares', (req, res) => {
  try {
    const { symbol } = req.params;
    const { shares } = req.body;
    
    if (!shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Số lượng cổ phiếu không hợp lệ'
      });
    }
    
    const updated = internationalPortfolioAccountManager.updateHoldingShares(symbol, shares);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy holding ${symbol}`
      });
    }
    
    res.json({
      success: true,
      data: internationalPortfolioAccountManager.getHolding(symbol),
      message: `Đã cập nhật ${shares} shares cho ${symbol}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật holding'
    });
  }
});

// Lấy top performers
router.get('/international-portfolio/top-performers', (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 3;
    const topPerformers = internationalPortfolioAccountManager.getTopPerformers(count);
    
    res.json({
      success: true,
      data: topPerformers,
      message: `Top ${count} performers hôm nay`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy top performers'
    });
  }
});

// Lấy worst performers
router.get('/international-portfolio/worst-performers', (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 3;
    const worstPerformers = internationalPortfolioAccountManager.getWorstPerformers(count);
    
    res.json({
      success: true,
      data: worstPerformers,
      message: `Worst ${count} performers hôm nay`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy worst performers'
    });
  }
});

// Lấy metrics đa dạng hóa
router.get('/international-portfolio/diversification', (req, res) => {
  try {
    const metrics = internationalPortfolioAccountManager.getDiversificationMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'Metrics đa dạng hóa danh mục'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tính toán metrics đa dạng hóa'
    });
  }
});

// Thêm holding mới
router.post('/international-portfolio/holdings', (req, res) => {
  try {
    const {
      symbol,
      name,
      market,
      type,
      shares,
      currentPrice,
      currency
    } = req.body;
    
    if (!symbol || !name || !market || !type || !shares || !currentPrice || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bắt buộc'
      });
    }
    
    const newHolding = {
      symbol,
      name,
      market,
      type: type as 'ETF' | 'INDEX',
      shares,
      currentPrice,
      marketValue: shares * currentPrice,
      currency,
      dailyChange: 0,
      dailyChangePercent: 0
    };
    
    internationalPortfolioAccountManager.addHolding(newHolding);
    
    res.json({
      success: true,
      data: newHolding,
      message: `Đã thêm holding ${symbol}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi thêm holding'
    });
  }
});

// Xóa holding
router.delete('/international-portfolio/holdings/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const removed = internationalPortfolioAccountManager.removeHolding(symbol);
    
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy holding ${symbol}`
      });
    }
    
    res.json({
      success: true,
      message: `Đã xóa holding ${symbol}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xóa holding'
    });
  }
});

// Báo cáo hiệu suất real-time
router.get('/international-portfolio/performance', (req, res) => {
  try {
    const account = internationalPortfolioAccountManager.getAccount();
    const holdings = internationalPortfolioAccountManager.getAllHoldings();
    
    const totalGainLoss = holdings.reduce((sum, holding) => 
      sum + (holding.dailyChange * holding.shares), 0);
    
    const performancePercent = (totalGainLoss / account.totalValue) * 100;
    
    const marketBreakdown = holdings.reduce((acc, holding) => {
      if (!acc[holding.market]) {
        acc[holding.market] = { value: 0, change: 0 };
      }
      acc[holding.market].value += holding.marketValue;
      acc[holding.market].change += holding.dailyChange * holding.shares;
      return acc;
    }, {} as any);
    
    res.json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        totalValue: account.totalValue,
        dailyGainLoss: totalGainLoss,
        performancePercent,
        marketBreakdown,
        lastUpdate: account.lastSync
      },
      message: 'Báo cáo hiệu suất tài khoản đầu tư quốc tế'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo báo cáo hiệu suất'
    });
  }
});

export default router;
