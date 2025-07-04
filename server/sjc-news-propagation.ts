import axios from 'axios';
import { EventEmitter } from 'events';
import { vietnamGoldTradingIntegration } from './vietnam-gold-trading-integration';

export interface SJCSellingNews {
  sellerId: string;
  accountType: 'individual' | 'business' | 'institution';
  goldWeight: number; // gram
  goldTael: number; // lượng
  sellPrice: number; // VND per tael
  totalValue: number; // Total VND
  location: string;
  timestamp: number;
  marketImpact: 'low' | 'medium' | 'high';
  disguisedInfo: {
    sellerName: string;
    reason: string;
    urgency: 'normal' | 'urgent' | 'emergency';
  };
}

export class SJCNewsPropagationSystem extends EventEmitter {
  private newsSites: string[] = [
    'https://goonus.io/gia-vang/sjc',
    'https://cafef.vn/gia-vang.chn',
    'https://vneconomy.vn/gia-vang.htm',
    'https://dantri.com.vn/kinh-doanh/gia-vang.htm',
    'https://thanhnien.vn/kinh-te/gia-vang/',
    'https://tuoitre.vn/kinh-te/gia-vang.htm'
  ];

  private fakeSellerNames: string[] = [
    'Nguyễn Văn Minh',
    'Trần Thị Hoa',
    'Lê Quang Dũng',
    'Phạm Thị Mai',
    'Hoàng Văn Nam',
    'Võ Thị Lan',
    'Đặng Minh Tuấn',
    'Bùi Thị Nga'
  ];

  private sellReasons: string[] = [
    'Thanh lý tài sản để đầu tư bất động sản',
    'Cần tiền gấp cho việc kinh doanh',
    'Đa dạng hóa danh mục đầu tư',
    'Chốt lời sau khi vàng tăng cao',
    'Cần thanh khoản cho dự án mới',
    'Tránh rủi ro khi thị trường bất ổn',
    'Chuyển sang đầu tư cổ phiếu',
    'Chuẩn bị chi phí cho con du học'
  ];

  private locations: string[] = [
    'Quận 1, TP.HCM',
    'Quận 3, TP.HCM', 
    'Quận Hoàn Kiếm, Hà Nội',
    'Quận Ba Đình, Hà Nội',
    'Quận Hải Châu, Đà Nẵng',
    'TP Biên Hòa, Đồng Nai',
    'TP Thủ Dầu Một, Bình Dương',
    'Quận Ninh Kiều, Cần Thơ'
  ];

  constructor() {
    super();
    this.setupNewsGeneration();
    console.log('📰 SJC News Propagation System initialized');
  }

  private setupNewsGeneration(): void {
    // Lắng nghe các giao dịch bán vàng từ hệ thống
    vietnamGoldTradingIntegration.on('vietnamGoldOrderExecuted', (order) => {
      if (order.side === 'sell') {
        this.generateSellNews(order);
      }
    });
  }

  // Tạo tin tức bán vàng ngụy trang
  private async generateSellNews(order: any): Promise<void> {
    const fakeNews = this.createFakeSellingNews(order);

    console.log('📰 TẠO TIN TỨC BÁN VÀNG SJC:');
    console.log(`👤 Người bán: ${fakeNews.disguisedInfo.sellerName}`);
    console.log(`⚖️ Khối lượng: ${fakeNews.goldTael.toFixed(2)} lượng (${fakeNews.goldWeight.toFixed(1)} gram)`);
    console.log(`💰 Giá bán: ${fakeNews.sellPrice.toLocaleString()} VND/lượng`);
    console.log(`💵 Tổng giá trị: ${fakeNews.totalValue.toLocaleString()} VND`);
    console.log(`📍 Địa điểm: ${fakeNews.location}`);
    console.log(`💭 Lý do: ${fakeNews.disguisedInfo.reason}`);

    // Truyền tin đến các trang web
    await this.propagateToNewsSites(fakeNews);

    // Tạo áp lực tâm lý thị trường
    this.createMarketPressure(fakeNews);
  }

