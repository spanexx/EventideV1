import { createAction, props } from '@ngrx/store';
import { UserPreferences } from '../../dashboard/pages/settings/settings.service';

export const initializeAppearance = createAction('[Appearance] Initialize Appearance');

export const loadAppearancePreferences = createAction('[Appearance] Load Appearance Preferences');

export const loadAppearancePreferencesSuccess = createAction(
  '[Appearance] Load Appearance Preferences Success',
  props<{ preferences: UserPreferences }>(),
);

export const loadAppearancePreferencesFailure = createAction(
  '[Appearance] Load Appearance Preferences Failure',
  props<{ error: string }>(),
);

export const updateTheme = createAction(
  '[Appearance] Update Theme',
  props<{ theme: 'light' | 'dark' | 'system' }>(),
);

export const updateLanguage = createAction(
  '[Appearance] Update Language',
  props<{ language: string }>(),
);

export const updateTimezone = createAction(
  '[Appearance] Update Timezone',
  props<{ timezone: string }>(),
);

export const updateAppearancePreferences = createAction(
  '[Appearance] Update Appearance Preferences',
  props<{ preferences: Partial<UserPreferences> }>(),
);

export const updateAppearancePreferencesSuccess = createAction(
  '[Appearance] Update Appearance Preferences Success',
  props<{ preferences: UserPreferences }>(),
);

export const updateAppearancePreferencesFailure = createAction(
  '[Appearance] Update Appearance Preferences Failure',
  props<{ error: string }>(),
);

export const themeApplied = createAction(
  '[Appearance] Theme Applied',
  props<{ theme: 'light' | 'dark' | 'system' }>(),
);
