import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Target, Zap, Database, TrendingDown, DollarSign, Activity } from "lucide-react";

interface FREDCampaignData {
  metadata: {
    skill: string;
    target_pair: string;
    target_bank: string;
    initial_reserve: number;
    duration_days: number;
    generation_time: string;
  };
  reserve_history: number[];
  rate_history: number[];
  demand_history: number[];
  intervention_log: Array<{
    day: number;
    rate: number;
    band_breach: number;
    demand: number;
    intervention: string;
    remaining_reserve: number;
  }>;
}

export default function FREDSkillPage() {
  const [campaignStatus, setCampaignStatus] = useState<'idle' | 'deploying' | 'active' | 'completed'>('idle');
  const [deploymentResults, setDeploymentResults] = useState<any>(null);

  const { data: campaignResults, isLoading: resultsLoading, refetch: refetchResults } = useQuery({
    queryKey: ['/api/fed-monetary/fred-campaign-results'],
    enabled: campaignStatus === 'completed',
    refetchInterval: campaignStatus === 'active' ? 10000 : false,
  });

  const deployFREDSkill = async () => {
    setCampaignStatus('deploying');
    
    try {
      const response = await fetch('/api/fed-monetary/deploy-fred-skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skill: 'FX_RESERVE_DRAIN',
          mode: 'LISTEN_AND_ATTACK',
          power_level: 'B2_SPIRIT',
          target_pair: 'USD/VND',
          target_bank: 'SBV'
        })
      });

      const result = await response.json();
      setDeploymentResults(result);
      setCampaignStatus('active');
      
      // Auto-check for results after 30 seconds
      setTimeout(() => {
        setCampaignStatus('completed');
        refetchResults();
      }, 30000);
    } catch (error) {
      console.error('Deployment failed:', error);
      setCampaignStatus('idle');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(num);
  };

  const calculateDepletionPercentage = (initial: number, current: number) => {
    return ((initial - current) / initial) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Target className="h-8 w-8 text-red-400" />
            FRED Skill Agent
          </h1>
          <p className="text-xl text-slate-300">
            FX Reserve Drain System - USD/VND Band Exploitation
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="bg-red-900/20 text-red-300 border-red-600">
              Academic Simulation
            </Badge>
            <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-600">
              Central Bank Research
            </Badge>
          </div>
        </div>

        {/* Mission Control */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Mission Control
            </CardTitle>
            <CardDescription className="text-slate-300">
              Deploy FRED skill to analyze SBV USD reserves via USD/VND band exploitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-sm text-slate-400">Target</div>
                <div className="text-lg font-semibold text-white">SBV (State Bank of Vietnam)</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-sm text-slate-400">Currency Pair</div>
                <div className="text-lg font-semibold text-white">USD/VND</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="text-sm text-slate-400">Band Type</div>
                <div className="text-lg font-semibold text-white">ABV ±5%</div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={deployFREDSkill}
                disabled={campaignStatus === 'deploying' || campaignStatus === 'active'}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
              >
                {campaignStatus === 'deploying' && 'Deploying...'}
                {campaignStatus === 'active' && 'Campaign Active'}
                {campaignStatus === 'idle' && 'Deploy FRED Skill'}
                {campaignStatus === 'completed' && 'Redeploy'}
              </Button>
            </div>

            {campaignStatus === 'active' && (
              <Alert className="bg-yellow-900/20 border-yellow-600">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300">
                  FRED skill deployment active. Running 90-day simulation...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Deployment Status */}
        {deploymentResults && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Deployment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-sm text-slate-400">Skill</div>
                  <div className="text-white font-semibold">{deploymentResults.skill}</div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-sm text-slate-400">Mode</div>
                  <div className="text-white font-semibold">{deploymentResults.mode}</div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-sm text-slate-400">Power Level</div>
                  <div className="text-white font-semibold">{deploymentResults.power_level}</div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-sm text-slate-400">Status</div>
                  <Badge className="bg-green-900/20 text-green-300 border-green-600">
                    {deploymentResults.deployment_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign Results */}
        {campaignResults?.success && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="reserves" className="data-[state=active]:bg-slate-700 text-white">
                Reserve Analysis
              </TabsTrigger>
              <TabsTrigger value="interventions" className="data-[state=active]:bg-slate-700 text-white">
                Interventions
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-700 text-white">
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">Initial Reserve</div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(campaignResults.data.metadata.initial_reserve)}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">Final Reserve</div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(campaignResults.data.reserve_history[campaignResults.data.reserve_history.length - 1])}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">Reserve Depletion</div>
                      <div className="text-2xl font-bold text-red-400">
                        {formatNumber(calculateDepletionPercentage(
                          campaignResults.data.metadata.initial_reserve,
                          campaignResults.data.reserve_history[campaignResults.data.reserve_history.length - 1]
                        ))}%
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400">Duration</div>
                      <div className="text-2xl font-bold text-white">
                        {campaignResults.data.metadata.duration_days} days
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reserves" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    Reserve Depletion Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">Reserve Depletion Progress</div>
                      <Progress 
                        value={calculateDepletionPercentage(
                          campaignResults.data.metadata.initial_reserve,
                          campaignResults.data.reserve_history[campaignResults.data.reserve_history.length - 1]
                        )}
                        className="h-4"
                      />
                      <div className="text-xs text-slate-400 mt-1">
                        {formatNumber(calculateDepletionPercentage(
                          campaignResults.data.metadata.initial_reserve,
                          campaignResults.data.reserve_history[campaignResults.data.reserve_history.length - 1]
                        ))}% of initial reserves depleted
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400">Amount Depleted</div>
                        <div className="text-xl font-bold text-red-400">
                          {formatCurrency(
                            campaignResults.data.metadata.initial_reserve - 
                            campaignResults.data.reserve_history[campaignResults.data.reserve_history.length - 1]
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400">Daily Average Depletion</div>
                        <div className="text-xl font-bold text-orange-400">
                          {formatCurrency(
                            (campaignResults.data.metadata.initial_reserve - 
                             campaignResults.data.reserve_history[campaignResults.data.reserve_history.length - 1]) /
                            campaignResults.data.metadata.duration_days
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interventions" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-yellow-400" />
                    SBV Intervention Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-slate-400">
                      Total Interventions: {campaignResults.data.intervention_log.length}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {campaignResults.data.intervention_log.slice(-10).map((intervention, index) => (
                        <div key={index} className="bg-slate-700/50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-white font-semibold">Day {intervention.day}</div>
                              <div className="text-sm text-slate-400">
                                Rate: {formatNumber(intervention.rate)} VND/USD
                              </div>
                              <div className="text-sm text-slate-400">
                                Band Breach: {formatNumber(intervention.band_breach * 100)}%
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant="outline" 
                                className={
                                  intervention.intervention === 'RESERVE_EXHAUSTED' 
                                    ? 'bg-red-900/20 text-red-300 border-red-600'
                                    : intervention.intervention === 'USD_SALE'
                                    ? 'bg-yellow-900/20 text-yellow-300 border-yellow-600'
                                    : 'bg-green-900/20 text-green-300 border-green-600'
                                }
                              >
                                {intervention.intervention.replace('_', ' ')}
                              </Badge>
                              <div className="text-sm text-slate-400 mt-1">
                                Reserve: {formatCurrency(intervention.remaining_reserve)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    Campaign Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400">Campaign Start</div>
                        <div className="text-white font-semibold">
                          {new Date(campaignResults.data.metadata.generation_time).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400">Target Bank</div>
                        <div className="text-white font-semibold">
                          {campaignResults.data.metadata.target_bank}
                        </div>
                      </div>
                      <div className="bg-slate-700/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400">Currency Pair</div>
                        <div className="text-white font-semibold">
                          {campaignResults.data.metadata.target_pair}
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-slate-600" />
                    
                    <div className="text-center text-slate-400">
                      <p>Campaign executed successfully with {formatNumber(calculateDepletionPercentage(
                        campaignResults.data.metadata.initial_reserve,
                        campaignResults.data.reserve_history[campaignResults.data.reserve_history.length - 1]
                      ))}% reserve depletion achieved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {resultsLoading && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-center text-slate-400">
                Loading campaign results...
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}