
import { EventEmitter } from 'events';

export interface WebSocketStatus {
  providerId: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastConnected?: Date;
  lastError?: string;
  retryCount: number;
  maxRetries: number;
}

export class WebSocketStatusMonitor extends EventEmitter {
  private connections: Map<string, WebSocketStatus> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startMonitoring();
  }

  public registerConnection(
    providerId: string,
    name: string,
    url: string,
    maxRetries: number = 5
  ): void {
    this.connections.set(providerId, {
      providerId,
      name,
      url,
      status: 'disconnected',
      retryCount: 0,
      maxRetries
    });
  }

  public updateStatus(
    providerId: string,
    status: 'connected' | 'disconnected' | 'error' | 'connecting',
    error?: string
  ): void {
    const connection = this.connections.get(providerId);
    if (!connection) return;

    connection.status = status;
    
    if (status === 'connected') {
      connection.lastConnected = new Date();
      connection.retryCount = 0;
      connection.lastError = undefined;
    } else if (status === 'error') {
      connection.lastError = error;
      connection.retryCount++;
    }

    this.connections.set(providerId, connection);
    this.emit('status_update', connection);

    console.log(`📊 WebSocket Status Update: ${connection.name} - ${status.toUpperCase()}`);
    if (error) {
      console.log(`❌ Error: ${error}`);
    }
  }

  public getConnectionStatus(providerId: string): WebSocketStatus | null {
    return this.connections.get(providerId) || null;
  }

  public getAllStatuses(): WebSocketStatus[] {
    return Array.from(this.connections.values());
  }

  public getHealthySessions(): WebSocketStatus[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.status === 'connected'
    );
  }

  public getFailedSessions(): WebSocketStatus[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.status === 'error' || conn.retryCount >= conn.maxRetries
    );
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const healthy = this.getHealthySessions().length;
      const total = this.connections.size;
      const failed = this.getFailedSessions().length;

      console.log(`📊 WebSocket Health Report: ${healthy}/${total} connected, ${failed} failed`);

      if (healthy === 0 && total > 0) {
        console.log('⚠️ No WebSocket connections active - all providers failed');
        this.emit('all_connections_failed');
      }
    }, 30000); // Check every 30 seconds
  }

  public generateReport(): any {
    const statuses = this.getAllStatuses();
    
    return {
      total_connections: statuses.length,
      healthy_connections: this.getHealthySessions().length,
      failed_connections: this.getFailedSessions().length,
      connection_details: statuses.map(conn => ({
        provider: conn.name,
        status: conn.status,
        last_connected: conn.lastConnected,
        retry_count: conn.retryCount,
        last_error: conn.lastError
      })),
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failed = this.getFailedSessions();

    if (failed.length > 0) {
      recommendations.push('Consider using alternative data providers');
      recommendations.push('Check network connectivity and firewall settings');
      recommendations.push('Verify API keys and authentication credentials');
    }

    if (this.getHealthySessions().length === 0) {
      recommendations.push('Switch to backup data sources');
      recommendations.push('Enable offline mode with cached data');
    }

    return recommendations;
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export const webSocketStatusMonitor = new WebSocketStatusMonitor();
