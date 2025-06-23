
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
}

export const accountManager = new AccountManager();
