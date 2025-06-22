import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWebSocket } from '@/hooks/use-websocket';
import { formatPrice, formatCurrency } from '@/lib/trading-utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrderPanelProps {
  selectedSymbol: string;
}

export default function OrderPanel({ selectedSymbol }: OrderPanelProps) {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [volume, setVolume] = useState('0.10');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { prices } = useWebSocket();

  const { data: account } = useQuery({
    queryKey: ['/api/account'],
  });

  const placeOrderMutation = useMutation({
    mutationFn: (orderData: any) => apiRequest('POST', '/api/orders', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account'] });
      toast({
        title: "Order Placed",
        description: "Your order has been successfully placed.",
      });
      // Reset form
      setVolume('0.10');
      setStopLoss('');
      setTakeProfit('');
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentPrice = prices[selectedSymbol];
  const bidPrice = currentPrice?.bid || '0';
  const askPrice = currentPrice?.ask || '0';

  const handlePlaceOrder = () => {
    const orderData = {
      symbol: selectedSymbol,
      type: orderType,
      orderType: 'market',
      volume: parseFloat(volume),
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    };

    placeOrderMutation.mutate(orderData);
  };

  const calculateMargin = () => {
    const vol = parseFloat(volume) || 0;
    const price = parseFloat(orderType === 'buy' ? askPrice : bidPrice) || 0;
    
    // Simplified margin calculation (1:100 leverage)
    let marginRequired = 0;
    switch (selectedSymbol) {
      case 'XAUUSD':
        marginRequired = vol * price; // For gold, 1 lot = 100 oz
        break;
      case 'BTCUSD':
        marginRequired = vol * price; // For BTC, 1 lot = 1 BTC
        break;
      default:
        marginRequired = vol * 100000 / 100; // Forex pairs with 1:100 leverage
        break;
    }
    
    return marginRequired;
  };

  const marginRequired = calculateMargin();
  const spread = currentPrice ? (parseFloat(askPrice) - parseFloat(bidPrice)).toFixed(5) : '0';

  return (
    <div className="w-80 trading-bg-secondary trading-border border-l">
      <div className="p-4 trading-border border-b">
        <h2 className="text-lg font-semibold text-white">New Order</h2>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <Label className="text-gray-400">Symbol</Label>
          <div className="mt-2 px-3 py-2 trading-bg-primary trading-border border rounded-lg text-white">
            {selectedSymbol}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            className={`font-semibold py-6 transition-colors ${
              orderType === 'buy'
                ? 'trading-bg-success hover:bg-green-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            onClick={() => setOrderType('buy')}
          >
            <div className="text-center">
              <div className="text-sm">BUY</div>
              <div className="font-mono">
                {formatPrice(askPrice, selectedSymbol)}
              </div>
            </div>
          </Button>
          <Button
            className={`font-semibold py-6 transition-colors ${
              orderType === 'sell'
                ? 'trading-bg-danger hover:bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            onClick={() => setOrderType('sell')}
          >
            <div className="text-center">
              <div className="text-sm">SELL</div>
              <div className="font-mono">
                {formatPrice(bidPrice, selectedSymbol)}
              </div>
            </div>
          </Button>
        </div>

        <div>
          <Label htmlFor="volume" className="text-gray-400">Volume (Lots)</Label>
          <Input
            id="volume"
            type="number"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="mt-2 bg-gray-800 trading-border border text-white focus:border-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="stopLoss" className="text-gray-400">Stop Loss</Label>
            <Input
              id="stopLoss"
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Optional"
              className="mt-2 bg-gray-800 trading-border border text-white focus:border-green-500"
            />
          </div>
          <div>
            <Label htmlFor="takeProfit" className="text-gray-400">Take Profit</Label>
            <Input
              id="takeProfit"
              type="number"
              step="0.01"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Optional"
              className="mt-2 bg-gray-800 trading-border border text-white focus:border-green-500"
            />
          </div>
        </div>

        <Button
          onClick={handlePlaceOrder}
          disabled={placeOrderMutation.isPending || !volume || parseFloat(volume) <= 0}
          className="w-full trading-bg-success hover:bg-green-600 text-white font-semibold py-3"
        >
          {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Margin Required:</span>
            <span>{formatCurrency(marginRequired)}</span>
          </div>
          <div className="flex justify-between">
            <span>Spread:</span>
            <span>{spread}</span>
          </div>
        </div>
      </div>

      <div className="p-4 trading-border border-t">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Account Info</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Balance:</span>
            <span className="text-white">
              {account ? formatCurrency(account.balance) : '$10,247.83'}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Equity:</span>
            <span className="text-white">
              {account ? formatCurrency(account.equity) : '$10,359.21'}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Free Margin:</span>
            <span className="text-white">
              {account ? formatCurrency(account.freeMargin) : '$9,844.73'}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Margin Level:</span>
            <span className="trading-text-success">
              {account ? account.marginLevel + '%' : '2,014.5%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
