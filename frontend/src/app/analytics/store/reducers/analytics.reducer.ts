import { createReducer, on } from '@ngrx/store';
import * as AnalyticsActions from '../actions/analytics.actions';
import { AnalyticsData } from '../../models/analytics.models';

export interface AnalyticsState {
  data: AnalyticsData | null;
  report: any | null;
  loading: boolean;
  error: string | null;
}

export const initialAnalyticsState: AnalyticsState = {
  data: null,
  report: null,
  loading: false,
  error: null
};

export const analyticsReducer = createReducer(
  initialAnalyticsState,
  
  // Load analytics data
  on(AnalyticsActions.loadAnalyticsData, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AnalyticsActions.loadAnalyticsDataSuccess, (state, { data }) => ({
    ...state,
    data,
    loading: false
  })),
  
  on(AnalyticsActions.loadAnalyticsDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Generate report
  on(AnalyticsActions.generateReport, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AnalyticsActions.generateReportSuccess, (state, { report }) => ({
    ...state,
    report,
    loading: false
  })),
  
  on(AnalyticsActions.generateReportFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);