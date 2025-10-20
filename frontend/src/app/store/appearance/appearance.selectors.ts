import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppearanceState } from './appearance.state';

export const selectAppearanceState = createFeatureSelector<AppearanceState>('appearance');

export const selectTheme = createSelector(
  selectAppearanceState,
  (state: AppearanceState) => state.theme
);

export const selectLanguage = createSelector(
  selectAppearanceState,
  (state: AppearanceState) => state.language
);

export const selectTimezone = createSelector(
  selectAppearanceState,
  (state: AppearanceState) => state.timezone
);

export const selectAppearanceInitialized = createSelector(
  selectAppearanceState,
  (state: AppearanceState) => state.initialized
);

export const selectAppearancePreferences = createSelector(
  selectAppearanceState,
  (state: AppearanceState) => ({
    theme: state.theme,
    language: state.language,
    timezone: state.timezone
  })
);
