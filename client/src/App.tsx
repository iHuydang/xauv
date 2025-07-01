import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TradingTerminal from "@/pages/trading-terminal";
import AttackControl from "@/pages/AttackControl";
import WorldGoldControl from "@/pages/WorldGoldControl";
import SecBotBypassDashboard from "@/pages/SecBotBypassDashboard";
import FredGoldAttack from "@/pages/FredGoldAttack";
import TwelveDataDashboard from "@/pages/TwelveDataDashboard";
import CoinrankingMarketMaker from "@/pages/CoinrankingMarketMaker";
import NotFound from "@/pages/not-found";
import MarketCompliancePanel from './components/MarketCompliancePanel';

function Router() {
  return (
    <Switch>
      <Route path="/" component={TradingTerminal} />
      <Route path="/attack-control" component={AttackControl} />
      <Route path="/world-gold" component={WorldGoldControl} />
      <Route path="/secbot-bypass" component={SecBotBypassDashboard} />
      <Route path="/fred-gold-attack" component={FredGoldAttack} />
      <Route path="/twelvedata" component={TwelveDataDashboard} />
      <Route path="/coinranking" component={CoinrankingMarketMaker} />
      <Route path="/market-compliance" component={MarketCompliancePanel} />
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