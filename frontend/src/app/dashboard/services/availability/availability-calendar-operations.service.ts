import { Injectable } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { Store } from '@ngrx/store';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { CalendarService } from '../../pages/availability/calendar/calendar.service';
import { CalendarStateService } from '../calendar-state.service';
import { SmartCalendarManagerService, SmartCalendarConfig } from '../smart-calendar-manager.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityCalendarOperationsService {
  constructor(
    private store: Store,
    private calendarManager: CalendarService,
    private calendarStateService: CalendarStateService,
    private smartCalendarManager: SmartCalendarManagerService
  ) {}

  /**
   * Navigate the calendar
   * @param calendarComponent The FullCalendar component
   * @param direction Direction to navigate ('prev', 'next', 'today')
   */
  navigateCalendar(
    calendarComponent: FullCalendarComponent | undefined,
    direction: 'prev' | 'next' | 'today'
  ): void {
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      if (calendarApi) {
        switch (direction) {
          case 'prev':
            calendarApi.prev();
            break;
          case 'next':
            calendarApi.next();
            break;
          case 'today':
            calendarApi.today();
            break;
        }
      }
    }
    
    // Update the calendar state service with the navigation
    this.calendarStateService.navigate(direction);
  }

  /**
   * Change the calendar view
   * @param calendarComponent The FullCalendar component
   * @param view The view to change to
   */
  changeView(
    calendarComponent: FullCalendarComponent | undefined,
    view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  ): void {
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      if (calendarApi) {
        calendarApi.changeView(view);
      }
    }
    
    // Update the calendar state service with the new view
    this.calendarStateService.setView(view);
    
    // Update the smart calendar manager with the new view
    const configUpdate: Partial<SmartCalendarConfig> = {
      viewType: view,
      contentDensity: 'medium',
      adaptiveDisplay: true,
      smartFiltering: true,
      contextualInfo: true
    };
    
    this.smartCalendarManager.updateConfig(configUpdate);
  }

  /**
   * Check if a view is active
   * @param calendarComponent The FullCalendar component
   * @param view The view to check
   * @param currentActiveView Track current active view
   * @param hasLoggedCalendarWarning Track if warning has been logged
   * @returns True if the view is active, false otherwise
   */
  isViewActive(
    calendarComponent: FullCalendarComponent | undefined,
    view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay',
    currentActiveView: string | null,
    hasLoggedCalendarWarning: boolean
  ): boolean {
    // Only check if we have a calendar component reference
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      if (calendarApi) {
        const isActive = calendarApi.view.type === view;
        // Only log when the view is actually active to reduce noise
        if (isActive) {
          // Use a more efficient approach - only update if the view has actually changed
          if (currentActiveView !== view) {
            // Update smart calendar manager with current active view
            const configUpdate: Partial<SmartCalendarConfig> = {
              viewType: view,
              contentDensity: 'medium',
              adaptiveDisplay: true,
              smartFiltering: true,
              contextualInfo: true
            };
            
            this.smartCalendarManager.updateConfig(configUpdate);
          }
        }
        return isActive;
      }
    }
    return false;
  }
}