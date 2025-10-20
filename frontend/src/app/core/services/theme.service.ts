import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';
import { isPlatformBrowser } from '@angular/common';
import { selectTheme } from '../../store/appearance/appearance.selectors';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { themeApplied } from '../../store/appearance/appearance.actions';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private currentThemeSubject = new BehaviorSubject<'light' | 'dark' | 'system'>('system');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(
    private store: Store,
    @Inject(PLATFORM_ID) private platformId: any,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      // Subscribe to theme changes from the store
      this.store
        .select(selectTheme)
        .pipe(takeUntil(this.destroy$))
        .subscribe((theme) => {
          this.currentThemeSubject.next(theme);
          this.applyTheme(theme);
        });
    }
  }

  /**
   * Apply the specified theme to the document
   * @param theme The theme to apply ('light', 'dark', or 'system')
   */
  applyTheme(theme: 'light' | 'dark' | 'system'): void {
    if (!this.isBrowser) {
      return;
    }

    // Remove existing theme classes
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

    // Dispatch action to indicate theme has been applied
    this.store.dispatch(themeApplied({ theme }));
  }

  /**
   * Get the current system theme preference
   */
  getCurrentSystemTheme(): 'light' | 'dark' {
    if (!this.isBrowser) {
      return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Listen for system theme changes
   */
  watchSystemThemeChanges(): void {
    if (!this.isBrowser) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // We'll reapply the theme which will respect the system preference
    const handler = (e: MediaQueryListEvent) => {
      const currentTheme = this.currentThemeSubject.value;
      if (currentTheme === 'system') {
        // Reapply system theme to reflect the new system preference
        this.applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      (mediaQuery as any).addListener(handler);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
