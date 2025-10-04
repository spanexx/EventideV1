import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map, filter, distinctUntilChanged, tap, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { CalendarView } from '../models/calendar.models';
import { CalendarStateService } from './calendar-state.service';
import { CalendarPreferencesSignalService } from './calendar-preferences-signal.service';
import * as CalendarSelectors from '../store-calendar/selectors/calendar.selectors';

@Injectable({
  providedIn: 'root'
})
export class CalendarStateCoordinatorService {
  // Convert preferences signal to observable for combination
  private readonly preferences$: Observable<any>;

  constructor(
    private store: Store,
    private calendarStateService: CalendarStateService,
    private calendarPreferencesSignalService: CalendarPreferencesSignalService
  ) {
    // Convert signal to observable in constructor (injection context)
    this.preferences$ = toObservable(this.calendarPreferencesSignalService.preferences);
    this.initializeViewSynchronization();
  }

  /**
   * Initialize synchronization between current view and preferred view
   * This ensures that view changes are saved as preferences when appropriate
   */
  private initializeViewSynchronization(): void {
    console.log('[CalendarStateCoordinatorService] Initializing view synchronization');

    // Combine current view from state with preference settings
    const viewSync$ = combineLatest([
      this.store.select(CalendarSelectors.selectCurrentView),
      this.preferences$
    ]).pipe(
      filter(([currentView, preferences]) => !!currentView && !!preferences),
      distinctUntilChanged(([prevView, prevPrefs], [currView, currPrefs]) => 
        prevView === currView && prevPrefs?.rememberLastView === currPrefs?.rememberLastView
      ),
      tap(([currentView, preferences]) => {
        console.log('[CalendarStateCoordinatorService] View sync:', { currentView, rememberLastView: preferences?.rememberLastView });
        
        // If "remember last view" is enabled, save the current view as preferred
        if (preferences?.rememberLastView && currentView !== preferences?.defaultView) {
          console.log('[CalendarStateCoordinatorService] Updating preferred view due to view change:', currentView);
          this.calendarPreferencesSignalService.setPreferredView(currentView).subscribe({
            next: () => console.log('[CalendarStateCoordinatorService] Successfully updated preferred view'),
            error: (error) => console.error('[CalendarStateCoordinatorService] Failed to update preferred view:', error)
          });
        }
      })
    );

    // Subscribe to maintain the synchronization
    viewSync$.subscribe();
  }

  /**
   * Manually set the preferred view and update both state and preferences
   * @param view The view to set as preferred
   */
  setPreferredView(view: CalendarView): Observable<void> {
    console.log('[CalendarStateCoordinatorService] Setting preferred view:', view);
    
    // Update state first
    this.calendarStateService.setPreferredView(view);
    
    // Then update preferences
    return this.calendarPreferencesSignalService.setPreferredView(view);
  }

  /**
   * Apply the user's preferred view to the calendar
   * @param currentView The current calendar view for comparison
   */
  applyPreferredView(currentView?: CalendarView): void {
    const preferredView = this.calendarPreferencesSignalService.getPreferredView();
    
    if (preferredView && preferredView !== currentView) {
      console.log('[CalendarStateCoordinatorService] Applying preferred view:', preferredView);
      this.calendarStateService.setView(preferredView);
    }
  }

  /**
   * Get reactive preferences for components to use
   */
  getPreferencesSignals() {
    return this.calendarStateService.getPreferencesSignals();
  }

  /**
   * Check if auto-view switching should be applied based on content
   * @param recommendedView The view recommended by smart calendar analysis
   * @param currentView The current calendar view
   */
  shouldApplySmartView(recommendedView: CalendarView, currentView: CalendarView): boolean {
    const preferences = this.calendarPreferencesSignalService.getPreferences();
    
    // Only apply if auto-switch is enabled and views are different
    return preferences.autoSwitchView && recommendedView !== currentView;
  }

  /**
   * Apply a smart-recommended view if auto-switch is enabled
   * @param recommendedView The view recommended by smart calendar analysis
   */
  applySmartView(recommendedView: CalendarView): void {
    this.store.select(CalendarSelectors.selectCurrentView).pipe(
      take(1)
    ).subscribe(currentView => {
      if (this.shouldApplySmartView(recommendedView, currentView)) {
        console.log('[CalendarStateCoordinatorService] Applying smart-recommended view:', recommendedView);
        this.calendarStateService.setView(recommendedView);
      }
    });
  }

  /**
   * Toggle a specific preference setting
   * @param setting The preference setting to toggle
   */
  togglePreference(setting: 'autoSwitchView' | 'rememberLastView' | 'smartRecommendations'): Observable<void> {
    const current = this.calendarPreferencesSignalService.getPreferences();
    const newValue = !current[setting];
    
    console.log('[CalendarStateCoordinatorService] Toggling preference:', setting, 'to', newValue);
    return this.calendarPreferencesSignalService.updateSetting(setting, newValue);
  }
}