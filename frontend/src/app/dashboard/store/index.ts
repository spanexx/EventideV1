import { ActionReducerMap } from '@ngrx/store';
import { DashboardState, initialDashboardState } from './reducers/dashboard.reducer';
import { dashboardReducer } from './reducers/dashboard.reducer';

export interface AppState {
  dashboard: DashboardState;
}

export const reducers: ActionReducerMap<AppState> = {
  dashboard: dashboardReducer
};

export const initialAppState: AppState = {
  dashboard: initialDashboardState
};