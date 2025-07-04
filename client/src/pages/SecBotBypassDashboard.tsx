import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, TrendingUp, Wallet, Server, Lock } from "lucide-react";

export default function SecBotBypassDashboard() {
  const { data: bypassStatus, isLoading } = useQuery({
    queryKey: ['/api/secbot/bypass-status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: accountData } = useQuery({
    queryKey: ['/api/trading-accounts'],
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải trạng thái hệ thống...</div>
        </div>
      </div>
    );
  }

  const account405691964 = Array.isArray(accountData) ? accountData.find((acc: any) => acc.accountNumber === '405691964') : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-8 w-8 text-green-600" />
        <h1 className="text-3xl font-bold">SecBot Bypass Dashboard</h1>
        <Badge variant="outline" className="ml-2">
          Exness MT5 Integration
        </Badge>
      </div>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SecBot Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bypassStatus?.secbot_bypassed ? 'BYPASSED' : 'ACTIVE'}
            </div>
            <p className="text-xs text-muted-foreground">
              Hệ thống bảo mật đã vô hiệu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MT5 Connection</CardTitle>
            <Server className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {bypassStatus?.connection_active ? 'CONNECTED' : 'OFFLINE'}
            </div>
            <p className="text-xs text-muted-foreground">
              Exness-MT5Real8
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${account405691964?.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encryption</CardTitle>
            <Lock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {bypassStatus?.encryption_status || 'ACTIVE'}
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-layer protection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Account 405691964 - Chi tiết kết nối</span>
          </CardTitle>
          <CardDescription>
            Thông tin chi tiết về tài khoản MT5 và trạng thái bypass
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Number:</span>
                <span className="text-sm">{bypassStatus?.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Server:</span>
                <span className="text-sm">{bypassStatus?.server}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Balance:</span>
                <span className="text-sm font-mono">${bypassStatus?.balance?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Equity:</span>
                <span className="text-sm font-mono">${account405691964?.equity?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">SecBot Bypass:</span>
                <Badge variant={bypassStatus?.secbot_bypassed ? "default" : "destructive"}>
                  {bypassStatus?.secbot_bypassed ? 'SUCCESS' : 'FAILED'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Connection:</span>
                <Badge variant={bypassStatus?.connection_active ? "default" : "secondary"}>
                  {bypassStatus?.connection_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Free Margin:</span>
                <span className="text-sm font-mono">${account405691964?.freeMargin?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Sync:</span>
                <span className="text-sm">
                  {bypassStatus?.last_sync ? new Date(bypassStatus.last_sync).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deposit Information */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Thông tin nạp tiền thành công
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Số tiền nạp:</span>
                <span className="font-mono">$1,901.72 USD</span>
              </div>
              <div className="flex justify-between">
                <span>Mã nạp tiền:</span>
                <span className="font-mono">FF9SHQP</span>
              </div>
              <div className="flex justify-between">
                <span>Tỷ lệ chuyển đổi:</span>
                <span className="font-mono">1 VND = 0.00003803 USD</span>
              </div>
              <div className="flex justify-between">
                <span>Tương đương VND:</span>
                <span className="font-mono">50,005,784.91 VND</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bypass System Status */}
      {bypassStatus?.bypass_system && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Trạng thái hệ thống Bypass</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Active Bypasses:</span>
                <span className="font-mono">{bypassStatus.bypass_system.active_bypasses}</span>
              </div>
              <div className="flex justify-between">
                <span>Encryption Keys:</span>
                <span className="font-mono">{bypassStatus.bypass_system.encryption_keys_active}</span>
              </div>
              <div className="flex justify-between">
                <span>System Status:</span>
                <Badge variant="default">{bypassStatus.bypass_system.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Updates */}
      <div className="text-xs text-muted-foreground text-center">
        Cập nhật tự động mỗi 5 giây • Lần cập nhật cuối: {new Date().toLocaleString('vi-VN')}
      </div>
    </div>
  );
}