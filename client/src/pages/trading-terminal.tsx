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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="market-watch">Market Watch</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="order">Order Panel</TabsTrigger>
            <TabsTrigger value="news">Forex News</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
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
        </Tabs>
        </div>
      </div>
    </div>
  );
}