export interface AIOptimizationEngine {
  optimizeScheduleLayout(data: any[], constraints: OptimizationConstraints): Promise<OptimizationResult>;
  calculateOptimalBufferTimes(bookings: any[]): Promise<BufferOptimization>;
  suggestPeakHoursPricing(analysisData: any[]): Promise<PricingOptimization>;
  optimizeResourceAllocation(resources: any[], demand: any[]): Promise<ResourceOptimization>;
}

export interface OptimizationConstraints {
  maxWorkingHours?: number;
  minBreakTime?: number;
  preferredTimeSlots?: string[];
  resourceLimits?: ResourceLimit[];
  businessGoals?: BusinessGoal[];
}

export interface ResourceLimit {
  resourceId: string;
  maxCapacity: number;
  availableHours: { start: string; end: string };
}

export interface BusinessGoal {
  type: 'revenue' | 'efficiency' | 'satisfaction' | 'utilization';
  priority: 'low' | 'medium' | 'high';
  target?: number;
  weight?: number;
}

export interface OptimizationResult {
  improvements: OptimizationImprovement[];
  newSchedule?: any[];
  metrics: OptimizationMetrics;
  summary: string;
}

export interface OptimizationImprovement {
  type: 'scheduling' | 'pricing' | 'resource' | 'workflow';
  description: string;
  impact: {
    revenue?: string;
    efficiency?: string;
    satisfaction?: string;
  };
  implementation: string;
  priority: 'low' | 'medium' | 'high';
}

export interface OptimizationMetrics {
  utilizationRate: number;
  revenueIncrease: number;
  efficiencyGain: number;
  customerSatisfactionImpact: number;
}

export interface BufferOptimization {
  recommendedBufferTime: number;
  reasoning: string;
  impact: string;
  alternatives: Array<{
    bufferTime: number;
    pros: string[];
    cons: string[];
  }>;
}

export interface PricingOptimization {
  peakHours: string[];
  suggestedPricing: PricingStrategy[];
  revenueProjection: number;
  competitiveAnalysis: string;
}

export interface PricingStrategy {
  timeSlot: string;
  currentPrice: number;
  suggestedPrice: number;
  reasoning: string;
  expectedImpact: string;
}

export interface ResourceOptimization {
  resourceAllocations: ResourceAllocation[];
  bottlenecks: Bottleneck[];
  recommendations: string[];
  efficiency: number;
}

export interface ResourceAllocation {
  resourceId: string;
  allocatedHours: number;
  utilization: number;
  recommendations: string[];
}

export interface Bottleneck {
  resourceId: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  solutions: string[];
}