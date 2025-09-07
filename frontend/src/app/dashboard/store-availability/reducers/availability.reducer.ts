import { createReducer, on } from '@ngrx/store';
import { Availability } from '../../models/availability.models';
import * as AvailabilityActions from '../actions/availability.actions';

export interface AvailabilityState {
  availability: Availability[];
  loading: boolean;
  error: string | null;
}

export const initialAvailabilityState: AvailabilityState = {
  availability: [],
  loading: false,
  error: null
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
  }))
);