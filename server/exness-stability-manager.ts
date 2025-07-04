import { EventEmitter } from 'events';

export interface ConnectionStatus {
  accountId: string;
  isStable: boolean;
  lastStableTime: Date;
  reconnectAttempts: number;
  autoReconnectEnabled: boolean;
  connectionHealth: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export class ExnessStabilityManager extends EventEmitter {
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private stabilityCheckInterval: NodeJS.Timeout | null = null;
  private readonly STABILITY_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor() {
    super();
    this.initializeStabilityChecks();
  }

  // Đăng ký account để monitor
  public registerAccount(accountId: string): void {
    if (this.connectionStatus.has(accountId)) {
      console.log(`Account ${accountId} already registered for stability monitoring`);
      return;
    }

    const status: ConnectionStatus = {
      accountId,
      isStable: false,
      lastStableTime: new Date(),
      reconnectAttempts: 0,
      autoReconnectEnabled: false, // Mặc định tắt auto-reconnect
      connectionHealth: 'disconnected'
    };

    this.connectionStatus.set(accountId, status);
    console.log(`✅ Account ${accountId} registered for stability monitoring`);
  }

  // Cập nhật trạng thái connection
  public updateConnectionStatus(accountId: string, isConnected: boolean): void {
    const status = this.connectionStatus.get(accountId);
    if (!status) {
      console.warn(`Account ${accountId} not registered for stability monitoring`);
      return;
    }

    status.isStable = isConnected;
    status.connectionHealth = this.calculateConnectionHealth(accountId, isConnected);
    
    if (isConnected) {
      status.lastStableTime = new Date();
      status.reconnectAttempts = 0; // Reset sau khi connect thành công
      console.log(`✅ Account ${accountId} connection stable`);
    } else {
      console.log(`❌ Account ${accountId} connection lost`);
    }

    this.connectionStatus.set(accountId, status);
    this.emit('status_updated', { accountId, status });
  }

  // Bật/tắt auto-reconnect cho account cụ thể
  public setAutoReconnect(accountId: string, enabled: boolean): boolean {
    const status = this.connectionStatus.get(accountId);
    if (!status) {
      console.warn(`Account ${accountId} not found`);
      return false;
    }

    status.autoReconnectEnabled = enabled;
    this.connectionStatus.set(accountId, status);
    
    console.log(`Account ${accountId}: Auto-reconnect ${enabled ? 'ENABLED' : 'DISABLED'}`);
    return true;
  }

  // Kiểm tra xem có nên reconnect không
  public shouldReconnect(accountId: string): boolean {
    const status = this.connectionStatus.get(accountId);
    if (!status) return false;

    // Không reconnect nếu:
    // 1. Auto-reconnect bị tắt
    // 2. Quá nhiều attempt
    // 3. Connection vẫn stable
    if (!status.autoReconnectEnabled) {
      console.log(`🔴 Auto-reconnect disabled for account ${accountId}`);
      return false;
    }

    if (status.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.log(`🔴 Max reconnect attempts reached for account ${accountId}`);
      return false;
    }

    if (status.isStable) {
      console.log(`✅ Account ${accountId} is already stable`);
      return false;
    }

    return true;
  }

  // Ghi nhận reconnection attempt
  public recordReconnectAttempt(accountId: string): void {
    const status = this.connectionStatus.get(accountId);
    if (!status) return;

    status.reconnectAttempts++;
    this.connectionStatus.set(accountId, status);
    
    console.log(`🔄 Reconnect attempt ${status.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} for account ${accountId}`);
  }

  // Lấy thông tin status
  public getConnectionStatus(accountId?: string): ConnectionStatus | Map<string, ConnectionStatus> {
    if (accountId) {
      return this.connectionStatus.get(accountId) || {
        accountId,
        isStable: false,
        lastStableTime: new Date(),
        reconnectAttempts: 0,
        autoReconnectEnabled: false,
        connectionHealth: 'disconnected'
      };
    }
    return this.connectionStatus;
  }

  // Tính toán connection health
  private calculateConnectionHealth(accountId: string, isConnected: boolean): 'excellent' | 'good' | 'poor' | 'disconnected' {
    if (!isConnected) return 'disconnected';

    const status = this.connectionStatus.get(accountId);
    if (!status) return 'disconnected';

    const timeSinceLastStable = Date.now() - status.lastStableTime.getTime();
    const hoursSinceStable = timeSinceLastStable / (1000 * 60 * 60);

    if (hoursSinceStable < 1 && status.reconnectAttempts === 0) return 'excellent';
    if (hoursSinceStable < 6 && status.reconnectAttempts <= 1) return 'good';
    if (status.reconnectAttempts <= 2) return 'poor';
    
    return 'disconnected';
  }

  // Khởi tạo check định kỳ
  private initializeStabilityChecks(): void {
    this.stabilityCheckInterval = setInterval(() => {
      this.performStabilityCheck();
    }, this.STABILITY_CHECK_INTERVAL);

    console.log('🛡️ Exness Stability Manager initialized');
  }

  // Thực hiện check định kỳ
  private performStabilityCheck(): void {
    for (const [accountId, status] of this.connectionStatus) {
      const timeSinceLastStable = Date.now() - status.lastStableTime.getTime();
      const minutesSinceStable = timeSinceLastStable / (1000 * 60);

      // Cảnh báo nếu mất kết nối quá 5 phút
      if (!status.isStable && minutesSinceStable > 5) {
        console.warn(`⚠️ Account ${accountId} has been disconnected for ${Math.round(minutesSinceStable)} minutes`);
        this.emit('long_disconnection', { accountId, minutesDisconnected: minutesSinceStable });
      }

      // Reset reconnect attempts sau 1 giờ
      if (minutesSinceStable > 60 && status.reconnectAttempts > 0) {
        status.reconnectAttempts = 0;
        this.connectionStatus.set(accountId, status);
        console.log(`🔄 Reset reconnect attempts for account ${accountId}`);
      }
    }
  }

  // Dọn dẹp khi shutdown
  public shutdown(): void {
    if (this.stabilityCheckInterval) {
      clearInterval(this.stabilityCheckInterval);
      this.stabilityCheckInterval = null;
    }
    console.log('🛡️ Exness Stability Manager shutdown completed');
  }

  // Manual reconnect với kiểm tra stability
  public requestManualReconnect(accountId: string): { allowed: boolean; reason: string } {
    const status = this.connectionStatus.get(accountId);
    if (!status) {
      return { allowed: false, reason: 'Account not registered' };
    }

    if (status.isStable) {
      return { allowed: false, reason: 'Connection is already stable' };
    }

    if (status.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      return { allowed: false, reason: 'Maximum reconnect attempts reached' };
    }

    // Thêm delay giữa các manual reconnect
    const timeSinceLastStable = Date.now() - status.lastStableTime.getTime();
    if (timeSinceLastStable < 30000) { // 30 seconds minimum
      return { allowed: false, reason: 'Please wait 30 seconds between reconnect attempts' };
    }

    this.recordReconnectAttempt(accountId);
    return { allowed: true, reason: 'Manual reconnect approved' };
  }
}

// Singleton instance
export const exnessStabilityManager = new ExnessStabilityManager();