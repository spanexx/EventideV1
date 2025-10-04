export interface AIAnalyticsEngine {
  generateInsights(data: any[]): Promise<BusinessInsights>;
  predictDemand(historicalData: any[], timeframe: string): Promise<DemandPrediction>;
  analyzeCustomerBehavior(bookingData: any[]): Promise<BehaviorAnalysis>;
  calculateKPIs(data: any[]): Promise<KPIMetrics>;
}

export interface BusinessInsights {
  keyFindings: Insight[];
  actionableRecommendations: Recommendation[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  summary: string;
}

export interface Insight {
  category: 'performance' | 'behavior' | 'trend' | 'efficiency';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  data: any;
}

export interface Recommendation {
  title: string;
  description: string;
  category: 'operations' | 'marketing' | 'pricing' | 'staffing';
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  expectedImpact: string;
  implementation: string[];
}

export interface RiskFactor {
  type: 'operational' | 'financial' | 'competitive' | 'seasonal';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string[];
  probability: number;
}

export interface Opportunity {
  type: 'revenue' | 'efficiency' | 'growth' | 'innovation';
  title: string;
  description: string;
  potential: string;
  requirements: string[];
  timeline: string;
}

export interface DemandPrediction {
  forecast: ForecastData[];
  confidence: number;
  factors: DemandFactor[];
  recommendations: string[];
  accuracy: PredictionAccuracy;
}

export interface ForecastData {
  period: string;
  predictedDemand: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface DemandFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface PredictionAccuracy {
  historicalAccuracy: number;
  margin: number;
  reliability: 'low' | 'medium' | 'high';
}

export interface BehaviorAnalysis {
  customerSegments: CustomerSegment[];
  bookingPatterns: BookingPattern[];
  preferences: CustomerPreference[];
  insights: string[];
}

export interface CustomerSegment {
  name: string;
  size: number;
  characteristics: string[];
  behaviors: string[];
  value: number;
  recommendations: string[];
}

export interface BookingPattern {
  pattern: string;
  frequency: number;
  timePreferences: string[];
  seasonality: string;
  insights: string[];
}

export interface CustomerPreference {
  category: string;
  preferences: Array<{
    preference: string;
    percentage: number;
  }>;
  trends: string[];
}

export interface KPIMetrics {
  utilization: UtilizationMetrics;
  revenue: RevenueMetrics;
  customer: CustomerMetrics;
  operational: OperationalMetrics;
  trends: TrendMetrics;
}

export interface UtilizationMetrics {
  overall: number;
  byTimeSlot: Array<{ timeSlot: string; utilization: number }>;
  byService: Array<{ service: string; utilization: number }>;
  trends: string[];
}

export interface RevenueMetrics {
  total: number;
  growth: number;
  perBooking: number;
  byService: Array<{ service: string; revenue: number }>;
  forecasted: number;
}

export interface CustomerMetrics {
  satisfaction: number;
  retention: number;
  acquisition: number;
  lifetime: number;
  segments: CustomerSegment[];
}

export interface OperationalMetrics {
  efficiency: number;
  cancellationRate: number;
  noShowRate: number;
  averageBookingTime: number;
  resourceUtilization: number;
}

export interface TrendMetrics {
  period: string;
  trends: Array<{
    metric: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
    significance: 'low' | 'medium' | 'high';
  }>;
}