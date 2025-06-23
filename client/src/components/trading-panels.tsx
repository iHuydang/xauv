import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatPrice, formatCurrency, calculatePnL, getMultiplier } from '@/lib/trading-utils';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

export default function TradingPanels() {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { prices } = useWebSocket();

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['/api/positions'],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  const closePositionMutation = useMutation({
    mutationFn: (positionId: number) => 
      apiRequest('POST', `/api/positions/${positionId}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account'] });
      toast({
        title: "Position Closed",
        description: "Position has been successfully closed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close position. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateCurrentPnL = (position: any) => {
    const currentPrice = prices[position.symbol]?.bid || position.currentPrice;
    return calculatePnL(
      position.type,
      parseFloat(position.openPrice),
      parseFloat(currentPrice),
      parseFloat(position.volume),
      position.symbol
    );
  };

  const tabs = [
    { id: 'positions' as const, label: 'Positions', active: true },
    { id: 'orders' as const, label: 'Pending Orders', active: false },
    { id: 'history' as const, label: 'History', active: false },
  ];

  return (
    <div className="h-80 trading-bg-secondary trading-border border-t">
      <div className="flex trading-border border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'trading-text-success border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 overflow-y-auto h-full">
        {activeTab === 'positions' && (
          <div className="space-y-3">
            {positionsLoading ? (
              <div className="text-center text-gray-400 py-8">Loading positions...</div>
            ) : positions && positions.length > 0 ? (
              positions.map((position: any) => {
                const currentPnL = calculateCurrentPnL(position);
                const pnlPercent = (currentPnL / (parseFloat(position.openPrice) * parseFloat(position.volume) * getMultiplier(position.symbol))) * 100;

                return (
                  <div
                    key={position.id}
                    className="bg-gray-800 rounded-lg p-4 trading-border border"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${
                          position.type === 'buy' ? 'trading-bg-success' : 'trading-bg-danger'
                        }`} />
                        <div>
                          <div className="font-medium text-white">{position.symbol}</div>
                          <div className="text-sm text-gray-400">
                            {position.type === 'buy' ? 'Buy' : 'Sell'} {position.volume} lot
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white">
                          {formatPrice(position.openPrice, position.symbol)}
                        </div>
                        <div className="text-sm text-gray-400">Entry</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono ${currentPnL >= 0 ? 'trading-text-success' : 'trading-text-danger'}`}>
                          {currentPnL >= 0 ? '+' : ''}{formatCurrency(currentPnL)}
                        </div>
                        <div className={`text-sm ${currentPnL >= 0 ? 'trading-text-success' : 'trading-text-danger'}`}>
                          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                      <button
                        className="px-3 py-1 trading-bg-danger text-white rounded text-sm hover:bg-red-600 transition-colors"
                        onClick={() => closePositionMutation.mutate(position.id)}
                        disabled={closePositionMutation.isPending}
                      >
                        {closePositionMutation.isPending ? 'Closing...' : 'Close'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-8">No open positions</div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-3">
            {ordersLoading ? (
              <div className="text-center text-gray-400 py-8">Loading orders...</div>
            ) : orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <div
                  key={order.id}
                  className="bg-gray-800 rounded-lg p-4 trading-border border"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        order.type === 'buy' ? 'trading-bg-success' : 'trading-bg-danger'
                      }`} />
                      <div>
                        <div className="font-medium text-white">{order.symbol}</div>
                        <div className="text-sm text-gray-400">
                          {order.type === 'buy' ? 'Buy' : 'Sell'} {order.volume} lot
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white">
                        {order.price ? formatPrice(order.price, order.symbol) : 'Market'}
                      </div>
                      <div className="text-sm text-gray-400">{order.orderType}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-400 text-sm">{order.status}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">No pending orders</div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="text-center text-gray-400 py-8">
            Trade history will be displayed here
          </div>
        )}
      </div>
    </div>
  );
}