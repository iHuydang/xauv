import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import TradingTerminal from "@/pages/trading-terminal";
import AttackControl from "@/pages/AttackControl";
import FredGoldAttack from "@/pages/FredGoldAttack";
import WorldGoldControl from "@/pages/WorldGoldControl";
import CoinrankingMarketMaker from "@/pages/CoinrankingMarketMaker";
import SecBotBypassDashboard from "@/pages/SecBotBypassDashboard";
import FederalReserveControl from "./pages/FederalReserveControl";
import FREDSkillPage from "@/pages/FREDSkillPage";
import TwelveDataDashboard from "@/pages/TwelveDataDashboard";
import NYFedMarketsPage from "@/pages/NYFedMarketsPage";
import NotFound from "@/pages/not-found";
import MarketCompliancePanel from './components/MarketCompliancePanel';
import Landing from "@/pages/landing";
import Home from "@/pages/home";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/terminal" component={TradingTerminal} />
          <Route path="/attack-control" component={AttackControl} />
          <Route path="/world-gold" component={WorldGoldControl} />
          <Route path="/secbot-bypass" component={SecBotBypassDashboard} />
          <Route path="/fred-gold-attack" component={FredGoldAttack} />
          <Route path="/fred-skill" component={FREDSkillPage} />
          <Route path="/twelvedata" component={TwelveDataDashboard} />
          <Route path="/coinranking" component={CoinrankingMarketMaker} />
          <Route path="/market-compliance" component={MarketCompliancePanel} />
          <Route path="/federal-reserve" component={FederalReserveControl} />
          <Route path="/ny-fed-markets" component={NYFedMarketsPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;