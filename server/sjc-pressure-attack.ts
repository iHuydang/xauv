import { EventEmitter } from 'events';
import { liquidityScanner } from './liquidity-scanner.js';

export interface AttackVector {
  name: string;
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  duration: number; // seconds
  targetSpread: number;
  volumeMultiplier: number;
  frequency: number; // requests per second
  successRate: number;
}

export interface AttackResult {
  attackId: string;
  startTime: Date;
  endTime?: Date;
  status: 'PREPARING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  vectorsUsed: string[];
  damageInflicted: {
    spreadReduction: number;
    liquidityDrained: number;
    marketShare: number;
  };
  sjcResponse: {
    priceAdjustments: number;
    liquidityBoosts: number;
    defenseActivated: boolean;
  };
}

export class SJCPressureAttack extends EventEmitter {
  private activeAttacks: Map<string, AttackResult> = new Map();
  private attackVectors: Map<string, AttackVector> = new Map();
  private isSystemReady: boolean = false;

  constructor() {
    super();
    this.initializeAttackVectors();
    this.setupLiquidityMonitoring();
  }

  private initializeAttackVectors(): void {
    // Vector 1: High-Frequency Spread Pressure
    this.attackVectors.set('HF_SPREAD_PRESSURE', {
      name: 'High-Frequency Spread Pressure',
      intensity: 'HIGH',
      duration: 300, // 5 minutes
      targetSpread: 25000,
      volumeMultiplier: 2.5,
      frequency: 10,
      successRate: 0.85
    });

    // Vector 2: Liquidity Drainage Attack
    this.attackVectors.set('LIQUIDITY_DRAIN', {
      name: 'Liquidity Drainage Attack',
      intensity: 'EXTREME',
      duration: 180, // 3 minutes
      targetSpread: 35000,
      volumeMultiplier: 4.0,
      frequency: 15,
      successRate: 0.78
    });

    // Vector 3: Premium Exploitation
    this.attackVectors.set('PREMIUM_EXPLOIT', {
      name: 'Premium Exploitation',
      intensity: 'MEDIUM',
      duration: 600, // 10 minutes
      targetSpread: 40000,
      volumeMultiplier: 1.8,
      frequency: 5,
      successRate: 0.92
    });

    // Vector 4: Coordinated Multi-Source Attack
    this.attackVectors.set('MULTI_SOURCE_COORD', {
      name: 'Coordinated Multi-Source Attack',
      intensity: 'EXTREME',
      duration: 240, // 4 minutes
      targetSpread: 20000,
      volumeMultiplier: 3.2,
      frequency: 12,
      successRate: 0.88
    });

    // Vector 5: Stealth Micro-Pressure
    this.attackVectors.set('STEALTH_MICRO', {
      name: 'Stealth Micro-Pressure',
      intensity: 'LOW',
      duration: 1800, // 30 minutes
      targetSpread: 45000,
      volumeMultiplier: 1.2,
      frequency: 2,
      successRate: 0.95
    });

    console.log(`✅ Initialized ${this.attackVectors.size} attack vectors`);
  }

  private setupLiquidityMonitoring(): void {
    liquidityScanner.on('sjcAttackOpportunity', (opportunity) => {
      this.evaluateAutoAttack(opportunity);
    });

    liquidityScanner.on('liquidityUpdate', (data) => {
      if (data.source === 'SJC') {
        this.analyzeSJCVulnerabilities(data);
      }
    });
  }

  private evaluateAutoAttack(opportunity: any): void {
    const { vulnerabilities, attackIntensity, targetSpread } = opportunity;
    
    console.log('🎯 Evaluating auto-attack opportunity...');
    console.log(`⚔️ Attack Intensity: ${attackIntensity}`);
    console.log(`🎯 Target Spread: ${targetSpread.toLocaleString()} VND`);
    
    if (attackIntensity === 'CỰC MẠNH' || attackIntensity === 'MẠNH') {
      const vectorName = this.selectOptimalVector(vulnerabilities, targetSpread);
      if (vectorName) {
        this.executeAttack(vectorName, { autoTriggered: true });
      }
    }
  }

