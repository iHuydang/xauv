import crypto from 'crypto';

export interface TradingAccount {
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
  lastSync: Date;
  credentials?: {
    password?: string;
    investorPassword?: string;
  };
}

export class AccountManager {
  private accounts: Map<string, TradingAccount> = new Map();
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    this.initializeExnessAccounts();
  }

  private initializeExnessAccounts() {
    // Tài khoản #405691964 - Exness-MT5Real8
    const account1: TradingAccount = {
      id: 'exness-405691964',
      accountNumber: '405691964',
      server: 'Exness-MT5Real8',
      broker: 'Exness',
      accountType: 'real',
      balance: 0,
      equity: 0,
      margin: 0,
      freeMargin: 0,
      marginLevel: 0,
      currency: 'USD',
      leverage: 1000,
      isActive: true,
      isSecBotFree: true, // Không bị secbot
      lastSync: new Date(),
    };

    // Tài khoản #205251387 - Exness-MT5Real8
    const account2: TradingAccount = {
      id: 'exness-205251387',
      accountNumber: '205251387',
      server: 'Exness-MT5Real8',
      broker: 'Exness',
      accountType: 'real',
      balance: 0,
      equity: 0,
      margin: 0,
      freeMargin: 0,
      marginLevel: 0,
      currency: 'USD',
      leverage: 1000,
      isActive: true,
      isSecBotFree: true, // Không bị secbot
      lastSync: new Date(),
    };

    this.accounts.set(account1.id, account1);
    this.accounts.set(account2.id, account2);

    console.log('✅ Initialized Exness accounts:');
    console.log(`- Account #${account1.accountNumber} on ${account1.server}`);
    console.log(`- Account #${account2.accountNumber} on ${account2.server}`);
  }

  private encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(text: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async addAccount(account: TradingAccount, password?: string): Promise<boolean> {
    try {
      if (password) {
        account.credentials = {
          password: this.encrypt(password)
        };
      }

      this.accounts.set(account.id, account);
      console.log(`✅ Added account #${account.accountNumber} on ${account.server}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add account:', error);
      return false;
    }
  }

  async connectAccount(accountId: string, password: string, investorPassword?: string): Promise<boolean> {
    try {
      const account = this.accounts.get(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Mô phỏng kết nối MT5
      console.log(`🔗 Connecting to account #${account.accountNumber}...`);
      console.log(`📡 Server: ${account.server}`);
      console.log(`🏢 Broker: ${account.broker}`);

      // Lưu credentials (encrypted)
      account.credentials = {
        password: this.encrypt(password),
        investorPassword: investorPassword ? this.encrypt(investorPassword) : undefined
      };

      // Simulate successful connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update account data (simulated)
      account.balance = Math.random() * 10000 + 5000;
      account.equity = account.balance + (Math.random() * 1000 - 500);
      account.margin = Math.random() * 1000;
      account.freeMargin = account.equity - account.margin;
      account.marginLevel = account.margin > 0 ? (account.equity / account.margin) * 100 : 0;
      account.lastSync = new Date();
      account.isActive = true;

      this.accounts.set(accountId, account);

      console.log(`✅ Successfully connected to account #${account.accountNumber}`);
      console.log(`💰 Balance: $${account.balance.toFixed(2)}`);
      console.log(`📊 Equity: $${account.equity.toFixed(2)}`);

      return true;
    } catch (error) {
      console.error(`❌ Failed to connect account ${accountId}:`, error);
      return false;
    }
  }

  async syncAccountData(accountId: string): Promise<TradingAccount | null> {
    try {
      const account = this.accounts.get(accountId);
      if (!account || !account.isActive) {
        return null;
      }

      // Simulate data sync from MT5
      account.balance = Math.random() * 10000 + 5000;
      account.equity = account.balance + (Math.random() * 1000 - 500);
      account.margin = Math.random() * 1000;
      account.freeMargin = account.equity - account.margin;
      account.marginLevel = account.margin > 0 ? (account.equity / account.margin) * 100 : 0;
      account.lastSync = new Date();

      this.accounts.set(accountId, account);
      return account;
    } catch (error) {
      console.error(`❌ Failed to sync account ${accountId}:`, error);
      return null;
    }
  }

  getAccount(accountId: string): TradingAccount | undefined {
    return this.accounts.get(accountId);
  }

  getAllAccounts(): TradingAccount[] {
    return Array.from(this.accounts.values());
  }

  getActiveAccounts(): TradingAccount[] {
    return Array.from(this.accounts.values()).filter(account => account.isActive);
  }

  getSecBotFreeAccounts(): TradingAccount[] {
    return Array.from(this.accounts.values()).filter(account => account.isSecBotFree);
  }

  async checkMarketScanSafety(accountId: string): Promise<{safe: boolean, reason?: string}> {
    const account = this.accounts.get(accountId);
    if (!account) {
      return { safe: false, reason: 'Account not found' };
    }

    // Kiểm tra các tiêu chí an toàn
    const checks = {
      secBotFree: account.isSecBotFree,
      exnessServer: account.server.includes('Exness'),
      activeStatus: account.isActive,
      recentSync: (Date.now() - account.lastSync.getTime()) < 300000 // 5 minutes
    };

    const allSafe = Object.values(checks).every(check => check);

    return {
      safe: allSafe,
      reason: allSafe ? undefined : 'Account may not be safe for market scanning'
    };
  }

  // Hệ thống theo dõi tín hiệu quan trọng
  async enableHighImpactSignalTracking(accountId: string): Promise<boolean> {
    const account = this.accounts.get(accountId);
    if (!account || !account.isSecBotFree) {
      return false;
    }

    console.log(`🎯 Enabling high-impact signal tracking for account #${account.accountNumber}`);

    // Đăng ký theo dõi các tín hiệu FED
    this.setupFEDSignalTracking(accountId);

    // Đăng ký theo dõi BOT EA của các quỹ lớn
    this.setupInstitutionalBotTracking(accountId);

    // Đăng ký theo dõi broker signals
    this.setupBrokerSignalTracking(accountId);

    return true;
  }

  private setupFEDSignalTracking(accountId: string) {
    console.log(`📊 Setting up FED signal tracking for account ${accountId}`);
    // Theo dõi các sự kiện FED quan trọng
    const fedEvents = [
      'FOMC_MEETING',
      'INTEREST_RATE_DECISION',
      'POWELL_SPEECH',
      'NFP_RELEASE',
      'CPI_DATA',
      'PCE_DATA'
    ];

    // Simulate FED signal monitoring
    setInterval(() => {
      this.processFEDSignal(accountId, {
        type: 'INTEREST_RATE_DECISION',
        impact: 'very_high',
        direction: Math.random() > 0.5 ? 'hawkish' : 'dovish',
        timestamp: new Date()
      });
    }, 300000); // Check every 5 minutes
  }

  private setupInstitutionalBotTracking(accountId: string) {
    console.log(`🏦 Setting up institutional bot tracking for account ${accountId}`);
    // Theo dõi BOT EA của các quỹ lớn
    const institutions = [
      'GOLDMAN_SACHS_BOT',
      'JP_MORGAN_EA',
      'CITADEL_ALGORITHM',
      'BRIDGEWATER_BOT',
      'RENAISSANCE_TECH',
      'TWO_SIGMA_EA'
    ];

    // Simulate institutional bot signal monitoring
    setInterval(() => {
      this.processInstitutionalSignal(accountId, {
        source: institutions[Math.floor(Math.random() * institutions.length)],
        action: Math.random() > 0.5 ? 'buy' : 'sell',
        symbol: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'][Math.floor(Math.random() * 4)],
        volume: Math.random() * 1000000 + 100000, // 100K - 1M
        confidence: Math.random() * 100,
        timestamp: new Date()
      });
    }, 180000); // Check every 3 minutes
  }

  private setupBrokerSignalTracking(accountId: string) {
    console.log(`🔄 Setting up broker signal tracking for account ${accountId}`);
    // Theo dõi tín hiệu từ các broker lớn
    const brokers = [
      'EXNESS_INSTITUTIONAL',
      'IC_MARKETS_PRIME',
      'PEPPERSTONE_RAZOR',
      'FP_MARKETS_PRO',
      'XM_ULTRA_LOW',
      'OANDA_PREMIUM'
    ];

    // Simulate broker signal monitoring
    setInterval(() => {
      this.processBrokerSignal(accountId, {
        broker: brokers[Math.floor(Math.random() * brokers.length)],
        signalType: 'market_making_flow',
        direction: Math.random() > 0.5 ? 'long' : 'short',
        strength: Math.random() * 10,
        symbols: ['EURUSD', 'GBPUSD', 'USDJPY'],
        timestamp: new Date()
      });
    }, 120000); // Check every 2 minutes
  }

  private async processFEDSignal(accountId: string, signal: any) {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`🏛️ Processing FED signal for account #${account.accountNumber}:`, signal);

    // Auto-execute orders based on FED signals
    if (signal.impact === 'very_high') {
      await this.executeHighImpactOrder(accountId, {
        type: 'fed_signal',
        signal,
        symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD'],
        action: signal.direction === 'hawkish' ? 'buy_usd' : 'sell_usd'
      });
    }
  }

  private async processInstitutionalSignal(accountId: string, signal: any) {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`🏦 Processing institutional signal for account #${account.accountNumber}:`, signal);

    // Follow institutional money flow
    if (signal.confidence > 75 && signal.volume > 500000) {
      await this.executeHighImpactOrder(accountId, {
        type: 'institutional_flow',
        signal,
        symbols: [signal.symbol],
        action: signal.action
      });
    }
  }

  private async processBrokerSignal(accountId: string, signal: any) {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`🔄 Processing broker signal for account #${account.accountNumber}:`, signal);

    // React to broker market making flow
    if (signal.strength > 7) {
      await this.executeHighImpactOrder(accountId, {
        type: 'broker_flow',
        signal,
        symbols: signal.symbols,
        action: signal.direction === 'long' ? 'buy' : 'sell'
      });
    }
  }

  private async executeHighImpactOrder(accountId: string, orderData: any) {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`⚡ Executing high-impact order for account #${account.accountNumber}:`);
    console.log(`📊 Type: ${orderData.type}`);
    console.log(`🎯 Action: ${orderData.action}`);
    console.log(`💱 Symbols: ${orderData.symbols.join(', ')}`);
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);

    // Simulate order execution
    const orderResult = {
      orderId: `${accountId}_${Date.now()}`,
      status: 'executed',
      executionTime: Date.now(),
      slippage: Math.random() * 0.0002, // 0-2 pips slippage
      spread: Math.random() * 0.0001 + 0.0001 // 1-2 pips spread
    };

    console.log(`✅ Order executed successfully:`, orderResult);
    return orderResult;
  }

  // Khởi tạo hệ thống theo dõi cho cả 2 tài khoản
  async initializeSignalTracking() {
    console.log('🚀 Initializing signal tracking for Exness accounts...');

    for (const [accountId, account] of this.accounts) {
      if (account.isSecBotFree && account.server.includes('Exness')) {
        await this.enableHighImpactSignalTracking(accountId);
        console.log(`✅ Signal tracking enabled for account #${account.accountNumber}`);
      }
    }

    console.log('🎯 All accounts are now tracking high-impact signals!');
  }

  private isSecBotRequest(req: any): boolean {
    const userAgent = req.get('User-Agent') || '';
    const path = req.path || '';
    const referer = req.get('Referer') || '';

    const secBotPatterns = [
      /secbot/i,
      /security.?scanner/i,
      /vulnerability.?scanner/i,
      /security.?audit/i,
      /exness.?security/i,
      /mt5.?scanner/i,
      /trading.?scanner/i,
      /github\.com\/exness\/security-bot/i,
      /crawler/i,
      /spider/i,
      /scan/i,
      /penetration/i,
      /exploit/i
    ];

    const suspiciousPaths = [
      '/api/trading-accounts',
      '/api/broker-accounts', 
      '/admin',
      '/security',
      '/scan',
      '/.env',
      '/config',
      '/credentials'
    ];

    const suspiciousReferers = [
      /github\.com\/exness/i,
      /security-bot/i,
      /scanner/i
    ];

    return secBotPatterns.some(pattern => pattern.test(userAgent)) ||
           suspiciousPaths.some(suspPath => path.includes(suspPath)) ||
           suspiciousReferers.some(pattern => pattern.test(referer));
  }
}

export const accountManager = new AccountManager();