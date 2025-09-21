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

  // ===== AI-ENHANCED EFFECTS =====

  loadAIEnhancedAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.loadAIEnhancedAvailability),
      mergeMap(({ providerId, date, includeAnalysis = true }) =>
        this.availabilityService.getAIEnhancedAvailability(providerId, date, includeAnalysis).pipe(
          map(response => {
            this.snackbarService.showSuccess('AI-enhanced availability loaded successfully!');
            return AvailabilityActions.loadAIEnhancedAvailabilitySuccess({ response });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to load AI-enhanced availability: ' + error.message);
            return of(AvailabilityActions.loadAIEnhancedAvailabilityFailure({ error: error.message }));
          })
        )
      )
    )
  );

  createAIOptimizedAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.createAIOptimizedAvailability),
      exhaustMap(({ availability }) =>
        this.availabilityService.createAIOptimizedAvailability(availability).pipe(
          map(response => {
            this.snackbarService.showSuccess('AI-optimized availability created successfully!');
            return AvailabilityActions.createAIOptimizedAvailabilitySuccess({ response });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to create AI-optimized availability: ' + error.message);
            return of(AvailabilityActions.createAIOptimizedAvailabilityFailure({ error: error.message }));
          })
        )
      )
    )
  );

  updateAIAnalyzed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.updateAIAnalyzed),
      switchMap(({ availability }) =>
        this.availabilityService.updateAIAnalyzed(availability).pipe(
          map(response => {
            this.snackbarService.showSuccess('Availability updated with AI analysis!');
            return AvailabilityActions.updateAIAnalyzedSuccess({ response });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to update with AI analysis: ' + error.message);
            return of(AvailabilityActions.updateAIAnalyzedFailure({ error: error.message }));
          })
        )
      )
    )
  );

  deleteAIAssessed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.deleteAIAssessed),
      switchMap(({ id }) =>
        this.availabilityService.deleteAIAssessed(id).pipe(
          map(response => {
            this.snackbarService.showSuccess('Availability deleted with AI assessment!');
            return AvailabilityActions.deleteAIAssessedSuccess({ response });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to delete with AI assessment: ' + error.message);
            return of(AvailabilityActions.deleteAIAssessedFailure({ error: error.message }));
          })
        )
      )
    )
  );

  createBulkAIOptimized$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.createBulkAIOptimized),
      exhaustMap(({ bulkData }) =>
        this.availabilityService.createBulkAIOptimized(bulkData).pipe(
          map(response => {
            this.snackbarService.showSuccess(`AI-optimized bulk creation completed! Efficiency score: ${response.aiAnalysis.efficiencyScore}%`);
            return AvailabilityActions.createBulkAIOptimizedSuccess({ response });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to create bulk AI-optimized availability: ' + error.message);
            return of(AvailabilityActions.createBulkAIOptimizedFailure({ error: error.message }));
          })
        )
      )
    )
  );

  getAIInsights$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.getAIInsights),
      switchMap(({ availabilityData }) =>
        this.availabilityService.getAIInsights(availabilityData).then(
          insights => {
            this.snackbarService.showSuccess('AI insights generated successfully!');
            return AvailabilityActions.getAIInsightsSuccess({ insights });
          }
        ).catch(
          error => {
            this.snackbarService.showError('Failed to generate AI insights: ' + error.message);
            return AvailabilityActions.getAIInsightsFailure({ error: error.message });
          }
        )
      )
    )
  );

  validateWithAI$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.validateWithAI),
      switchMap(({ availability }) =>
        this.availabilityService.validateWithAI(availability).pipe(
          map(validation => {
            this.snackbarService.showSuccess('AI validation completed!');
            return AvailabilityActions.validateWithAISuccess({ validation });
          }),
          catchError(error => {
            this.snackbarService.showError('AI validation failed: ' + error.message);
            return of(AvailabilityActions.validateWithAIFailure({ error: error.message }));
          })
        )
      )
    )
  );
}