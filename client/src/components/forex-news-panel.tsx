
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, ExternalLink } from 'lucide-react';

interface ForexNews {
  title: string;
  content: string;
  category: string;
  impact: 'low' | 'medium' | 'high';
  source: string;
  timestamp: string;
  symbols?: string[];
}

interface TradingSignal {
  symbol: string;
  type: 'buy' | 'sell';
  strength: 'weak' | 'medium' | 'strong';
  timeframe: string;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
  source: string;
  timestamp: string;
}

export default function ForexNewsPanel() {
  const { data: forexNews } = useQuery<ForexNews[]>({
    queryKey: ['/api/forex-news'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: tradingSignals } = useQuery<TradingSignal[]>({
    queryKey: ['/api/trading-signals'],
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getSignalColor = (type: string, strength: string) => {
    if (type === 'buy') {
      return strength === 'strong' ? 'bg-green-600' : strength === 'medium' ? 'bg-green-500' : 'bg-green-400';
    } else {
      return strength === 'strong' ? 'bg-red-600' : strength === 'medium' ? 'bg-red-500' : 'bg-red-400';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl trading-bg-secondary trading-border border rounded-lg">
      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="news">Tin Tức Forex</TabsTrigger>
          <TabsTrigger value="signals">Tín Hiệu Trading</TabsTrigger>
          <TabsTrigger value="brokers">Kết Nối Sàn</TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="space-y-4 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              Tin Tức Từ Các Sàn Forex
            </h3>
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Tác động cao
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Tác động trung bình
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Tác động thấp
              </span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {forexNews?.map((news, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm text-white line-clamp-2">
                      {news.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge className={`${getImpactColor(news.impact)} text-white`}>
                        {news.impact.toUpperCase()}
                      </Badge>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(news.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-300 mb-2 line-clamp-3">
                    {news.content}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-400">{news.source}</span>
                      {news.symbols && (
                        <div className="flex gap-1">
                          {news.symbols.slice(0, 3).map(symbol => (
                            <Badge key={symbol} variant="outline" className="text-xs">
                              {symbol}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 text-xs">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4 p-4">
          <h3 className="text-lg font-semibold text-white">
            Tín Hiệu Trading Tự Động
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tradingSignals?.map((signal, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{signal.symbol}</span>
                      <Badge className={`${getSignalColor(signal.type, signal.strength)} text-white text-xs`}>
                        {signal.type === 'buy' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {signal.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {signal.strength}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">{signal.timeframe}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span>Giá vào:</span>
                      <span className="font-mono">{signal.price}</span>
                    </div>
                    {signal.stopLoss && (
                      <div className="flex justify-between">
                        <span>Stop Loss:</span>
                        <span className="font-mono text-red-400">{signal.stopLoss}</span>
                      </div>
                    )}
                    {signal.takeProfit && (
                      <div className="flex justify-between">
                        <span>Take Profit:</span>
                        <span className="font-mono text-green-400">{signal.takeProfit}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-400">{signal.reason}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-blue-400">{signal.source}</span>
                      <span className="text-xs text-gray-500">{formatTime(signal.timestamp)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-4 p-4">
          <BrokerConnectionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BrokerConnectionPanel() {
  const { data: brokerAccounts } = useQuery({
    queryKey: ['/api/broker-accounts'],
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">
        Kết Nối Các Sàn Giao Dịch
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brokerAccounts?.map((account: any, index: number) => (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-white">{account.broker}</span>
                <Badge className="bg-green-600 text-white">Kết nối</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Số dư:</span>
                  <span className="text-white font-mono">${account.balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Equity:</span>
                  <span className="text-white font-mono">${account.equity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Margin Level:</span>
                  <span className="text-white font-mono">{account.marginLevel.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Positions:</span>
                  <span className="text-white">{account.positions.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
