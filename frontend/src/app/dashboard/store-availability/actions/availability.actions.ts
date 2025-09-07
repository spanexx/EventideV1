import { createAction, props } from '@ngrx/store';
import { Availability } from '../../models/availability.models';

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