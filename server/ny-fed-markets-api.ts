/**
 * New York Fed Markets API Integration
 * Tích hợp API thị trường của Fed New York
 * Agency Mortgage-Backed Securities (AMBS) Operations
 */

import { Router } from "express";
import axios, { AxiosInstance } from "axios";
import { EventEmitter } from "events";

// NY Fed Markets API Interfaces
interface AMBSOperation {
  operationId: string;
  operationType: string;
  operationDate: string;
  settlementDate: string;
  maturityDate?: string;
  securityType: string;
  operationAmount: number;
  acceptedAmount?: number;
  submittedAmount?: number;
  results?: AMBSResult[];
}

interface AMBSResult {
  dealerId: string;
  dealerName: string;
  submittedAmount: number;
  acceptedAmount: number;
  rate?: number;
  spread?: number;
}

interface AMBSSchedule {
  scheduleId: string;
  scheduleDate: string;
  operations: AMBSOperationSchedule[];
}

interface AMBSOperationSchedule {
  operationType: string;
  operationDate: string;
  settlementDate: string;
  targetAmount: number;
  securityTypes: string[];
}

interface TreasuryOperation {
  operationId: string;
  operationType: string;
  auctionDate: string;
  issueDate: string;
  maturityDate: string;
  securityTerm: string;
  securityType: string;
  announcedAmount: number;
  acceptedAmount: number;
  highYield?: number;
  lowYield?: number;
  medianYield?: number;
}

interface RepoOperation {
  operationId: string;
  operationType: string; // "Repo" | "Reverse Repo"
  operationDate: string;
  settlementDate: string;
  maturityDate: string;
  term: number;
  acceptedAmount: number;
  submittedAmount: number;
  rate: number;
  numberOfCounterparties: number;
}

export class NYFedMarketsAPI extends EventEmitter {
  private apiBase: string;
  private betaApiBase: string;
  private axiosInstance: AxiosInstance;
  private axiosBetaInstance: AxiosInstance;
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.apiBase = "https://markets.newyorkfed.org/api";
    this.betaApiBase = "https://markets.newyorkfed.org/beta/api";