  private selectOptimalVector(vulnerabilities: string[], targetSpread: number): string | null {
    let bestVector: string | null = null;
    let bestScore = 0;

    this.attackVectors.forEach((vector, name) => {
      let score = vector.successRate * 100;

      // Bonus for matching conditions
      if (vulnerabilities.includes('SPREAD_CAO') && vector.targetSpread <= targetSpread) {
        score += 20;
      }
      
      if (vulnerabilities.includes('THANH_KHOẢN_THẤP') && vector.intensity === 'EXTREME') {
        score += 15;
      }
      
      if (vulnerabilities.includes('PREMIUM_CAO') && name === 'PREMIUM_EXPLOIT') {
        score += 25;
      }

      // Time bonus during market hours
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 9 && hour <= 15) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVector = name;
      }
    });

    console.log(`🎯 Selected optimal vector: ${bestVector} (score: ${bestScore})`);
    return bestVector;
  }

  async executeAttack(vectorName: string, options: { autoTriggered?: boolean } = {}): Promise<string> {
    const vector = this.attackVectors.get(vectorName);
    if (!vector) {
      throw new Error(`Attack vector ${vectorName} not found`);
    }

    const attackId = `ATTACK_${Date.now()}_${vectorName}`;
    const attackResult: AttackResult = {
      attackId,
      startTime: new Date(),
      status: 'PREPARING',
      vectorsUsed: [vectorName],
      damageInflicted: {
        spreadReduction: 0,
        liquidityDrained: 0,
        marketShare: 0
      },
      sjcResponse: {
        priceAdjustments: 0,
        liquidityBoosts: 0,
        defenseActivated: false
      }
    };

    this.activeAttacks.set(attackId, attackResult);

    console.log(`🚨 INITIATING SJC PRESSURE ATTACK`);
    console.log(`⚔️ Vector: ${vector.name}`);
    console.log(`🔥 Intensity: ${vector.intensity}`);
    console.log(`⏱️ Duration: ${vector.duration}s`);
    console.log(`🎯 Target Spread: ${vector.targetSpread.toLocaleString()} VND`);

    try {
      // Phase 1: Reconnaissance
      await this.executeReconnaissance(attackId);
      
      // Phase 2: Initial Pressure
      await this.executeInitialPressure(attackId, vector);
      
      // Phase 3: Main Attack
      await this.executeMainAttack(attackId, vector);
      
      // Phase 4: Damage Assessment
      await this.executeDamageAssessment(attackId);

      attackResult.status = 'COMPLETED';
      attackResult.endTime = new Date();
      
      console.log(`✅ Attack ${attackId} completed successfully`);
      this.emit('attackCompleted', attackResult);
      
      return attackId;

    } catch (error) {
      attackResult.status = 'FAILED';
      attackResult.endTime = new Date();
      console.error(`❌ Attack ${attackId} failed:`, error);
      this.emit('attackFailed', { attackId, error });
      throw error;
    }
  }

  private async executeReconnaissance(attackId: string): Promise<void> {
    console.log(`🔍 Phase 1: Reconnaissance for ${attackId}`);
    
    // Scan current SJC status
    const sjcData = await liquidityScanner.scanTarget('SJC');
    if (sjcData) {
      console.log(`📊 SJC Current Spread: ${sjcData.spread.toLocaleString()} VND`);
      console.log(`💰 SJC Buy Price: ${sjcData.buyPrice.toLocaleString()} VND`);
      console.log(`🎯 Liquidity Level: ${sjcData.liquidityLevel.toUpperCase()}`);
    }

    // Wait for market stabilization
    await this.delay(2000);
  }

  private async executeInitialPressure(attackId: string, vector: AttackVector): Promise<void> {
    console.log(`💥 Phase 2: Initial Pressure for ${attackId}`);
    
    const attack = this.activeAttacks.get(attackId)!;
    attack.status = 'ACTIVE';
    
    // Simulate initial pressure waves
    const pressureWaves = Math.floor(vector.frequency / 2);
    
    for (let i = 0; i < pressureWaves; i++) {
      console.log(`⚡ Pressure wave ${i + 1}/${pressureWaves}`);
      
      // Simulate market impact
      const impactRadius = Math.random() * 15000 + 5000;
      attack.damageInflicted.spreadReduction += impactRadius * 0.1;
      
      await this.delay(1000 / vector.frequency * 1000);
    }
    
    console.log(`📈 Initial damage: ${attack.damageInflicted.spreadReduction.toFixed(0)} VND spread reduction`);
  }

  private async executeMainAttack(attackId: string, vector: AttackVector): Promise<void> {
    console.log(`🔥 Phase 3: Main Attack for ${attackId}`);
    
    const attack = this.activeAttacks.get(attackId)!;
    const attackDuration = vector.duration * 1000; // Convert to milliseconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < attackDuration) {
      // Simulate high-frequency attacks
      const damage = this.calculateAttackDamage(vector);
      attack.damageInflicted.spreadReduction += damage.spreadReduction;
      attack.damageInflicted.liquidityDrained += damage.liquidityDrained;
      attack.damageInflicted.marketShare += damage.marketShare;
      
      // Check for SJC defensive responses
      if (Math.random() < 0.3) {
        attack.sjcResponse.defenseActivated = true;
        attack.sjcResponse.priceAdjustments += 1;
        console.log(`🛡️ SJC defense activated - price adjustment detected`);
      }
      
      // Progress update every 10 seconds
      if ((Date.now() - startTime) % 10000 < 1000) {
        const progress = ((Date.now() - startTime) / attackDuration * 100).toFixed(1);
        console.log(`⚔️ Attack progress: ${progress}% - Damage: ${attack.damageInflicted.spreadReduction.toFixed(0)} VND`);
      }
      
      await this.delay(1000 / vector.frequency * 1000);
    }
  }

  private calculateAttackDamage(vector: AttackVector): any {
    const baseSpreadReduction = vector.targetSpread * 0.05 * vector.volumeMultiplier;
    const volatility = Math.random() * 0.5 + 0.75; // 0.75 - 1.25 multiplier
    
    return {
      spreadReduction: baseSpreadReduction * volatility * vector.successRate,
      liquidityDrained: vector.volumeMultiplier * 2.5 * volatility,
      marketShare: vector.intensity === 'EXTREME' ? 0.8 : 0.4
    };
  }

  private async executeDamageAssessment(attackId: string): Promise<void> {
    console.log(`📊 Phase 4: Damage Assessment for ${attackId}`);
    
    const attack = this.activeAttacks.get(attackId)!;
    
    // Final scan to assess impact
    const postAttackData = await liquidityScanner.scanTarget('SJC');
    
    if (postAttackData) {
      console.log('🎯 ATTACK RESULTS:');
      console.log(`📉 Total Spread Reduction: ${attack.damageInflicted.spreadReduction.toFixed(0)} VND`);
      console.log(`💧 Liquidity Drained: ${attack.damageInflicted.liquidityDrained.toFixed(1)}%`);
      console.log(`📊 Market Share Impact: ${attack.damageInflicted.marketShare.toFixed(1)}%`);
      console.log(`🛡️ SJC Defense Responses: ${attack.sjcResponse.priceAdjustments}`);
      console.log(`📊 Final SJC Spread: ${postAttackData.spread.toLocaleString()} VND`);
    }
  }

  private analyzeSJCVulnerabilities(sjcData: any): void {
    const spreadRatio = sjcData.spread / sjcData.buyPrice;
    
    if (spreadRatio > 0.015) {
      console.log(`⚠️ SJC vulnerability detected: High spread ratio ${(spreadRatio * 100).toFixed(2)}%`);
      this.emit('vulnerabilityDetected', {
        type: 'HIGH_SPREAD',
        severity: spreadRatio > 0.02 ? 'CRITICAL' : 'HIGH',
        data: sjcData
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getActiveAttacks(): AttackResult[] {
    return Array.from(this.activeAttacks.values());
  }

  getAttackVectors(): AttackVector[] {
    return Array.from(this.attackVectors.values());
  }

  stopAttack(attackId: string): boolean {
    const attack = this.activeAttacks.get(attackId);
    if (attack && attack.status === 'ACTIVE') {
      attack.status = 'COMPLETED';
      attack.endTime = new Date();
      console.log(`⏹️ Attack ${attackId} stopped manually`);
      return true;
    }
    return false;
  }
}

export const sjcPressureAttack = new SJCPressureAttack();