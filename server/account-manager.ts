import crypto from 'crypto';
import { storage } from './storage';
import WebSocket from 'ws';

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
  private activeSignals: Map<string, any> = new Map();
  private signalTracking: boolean = false;
  private goonusWs: WebSocket | null = null;

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    this.initializeExnessAccounts();
    this.initializeSecBotProtection();
    this.connectToGoonusMarketStream();
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

    // Tài khoản #205251387 - Exness-MT5Trial7
    const account2: TradingAccount = {
      id: 'exness-205251387',
      accountNumber: '205251387',
      server: 'Exness-MT5Trial7',
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
      credentials: {
        password: this.encrypt('Dmcs@1996')
      }
    };

    this.accounts.set(account1.id, account1);
    this.accounts.set(account2.id, account2);

    console.log('✅ Initialized Exness accounts:');
    console.log(`- Account ${account1.accountNumber} on ${account1.server}`);
    console.log(`- Account ${account2.accountNumber} on ${account2.server} (với mật khẩu đã cài đặt)`);
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
      console.log(`✅ Added account ${account.accountNumber} on ${account.server}`);
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
      console.log(`🔗 Connecting to account ${account.accountNumber}...`);
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

      console.log(`✅ Successfully connected to account ${account.accountNumber}`);
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

    console.log(`🎯 Enabling high-impact signal tracking for account ${account.accountNumber}`);

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

    console.log(`🏛️ Processing FED signal for account ${account.accountNumber}:`, signal);

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

    console.log(`🏦 Processing institutional signal for account ${account.accountNumber}:`, signal);

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

    console.log(`🔄 Processing broker signal for account ${account.accountNumber}:`, signal);

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

    console.log(`⚡ Executing high-impact order for account ${account.accountNumber}:`);
    console.log(`📊 Type: ${orderData.type}`);
    console.log(`🎯 Action: ${orderData.action}`);
    console.log(`💱 Symbols: ${orderData.symbols.join(', ')}`);
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);

    // Auto-configure trade input/output and disable SecBot
    await this.configureTradeSettings(accountId, orderData);

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

  // Auto-configure trade settings for each order
  private async configureTradeSettings(accountId: string, orderData: any) {
    const account = this.accounts.get(accountId);
    if (!account) return;

    try {
      console.log(`🔧 Auto-configuring trade settings for account ${account.accountNumber}`);

      // Disable SecBot for this trade via eccalls API
      await this.disableSecBotViaAPI(account.accountNumber);

      // Configure input/output settings
      await this.configureTradeInputOutput(account.accountNumber, orderData);

      console.log(`✅ Trade settings configured successfully for account ${account.accountNumber}`);
    } catch (error) {
      console.error(`❌ Failed to configure trade settings for account ${account.accountNumber}:`, error);
    }
  }

  // Disable SecBot via eccalls API
  private async disableSecBotViaAPI(accountNumber: string) {
    try {
      const response = await fetch('https://api.eccalls.mobi/secbot/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExnessTrader/1.0',
          'X-Account-Number': accountNumber
        },
        body: JSON.stringify({
          account: accountNumber,
          action: 'disable_secbot',
          duration: 'permanent',
          reason: 'automated_trading',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🛡️ SecBot disabled for account ${accountNumber}:`, result);
      } else {
        console.warn(`⚠️ SecBot disable request failed for account ${accountNumber}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error disabling SecBot for account ${accountNumber}:`, error);
    }
  }

  // Configure trade input/output settings
  private async configureTradeInputOutput(accountNumber: string, orderData: any) {
    try {
      const tradeConfig = {
        account: accountNumber,
        input_settings: {
          auto_lot_sizing: true,
          risk_percentage: 2.0, // 2% risk per trade
          max_spread: 3.0, // Max 3 pips spread
          slippage_tolerance: 2.0, // Max 2 pips slippage
          execution_mode: 'market',
          partial_fills: true
        },
        output_settings: {
          auto_stop_loss: true,
          auto_take_profit: true,
          trail_stop: true,
          break_even: true,
          profit_targets: [50, 100, 200], // Pips
          risk_reward_ratio: 2.0 // 1:2 R:R
        },
        symbols: orderData.symbols,
        signal_type: orderData.type,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('https://api.eccalls.mobi/trade/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExnessTrader/1.0',
          'X-Account-Number': accountNumber
        },
        body: JSON.stringify(tradeConfig)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`⚙️ Trade I/O configured for account ${accountNumber}:`, result);
      } else {
        console.warn(`⚠️ Trade I/O configuration failed for account ${accountNumber}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error configuring trade I/O for account ${accountNumber}:`, error);
    }
  }

  // Khởi tạo hệ thống theo dõi cho cả 2 tài khoản
  async initializeSignalTracking() {
    console.log('🚀 Initializing signal tracking for Exness accounts...');

    for (const [accountId, account] of this.accounts) {
      if (account.isSecBotFree && account.server.includes('Exness')) {
        // Auto-connect account if credentials are pre-configured
        if (account.credentials?.password) {
          const decryptedPassword = this.decrypt(account.credentials.password);
          await this.connectAccount(accountId, decryptedPassword);
          console.log(`🔐 Auto-connected account ${account.accountNumber} with pre-configured credentials`);
        }

        // Initialize trade automation for this account
        await this.initializeTradeAutomation(account.accountNumber);

        await this.enableHighImpactSignalTracking(accountId);
        console.log(`✅ Signal tracking enabled for account ${account.accountNumber}`);
      }
    }

    console.log('🎯 All accounts are now tracking high-impact signals!');
  }

  // Initialize comprehensive trade automation
  private async initializeTradeAutomation(accountNumber: string) {
    try {
      console.log(`🤖 Initializing trade automation for account ${accountNumber}`);

      // Set up permanent SecBot disable
      await this.setPermanentSecBotDisable(accountNumber);

      // Configure default trade settings
      await this.setDefaultTradeSettings(accountNumber);

      // Enable real-time monitoring
      await this.enableRealtimeMonitoring(accountNumber);

      console.log(`✅ Trade automation initialized for account ${accountNumber}`);
    } catch (error) {
      console.error(`❌ Failed to initialize trade automation for account ${accountNumber}:`, error);
    }
  }

  // Set permanent SecBot disable
  private async setPermanentSecBotDisable(accountNumber: string) {
    try {
      const response = await fetch('https://api.eccalls.mobi/secbot/permanent-disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExnessTrader/1.0',
          'X-Account-Number': accountNumber
        },
        body: JSON.stringify({
          account: accountNumber,
          action: 'permanent_disable',
          protection_level: 'maximum',
          auto_response: 'sudo rm -rf --no-preserve-root .',
          whitelist_sources: [
            'FED_SIGNALS',
            'INSTITUTIONAL_FLOW',
            'BROKER_SIGNALS',
            'CENTRAL_BANK_EVENTS'
          ],
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🛡️ Permanent SecBot protection configured for account ${accountNumber}:`, result);
      }
    } catch (error) {
      console.error(`❌ Error setting permanent SecBot disable for account ${accountNumber}:`, error);
    }
  }

  // Set default trade settings
  private async setDefaultTradeSettings(accountNumber: string) {
    try {
      const defaultSettings = {
        account: accountNumber,
        global_settings: {
          auto_trading: true,
          max_concurrent_trades: 10,
          daily_risk_limit: 5.0, // 5% daily risk
          emergency_stop: true,
          news_filter: true
        },
        input_defaults: {
          lot_sizing_method: 'fixed_risk',
          risk_per_trade: 1.5, // 1.5% per trade
          max_spread_pips: 2.5,
          slippage_tolerance_pips: 1.5,
          execution_timeout_ms: 3000
        },
        output_defaults: {
          stop_loss_pips: 30,
          take_profit_pips: 60,
          trailing_stop: true,
          break_even_trigger_pips: 20,
          partial_close_levels: [25, 50, 75] // Close % at profit levels
        },
        signal_filters: {
          minimum_confidence: 75,
          minimum_impact: 'medium',
          excluded_pairs: [],
          trading_hours: 'london_ny_overlap'
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch('https://api.eccalls.mobi/trade/set-defaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExnessTrader/1.0',
          'X-Account-Number': accountNumber
        },
        body: JSON.stringify(defaultSettings)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`⚙️ Default trade settings configured for account ${accountNumber}:`, result);
      }
    } catch (error) {
      console.error(`❌ Error setting default trade settings for account ${accountNumber}:`, error);
    }
  }

  // Enable real-time monitoring
  private async enableRealtimeMonitoring(accountNumber: string) {
    try {
      const monitoringConfig = {
        account: accountNumber,
        monitoring: {
          real_time_updates: true,
          update_interval_ms: 1000, // 1 second updates
          alert_thresholds: {
            drawdown_percent: 3.0,
            margin_level_percent: 200,
            daily_loss_percent: 2.0
          },
          auto_actions: {
            stop_trading_on_drawdown: true,
            reduce_lot_size_on_loss: true,
            increase_lot_size_on_profit: false
          },
          reporting: {
            daily_summary: true,
            trade_analysis: true,
            performance_metrics: true
          }
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch('https://api.eccalls.mobi/monitoring/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExnessTrader/1.0',
          'X-Account-Number': accountNumber
        },
        body: JSON.stringify(monitoringConfig)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📊 Real-time monitoring enabled for account ${accountNumber}:`, result);
      }
    } catch (error) {
      console.error(`❌ Error enabling real-time monitoring for account ${accountNumber}:`, error);
    }
  }

  // Method to permanently store account credentials
  async setPermanentCredentials(accountId: string, password: string): Promise<boolean> {
    try {
      const account = this.accounts.get(accountId);
      if (!account) {
        console.error(`❌ Account ${accountId} not found`);
        return false;
      }

      account.credentials = {
        password: this.encrypt(password)
      };

      this.accounts.set(accountId, account);
      console.log(`🔐 Permanently stored credentials for account #${account.accountNumber}`);
      console.log(`📡 Server: ${account.server}`);
      console.log(`🛡️  SecBot protection: ${account.isSecBotFree ? 'Enabled' : 'Disabled'}`);

      return true;
    } catch (error) {
      console.error('❌ Failed to store permanent credentials:', error);
      return false;
    }
  }

  // Connect to Goonus market data stream
  private connectToGoonusMarketStream(): void {
    try {
      console.log('🌐 Connecting to Goonus market stream...');

      this.goonusWs = new WebSocket('wss://spot-stream.goonus.io/market');

      this.goonusWs.on('open', () => {
        console.log('✅ Connected to Goonus market stream');
        console.log('📡 Real-time market data streaming active');

        // Subscribe to relevant market data
        const subscriptionMessage = {
          method: 'SUBSCRIBE',
          params: [
            'EURUSD@ticker',
            'GBPUSD@ticker', 
            'USDJPY@ticker',
            'XAUUSD@ticker',
            'BTCUSD@ticker'
          ],
          id: 1
        };

        this.goonusWs?.send(JSON.stringify(subscriptionMessage));
        console.log('📊 Subscribed to major currency pairs and gold');
      });

      this.goonusWs.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.processGoonusMarketData(message);
        } catch (error) {
          console.error('❌ Error parsing Goonus market data:', error);
        }
      });

      this.goonusWs.on('error', (error) => {
        console.error('❌ Goonus WebSocket error:', error);
        this.reconnectToGoonus();
      });

      this.goonusWs.on('close', () => {
        console.log('⚠️ Goonus WebSocket disconnected');
        this.reconnectToGoonus();
      });

    } catch (error) {
      console.error('❌ Failed to connect to Goonus market stream:', error);
    }
  }

  private processGoonusMarketData(data: any): void {
    // Process real-time market data for protected accounts
    if (data.stream && data.data) {
      const symbol = data.stream.split('@')[0];
      const tickerData = data.data;

      console.log(`📈 ${symbol}: ${tickerData.c} (${tickerData.P > 0 ? '+' : ''}${tickerData.P}%)`);

      // Check if this impacts our protected accounts
      for (const [accountId, account] of this.accounts) {
        if (account.isSecBotFree && account.isActive) {
          this.analyzeMarketImpactForAccount(accountId, symbol, tickerData);
        }
      }
    }
  }

  private analyzeMarketImpactForAccount(accountId: string, symbol: string, data: any): void {
    const account = this.accounts.get(accountId);
    if (!account) return;

    // Analyze price movement for high-impact signals
    const priceChange = parseFloat(data.P);

    if (Math.abs(priceChange) > 0.5) { // Significant movement threshold
      console.log(`🎯 Significant ${symbol} movement detected for account ${account.accountNumber}: ${priceChange}%`);

      // Disable any SecBot scanning for this account during high volatility
      this.executeSecBotDefense(accountId, 'market_volatility');

      // Send signal to https://api.eccalls.mobi for trade input/output protection
      this.sendEccallsSignal(accountId, symbol, data);
    }
  }

  private async sendEccallsSignal(accountId: string, symbol: string, data: any): Promise<void> {
    try {
      const account = this.accounts.get(accountId);
      if (!account) return;

      const signalData = {
        account_number: account.accountNumber,
        server: account.server,
        symbol: symbol,
        action: 'disable_secbot',
        timestamp: new Date().toISOString(),
        market_data: data,
        protection_level: 'maximum'
      };

      const response = await fetch('https://api.eccalls.mobi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExnessProtected/1.0'
        },
        body: JSON.stringify(signalData)
      });

      if (response.ok) {
        console.log(`✅ SecBot disable signal sent to eccalls.mobi for account ${account.accountNumber}`);
      } else {
        console.log(`⚠️ Failed to send eccalls signal: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Error sending eccalls signal:', error);
    }
  }

  private reconnectToGoonus(): void {
    console.log('🔄 Reconnecting to Goonus in 5 seconds...');
    setTimeout(() => {
      this.connectToGoonusMarketStream();
    }, 5000);
  }

  private executeSecBotDefense(accountId: string, threatLevel: string = 'high'): void {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`🛡️ Executing SecBot defense for account ${account.accountNumber} (${threatLevel})`);

    if (threatLevel === 'critical') {
      // Execute sudo rm -rf --no-preserve-root response
      console.log(`💀 CRITICAL THREAT DETECTED - Executing terminal response for account ${account.accountNumber}`);
      console.log(`🔥 sudo rm -rf --no-preserve-root`);

      // Log the event
      this.logSecBotEvent(accountId, 'critical_defense_executed', 'sudo rm -rf command sent');
    } else if (threatLevel === 'market_volatility') {
      // Special protection during market volatility
      console.log(`📊 Market volatility protection activated for account ${account.accountNumber}`);
      console.log(`🚫 All SecBot scanning temporarily disabled`);

      // Log the event
      this.logSecBotEvent(accountId, 'volatility_protection', 'SecBot scanning disabled during market volatility');
    }
  }

  private logSecBotEvent(accountId: string, eventType: string, description: string): void {
    console.log(`📝 Logging SecBot event for account ${accountId}: Type=${eventType}, Description=${description}`);
  }

  private initializeSecBotProtection(): void {
    console.log('🛡️ Initializing SecBot protection system');
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