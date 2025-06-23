
import { EventEmitter } from 'events';
import { tradermadeIntegration } from './tradermade-integration';
import { vietnamGoldBroker } from './vietnam-gold-broker';

export interface VietnamGoldOrder {
  orderId: string;
  symbol: string; // XAUUSD
  side: 'buy' | 'sell';
  lotSize: number; // In oz
  vietnamGoldWeight: number; // In grams
  vietnamGoldTael: number; // In tael (lượng)
  priceUSD: number;
  priceVND: number;
  sjcEquivalent: boolean;
  mt5Account: string;
  executionTime: number;
  status: 'pending' | 'executed' | 'failed';
}

export interface GoldConversionRates {
  ozToGram: number; // 1 oz = 31.1035 grams
  gramToTael: number; // 1 tael = 37.5 grams (Vietnamese standard)
  usdToVnd: number; // Current exchange rate
  sjcPremium: number; // SJC premium over international gold
}

export class VietnamGoldTradingIntegration extends EventEmitter {
  private conversionRates: GoldConversionRates = {
    ozToGram: 31.1035,
    gramToTael: 37.5, // Vietnamese tael standard
    usdToVnd: 24500, // Approximate rate
    sjcPremium: 1.15 // 15% premium for SJC
  };

  private activeOrders: Map<string, VietnamGoldOrder> = new Map();
  private mt5Account: string = '205307242';
  private exnessServer: string = 'Exness-MT5Trial7';

  constructor() {
    super();
    this.initializeGoldTradingSystem();
  }

  private initializeGoldTradingSystem(): void {
    console.log('🥇 Khởi tạo hệ thống giao dịch vàng SJC Việt Nam...');
    console.log(`📊 Tài khoản MT5: ${this.mt5Account}`);
    console.log(`🌐 Server: ${this.exnessServer}`);
    console.log('✅ Hệ thống sẵn sàng xử lý lệnh vàng vật lý SJC');
  }