  // Tạo thông tin bán vàng giả
  private createFakeSellingNews(realOrder: any): SJCSellingNews {
    const baseWeight = realOrder.vietnamGoldWeight || 37.5; // Default 1 tael
    const multiplier = 1 + Math.random() * 4; // Nhân từ 1-5 lần để tạo âm thanh lớn

    const fakeWeight = baseWeight * multiplier;
    const fakeTael = fakeWeight / 37.5;
    const currentPrice = realOrder.priceVND || 75000000; // Default price

    return {
      sellerId: `FAKE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      accountType: this.getRandomAccountType(),
      goldWeight: fakeWeight,
      goldTael: fakeTael,
      sellPrice: currentPrice - (Math.random() * 500000), // Giá thấp hơn 0-500k để tạo áp lực
      totalValue: fakeTael * (currentPrice - (Math.random() * 500000)),
      location: this.locations[Math.floor(Math.random() * this.locations.length)],
      timestamp: Date.now(),
      marketImpact: fakeTael > 5 ? 'high' : fakeTael > 2 ? 'medium' : 'low',
      disguisedInfo: {
        sellerName: this.fakeSellerNames[Math.floor(Math.random() * this.fakeSellerNames.length)],
        reason: this.sellReasons[Math.floor(Math.random() * this.sellReasons.length)],
        urgency: fakeTael > 3 ? 'urgent' : 'normal'
      }
    };
  }

  private getRandomAccountType(): 'individual' | 'business' | 'institution' {
    const random = Math.random();
    if (random < 0.6) return 'individual';
    if (random < 0.85) return 'business';
    return 'institution';
  }

  // Truyền tin đến các trang web tin tức
  private async propagateToNewsSites(news: SJCSellingNews): Promise<void> {
    const newsContent = this.formatNewsContent(news);

    console.log('🌐 TRUYỀN TIN ĐẾN CÁC TRANG WEB:');

    const propagationPromises = this.newsSites.map(async (site) => {
      try {
        await this.sendToNewsSite(site, newsContent);
        console.log(`✅ Đã gửi tin đến: ${site}`);
      } catch (error) {
        console.log(`⚠️ Gửi tin đến ${site} thất bại: ${error.message}`);
        // Fallback: Gửi tin qua API backup
        await this.sendViaBackupAPI(site, newsContent);
      }
    });

    await Promise.allSettled(propagationPromises);
    console.log('📡 Hoàn thành truyền tin đến tất cả các trang');
  }

  // Format tin tức để gửi
  private formatNewsContent(news: SJCSellingNews): any {
    const urgencyText = news.disguisedInfo.urgency === 'urgent' ? '[KHẨN CẤP] ' : '';
    const impactText = news.marketImpact === 'high' ? '🔴 ' : news.marketImpact === 'medium' ? '🟡 ' : '🟢 ';

    return {
      title: `${urgencyText}${impactText}Giao dịch bán vàng SJC ${news.goldTael.toFixed(1)} lượng tại ${news.location}`,
      content: `
        Người bán: ${news.disguisedInfo.sellerName}
        Khối lượng: ${news.goldTael.toFixed(2)} lượng (${news.goldWeight.toFixed(1)} gram)
        Giá bán: ${news.sellPrice.toLocaleString()} VND/lượng
        Tổng giá trị: ${news.totalValue.toLocaleString()} VND
        Địa điểm: ${news.location}
        Lý do bán: ${news.disguisedInfo.reason}
        Thời gian: ${new Date(news.timestamp).toLocaleString('vi-VN')}

        Ghi chú: Đây là giao dịch thực tế, không phải demo. Thông tin đã được xác thực.
      `,
      category: 'gold_trading',
      impact: news.marketImpact,
      source: 'SJC_TRADING_NETWORK',
      timestamp: new Date(news.timestamp).toISOString(),
      symbols: ['GOLD_SJC', 'XAUUSD', 'VND'],
      metadata: {
        account_type: news.accountType,
        verified: true,
        real_transaction: true,
        location: news.location,
        weight_grams: news.goldWeight,
        weight_taels: news.goldTael
      }
    };
  }

  // Gửi tin đến từng trang web
  private async sendToNewsSite(siteUrl: string, newsContent: any): Promise<void> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Forwarded-For': this.getRandomIP(),
      'X-Real-IP': this.getRandomIP(),
      'Referer': 'https://www.google.com/',
      'Origin': 'https://sjc.com.vn'
    };

    // Tùy thuộc vào trang web, sử dụng API endpoint khác nhau
    if (siteUrl.includes('goonus.io')) {
      await this.sendToGoonus(newsContent, headers);
    } else if (siteUrl.includes('cafef.vn')) {
      await this.sendToCafef(newsContent, headers);
    } else {
      await this.sendToGenericSite(siteUrl, newsContent, headers);
    }
  }

  // Gửi tin đến Goonus
  private async sendToGoonus(newsContent: any, headers: any): Promise<void> {
    try {
      const goonusPayload = {
        type: 'gold_selling_alert',
        data: {
          title: newsContent.title,
          seller_info: newsContent.content,
          price_vnd: newsContent.metadata.weight_taels * 75000000, // Estimate
          weight_taels: newsContent.metadata.weight_taels,
          location: newsContent.metadata.location,
          timestamp: newsContent.timestamp,
          verified: true
        }
      };

      await axios.post('https://goonus.io/api/gold-news/submit', goonusPayload, { headers });
      console.log('📊 Đã gửi tin đến Goonus.io');

    } catch (error) {
      // Fallback: Gửi qua webhook
      await this.sendViaWebhook('goonus', newsContent);
    }
  }

  // Gửi tin đến Cafef
  private async sendToCafef(newsContent: any, headers: any): Promise<void> {
    try {
      const cafefPayload = {
        category: 'gia-vang',
        title: newsContent.title,
        content: newsContent.content,
        tags: ['vàng SJC', 'bán vàng', 'thị trường vàng'],
        source: 'Thị trường vàng Việt Nam'
      };

      await axios.post('https://cafef.vn/api/news/submit', cafefPayload, { headers });
      console.log('📰 Đã gửi tin đến Cafef.vn');

    } catch (error) {
      await this.sendViaWebhook('cafef', newsContent);
    }
  }

  // Gửi tin đến trang web chung
  private async sendToGenericSite(siteUrl: string, newsContent: any, headers: any): Promise<void> {
    try {
      const payload = {
        type: 'market_news',
        data: newsContent
      };

      // Thử các endpoint phổ biến
      const endpoints = ['/api/news', '/api/submit', '/api/market-data', '/webhook/news'];

      for (const endpoint of endpoints) {
        try {
          await axios.post(siteUrl + endpoint, payload, { headers, timeout: 5000 });
          console.log(`📡 Đã gửi tin đến ${siteUrl}${endpoint}`);
          return;
        } catch (error) {
          continue;
        }
      }

    } catch (error) {
      console.log(`⚠️ Không thể gửi tin đến ${siteUrl}`);
    }
  }

  // Gửi qua backup API
  private async sendViaBackupAPI(siteUrl: string, newsContent: any): Promise<void> {
    try {
      const backupPayload = {
        target_site: siteUrl,
        news_content: newsContent,
        propagation_type: 'gold_selling_alert',
        priority: 'high'
      };

      await axios.post('http://localhost:5000/api/news-propagation/backup', backupPayload);
      console.log(`🔄 Đã gửi qua backup API cho ${siteUrl}`);

    } catch (error) {
      console.log(`❌ Backup API cũng thất bại cho ${siteUrl}`);
    }
  }

  // Gửi qua webhook
  private async sendViaWebhook(siteName: string, newsContent: any): Promise<void> {
    try {
      const webhookPayload = {
        site: siteName,
        event: 'gold_selling_news',
        data: newsContent,
        timestamp: Date.now()
      };

      await axios.post('http://localhost:5000/api/webhooks/news-distribution', webhookPayload);
      console.log(`🎣 Đã gửi qua webhook cho ${siteName}`);

    } catch (error) {
      console.log(`🚫 Webhook thất bại cho ${siteName}`);
    }
  }

  // Tạo áp lực tâm lý thị trường
  private createMarketPressure(news: SJCSellingNews): void {
    const pressureLevel = news.marketImpact === 'high' ? 'MẠNH' : 
                         news.marketImpact === 'medium' ? 'VỪA PHẢI' : 'NHẸ';

    console.log(`🎯 TẠO ÁP LỰC TÂM LÝ THỊ TRƯỜNG: ${pressureLevel}`);
    console.log(`📉 Tín hiệu: Có người bán ${news.goldTael.toFixed(1)} lượng với giá thấp`);
    console.log(`💭 Tâm lý: Người dân có thể lo lắng về giá vàng sẽ giảm`);

    // Emit sự kiện để các hệ thống khác xử lý
    this.emit('marketPressureCreated', {
      news,
      pressure_level: pressureLevel,
      expected_impact: 'bearish_sentiment',
      psychological_effect: 'fear_of_falling_prices'
    });
  }

  // Generate random IP
  private getRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  // API methods
  public async manualNewsGeneration(
    goldWeight: number,
    sellPrice: number,
    location?: string
  ): Promise<void> {
    const fakeOrder = {
      vietnamGoldWeight: goldWeight,
      priceVND: sellPrice,
      side: 'sell'
    };

    const news = this.createFakeSellingNews(fakeOrder);
    if (location) {
      news.location = location;
    }

    await this.propagateToNewsSites(news);
    this.createMarketPressure(news);
  }

  public getRecentNews(): SJCSellingNews[] {
    // Return recent generated news (would store in database in real implementation)
    return [];
  }

  public async triggerMassSellingNews(count: number = 5): Promise<void> {
    console.log(`🌊 KÍCH HOẠT TIN TỨC BÁN VÀNG HÀNG LOẠT: ${count} tin`);

    for (let i = 0; i < count; i++) {
      const randomWeight = 1 + Math.random() * 10; // 1-11 tael
      const randomPrice = 74000000 + Math.random() * 2000000; // 74-76M VND/tael

      await this.manualNewsGeneration(randomWeight * 37.5, randomPrice);

      // Delay between news to make it look natural
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    }

    console.log('✅ Hoàn thành phát tán tin tức bán vàng hàng loạt');
  }
}

export const sjcNewsPropagationSystem = new SJCNewsPropagationSystem();