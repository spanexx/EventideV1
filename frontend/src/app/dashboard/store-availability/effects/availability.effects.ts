import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concat, of } from 'rxjs';
import { map, mergeMap, catchError, switchMap, concatMap, exhaustMap, tap } from 'rxjs/operators';
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
        this.availabilityService.getAIEnhancedAvailability(providerId, date, true).pipe(
          map(response => {
            // Clean up the availability data to ensure it only has 'id' and not '_id'
            const cleanedAvailability = response.data.map(slot => {
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
        this.availabilityService.createAIOptimizedAvailability(availability).pipe(
          map(response => {
            // Clean up the created availability data to ensure it only has 'id' and not '_id'
            const { _id, ...rest } = response.data as any;
            
            // Show AI-enhanced success message
            let message = 'Availability slot created successfully!';
            if (response.aiAnalysis?.validation?.isValid === false) {
              message += ' Note: AI detected some potential issues.';
            } else if (response.aiAnalysis?.conflicts) {
              message += ' AI conflict analysis completed.';
            }
            
            this.snackbarService.showSuccess(message);
            
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
        this.availabilityService.updateAIAnalyzed(availability).pipe(
          map(response => {
            // Clean up the updated availability data to ensure it only has 'id' and not '_id'
            const { _id, ...rest } = response.data as any;
            
            // Show AI-enhanced success message
            let message = 'Availability slot updated successfully!';
            if (response.aiAnalysis?.impactAnalysis) {
              message += ` ${response.aiAnalysis.impactAnalysis.substring(0, 50)}...`;
            }
            
            this.snackbarService.showSuccess(message);
            
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
        this.availabilityService.deleteAIAssessed(id).pipe(
          map(response => {
            // Show AI-enhanced success message
            let message = 'Availability slot deleted successfully!';
            if (response.aiAnalysis?.impactAssessment) {
              const risk = response.aiAnalysis.riskLevel;
              if (risk === 'high') {
                message += ' High impact deletion - please review recommendations.';
              } else if (risk === 'medium') {
                message += ' Medium impact deletion detected.';
              }
            }
            
            this.snackbarService.showSuccess(message);
            
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

  // Invalidate cache on any successful mutation
  clearCacheOnSuccess$ = createEffect(
    () => this.actions$.pipe(
      ofType(
        AvailabilityActions.createAvailabilitySuccess,
        AvailabilityActions.updateAvailabilitySuccess,
        AvailabilityActions.deleteAvailabilitySuccess,
        AvailabilityActions.createAIOptimizedAvailabilitySuccess,
        AvailabilityActions.updateAIAnalyzedSuccess,
        AvailabilityActions.deleteAIAssessedSuccess,
        AvailabilityActions.createBulkAIOptimizedSuccess,
        AvailabilityActions.loadAIEnhancedAvailabilitySuccess // refreshes data
      ),
      tap(() => {
        console.debug('[AvailabilityEffects] Clearing availability cache after mutation');
        this.availabilityService.clearAvailabilityCache();
      })
    ),
    { dispatch: false }
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