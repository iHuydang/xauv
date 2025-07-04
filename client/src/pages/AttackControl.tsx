import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertTriangle,
  Target,
  Zap,
  Shield,
  TrendingDown,
  Activity,
} from "lucide-react";

interface AttackVector {
  name: string;
  intensity: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  duration: number;
  targetSpread: number;
  volumeMultiplier: number;
  frequency: number;
  successRate: number;
}

interface AttackResult {
  attackId: string;
  startTime: string;
  endTime?: string;
  status: "PREPARING" | "ACTIVE" | "COMPLETED" | "FAILED";
  vectorsUsed: string[];
  damageInflicted: {
    spreadReduction: number;
    liquidityDrained: number;
    marketShare: number;
  };
  sjcResponse: {
    priceAdjustments: number;
    liquidityBoosts: number;
    defenseActivated: boolean;
  };
}

interface LiquidityData {
  source: string;
  timestamp: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  liquidityLevel: "high" | "medium" | "low";
  botSignal: "favorable" | "moderate" | "caution";
}

export default function AttackControl() {
  const [selectedVector, setSelectedVector] = useState("HF_SPREAD_PRESSURE");
  const [autoTrigger, setAutoTrigger] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const queryClient = useQueryClient();

  // Fetch available attack vectors
  const { data: vectorsData } = useQuery({
    queryKey: ["/api/attack/vectors"],
    refetchInterval: 10000,
  });

  // Fetch active attacks
  const { data: attacksData } = useQuery({
    queryKey: ["/api/attack/status"],
    refetchInterval: 2000,
  });

  // Fetch liquidity data
  const { data: liquidityData, refetch: refetchLiquidity } = useQuery({
    queryKey: ["/api/liquidity/scan"],
    refetchInterval: monitoringActive ? 5000 : false,
  });

  // Attack execution mutation
  const attackMutation = useMutation({
    mutationFn: async (params: { vector: string; autoTrigger: boolean }) => {
      const response = await fetch("/api/attack/sjc-pressure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error("Attack failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attack/status"] });
    },
  });

  // Stop attack mutation
  const stopAttackMutation = useMutation({
    mutationFn: async (attackId: string) => {
      const response = await fetch(`/api/attack/stop/${attackId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Stop attack failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attack/status"] });
    },
  });

  // Monitoring control mutation
  const monitoringMutation = useMutation({
    mutationFn: async (params: {
      action: "start" | "stop";
      intervalSeconds?: number;
    }) => {
      const response = await fetch("/api/liquidity/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error("Monitoring control failed");
      return response.json();
    },
    onSuccess: () => {
      setMonitoringActive((prev) => !prev);
    },
  });

  const vectors: AttackVector[] = (vectorsData as any)?.vectors || [];
  const activeAttacks: AttackResult[] =
    (attacksData as any)?.activeAttacks || [];
  const liquidityResults: LiquidityData[] =
    (liquidityData as any)?.results || [];

  const handleAttackLaunch = () => {
    attackMutation.mutate({
      vector: selectedVector,
      autoTrigger,
    });
  };

  const handleStopAttack = (attackId: string) => {
    stopAttackMutation.mutate(attackId);
  };

  const toggleMonitoring = () => {
    monitoringMutation.mutate({
      action: monitoringActive ? "stop" : "start",
      intervalSeconds: 30,
    });
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "LOW":
        return "bg-green-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "HIGH":
        return "bg-orange-500";
      case "EXTREME":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PREPARING":
        return "bg-blue-500";
      case "ACTIVE":
        return "bg-red-500 animate-pulse";
      case "COMPLETED":
        return "bg-green-500";
      case "FAILED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLiquidityColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getBotSignalColor = (signal: string) => {
    switch (signal) {
      case "favorable":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "caution":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hệ thống Tấn công Áp lực SJC
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

      <Tabs defaultValue="attack" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attack">Tấn công</TabsTrigger>
          <TabsTrigger value="liquidity">Thanh khoản</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
        </TabsList>

        <TabsContent value="attack">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attack Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Bảng điều khiển Tấn công</span>
                </CardTitle>
                <CardDescription>
                  Cấu hình và khởi chạy các cuộc tấn công áp lực SJC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vector-select">Chọn Vector Tấn công</Label>
                  <Select
                    value={selectedVector}
                    onValueChange={setSelectedVector}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vector tấn công" />
                    </SelectTrigger>
                    <SelectContent>
                      {vectors.map((vector, index) => (
                        <SelectItem
                          key={index}
                          value={
                            Object.keys(vectorsData?.vectors || {})[index] ||
                            `vector-${index}`
                          }
                        >
                          {vector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-trigger"
                    checked={autoTrigger}
                    onCheckedChange={setAutoTrigger}
                  />
                  <Label htmlFor="auto-trigger">Tự động kích hoạt</Label>
                </div>

                {vectors.find(
                  (_, index) =>
                    Object.keys(vectorsData?.vectors || {})[index] ===
                    selectedVector,
                ) && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">Chi tiết Vector</h4>
                    {(() => {
                      const vector = vectors.find(
                        (_, index) =>
                          Object.keys(vectorsData?.vectors || {})[index] ===
                          selectedVector,
                      );
                      return vector ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Cường độ:</span>
                            <Badge
                              className={getIntensityColor(vector.intensity)}
                            >
                              {vector.intensity}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Thời gian:</span>
                            <span>{vector.duration}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Spread mục tiêu:</span>
                            <span>
                              {vector.targetSpread.toLocaleString()} VND
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tỷ lệ thành công:</span>
                            <span>
                              {(vector.successRate * 100).toFixed(1)}%
                            </span>
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
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Các cuộc Tấn công Đang hoạt động</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeAttacks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Không có cuộc tấn công nào đang hoạt động
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeAttacks.map((attack) => (
                      <div
                        key={attack.attackId}
                        className="p-3 border rounded-lg"
                      >
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
                            <span>Giảm Spread:</span>
                            <span className="font-mono">
                              {attack.damageInflicted.spreadReduction.toFixed(
                                0,
                              )}{" "}
                              VND
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Thanh khoản rút:</span>
                            <span className="font-mono">
                              {attack.damageInflicted.liquidityDrained.toFixed(
                                1,
                              )}
                              %
                            </span>
                          </div>
                          {attack.sjcResponse.defenseActivated && (
                            <div className="flex items-center space-x-1 text-orange-600">
                              <Shield className="h-3 w-3" />
                              <span>SJC Defense Active</span>
                            </div>
                          )}
                        </div>

                        {attack.status === "ACTIVE" && (
                          <Button
                            onClick={() => handleStopAttack(attack.attackId)}
                            disabled={stopAttackMutation.isPending}
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                          >
                            Dừng Tấn công
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="liquidity">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Phân tích Thanh khoản</h2>
              <Button
                onClick={() => refetchLiquidity()}
                disabled={liquidityData?.isLoading}
                variant="outline"
              >
                Quét ngay
              </Button>
            </div>

            {liquidityData?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {liquidityData.summary.highLiquidity}
                    </div>
                    <p className="text-sm text-gray-600">Thanh khoản Cao</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {liquidityData.summary.mediumLiquidity}
                    </div>
                    <p className="text-sm text-gray-600">
                      Thanh khoản Trung bình
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {liquidityData.summary.lowLiquidity}
                    </div>
                    <p className="text-sm text-gray-600">Thanh khoản Thấp</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {liquidityData.summary.favorableSignals}
                    </div>
                    <p className="text-sm text-gray-600">Tín hiệu Thuận lợi</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liquidityResults.map((result, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{result.source}</span>
                      <Badge className={getBotSignalColor(result.botSignal)}>
                        {result.botSignal}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Giá mua:</span>
                        <span className="font-mono">
                          {result.buyPrice.toLocaleString()} VND
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Giá bán:</span>
                        <span className="font-mono">
                          {result.sellPrice.toLocaleString()} VND
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Spread:</span>
                        <span className="font-mono">
                          {result.spread.toLocaleString()} VND
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Spread %:</span>
                        <span className="font-mono">
                          {result.spreadPercent.toFixed(3)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Thanh khoản:</span>
                      <span
                        className={`text-sm font-medium ${getLiquidityColor(result.liquidityLevel)}`}
                      >
                        {result.liquidityLevel.toUpperCase()}
                      </span>
                    </div>

                    {result.source === "SJC" &&
                      result.liquidityLevel === "low" && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            SJC có thanh khoản thấp - Có thể tấn công
                          </AlertDescription>
                        </Alert>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Trạng thái Hệ thống</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê Tấn công</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tổng số cuộc tấn công:</span>
                    <span className="font-bold">{activeAttacks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đang hoạt động:</span>
                    <span className="font-bold text-red-600">
                      {
                        activeAttacks.filter((a) => a.status === "ACTIVE")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hoàn thành:</span>
                    <span className="font-bold text-green-600">
                      {
                        activeAttacks.filter((a) => a.status === "COMPLETED")
                          .length
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thống kê Thanh khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tổng mục tiêu:</span>
                    <span className="font-bold">{liquidityResults.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mục tiêu dễ tấn công:</span>
                    <span className="font-bold text-orange-600">
                      {
                        liquidityResults.filter(
                          (r) => r.liquidityLevel === "low",
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tín hiệu thuận lợi:</span>
                    <span className="font-bold text-green-600">
                      {
                        liquidityResults.filter(
                          (r) => r.botSignal === "favorable",
                        ).length
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
