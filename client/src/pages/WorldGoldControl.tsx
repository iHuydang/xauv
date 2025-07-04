import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Target, Zap, TrendingUp, Bot, Settings, AlertTriangle } from 'lucide-react';

interface WorldGoldData {
  source: string;
  timestamp: string;
  price: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
  bid: number;
  ask: number;
  spread: number;
  spreadPercent: number;
  volume: number;
  liquidityLevel: 'high' | 'medium' | 'low';
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
}

interface AttackVector {
  name: string;
  targetMarket: string;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  duration: number;
  priceTargetUSD: number;
  volumeThreshold: number;
  successRate: number;
  description: string;
}

interface AttackResult {
  attackId: string;
  startTime: string;
  endTime?: string;
  status: 'PREPARING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  vectorUsed: string;
  targetPrice: number;
  achievedPrice: number;
  liquidityDrained: number;
  marketImpact: number;
  profitUSD: number;
}

export default function WorldGoldControl() {
  const [selectedVector, setSelectedVector] = useState('SPOT_PRESSURE');
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState({
    botToken: '',
    chatId: '',
    updateInterval: 30
  });
  const queryClient = useQueryClient();

  // Fetch world gold price
  const { data: goldData, refetch: refetchGoldData } = useQuery({
    queryKey: ['/api/world-gold/price'],
    refetchInterval: monitoringActive ? 10000 : false
  });

  // Fetch Barchart data
  const { data: barchartData } = useQuery({
    queryKey: ['/api/world-gold/barchart'],
    refetchInterval: 30000
  });

  // Fetch analysis
  const { data: analysisData, refetch: refetchAnalysis } = useQuery({
    queryKey: ['/api/world-gold/analyze'],
    refetchInterval: monitoringActive ? 15000 : false
  });

  // Fetch attack vectors
  const { data: vectorsData } = useQuery({
    queryKey: ['/api/world-gold/vectors']
  });

  // Fetch active attacks
  const { data: attacksData } = useQuery({
    queryKey: ['/api/world-gold/attacks'],
    refetchInterval: 5000
  });

  // Fetch Telegram status
  const { data: telegramStatus } = useQuery({
    queryKey: ['/api/telegram/status'],
    refetchInterval: 10000
  });

  // Attack execution mutation
  const attackMutation = useMutation({
    mutationFn: async (vector: string) => {
      const response = await fetch('/api/world-gold/attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vector })
      });
      if (!response.ok) throw new Error('Attack failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/world-gold/attacks'] });
    }
  });

  // Monitoring control mutation
  const monitoringMutation = useMutation({
    mutationFn: async (params: { action: 'start' | 'stop'; intervalSeconds?: number }) => {
      const response = await fetch('/api/world-gold/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Monitoring control failed');
      return response.json();
    },
    onSuccess: () => {
      setMonitoringActive(prev => !prev);
    }
  });

  // Telegram configuration mutation
  const telegramConfigMutation = useMutation({
    mutationFn: async (config: typeof telegramConfig) => {
      const response = await fetch('/api/telegram/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Telegram config failed');
      return response.json();
    }
  });

  // Telegram auto-updates mutation
  const telegramAutoMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      const response = await fetch('/api/telegram/auto-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error('Telegram auto-updates failed');
      return response.json();
    }
  });

  // Send Telegram update mutation
  const telegramSendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/telegram/send-gold-update', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Telegram send failed');
      return response.json();
    }
  });

  const worldGold: WorldGoldData | undefined = (goldData as any)?.data;
  const analysis = (analysisData as any)?.analysis;
  const vectors: AttackVector[] = (vectorsData as any)?.vectors || [];
  const activeAttacks: AttackResult[] = (attacksData as any)?.attacks || [];
  const barchart = (barchartData as any)?.data;

  const handleAttackLaunch = () => {
    attackMutation.mutate(selectedVector);
  };

  const toggleMonitoring = () => {
    monitoringMutation.mutate({
      action: monitoringActive ? 'stop' : 'start',
      intervalSeconds: 60
    });
  };

  const handleTelegramConfig = () => {
    telegramConfigMutation.mutate(telegramConfig);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'EXTREME': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING': return 'bg-blue-500';
      case 'ACTIVE': return 'bg-red-500 animate-pulse';
      case 'COMPLETED': return 'bg-green-500';
      case 'FAILED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getLiquidityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMarketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600';
      case 'closed': return 'text-red-600';
      case 'pre-market': return 'text-blue-600';
      case 'after-hours': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hệ thống Tấn công Vàng Thế giới
        </h1>
        <div className="flex items-center space-x-2">
          <Label htmlFor="monitoring">Giám sát Tự động</Label>
          <Switch
            id="monitoring"
            checked={monitoringActive}
            onCheckedChange={toggleMonitoring}
            disabled={monitoringMutation.isPending}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="attack">Tấn công</TabsTrigger>
          <TabsTrigger value="analysis">Phân tích</TabsTrigger>
          <TabsTrigger value="telegram">Telegram Bot</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* World Gold Price Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Giá Vàng Thế giới</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {worldGold ? (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        ${worldGold.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">per ounce</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Thay đổi 24h:</span>
                        <span className={worldGold.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {worldGold.change24h >= 0 ? '+' : ''}${worldGold.change24h.toFixed(2)}
                          ({worldGold.changePercent24h.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Bid/Ask:</span>
                        <span>${worldGold.bid.toFixed(2)}/${worldGold.ask.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Spread:</span>
                        <span>${worldGold.spread.toFixed(2)} ({worldGold.spreadPercent.toFixed(3)}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Thanh khoản:</span>
                        <span className={getLiquidityColor(worldGold.liquidityLevel)}>
                          {worldGold.liquidityLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Trạng thái thị trường:</span>
                        <span className={getMarketStatusColor(worldGold.marketStatus)}>
                          {worldGold.marketStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    Đang tải dữ liệu giá vàng...
                  </div>
                )}
                
                <Button
                  onClick={() => refetchGoldData()}
                  className="w-full"
                  variant="outline"
                >
                  Cập nhật Giá
                </Button>
              </CardContent>
            </Card>

            {/* Barchart Technical Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Phân tích Kỹ thuật</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {barchart ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Symbol:</span>
                        <span className="font-mono">{barchart.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Volume:</span>
                        <span>{barchart.volume.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Open Interest:</span>
                        <span>{barchart.openInterest.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Chỉ báo Kỹ thuật:</h4>
                      <div className="flex justify-between text-sm">
                        <span>RSI:</span>
                        <span>{barchart.technicals.rsi.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>MACD:</span>
                        <span>{barchart.technicals.macd.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Stochastic:</span>
                        <span>{barchart.technicals.stochastic.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tín hiệu:</span>
                        <Badge className={barchart.technicals.signal === 'BUY' ? 'bg-green-500' : 'bg-red-500'}>
                          {barchart.technicals.signal}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Thanh khoản:</h4>
                      <div className="flex justify-between text-sm">
                        <span>Bid Size:</span>
                        <span>{barchart.liquidityMetrics.bidSize.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Ask Size:</span>
                        <span>{barchart.liquidityMetrics.askSize.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Market Depth:</span>
                        <span>{barchart.liquidityMetrics.marketDepth.toFixed(0)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    Đang tải dữ liệu Barchart...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Phân tích Cơ hội</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.opportunityScore}/100
                      </div>
                      <div className="text-sm text-gray-500">Điểm Cơ hội</div>
                    </div>

                    <Progress value={analysis.opportunityScore} className="w-full" />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Mức rủi ro:</span>
                        <Badge className={
                          analysis.riskLevel === 'HIGH' ? 'bg-red-500' :
                          analysis.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                        }>
                          {analysis.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Vector khuyến nghị:</span>
                        <span className="font-mono text-xs">{analysis.recommendedVector}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Lợi nhuận ước tính:</span>
                        <span className="text-green-600">${analysis.estimatedProfit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Độ tin cậy:</span>
                        <span>{analysis.confidence.toFixed(1)}%</span>
                      </div>
                    </div>

                    {analysis.opportunityScore > 60 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Cơ hội tấn công cao phát hiện! Khuyến nghị thực hiện ngay.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    Đang phân tích dữ liệu...
                  </div>
                )}

                <Button
                  onClick={() => refetchAnalysis()}
                  className="w-full"
                  variant="outline"
                >
                  Cập nhật Phân tích
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attack">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attack Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Bảng điều khiển Tấn công</span>
                </CardTitle>
                <CardDescription>
                  Cấu hình và khởi chạy tấn công thanh khoản vàng thế giới
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vector-select">Chọn Vector Tấn công</Label>
                  <Select value={selectedVector} onValueChange={setSelectedVector}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vector tấn công" />
                    </SelectTrigger>
                    <SelectContent>
                      {vectors.map((vector, index) => (
                        <SelectItem key={index} value={Object.keys(vectorsData?.vectors || {})[index] || `vector-${index}`}>
                          {vector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {vectors.find((_, index) => Object.keys(vectorsData?.vectors || {})[index] === selectedVector) && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">Chi tiết Vector</h4>
                    {(() => {
                      const vector = vectors.find((_, index) => Object.keys(vectorsData?.vectors || {})[index] === selectedVector);
                      return vector ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Thị trường mục tiêu:</span>
                            <span>{vector.targetMarket}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cường độ:</span>
                            <Badge className={getIntensityColor(vector.intensity)}>
                              {vector.intensity}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Thời gian:</span>
                            <span>{vector.duration}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Giá mục tiêu:</span>
                            <span>${vector.priceTargetUSD}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ngưỡng khối lượng:</span>
                            <span>${vector.volumeThreshold.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tỷ lệ thành công:</span>
                            <span>{(vector.successRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-600">{vector.description}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <Button
                  onClick={handleAttackLaunch}
                  disabled={attackMutation.isPending}
                  className="w-full"
                  variant="destructive"
                >
                  {attackMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang khởi chạy...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Khởi chạy Tấn công</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Active Attacks */}
            <Card>
              <CardHeader>
                <CardTitle>Các cuộc Tấn công Đang hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                {activeAttacks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Không có cuộc tấn công nào đang hoạt động
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeAttacks.map((attack) => (
                      <div key={attack.attackId} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getStatusColor(attack.status)}>
                            {attack.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(attack.startTime).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Vector:</span>
                            <span className="font-mono text-xs">{attack.vectorUsed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Giá mục tiêu:</span>
                            <span>${attack.targetPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Giá đạt được:</span>
                            <span>${attack.achievedPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lợi nhuận:</span>
                            <span className={attack.profitUSD >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${attack.profitUSD.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Thanh khoản rút:</span>
                            <span>{attack.liquidityDrained.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tác động thị trường:</span>
                            <span>{attack.marketImpact.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="telegram">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Telegram Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Cấu hình Telegram Bot</span>
                </CardTitle>
                <CardDescription>
                  Thiết lập bot Telegram để nhận cập nhật giá vàng tự động
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bot-token">Bot Token</Label>
                  <Input
                    id="bot-token"
                    type="password"
                    placeholder="Nhập Telegram Bot Token"
                    value={telegramConfig.botToken}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, botToken: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="chat-id">Chat ID</Label>
                  <Input
                    id="chat-id"
                    placeholder="Nhập Telegram Chat ID"
                    value={telegramConfig.chatId}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, chatId: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="update-interval">Khoảng thời gian cập nhật (phút)</Label>
                  <Input
                    id="update-interval"
                    type="number"
                    min="1"
                    max="1440"
                    value={telegramConfig.updateInterval}
                    onChange={(e) => setTelegramConfig(prev => ({ ...prev, updateInterval: parseInt(e.target.value) || 30 }))}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleTelegramConfig}
                    disabled={telegramConfigMutation.isPending}
                    className="flex-1"
                  >
                    Lưu Cấu hình
                  </Button>
                  
                  <Button
                    onClick={() => telegramSendMutation.mutate()}
                    disabled={telegramSendMutation.isPending}
                    variant="outline"
                    className="flex-1"
                  >
                    Gửi Test
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Telegram Status & Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái Telegram Bot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Trạng thái:</span>
                    <Badge className={(telegramStatus as any)?.isAutoUpdating ? 'bg-green-500' : 'bg-gray-500'}>
                      {(telegramStatus as any)?.isAutoUpdating ? 'ĐANG CHẠY' : 'DỪNG'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Cập nhật cuối:</span>
                    <span className="text-sm">
                      {(telegramStatus as any)?.timestamp ? 
                        new Date((telegramStatus as any).timestamp).toLocaleString('vi-VN') : 
                        'Chưa có'
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => telegramAutoMutation.mutate((telegramStatus as any)?.isAutoUpdating ? 'stop' : 'start')}
                    disabled={telegramAutoMutation.isPending}
                    className="w-full"
                    variant={(telegramStatus as any)?.isAutoUpdating ? 'destructive' : 'default'}
                  >
                    {(telegramStatus as any)?.isAutoUpdating ? 'Dừng Auto-Update' : 'Bật Auto-Update'}
                  </Button>
                  
                  <Button
                    onClick={() => telegramSendMutation.mutate()}
                    disabled={telegramSendMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    Gửi Cập nhật Ngay
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Lệnh Bot:</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <div>/gold - Xem giá vàng hiện tại</div>
                    <div>/analyze - Phân tích chi tiết</div>
                    <div>/attack - Tấn công SJC</div>
                    <div>/world - Tấn công vàng thế giới</div>
                    <div>/monitor - Bật/tắt giám sát</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Phân tích Chi tiết Thị trường Vàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {worldGold && analysis && (
                  <>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Điều kiện Thị trường</h3>
                      <div className="space-y-1 text-sm">
                        <div>Giá hiện tại: ${worldGold.price.toFixed(2)}</div>
                        <div>Thanh khoản: {worldGold.liquidityLevel}</div>
                        <div>Trạng thái: {worldGold.marketStatus}</div>
                        <div>Spread: {worldGold.spreadPercent.toFixed(3)}%</div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Cơ hội Tấn công</h3>
                      <div className="space-y-1 text-sm">
                        <div>Điểm: {analysis.opportunityScore}/100</div>
                        <div>Rủi ro: {analysis.riskLevel}</div>
                        <div>Tin cậy: {analysis.confidence.toFixed(1)}%</div>
                        <div>Lợi nhuận: ${analysis.estimatedProfit}</div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Khuyến nghị</h3>
                      <div className="space-y-1 text-sm">
                        <div>Vector: {analysis.recommendedVector}</div>
                        <div className={`font-semibold ${
                          analysis.opportunityScore > 70 ? 'text-red-600' :
                          analysis.opportunityScore > 40 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {analysis.opportunityScore > 70 ? 'TẤN CÔNG NGAY' :
                           analysis.opportunityScore > 40 ? 'THEO DÕI' : 'CHỜ CƠ HỘI'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Cài đặt Hệ thống</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Hệ thống tấn công thanh khoản vàng thế giới đang hoạt động với API GoldAPI.io thời gian thực.
                    Tích hợp Barchart để phân tích kỹ thuật XAUUSD và Telegram bot để cập nhật tự động.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">API Endpoints</h3>
                    <div className="space-y-1 text-xs font-mono">
                      <div>/api/world-gold/price</div>
                      <div>/api/world-gold/attack</div>
                      <div>/api/world-gold/analyze</div>
                      <div>/api/telegram/send-gold-update</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Trạng thái Hệ thống</h3>
                    <div className="space-y-1 text-sm">
                      <div>Vectors: {vectors.length} available</div>
                      <div>Attacks: {activeAttacks.length} active</div>
                      <div>Monitoring: {monitoringActive ? 'ON' : 'OFF'}</div>
                      <div>Telegram: {(telegramStatus as any)?.isAutoUpdating ? 'ON' : 'OFF'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}