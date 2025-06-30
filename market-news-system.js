
const WebSocket = require('ws');
const http = require('http');
const express = require('express');

class MarketNewsSystem {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    
    this.setupServer();
  }

  setupServer() {
    this.app.use(express.json());
    
    // Route đăng tin tức
    this.app.post('/api/market-news', (req, res) => {
      const news = this.createNewsPost(req.body);
      this.broadcastNews(news);
      res.json({ success: true, newsId: news.id, message: 'Tin tức đã được đăng và phát sóng' });
    });

    // Route lấy tin tức
    this.app.get('/api/market-news', (req, res) => {
      res.json({ news: this.getRecentNews() });
    });

    this.server = http.createServer(this.app);
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (ws, req) => {
      console.log('🔗 Client mới kết nối WebSocket');
      this.clients.add(ws);
      
      // Gửi tin chào mừng
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Kết nối WebSocket thành công',
        timestamp: new Date().toISOString()
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Lỗi xử lý tin nhắn:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 Client ngắt kết nối');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('Lỗi WebSocket:', error);
        this.clients.delete(ws);
      });
    });
  }

  createNewsPost(data) {
    const news = {
      id: 'NEWS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: data.title || 'Tin tức thị trường',
      content: data.content || '',
      category: data.category || 'general',
      impact: data.impact || 'medium',
      source: data.source || 'Market System',
      timestamp: new Date().toISOString(),
      symbols: data.symbols || [],
      priority: this.calculatePriority(data.impact),
      tags: this.generateTags(data)
    };

    console.log('📰 Tạo tin tức mới:', news.id);
    return news;
  }

  calculatePriority(impact) {
    const priorities = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'very_high': 4,
      'breaking': 5
    };
    return priorities[impact] || 2;
  }

  generateTags(data) {
    const tags = [];
    if (data.category) tags.push(data.category);
    if (data.symbols) tags.push(...data.symbols);
    if (data.impact === 'high') tags.push('high-impact');
    return tags;
  }

  broadcastNews(news) {
    const message = JSON.stringify({
      type: 'market_news',
      data: news
    });

    console.log(`📡 Phát sóng tin tức đến ${this.clients.size} clients`);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      } else {
        this.clients.delete(client);
      }
    });
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        ws.send(JSON.stringify({
          type: 'subscription_confirmed',
          symbols: data.symbols || [],
          timestamp: new Date().toISOString()
        }));
        break;
        
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
        
      default:
        console.log('Tin nhắn không xác định:', data);
    }
  }

  getRecentNews() {
    // Placeholder - trong thực tế sẽ lấy từ database
    return [
      {
        id: 'NEWS_SAMPLE',
        title: 'Hệ thống tin tức đã sẵn sàng',
        content: 'WebSocket và API đã hoạt động',
        timestamp: new Date().toISOString()
      }
    ];
  }

  start(port = 5000) {
    this.server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Market News System đang chạy tại port ${port}`);
      console.log(`📡 WebSocket: ws://localhost:${port}`);
      console.log(`🔗 API: http://localhost:${port}/api/market-news`);
    });
  }
}

// Khởi động hệ thống
const newsSystem = new MarketNewsSystem();
newsSystem.start();

// Export để sử dụng trong module khác
module.exports = MarketNewsSystem;
