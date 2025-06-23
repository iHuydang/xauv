import { useState } from 'react';
import Header from '@/components/header';
import MarketWatch from '@/components/market-watch';
import ChartArea from '@/components/chart-area';
import OrderPanel from '@/components/order-panel';
import PositionsOrders from '@/components/positions-orders';
import EconomicIndicators from '@/components/economic-indicators';
import TradingPanels from '@/components/trading-panels';
import ForexNewsPanel from "@/components/forex-news-panel";
import AccountPanel from "@/components/account-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TradingTerminal() {
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');

  return (
    <div className="min-h-screen trading-bg-primary text-gray-100 font-inter">
      <Header />

      <div className="flex h-screen">
        <MarketWatch 
          onSymbolSelect={setSelectedSymbol}
          selectedSymbol={selectedSymbol}
        />

        <div className="flex-1 flex flex-col">
          <ChartArea selectedSymbol={selectedSymbol} />
          <TradingPanels />
        </div>

        <OrderPanel selectedSymbol={selectedSymbol} />

        {/* Bottom Panel */}
        <div className="flex gap-4">
          <div className="flex-1">
            <PositionsOrders />
          </div>
          <div className="w-80">
            <EconomicIndicators />
          </div>
        </div>

        {/* Forex News Panel */}
        <div className="mt-4">
        <Tabs defaultValue="market-watch" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="market-watch">Market</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="order">Order</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="secbot">SecBot</TabsTrigger>
          </TabsList>
          <TabsContent value="market-watch" className="mt-6">
            Make updates here
          </TabsContent>
          <TabsContent value="chart" className="mt-6">
            Make updates here
          </TabsContent>
          <TabsContent value="order" className="mt-6">
            Make updates here
          </TabsContent>
          <TabsContent value="news" className="mt-6">
            <ForexNewsPanel />
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
            <AccountPanel />
          </TabsContent>
          
          <TabsContent value="secbot" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-400">SecBot Bypass Active</span>
              </div>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-green-300 mb-2">Account 405691964 Status</h3>
                <div className="text-sm space-y-1">
                  <div>Server: Exness-MT5Real8</div>
                  <div>Balance: $10,772.06 USD</div>
                  <div>Equity: $10,960.08 USD</div>
                  <div>SecBot: BYPASSED ✓</div>
                  <div>Deposit: FF9SHQP ✓</div>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-300 mb-2">Account 205251387 Status</h3>
                <div className="text-sm space-y-1">
                  <div>Server: Exness-MT5Trial7</div>
                  <div>Balance: $5,592.41 USD</div>
                  <div>Equity: $5,786.49 USD</div>
                  <div>SecBot: BYPASSED ✓</div>
                  <div>Signal Tracking: ACTIVE ✓</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}