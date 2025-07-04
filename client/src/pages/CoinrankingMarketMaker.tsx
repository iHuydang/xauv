import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Activity,
  DollarSign,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";

interface CoinrankingAsset {
  uuid: string;
  symbol: string;
  name: string;
  price: number;
  volume: number;
  marketCap: number;
  change: number;
  rank: number;
  tier: number;
  iconUrl: string;
  color: string;
}

interface MarketMakerOrder {
  orderId: string;
  assetUuid: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  timestamp: number;
  status: "pending" | "filled" | "cancelled";
  type: "market_making" | "arbitrage" | "liquidity_provision";
  current_price?: number;
  price_difference?: string;
  market_value?: number;
  age_minutes?: number;
}

interface MarketMakerConfig {
  spread: number;
  orderSize: number;
  maxExposure: number;
  riskLimit: number;
  goldFocused: boolean;
}

export default function CoinrankingMarketMaker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<MarketMakerConfig>({
    spread: 0.002,
    orderSize: 1000,
    maxExposure: 50000,
    riskLimit: 0.02,
    goldFocused: true,
  });

  // Query market maker status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/coinranking/status"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Query gold market analysis
  const { data: goldAnalysis, isLoading: goldLoading } = useQuery({
    queryKey: ["/api/coinranking/gold/analysis"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Query active orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/coinranking/orders"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Query positions
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ["/api/coinranking/positions"],
    refetchInterval: 5000,
  });

  // Query performance metrics
  const { data: performanceData } = useQuery({
    queryKey: ["/api/coinranking/performance"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Mutations
  const startMarketMaking = useMutation({
    mutationFn: () => apiRequest("/api/coinranking/market-maker/start", "POST"),
    onSuccess: () => {
      toast({
        title: "Market Maker Started",
        description: "Coinranking market making operations have begun",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coinranking/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start market making",
        variant: "destructive",
      });
    },
  });

  const stopMarketMaking = useMutation({
    mutationFn: () => apiRequest("/api/coinranking/market-maker/stop", "POST"),
    onSuccess: () => {
      toast({
        title: "Market Maker Stopped",
        description: "Market making operations have been halted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coinranking/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop market making",
        variant: "destructive",
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: (newConfig: Partial<MarketMakerConfig>) =>
      apiRequest("/api/coinranking/market-maker/config", "POST", newConfig),
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Market maker settings have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coinranking/status"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const handleConfigUpdate = () => {
    updateConfig.mutate(config);
  };

  const formatCurrency = (value: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const isMarketMakingActive =
    statusData?.data?.status?.marketMakingActive || false;
  const isConnected = statusData?.data?.status?.connected || false;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Coinranking Market Maker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Automated crypto market making focused on gold-related assets
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Badge variant={isMarketMakingActive ? "default" : "secondary"}>
            {isMarketMakingActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Market Maker Control</span>
          </CardTitle>
          <CardDescription>
            Start, stop, and monitor market making operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => startMarketMaking.mutate()}
              disabled={isMarketMakingActive || startMarketMaking.isPending}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Market Making</span>
            </Button>

            <Button
              onClick={() => stopMarketMaking.mutate()}
              disabled={!isMarketMakingActive || stopMarketMaking.isPending}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Pause className="h-4 w-4" />
              <span>Stop Market Making</span>
            </Button>

            <Button
              onClick={() => queryClient.invalidateQueries()}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gold">Gold Analysis</TabsTrigger>
          <TabsTrigger value="orders">Active Orders</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Exposure
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(statusData?.data?.status?.totalExposure || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max:{" "}
                  {formatCurrency(
                    statusData?.data?.status?.config?.maxExposure || 0,
                  )}
                </p>
                <Progress
                  value={
                    ((statusData?.data?.status?.totalExposure || 0) /
                      (statusData?.data?.status?.config?.maxExposure || 1)) *
                    100
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Orders
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ordersData?.data?.summary?.total_orders || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Buy: {ordersData?.data?.summary?.buy_orders || 0} | Sell:{" "}
                  {ordersData?.data?.summary?.sell_orders || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Positions
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {positionsData?.data?.summary?.total_positions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Long: {positionsData?.data?.summary?.long_positions || 0} |
                  Short: {positionsData?.data?.summary?.short_positions || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Assets Monitored
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statusData?.data?.market_data?.assets_monitored || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gold-focused trading
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Prices */}
          {statusData?.data?.recent_prices && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Price Updates</CardTitle>
                <CardDescription>
                  Live cryptocurrency prices from Coinranking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusData.data.recent_prices.map(
                    (asset: CoinrankingAsset) => (
                      <div
                        key={asset.uuid}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: asset.color }}
                          >
                            {asset.iconUrl && (
                              <img
                                src={asset.iconUrl}
                                alt={asset.symbol}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{asset.symbol}</p>
                            <p className="text-sm text-gray-600">
                              {asset.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatCurrency(asset.price)}
                          </p>
                          <p
                            className={`text-sm ${asset.change >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatPercentage(asset.change)}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Gold Analysis Tab */}
        <TabsContent value="gold" className="space-y-6">
          {goldAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Gold Market Analysis</CardTitle>
                <CardDescription>
                  Comprehensive analysis of gold-related crypto assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-gray-600">
                      Total Assets
                    </h4>
                    <p className="text-2xl font-bold">
                      {goldAnalysis.data.analysis.total_assets}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-gray-600">
                      Market Cap
                    </h4>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        goldAnalysis.data.analysis.total_market_cap,
                      )}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm text-gray-600">
                      Avg Volatility
                    </h4>
                    <p className="text-2xl font-bold">
                      {formatPercentage(
                        goldAnalysis.data.analysis.average_volatility,
                      )}
                    </p>
                  </div>
                </div>

                {goldAnalysis.data.analysis.vietnam_gold_equivalent && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h4 className="font-medium mb-2">
                      Vietnam Gold Equivalent (BTC)
                    </h4>
                    <p>
                      BTC Price:{" "}
                      {formatCurrency(
                        goldAnalysis.data.analysis.vietnam_gold_equivalent
                          .btc_price_usd,
                      )}
                    </p>
                    <p>
                      VND Estimate:{" "}
                      {formatNumber(
                        goldAnalysis.data.analysis.vietnam_gold_equivalent
                          .vietnam_estimate,
                        0,
                      )}{" "}
                      VND
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium">Gold Assets Tracked</h4>
                  {goldAnalysis.data.gold_assets.map(
                    (asset: CoinrankingAsset) => (
                      <div
                        key={asset.uuid}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{asset.symbol}</p>
                            <p className="text-sm text-gray-600">
                              {asset.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatCurrency(asset.price)}
                          </p>
                          <p
                            className={`text-sm ${asset.change >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatPercentage(asset.change)}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {ordersData && (
            <Card>
              <CardHeader>
                <CardTitle>Active Market Making Orders</CardTitle>
                <CardDescription>
                  Currently active buy/sell orders placed by the market maker
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersData.data.orders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No active orders
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ordersData.data.orders.map((order: MarketMakerOrder) => (
                      <div
                        key={order.orderId}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant={
                              order.side === "buy" ? "default" : "secondary"
                            }
                          >
                            {order.side.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{order.symbol}</p>
                            <p className="text-sm text-gray-600">
                              {formatNumber(order.quantity, 6)} @{" "}
                              {formatCurrency(order.price)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(order.market_value || 0)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.age_minutes}m old
                          </p>
                          <Badge
                            variant={
                              order.status === "pending"
                                ? "outline"
                                : order.status === "filled"
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-6">
          {positionsData && (
            <Card>
              <CardHeader>
                <CardTitle>Current Positions</CardTitle>
                <CardDescription>
                  Active positions held by the market maker
                </CardDescription>
              </CardHeader>
              <CardContent>
                {positionsData.data.positions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No open positions
                  </p>
                ) : (
                  <div className="space-y-3">
                    {positionsData.data.positions.map((position: any) => (
                      <div
                        key={position.asset_uuid}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant={
                              position.position_type === "long"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {position.position_type.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{position.symbol}</p>
                            <p className="text-sm text-gray-600">
                              {position.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(position.market_value)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatNumber(position.quantity, 6)} @{" "}
                            {formatCurrency(position.current_price)}
                          </p>
                          <p
                            className={`text-sm ${position.change_24h >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatPercentage(position.change_24h)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Market Maker Configuration</span>
              </CardTitle>
              <CardDescription>
                Adjust market making parameters and risk management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="spread">Bid-Ask Spread (%)</Label>
                  <Input
                    id="spread"
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="0.1"
                    value={config.spread}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        spread: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">
                    Current: {(config.spread * 100).toFixed(3)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderSize">Order Size (USD)</Label>
                  <Input
                    id="orderSize"
                    type="number"
                    step="100"
                    min="100"
                    max="10000"
                    value={config.orderSize}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        orderSize: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">
                    Current: {formatCurrency(config.orderSize)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxExposure">Max Exposure (USD)</Label>
                  <Input
                    id="maxExposure"
                    type="number"
                    step="1000"
                    min="1000"
                    max="100000"
                    value={config.maxExposure}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxExposure: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">
                    Current: {formatCurrency(config.maxExposure)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskLimit">Risk Limit (%)</Label>
                  <Input
                    id="riskLimit"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.1"
                    value={config.riskLimit}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        riskLimit: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-sm text-gray-600">
                    Current: {(config.riskLimit * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="goldFocused"
                  checked={config.goldFocused}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, goldFocused: checked })
                  }
                />
                <Label htmlFor="goldFocused">
                  Focus on Gold-Related Assets
                </Label>
              </div>

              <Button
                onClick={handleConfigUpdate}
                disabled={updateConfig.isPending}
                className="w-full"
              >
                {updateConfig.isPending
                  ? "Updating..."
                  : "Update Configuration"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
