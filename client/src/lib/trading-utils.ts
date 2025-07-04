export function calculatePnL(
  type: "buy" | "sell",
  openPrice: number,
  currentPrice: number,
  volume: number,
  symbol: string,
): number {
  const multiplier = getMultiplier(symbol);
  let pnl = 0;

  if (type === "buy") {
    pnl = (currentPrice - openPrice) * volume * multiplier;
  } else {
    pnl = (openPrice - currentPrice) * volume * multiplier;
  }

  return pnl;
}

export function getMultiplier(symbol: string): number {
  // Contract size multipliers for different symbols
  switch (symbol) {
    case "XAUUSD":
      return 100; // 100 oz per lot
    case "EURUSD":
    case "GBPUSD":
    case "USDJPY":
      return 100000; // 100,000 units per lot
    case "BTCUSD":
      return 1; // 1 BTC per lot
    default:
      return 100000;
  }
}

export function formatPrice(price: string | number, symbol: string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  switch (symbol) {
    case "USDJPY":
      return numPrice.toFixed(2);
    case "BTCUSD":
      return numPrice.toFixed(2);
    case "XAUUSD":
      return numPrice.toFixed(2);
    default:
      return numPrice.toFixed(5);
  }
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatPercentage(percent: string | number): string {
  const numPercent =
    typeof percent === "string" ? parseFloat(percent) : percent;
  const sign = numPercent >= 0 ? "+" : "";
  return `${sign}${numPercent.toFixed(2)}%`;
}

export function getPriceChangeClass(change: string | number): string {
  const numChange = typeof change === "string" ? parseFloat(change) : change;
  if (numChange > 0) return "price-up";
  if (numChange < 0) return "price-down";
  return "price-neutral";
}

export function getPriceChangeIcon(change: string | number): string {
  const numChange = typeof change === "string" ? parseFloat(change) : change;
  if (numChange > 0) return "▲";
  if (numChange < 0) return "▼";
  return "▬";
}
