
const FRED_API_BASE = 'https://api.stlouisfed.org/fred';

export interface FredSeries {
  id: string;
  title: string;
  units: string;
  frequency: string;
  last_updated: string;
}

export interface FredObservation {
  date: string;
  value: string;
}

export interface FredApiResponse<T> {
  series?: T[];
  observations?: T[];
  count?: number;
  offset?: number;
  limit?: number;
}

// Popular economic indicators relevant to trading
export const ECONOMIC_INDICATORS = {
  // Interest Rates
  FEDFUNDS: { id: 'FEDFUNDS', name: 'Federal Funds Rate', category: 'Interest Rates' },
  DGS10: { id: 'DGS10', name: '10-Year Treasury Rate', category: 'Interest Rates' },
  DGS2: { id: 'DGS2', name: '2-Year Treasury Rate', category: 'Interest Rates' },
  
  // Inflation
  CPIAUCSL: { id: 'CPIAUCSL', name: 'Consumer Price Index', category: 'Inflation' },
  CPILFESL: { id: 'CPILFESL', name: 'Core CPI', category: 'Inflation' },
  
  // Employment
  UNRATE: { id: 'UNRATE', name: 'Unemployment Rate', category: 'Employment' },
  PAYEMS: { id: 'PAYEMS', name: 'Nonfarm Payrolls', category: 'Employment' },
  
  // GDP & Growth
  GDP: { id: 'GDP', name: 'Gross Domestic Product', category: 'Growth' },
  GDPC1: { id: 'GDPC1', name: 'Real GDP', category: 'Growth' },
  
  // Dollar Index & Commodities
  DTWEXBGS: { id: 'DTWEXBGS', name: 'US Dollar Index', category: 'Currency' },
  GOLDAMGBD228NLBM: { id: 'GOLDAMGBD228NLBM', name: 'Gold Price', category: 'Commodities' },
  DCOILWTICO: { id: 'DCOILWTICO', name: 'WTI Oil Price', category: 'Commodities' },
};

class FredApi {
  private apiKey: string;

  constructor(apiKey: string = 'demo') {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<FredApiResponse<T>> {
    const url = new URL(`${FRED_API_BASE}/${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('file_type', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`FRED API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('FRED API request failed:', error);
      throw error;
    }
  }

  async getSeries(seriesId: string): Promise<FredSeries | null> {
    try {
      const response = await this.makeRequest<FredSeries>('series', { series_id: seriesId });
      return response.series?.[0] || null;
    } catch (error) {
      console.error(`Failed to fetch series ${seriesId}:`, error);
      return null;
    }
  }

  async getObservations(
    seriesId: string, 
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<FredObservation[]> {
    try {
      const params: Record<string, string> = {
        series_id: seriesId,
        sort_order: options.sort || 'desc',
        limit: (options.limit || 10).toString(),
      };

      if (options.offset) params.offset = options.offset.toString();
      if (options.startDate) params.observation_start = options.startDate;
      if (options.endDate) params.observation_end = options.endDate;

      const response = await this.makeRequest<FredObservation>('series/observations', params);
      return response.observations?.filter(obs => obs.value !== '.') || [];
    } catch (error) {
      console.error(`Failed to fetch observations for ${seriesId}:`, error);
      return [];
    }
  }

  async getLatestValue(seriesId: string): Promise<{ value: string; date: string } | null> {
    try {
      const observations = await this.getObservations(seriesId, { limit: 1 });
      if (observations.length > 0) {
        return {
          value: observations[0].value,
          date: observations[0].date
        };
      }
      return null;
    } catch (error) {
      console.error(`Failed to fetch latest value for ${seriesId}:`, error);
      return null;
    }
  }
}

export const fredApi = new FredApi();
