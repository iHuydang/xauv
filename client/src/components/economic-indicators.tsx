
import { useState } from 'react';
import { useFredIndicators } from '@/hooks/use-fred-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Settings, RefreshCw } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/trading-utils';

export default function EconomicIndicators() {
  const { 
    indicatorData, 
    isLoading, 
    error, 
    selectedIndicators, 
    setSelectedIndicators,
    availableIndicators 
  } = useFredIndicators();
  
  const [showSettings, setShowSettings] = useState(false);

  const handleIndicatorToggle = (seriesId: string) => {
    setSelectedIndicators(prev => 
      prev.includes(seriesId)
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  const formatValue = (value: string, seriesId: string) => {
    const numValue = parseFloat(value);
    
    // Format based on the type of indicator
    switch (seriesId) {
      case 'FEDFUNDS':
      case 'DGS10':
      case 'DGS2':
      case 'UNRATE':
        return `${numValue.toFixed(2)}%`;
      case 'GOLDAMGBD228NLBM':
      case 'DCOILWTICO':
        return formatCurrency(numValue);
      case 'PAYEMS':
        return `${(numValue / 1000).toFixed(0)}K`;
      case 'GDP':
      case 'GDPC1':
        return `$${(numValue / 1000).toFixed(1)}T`;
      case 'CPIAUCSL':
      case 'CPILFESL':
        return numValue.toFixed(1);
      case 'DTWEXBGS':
        return numValue.toFixed(2);
      default:
        return value;
    }
  };

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-900/30">
        <CardContent className="p-4">
          <div className="text-red-400 text-sm">
            Failed to load economic data. Using demo mode.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300">
            Economic Indicators
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-3">
        {showSettings && (
          <div className="border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="text-xs text-gray-400 mb-2">Select Indicators:</div>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(availableIndicators).map(([key, indicator]) => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIndicators.includes(indicator.id)}
                    onChange={() => handleIndicatorToggle(indicator.id)}
                    className="w-3 h-3"
                  />
                  <span className="text-gray-300">{indicator.name}</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {indicator.category}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {indicatorData.map((item) => {
            if (!item.latestValue || !item.indicator) return null;
            
            const value = parseFloat(item.latestValue.value);
            const formattedValue = formatValue(item.latestValue.value, item.seriesId);
            const date = new Date(item.latestValue.date).toLocaleDateString();
            
            return (
              <div key={item.seriesId} className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate">
                    {item.indicator.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {date}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {formattedValue}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 border-gray-600 text-gray-400"
                    >
                      {item.indicator.category}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {indicatorData.length === 0 && !isLoading && (
          <div className="text-xs text-gray-500 text-center py-4">
            No economic data available
          </div>
        )}
        
        <div className="text-xs text-gray-600 pt-2 border-t border-gray-700">
          Data from Federal Reserve Economic Data (FRED)
        </div>
      </CardContent>
    </Card>
  );
}
