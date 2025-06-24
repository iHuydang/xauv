
import express from 'express';
import { sjcNewsPropagationSystem } from './sjc-news-propagation';

const router = express.Router();

// Tạo tin tức bán vàng thủ công
router.post('/news-propagation/generate', async (req, res) => {
  try {
    const { 
      goldWeight = 2.5, 
      sellPrice = 75000000, 
      location 
    } = req.body;
    
    console.log(`📰 API: Tạo tin tức bán vàng ${goldWeight} tael`);
    
    await sjcNewsPropagationSystem.manualNewsGeneration(
      goldWeight * 37.5, // Convert to grams
      sellPrice,
      location
    );
    
    res.json({
      success: true,
      data: {
        goldWeight: goldWeight,
        sellPrice: sellPrice,
        location: location || 'Ngẫu nhiên',
        message: 'Tin tức bán vàng đã được phát tán',
        targets: [
          'goonus.io',
          'cafef.vn', 
          'vneconomy.vn',
          'dantri.com.vn',
          'thanhnien.vn',
          'tuoitre.vn'
        ]
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi tạo tin tức bán vàng',
      message: error.message
    });
  }
});

// Kích hoạt tin tức bán vàng hàng loạt
router.post('/news-propagation/mass-selling', async (req, res) => {
  try {
    const { count = 5, intensity = 'medium' } = req.body;
    
    console.log(`🌊 API: Kích hoạt ${count} tin tức bán vàng hàng loạt`);
    
    await sjcNewsPropagationSystem.triggerMassSellingNews(count);
    
    res.json({
      success: true,
      data: {
        news_count: count,
        intensity,
        message: `Đã phát tán ${count} tin tức bán vàng`,
        expected_impact: 'Tạo áp lực tâm lý bearish trên thị trường',
        distribution: 'Đã gửi đến tất cả các trang tin tức vàng'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi phát tán tin tức hàng loạt'
    });
  }
});

// Backup endpoint cho các trang web gửi tin
router.post('/news-propagation/backup', async (req, res) => {
  try {
    const { target_site, news_content, propagation_type } = req.body;
    
    console.log(`🔄 Backup propagation to: ${target_site}`);
    
    // Log the backup attempt
    console.log('📄 News content:', JSON.stringify(news_content, null, 2));
    
    res.json({
      success: true,
      message: 'Backup propagation logged',
      target: target_site,
      type: propagation_type
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Backup propagation failed'
    });
  }
});

// Webhook endpoint
router.post('/webhooks/news-distribution', async (req, res) => {
  try {
    const { site, event, data } = req.body;
    
    console.log(`🎣 Webhook: ${event} for ${site}`);
    console.log('📊 Data:', JSON.stringify(data, null, 2));
    
    res.json({
      success: true,
      message: 'Webhook processed',
      site,
      event
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// Lấy tin tức gần đây
router.get('/news-propagation/recent', async (req, res) => {
  try {
    const recentNews = sjcNewsPropagationSystem.getRecentNews();
    
    res.json({
      success: true,
      data: {
        count: recentNews.length,
        news: recentNews
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi lấy tin tức'
    });
  }
});

// Test endpoint để gửi tin mẫu
router.post('/news-propagation/test', async (req, res) => {
  try {
    const testNews = {
      goldWeight: 2.5,
      sellPrice: 74800000,
      location: 'Quận 1, TP.HCM'
    };
    
    console.log('🧪 Test: Gửi tin tức mẫu');
    
    await sjcNewsPropagationSystem.manualNewsGeneration(
      testNews.goldWeight * 37.5,
      testNews.sellPrice,
      testNews.location
    );
    
    res.json({
      success: true,
      data: {
        message: 'Tin tức test đã được gửi',
        test_data: testNews,
        note: 'Kiểm tra console để xem kết quả'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test thất bại'
    });
  }
});

export default router;