    // Setup axios instances
    this.axiosInstance = axios.create({
      baseURL: this.apiBase,
      timeout: 30000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Fed-Integration-System/1.0"
      }
    });

    this.axiosBetaInstance = axios.create({
      baseURL: this.betaApiBase,
      timeout: 30000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Fed-Integration-System/1.0"
      }
    });

    console.log("🏛️ NY Fed Markets API Integration Initialized");
  }

  // ========== AMBS Operations ==========

  /**
   * Get all AMBS operation results
   */
  async getAMBSOperationResults(useBeta: boolean = false): Promise<AMBSOperation[]> {
    try {
      const client = useBeta ? this.axiosBetaInstance : this.axiosInstance;
      const response = await client.get("/ambs/all/results");
      
      console.log(`✅ Retrieved ${response.data.length} AMBS operations`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching AMBS operations:", error);
      throw error;
    }
  }

  /**
   * Get AMBS operations for a specific date range
   */
  async getAMBSOperationsByDateRange(
    startDate: string,
    endDate: string,
    useBeta: boolean = false
  ): Promise<AMBSOperation[]> {
    try {
      const client = useBeta ? this.axiosBetaInstance : this.axiosInstance;
      const response = await client.get("/ambs/results/search", {
        params: {
          startDate,
          endDate
        }
      });

      console.log(`✅ Retrieved ${response.data.length} AMBS operations for date range ${startDate} to ${endDate}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching AMBS operations by date range:", error);
      throw error;
    }
  }

  /**
   * Get latest AMBS operation
   */
  async getLatestAMBSOperation(useBeta: boolean = false): Promise<AMBSOperation | null> {
    try {
      const client = useBeta ? this.axiosBetaInstance : this.axiosInstance;
      const response = await client.get("/ambs/latest");
      
      if (response.data) {
        console.log(`✅ Retrieved latest AMBS operation: ${response.data.operationId}`);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("❌ Error fetching latest AMBS operation:", error);
      throw error;
    }
  }

  /**
   * Get AMBS operation schedule
   */
  async getAMBSSchedule(useBeta: boolean = false): Promise<AMBSSchedule[]> {
    try {
      const client = useBeta ? this.axiosBetaInstance : this.axiosInstance;
      const response = await client.get("/ambs/schedule");
      
      console.log(`✅ Retrieved AMBS schedule with ${response.data.length} entries`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching AMBS schedule:", error);
      throw error;
    }
  }

  // ========== Treasury Operations ==========

  /**
   * Get Treasury auction results
   */
  async getTreasuryAuctionResults(
    startDate?: string,
    endDate?: string,
    useBeta: boolean = false
  ): Promise<TreasuryOperation[]> {
    try {
      const client = useBeta ? this.axiosBetaInstance : this.axiosInstance;
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await client.get("/treasury/auctions/results", { params });
      
      console.log(`✅ Retrieved ${response.data.length} Treasury operations`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching Treasury operations:", error);
      throw error;
    }
  }

  // ========== Repo Operations ==========

  /**
   * Get Repo/Reverse Repo operations
   */
  async getRepoOperations(
    operationType?: "Repo" | "Reverse Repo",
    startDate?: string,
    endDate?: string,
    useBeta: boolean = false
  ): Promise<RepoOperation[]> {
    try {
      const client = useBeta ? this.axiosBetaInstance : this.axiosInstance;
      const params: any = {};
      if (operationType) params.operationType = operationType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await client.get("/rp/results/search", { params });
      
      console.log(`✅ Retrieved ${response.data.length} Repo operations`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching Repo operations:", error);
      throw error;
    }
  }

  /**
   * Get latest Repo operation
   */
  async getLatestRepoOperation(
    operationType?: "Repo" | "Reverse Repo",
    useBeta: boolean = false
  ): Promise<RepoOperation | null> {
    try {
      const client = useBeta ? this.axiosBetaInstance : this.axiosInstance;
      const params: any = {};
      if (operationType) params.operationType = operationType;

      const response = await client.get("/rp/latest", { params });
      
      if (response.data) {
        console.log(`✅ Retrieved latest Repo operation: ${response.data.operationId}`);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("❌ Error fetching latest Repo operation:", error);
      throw error;
    }
  }

  // ========== Analysis Functions ==========

  /**
   * Analyze AMBS market liquidity
   */
  async analyzeAMBSLiquidity(): Promise<{
    totalAccepted: number;
    totalSubmitted: number;
    acceptanceRatio: number;
    averageSpread: number;
    topDealers: Array<{ name: string; acceptedAmount: number }>;
  }> {
    try {
      const operations = await this.getAMBSOperationResults();
      
      let totalAccepted = 0;
      let totalSubmitted = 0;
      let spreadSum = 0;
      let spreadCount = 0;
      const dealerAcceptance = new Map<string, number>();

      operations.forEach(op => {
        if (op.acceptedAmount) totalAccepted += op.acceptedAmount;
        if (op.submittedAmount) totalSubmitted += op.submittedAmount;

        op.results?.forEach(result => {
          if (result.acceptedAmount > 0) {
            const current = dealerAcceptance.get(result.dealerName) || 0;
            dealerAcceptance.set(result.dealerName, current + result.acceptedAmount);
          }
          if (result.spread) {
            spreadSum += result.spread;
            spreadCount++;
          }
        });
      });

      const topDealers = Array.from(dealerAcceptance.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, acceptedAmount]) => ({ name, acceptedAmount }));

      return {
        totalAccepted,
        totalSubmitted,
        acceptanceRatio: totalSubmitted > 0 ? totalAccepted / totalSubmitted : 0,
        averageSpread: spreadCount > 0 ? spreadSum / spreadCount : 0,
        topDealers
      };
    } catch (error) {
      console.error("❌ Error analyzing AMBS liquidity:", error);
      throw error;
    }
  }

  /**
   * Monitor Fed operations in real-time
   */
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.isMonitoring) {
      console.log("⚠️ Monitoring already active");
      return;
    }

    this.isMonitoring = true;
    console.log(`🔍 Starting NY Fed operations monitoring (interval: ${intervalMinutes} minutes)`);

    const monitorOperations = async () => {
      try {
        // Check AMBS operations
        const latestAMBS = await this.getLatestAMBSOperation();
        if (latestAMBS) {
          this.emit("ambs:new", latestAMBS);
        }

        // Check Repo operations
        const latestRepo = await this.getLatestRepoOperation();
        if (latestRepo) {
          this.emit("repo:new", latestRepo);
        }

        // Analyze market conditions
        const liquidity = await this.analyzeAMBSLiquidity();
        this.emit("analysis:liquidity", liquidity);

      } catch (error) {
        console.error("❌ Monitoring error:", error);
        this.emit("error", error);
      }
    };

    // Initial check
    monitorOperations();

    // Set up interval
    const intervalId = setInterval(monitorOperations, intervalMinutes * 60 * 1000);

    // Store interval ID for cleanup
    (this as any).monitoringInterval = intervalId;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log("⚠️ Monitoring not active");
      return;
    }

    if ((this as any).monitoringInterval) {
      clearInterval((this as any).monitoringInterval);
      delete (this as any).monitoringInterval;
    }

    this.isMonitoring = false;
    console.log("🛑 Stopped NY Fed operations monitoring");
  }
}

// Express routes
const router = Router();
const nyFedAPI = new NYFedMarketsAPI();

// Get AMBS operations
router.get("/ny-fed/ambs/results", async (req, res) => {
  try {
    const { startDate, endDate, useBeta } = req.query;
    
    let results;
    if (startDate && endDate) {
      results = await nyFedAPI.getAMBSOperationsByDateRange(
        startDate as string,
        endDate as string,
        useBeta === "true"
      );
    } else {
      results = await nyFedAPI.getAMBSOperationResults(useBeta === "true");
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get latest AMBS operation
router.get("/ny-fed/ambs/latest", async (req, res) => {
  try {
    const { useBeta } = req.query;
    const result = await nyFedAPI.getLatestAMBSOperation(useBeta === "true");

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get AMBS schedule
router.get("/ny-fed/ambs/schedule", async (req, res) => {
  try {
    const { useBeta } = req.query;
    const schedule = await nyFedAPI.getAMBSSchedule(useBeta === "true");

    res.json({
      success: true,
      count: schedule.length,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Analyze AMBS liquidity
router.get("/ny-fed/ambs/liquidity-analysis", async (req, res) => {
  try {
    const analysis = await nyFedAPI.analyzeAMBSLiquidity();

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get Treasury operations
router.get("/ny-fed/treasury/results", async (req, res) => {
  try {
    const { startDate, endDate, useBeta } = req.query;
    const results = await nyFedAPI.getTreasuryAuctionResults(
      startDate as string,
      endDate as string,
      useBeta === "true"
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get Repo operations
router.get("/ny-fed/repo/results", async (req, res) => {
  try {
    const { operationType, startDate, endDate, useBeta } = req.query;
    const results = await nyFedAPI.getRepoOperations(
      operationType as "Repo" | "Reverse Repo",
      startDate as string,
      endDate as string,
      useBeta === "true"
    );

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Start monitoring
router.post("/ny-fed/monitoring/start", async (req, res) => {
  try {
    const { interval = 5 } = req.body;
    nyFedAPI.startMonitoring(interval);

    res.json({
      success: true,
      message: `Started monitoring with ${interval} minute interval`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Stop monitoring
router.post("/ny-fed/monitoring/stop", async (req, res) => {
  try {
    nyFedAPI.stopMonitoring();

    res.json({
      success: true,
      message: "Monitoring stopped"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
export { nyFedAPI };