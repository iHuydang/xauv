import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Building, DollarSign, TrendingUp, RefreshCw, BarChart, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface AMBSOperation {
  operationId: string;
  operationType: string;
  operationDate: string;
  settlementDate: string;
  maturityDate?: string;
  securityType: string;
  operationAmount: number;
  acceptedAmount?: number;
  submittedAmount?: number;
  results?: Array<{
    dealerId: string;
    dealerName: string;
    submittedAmount: number;
    acceptedAmount: number;
    rate?: number;
    spread?: number;
  }>;
}

interface TreasuryOperation {
  operationId: string;
  operationType: string;
  auctionDate: string;
  issueDate: string;
  maturityDate: string;
  securityTerm: string;
  securityType: string;
  announcedAmount: number;
  acceptedAmount: number;
  highYield?: number;
  lowYield?: number;
  medianYield?: number;
}

interface RepoOperation {
  operationId: string;
  operationType: string;
  operationDate: string;
  settlementDate: string;
  maturityDate: string;
  term: number;
  acceptedAmount: number;
  submittedAmount: number;
  rate: number;
  numberOfCounterparties: number;
}

interface LiquidityAnalysis {
  totalAccepted: number;
  totalSubmitted: number;
  acceptanceRatio: number;
  averageSpread: number;
  topDealers: Array<{ name: string; acceptedAmount: number }>;
}

