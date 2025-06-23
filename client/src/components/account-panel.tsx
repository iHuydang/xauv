
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface TradingAccount {
  id: string;
  accountNumber: string;
  server: string;
  broker: string;
  accountType: 'real' | 'demo';
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  leverage: number;
  isActive: boolean;
  isSecBotFree: boolean;
  lastSync: string;
}

export default function AccountPanel() {
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [password, setPassword] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/trading-accounts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const connectAccountMutation = useMutation({
    mutationFn: async ({ accountId, password, investorPassword }: { 
      accountId: string, 
      password: string, 
      investorPassword?: string 
    }) => {
      return apiRequest('POST', `/api/trading-accounts/${accountId}/connect`, {
        password,
        investorPassword
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      toast({
        title: "Kết nối thành công",
        description: "Tài khoản đã được kết nối thành công",
      });
      setPassword('');
      setInvestorPassword('');
    },
    onError: () => {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối tài khoản. Vui lòng kiểm tra thông tin đăng nhập.",
        variant: "destructive",
      });
    },
  });

  const syncAccountMutation = useMutation({
    mutationFn: (accountId: string) => 
      apiRequest('GET', `/api/trading-accounts/${accountId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      toast({
        title: "Đồng bộ thành công",
        description: "Dữ liệu tài khoản đã được cập nhật",
      });
    },
  });

  const handleConnect = async () => {
    if (!selectedAccount || !password) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    await connectAccountMutation.mutateAsync({
      accountId: selectedAccount,
      password,
      investorPassword: investorPassword || undefined
    });
    setIsConnecting(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tài Khoản Trading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Đang tải tài khoản...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài Khoản Exness MT5</CardTitle>
        <CardDescription>
          Quản lý và kết nối các tài khoản MetaTrader 5 của Exness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {accounts?.map((account: TradingAccount) => (
            <div
              key={account.id}
              className={`p-4 border rounded-lg transition-colors ${
                account.isActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">#{account.accountNumber}</h3>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? 'Đã kết nối' : 'Chưa kết nối'}
                    </Badge>
                    {account.isSecBotFree && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        SecBot Free
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Server: <span className="font-medium">{account.server}</span></div>
                    <div>Broker: <span className="font-medium">{account.broker}</span></div>
                    <div>Leverage: <span className="font-medium">1:{account.leverage}</span></div>
                    {account.isActive && (
                      <>
                        <div>Balance: <span className="font-medium text-green-600">
                          ${account.balance.toFixed(2)}
                        </span></div>
                        <div>Equity: <span className="font-medium">
                          ${account.equity.toFixed(2)}
                        </span></div>
                        <div>Free Margin: <span className="font-medium">
                          ${account.freeMargin.toFixed(2)}
                        </span></div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {!account.isActive ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedAccount(account.id)}
                        >
                          Kết nối
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Kết nối tài khoản #{account.accountNumber}</DialogTitle>
                          <DialogDescription>
                            Nhập thông tin đăng nhập để kết nối tài khoản MetaTrader 5
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Nhập mật khẩu tài khoản"
                            />
                          </div>
                          <div>
                            <Label htmlFor="investorPassword">Mật khẩu Investor (tùy chọn)</Label>
                            <Input
                              id="investorPassword"
                              type="password"
                              value={investorPassword}
                              onChange={(e) => setInvestorPassword(e.target.value)}
                              placeholder="Nhập mật khẩu investor (nếu có)"
                            />
                          </div>
                          <Button 
                            onClick={handleConnect}
                            disabled={isConnecting || !password}
                            className="w-full"
                          >
                            {isConnecting ? 'Đang kết nối...' : 'Kết nối'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncAccountMutation.mutate(account.id)}
                      disabled={syncAccountMutation.isPending}
                    >
                      {syncAccountMutation.isPending ? 'Đang đồng bộ...' : 'Đồng bộ'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Thông tin tài khoản được cấu hình:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Tài khoản #405691964 - Exness-MT5Real8</li>
            <li>• Tài khoản #205251387 - Exness-MT5Real8</li>
            <li>• Cả 2 tài khoản đều không bị SecBot</li>
            <li>• Hỗ trợ Market Scan an toàn</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
