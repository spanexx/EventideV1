import { createAction, props } from '@ngrx/store';
import { Availability } from '../../models/availability.models';
import { AIEnhancedAvailabilityResponse, AICreateResponse, AIBulkResponse } from '../../services/availability.service';

// Load Availability
export const loadAvailability = createAction(
  '[Availability] Load Availability',
  props<{ providerId: string; date: Date }>()
);

export const loadAvailabilitySuccess = createAction(
  '[Availability] Load Availability Success',
  props<{ availability: Availability[] }>()
);

export const loadAvailabilityFailure = createAction(
  '[Availability] Load Availability Failure',
  props<{ error: string }>()
);

// Create Availability Slot
export const createAvailability = createAction(
  '[Availability] Create Availability',
  props<{ availability: Availability }>()
);

export const createAvailabilitySuccess = createAction(
  '[Availability] Create Availability Success',
  props<{ availability: Availability }>()
);

export const createAvailabilityFailure = createAction(
  '[Availability] Create Availability Failure',
  props<{ error: string }>()
);

// Update Availability Slot
export const updateAvailability = createAction(
  '[Availability] Update Availability',
  props<{ availability: Availability }>()
);

export const updateAvailabilitySuccess = createAction(
  '[Availability] Update Availability Success',
  props<{ availability: Availability }>()
);

export const updateAvailabilityFailure = createAction(
  '[Availability] Update Availability Failure',
  props<{ error: string }>()
);

// Delete Availability Slot
export const deleteAvailability = createAction(
  '[Availability] Delete Availability',
  props<{ id: string }>()
);

export const deleteAvailabilitySuccess = createAction(
  '[Availability] Delete Availability Success',
  props<{ id: string }>()
);

export const deleteAvailabilityFailure = createAction(
  '[Availability] Delete Availability Failure',
  props<{ error: string }>()
);

// ===== AI-ENHANCED ACTIONS =====

// Load AI-Enhanced Availability
export const loadAIEnhancedAvailability = createAction(
  '[Availability AI] Load AI-Enhanced Availability',
  props<{ providerId: string; date: Date; includeAnalysis?: boolean }>()
);

export const loadAIEnhancedAvailabilitySuccess = createAction(
  '[Availability AI] Load AI-Enhanced Availability Success',
  props<{ response: AIEnhancedAvailabilityResponse }>()
);

export const loadAIEnhancedAvailabilityFailure = createAction(
  '[Availability AI] Load AI-Enhanced Availability Failure',
  props<{ error: string }>()
);

// Create AI-Optimized Availability
export const createAIOptimizedAvailability = createAction(
  '[Availability AI] Create AI-Optimized Availability',
  props<{ availability: Availability }>()
);

export const createAIOptimizedAvailabilitySuccess = createAction(
  '[Availability AI] Create AI-Optimized Availability Success',
  props<{ response: AICreateResponse }>()
);

export const createAIOptimizedAvailabilityFailure = createAction(
  '[Availability AI] Create AI-Optimized Availability Failure',
  props<{ error: string }>()
);

// Update with AI Analysis
export const updateAIAnalyzed = createAction(
  '[Availability AI] Update AI-Analyzed',
  props<{ availability: Availability }>()
);

export const updateAIAnalyzedSuccess = createAction(
  '[Availability AI] Update AI-Analyzed Success',
  props<{ response: any }>()
);

export const updateAIAnalyzedFailure = createAction(
  '[Availability AI] Update AI-Analyzed Failure',
  props<{ error: string }>()
);

// Delete with AI Assessment
export const deleteAIAssessed = createAction(
  '[Availability AI] Delete AI-Assessed',
  props<{ id: string }>()
);

export const deleteAIAssessedSuccess = createAction(
  '[Availability AI] Delete AI-Assessed Success',
  props<{ response: any }>()
);

export const deleteAIAssessedFailure = createAction(
  '[Availability AI] Delete AI-Assessed Failure',
  props<{ error: string }>()
);

// Create Bulk AI-Optimized
export const createBulkAIOptimized = createAction(
  '[Availability AI] Create Bulk AI-Optimized',
  props<{ bulkData: any }>()
);

export const createBulkAIOptimizedSuccess = createAction(
  '[Availability AI] Create Bulk AI-Optimized Success',
  props<{ response: AIBulkResponse }>()
);

export const createBulkAIOptimizedFailure = createAction(
  '[Availability AI] Create Bulk AI-Optimized Failure',
  props<{ error: string }>()
);

// AI Insights
export const getAIInsights = createAction(
  '[Availability AI] Get AI Insights',
  props<{ availabilityData: Availability[] }>()
);

export const getAIInsightsSuccess = createAction(
  '[Availability AI] Get AI Insights Success',
  props<{ insights: any }>()
);

export const getAIInsightsFailure = createAction(
  '[Availability AI] Get AI Insights Failure',
  props<{ error: string }>()
);

// Validate with AI
export const validateWithAI = createAction(
  '[Availability AI] Validate with AI',
  props<{ availability: Availability }>()
);

export const validateWithAISuccess = createAction(
  '[Availability AI] Validate with AI Success',
  props<{ validation: any }>()
);

export const validateWithAIFailure = createAction(
  '[Availability AI] Validate with AI Failure',
  props<{ error: string }>()
);

// Clear AI Data
export const clearAIData = createAction(
  '[Availability AI] Clear AI Data'
);

// Set AI Loading State
export const setAILoading = createAction(
  '[Availability AI] Set AI Loading',
  props<{ loading: boolean }>()
);

// AI Analysis Success Actions (for basic CRUD operations)
export const loadAIAnalysisSuccess = createAction(
  '[Availability AI] Load AI Analysis Success',
  props<{ aiAnalysis: any }>()
);

export const createAIAnalysisSuccess = createAction(
  '[Availability AI] Create AI Analysis Success',
  props<{ aiAnalysis: any }>()
);

export const updateAIAnalysisSuccess = createAction(
  '[Availability AI] Update AI Analysis Success',
  props<{ aiAnalysis: any }>()
);

export const deleteAIAnalysisSuccess = createAction(
  '[Availability AI] Delete AI Analysis Success',
  props<{ aiAnalysis: any }>()
);