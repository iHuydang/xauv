import { EventEmitter } from "events";

export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
  updateInterval: number; // minutes
}

export interface GoldPriceMessage {
  vietnamGold: {
    sjc: { buy: number; sell: number; spread: number };
    pnj: { buy: number; sell: number; spread: number };
  };
  worldGold: {
    price: number;
    change24h: number;
    changePercent: number;
    bid: number;
    ask: number;
  };
  analysis: {
    arbitrageOpportunity: number;
    recommendation: string;
    riskLevel: string;
  };
  timestamp: string;
}

export class TelegramGoldBot extends EventEmitter {
  private config: TelegramBotConfig;
  private isRunning: boolean = false;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(config: TelegramBotConfig) {
    super();
    this.config = config;
  }

  async sendGoldPriceUpdate(): Promise<boolean> {
    try {
      console.log("📱 Chuẩn bị gửi cập nhật giá vàng qua Telegram...");

      // Get Vietnam gold prices
      const { quickAttackSystem } = await import("./quick-attack-system.js");
      const vietnamGold = await quickAttackSystem.scanLiquidityTargets();

      // Get world gold price
      const { worldGoldScanner } = await import("./world-gold-scanner.js");
      const worldGold = await worldGoldScanner.scanWorldGoldPrice();

      if (!worldGold) {
        console.error("❌ Không thể lấy giá vàng thế giới");
        return false;
      }

      // Find SJC and PNJ data
      const sjcData = vietnamGold.find((item: any) => item.source === "SJC");
      const pnjData = vietnamGold.find((item: any) => item.source === "PNJ");

      if (!sjcData || !pnjData) {
        console.error("❌ Không thể lấy giá vàng SJC/PNJ");
        return false;
      }

      // Calculate arbitrage opportunity
      const worldGoldVND = worldGold.price * 23500; // Approximate USD to VND rate
      const vietnamAvg = (sjcData.buyPrice + pnjData.buyPrice) / 2;
      const arbitrageOpportunity = Math.abs(worldGoldVND - vietnamAvg);

      // Create message
      const message: GoldPriceMessage = {
        vietnamGold: {
          sjc: {
            buy: sjcData.buyPrice,
            sell: sjcData.sellPrice,
            spread: sjcData.spread,
          },
          pnj: {
            buy: pnjData.buyPrice,
            sell: pnjData.sellPrice,
            spread: pnjData.spread,
          },
        },
        worldGold: {
          price: worldGold.price,
          change24h: worldGold.change24h,
          changePercent: worldGold.changePercent24h,
          bid: worldGold.bid,
          ask: worldGold.ask,
        },
        analysis: {
          arbitrageOpportunity,
          recommendation: this.generateRecommendation(
            arbitrageOpportunity,
            sjcData,
            worldGold,
          ),
          riskLevel:
            arbitrageOpportunity > 500000
              ? "CAO"
              : arbitrageOpportunity > 200000
                ? "TRUNG BÌNH"
                : "THẤP",
        },
        timestamp: new Date().toLocaleString("vi-VN"),
      };

      // Format and send message
      const formattedMessage = this.formatGoldMessage(message);
      const success = await this.sendTelegramMessage(formattedMessage);

      if (success) {
        console.log("✅ Đã gửi cập nhật giá vàng qua Telegram");
        this.emit("messageSent", message);
      }

      return success;
    } catch (error) {
      console.error("❌ Lỗi khi gửi cập nhật Telegram:", error);
      return false;
    }
  }

