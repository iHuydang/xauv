import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { formatPrice, getPriceChangeClass, getPriceChangeIcon, formatPercentage } from '@/lib/trading-utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3, Save, X } from 'lucide-react';

interface MarketWatchProps {
  onSymbolSelect: (symbol: string) => void;
  selectedSymbol: string;
}

interface EditingPrice {
  symbol: string;
  bid: string;
  ask: string;
}

export default function MarketWatch({ onSymbolSelect, selectedSymbol }: MarketWatchProps) {
  const { data: symbols } = useQuery({
    queryKey: ['/api/symbols'],
  });

  const { prices } = useWebSocket();
  const [editingPrice, setEditingPrice] = useState<EditingPrice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getPrice = (symbol: string) => {
    return prices[symbol] || { bid: '0', ask: '0', change: '0', changePercent: '0' };
  };

  const handleEditPrice = (symbol: any) => {
    const priceData = getPrice(symbol.symbol);
    setEditingPrice({
      symbol: symbol.symbol,
      bid: priceData.bid || symbol.bid,
      ask: priceData.ask || symbol.ask,
    });
  };

  const handleSavePrice = async () => {
    if (!editingPrice) return;
    
    try {
      const response = await fetch(`/api/symbols/${editingPrice.symbol}/price`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bid: editingPrice.bid,
          ask: editingPrice.ask,
        }),
      });
      
      if (response.ok) {
        setEditingPrice(null);
      }
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
  };

  const filteredSymbols = symbols?.filter(symbol => 
    symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    symbol.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedSymbols = filteredSymbols?.reduce((acc, symbol) => {
    let category = 'Other';
    
    if (symbol.symbol.includes('USD') || symbol.symbol.includes('EUR') || symbol.symbol.includes('GBP') || symbol.symbol.includes('JPY')) {
      category = 'Forex';
    } else if (symbol.symbol.startsWith('XAU') || symbol.symbol.startsWith('XAG') || symbol.symbol.startsWith('XPT') || symbol.symbol.startsWith('XPD')) {
      category = 'Metals';
    } else if (symbol.symbol.includes('OIL')) {
      category = 'Energy';
    } else if (symbol.symbol.match(/US30|US500|NAS100|GER40|UK100|JPN225/)) {
      category = 'Indices';
    } else if (symbol.symbol.includes('BTC') || symbol.symbol.includes('ETH') || symbol.symbol.includes('ADA') || symbol.symbol.includes('SOL')) {
      category = 'Crypto';
    }
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(symbol);
    return acc;
  }, {} as Record<string, any[]>) || {};

  return (
    <div className="w-96 trading-bg-secondary trading-border border-r overflow-hidden flex flex-col">
      <div className="p-4 trading-border border-b">
        <h2 className="text-lg font-semibold text-white mb-3">Market Watch</h2>
        <Input
          placeholder="Tìm kiếm cặp tiền..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedSymbols).map(([category, categorySymbols]) => (
          <div key={category}>
            <div className="px-4 py-2 bg-gray-800 trading-border border-b">
              <h3 className="text-sm font-medium text-gray-300">{category}</h3>
            </div>
            
            {categorySymbols.map((symbol) => {
              const priceData = getPrice(symbol.symbol);
              const changeClass = getPriceChangeClass(priceData.changePercent || symbol.changePercent);
              const changeIcon = getPriceChangeIcon(priceData.changePercent || symbol.changePercent);
              const isEditing = editingPrice?.symbol === symbol.symbol;
              
              return (
                <div
                  key={symbol.symbol}
                  className={`px-4 py-3 trading-border border-b hover:bg-gray-800 transition-colors ${
                    selectedSymbol === symbol.symbol ? 'bg-gray-800' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onSymbolSelect(symbol.symbol)}
                    >
                      <div className="font-medium text-white text-sm">{symbol.symbol}</div>
                      <div className="text-xs text-gray-400 truncate">{symbol.name}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <Input
                              value={editingPrice.bid}
                              onChange={(e) => setEditingPrice({...editingPrice, bid: e.target.value})}
                              className="w-20 h-6 text-xs bg-gray-700 border-gray-600"
                              placeholder="Bid"
                            />
                            <Input
                              value={editingPrice.ask}
                              onChange={(e) => setEditingPrice({...editingPrice, ask: e.target.value})}
                              className="w-20 h-6 text-xs bg-gray-700 border-gray-600"
                              placeholder="Ask"
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                              onClick={handleSavePrice}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="text-xs">
                              <div className="text-red-400 font-mono">
                                {formatPrice(priceData.bid || symbol.bid, symbol.symbol)}
                              </div>
                              <div className="text-blue-400 font-mono">
                                {formatPrice(priceData.ask || symbol.ask, symbol.symbol)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-gray-700"
                              onClick={() => handleEditPrice(symbol)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-xs">
                            <span className={changeClass}>
                              {changeIcon} {formatPercentage(priceData.changePercent || symbol.changePercent)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
