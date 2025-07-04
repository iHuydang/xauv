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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TradingTerminal} />
      <Route path="/attack-control" component={AttackControl} />
      <Route path="/world-gold" component={WorldGoldControl} />
      <Route path="/secbot-bypass" component={SecBotBypassDashboard} />
      <Route path="/fred-gold-attack" component={FredGoldAttack} />
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