  private formatGoldMessage(data: GoldPriceMessage): string {
    const { vietnamGold, worldGold, analysis } = data;

    return `🏅 **BÁO GIÁ VÀNG THỜI GIAN THỰC**
📅 ${data.timestamp}

**🇻🇳 VÀNG VIỆT NAM:**
┌ SJC Gold
├ 💰 Mua: ${vietnamGold.sjc.buy.toLocaleString()} VND
├ 💰 Bán: ${vietnamGold.sjc.sell.toLocaleString()} VND
└ 📊 Spread: ${vietnamGold.sjc.spread.toLocaleString()} VND

┌ PNJ Gold  
├ 💰 Mua: ${vietnamGold.pnj.buy.toLocaleString()} VND
├ 💰 Bán: ${vietnamGold.pnj.sell.toLocaleString()} VND
└ 📊 Spread: ${vietnamGold.pnj.spread.toLocaleString()} VND

**🌍 VÀNG THẾ GIỚI:**
┌ Giá hiện tại: $${worldGold.price}/oz
├ Thay đổi 24h: ${worldGold.change24h > 0 ? "+" : ""}${worldGold.change24h} (${worldGold.changePercent}%)
├ Bid/Ask: $${worldGold.bid.toFixed(2)}/$${worldGold.ask.toFixed(2)}
└ Thanh khoản: ${this.getLiquidityStatus(worldGold)}

**⚔️ PHÂN TÍCH ARBITRAGE:**
┌ Chênh lệch: ${analysis.arbitrageOpportunity.toLocaleString()} VND
├ Mức rủi ro: ${analysis.riskLevel}
└ Khuyến nghị: ${analysis.recommendation}

**🎯 CÁC LỆNH SỬ DỤNG:**
/gold - Giá vàng hiện tại
/analyze - Phân tích chi tiết
/attack - Khởi chạy tấn công SJC
/world - Tấn công vàng thế giới
/monitor - Bật/tắt giám sát

*Được tạo bởi Hệ thống Tấn công Thanh khoản ODANA*`;
  }

  private generateRecommendation(
    arbitrage: number,
    sjcData: any,
    worldGold: any,
  ): string {
    if (arbitrage > 500000) {
      return "🚨 CƠ HỘI ARBITRAGE CAO - TẤN CÔNG NGAY";
    } else if (arbitrage > 200000) {
      return "⚠️ Cơ hội vừa phải - Theo dõi thêm";
    } else if (sjcData.liquidityLevel === "low") {
      return "🎯 SJC thanh khoản thấp - Tấn công áp lực";
    } else if (Math.abs(worldGold.changePercent24h) > 2) {
      return "📊 Biến động cao - Cẩn trọng giao dịch";
    } else {
      return "😌 Thị trường ổn định - Chờ cơ hội";
    }
  }

  private getLiquidityStatus(worldGold: any): string {
    const spread = ((worldGold.ask - worldGold.bid) / worldGold.price) * 100;
    if (spread < 0.1) return "CAO 🟢";
    if (spread < 0.3) return "TRUNG BÌNH 🟡";
    return "THẤP 🔴";
  }

