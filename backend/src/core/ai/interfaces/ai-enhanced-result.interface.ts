export interface AiEnhancedResult {
  suggestions: AvailabilitySlot[];
  recommendations: string[];
  optimizationDetails: OptimizationDetails;
  error?: string;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  score: number;
  reason?: string;
}

export interface OptimizationDetails {
  score: number;
  factors: OptimizationFactor[];
  summary: string;
}

export interface OptimizationFactor {
  name: string;
  weight: number;
  impact: number;
  description: string;
}
