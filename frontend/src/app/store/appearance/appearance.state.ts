import { UserPreferences } from '../../dashboard/pages/settings/settings.service';

export interface AppearanceState {
  theme: UserPreferences['theme'];
  language: UserPreferences['language'];
  timezone: UserPreferences['timezone'];
  initialized: boolean;
}

export const initialAppearanceState: AppearanceState = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  initialized: false,
};

// Extract only appearance-related preferences from UserPreferences
export interface AppearancePreferences {
  theme: UserPreferences['theme'];
  language: UserPreferences['language'];
  timezone: UserPreferences['timezone'];
}
