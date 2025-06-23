
// Quick Liquidity Scanner - Chèn code này để quét thanh khoản
const quickLiquidityScan = {
  // Quét thanh khoản cho bất kỳ cặp tiền/hàng hóa nào
  scanMarket: async (symbol, side = 'both') => {
    console.log(`🔍 Scanning ${symbol} - Side: ${side}`);
    
    const results = {
      symbol: symbol,
      timestamp: new Date().toISOString(),
      side: side,
      liquidity: {}
    };

    // Quét phe MUA (BUY)
    if (side === 'buy' || side === 'both') {
      results.liquidity.buy = {
        price: Math.random() * 100000 + 75000000, // Giá mua giả lập
        volume: Math.random() * 1000000,
        spread: Math.random() * 50000,
        signal: Math.random() > 0.5 ? 'STRONG' : 'WEAK'
      };
      console.log(`💰 BUY Side - Price: ${results.liquidity.buy.price.toLocaleString()}`);
    }

    // Quét phe BÁN (SELL) 
    if (side === 'sell' || side === 'both') {
      results.liquidity.sell = {
        price: Math.random() * 100000 + 75100000, // Giá bán giả lập
        volume: Math.random() * 1000000,
        spread: Math.random() * 50000,
        signal: Math.random() > 0.5 ? 'STRONG' : 'WEAK'
      };
      console.log(`💸 SELL Side - Price: ${results.liquidity.sell.price.toLocaleString()}`);
    }

    // Phân tích arbitrage giữa 2 phe
    if (side === 'both' && results.liquidity.buy && results.liquidity.sell) {
      const arbitrage = results.liquidity.sell.price - results.liquidity.buy.price;
      results.arbitrage = {
        profit: arbitrage,
        profitPercent: (arbitrage / results.liquidity.buy.price) * 100,
        signal: arbitrage > 50000 ? 'OPPORTUNITY' : 'NO_OPPORTUNITY'
      };
      console.log(`🎯 Arbitrage: ${arbitrage.toLocaleString()} VND (${results.arbitrage.profitPercent.toFixed(2)}%)`);
    }

    return results;
  },

  // Quét nhiều thị trường cùng lúc
  scanMultipleMarkets: async (symbols, side = 'both') => {
    console.log(`🚀 Multi-market scan for ${symbols.length} symbols`);
    
    const allResults = [];
    for (const symbol of symbols) {
      const result = await quickLiquidityScan.scanMarket(symbol, side);
      allResults.push(result);
      await new Promise(resolve => setTimeout(resolve, 100)); // Delay nhỏ
    }

    // Tìm cơ hội tốt nhất
    const bestOpportunity = allResults
      .filter(r => r.arbitrage && r.arbitrage.signal === 'OPPORTUNITY')
      .sort((a, b) => b.arbitrage.profit - a.arbitrage.profit)[0];

    if (bestOpportunity) {
      console.log(`🏆 BEST OPPORTUNITY: ${bestOpportunity.symbol} - ${bestOpportunity.arbitrage.profit.toLocaleString()} VND`);
    }

    return allResults;
  }
};

// Sử dụng ngay:
// quickLiquidityScan.scanMarket('XAUUSD', 'buy');     // Chỉ quét phe mua
// quickLiquidityScan.scanMarket('XAUUSD', 'sell');    // Chỉ quét phe bán  
// quickLiquidityScan.scanMarket('XAUUSD', 'both');    // Quét cả 2 phe

// Quét nhiều thị trường:
// quickLiquidityScan.scanMultipleMarkets(['XAUUSD', 'EURUSD', 'GBPUSD'], 'both');

module.exports = quickLiquidityScan;
