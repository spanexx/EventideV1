import { Availability } from '../../../modules/availability/availability.schema';

export interface AIConflictAnalysis {
  hasConflicts: boolean;
  conflicts: AIConflict[];
  summary: string;
}

export interface AIConflict {
  type: 'overlap' | 'buffer' | 'capacity' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedSlots: string[];
  suggestions: string[];
}

export interface AIOptimizationResult {
  optimizations: AIOptimization[];
  suggestedSchedule?: Partial<Availability>[];
  summary: string;
}

export interface AIOptimization {
  type: 'time' | 'buffer' | 'capacity' | 'revenue' | 'efficiency';
  impact: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  estimatedImprovement: string;
}

export interface AIValidationResult {
  isValid: boolean;
  errors: AIValidationError[];
  suggestions: string[];
  summary: string;
}

export interface AIValidationError {
  field: string;
  type: 'required' | 'format' | 'logic' | 'range' | 'business';
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface AIPatternAnalysis {
  patterns: AIPattern[];
  trends: AITrends;
  insights: string[];
  summary: string;
}

export interface AIPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'behavioral';
  description: string;
  confidence: number;
  impact: string;
  recommendation: string;
}

export interface AITrends {
  bookingTrends: string;
  peakHours: string[];
  seasonality: string;
  utilization: string;
}

export interface ScheduleConstraints {
  preferredTimes?: string[];
  bufferTime?: number;
  maxDailyBookings?: number;
  workingHours?: { start: string; end: string };
  priorities?: string[];
}

export interface AIAvailabilityService {
  analyzeConflicts(availabilityData: Availability[]): Promise<AIConflictAnalysis>;
  optimizeSchedule(constraints: ScheduleConstraints, availabilityData: Availability[]): Promise<AIOptimizationResult>;
  validateInput(inputData: any): Promise<AIValidationResult>;
  analyzePatterns(availabilityData: Availability[]): Promise<AIPatternAnalysis>;
}