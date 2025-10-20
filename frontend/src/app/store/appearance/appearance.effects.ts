import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  concatMap,
  exhaustMap,
  map,
  mergeMap,
  of,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';

import {
  loadAppearancePreferences,
  loadAppearancePreferencesSuccess,
  loadAppearancePreferencesFailure,
  updateAppearancePreferences,
  updateAppearancePreferencesSuccess,
  updateAppearancePreferencesFailure,
  updateTheme,
  updateLanguage,
  updateTimezone,
  themeApplied,
} from './appearance.actions';
import {
  selectTheme,
  selectLanguage,
  selectTimezone,
  selectAppearancePreferences,
} from './appearance.selectors';
import { SettingsService } from '../../dashboard/pages/settings/settings.service';

@Injectable()
export class AppearanceEffects {
  

  // Declare effect properties; initialize them in the constructor to avoid
  // referencing `this.actions$` before Angular assigns constructor param properties.
  loadAppearancePreferences$ = undefined as any;
  updateAppearancePreferences$ = undefined as any;
  updateTheme$ = undefined as any;
  updateLanguage$ = undefined as any;
  updateTimezone$ = undefined as any;
  themeApplied$ = undefined as any;

  constructor(
    private actions$: Actions,
    private settingsService: SettingsService,
    private store: Store,
  ) {
    // Initialize effects here so `this.actions$` is defined
    this.loadAppearancePreferences$ = createEffect(() =>
      this.actions$.pipe(
        ofType(loadAppearancePreferences),
        tap(() => console.debug('[AppearanceEffects] loadAppearancePreferences action received')),
        exhaustMap(() =>
          this.settingsService.getPreferences().pipe(
            map((preferences) => loadAppearancePreferencesSuccess({ preferences })),
            catchError((error) => of(loadAppearancePreferencesFailure({ error: error.message }))),
          ),
        ),
      ),
    );

    this.updateAppearancePreferences$ = createEffect(() =>
      this.actions$.pipe(
        ofType(updateAppearancePreferences),
        tap(() => console.debug('[AppearanceEffects] updateAppearancePreferences action received')),
        exhaustMap(({ preferences }) =>
          this.settingsService.updatePreferences(preferences).pipe(
            map((updatedPreferences) =>
              updateAppearancePreferencesSuccess({ preferences: updatedPreferences }),
            ),
            catchError((error) => of(updateAppearancePreferencesFailure({ error: error.message }))),
          ),
        ),
      ),
    );

    this.updateTheme$ = createEffect(() =>
      this.actions$.pipe(
        ofType(updateTheme),
        tap(({ theme }) => console.debug('[AppearanceEffects] updateTheme action', theme)),
        switchMap((action) =>
          this.store.select(selectAppearancePreferences).pipe(
            take(1), // Only take the first emission then complete
            map((currentPrefs) => ({
              ...currentPrefs,
              theme: action.theme,
            })),
          ),
        ),
        switchMap((preferences) =>
          this.settingsService.updatePreferences(preferences).pipe(
            map((updatedPreferences) =>
              updateAppearancePreferencesSuccess({ preferences: updatedPreferences }),
            ),
            catchError((error) => of(updateAppearancePreferencesFailure({ error: error.message }))),
          ),
        ),
      ),
    );

    this.updateLanguage$ = createEffect(() =>
      this.actions$.pipe(
        ofType(updateLanguage),
        tap(({ language }) => console.debug('[AppearanceEffects] updateLanguage action', language)),
        switchMap((action) =>
          this.store.select(selectAppearancePreferences).pipe(
            take(1), // Only take the first emission then complete
            map((currentPrefs) => ({
              ...currentPrefs,
              language: action.language,
            })),
          ),
        ),
        switchMap((preferences) =>
          this.settingsService.updatePreferences(preferences).pipe(
            map((updatedPreferences) =>
              updateAppearancePreferencesSuccess({ preferences: updatedPreferences }),
            ),
            catchError((error) => of(updateAppearancePreferencesFailure({ error: error.message }))),
          ),
        ),
      ),
    );

    this.updateTimezone$ = createEffect(() =>
      this.actions$.pipe(
        ofType(updateTimezone),
        tap(({ timezone }) => console.debug('[AppearanceEffects] updateTimezone action', timezone)),
        switchMap((action) =>
          this.store.select(selectAppearancePreferences).pipe(
            take(1), // Only take the first emission then complete
            map((currentPrefs) => ({
              ...currentPrefs,
              timezone: action.timezone,
            })),
          ),
        ),
        switchMap((preferences) =>
          this.settingsService.updatePreferences(preferences).pipe(
            map((updatedPreferences) =>
              updateAppearancePreferencesSuccess({ preferences: updatedPreferences }),
            ),
            catchError((error) => of(updateAppearancePreferencesFailure({ error: error.message }))),
          ),
        ),
      ),
    );
    // Initialize themeApplied$ in the constructor to ensure actions$ is available
    this.themeApplied$ = createEffect(
      () =>
        this.actions$.pipe(
          ofType(themeApplied),
          tap(({ theme }) => {
            console.debug('[AppearanceEffects] themeApplied', theme);
            // Apply theme to document body
            document.body.classList.remove('light-theme', 'dark-theme');

            if (theme === 'light') {
              document.body.classList.add('light-theme');
            } else if (theme === 'dark') {
              document.body.classList.add('dark-theme');
            } else if (theme === 'system') {
              // For system theme, detect and apply the appropriate theme
              const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
            }
          }),
        ),
      { dispatch: false }, // Don't dispatch a new action after this effect
    );
  }

}
