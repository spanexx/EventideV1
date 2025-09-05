import { createAction, props } from '@ngrx/store';
import { Availability } from '../../models/availability.models';

// Create Availability Slot
export const createAvailability = createAction(
  '[Dashboard] Create Availability',
  props<{ availability: Availability }>()
);

export const createAvailabilitySuccess = createAction(
  '[Dashboard] Create Availability Success',
  props<{ availability: Availability }>()
);

export const createAvailabilityFailure = createAction(
  '[Dashboard] Create Availability Failure',
  props<{ error: string }>()
);

// Update Availability Slot
export const updateAvailability = createAction(
  '[Dashboard] Update Availability',
  props<{ availability: Availability }>()
);

export const updateAvailabilitySuccess = createAction(
  '[Dashboard] Update Availability Success',
  props<{ availability: Availability }>()
);

export const updateAvailabilityFailure = createAction(
  '[Dashboard] Update Availability Failure',
  props<{ error: string }>()
);

// Delete Availability Slot
export const deleteAvailability = createAction(
  '[Dashboard] Delete Availability',
  props<{ id: string }>()
);

export const deleteAvailabilitySuccess = createAction(
  '[Dashboard] Delete Availability Success',
  props<{ id: string }>()
);

export const deleteAvailabilityFailure = createAction(
  '[Dashboard] Delete Availability Failure',
  props<{ error: string }>()
);