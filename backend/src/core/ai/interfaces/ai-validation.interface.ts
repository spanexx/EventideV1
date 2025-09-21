export interface AIValidationResult {
  isValid: boolean;
  errors: AIValidationError[];
  warnings: AIValidationWarning[];
  suggestions: string[];
  summary: string;
}

export interface AIValidationError {
  field: string;
  type: 'required' | 'format' | 'logic' | 'range' | 'business' | 'conflict';
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface AIValidationWarning {
  field: string;
  type: 'performance' | 'optimization' | 'best-practice';
  message: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ValidationContext {
  existingData?: any[];
  businessRules?: BusinessRule[];
  constraints?: ValidationConstraints;
}

export interface BusinessRule {
  name: string;
  description: string;
  validator: (data: any, context?: ValidationContext) => boolean;
  errorMessage: string;
}

export interface ValidationConstraints {
  timeRange?: { start: string; end: string };
  maxDuration?: number;
  minBufferTime?: number;
  allowedDays?: string[];
  maxBookingsPerDay?: number;
}

export interface AIValidationService {
  validateAvailabilityInput(inputData: any, context?: ValidationContext): Promise<AIValidationResult>;
  validateBulkData(bulkData: any[], context?: ValidationContext): Promise<AIValidationResult[]>;
  validateBusinessRules(data: any, rules: BusinessRule[]): Promise<AIValidationResult>;
}