  private async sendTelegramMessage(message: string): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      const payload = {
        chat_id: this.config.chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("✅ Tin nhắn Telegram đã được gửi thành công");
        return true;
      } else {
        const errorData = await response.json();
        console.error("❌ Lỗi gửi Telegram:", errorData);
        return false;
      }
    } catch (error) {
      console.error("❌ Lỗi kết nối Telegram API:", error);
      return false;
    }
  }

  async handleTelegramCommand(command: string, chatId: string): Promise<void> {
    try {
      let response = "";

      switch (command.toLowerCase()) {
        case "/gold":
        case "/start":
          await this.sendGoldPriceUpdate();
          return;

        case "/analyze":
          response = await this.getDetailedAnalysis();
          break;

        case "/attack":
          response = await this.executeSJCAttack();
          break;

        case "/world":
          response = await this.executeWorldGoldAttack();
          break;

        case "/monitor":
          response = this.toggleMonitoring();
          break;

        case "/help":
          response = this.getHelpMessage();
          break;

        default:
          response = "❓ Lệnh không hợp lệ. Gửi /help để xem danh sách lệnh.";
      }

      if (response) {
        await this.sendTelegramMessage(response);
      }
    } catch (error) {
      console.error("❌ Lỗi xử lý lệnh Telegram:", error);
      await this.sendTelegramMessage(
        "❌ Có lỗi xảy ra khi xử lý lệnh của bạn.",
      );
    }
  }

  private async getDetailedAnalysis(): Promise<string> {
    try {
      const { worldGoldScanner } = await import("./world-gold-scanner.js");
      const goldData = await worldGoldScanner.scanWorldGoldPrice();

      if (goldData) {
        const analysis = worldGoldScanner.analyzeLiquidityOpportunity(goldData);

        return `📊 **PHÂN TÍCH CHI TIẾT**

**Điểm cơ hội:** ${analysis.opportunityScore}/100
**Mức rủi ro:** ${analysis.riskLevel}
**Vector khuyến nghị:** ${analysis.recommendedVector}
**Lợi nhuận ước tính:** $${analysis.estimatedProfit}
**Độ tin cậy:** ${analysis.confidence.toFixed(1)}%

${analysis.opportunityScore > 60 ? "🚨 **KHUYẾN NGHỊ THỰC HIỆN TẤN CÔNG!**" : "⏳ Chờ cơ hội tốt hơn"}`;
      }

      return "❌ Không thể lấy dữ liệu phân tích";
    } catch (error) {
      return "❌ Lỗi khi phân tích dữ liệu";
    }
  }

  private async executeSJCAttack(): Promise<string> {
    try {
      const { quickAttackSystem } = await import("./quick-attack-system.js");
      const result = await quickAttackSystem.executeSJCPressureAttack("HIGH");

      return `⚔️ **TẤN CÔNG SJC HOÀN THÀNH**

**ID Tấn công:** ${result.attackId}
**Mục tiêu:** ${result.target}
**Cường độ:** ${result.intensity}
**Thiệt hại gây ra:**
├ Giảm spread: ${result.damage.spreadReduction.toFixed(0)} VND
├ Rút thanh khoản: ${result.damage.liquidityImpact.toFixed(1)}%
└ Áp lực thị trường: ${result.damage.marketPressure.toFixed(1)}%

**Kết quả:** ${result.status}
**Khuyến nghị:** ${result.recommendation}`;
    } catch (error) {
      return "❌ Không thể thực hiện tấn công SJC";
    }
  }

  private async executeWorldGoldAttack(): Promise<string> {
    try {
      const { worldGoldScanner } = await import("./world-gold-scanner.js");
      const result =
        await worldGoldScanner.executeLiquidityAttack("SPOT_PRESSURE");

      return `🌍 **TẤN CÔNG VÀNG THẾ GIỚI HOÀN THÀNH**

**ID Tấn công:** ${result.attackId}
**Vector:** ${result.vectorUsed}
**Giá mục tiêu:** $${result.targetPrice}
**Giá đạt được:** $${result.achievedPrice.toFixed(2)}
**Lợi nhuận:** $${result.profitUSD.toFixed(2)}
**Thanh khoản rút:** ${result.liquidityDrained.toFixed(1)}%
**Tác động thị trường:** ${result.marketImpact.toFixed(2)}%

**Trạng thái:** ${result.status}`;
    } catch (error) {
      return "❌ Không thể thực hiện tấn công vàng thế giới";
    }
  }

  private toggleMonitoring(): string {
    if (this.isRunning) {
      this.stopAutoUpdates();
      return "⏹️ **ĐÃ DỪNG GIÁM SÁT TỰ ĐỘNG**\n\nSử dụng /monitor để bật lại.";
    } else {
      this.startAutoUpdates();
      return `🔄 **ĐÃ BẬT GIÁM SÁT TỰ ĐỘNG**\n\nCập nhật mỗi ${this.config.updateInterval} phút.\nSử dụng /monitor để tắt.`;
    }
  }

  private getHelpMessage(): string {
    return `🤖 **TRỢ GIÚP BOT VÀNG ODANA**

**Lệnh cơ bản:**
/gold - Xem giá vàng hiện tại
/analyze - Phân tích chi tiết thị trường
/monitor - Bật/tắt giám sát tự động

**Lệnh tấn công:**
/attack - Tấn công áp lực SJC
/world - Tấn công thanh khoản vàng thế giới

**Thông tin:**
/help - Hiển thị trợ giúp này

*Bot được phát triển bởi Hệ thống ODANA*
*Cập nhật tự động mỗi ${this.config.updateInterval} phút*`;
  }

  startAutoUpdates(): void {
    if (this.isRunning) {
      console.log("⚠️ Auto-updates đã đang chạy");
      return;
    }

    console.log(
      `🔄 Bắt đầu cập nhật tự động mỗi ${this.config.updateInterval} phút`,
    );
    this.isRunning = true;

    // Send initial update
    this.sendGoldPriceUpdate();

    // Set up recurring updates
    this.updateTimer = setInterval(
      () => {
        this.sendGoldPriceUpdate();
      },
      this.config.updateInterval * 60 * 1000,
    );

    this.emit("autoUpdatesStarted");
  }

  stopAutoUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.isRunning = false;
    console.log("⏹️ Đã dừng cập nhật tự động");
    this.emit("autoUpdatesStopped");
  }

  isAutoUpdating(): boolean {
    return this.isRunning;
  }

  updateConfig(newConfig: Partial<TelegramBotConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isRunning) {
      this.stopAutoUpdates();
      this.startAutoUpdates();
    }
  }
}

// Export singleton instance
export const telegramGoldBot = new TelegramGoldBot({
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  chatId: process.env.TELEGRAM_CHAT_ID || "",
  updateInterval: 30, // 30 minutes
});
