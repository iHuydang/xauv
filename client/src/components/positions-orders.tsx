import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  formatPrice,
  formatCurrency,
  getPriceChangeClass,
} from "@/lib/trading-utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, TrendingUp, TrendingDown } from "lucide-react";

export default function PositionsOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { prices } = useWebSocket();

  const { data: positions } = useQuery({
    queryKey: ["/api/positions"],
    refetchInterval: 1000,
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    refetchInterval: 1000,
  });

  const closePositionMutation = useMutation({
    mutationFn: async (positionId: number) => {
      const response = await fetch(`/api/positions/${positionId}/close`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to close position");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      toast({
        title: "Thành công",
        description: "Đã đóng vị thế thành công",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể đóng vị thế",
        variant: "destructive",
      });
    },
  });

  const getCurrentPrice = (symbol: string, type: string) => {
    const priceData = prices[symbol];
    if (!priceData) return 0;
    return parseFloat(type === "buy" ? priceData.bid : priceData.ask);
  };

  const calculatePnL = (position: any) => {
    const currentPrice = getCurrentPrice(position.symbol, position.type);
    const openPrice = parseFloat(position.openPrice);
    const volume = parseFloat(position.volume);

    if (position.type === "buy") {
      return (currentPrice - openPrice) * volume * 100000; // Assuming standard lot size
    } else {
      return (openPrice - currentPrice) * volume * 100000;
    }
  };

  return (
    <Card className="trading-bg-secondary h-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">Vị thế & Lệnh chờ</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="positions" className="h-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger
              value="positions"
              className="text-white data-[state=active]:bg-gray-600"
            >
              Vị thế đang mở ({positions?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="text-white data-[state=active]:bg-gray-600"
            >
              Lệnh chờ ({orders?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="h-48 overflow-y-auto">
            {positions?.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Không có vị thế đang mở
              </div>
            ) : (
              <div className="space-y-2">
                {positions?.map((position: any) => {
                  const pnl = calculatePnL(position);
                  const pnlClass = pnl >= 0 ? "text-green-400" : "text-red-400";

                  return (
                    <div
                      key={position.id}
                      className="bg-gray-800 p-3 rounded trading-border border"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {position.symbol}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                position.type === "buy"
                                  ? "bg-green-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {position.type === "buy" ? "MUA" : "BÁN"}
                            </span>
                            {position.type === "buy" ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-400">
                                Khối lượng:{" "}
                              </span>
                              <span className="text-white">
                                {position.volume} lots
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Giá mở: </span>
                              <span className="text-white font-mono">
                                {formatPrice(
                                  position.openPrice,
                                  position.symbol,
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">
                                Giá hiện tại:{" "}
                              </span>
                              <span className="text-white font-mono">
                                {formatPrice(
                                  getCurrentPrice(
                                    position.symbol,
                                    position.type,
                                  ).toString(),
                                  position.symbol,
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Lãi/Lỗ: </span>
                              <span className={`font-mono ${pnlClass}`}>
                                ${pnl.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-red-600 hover:bg-red-600"
                          onClick={() =>
                            closePositionMutation.mutate(position.id)
                          }
                          disabled={closePositionMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="h-48 overflow-y-auto">
            {orders?.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Không có lệnh chờ
              </div>
            ) : (
              <div className="space-y-2">
                {orders?.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-gray-800 p-3 rounded trading-border border"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {order.symbol}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              order.type === "buy"
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {order.type === "buy" ? "MUA" : "BÁN"}
                          </span>
                          <span className="px-2 py-1 text-xs rounded bg-yellow-600 text-white">
                            {order.orderType?.toUpperCase() || "MARKET"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-gray-400">Khối lượng: </span>
                            <span className="text-white">
                              {order.volume} lots
                            </span>
                          </div>
                          {order.price && (
                            <div>
                              <span className="text-gray-400">Giá: </span>
                              <span className="text-white font-mono">
                                {formatPrice(order.price, order.symbol)}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Trạng thái: </span>
                            <span className="text-yellow-400">
                              {order.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Thời gian: </span>
                            <span className="text-white text-xs">
                              {new Date(order.createdAt).toLocaleString(
                                "vi-VN",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-600 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
