import { createAction, props } from '@ngrx/store';
import { AnalyticsData, AnalyticsRequest, ReportData } from '../../models/analytics.models';

// Load analytics data
export const loadAnalyticsData = createAction(
  '[Analytics] Load Analytics Data',
  props<{ request: AnalyticsRequest }>()
);

export const loadAnalyticsDataSuccess = createAction(
  '[Analytics] Load Analytics Data Success',
  props<{ data: AnalyticsData }>()
);

export const loadAnalyticsDataFailure = createAction(
  '[Analytics] Load Analytics Data Failure',
  props<{ error: string }>()
);

// Generate report
export const generateReport = createAction(
  '[Analytics] Generate Report',
  props<{ request: AnalyticsRequest; reportType: 'pdf' | 'csv' }>()
);

export const generateReportSuccess = createAction(
  '[Analytics] Generate Report Success',
  props<{ report: ReportData }>()
);

export const generateReportFailure = createAction(
  '[Analytics] Generate Report Failure',
  props<{ error: string }>()
);