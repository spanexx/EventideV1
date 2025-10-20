import { createReducer, on } from '@ngrx/store';
import { AppearanceState, initialAppearanceState } from './appearance.state';
import {
  initializeAppearance,
  loadAppearancePreferences,
  loadAppearancePreferencesSuccess,
  updateTheme,
  updateLanguage,
  updateTimezone,
  themeApplied,
  updateAppearancePreferencesSuccess,
} from './appearance.actions';

export const appearanceReducer = createReducer(
  initialAppearanceState,
  on(initializeAppearance, (state) => ({
    ...state,
    initialized: true,
  })),
  on(loadAppearancePreferences, (state) => state),
  on(loadAppearancePreferencesSuccess, (state, { preferences }) => ({
    ...state,
    theme: preferences.theme || state.theme,
    language: preferences.language || state.language,
    timezone: preferences.timezone || state.timezone,
    initialized: true,
  })),
  on(updateTheme, (state, { theme }) => ({
    ...state,
    theme,
  })),
  on(updateLanguage, (state, { language }) => ({
    ...state,
    language,
  })),
  on(updateTimezone, (state, { timezone }) => ({
    ...state,
    timezone,
  })),
  on(updateAppearancePreferencesSuccess, (state, { preferences }) => ({
    ...state,
    theme: preferences.theme ?? state.theme,
    language: preferences.language ?? state.language,
    timezone: preferences.timezone ?? state.timezone,
  })),
  on(themeApplied, (state, { theme }) => ({
    ...state,
    theme,
  })),
);
