import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MonetaryPolicy {
  fedFundsRate: number;
  reserveRequirement: number;
  quantitativeEasing: number;
  m1Supply: number;
  m2Supply: number;
  velocityOfMoney: number;
}

interface MarketControl {
  goldPrice: number;
  dollarIndex: number;
  bondYields: Record<string, number>;
  inflationExpectations: number;
  liquidityPremium: number;
}

interface SystemStatus {
  monetary_policy: MonetaryPolicy;
  market_control: MarketControl;
  gold_fair_value: number;
  optimal_fed_funds_rate: number;
  system_health: string;
}

export default function FederalReserveControl() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [operationType, setOperationType] = useState<'EXPAND' | 'CONTRACT'>('EXPAND');
  const [operationAmount, setOperationAmount] = useState('50000000000');
  const [qeAmount, setQeAmount] = useState('1000000000000');
  const [qeDuration, setQeDuration] = useState('12');
  const [goldAction, setGoldAction] = useState<'SUPPRESS' | 'RELEASE'>('SUPPRESS');
  const [currencyTarget, setCurrencyTarget] = useState('USD');
  const [currencyAction, setCurrencyAction] = useState<'STRENGTHEN' | 'WEAKEN'>('STRENGTHEN');
  const [currencyAmount, setCurrencyAmount] = useState('10000000000');
  const [inflationTarget, setInflationTarget] = useState('2.0');

  // Emergency tools states
  const [emergencyType, setEmergencyType] = useState<'FINANCIAL_CRISIS' | 'HYPERINFLATION' | 'DEFLATION' | 'BANK_RUN'>('FINANCIAL_CRISIS');
  const [cbdcName, setCbdcName] = useState('FedCoin');
  const [cbdcSupply, setCbdcSupply] = useState('1000000000000');
  const [negativeRate, setNegativeRate] = useState('-0.5');
  const [helicopterAmount, setHelicopterAmount] = useState('1000000000000');

  // Advanced controls states
  const [yieldMaturity, setYieldMaturity] = useState('10Y');
  const [yieldTarget, setYieldTarget] = useState('3.0');
  const [guidanceMessage, setGuidanceMessage] = useState('Rates will remain low for extended period');
  const [guidanceHorizon, setGuidanceHorizon] = useState('12');
  const [swapCurrency, setSwapCurrency] = useState('EUR');
  const [swapAmount, setSwapAmount] = useState('100000000000');
  const [stressScenario, setStressScenario] = useState('FINANCIAL_CRISIS');

  useEffect(() => {
    loadSystemStatus();

    // Refresh every 10 seconds
    const interval = setInterval(loadSystemStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/fed-monetary/status');
      const data = await response.json();

      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const executeOpenMarketOperation = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/open-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: operationType,
          amount: parseInt(operationAmount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setSystemStatus(data.new_status);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuantitativeEasing = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/qe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(qeAmount),
          duration: parseInt(qeDuration)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ QE failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeGoldManipulation = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/gold-manipulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: goldAction
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message} - New Gold Price: $${data.new_gold_price.toFixed(2)}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Gold manipulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCurrencyIntervention = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/currency-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: currencyTarget,
          action: currencyAction,
          amount: parseInt(currencyAmount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message} - New DXY: ${data.new_dollar_index.toFixed(2)}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Intervention failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeInflationTargeting = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/target-inflation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: parseFloat(inflationTarget)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Targeting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeEmergencyMeasures = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/emergency-measures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crisis: emergencyType
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`🚨 ${data.message}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Emergency measures failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const launchCBDC = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/launch-cbdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cbdcName,
          supply: parseInt(cbdcSupply)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`💰 ${data.message}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ CBDC launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const implementNegativeRates = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/negative-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate: parseFloat(negativeRate)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`📉 ${data.message}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Negative rates failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeHelicopterMoney = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/helicopter-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(helicopterAmount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`🚁 ${data.message}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Helicopter money failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const implementYieldCurveControl = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/yield-curve-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maturity: yieldMaturity,
          target_yield: parseFloat(yieldTarget)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`📈 ${data.message}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Yield curve control failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const issueForwardGuidance = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/forward-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: guidanceMessage,
          time_horizon: parseInt(guidanceHorizon)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`📢 Forward guidance issued successfully`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Forward guidance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const activateSwapLines = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/swap-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: swapCurrency,
          amount: parseInt(swapAmount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`🔄 ${data.message}`);
        loadSystemStatus();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Swap lines failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runStressTest = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: stressScenario
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`🧪 Stress test completed: ${stressScenario}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Stress test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startRealTimeMonitoring = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fed-monetary/start-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`📡 Real-time monitoring started`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(2)}T`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    return `$${amount.toLocaleString()}`;
  };

  if (!systemStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading Federal Reserve Control System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏛️ Federal Reserve Monetary Control System
          </h1>
          <p className="text-lg text-gray-600">
            Academic Implementation of Central Bank Monetary Policy Controls
          </p>
          <Badge 
            variant={systemStatus.system_health === 'OPERATIONAL' ? 'default' : 'destructive'}
            className="mt-2"
          >
            System Status: {systemStatus.system_health}
          </Badge>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Money Supply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>M1 Supply:</span>
                  <span className="font-mono">{formatCurrency(systemStatus.monetary_policy.m1Supply)}</span>
                </div>
                <div className="flex justify-between">
                  <span>M2 Supply:</span>
                  <span className="font-mono">{formatCurrency(systemStatus.monetary_policy.m2Supply)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Velocity:</span>
                  <span className="font-mono">{systemStatus.monetary_policy.velocityOfMoney.toFixed(3)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Interest Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Fed Funds Rate:</span>
                  <span className="font-mono">{systemStatus.monetary_policy.fedFundsRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimal Rate:</span>
                  <span className="font-mono">{systemStatus.optimal_fed_funds_rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>10Y Treasury:</span>
                  <span className="font-mono">{systemStatus.market_control.bondYields['10Y']?.toFixed(2) || 'N/A'}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🥇 Market Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Gold Price:</span>
                  <span className="font-mono">${systemStatus.market_control.goldPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fair Value:</span>
                  <span className="font-mono">${systemStatus.gold_fair_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dollar Index:</span>
                  <span className="font-mono">{systemStatus.market_control.dollarIndex.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Display */}
        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Control Panels */}
        <Tabs defaultValue="open-market" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic">Basic Operations</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Tools</TabsTrigger>
            <TabsTrigger value="stability">Financial Stability</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Protocols</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>💰 Open Market Operations</CardTitle>
                  <CardDescription>Execute bond purchases/sales to control money supply</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Operation Type</label>
                      <Select value={operationType} onValueChange={(value: 'EXPAND' | 'CONTRACT') => setOperationType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXPAND">EXPAND (Buy Bonds)</SelectItem>
                          <SelectItem value="CONTRACT">CONTRACT (Sell Bonds)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                      <Input
                        type="number"
                        value={operationAmount}
                        onChange={(e) => setOperationAmount(e.target.value)}
                        placeholder="50000000000"
                      />
                    </div>
                  </div>
                  <Button onClick={executeOpenMarketOperation} disabled={isLoading} className="w-full">
                    {isLoading ? 'Executing...' : `Execute ${operationType} Operation`}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🖨️ Quantitative Easing</CardTitle>
                  <CardDescription>Large-scale asset purchase program</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Amount (USD)</label>
                      <Input
                        type="number"
                        value={qeAmount}
                        onChange={(e) => setQeAmount(e.target.value)}
                        placeholder="1000000000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Duration (Months)</label>
                      <Input
                        type="number"
                        value={qeDuration}
                        onChange={(e) => setQeDuration(e.target.value)}
                        placeholder="12"
                      />
                    </div>
                  </div>
                  <Button onClick={executeQuantitativeEasing} disabled={isLoading} className="w-full">
                    {isLoading ? 'Starting QE...' : 'Start QE Program'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🥇 Gold Control</CardTitle>
                  <CardDescription>Manipulate gold prices through central bank operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Action</label>
                    <Select value={goldAction} onValueChange={(value: 'SUPPRESS' | 'RELEASE') => setGoldAction(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPPRESS">SUPPRESS (Central Bank Sales)</SelectItem>
                        <SelectItem value="RELEASE">RELEASE (Stop Suppression)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={executeGoldManipulation} disabled={isLoading} className="w-full">
                    {isLoading ? 'Executing...' : `${goldAction} Gold Price`}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>💱 Currency Intervention</CardTitle>
                  <CardDescription>Direct forex market intervention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Currency</label>
                      <Select value={currencyTarget} onValueChange={setCurrencyTarget}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="JPY">JPY</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Action</label>
                      <Select value={currencyAction} onValueChange={(value: 'STRENGTHEN' | 'WEAKEN') => setCurrencyAction(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STRENGTHEN">STRENGTHEN</SelectItem>
                          <SelectItem value="WEAKEN">WEAKEN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                      <Input
                        type="number"
                        value={currencyAmount}
                        onChange={(e) => setCurrencyAmount(e.target.value)}
                        placeholder="10000000000"
                      />
                    </div>
                  </div>
                  <Button onClick={executeCurrencyIntervention} disabled={isLoading} className="w-full">
                    {isLoading ? 'Executing...' : `${currencyAction} ${currencyTarget}`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advanced">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Inflation Targeting</CardTitle>
                  <CardDescription>Set precise inflation targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Inflation Rate (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={inflationTarget}
                      onChange={(e) => setInflationTarget(e.target.value)}
                      placeholder="2.0"
                    />
                  </div>
                  <Button onClick={executeInflationTargeting} disabled={isLoading} className="w-full">
                    {isLoading ? 'Adjusting...' : 'Set Inflation Target'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📈 Yield Curve Control</CardTitle>
                  <CardDescription>Target specific yield curve shape</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(yieldCurveTargets).map(([maturity, yield_val]) => (
                      <div key={maturity}>
                        <label className="block text-sm font-medium mb-2">{maturity} Target (%)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={yield_val}
                          onChange={(e) => setYieldCurveTargets(prev => ({...prev, [maturity]: e.target.value}))}
                        />
                      </div>
                    ))}
                  </div>
                  <Button onClick={executeYieldCurveControl} disabled={isLoading} className="w-full">
                    {isLoading ? 'Controlling...' : 'Execute Yield Curve Control'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🌍 International Coordination</CardTitle>
                  <CardDescription>Coordinate with other central banks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Coordination Action</label>
                    <Select value={coordinationAction} onValueChange={(value: 'COORDINATED_EASING' | 'COORDINATED_TIGHTENING') => setCoordinationAction(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COORDINATED_EASING">COORDINATED EASING</SelectItem>
                        <SelectItem value="COORDINATED_TIGHTENING">COORDINATED TIGHTENING</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={executeInternationalCoordination} disabled={isLoading} className="w-full">
                    {isLoading ? 'Coordinating...' : 'Execute International Coordination'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🏦 Banking Stress Test</CardTitle>
                  <CardDescription>Test banking system resilience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Stress Test Scenario</label>
                    <Select value={stressTestScenario} onValueChange={(value: 'MILD' | 'SEVERE' | 'EXTREME') => setStressTestScenario(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MILD">MILD STRESS</SelectItem>
                        <SelectItem value="SEVERE">SEVERE STRESS</SelectItem>
                        <SelectItem value="EXTREME">EXTREME STRESS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={executeStressTest} disabled={isLoading} className="w-full">
                    {isLoading ? 'Testing...' : 'Run Banking Stress Test'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stability">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Financial Stability Metrics</CardTitle>
                  <CardDescription>Real-time stability monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stabilityMetrics && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Systemic Risk:</span>
                        <span className="font-mono">{stabilityMetrics.systemic_risk?.toFixed(3) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Spreads:</span>
                        <span className="font-mono">{stabilityMetrics.credit_spreads?.toFixed(0) || 'N/A'} bps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volatility Index:</span>
                        <span className="font-mono">{stabilityMetrics.volatility_index?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Liquidity:</span>
                        <span className="font-mono">{stabilityMetrics.market_liquidity?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                  <Button onClick={loadStabilityMetrics} disabled={isLoading} className="w-full">
                    {isLoading ? 'Loading...' : 'Refresh Stability Metrics'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emergency">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🚨 Emergency Liquidity Injection</CardTitle>
                  <CardDescription>Crisis response liquidity provision</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Amount (USD)</label>
                    <Input
                      type="number"
                      value={emergencyAmount}
                      onChange={(e) => setEmergencyAmount(e.target.value)}
                      placeholder="200000000000"
                    />
                  </div>
                  <Button onClick={executeEmergencyLiquidity} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
                    {isLoading ? 'Injecting...' : 'Execute Emergency Liquidity'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🛑 Market Circuit Breaker</CardTitle>
                  <CardDescription>Activate emergency market controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Reason</label>
                    <Input
                      value={circuitBreakerReason}
                      onChange={(e) => setCircuitBreakerReason(e.target.value)}
                      placeholder="Market volatility spike"
                    />
                  </div>
                  <Button onClick={activateCircuitBreaker} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
                    {isLoading ? 'Activating...' : 'Activate Circuit Breaker'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Academic Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Academic Notice:</strong> This is an educational simulation of central bank monetary policy tools 
            based on academic research and theoretical models. All operations are simulated for learning purposes.
          </p>
        </div>
      </div>
    </div>
  );
}