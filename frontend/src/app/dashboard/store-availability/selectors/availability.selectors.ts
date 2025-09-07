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