export default function NYFedMarketsPage() {
  const [useBeta, setUseBeta] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState("5");

  // Fetch AMBS operations
  const { data: ambsData, isLoading: ambsLoading, refetch: refetchAMBS } = useQuery({
    queryKey: ["/api/ny-fed/ambs/results", startDate, endDate, useBeta],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (useBeta) params.append("useBeta", "true");
      
      const response = await fetch(`/api/ny-fed/ambs/results?${params}`);
      if (!response.ok) throw new Error("Failed to fetch AMBS operations");
      return response.json();
    }
  });

  // Fetch latest AMBS operation
  const { data: latestAMBS } = useQuery({
    queryKey: ["/api/ny-fed/ambs/latest", useBeta],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (useBeta) params.append("useBeta", "true");
      
      const response = await fetch(`/api/ny-fed/ambs/latest?${params}`);
      if (!response.ok) throw new Error("Failed to fetch latest AMBS");
      return response.json();
    }
  });

  // Fetch AMBS liquidity analysis
  const { data: liquidityData, refetch: refetchLiquidity } = useQuery({
    queryKey: ["/api/ny-fed/ambs/liquidity-analysis"],
    queryFn: async () => {
      const response = await fetch("/api/ny-fed/ambs/liquidity-analysis");
      if (!response.ok) throw new Error("Failed to fetch liquidity analysis");
      return response.json();
    }
  });

  // Fetch Treasury operations
  const { data: treasuryData, refetch: refetchTreasury } = useQuery({
    queryKey: ["/api/ny-fed/treasury/results", startDate, endDate, useBeta],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (useBeta) params.append("useBeta", "true");
      
      const response = await fetch(`/api/ny-fed/treasury/results?${params}`);
      if (!response.ok) throw new Error("Failed to fetch Treasury operations");
      return response.json();
    }
  });

  // Fetch Repo operations
  const { data: repoData, refetch: refetchRepo } = useQuery({
    queryKey: ["/api/ny-fed/repo/results", startDate, endDate, useBeta],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (useBeta) params.append("useBeta", "true");
      
      const response = await fetch(`/api/ny-fed/repo/results?${params}`);
      if (!response.ok) throw new Error("Failed to fetch Repo operations");
      return response.json();
    }
  });

  // Start monitoring mutation
  const startMonitoringMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ny-fed/monitoring/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: parseInt(monitoringInterval) })
      });
      if (!response.ok) throw new Error("Failed to start monitoring");
      return response.json();
    },
    onSuccess: () => {
      setIsMonitoring(true);
      queryClient.invalidateQueries();
    }
  });

  // Stop monitoring mutation
  const stopMonitoringMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ny-fed/monitoring/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to stop monitoring");
      return response.json();
    },
    onSuccess: () => {
      setIsMonitoring(false);
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatBillions = (amount: number) => {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building className="w-8 h-8" />
            NY Fed Markets API Integration
          </h1>
          <p className="text-muted-foreground mt-2">
            Agency Mortgage-Backed Securities (AMBS), Treasury, and Repo Operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="beta-mode"
              checked={useBeta}
              onCheckedChange={setUseBeta}
            />
            <Label htmlFor="beta-mode">Use Beta API</Label>
          </div>
          {useBeta && (
            <Badge variant="secondary">Beta Mode</Badge>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
          <CardDescription>Filter operations by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  refetchAMBS();
                  refetchTreasury();
                  refetchRepo();
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Control */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Monitoring</CardTitle>
          <CardDescription>Monitor Fed operations in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Monitoring Interval (minutes)</Label>
              <Input
                type="number"
                value={monitoringInterval}
                onChange={(e) => setMonitoringInterval(e.target.value)}
                disabled={isMonitoring}
                className="w-32"
              />
            </div>
            <Button
              onClick={() => {
                if (isMonitoring) {
                  stopMonitoringMutation.mutate();
                } else {
                  startMonitoringMutation.mutate();
                }
              }}
              variant={isMonitoring ? "destructive" : "default"}
              disabled={startMonitoringMutation.isPending || stopMonitoringMutation.isPending}
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </Button>
            {isMonitoring && (
              <Badge variant="default" className="animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest Operation Alert */}
      {latestAMBS?.data && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Latest AMBS Operation:</strong> {latestAMBS.data.operationId} - 
            {latestAMBS.data.operationType} on {format(new Date(latestAMBS.data.operationDate), "MMM dd, yyyy")} - 
            Amount: {formatBillions(latestAMBS.data.operationAmount)}
          </AlertDescription>
        </Alert>
      )}

      {/* Liquidity Analysis */}
      {liquidityData?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              AMBS Market Liquidity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Accepted</p>
                <p className="text-2xl font-bold">{formatBillions(liquidityData.data.totalAccepted)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Submitted</p>
                <p className="text-2xl font-bold">{formatBillions(liquidityData.data.totalSubmitted)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acceptance Ratio</p>
                <p className="text-2xl font-bold">{(liquidityData.data.acceptanceRatio * 100).toFixed(1)}%</p>
                <Progress value={liquidityData.data.acceptanceRatio * 100} className="mt-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Spread</p>
                <p className="text-2xl font-bold">{liquidityData.data.averageSpread.toFixed(3)}</p>
              </div>
            </div>
            
            {liquidityData.data.topDealers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Top Dealers by Accepted Amount</h4>
                <div className="space-y-2">
                  {liquidityData.data.topDealers.map((dealer, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{dealer.name}</span>
                      <Badge variant="outline">{formatBillions(dealer.acceptedAmount)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="ambs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ambs">AMBS Operations</TabsTrigger>
          <TabsTrigger value="treasury">Treasury Operations</TabsTrigger>
          <TabsTrigger value="repo">Repo Operations</TabsTrigger>
        </TabsList>

        {/* AMBS Operations Tab */}
        <TabsContent value="ambs">
          <Card>
            <CardHeader>
              <CardTitle>Agency Mortgage-Backed Securities Operations</CardTitle>
              <CardDescription>
                {ambsData?.count || 0} operations found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ambsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : ambsData?.data && ambsData.data.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {ambsData.data.slice(0, 20).map((operation: AMBSOperation) => (
                      <Card key={operation.operationId}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Operation ID</p>
                              <p className="font-medium">{operation.operationId}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Type</p>
                              <Badge>{operation.operationType}</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Operation Date</p>
                              <p className="font-medium">
                                {format(new Date(operation.operationDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Amount</p>
                              <p className="font-medium">{formatBillions(operation.operationAmount)}</p>
                            </div>
                          </div>
                          
                          {operation.acceptedAmount && operation.submittedAmount && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Acceptance Rate: {((operation.acceptedAmount / operation.submittedAmount) * 100).toFixed(1)}%
                                </span>
                                <div className="flex gap-4">
                                  <span className="text-sm">
                                    Submitted: {formatBillions(operation.submittedAmount)}
                                  </span>
                                  <span className="text-sm font-medium">
                                    Accepted: {formatBillions(operation.acceptedAmount)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No AMBS operations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treasury Operations Tab */}
        <TabsContent value="treasury">
          <Card>
            <CardHeader>
              <CardTitle>Treasury Auction Results</CardTitle>
              <CardDescription>
                {treasuryData?.count || 0} operations found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treasuryData?.data && treasuryData.data.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {treasuryData.data.slice(0, 20).map((operation: TreasuryOperation) => (
                      <Card key={operation.operationId}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Security</p>
                              <p className="font-medium">{operation.securityTerm} {operation.securityType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Auction Date</p>
                              <p className="font-medium">
                                {format(new Date(operation.auctionDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Amount</p>
                              <p className="font-medium">{formatBillions(operation.acceptedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Median Yield</p>
                              <p className="font-medium">
                                {operation.medianYield ? `${operation.medianYield.toFixed(3)}%` : "N/A"}
                              </p>
                            </div>
                          </div>
                          
                          {operation.highYield && operation.lowYield && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between text-sm">
                                <span>Yield Range: {operation.lowYield.toFixed(3)}% - {operation.highYield.toFixed(3)}%</span>
                                <Badge variant="outline">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {operation.securityType}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No Treasury operations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repo Operations Tab */}
        <TabsContent value="repo">
          <Card>
            <CardHeader>
              <CardTitle>Repo & Reverse Repo Operations</CardTitle>
              <CardDescription>
                {repoData?.count || 0} operations found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {repoData?.data && repoData.data.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {repoData.data.slice(0, 20).map((operation: RepoOperation) => (
                      <Card key={operation.operationId}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Type</p>
                              <Badge variant={operation.operationType === "Repo" ? "default" : "secondary"}>
                                {operation.operationType}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Operation Date</p>
                              <p className="font-medium">
                                {format(new Date(operation.operationDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Term</p>
                              <p className="font-medium">{operation.term} days</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Rate</p>
                              <p className="font-medium">{operation.rate.toFixed(2)}%</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Accepted:</span>
                                <span className="ml-2 font-medium">{formatBillions(operation.acceptedAmount)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Submitted:</span>
                                <span className="ml-2 font-medium">{formatBillions(operation.submittedAmount)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Counterparties:</span>
                                <span className="ml-2 font-medium">{operation.numberOfCounterparties}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No Repo operations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}