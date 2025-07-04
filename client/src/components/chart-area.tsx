import { useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  formatPrice,
  getPriceChangeClass,
  formatPercentage,
  getPriceChangeIcon,
} from "@/lib/trading-utils";

interface ChartAreaProps {
  selectedSymbol: string;
}

export default function ChartArea({ selectedSymbol }: ChartAreaProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { prices } = useWebSocket();

  const priceData = prices[selectedSymbol] || {
    bid: "0",
    ask: "0",
    change: "0",
    changePercent: "0",
  };
  const changeClass = getPriceChangeClass(priceData.changePercent);
  const changeIcon = getPriceChangeIcon(priceData.changePercent);

  useEffect(() => {
    if (chartContainerRef.current && window.TradingView) {
      // Clear existing widget
      if (widgetRef.current && widgetRef.current.remove) {
        widgetRef.current.remove();
      }

      // Create new widget
      widgetRef.current = new window.TradingView.widget({
        width: "100%",
        height: "100%",
        symbol: `FX:${selectedSymbol}`,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#2d2d2d",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: chartContainerRef.current.id,
        studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
      });
    }
  }, [selectedSymbol]);

  useEffect(() => {
    // Load TradingView script if not already loaded
    if (
      !window.TradingView &&
      !document.querySelector('script[src*="tradingview"]')
    ) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => {
        if (chartContainerRef.current) {
          widgetRef.current = new window.TradingView.widget({
            width: "100%",
            height: "100%",
            symbol: `FX:${selectedSymbol}`,
            interval: "15",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#2d2d2d",
            enable_publishing: false,
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: false,
            container_id: chartContainerRef.current.id,
            studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"],
          });
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="flex-1 trading-bg-primary p-4">
      <div className="trading-bg-secondary rounded-lg h-full">
        <div className="p-4 trading-border border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-white">
              {selectedSymbol}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-mono ${changeClass}`}>
                {formatPrice(priceData.bid, selectedSymbol)}
              </span>
              <span
                className={`text-sm px-2 py-1 rounded ${changeClass} ${
                  parseFloat(priceData.changePercent) >= 0
                    ? "bg-green-500/20"
                    : "bg-red-500/20"
                }`}
              >
                {changeIcon} {priceData.change} (
                {formatPercentage(priceData.changePercent)})
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm">
              1M
            </button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm">
              5M
            </button>
            <button className="px-3 py-1 trading-bg-success text-white rounded text-sm">
              15M
            </button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm">
              1H
            </button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm">
              1D
            </button>
          </div>
        </div>
        <div
          id={`tradingview_${selectedSymbol}`}
          ref={chartContainerRef}
          className="h-96"
        />
      </div>
    </div>
  );
}
