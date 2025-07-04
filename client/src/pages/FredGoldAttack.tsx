import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface FredIndicator {
  indicator: string;
  value: number;
  date: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  goldCorrelation: number;
}

interface MarketData {
  worldPrice: number;
  vietnamSJC: number;
  vietnamPNJ: number;
  arbitrageGap: number;
  volatility: number;
  timestamp: string;
}

interface AttackStrategy {
  name: string;
  fredIndicators: string[];
  goldThreshold: number;
  attackIntensity: string;
  targetSpread: number;
  expectedDamage: number;
  successProbability: number;
}

export default function FredGoldAttack() {
  const [fredData, setFredData] = useState<FredIndicator[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [strategies, setStrategies] = useState<AttackStrategy[]>([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackResult, setAttackResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFredIndicators();
    fetchMarketAnalysis();
    fetchStrategies();

    const interval = setInterval(() => {
      fetchFredIndicators();
      fetchMarketAnalysis();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const fetchFredIndicators = async () => {
    try {
      const response = await fetch("/api/fred-gold/indicators");
      const data = await response.json();
      if (data.success) {
        setFredData(data.indicators);
      }
    } catch (error) {
      console.error("Error fetching FRED indicators:", error);
    }
  };

  const fetchMarketAnalysis = async () => {
    try {
      const response = await fetch("/api/fred-gold/market-analysis");
      const data = await response.json();
      if (data.success) {
        setMarketData(data.marketData);
      }
    } catch (error) {
      console.error("Error fetching market analysis:", error);
    }
  };

  const fetchStrategies = async () => {
    try {
      const response = await fetch("/api/fred-gold/strategies");
      const data = await response.json();
      if (data.success) {
        setStrategies(data.strategies);
      }
    } catch (error) {
      console.error("Error fetching strategies:", error);
    }
  };

  const executeAttack = async (strategyName: string) => {
    setIsAttacking(true);
    setLoading(true);

    try {
      const response = await fetch("/api/fred-gold/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: strategyName }),
      });

      const result = await response.json();
      if (result.success) {
        setAttackResult(result);
      }
    } catch (error) {
      console.error("Attack failed:", error);
    } finally {
      setIsAttacking(false);
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return "text-red-600";
    if (abs > 0.5) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-500 mb-2">
            🏛️ FRED-GOLD ATTACK SYSTEM 💰
          </h1>
          <p className="text-xl text-yellow-400">
            Hệ thống tấn công vàng sử dụng dữ liệu kinh tế Fed St. Louis
          </p>
        </div>

        <Tabs defaultValue="indicators" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="indicators">📊 FRED Indicators</TabsTrigger>
            <TabsTrigger value="market">🌍 Market Analysis</TabsTrigger>
            <TabsTrigger value="strategies">⚔️ Attack Strategies</TabsTrigger>
            <TabsTrigger value="results">📈 Attack Results</TabsTrigger>
          </TabsList>

          {/* FRED Indicators Tab */}
          <TabsContent value="indicators" className="space-y-6">
            <Card className="bg-gray-900 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-400">
                  📊 FRED Economic Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fredData.map((indicator, index) => (
                    <Card key={index} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-yellow-400">
                            {indicator.indicator}
                          </h3>
                          <Badge variant={getImpactColor(indicator.impact)}>
                            {indicator.impact}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p>
                            Value:{" "}
                            <span className="text-white font-mono">
                              {indicator.value}
                            </span>
                          </p>
                          <p>
                            Date:{" "}
                            <span className="text-gray-400">
                              {indicator.date}
                            </span>
                          </p>
                          <p>
                            Gold Correlation:
                            <span
                              className={`font-mono ml-1 ${getCorrelationColor(indicator.goldCorrelation)}`}
                            >
                              {indicator.goldCorrelation.toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Analysis Tab */}
          <TabsContent value="market" className="space-y-6">
            {marketData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-900 border-blue-500">
                  <CardHeader>
                    <CardTitle className="text-blue-400">
                      🌍 World vs Vietnam Gold
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>World Gold Price:</span>
                        <span className="font-mono text-yellow-400">
                          ${marketData.worldPrice.toFixed(2)}/oz
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SJC Price:</span>
                        <span className="font-mono text-red-400">
                          {marketData.vietnamSJC.toLocaleString()} VND
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>PNJ Price:</span>
                        <span className="font-mono text-red-400">
                          {marketData.vietnamPNJ.toLocaleString()} VND
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-purple-500">
                  <CardHeader>
                    <CardTitle className="text-purple-400">
                      📊 Attack Opportunity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Arbitrage Gap:</span>
                          <span className="text-yellow-400 font-mono">
                            {marketData.arbitrageGap.toLocaleString()} VND
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            (marketData.arbitrageGap / 3000000) * 100,
                            100,
                          )}
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Volatility:</span>
                          <span className="text-red-400 font-mono">
                            {marketData.volatility.toFixed(2)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(marketData.volatility * 20, 100)}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Attack Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {strategies.map((strategy, index) => (
                <Card key={index} className="bg-gray-900 border-red-500">
                  <CardHeader>
                    <CardTitle className="text-red-400">
                      {strategy.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>FRED Indicators:</strong>{" "}
                        {strategy.fredIndicators.join(", ")}
                      </p>
                      <p>
                        <strong>Intensity:</strong>
                        <Badge variant="destructive" className="ml-2">
                          {strategy.attackIntensity}
                        </Badge>
                      </p>
                      <p>
                        <strong>Target Spread:</strong>{" "}
                        {strategy.targetSpread.toLocaleString()} VND
                      </p>
                      <p>
                        <strong>Expected Damage:</strong>{" "}
                        {strategy.expectedDamage}%
                      </p>
                      <div className="flex justify-between items-center">
                        <span>
                          <strong>Success Rate:</strong>
                        </span>
                        <span className="text-green-400 font-mono">
                          {(strategy.successProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        executeAttack(
                          strategy.name.split(" ").join("_").toUpperCase(),
                        )
                      }
                      disabled={isAttacking}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {isAttacking ? "Đang tấn công..." : "🚨 EXECUTE ATTACK"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Attack Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {attackResult ? (
              <Card className="bg-gray-900 border-green-500">
                <CardHeader>
                  <CardTitle className="text-green-400">
                    ✅ Attack Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Attack completed successfully using strategy:{" "}
                      {attackResult.strategy}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-800 p-4 rounded">
                      <div className="text-2xl font-bold text-red-400">
                        {attackResult.result?.damage?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">Total Damage</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded">
                      <div className="text-2xl font-bold text-yellow-400">
                        {attackResult.result?.marketImpact?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">Market Impact</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded">
                      <div className="text-2xl font-bold text-blue-400">
                        {attackResult.result?.liquidityDrained?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-400">
                        Liquidity Drained
                      </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded">
                      <div className="text-2xl font-bold text-green-400">
                        {attackResult.result?.priceReduction?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        VND Price Reduction
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900 border-gray-500">
                <CardContent className="text-center py-12">
                  <p className="text-gray-400">
                    No attack results yet. Execute an attack to see results.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
