import { createReducer, on } from '@ngrx/store';
import { Availability } from '../../models/availability.models';
import * as AvailabilityActions from '../actions/availability.actions';

export interface AvailabilityState {
  availability: Availability[];
  loading: boolean;
  error: string | null;
  // AI-Enhanced State
  aiAnalysis: any | null;
  aiInsights: any | null;
  aiConflicts: any | null;
  aiOptimizations: any | null;
  aiValidation: any | null;
  aiLoading: boolean;
  aiError: string | null;
  lastAIUpdate: Date | null;
}

export const initialAvailabilityState: AvailabilityState = {
  availability: [],
  loading: false,
  error: null,
  // AI-Enhanced Initial State
  aiAnalysis: null,
  aiInsights: null,
  aiConflicts: null,
  aiOptimizations: null,
  aiValidation: null,
  aiLoading: false,
  aiError: null,
  lastAIUpdate: null
};

export const availabilityReducer = createReducer(
  initialAvailabilityState,
  
  // Load Availability
  on(AvailabilityActions.loadAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AvailabilityActions.loadAvailabilitySuccess, (state, { availability }) => ({
    ...state,
    availability,
    loading: false
  })),
  
  on(AvailabilityActions.loadAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Create Availability
  on(AvailabilityActions.createAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AvailabilityActions.createAvailabilitySuccess, (state, { availability }) => ({
    ...state,
    availability: [...state.availability, availability],
    loading: false
  })),
  
  on(AvailabilityActions.createAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Availability
  on(AvailabilityActions.updateAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AvailabilityActions.updateAvailabilitySuccess, (state, { availability }) => ({
    ...state,
    availability: state.availability.map(a => a.id === availability.id ? availability : a),
    loading: false
  })),
  
  on(AvailabilityActions.updateAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Delete Availability
  on(AvailabilityActions.deleteAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AvailabilityActions.deleteAvailabilitySuccess, (state, { id }) => ({
    ...state,
    availability: state.availability.filter(a => a.id !== id),
    loading: false
  })),
  
  on(AvailabilityActions.deleteAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // ===== AI-ENHANCED REDUCERS =====

  // Load AI-Enhanced Availability
  on(AvailabilityActions.loadAIEnhancedAvailability, (state) => ({
    ...state,
    loading: true,
    aiLoading: true,
    error: null,
    aiError: null
  })),

  on(AvailabilityActions.loadAIEnhancedAvailabilitySuccess, (state, { response }) => ({
    ...state,
    availability: response.data,
    aiAnalysis: response.aiAnalysis,
    aiConflicts: response.aiAnalysis?.conflicts,
    aiOptimizations: response.aiAnalysis?.optimizations,
    aiInsights: response.aiAnalysis?.insights,
    loading: false,
    aiLoading: false,
    lastAIUpdate: new Date()
  })),

  on(AvailabilityActions.loadAIEnhancedAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    aiLoading: false,
    aiError: error
  })),

  // Create AI-Optimized Availability
  on(AvailabilityActions.createAIOptimizedAvailability, (state) => ({
    ...state,
    loading: true,
    aiLoading: true,
    error: null,
    aiError: null
  })),

  on(AvailabilityActions.createAIOptimizedAvailabilitySuccess, (state, { response }) => ({
    ...state,
    availability: [...state.availability, response.data],
    aiValidation: response.aiAnalysis.validation,
    aiConflicts: response.aiAnalysis.conflicts,
    loading: false,
    aiLoading: false,
    lastAIUpdate: new Date()
  })),

  on(AvailabilityActions.createAIOptimizedAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    aiLoading: false,
    aiError: error
  })),

  // Update AI-Analyzed
  on(AvailabilityActions.updateAIAnalyzed, (state) => ({
    ...state,
    loading: true,
    aiLoading: true,
    error: null,
    aiError: null
  })),

  on(AvailabilityActions.updateAIAnalyzedSuccess, (state, { response }) => ({
    ...state,
    availability: state.availability.map(a => a.id === response.data.id ? response.data : a),
    aiValidation: response.aiAnalysis.validation,
    loading: false,
    aiLoading: false,
    lastAIUpdate: new Date()
  })),

  on(AvailabilityActions.updateAIAnalyzedFailure, (state, { error }) => ({
    ...state,
    loading: false,
    aiLoading: false,
    aiError: error
  })),

  // Delete AI-Assessed
  on(AvailabilityActions.deleteAIAssessed, (state) => ({
    ...state,
    loading: true,
    aiLoading: true,
    error: null,
    aiError: null
  })),

  on(AvailabilityActions.deleteAIAssessedSuccess, (state, { response }) => ({
    ...state,
    availability: state.availability.filter(a => a.id !== response.id),
    loading: false,
    aiLoading: false,
    lastAIUpdate: new Date()
  })),

  on(AvailabilityActions.deleteAIAssessedFailure, (state, { error }) => ({
    ...state,
    loading: false,
    aiLoading: false,
    aiError: error
  })),

  // Create Bulk AI-Optimized
  on(AvailabilityActions.createBulkAIOptimized, (state) => ({
    ...state,
    loading: true,
    aiLoading: true,
    error: null,
    aiError: null
  })),

  on(AvailabilityActions.createBulkAIOptimizedSuccess, (state, { response }) => ({
    ...state,
    availability: [...state.availability, ...response.data],
    aiAnalysis: response.aiAnalysis,
    aiValidation: response.aiAnalysis.validation,
    aiConflicts: response.aiAnalysis.conflicts,
    aiOptimizations: response.aiAnalysis.optimizations,
    loading: false,
    aiLoading: false,
    lastAIUpdate: new Date()
  })),

  on(AvailabilityActions.createBulkAIOptimizedFailure, (state, { error }) => ({
    ...state,
    loading: false,
    aiLoading: false,
    aiError: error
  })),

  // AI Insights
  on(AvailabilityActions.getAIInsights, (state) => ({
    ...state,
    aiLoading: true,
    aiError: null
  })),

  on(AvailabilityActions.getAIInsightsSuccess, (state, { insights }) => ({
    ...state,
    aiInsights: insights,
    aiConflicts: insights.conflicts,
    aiOptimizations: insights.patterns,
    aiLoading: false,
    lastAIUpdate: new Date()
  })),

  on(AvailabilityActions.getAIInsightsFailure, (state, { error }) => ({
    ...state,
    aiLoading: false,
    aiError: error
  })),

  // Validate with AI
  on(AvailabilityActions.validateWithAI, (state) => ({
    ...state,
    aiLoading: true,
    aiError: null
  })),

  on(AvailabilityActions.validateWithAISuccess, (state, { validation }) => ({
    ...state,
    aiValidation: validation,
    aiLoading: false,
    lastAIUpdate: new Date()
  })),

  on(AvailabilityActions.validateWithAIFailure, (state, { error }) => ({
    ...state,
    aiLoading: false,
    aiError: error
  })),

  // Clear AI Data
  on(AvailabilityActions.clearAIData, (state) => ({
    ...state,
    aiAnalysis: null,
    aiInsights: null,
    aiConflicts: null,
    aiOptimizations: null,
    aiValidation: null,
    aiError: null,
    lastAIUpdate: null
  })),

  // Set AI Loading
  on(AvailabilityActions.setAILoading, (state, { loading }) => ({
    ...state,
    aiLoading: loading
  }))
);