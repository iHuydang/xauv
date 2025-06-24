import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { TrendingUp, TrendingDown, Activity, Database, Wifi, WifiOff } from 'lucide-react';

interface MarketDataPoint {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
  change?: number;
  changePercent?: number;
  source: 'twelvedata';
}

interface ConnectionStatus {
  websocket_connected: boolean;
  subscribed_symbols: number;
  market_data_cached: number;
  rate_limit_status: {
    requests_per_minute: number;
    requests_per_day: number;
    limit_per_minute: number;
    limit_per_day: number;
  };
}

export function TwelveDataControl() {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [subscribeSymbols, setSubscribeSymbols] = useState('');
  const [realTimeData, setRealTimeData] = useState<Map<string, MarketDataPoint>>(new Map());
  const [wsConnected, setWsConnected] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: connectionStatus } = useQuery({
    queryKey: ['/api/twelvedata/status'],
    refetchInterval: 5000
  });

  const { data: forexPairs } = useQuery({
    queryKey: ['/api/twelvedata/forex-pairs']
  });

  const { data: exchanges } = useQuery({
    queryKey: ['/api/twelvedata/exchanges']
  });

  const { data: marketData } = useQuery({
    queryKey: ['/api/twelvedata/market-data'],
    refetchInterval: 2000
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['/api/twelvedata/subscriptions'],
    refetchInterval: 3000
  });

  // Mutations
  const subscribeMutation = useMutation({
    mutationFn: (symbols: string[]) => 
      apiRequest('/api/twelvedata/subscribe', 'POST', { symbols }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twelvedata/subscriptions'] });
      setSubscribeSymbols('');
    }
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (symbols: string[]) => 
      apiRequest('/api/twelvedata/unsubscribe', 'POST', { symbols }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twelvedata/subscriptions'] });
    }
  });

  const integrateMutation = useMutation({
    mutationFn: (system: 'gold' | 'forex') => 
      apiRequest(`/api/twelvedata/integrate/${system}-system`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/twelvedata/subscriptions'] });
    }
  });

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/twelvedata`);
    
    ws.onopen = () => {
      setWsConnected(true);
      console.log('TwelveData WebSocket connected');
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('TwelveData WebSocket disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'price_update' && message.data) {
          setRealTimeData(prev => {
            const newData = new Map(prev);
            newData.set(message.symbol, message.data);
            return newData;
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSubscribe = () => {
    if (subscribeSymbols.trim()) {
      const symbols = subscribeSymbols.split(',').map(s => s.trim().toUpperCase());
      subscribeMutation.mutate(symbols);
    }
  };

  const handleUnsubscribe = (symbol: string) => {
    unsubscribeMutation.mutate([symbol]);
  };

  const formatPrice = (price: number) => {
    return price.toFixed(5);
  };

  const formatChange = (change: number | undefined) => {
    if (!change) return '0.00';
    return change > 0 ? `+${change.toFixed(5)}` : change.toFixed(5);
  };

  const getRateLimitPercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            TwelveData Market Intelligence
          </CardTitle>
          <CardDescription>
            Real-time financial market data with advanced analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {wsConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    Subscriptions: {connectionStatus?.data?.subscribed_symbols || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">
                    Cached Data: {connectionStatus?.data?.market_data_cached || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {connectionStatus?.data?.rate_limit_status && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-3">API Rate Limits</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Requests per minute</span>
                      <span>
                        {connectionStatus.data.rate_limit_status.requests_per_minute} / {connectionStatus.data.rate_limit_status.limit_per_minute}
                      </span>
                    </div>
                    <Progress 
                      value={getRateLimitPercentage(
                        connectionStatus.data.rate_limit_status.requests_per_minute,
                        connectionStatus.data.rate_limit_status.limit_per_minute
                      )} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Requests per day</span>
                      <span>
                        {connectionStatus.data.rate_limit_status.requests_per_day} / {connectionStatus.data.rate_limit_status.limit_per_day}
                      </span>
                    </div>
                    <Progress 
                      value={getRateLimitPercentage(
                        connectionStatus.data.rate_limit_status.requests_per_day,
                        connectionStatus.data.rate_limit_status.limit_per_day
                      )} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="realtime" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="markets">Markets</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="realtime" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Market Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {Array.from(realTimeData.entries()).map(([symbol, data]) => (
                        <div key={symbol} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{symbol}</Badge>
                            <span className="font-mono text-lg">
                              {formatPrice(data.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {data.change && (
                              <div className={`flex items-center gap-1 ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {data.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                <span className="text-sm font-mono">
                                  {formatChange(data.change)}
                                </span>
                                {data.changePercent && (
                                  <span className="text-xs">
                                    ({data.changePercent.toFixed(2)}%)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {realTimeData.size === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No real-time data available. Subscribe to symbols to see live updates.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Symbol Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter symbols (e.g., EURUSD,GBPUSD,XAUUSD)"
                        value={subscribeSymbols}
                        onChange={(e) => setSubscribeSymbols(e.target.value)}
                      />
                      <Button 
                        onClick={handleSubscribe}
                        disabled={subscribeMutation.isPending || !subscribeSymbols.trim()}
                      >
                        Subscribe
                      </Button>
                    </div>

                    <Separator />

                    <ScrollArea className="h-60">
                      <div className="space-y-2">
                        {subscriptions?.data?.subscribed_symbols?.map((symbol: string) => (
                          <div key={symbol} className="flex items-center justify-between p-2 border rounded">
                            <Badge variant="secondary">{symbol}</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnsubscribe(symbol)}
                              disabled={unsubscribeMutation.isPending}
                            >
                              Unsubscribe
                            </Button>
                          </div>
                        ))}
                        {(!subscriptions?.data?.subscribed_symbols || subscriptions.data.subscribed_symbols.length === 0) && (
                          <div className="text-center text-muted-foreground py-4">
                            No active subscriptions
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="markets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Forex Pairs</CardTitle>
                    <CardDescription>
                      Available: {forexPairs?.data?.total_count || 0} pairs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-60">
                      <div className="space-y-1">
                        {forexPairs?.data?.forex_pairs?.slice(0, 20).map((pair: any) => (
                          <div key={pair.symbol} className="text-sm p-2 border rounded">
                            <div className="font-mono">{pair.symbol}</div>
                            <div className="text-xs text-muted-foreground">
                              {pair.currency_base}/{pair.currency_quote}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Exchanges</CardTitle>
                    <CardDescription>
                      Available: {exchanges?.data?.total_count || 0} exchanges
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-60">
                      <div className="space-y-1">
                        {exchanges?.data?.exchanges?.slice(0, 20).map((exchange: any) => (
                          <div key={exchange.code} className="text-sm p-2 border rounded">
                            <div className="font-medium">{exchange.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {exchange.country} • {exchange.code}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Integration</CardTitle>
                  <CardDescription>
                    Connect TwelveData with existing trading systems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => integrateMutation.mutate('gold')}
                        disabled={integrateMutation.isPending}
                        className="h-20 flex flex-col gap-2"
                      >
                        <span className="font-medium">Gold Attack System</span>
                        <span className="text-xs opacity-80">
                          XAUUSD, XAUEUR, XAUJPY, XAUGBP
                        </span>
                      </Button>

                      <Button
                        onClick={() => integrateMutation.mutate('forex')}
                        disabled={integrateMutation.isPending}
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                      >
                        <span className="font-medium">Forex System</span>
                        <span className="text-xs opacity-80">
                          Major pairs + crosses
                        </span>
                      </Button>
                    </div>

                    {integrateMutation.isSuccess && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="text-sm text-green-800 dark:text-green-200">
                          Integration completed successfully
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}