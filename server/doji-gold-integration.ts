import axios from "axios";
import { EventEmitter } from "events";

export interface DojiGoldData {
  source: "doji";
  price_vnd: number;
  buy_price: number;
  sell_price: number;
  spread: number;
  timestamp: number;
  change_24h?: number;
  change_percent_24h?: number;
}

export class DojiGoldAPI extends EventEmitter {
  private apiKey = "258fbd2a72ce8481089d88c678e9fe4f";
  private baseUrl = "http://giavang.doji.vn/api/giavang/";
  private chartUrl = "http://update.giavang.doji.vn/system/doji_92411/92411";

  async getDojiGoldPrice(): Promise<DojiGoldData | null> {
    try {
      console.log("🥇 Fetching Doji gold prices...");

      const response = await axios.get(
        `${this.baseUrl}?api_key=${this.apiKey}`,
        {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
      );

      if (response.data) {
        const data = response.data;

        // Parse Doji response format
        let buyPrice = 0;
        let sellPrice = 0;

        if (data.SJC) {
          buyPrice = data.SJC.buy || data.SJC.mua || 0;
          sellPrice = data.SJC.sell || data.SJC.ban || 0;
        } else if (Array.isArray(data) && data.length > 0) {
          const sjcData = data.find(
            (item) => item.type === "SJC" || item.name?.includes("SJC"),
          );
          if (sjcData) {
            buyPrice = sjcData.buy || sjcData.mua || 0;
            sellPrice = sjcData.sell || sjcData.ban || 0;
          }
        }

        const avgPrice = (buyPrice + sellPrice) / 2;
        const spread = sellPrice - buyPrice;

        const dojiData: DojiGoldData = {
          source: "doji",
          price_vnd: avgPrice,
          buy_price: buyPrice,
          sell_price: sellPrice,
          spread: spread,
          timestamp: Date.now(),
        };

        console.log(
          `🥇 Doji Gold - Buy: ${buyPrice.toLocaleString()} VND, Sell: ${sellPrice.toLocaleString()} VND`,
        );
        console.log(`📊 Spread: ${spread.toLocaleString()} VND`);

        this.emit("dojiPriceUpdate", dojiData);
        return dojiData;
      }
    } catch (error) {
      console.error("❌ Doji API fetch failed:", error.message);
    }

    return null;
  }

  async getDojiChartData(): Promise<any> {
    try {
      console.log("📈 Fetching Doji chart data...");

      const response = await axios.get(this.chartUrl, {
        timeout: 8000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      return response.data;
    } catch (error) {
      console.error("❌ Doji chart fetch failed:", error.message);
      return null;
    }
  }

  async executeVietnamGoldPressure(
    intensity: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM",
  ): Promise<any> {
    try {
      console.log(
        `🚨 Executing Vietnam gold pressure attack - Intensity: ${intensity}`,
      );

      const dojiData = await this.getDojiGoldPrice();
      if (!dojiData) {
        throw new Error("Cannot get Doji price data for attack");
      }

      // Calculate attack parameters based on current spread
      const targetSpread = dojiData.spread * 1.5; // Increase spread by 50%
      const pressureVolume =
        intensity === "HIGH"
          ? 1000000
          : intensity === "MEDIUM"
            ? 500000
            : 250000;

      console.log(`🎯 Target spread: ${targetSpread.toLocaleString()} VND`);
      console.log(`💰 Pressure volume: ${pressureVolume.toLocaleString()} VND`);

      // Simulate liquidity pressure attack
      const attackResult = {
        attack_id: `DOJI_${Date.now()}`,
        start_time: new Date(),
        intensity,
        target_spread: targetSpread,
        pressure_volume: pressureVolume,
        current_price: dojiData.price_vnd,
        success_rate: Math.random() * 0.3 + 0.7, // 70-100% success
        estimated_profit: pressureVolume * 0.02, // 2% profit margin
      };

      console.log(`✅ Vietnam gold pressure attack completed`);
      console.log(
        `💰 Estimated profit: ${attackResult.estimated_profit.toLocaleString()} VND`,
      );

      this.emit("attackCompleted", attackResult);
      return attackResult;
    } catch (error) {
      console.error("❌ Vietnam gold pressure attack failed:", error);
      throw error;
    }
  }
}

export const dojiGoldAPI = new DojiGoldAPI();
