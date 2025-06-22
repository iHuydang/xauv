import { useState } from 'react';
import Header from '@/components/header';
import MarketWatch from '@/components/market-watch';
import ChartArea from '@/components/chart-area';
import TradingPanels from '@/components/trading-panels';
import OrderPanel from '@/components/order-panel';

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
      </div>
    </div>
  );
}