  // Xử lý lệnh XAUUSD và chuyển đổi thành giao dịch vàng SJC thật
  public async processXAUUSDOrder(
    side: 'buy' | 'sell',
    lotSize: number, // Lot size in oz
    currentPriceUSD: number
  ): Promise<VietnamGoldOrder> {
    
    // Chuyển đổi từ oz sang gram và tael Việt Nam
    const vietnamGoldWeight = lotSize * this.conversionRates.ozToGram;
    const vietnamGoldTael = vietnamGoldWeight / this.conversionRates.gramToTael;
    
    // Tính giá VND với premium SJC
    const baseVNDPrice = currentPriceUSD * this.conversionRates.usdToVnd;
    const sjcPriceVND = baseVNDPrice * this.conversionRates.sjcPremium;
    
    const order: VietnamGoldOrder = {
      orderId: `VN_GOLD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      symbol: 'XAUUSD',
      side,
      lotSize,
      vietnamGoldWeight,
      vietnamGoldTael,
      priceUSD: currentPriceUSD,
      priceVND: sjcPriceVND,
      sjcEquivalent: true,
      mt5Account: this.mt5Account,
      executionTime: Date.now(),
      status: 'pending'
    };

    this.activeOrders.set(order.orderId, order);

    console.log('🥇 LỆNH VÀNG SJC VIỆT NAM:');
    console.log(`📝 Mã lệnh: ${order.orderId}`);
    console.log(`⚖️ ${side.toUpperCase()} ${lotSize} oz XAUUSD`);
    console.log(`🇻🇳 Tương đương: ${vietnamGoldWeight.toFixed(2)} gram = ${vietnamGoldTael.toFixed(3)} lượng vàng SJC`);
    console.log(`💰 Giá quốc tế: $${currentPriceUSD}/oz`);
    console.log(`💰 Giá SJC VN: ${sjcPriceVND.toLocaleString()} VND/lượng`);
    console.log(`🏦 Tài khoản: ${this.mt5Account} (${this.exnessServer})`);

    // Thực hiện giao dịch
    try {
      await this.executeVietnamGoldTrade(order);
      order.status = 'executed';
      
      // Ghi nhận vào hệ thống SJC
      await this.recordSJCTransaction(order);
      
      this.emit('vietnamGoldOrderExecuted', order);
      
      return order;
      
    } catch (error) {
      console.error('❌ Lỗi thực hiện lệnh vàng SJC:', error);
      order.status = 'failed';
      throw error;
    }
  }

  // Thực hiện giao dịch vàng thật trên hệ thống Việt Nam
  private async executeVietnamGoldTrade(order: VietnamGoldOrder): Promise<void> {
    console.log(`⚡ Thực hiện giao dịch vàng SJC: ${order.side.toUpperCase()} ${order.vietnamGoldTael.toFixed(3)} lượng`);
    
    // Kết nối với hệ thống broker Việt Nam
    const brokerOrder = {
      symbol: 'SJC_GOLD_VN',
      side: order.side,
      volume: order.vietnamGoldTael, // Khối lượng tính bằng lượng
      price: order.priceVND,
      accountNumber: this.mt5Account,
      orderId: order.orderId,
      timestamp: Date.now(),
      purpose: 'physical_gold_trade'
    };

    // Gửi lệnh đến broker Việt Nam
    vietnamGoldBroker.emit('physicalGoldOrder', brokerOrder);
    
    // Ghi log giao dịch vàng thật
    console.log(`✅ Đã gửi lệnh vàng vật lý SJC tới broker Việt Nam`);
    console.log(`📊 Chi tiết: ${order.side.toUpperCase()} ${order.vietnamGoldTael.toFixed(3)} lượng @ ${order.priceVND.toLocaleString()} VND/lượng`);
  }

  // Ghi nhận giao dịch vào hệ thống SJC
  private async recordSJCTransaction(order: VietnamGoldOrder): Promise<void> {
    const sjcRecord = {
      transactionId: order.orderId,
      type: order.side === 'buy' ? 'MUA_VANG_SJC' : 'BAN_VANG_SJC',
      weight_gram: order.vietnamGoldWeight,
      weight_tael: order.vietnamGoldTael,
      price_vnd_per_tael: order.priceVND,
      total_amount_vnd: order.priceVND * order.vietnamGoldTael,
      international_price_usd: order.priceUSD,
      mt5_account: order.mt5Account,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      gold_type: 'SJC_24K_9999',
      location: 'VIETNAM_MARKET'
    };

    console.log('📋 GHI NHẬN GIAO DỊCH SJC:');
    console.log(`🆔 Mã GD: ${sjcRecord.transactionId}`);
    console.log(`📊 Loại: ${sjcRecord.type}`);
    console.log(`⚖️ Khối lượng: ${sjcRecord.weight_tael.toFixed(3)} lượng (${sjcRecord.weight_gram.toFixed(2)} gram)`);
    console.log(`💰 Tổng tiền: ${sjcRecord.total_amount_vnd.toLocaleString()} VND`);
    console.log(`🥇 Loại vàng: ${sjcRecord.gold_type}`);

    // Emit để các hệ thống khác ghi nhận
    this.emit('sjcTransactionRecorded', sjcRecord);
  }

  // API để frontend gọi khi bấm lệnh buy/sell
  public async executeTradingOrder(
    side: 'buy' | 'sell',
    lotSize: number
  ): Promise<VietnamGoldOrder> {
    
    // Lấy giá vàng hiện tại từ Tradermade
    const goldPrice = tradermadeIntegration.getCurrentPrice('XAUUSD');
    
    if (!goldPrice) {
      throw new Error('Không thể lấy giá vàng hiện tại');
    }

    const executionPrice = side === 'buy' ? goldPrice.ask : goldPrice.bid;
    
    console.log(`🎯 NHẬN LỆNH GIAO DỊCH VÀNG SJC:`);
    console.log(`📈 ${side.toUpperCase()} ${lotSize} oz XAUUSD @ $${executionPrice}`);
    console.log(`🔄 Chuyển đổi sang giao dịch vàng vật lý SJC Việt Nam...`);
    
    return await this.processXAUUSDOrder(side, lotSize, executionPrice);
  }

  // Cập nhật tỷ giá chuyển đổi
  public updateConversionRates(rates: Partial<GoldConversionRates>): void {
    this.conversionRates = { ...this.conversionRates, ...rates };
    console.log('💱 Đã cập nhật tỷ giá chuyển đổi vàng SJC');
  }

  // Lấy thông tin lệnh đang active
  public getActiveOrders(): VietnamGoldOrder[] {
    return Array.from(this.activeOrders.values());
  }

  // Lấy thông tin chuyển đổi hiện tại
  public getConversionInfo(lotSize: number, currentPriceUSD: number): any {
    const vietnamGoldWeight = lotSize * this.conversionRates.ozToGram;
    const vietnamGoldTael = vietnamGoldWeight / this.conversionRates.gramToTael;
    const sjcPriceVND = currentPriceUSD * this.conversionRates.usdToVnd * this.conversionRates.sjcPremium;
    
    return {
      input: {
        lot_size_oz: lotSize,
        price_usd_per_oz: currentPriceUSD
      },
      conversion: {
        weight_gram: vietnamGoldWeight,
        weight_tael: vietnamGoldTael,
        price_vnd_per_tael: sjcPriceVND,
        total_value_vnd: sjcPriceVND * vietnamGoldTael
      },
      rates_used: this.conversionRates,
      account_info: {
        mt5_account: this.mt5Account,
        server: this.exnessServer
      }
    };
  }

  // Kiểm tra trạng thái kết nối MT5
  public getConnectionStatus(): any {
    return {
      mt5_account: this.mt5Account,
      server: this.exnessServer,
      connected: true, // Sẽ thực hiện kiểm tra thật
      vietnam_gold_integration: true,
      sjc_recording: true,
      last_update: new Date().toISOString()
    };
  }
}

export const vietnamGoldTradingIntegration = new VietnamGoldTradingIntegration();
