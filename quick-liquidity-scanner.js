// Quick Liquidity Scanner - Chèn code này để quét thanh khoản
const quickLiquidityScan = {
  // Quét thanh khoản phe mua XAUUSD khi giá rớt
  scanXAUUSDFallingBuy: async () => {
    console.log(`🔻 XAUUSD FALLING - Scanning BUY side liquidity...`);

    const currentPrice = 2680 + (Math.random() * 20 - 10); // Simulate current gold price
    const priceChange = -(Math.random() * 5 + 1); // Negative change (falling)

    const results = {
      symbol: "XAUUSD",
      timestamp: new Date().toISOString(),
      side: "buy",
      marketCondition: "falling",
      priceChange: priceChange,
      currentPrice: currentPrice,
      liquidity: {
        buy: {
          price: currentPrice,
          volume: Math.random() * 5000000 + 1000000, // High volume on dips
          depth: {
            level1: Math.random() * 1000000 + 500000,
            level2: Math.random() * 800000 + 300000,
            level3: Math.random() * 600000 + 200000,
            level4: Math.random() * 400000 + 100000,
            level5: Math.random() * 200000 + 50000,
          },
          spread: Math.random() * 0.5 + 0.2, // Spread in USD
          signal:
            priceChange < -3
              ? "VERY_STRONG"
              : priceChange < -2
                ? "STRONG"
                : "MODERATE",
          buyPressure: Math.abs(priceChange) * 20, // Higher buy pressure when price falls more
          supportLevels: [
            currentPrice - 5,
            currentPrice - 10,
            currentPrice - 15,
            currentPrice - 20,
          ],
          institutionalFlow: Math.random() > 0.3 ? "ACCUMULATING" : "WATCHING",
        },
      },
      opportunities: [],
    };

    // Phân tích cơ hội mua khi giá rớt
    if (priceChange < -2) {
      results.opportunities.push({
        type: "DIP_BUYING",
        strength: "HIGH",
        reason: `Gold fell ${Math.abs(priceChange).toFixed(2)}% - Strong dip buying opportunity`,
        recommendedAction: "IMMEDIATE_BUY",
        targetPrice: currentPrice - 2,
        stopLoss: currentPrice - 8,
        takeProfit: currentPrice + 15,
      });
    }

    if (results.liquidity.buy.institutionalFlow === "ACCUMULATING") {
      results.opportunities.push({
        type: "INSTITUTIONAL_FOLLOW",
        strength: "MEDIUM",
        reason: "Institutional accumulation detected during price decline",
        recommendedAction: "FOLLOW_SMART_MONEY",
        volume: "INCREASE_POSITION_SIZE",
      });
    }

    console.log(
      `📉 Price: $${currentPrice.toFixed(2)} (${priceChange.toFixed(2)}%)`,
    );
    console.log(
      `💰 BUY Liquidity: ${results.liquidity.buy.volume.toLocaleString()}`,
    );
    console.log(`🎯 Buy Signal: ${results.liquidity.buy.signal}`);
    console.log(
      `📊 Buy Pressure: ${results.liquidity.buy.buyPressure.toFixed(1)}%`,
    );
    console.log(`🏦 Institutional: ${results.liquidity.buy.institutionalFlow}`);

    return results;
  },

  // Quét thanh khoản cho bất kỳ cặp tiền/hàng hóa nào
  scanMarket: async (symbol, side = "both") => {
    console.log(`🔍 Scanning ${symbol} - Side: ${side}`);

    const results = {
      symbol: symbol,
      timestamp: new Date().toISOString(),
      side: side,
      liquidity: {},
    };

    // Quét phe MUA (BUY)
    if (side === "buy" || side === "both") {
      results.liquidity.buy = {
        price: Math.random() * 100000 + 75000000, // Giá mua giả lập
        volume: Math.random() * 1000000,
        spread: Math.random() * 50000,
        signal: Math.random() > 0.5 ? "STRONG" : "WEAK",
      };
      console.log(
        `💰 BUY Side - Price: ${results.liquidity.buy.price.toLocaleString()}`,
      );
    }

    // Quét phe BÁN (SELL)
    if (side === "sell" || side === "both") {
      results.liquidity.sell = {
        price: Math.random() * 100000 + 75100000, // Giá bán giả lập
        volume: Math.random() * 1000000,
        spread: Math.random() * 50000,
        signal: Math.random() > 0.5 ? "STRONG" : "WEAK",
      };
      console.log(
        `💸 SELL Side - Price: ${results.liquidity.sell.price.toLocaleString()}`,
      );
    }

    // Phân tích arbitrage giữa 2 phe
    if (side === "both" && results.liquidity.buy && results.liquidity.sell) {
      const arbitrage =
        results.liquidity.sell.price - results.liquidity.buy.price;
      results.arbitrage = {
        profit: arbitrage,
        profitPercent: (arbitrage / results.liquidity.buy.price) * 100,
        signal: arbitrage > 50000 ? "OPPORTUNITY" : "NO_OPPORTUNITY",
      };
      console.log(
        `🎯 Arbitrage: ${arbitrage.toLocaleString()} VND (${results.arbitrage.profitPercent.toFixed(2)}%)`,
      );
    }

    return results;
  },

  // Theo dõi liên tục XAUUSD phe mua khi giá rớt
  monitorXAUUSDFallingBuy: async (intervalSeconds = 30) => {
    console.log(
      `🔄 Starting XAUUSD falling buy-side monitoring (${intervalSeconds}s interval)`,
    );

    const monitoringResults = [];
    let consecutiveFalls = 0;

    const monitor = setInterval(async () => {
      const result = await quickLiquidityScan.scanXAUUSDFallingBuy();
      monitoringResults.push(result);

      if (result.priceChange < -1) {
        consecutiveFalls++;
        console.log(`🔥 Consecutive falls: ${consecutiveFalls}`);

        if (consecutiveFalls >= 3) {
          console.log(`🚨 MAJOR DIP ALERT - 3+ consecutive falls detected!`);
          console.log(`💎 STRONG BUY RECOMMENDATION - Accumulate on weakness`);

          // Trigger alert for major buying opportunity
          console.log(`⚡ EXECUTION SIGNAL:`);
          console.log(`   📊 Entry: $${result.currentPrice.toFixed(2)}`);
          console.log(
            `   🎯 Target: $${(result.currentPrice + 20).toFixed(2)}`,
          );
          console.log(`   🛡️ Stop: $${(result.currentPrice - 10).toFixed(2)}`);
        }
      } else {
        consecutiveFalls = 0;
      }

      // Keep only last 20 results
      if (monitoringResults.length > 20) {
        monitoringResults.shift();
      }
    }, intervalSeconds * 1000);

    return monitor;
  },

  // Phân tích sâu thanh khoản phe mua XAUUSD
  analyzeXAUUSDBuyDepth: async () => {
    console.log(`📊 Deep XAUUSD buy-side liquidity analysis...`);

    const analysis = {
      timestamp: new Date().toISOString(),
      symbol: "XAUUSD",
      side: "buy",
      depthAnalysis: {
        totalBuyVolume: 0,
        averagePrice: 0,
        liquidityScore: 0,
        marketImpact: 0,
      },
      levels: [],
    };

    // Tạo 10 levels thanh khoản
    let basePrice = 2680 + (Math.random() * 10 - 5);
    let totalVolume = 0;
    let weightedPriceSum = 0;

    for (let i = 1; i <= 10; i++) {
      const levelPrice = basePrice - i * 0.5; // Mỗi level cách 0.5 USD
      const levelVolume = Math.random() * 500000 + 100000; // 100k - 600k volume
      const levelSpread = Math.random() * 0.3 + 0.1;

      totalVolume += levelVolume;
      weightedPriceSum += levelPrice * levelVolume;

      analysis.levels.push({
        level: i,
        price: levelPrice,
        volume: levelVolume,
        spread: levelSpread,
        cumulativeVolume: totalVolume,
        resistance: i <= 3 ? "WEAK" : i <= 6 ? "MEDIUM" : "STRONG",
      });
    }

    analysis.depthAnalysis.totalBuyVolume = totalVolume;
    analysis.depthAnalysis.averagePrice = weightedPriceSum / totalVolume;
    analysis.depthAnalysis.liquidityScore = Math.min(
      (totalVolume / 1000000) * 100,
      100,
    );
    analysis.depthAnalysis.marketImpact = Math.max(
      0,
      100 - analysis.depthAnalysis.liquidityScore,
    );

    console.log(`📈 Total Buy Volume: ${totalVolume.toLocaleString()}`);
    console.log(
      `💰 Average Buy Price: $${analysis.depthAnalysis.averagePrice.toFixed(2)}`,
    );
    console.log(
      `🎯 Liquidity Score: ${analysis.depthAnalysis.liquidityScore.toFixed(1)}/100`,
    );
    console.log(
      `⚡ Market Impact: ${analysis.depthAnalysis.marketImpact.toFixed(1)}%`,
    );

    return analysis;
  },

  // Quét nhiều thị trường cùng lúc
  scanMultipleMarkets: async (symbols, side = "both") => {
    console.log(`🚀 Multi-market scan for ${symbols.length} symbols`);

    const allResults = [];
    for (const symbol of symbols) {
      const result = await quickLiquidityScan.scanMarket(symbol, side);
      allResults.push(result);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Delay nhỏ
    }

    // Tìm cơ hội tốt nhất
    const bestOpportunity = allResults
      .filter((r) => r.arbitrage && r.arbitrage.signal === "OPPORTUNITY")
      .sort((a, b) => b.arbitrage.profit - a.arbitrage.profit)[0];

    if (bestOpportunity) {
      console.log(
        `🏆 BEST OPPORTUNITY: ${bestOpportunity.symbol} - ${bestOpportunity.arbitrage.profit.toLocaleString()} VND`,
      );
    }

    return allResults;
  },
};

// Sử dụng ngay:
// quickLiquidityScan.scanMarket('XAUUSD', 'buy');     // Chỉ quét phe mua
// quickLiquidityScan.scanMarket('XAUUSD', 'sell');    // Chỉ quét phe bán
// quickLiquidityScan.scanMarket('XAUUSD', 'both');    // Quét cả 2 phe

// Quét nhiều thị trường:
// quickLiquidityScan.scanMultipleMarkets(['XAUUSD', 'EURUSD', 'GBPUSD'], 'both');

module.exports = quickLiquidityScan;
