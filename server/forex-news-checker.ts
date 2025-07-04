
import axios from 'axios';
import * as cheerio from 'cheerio';
import { MarketNewsPublisher, type MarketNews } from './market-news';

export interface ForexNewsSource {
  name: string;
  url: string;
  selector: string;
  titleSelector: string;
  contentSelector: string;
  timeSelector: string;
  category: 'forex' | 'crypto' | 'stocks' | 'commodities' | 'economics';
}

export class ForexNewsChecker {
  private sources: ForexNewsSource[] = [
    {
      name: 'MetaTrader Market News',
      url: 'https://www.metatrader5.com/en/terminal/help/startworking/market_news',
      selector: '.news-item',
      titleSelector: '.news-title',
      contentSelector: '.news-content',
      timeSelector: '.news-time',
      category: 'forex'
    },
    {
      name: 'Exness Market Analysis',
      url: 'https://www.exness.com/analytics/',
      selector: '.article-card',
      titleSelector: '.article-title',
      contentSelector: '.article-excerpt',
      timeSelector: '.article-date',
      category: 'forex'
    },
    {
      name: 'FTMO Trading News',
      url: 'https://ftmo.com/en/trading-news/',
      selector: '.news-article',
      titleSelector: 'h3',
      contentSelector: '.excerpt',
      timeSelector: '.date',
      category: 'forex'
    },
    {
      name: 'TradingView Ideas',
      url: 'https://www.tradingview.com/markets/currencies/ideas/',
      selector: '.tv-widget-idea',
      titleSelector: '.tv-widget-idea__title',
      contentSelector: '.tv-widget-idea__description',
      timeSelector: '.tv-widget-idea__time',
      category: 'forex'
    }
  ];

  private processedNews = new Set<string>();

  async checkAllSources(): Promise<MarketNews[]> {
    const allNews: MarketNews[] = [];
    
    for (const source of this.sources) {
      try {
        const news = await this.checkSource(source);
        allNews.push(...news);
      } catch (error) {
        console.error(`Error checking ${source.name}:`, error);
      }
    }
    
    return allNews;
  }

  private async checkSource(source: ForexNewsSource): Promise<MarketNews[]> {
    try {
      console.log(`Checking news from ${source.name}...`);
      
      // Simulate news fetching with mock data for demo
      const mockNews = this.generateMockNews(source);
      return mockNews;
      
      // Real implementation would be:
      // const response = await axios.get(source.url, {
      //   headers: {
      //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      //   }
      // });
      // return this.parseNews(response.data, source);
      
    } catch (error) {
      console.error(`Failed to fetch from ${source.name}:`, error);
      return [];
    }
  }

  private generateMockNews(source: ForexNewsSource): MarketNews[] {
    const mockData = [
      {
        title: `${source.name}: Fed Rate Decision Impact on USD Pairs`,
        content: `Latest analysis from ${source.name} indicates significant movement expected in major USD pairs following Federal Reserve's monetary policy announcement. Technical indicators suggest potential breakout scenarios.`,
        impact: 'high' as const,
        symbols: ['EURUSD', 'GBPUSD', 'USDJPY']
      },
      {
        title: `${source.name}: ECB Policy Outlook`,
        content: `European Central Bank's latest communication suggests dovish stance may continue, potentially affecting EUR strength across major pairs.`,
        impact: 'medium' as const,
        symbols: ['EURUSD', 'EURGBP', 'EURJPY']
      }
    ];

    return mockData.map(item => ({
      title: item.title,
      content: item.content,
      category: source.category,
      impact: item.impact,
      source: source.name,
      timestamp: new Date().toISOString(),
      symbols: item.symbols
    }));
  }

  private parseNews(html: string, source: ForexNewsSource): MarketNews[] {
    const $ = cheerio.load(html);
    const news: MarketNews[] = [];

    $(source.selector).each((index, element) => {
      const title = $(element).find(source.titleSelector).text().trim();
      const content = $(element).find(source.contentSelector).text().trim();
      const timeText = $(element).find(source.timeSelector).text().trim();

      if (title && content) {
        const newsId = `${source.name}-${title}`.replace(/\s+/g, '-');
        
        if (!this.processedNews.has(newsId)) {
          this.processedNews.add(newsId);
          
          const newsItem: MarketNews = {
            title: `[${source.name}] ${title}`,
            content,
            category: source.category,
            impact: this.determineImpact(title, content),
            source: source.name,
            timestamp: new Date().toISOString(),
            symbols: this.extractSymbols(title + ' ' + content)
          };
          
          news.push(newsItem);
        }
      }
    });

    return news;
  }

  private determineImpact(title: string, content: string): 'low' | 'medium' | 'high' {
    const text = (title + ' ' + content).toLowerCase();
    
    const highImpactKeywords = ['breaking', 'urgent', 'fed', 'ecb', 'rate', 'emergency', 'crisis'];
    const mediumImpactKeywords = ['analysis', 'outlook', 'forecast', 'trend', 'support', 'resistance'];
    
    if (highImpactKeywords.some(keyword => text.includes(keyword))) {
      return 'high';
    } else if (mediumImpactKeywords.some(keyword => text.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  private extractSymbols(text: string): string[] {
    const symbols = [];
    const commonPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'];
    
    for (const pair of commonPairs) {
      if (text.toUpperCase().includes(pair) || text.includes(pair.slice(0, 3)) || text.includes(pair.slice(3))) {
        symbols.push(pair);
      }
    }
    
    return symbols.length > 0 ? symbols : ['EURUSD']; // Default to EURUSD
  }

  async startAutoCheck(intervalMinutes: number = 15): Promise<void> {
    console.log(`Starting automatic forex news checking every ${intervalMinutes} minutes`);
    
    const checkAndPublish = async () => {
      try {
        const news = await this.checkAllSources();
        
        for (const newsItem of news) {
          if (newsItem.impact === 'high' || newsItem.impact === 'medium') {
            console.log(`Publishing news: ${newsItem.title}`);
            await MarketNewsPublisher.publishNews(newsItem);
            
            if (newsItem.impact === 'high') {
              await MarketNewsPublisher.broadcastToTraders(
                `news_${Date.now()}`,
                'urgent'
              );
            }
          }
        }
      } catch (error) {
        console.error('Error in auto news check:', error);
      }
    };
    
    // Run immediately
    await checkAndPublish();
    
    // Then run on interval
    setInterval(checkAndPublish, intervalMinutes * 60 * 1000);
  }
}

export const forexNewsChecker = new ForexNewsChecker();
