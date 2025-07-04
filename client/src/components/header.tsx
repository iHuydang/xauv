import { useQuery } from '@tanstack/react-query';
import { Bell, User, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/trading-utils';

export default function Header() {
  const { data: account } = useQuery({
    queryKey: ['/api/account'],
  });

  return (
    <header className="trading-bg-secondary trading-border border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 trading-bg-success rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white">VNForexX</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="trading-text-success hover:text-white transition-colors">
              Terminal
            </a>
            <a href="/attack-control" className="text-gray-400 hover:text-white transition-colors">
              Tấn công SJC
            </a>
            <a href="/world-gold" className="text-gray-400 hover:text-white transition-colors">
              Vàng Thế giới
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Telegram Bot
            </a>
          </nav>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm text-gray-400">Account Balance</div>
            <div className="text-lg font-semibold trading-text-success">
              {account ? formatCurrency(account.balance) : '$10,247.83'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Equity</div>
            <div className="text-lg font-semibold text-white">
              {account ? formatCurrency(account.equity) : '$10,359.21'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">P&L</div>
            <div className={`text-lg font-semibold ${
              account && parseFloat(account.pnl) >= 0 ? 'trading-text-success' : 'trading-text-danger'
            }`}>
              {account ? (parseFloat(account.pnl) >= 0 ? '+' : '') + formatCurrency(account.pnl) : '+$111.38'}
            </div>
          </div>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Bell className="text-gray-400 w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <User className="text-gray-300 w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
