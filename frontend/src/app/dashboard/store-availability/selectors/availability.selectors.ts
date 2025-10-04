import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AvailabilityState } from '../reducers/availability.reducer';

export const selectAvailabilityState = createFeatureSelector<AvailabilityState>('availability');

// Availability selectors
export const selectAvailability = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => {
    // Clean up the availability data to ensure it only has 'id' and not '_id'
    return state.availability.map(slot => {
      const { _id, ...rest } = slot as any;
      return rest;
    });
  }
);

// Loading and error selectors
export const selectAvailabilityLoading = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.loading
);

export const selectAvailabilityError = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.error
);

// ===== AI-ENHANCED SELECTORS =====

// AI Analysis Selectors
export const selectAIAnalysis = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.aiAnalysis
);

export const selectAIInsights = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.aiInsights
);

export const selectAIConflicts = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.aiConflicts
);

export const selectAIOptimizations = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.aiOptimizations
);

export const selectAIValidation = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.aiValidation
);

// AI Loading and Error Selectors
export const selectAILoading = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.aiLoading
);

export const selectAIError = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.aiError
);

export const selectLastAIUpdate = createSelector(
  selectAvailabilityState,
  (state: AvailabilityState) => state.lastAIUpdate
);

// Combined AI Data Selector
export const selectAIData = createSelector(
  selectAIAnalysis,
  selectAIInsights,
  selectAIConflicts,
  selectAIOptimizations,
  selectAIValidation,
  selectAILoading,
  selectAIError,
  selectLastAIUpdate,
  (analysis, insights, conflicts, optimizations, validation, loading, error, lastUpdate) => ({
    analysis,
    insights,
    conflicts,
    optimizations,
    validation,
    loading,
    error,
    lastUpdate,
    hasData: !!(analysis || insights || conflicts || optimizations || validation),
    hasConflicts: !!(conflicts?.hasConflicts || conflicts?.length > 0),
    hasOptimizations: !!(optimizations?.optimizations?.length > 0 || optimizations?.patterns?.length > 0),
    isStale: lastUpdate ? (Date.now() - new Date(lastUpdate).getTime()) > 300000 : true // 5 minutes
  })
);

// Enhanced Availability with AI Selector
export const selectAvailabilityWithAI = createSelector(
  selectAvailability,
  selectAIData,
  (availability, aiData) => ({
    availability,
    aiData,
    enhanced: aiData.hasData
  })
);

// AI Status Selector
export const selectAIStatus = createSelector(
  selectAILoading,
  selectAIError,
  selectLastAIUpdate,
  (loading, error, lastUpdate) => ({
    loading,
    error,
    lastUpdate,
    available: !loading && !error,
    needsRefresh: !lastUpdate || (Date.now() - new Date(lastUpdate).getTime()) > 300000
  })
);