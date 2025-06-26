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
  private metalsApiKey = 'YOUR_METALS_API_KEY'; // You need to get this from metals-api.com
  private exchangeApiKey = 'AFj8naQ2z4ouXlP6gluOHGrn3LqZpV3e';
  
  // Fetch accurate gold price from multiple sources
  async getGoldPrice(): Promise<GoldPriceData | null> {
    try {
      console.log('📊 Fetching real gold price from multiple sources...');
      
      // Try Metals API first (new primary source)
      try {
        const response = await axios.get('https://metals-api.com/api/latest', {
          params: {
            access_key: this.metalsApiKey,
            base: 'USD',
            symbols: 'XAU'
          },
          timeout: 10000
        });

        if (response.data && response.data.success && response.data.rates && response.data.rates.XAU) {
          const xauRate = response.data.rates.XAU;
          const goldPriceUSD = 1 / xauRate; // Convert XAU rate to USD price per oz
          
          const goldPrice: GoldPriceData = {
            source: 'Metals-API',
            price_usd: parseFloat(goldPriceUSD.toFixed(2)),
            timestamp: Date.now(),
            change_24h: response.data.change ? parseFloat(response.data.change) : undefined,
            change_percent_24h: response.data.change_pct ? parseFloat(response.data.change_pct) : undefined
          };

          console.log(`💰 Metals-API Gold Price: $${goldPrice.price_usd}/oz`);
          this.emit('goldPriceUpdate', goldPrice);
          return goldPrice;
        }
      } catch (metalsApiError) {
        console.log('⚠️ Metals-API failed, trying GoldAPI...');
      }

      // Try GoldAPI (corrected implementation)
      try {
        const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
          headers: {
            'x-access-token': this.goldApiKey,
            'Content-Type': 'application/json'
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

          console.log(`💰 GoldAPI Gold Price: $${goldPrice.price_usd}/oz`);
          if (goldPrice.change_24h) {
            console.log(`📊 24h Change: ${goldPrice.change_24h > 0 ? '+' : ''}${goldPrice.change_24h} (${goldPrice.change_percent_24h}%)`);
          }

          this.emit('goldPriceUpdate', goldPrice);
          return goldPrice;
        }
      } catch (goldApiError) {
        console.log('⚠️ GoldAPI failed, trying additional fallback sources...');
      }

      // Enhanced fallback sources
      const fallbackSources = [
        {
          url: 'https://api.metals.live/v1/spot/gold',
          parser: (data: any) => data.price ? parseFloat(data.price) : null
        },
        {
          url: 'https://api.goldprice.org/v1/XAU/USD',
          parser: (data: any) => {
            if (data.rates && data.rates.XAU) {
              return 1 / parseFloat(data.rates.XAU);
            }
            return data.price ? parseFloat(data.price) : null;
          }
        },
        {
          url: 'https://api2.goldprice.org/v1/XAU/USD',
          parser: (data: any) => data.gold ? parseFloat(data.gold) : null
        }
      ];

      for (const source of fallbackSources) {
        try {
          const response = await axios.get(source.url, { timeout: 8000 });
          
          if (response.data) {
            const price = source.parser(response.data);

            if (price && price > 0) {
              const goldPrice: GoldPriceData = {
                source: 'Fallback API',
                price_usd: parseFloat(price.toFixed(2)),
                timestamp: Date.now()
              };

              console.log(`💰 Fallback Gold Price: $${goldPrice.price_usd}/oz`);
              this.emit('goldPriceUpdate', goldPrice);
              return goldPrice;
            }
          }
        } catch (fallbackError) {
          continue;
        }
      }

      // Last resort - use a realistic current gold price estimate
      const estimatedPrice: GoldPriceData = {
        source: 'Estimated',
        price_usd: 2680.0, // Current market estimate
        timestamp: Date.now()
      };
      
      console.log('⚠️ Using estimated gold price due to API failures');
      return estimatedPrice;

    } catch (error) {
      console.error('❌ All gold price sources failed:', error.message);
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

  // Test all gold price API sources
  async testAllGoldAPISources(): Promise<{ [key: string]: any }> {
    const results: { [key: string]: any } = {};
    
    console.log('🧪 Testing all gold price API sources...');

    // Test Metals API
    try {
      const metalsResponse = await axios.get('https://metals-api.com/api/latest', {
        params: {
          access_key: this.metalsApiKey,
          base: 'USD',
          symbols: 'XAU'
        },
        timeout: 5000
      });
      
      if (metalsResponse.data && metalsResponse.data.success) {
        const price = 1 / metalsResponse.data.rates.XAU;
        results.metalsAPI = {
          status: 'success',
          price: price.toFixed(2),
          timestamp: metalsResponse.data.timestamp
        };
      } else {
        results.metalsAPI = { status: 'failed', error: 'Invalid response' };
      }
    } catch (error) {
      results.metalsAPI = { status: 'error', error: error.message };
    }

    // Test GoldAPI
    try {
      const goldResponse = await axios.get('https://www.goldapi.io/api/XAU/USD', {
        headers: {
          'x-access-token': this.goldApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (goldResponse.data && goldResponse.data.price) {
        results.goldAPI = {
          status: 'success',
          price: goldResponse.data.price,
          bid: goldResponse.data.bid,
          ask: goldResponse.data.ask,
          change24h: goldResponse.data.ch
        };
      } else {
        results.goldAPI = { status: 'failed', error: 'Invalid response' };
      }
    } catch (error) {
      results.goldAPI = { status: 'error', error: error.message };
    }

    // Test fallback sources
    const fallbackTests = [
      { name: 'metalsLive', url: 'https://api.metals.live/v1/spot/gold' },
      { name: 'goldPriceOrg', url: 'https://api.goldprice.org/v1/XAU/USD' },
      { name: 'goldPriceOrg2', url: 'https://api2.goldprice.org/v1/XAU/USD' }
    ];

    for (const test of fallbackTests) {
      try {
        const response = await axios.get(test.url, { timeout: 5000 });
        results[test.name] = {
          status: 'success',
          data: response.data
        };
      } catch (error) {
        results[test.name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    console.log('🧪 API Test Results:', results);
    return results;
  }
}

export const goldPriceAPI = new GoldPriceAPI();