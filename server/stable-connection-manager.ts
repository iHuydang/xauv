import { EventEmitter } from "events";

export interface ConnectionConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  gracefulShutdown: boolean;
}

export class StableConnectionManager extends EventEmitter {
  private connections: Map<string, any> = new Map();
  private healthChecks: Map<string, NodeJS.Timer> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private isShuttingDown: boolean = false;

  private readonly config: ConnectionConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    healthCheckInterval: 30000, // 30 seconds
    gracefulShutdown: true,
  };

  constructor(config?: Partial<ConnectionConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.setupGracefulShutdown();
  }

  // Đăng ký connection với stable management
  registerConnection(
    id: string,
    connection: any,
    healthCheckFn?: () => boolean,
  ): void {
    if (this.isShuttingDown) {
      console.log(
        `⚠️  Skipping connection registration for ${id} - system shutting down`,
      );
      return;
    }

    console.log(`🔗 Registering stable connection: ${id}`);

    this.connections.set(id, connection);
    this.retryAttempts.set(id, 0);

    // Setup health check nếu có
    if (healthCheckFn) {
      const interval = setInterval(() => {
        if (!this.isShuttingDown && !healthCheckFn()) {
          console.log(`❌ Health check failed for ${id}`);
          this.handleConnectionFailure(id);
        }
      }, this.config.healthCheckInterval);

      this.healthChecks.set(id, interval);
    }

    // Setup connection event handlers
    if (connection && typeof connection.on === "function") {
      connection.on("error", (error: Error) => {
        if (!this.isShuttingDown) {
          console.log(`❌ Connection error for ${id}:`, error.message);
          this.handleConnectionFailure(id);
        }
      });

      connection.on("close", () => {
        if (!this.isShuttingDown) {
          console.log(`🔌 Connection closed for ${id}`);
          this.handleConnectionFailure(id);
        }
      });
    }

    this.emit("connection_registered", { id, connection });
  }

  // Xử lý connection failure với retry logic
  private handleConnectionFailure(id: string): void {
    if (this.isShuttingDown) return;

    const attempts = this.retryAttempts.get(id) || 0;

    if (attempts >= this.config.maxRetries) {
      console.log(`🚫 Max retries reached for ${id}, marking as failed`);
      this.markConnectionAsFailed(id);
      return;
    }

    console.log(
      `🔄 Retry attempt ${attempts + 1}/${this.config.maxRetries} for ${id}`,
    );
    this.retryAttempts.set(id, attempts + 1);

    // Delay retry để tránh overwhelm
    setTimeout(
      () => {
        if (!this.isShuttingDown) {
          this.emit("connection_retry", { id, attempt: attempts + 1 });
        }
      },
      this.config.retryDelay * (attempts + 1),
    ); // Exponential backoff
  }

  // Đánh dấu connection là failed và cleanup
  private markConnectionAsFailed(id: string): void {
    console.log(`💀 Marking connection ${id} as permanently failed`);

    const connection = this.connections.get(id);
    if (connection && typeof connection.close === "function") {
      try {
        connection.close();
      } catch (error) {
        console.log(`⚠️  Error closing failed connection ${id}:`, error);
      }
    }

    this.cleanupConnection(id);
    this.emit("connection_failed", { id });
  }

  // Reset retry count khi connection thành công
  resetRetryCount(id: string): void {
    this.retryAttempts.set(id, 0);
    console.log(`✅ Connection ${id} stable, retry count reset`);
  }

  // Cleanup connection resources
  private cleanupConnection(id: string): void {
    this.connections.delete(id);
    this.retryAttempts.delete(id);

    const healthCheck = this.healthChecks.get(id);
    if (healthCheck) {
      clearInterval(healthCheck);
      this.healthChecks.delete(id);
    }
  }

  // Graceful shutdown của tất cả connections
  private setupGracefulShutdown(): void {
    const shutdown = () => {
      if (this.isShuttingDown) return;

      console.log("🛑 Initiating graceful shutdown of connections...");
      this.isShuttingDown = true;

      // Stop all health checks
      for (const [id, interval] of this.healthChecks) {
        clearInterval(interval);
        console.log(`🔇 Stopped health check for ${id}`);
      }

      // Close all connections gracefully
      for (const [id, connection] of this.connections) {
        if (connection && typeof connection.close === "function") {
          try {
            connection.close();
            console.log(`🔌 Closed connection ${id}`);
          } catch (error) {
            console.log(`⚠️  Error closing connection ${id}:`, error);
          }
        }
      }

      this.connections.clear();
      this.healthChecks.clear();
      this.retryAttempts.clear();

      console.log("✅ Graceful shutdown completed");
    };

    if (this.config.gracefulShutdown) {
      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
      process.on("beforeExit", shutdown);
    }
  }

  // Check xem connection có healthy không
  isConnectionHealthy(id: string): boolean {
    const connection = this.connections.get(id);
    const retryCount = this.retryAttempts.get(id) || 0;

    return connection !== undefined && retryCount < this.config.maxRetries;
  }

  // Get thống kê connections
  getConnectionStats(): any {
    const stats = {
      total: this.connections.size,
      healthy: 0,
      retrying: 0,
      failed: 0,
      connections: {},
    };

    for (const [id] of this.connections) {
      const retryCount = this.retryAttempts.get(id) || 0;
      const isHealthy = retryCount === 0;
      const isRetrying = retryCount > 0 && retryCount < this.config.maxRetries;
      const isFailed = retryCount >= this.config.maxRetries;

      if (isHealthy) stats.healthy++;
      else if (isRetrying) stats.retrying++;
      else if (isFailed) stats.failed++;

      (stats.connections as any)[id] = {
        retryCount,
        status: isHealthy ? "healthy" : isRetrying ? "retrying" : "failed",
      };
    }

    return stats;
  }

  // Force close connection
  forceCloseConnection(id: string): void {
    console.log(`🔥 Force closing connection ${id}`);
    this.cleanupConnection(id);
    this.emit("connection_force_closed", { id });
  }
}

// Singleton instance
export const stableConnectionManager = new StableConnectionManager({
  maxRetries: 2, // Reduce retries để tránh spam
  retryDelay: 3000, // 3 seconds delay
  healthCheckInterval: 60000, // 1 minute health check
  gracefulShutdown: true,
});

// Export utility functions
export function registerStableConnection(
  id: string,
  connection: any,
  healthCheck?: () => boolean,
): void {
  stableConnectionManager.registerConnection(id, connection, healthCheck);
}

export function isConnectionStable(id: string): boolean {
  return stableConnectionManager.isConnectionHealthy(id);
}

export function getSystemHealth(): any {
  return stableConnectionManager.getConnectionStats();
}
