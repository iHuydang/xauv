
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
            <TabsTrigger value="open-market">Open Market Ops</TabsTrigger>
            <TabsTrigger value="qe">Quantitative Easing</TabsTrigger>
            <TabsTrigger value="gold">Gold Control</TabsTrigger>
            <TabsTrigger value="currency">Currency Intervention</TabsTrigger>
          </TabsList>
          
          <TabsList className="grid grid-cols-4 w-full mt-2">
            <TabsTrigger value="inflation">Inflation Targeting</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Tools</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Controls</TabsTrigger>
            <TabsTrigger value="monitoring">Real-time Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="open-market">
            <Card>
              <CardHeader>
                <CardTitle>💰 Open Market Operations</CardTitle>
                <CardDescription>
                  Execute bond purchases/sales to control money supply and interest rates
                </CardDescription>
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
          </TabsContent>

          <TabsContent value="qe">
            <Card>
              <CardHeader>
                <CardTitle>🖨️ Quantitative Easing Program</CardTitle>
                <CardDescription>
                  Large-scale asset purchase program to inject liquidity
                </CardDescription>
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
                <div className="text-sm text-gray-600">
                  Monthly Purchase: {formatCurrency(parseInt(qeAmount) / parseInt(qeDuration))}
                </div>
                <Button onClick={executeQuantitativeEasing} disabled={isLoading} className="w-full">
                  {isLoading ? 'Starting QE...' : 'Start QE Program'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gold">
            <Card>
              <CardHeader>
                <CardTitle>🥇 Gold Standard Manipulation</CardTitle>
                <CardDescription>
                  Control gold price through coordinated central bank operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gold Control Action</label>
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Current Price:</span>
                    <span className="ml-2">${systemStatus.market_control.goldPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Fair Value:</span>
                    <span className="ml-2">${systemStatus.gold_fair_value.toFixed(2)}</span>
                  </div>
                </div>
                <Button onClick={executeGoldManipulation} disabled={isLoading} className="w-full">
                  {isLoading ? 'Executing...' : `${goldAction} Gold Price`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currency">
            <Card>
              <CardHeader>
                <CardTitle>💱 Currency Intervention</CardTitle>
                <CardDescription>
                  Direct intervention in forex markets to influence exchange rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Currency</label>
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
          </TabsContent>

          <TabsContent value="inflation">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Inflation Targeting</CardTitle>
                <CardDescription>
                  Set inflation targets and adjust monetary policy accordingly
                </CardDescription>
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Current Expectations:</span>
                    <span className="ml-2">{systemStatus.market_control.inflationExpectations.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Target Gap:</span>
                    <span className="ml-2">
                      {(parseFloat(inflationTarget) - systemStatus.market_control.inflationExpectations).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Button onClick={executeInflationTargeting} disabled={isLoading} className="w-full">
                  {isLoading ? 'Adjusting...' : 'Set Inflation Target'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🚨 Emergency Measures</CardTitle>
                  <CardDescription>
                    Activate emergency monetary policy responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Crisis Type</label>
                    <Select value={emergencyType} onValueChange={(value: any) => setEmergencyType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FINANCIAL_CRISIS">Financial Crisis</SelectItem>
                        <SelectItem value="HYPERINFLATION">Hyperinflation</SelectItem>
                        <SelectItem value="DEFLATION">Deflation</SelectItem>
                        <SelectItem value="BANK_RUN">Bank Run</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={executeEmergencyMeasures} disabled={isLoading} className="w-full bg-red-600">
                    {isLoading ? 'Activating...' : `Activate ${emergencyType} Response`}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>💰 Launch CBDC</CardTitle>
                  <CardDescription>
                    Launch Central Bank Digital Currency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">CBDC Name</label>
                    <Input
                      type="text"
                      value={cbdcName}
                      onChange={(e) => setCbdcName(e.target.value)}
                      placeholder="FedCoin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Initial Supply</label>
                    <Input
                      type="number"
                      value={cbdcSupply}
                      onChange={(e) => setCbdcSupply(e.target.value)}
                      placeholder="1000000000000"
                    />
                  </div>
                  <Button onClick={launchCBDC} disabled={isLoading} className="w-full">
                    {isLoading ? 'Launching...' : 'Launch CBDC'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📉 Negative Interest Rates</CardTitle>
                  <CardDescription>
                    Implement negative interest rate policy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Rate (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={negativeRate}
                      onChange={(e) => setNegativeRate(e.target.value)}
                      placeholder="-0.5"
                    />
                  </div>
                  <Button onClick={implementNegativeRates} disabled={isLoading} className="w-full">
                    {isLoading ? 'Implementing...' : 'Implement Negative Rates'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🚁 Helicopter Money</CardTitle>
                  <CardDescription>
                    Direct monetary transfers to citizens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                    <Input
                      type="number"
                      value={helicopterAmount}
                      onChange={(e) => setHelicopterAmount(e.target.value)}
                      placeholder="1000000000000"
                    />
                  </div>
                  <Button onClick={executeHelicopterMoney} disabled={isLoading} className="w-full">
                    {isLoading ? 'Executing...' : 'Execute Helicopter Money'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advanced">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📈 Yield Curve Control</CardTitle>
                  <CardDescription>
                    Control specific maturity yields
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Maturity</label>
                      <Select value={yieldMaturity} onValueChange={setYieldMaturity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2Y">2 Year</SelectItem>
                          <SelectItem value="10Y">10 Year</SelectItem>
                          <SelectItem value="30Y">30 Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Target Yield (%)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={yieldTarget}
                        onChange={(e) => setYieldTarget(e.target.value)}
                        placeholder="3.0"
                      />
                    </div>
                  </div>
                  <Button onClick={implementYieldCurveControl} disabled={isLoading} className="w-full">
                    {isLoading ? 'Implementing...' : 'Implement Yield Control'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📢 Forward Guidance</CardTitle>
                  <CardDescription>
                    Communicate future policy intentions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Guidance Message</label>
                    <Input
                      type="text"
                      value={guidanceMessage}
                      onChange={(e) => setGuidanceMessage(e.target.value)}
                      placeholder="Rates will remain low for extended period"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time Horizon (months)</label>
                    <Input
                      type="number"
                      value={guidanceHorizon}
                      onChange={(e) => setGuidanceHorizon(e.target.value)}
                      placeholder="12"
                    />
                  </div>
                  <Button onClick={issueForwardGuidance} disabled={isLoading} className="w-full">
                    {isLoading ? 'Issuing...' : 'Issue Forward Guidance'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔄 International Swap Lines</CardTitle>
                  <CardDescription>
                    Provide dollar liquidity to foreign central banks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Currency</label>
                      <Select value={swapCurrency} onValueChange={setSwapCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">Euro</SelectItem>
                          <SelectItem value="JPY">Japanese Yen</SelectItem>
                          <SelectItem value="GBP">British Pound</SelectItem>
                          <SelectItem value="CHF">Swiss Franc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Amount (USD)</label>
                      <Input
                        type="number"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        placeholder="100000000000"
                      />
                    </div>
                  </div>
                  <Button onClick={activateSwapLines} disabled={isLoading} className="w-full">
                    {isLoading ? 'Activating...' : 'Activate Swap Lines'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🧪 Stress Testing</CardTitle>
                  <CardDescription>
                    Test system resilience under extreme scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Stress Scenario</label>
                    <Select value={stressScenario} onValueChange={setStressScenario}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GREAT_DEPRESSION">Great Depression</SelectItem>
                        <SelectItem value="HYPERINFLATION">Hyperinflation</SelectItem>
                        <SelectItem value="FINANCIAL_CRISIS">Financial Crisis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={runStressTest} disabled={isLoading} className="w-full">
                    {isLoading ? 'Running...' : 'Run Stress Test'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card>
              <CardHeader>
                <CardTitle>📡 Real-Time Economic Monitoring</CardTitle>
                <CardDescription>
                  Monitor economic indicators and detect threats in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">System Status</div>
                    <div className="text-xl font-bold text-green-600">OPERATIONAL</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Monitoring</div>
                    <div className="text-xl font-bold text-blue-600">ACTIVE</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Threats Detected</div>
                    <div className="text-xl font-bold text-yellow-600">0</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Last Update</div>
                    <div className="text-xl font-bold text-gray-600">Live</div>
                  </div>
                </div>
                <Button onClick={startRealTimeMonitoring} disabled={isLoading} className="w-full">
                  {isLoading ? 'Starting...' : 'Start Real-Time Monitoring'}
                </Button>
              </CardContent>
            </Card>
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
