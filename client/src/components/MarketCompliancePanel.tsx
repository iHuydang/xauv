import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";

interface MarketControlOrder {
  orderId: string;
  accountId: string;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  expectedPriceMove: number;
  controlIntensity: string;
  status: string;
}

interface SlippageStats {
  totalSlippageEvents: number;
  correctedEvents: number;
  correctionRate: string;
  averageSlippagePips: string;
  activeOrders: number;
  protectedAccounts: number;
}

export default function MarketCompliancePanel() {
  const [activeControls, setActiveControls] = useState<MarketControlOrder[]>(
    [],
  );
  const [slippageStats, setSlippageStats] = useState<SlippageStats | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [accountId, setAccountId] = useState("exness-405691964");
  const [symbol, setSymbol] = useState("EURUSD");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [volume, setVolume] = useState("0.01");
  const [pips, setPips] = useState("5");
  const [direction, setDirection] = useState<"up" | "down">("up");

  // Load data on component mount
  useEffect(() => {
    loadActiveControls();
    loadSlippageStats();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadActiveControls();
      loadSlippageStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadActiveControls = async () => {
    try {
      const response = await fetch("/api/market-compliance/active-controls");
      const data = await response.json();

      if (data.success) {
        setActiveControls(data.data.activeControls);
      }
    } catch (error) {
      console.error("Failed to load active controls:", error);
    }
  };

  const loadSlippageStats = async () => {
    try {
      const response = await fetch("/api/market-compliance/slippage-stats");
      const data = await response.json();

      if (data.success) {
        setSlippageStats(data.data);
      }
    } catch (error) {
      console.error("Failed to load slippage stats:", error);
    }
  };

  const forceCompliance = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/market-compliance/force-compliance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          symbol,
          side,
          volume: parseFloat(volume),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(
          `✅ Market compliance forced: ${symbol} ${side.toUpperCase()}`,
        );
        loadActiveControls();
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const forcePriceMove = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/market-compliance/force-price-move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol,
          direction,
          pips: parseInt(pips),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(
          `⚡ Price movement forced: ${symbol} ${direction.toUpperCase()} ${pips} pips`,
        );
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyStop = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/market-compliance/emergency-stop-slippage",
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (data.success) {
        setMessage("🚨 Emergency stop activated - All slippage corrected");
        loadActiveControls();
        loadSlippageStats();
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const trackOrder = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/market-compliance/track-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          symbol,
          side,
          volume: parseFloat(volume),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(
          `📊 Order tracked: ${symbol} ${side.toUpperCase()} - Compliance enforced`,
        );
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Market Compliance Control</CardTitle>
          <CardDescription>
            Force market to follow order direction - No more reverse slippage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Selection */}
          <div>
            <label className="text-sm font-medium">Account ID</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exness-405691964">
                  Exness 405691964
                </SelectItem>
                <SelectItem value="exness-205251387">
                  Exness 205251387
                </SelectItem>
                <SelectItem value="exness-405311421">
                  Exness 405311421
                </SelectItem>
                <SelectItem value="anonymous-demo-001">
                  Anonymous Demo 001
                </SelectItem>
                <SelectItem value="anonymous-demo-002">
                  Anonymous Demo 002
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Symbol */}
          <div>
            <label className="text-sm font-medium">Symbol</label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EURUSD">EURUSD</SelectItem>
                <SelectItem value="GBPUSD">GBPUSD</SelectItem>
                <SelectItem value="USDJPY">USDJPY</SelectItem>
                <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                <SelectItem value="BTCUSD">BTCUSD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Side */}
          <div>
            <label className="text-sm font-medium">Order Side</label>
            <Select
              value={side}
              onValueChange={(value: "buy" | "sell") => setSide(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">🟢 BUY (Price must go UP)</SelectItem>
                <SelectItem value="sell">
                  🔴 SELL (Price must go DOWN)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Volume */}
          <div>
            <label className="text-sm font-medium">Volume (Lots)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="0.01"
            />
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={forceCompliance}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              🚀 Force Compliance
            </Button>
            <Button onClick={trackOrder} disabled={isLoading} variant="outline">
              📊 Track Order
            </Button>
          </div>

          {/* Price Movement Controls */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">⚡ Force Price Movement</h4>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-sm">Direction</label>
                <Select
                  value={direction}
                  onValueChange={(value: "up" | "down") => setDirection(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">📈 UP</SelectItem>
                    <SelectItem value="down">📉 DOWN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Pips</label>
                <Input
                  type="number"
                  min="1"
                  value={pips}
                  onChange={(e) => setPips(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={forcePriceMove}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              ⚡ Force Price Move
            </Button>
          </div>

          {/* Emergency Controls */}
          <div className="border-t pt-4">
            <Button
              onClick={emergencyStop}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              🚨 Emergency Stop All Slippage
            </Button>
          </div>

          {/* Message Display */}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status Panel */}
      <div className="space-y-6">
        {/* Slippage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>🛡️ Anti-Slippage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {slippageStats ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Events</div>
                  <div className="text-lg">
                    {slippageStats.totalSlippageEvents}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Corrected</div>
                  <div className="text-lg text-green-600">
                    {slippageStats.correctedEvents}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Success Rate</div>
                  <div className="text-lg">{slippageStats.correctionRate}</div>
                </div>
                <div>
                  <div className="font-medium">Avg Slippage</div>
                  <div className="text-lg">
                    {slippageStats.averageSlippagePips} pips
                  </div>
                </div>
                <div>
                  <div className="font-medium">Active Orders</div>
                  <div className="text-lg">{slippageStats.activeOrders}</div>
                </div>
                <div>
                  <div className="font-medium">Protected Accounts</div>
                  <div className="text-lg">
                    {slippageStats.protectedAccounts}
                  </div>
                </div>
              </div>
            ) : (
              <div>Loading statistics...</div>
            )}
          </CardContent>
        </Card>

        {/* Active Controls */}
        <Card>
          <CardHeader>
            <CardTitle>🎮 Active Market Controls</CardTitle>
          </CardHeader>
          <CardContent>
            {activeControls.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-auto">
                {activeControls.map((control) => (
                  <div
                    key={control.orderId}
                    className="p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {control.symbol} {control.side.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {control.accountId} • {control.volume} lots
                        </div>
                        <div className="text-sm">
                          Expected: {control.expectedPriceMove} pips
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            control.status === "completed"
                              ? "default"
                              : control.status === "controlling"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {control.status}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">
                          {control.controlIntensity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No active market controls
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
