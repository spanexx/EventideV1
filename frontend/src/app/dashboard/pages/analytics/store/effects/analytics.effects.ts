import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, Subject } from 'rxjs';
import { catchError, map, mergeMap, takeUntil } from 'rxjs/operators';
import * as AnalyticsActions from '../actions/analytics.actions';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsSocketService } from '../../services/analytics-socket.service';

@Injectable()
export class AnalyticsEffects implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  constructor(
    private actions$: Actions,
    private store: Store,
    private analyticsService: AnalyticsService,
    private analyticsSocketService: AnalyticsSocketService
  ) {
    // Subscribe to real-time analytics updates
    this.analyticsSocketService.analyticsUpdate$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.store.dispatch(AnalyticsActions.loadAnalyticsDataSuccess({ data }));
    });
  }
  
  ngOnInit(): void {
    // Join the analytics room when the effects are initialized
    // In a real implementation, this would be triggered by user authentication
    this.analyticsSocketService.joinProviderRoom('provider-123');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.analyticsSocketService.disconnect();
  }
  
  loadAnalyticsData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.loadAnalyticsData),
      mergeMap(({ request }) => {
        console.log('🔄 [AnalyticsEffects] Loading analytics data from backend', request);
        return this.analyticsService.getAnalyticsData(request).pipe(
          map(data => {
            console.log('✅ [AnalyticsEffects] Analytics data loaded successfully', { dataLength: JSON.stringify(data).length });
            return AnalyticsActions.loadAnalyticsDataSuccess({ data });
          }),
          catchError(error => {
            console.error('❌ [AnalyticsEffects] Failed to load analytics data', error);
            return of(AnalyticsActions.loadAnalyticsDataFailure({ error: error.message }));
          })
        );
      })
    )
  );
  
  generateReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.generateReport),
      mergeMap(({ request, reportType }) => {
        console.log('🔄 [AnalyticsEffects] Generating report from backend', { request, reportType });
        return this.analyticsService.generateReport(request, reportType).pipe(
          map(report => {
            console.log('✅ [AnalyticsEffects] Report generated successfully', { reportType: report.type, dataLength: report.data?.length });
            return AnalyticsActions.generateReportSuccess({ report });
          }),
          catchError(error => {
            console.error('❌ [AnalyticsEffects] Failed to generate report', error);
            return of(AnalyticsActions.generateReportFailure({ error: error.message }));
          })
        );
      })
    )
  );
}