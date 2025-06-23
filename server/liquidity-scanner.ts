
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

export interface LiquidityData {
  source: string;
  timestamp: Date;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  liquidityLevel: 'high' | 'medium' | 'low';
  botSignal: 'favorable' | 'moderate' | 'caution';
}

export interface ScanTarget {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  parser: (response: string) => LiquidityData | null;
}

export class LiquidityScanner extends EventEmitter {
  private scanInterval: NodeJS.Timeout | null = null;
  private isScanning: boolean = false;
  private scanTargets: Map<string, ScanTarget> = new Map();

  constructor() {
    super();
    this.setupDefaultTargets();
  }

  private setupDefaultTargets() {
    // SJC Target
    this.scanTargets.set('SJC', {
      name: 'SJC Gold',
      url: 'https://sjc.com.vn/giavang/textContent.php',
      method: 'GET',
      parser: this.parseSJCResponse.bind(this)
    });

    // PNJ Target
    this.scanTargets.set('PNJ', {
      name: 'PNJ Gold',
      url: 'https://edge-api.pnj.io/ecom-frontend/v1/gia-vang',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': '3PSWGkjX7GueCSY38keBikLd8JjizIiA'
      },
      body: {
        ts: Date.now(),
        tsj: Date.now(),
        date: new Date().toString(),
        items: [{ curr: 'VND' }]
      },
      parser: this.parsePNJResponse.bind(this)
    });

    // DOJI Target (simulated - replace with real API when available)
    this.scanTargets.set('DOJI', {
      name: 'DOJI Gold',
      url: 'https://httpbin.org/json', // Placeholder
      method: 'GET',
      parser: this.parseSimulatedResponse.bind(this, 'DOJI')
    });

    // MI Hong Target (simulated)
    this.scanTargets.set('MIHONG', {
      name: 'MI Hong Gold',
      url: 'https://httpbin.org/json', // Placeholder
      method: 'GET',
      parser: this.parseSimulatedResponse.bind(this, 'MIHONG')
    });

