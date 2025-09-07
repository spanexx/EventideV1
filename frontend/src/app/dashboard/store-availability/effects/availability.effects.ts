import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concat, of } from 'rxjs';
import { map, mergeMap, catchError, switchMap, concatMap, exhaustMap } from 'rxjs/operators';
import { AvailabilityService } from '../../services/availability.service';
import * as AvailabilityActions from '../actions/availability.actions';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Injectable()
export class AvailabilityEffects {
  private actions$ = inject(Actions);
  private availabilityService = inject(AvailabilityService);
  private snackbarService = inject(SnackbarService);

  loadAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.loadAvailability),
      mergeMap(({ providerId, date }) =>
        this.availabilityService.getAvailability(providerId, date).pipe(
          map(availability => {
            // Clean up the availability data to ensure it only has 'id' and not '_id'
            const cleanedAvailability = availability.map(slot => {
              const { _id, ...rest } = slot as any;
              return rest;
            });
            return AvailabilityActions.loadAvailabilitySuccess({ availability: cleanedAvailability });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to load availability: ' + error.message);
            return of(AvailabilityActions.loadAvailabilityFailure({ error: error.message }));
          })
        )
      )
    )
  );

  createAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.createAvailability),
      exhaustMap(({ availability }) =>
        this.availabilityService.createAvailability(availability).pipe(
          map(createdAvailability => {
            // Clean up the created availability data to ensure it only has 'id' and not '_id'
            const { _id, ...rest } = createdAvailability as any;
            this.snackbarService.showSuccess('Availability slot created successfully!');
            return AvailabilityActions.createAvailabilitySuccess({ availability: rest });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to create availability: ' + error.message);
            return of(AvailabilityActions.createAvailabilityFailure({ error: error.message }));
          })
        )
      )
    )
  );

  updateAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.updateAvailability),
      switchMap(({ availability }) =>
        this.availabilityService.updateAvailability(availability).pipe(
          map(updatedAvailability => {
            // Clean up the updated availability data to ensure it only has 'id' and not '_id'
            const { _id, ...rest } = updatedAvailability as any;
            this.snackbarService.showSuccess('Availability slot updated successfully!');
            return AvailabilityActions.updateAvailabilitySuccess({ availability: rest });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to update availability: ' + error.message);
            return of(AvailabilityActions.updateAvailabilityFailure({ error: error.message }));
          })
        )
      )
    )
  );

  deleteAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.deleteAvailability),
      switchMap(({ id }) =>
        this.availabilityService.deleteAvailability(id).pipe(
          map(() => {
            this.snackbarService.showSuccess('Availability slot deleted successfully!');
            return AvailabilityActions.deleteAvailabilitySuccess({ id });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to delete availability: ' + error.message);
            return of(AvailabilityActions.deleteAvailabilityFailure({ error: error.message }));
          })
        )
      )
    )
  );
}