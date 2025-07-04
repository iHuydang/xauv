// Component chọn phe mua/bán - Chèn vào trading panel
const SideSelector = {
  createSideSelector: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    const selectorHTML = `
      <div class="side-selector" style="margin: 10px 0; padding: 15px; background: #2d2d2d; border-radius: 8px;">
        <h4 style="color: white; margin-bottom: 10px;">Chọn Phe Trading:</h4>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <button id="buyBtn" class="side-btn buy-btn" style="
            flex: 1; padding: 12px; background: #22c55e; color: white; border: none; 
            border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s;
          ">
            📈 MUA (BUY)
          </button>
          
          <button id="sellBtn" class="side-btn sell-btn" style="
            flex: 1; padding: 12px; background: #ef4444; color: white; border: none;
            border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s;
          ">
            📉 BÁN (SELL)
          </button>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="bothBtn" class="side-btn both-btn" style="
            flex: 1; padding: 10px; background: #3b82f6; color: white; border: none;
            border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s;
          ">
            🔄 CẢ HAI PHE
          </button>
          
          <button id="scanBtn" class="scan-btn" style="
            flex: 1; padding: 10px; background: #8b5cf6; color: white; border: none;
            border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s;
          ">
            🔍 QUÉT NGAY
          </button>
        </div>

        <div id="sideResult" style="
          margin-top: 15px; padding: 10px; background: #1f1f1f; border-radius: 6px;
          color: #10b981; font-family: monospace; min-height: 40px;
        ">
          Chọn phe để bắt đầu quét thanh khoản...
        </div>
      </div>
    `;

    container.innerHTML = selectorHTML;

    // State management
    let selectedSide = "both";
    let currentSymbol = "XAUUSD";

    // Event handlers
    const updateButtonStates = (activeSide) => {
      document.querySelectorAll(".side-btn").forEach((btn) => {
        btn.style.opacity = "0.6";
        btn.style.transform = "scale(1)";
      });

      const activeBtn = document.getElementById(activeSide + "Btn");
      if (activeBtn) {
        activeBtn.style.opacity = "1";
        activeBtn.style.transform = "scale(1.05)";
      }
    };

    const showResult = (message, type = "info") => {
      const resultDiv = document.getElementById("sideResult");
      const colors = {
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6",
      };

      resultDiv.style.color = colors[type] || colors.info;
      resultDiv.innerHTML = `⏰ ${new Date().toLocaleTimeString()}<br>${message}`;
    };

    // Button events
    document.getElementById("buyBtn").onclick = () => {
      selectedSide = "buy";
      updateButtonStates("buy");
      showResult("✅ Đã chọn phe MUA (BUY)", "success");
    };

    document.getElementById("sellBtn").onclick = () => {
      selectedSide = "sell";
      updateButtonStates("sell");
      showResult("✅ Đã chọn phe BÁN (SELL)", "error");
    };

    document.getElementById("bothBtn").onclick = () => {
      selectedSide = "both";
      updateButtonStates("both");
      showResult("✅ Đã chọn CẢ HAI PHE", "warning");
    };

    document.getElementById("scanBtn").onclick = async () => {
      showResult("🔍 Đang quét thanh khoản...", "info");

      try {
        // Simulate scanning
        const scanResult = await simulateLiquidityScan(
          currentSymbol,
          selectedSide,
        );
        showResult(scanResult, "success");
      } catch (error) {
        showResult(`❌ Lỗi quét: ${error.message}`, "error");
      }
    };

    // Initialize
    updateButtonStates("both");

    return {
      setSide: (side) => {
        selectedSide = side;
        updateButtonStates(side);
      },
      setSymbol: (symbol) => {
        currentSymbol = symbol;
        showResult(`🎯 Đã chuyển sang ${symbol}`, "info");
      },
      getSide: () => selectedSide,
      getSymbol: () => currentSymbol,
    };
  },
};

// Hàm mô phỏng quét thanh khoản
async function simulateLiquidityScan(symbol, side) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = [];

      if (side === "buy" || side === "both") {
        const buyPrice = (75000000 + Math.random() * 1000000).toFixed(0);
        results.push(`💰 BUY: ${parseInt(buyPrice).toLocaleString()} VND`);
      }

      if (side === "sell" || side === "both") {
        const sellPrice = (75050000 + Math.random() * 1000000).toFixed(0);
        results.push(`💸 SELL: ${parseInt(sellPrice).toLocaleString()} VND`);
      }

      const spread = Math.floor(Math.random() * 100000);
      results.push(`📊 Spread: ${spread.toLocaleString()} VND`);
      results.push(`🎯 Signal: ${Math.random() > 0.5 ? "STRONG" : "WEAK"}`);

      resolve(results.join("<br>"));
    }, 1500);
  });
}

// Sử dụng:
// SideSelector.createSideSelector('trading-container');

if (typeof module !== "undefined") {
  module.exports = SideSelector;
}
