import axios from 'axios';
import { EventEmitter } from 'events';

export interface GoldPriceData {
  source: string;
  price_usd: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  spread?: number;
  change_24h?: number;
  change_percent_24h?: number;
}

export interface ExchangeRateData {
  base: string;
  target: string;
  rate: number;
  timestamp: number;
}

export class GoldPriceAPI extends EventEmitter {
  private goldApiKey = 'goldapi-a1omwe19mc2bnqkx-io';
  private exchangeApiKey = 'AFj8naQ2z4ouXlP6gluOHGrn3LqZpV3e';
  
  // Fetch accurate gold price from GoldAPI
  async getGoldPrice(): Promise<GoldPriceData | null> {
    try {
      console.log('📊 Fetching real gold price from GoldAPI...');
      
      const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
        headers: {
          'x-access-token': this.goldApiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.price) {
        const data = response.data;
        
        const goldPrice: GoldPriceData = {
          source: 'GoldAPI',
          price_usd: parseFloat(data.price),
          timestamp: Date.now(),
          bid: data.bid ? parseFloat(data.bid) : undefined,
          ask: data.ask ? parseFloat(data.ask) : undefined,
          spread: data.spread ? parseFloat(data.spread) : undefined,
          change_24h: data.ch ? parseFloat(data.ch) : undefined,
          change_percent_24h: data.chp ? parseFloat(data.chp) : undefined
        };

        console.log(`💰 Gold Price: $${goldPrice.price_usd}/oz`);
        if (goldPrice.change_24h) {
          console.log(`📊 24h Change: ${goldPrice.change_24h > 0 ? '+' : ''}${goldPrice.change_24h} (${goldPrice.change_percent_24h}%)`);
        }

        this.emit('goldPriceUpdate', goldPrice);
        return goldPrice;
      }
    } catch (error) {
      console.error('❌ GoldAPI fetch failed:', error.message);
    }
    
    return null;
  }

  // Fetch USD/VND exchange rate
  async getUSDVNDRate(): Promise<ExchangeRateData | null> {
    try {
      console.log('💱 Fetching USD/VND exchange rate...');
      
      const response = await axios.get('https://api.apilayer.com/exchangerates_data/latest', {
        params: {
          base: 'USD',
          symbols: 'VND'
        },
        headers: {
          'apikey': this.exchangeApiKey
        },
        timeout: 10000
      });

      if (response.data && response.data.rates && response.data.rates.VND) {
        const rate: ExchangeRateData = {
          base: 'USD',
          target: 'VND',
          rate: parseFloat(response.data.rates.VND),
          timestamp: Date.now()
        };

        console.log(`💱 USD/VND Rate: ${rate.rate.toLocaleString('vi-VN')}`);
        
        this.emit('exchangeRateUpdate', rate);
        return rate;
      }
    } catch (error) {
      console.error('❌ Exchange rate fetch failed:', error.message);
    }
    
    return null;
  }

  // Get combined gold and exchange rate data
  async getCompleteGoldData(): Promise<{ gold: GoldPriceData | null; exchange: ExchangeRateData | null }> {
    const [gold, exchange] = await Promise.all([
      this.getGoldPrice(),
      this.getUSDVNDRate()
    ]);

    return { gold, exchange };
  }

  // Calculate Vietnam gold price in VND
  calculateVietnamGoldPrice(goldPriceUSD: number, usdVndRate: number): number {
    // Convert USD/oz to VND/tael (1 oz = 31.1035g, 1 tael = 37.5g)
    const taelToOzRatio = 37.5 / 31.1035;
    return goldPriceUSD * usdVndRate * taelToOzRatio;
  }
}

export const goldPriceAPI = new GoldPriceAPI();