
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
    // Tối ưu hóa ngưỡng thanh khoản cho thị trường vàng Việt Nam
    if (spread < 30000) return 'high';    // Thanh khoản cao - spread dưới 30k
    if (spread < 80000) return 'medium';  // Thanh khoản trung bình - spread 30-80k
    return 'low';                         // Thanh khoản thấp - spread trên 80k
  }

  private generateBotSignal(spread: number, price: number): 'favorable' | 'moderate' | 'caution' {
    // Logic tấn công áp lực thông minh hơn
    const marketHours = this.isMarketHours();
    const volatilityScore = this.calculateVolatility(spread, price);
    
    // Điều kiện tấn công tối ưu
    if (spread < 25000 && price > 75000000 && marketHours && volatilityScore > 0.7) {
      return 'favorable'; // Tấn công mạnh
    }
    
    if (spread < 60000 && marketHours && volatilityScore > 0.5) {
      return 'moderate';  // Tấn công vừa phải
    }
    
    return 'caution';     // Thận trọng hoặc không tấn công
  }

  private isMarketHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Giờ giao dịch vàng tối ưu: 8h-17h, thứ 2-6
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 17;
  }

  private calculateVolatility(spread: number, price: number): number {
    // Tính toán chỉ số biến động để quyết định tấn công
    const baseSpread = 50000; // Spread chuẩn
    const basePrice = 78000000; // Giá chuẩn
    
    const spreadVolatility = Math.abs(spread - baseSpread) / baseSpread;
    const priceVolatility = Math.abs(price - basePrice) / basePrice;
    
    return Math.min((spreadVolatility + priceVolatility) / 2, 1.0);
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

    console.log('🔍 Phân tích cơ hội arbitrage và tấn công áp lực...');
    
    // Tìm giá mua và bán tốt nhất
    let bestBuy = results[0];
    let bestSell = results[0];
    let sjcData = results.find(r => r.source === 'SJC');
    
    results.forEach(data => {
      if (data.buyPrice < bestBuy.buyPrice) bestBuy = data;
      if (data.sellPrice > bestSell.sellPrice) bestSell = data;
    });

    const arbitrageProfit = bestSell.sellPrice - bestBuy.buyPrice;
    const profitPercent = (arbitrageProfit / bestBuy.buyPrice) * 100;

    console.log('💰 PHÂN TÍCH ARBITRAGE:');
    console.log(`📈 Bán tốt nhất: ${bestSell.source} - ${bestSell.sellPrice.toLocaleString()} VND`);
    console.log(`📉 Mua tốt nhất: ${bestBuy.source} - ${bestBuy.buyPrice.toLocaleString()} VND`);
    console.log(`💸 Lợi nhuận tiềm năng: ${arbitrageProfit.toLocaleString()} VND (${profitPercent.toFixed(2)}%)`);

    // Phân tích tấn công áp lực SJC
    if (sjcData) {
      this.analyzeSJCPressureAttack(sjcData, results);
    }

    // Cơ hội arbitrage mạnh
    if (arbitrageProfit > 50000) {
      console.log('🚨 CƠ HỘI ARBITRAGE PHÁT HIỆN!');
      this.emit('arbitrageOpportunity', {
        buyFrom: bestBuy.source,
        sellTo: bestSell.source,
        profit: arbitrageProfit,
        profitPercent,
        attackRecommendation: this.generateAttackStrategy(results)
      });
    }

    // Phân tích pattern spread để tấn công
    this.analyzeSpreadPatterns(results);
  }

  private analyzeSJCPressureAttack(sjcData: LiquidityData, allResults: LiquidityData[]): void {
    console.log('🎯 PHÂN TÍCH TẤN CÔNG ÁP LỰC SJC:');
    
    const sjcSpreadRatio = sjcData.spread / sjcData.buyPrice;
    const averageSpread = allResults.reduce((sum, r) => sum + r.spread, 0) / allResults.length;
    const sjcPremium = sjcData.buyPrice - averageSpread;
    
    // Điểm yếu của SJC
    const vulnerabilities = [];
    
    if (sjcSpreadRatio > 0.012) {
      vulnerabilities.push('SPREAD_CAO');
    }
    
    if (sjcPremium > 30000) {
      vulnerabilities.push('PREMIUM_CAO');
    }
    
    if (sjcData.liquidityLevel === 'low') {
      vulnerabilities.push('THANH_KHOẢN_THẤP');
    }
    
    const attackIntensity = this.calculateAttackIntensity(sjcData, allResults);
    
    console.log(`📊 SJC Spread: ${sjcData.spread.toLocaleString()} VND (${(sjcSpreadRatio * 100).toFixed(2)}%)`);
    console.log(`💎 SJC Premium: ${sjcPremium.toLocaleString()} VND`);
    console.log(`⚔️ Điểm yếu: ${vulnerabilities.join(', ')}`);
    console.log(`🔥 Cường độ tấn công khuyến nghị: ${attackIntensity}`);
    
    if (vulnerabilities.length >= 2) {
      console.log('🚨 SJC READY FOR PRESSURE ATTACK!');
      this.emit('sjcAttackOpportunity', {
        vulnerabilities,
        attackIntensity,
        targetSpread: sjcData.spread,
        recommendedAction: 'IMMEDIATE_PRESSURE_ATTACK'
      });
    }
  }

  private calculateAttackIntensity(sjcData: LiquidityData, allResults: LiquidityData[]): string {
    let score = 0;
    
    // Spread cao = dễ tấn công
    if (sjcData.spread > 60000) score += 3;
    else if (sjcData.spread > 40000) score += 2;
    else score += 1;
    
    // Thanh khoản thấp = dễ áp lực
    if (sjcData.liquidityLevel === 'low') score += 3;
    else if (sjcData.liquidityLevel === 'medium') score += 2;
    else score += 1;
    
    // So sánh với thị trường
    const avgPrice = allResults.reduce((sum, r) => sum + r.buyPrice, 0) / allResults.length;
    if (sjcData.buyPrice > avgPrice * 1.02) score += 2; // Premium cao
    
    if (score >= 7) return 'CỰC MẠNH';
    if (score >= 5) return 'MẠNH';
    if (score >= 3) return 'VỪA PHẢI';
    return 'YẾU';
  }

  private generateAttackStrategy(results: LiquidityData[]): any {
    const sjc = results.find(r => r.source === 'SJC');
    const pnj = results.find(r => r.source === 'PNJ');
    
    const sjcSpread = sjc?.spread || 0;
    const pnjSpread = pnj?.spread || 0;
    
    return {
      primaryTarget: sjcSpread > pnjSpread ? 'SJC' : 'PNJ',
      tactics: [
        'HIGH_FREQUENCY_PRESSURE',
        'LIQUIDITY_DRAINAGE',
        'SPREAD_EXPLOITATION'
      ],
      timing: this.isMarketHours() ? 'IMMEDIATE' : 'WAIT_FOR_MARKET_HOURS',
      riskLevel: 'MEDIUM'
    };
  }

  private analyzeSpreadPatterns(results: LiquidityData[]): void {
    results.forEach(data => {
      const spreadRatio = data.spread / data.buyPrice;
      
      if (spreadRatio > 0.015) {
        console.log(`⚠️ SPREAD CAO PHÁT HIỆN: ${data.source} - ${data.spread.toLocaleString()} VND (${(spreadRatio * 100).toFixed(2)}%)`);
        console.log(`🎯 Chiến lược: Tấn công áp lực để thu hẹp spread`);
        
        // Emit sự kiện tấn công
        this.emit('highSpreadDetected', {
          source: data.source,
          spread: data.spread,
          spreadRatio,
          attackRecommendation: 'PRESSURE_ATTACK'
        });
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