    // Bao Tin Minh Chau Target (simulated)
    this.scanTargets.set('BTMC', {
      name: 'Bao Tin Minh Chau',
      url: 'https://httpbin.org/json', // Placeholder
      method: 'GET',
      parser: this.parseSimulatedResponse.bind(this, 'BTMC')
    });
  }

  private parseSJCResponse(response: string): LiquidityData | null {
    try {
      const lines = response.split('\n');
      const sjcLine = lines.find(line => line.includes('SJC'));
      
      if (!sjcLine) return null;

      // Extract prices using regex
      const priceMatches = sjcLine.match(/<td[^>]*>([^<]*)<\/td>/g);
      if (!priceMatches || priceMatches.length < 3) return null;

      const buyPriceStr = priceMatches[1].replace(/<[^>]*>/g, '').replace(/[^0-9]/g, '');
      const sellPriceStr = priceMatches[2].replace(/<[^>]*>/g, '').replace(/[^0-9]/g, '');

      const buyPrice = parseInt(buyPriceStr) || 0;
      const sellPrice = parseInt(sellPriceStr) || 0;

      if (buyPrice === 0 || sellPrice === 0) return null;

      const spread = sellPrice - buyPrice;
      const spreadPercent = (spread / buyPrice) * 100;

      return {
        source: 'SJC',
        timestamp: new Date(),
        buyPrice,
        sellPrice,
        spread,
        spreadPercent,
        liquidityLevel: this.calculateLiquidityLevel(spread),
        botSignal: this.generateBotSignal(spread, sellPrice)
      };
    } catch (error) {
      console.error('Error parsing SJC response:', error);
      return null;
    }
  }

  private parsePNJResponse(response: string): LiquidityData | null {
    try {
      const data = JSON.parse(response);
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const buyPrice = item.xauPrice || 0;
        const sellPrice = buyPrice + (item.chgXau || 0);
        const spread = Math.abs(item.chgXau || 0);
        const spreadPercent = Math.abs(item.pcXau || 0);

        return {
          source: 'PNJ',
          timestamp: new Date(),
          buyPrice,
          sellPrice,
          spread,
          spreadPercent,
          liquidityLevel: this.calculateLiquidityLevel(spread),
          botSignal: this.generateBotSignal(spread, sellPrice)
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing PNJ response:', error);
      return null;
    }
  }

  private calculateLiquidityLevel(spread: number): 'high' | 'medium' | 'low' {
    if (spread < 50000) return 'high';
    if (spread < 100000) return 'medium';
    return 'low';
  }

  private generateBotSignal(spread: number, price: number): 'favorable' | 'moderate' | 'caution' {
    if (spread < 50000 && price > 70000000) return 'favorable';
    if (spread < 100000) return 'moderate';
    return 'caution';
  }

  private parseSimulatedResponse(source: string, response: string): LiquidityData | null {
    try {
      // Simulate different price levels and spreads for testing
      const basePrice = 79000000; // Base gold price
      const variations = {
        'DOJI': { buyOffset: -30000, spreadSize: 45000 },
        'MIHONG': { buyOffset: 15000, spreadSize: 60000 },
        'BTMC': { buyOffset: -10000, spreadSize: 80000 }
      };

      const variation = variations[source as keyof typeof variations] || variations['DOJI'];
      const buyPrice = basePrice + variation.buyOffset + (Math.random() * 20000 - 10000);
      const sellPrice = buyPrice + variation.spreadSize + (Math.random() * 10000 - 5000);
      const spread = sellPrice - buyPrice;
      const spreadPercent = (spread / buyPrice) * 100;

      return {
        source,
        timestamp: new Date(),
        buyPrice: Math.round(buyPrice),
        sellPrice: Math.round(sellPrice),
        spread: Math.round(spread),
        spreadPercent,
        liquidityLevel: this.calculateLiquidityLevel(spread),
        botSignal: this.generateBotSignal(spread, sellPrice)
      };
    } catch (error) {
      console.error(`Error parsing ${source} response:`, error);
      return null;
    }
  }

  async scanTarget(targetName: string): Promise<LiquidityData | null> {
    const target = this.scanTargets.get(targetName);
    if (!target) {
      console.error(`Target ${targetName} not found`);
      return null;
    }

    try {
      console.log(`🔍 Scanning ${target.name}...`);

      let response: string;
      if (target.method === 'GET') {
        const { stdout } = await execAsync(`curl -s "${target.url}"`);
        response = stdout;
      } else {
        const headers = Object.entries(target.headers || {})
          .map(([key, value]) => `-H "${key}: ${value}"`)
          .join(' ');
        const body = target.body ? `-d '${JSON.stringify(target.body)}'` : '';
        const { stdout } = await execAsync(`curl -s -X ${target.method} ${headers} ${body} "${target.url}"`);
        response = stdout;
      }

      const liquidityData = target.parser(response);
      
      if (liquidityData) {
        console.log(`💰 ${target.name} - Buy: ${liquidityData.buyPrice}, Sell: ${liquidityData.sellPrice}`);
        console.log(`📊 Spread: ${liquidityData.spread} VND (${liquidityData.spreadPercent.toFixed(2)}%)`);
        console.log(`🤖 Bot Signal: ${liquidityData.botSignal.toUpperCase()}`);
        
        // Emit event for bot system
        this.emit('liquidityUpdate', liquidityData);
        
        return liquidityData;
      }

      return null;
    } catch (error) {
      console.error(`Error scanning ${target.name}:`, error);
      return null;
    }
  }

  async scanAllTargets(): Promise<LiquidityData[]> {
    console.log('🚀 Starting comprehensive liquidity scan...');
    
    const results: LiquidityData[] = [];
    const promises = Array.from(this.scanTargets.keys()).map(async (targetName) => {
      const data = await this.scanTarget(targetName);
      if (data) results.push(data);
    });

    await Promise.all(promises);
    
    // Analyze arbitrage opportunities
    this.analyzeArbitrageOpportunities(results);
    
    // Emit comprehensive scan results
    this.emit('scanComplete', results);
    
    console.log(`✅ Scan completed - ${results.length} successful scans`);
    return results;
  }

  private analyzeArbitrageOpportunities(results: LiquidityData[]): void {
    if (results.length < 2) return;

    console.log('🔍 Analyzing arbitrage opportunities...');
    
    // Find best buy and sell prices across all sources
    let bestBuy = results[0];
    let bestSell = results[0];
    
    results.forEach(data => {
      if (data.buyPrice < bestBuy.buyPrice) bestBuy = data;
      if (data.sellPrice > bestSell.sellPrice) bestSell = data;
    });

    const arbitrageProfit = bestSell.sellPrice - bestBuy.buyPrice;
    const profitPercent = (arbitrageProfit / bestBuy.buyPrice) * 100;

    console.log('💰 ARBITRAGE ANALYSIS:');
    console.log(`📈 Best Sell: ${bestSell.source} - ${bestSell.sellPrice.toLocaleString()} VND`);
    console.log(`📉 Best Buy: ${bestBuy.source} - ${bestBuy.buyPrice.toLocaleString()} VND`);
    console.log(`💸 Potential Profit: ${arbitrageProfit.toLocaleString()} VND (${profitPercent.toFixed(2)}%)`);

    if (arbitrageProfit > 100000) {
      console.log('🚨 ARBITRAGE OPPORTUNITY DETECTED!');
      this.emit('arbitrageOpportunity', {
        buyFrom: bestBuy.source,
        sellTo: bestSell.source,
        profit: arbitrageProfit,
        profitPercent
      });
    }

    // Analyze spread patterns
    results.forEach(data => {
      const spreadRatio = data.spread / data.buyPrice;
      if (spreadRatio > 0.015) { // 1.5% spread is high
        console.log(`⚠️ HIGH SPREAD DETECTED: ${data.source} - ${data.spread.toLocaleString()} VND (${(spreadRatio * 100).toFixed(2)}%)`);
        console.log(`🎯 Bot Strategy: Wait for spread to narrow before trading`);
      }
    });
  }

  startMonitoring(intervalSeconds: number = 30): void {
    if (this.isScanning) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    console.log(`🔄 Starting continuous liquidity monitoring (${intervalSeconds}s interval)`);
    this.isScanning = true;

    this.scanInterval = setInterval(async () => {
      try {
        await this.scanAllTargets();
      } catch (error) {
        console.error('Error during monitoring scan:', error);
      }
    }, intervalSeconds * 1000);

    // Perform initial scan
    this.scanAllTargets();
  }

  stopMonitoring(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
    console.log('⏹️ Liquidity monitoring stopped');
  }

  addCustomTarget(name: string, target: ScanTarget): void {
    this.scanTargets.set(name, target);
    console.log(`➕ Added custom target: ${name}`);
  }

  removeTarget(name: string): boolean {
    const removed = this.scanTargets.delete(name);
    if (removed) {
      console.log(`➖ Removed target: ${name}`);
    }
    return removed;
  }

  getTargets(): string[] {
    return Array.from(this.scanTargets.keys());
  }

  isMonitoring(): boolean {
    return this.isScanning;
  }
}

export const liquidityScanner = new LiquidityScanner();
