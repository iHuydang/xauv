import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { formatPrice, getPriceChangeClass, getPriceChangeIcon, formatPercentage } from '@/lib/trading-utils';

interface MarketWatchProps {
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
}

export default function MarketWatch({ onSymbolSelect, selectedSymbol }: MarketWatchProps) {
  const { data: symbols } = useQuery({
    queryKey: ['/api/symbols'],
  });

  const { prices } = useWebSocket();

  const getPrice = (symbol: string) => {
    return prices[symbol] || { bid: '0', ask: '0', change: '0', changePercent: '0' };
  };

  return (
    <div className="w-80 trading-bg-secondary trading-border border-r overflow-hidden">
      <div className="p-4 trading-border border-b">
        <h2 className="text-lg font-semibold text-white">Market Watch</h2>
      </div>
      <div className="overflow-y-auto h-full">
        {symbols?.map((symbol) => {
          const priceData = getPrice(symbol.symbol);
          const changeClass = getPriceChangeClass(priceData.changePercent);
          const changeIcon = getPriceChangeIcon(priceData.changePercent);
          
          return (
            <div
              key={symbol.symbol}
              className={`px-4 py-3 trading-border border-b hover:bg-gray-800 cursor-pointer transition-colors ${
                selectedSymbol === symbol.symbol ? 'bg-gray-800' : ''
              }`}
              onClick={() => onSymbolSelect(symbol.symbol)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">{symbol.symbol}</div>
                  <div className="text-xs text-gray-400">{symbol.name}</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono ${changeClass}`}>
                    {formatPrice(priceData.bid || symbol.bid, symbol.symbol)}
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className={changeClass}>
                      {changeIcon} {formatPercentage(priceData.changePercent || symbol.changePercent)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
