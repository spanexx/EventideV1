import { Injectable } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { CalendarService } from '../../pages/availability/calendar/calendar.service';
import { BusinessLogicService } from '../business/business-logic.service';
import { DialogManagementService } from '../dialog/dialog-management.service';
import { DialogDataService } from '../dialog/dialog-data.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityUiService {
  constructor(
    private store: Store,
    private calendarManager: CalendarService,
    private businessLogicService: BusinessLogicService,
    private dialogService: DialogManagementService,
    private dialogDataService: DialogDataService
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
  }

  /**
   * Check if a view is active
   * @param calendarComponent The FullCalendar component
   * @param view The view to check
   * @returns True if the view is active, false otherwise
   */
  isViewActive(
    calendarComponent: FullCalendarComponent | undefined,
    view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  ): boolean {
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      if (calendarApi) {
        return calendarApi.view.type === view;
      }
    }
    return false;
  }

  /**
   * Refresh the availability data
   */
  refreshAvailability(): void {
    this.businessLogicService.refreshAvailability();
  }

  /**
   * Open the date picker dialog
   * @param calendarComponent The FullCalendar component
   */
  openDatePicker(calendarComponent: FullCalendarComponent | undefined): void {
    const dialogRef = this.dialogService.openDatePickerDialog(
      this.dialogDataService.prepareDatePickerDialogData(new Date())
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && calendarComponent) {
        this.businessLogicService.openDatePicker(calendarComponent, result);
      }
    });
  }

  /**
   * Copy an availability slot to the clipboard
   * @param slots The slots to copy
   * @param clipboardService The clipboard service
   */
  copySlots(slots: Availability[], clipboardService: any): void {
    clipboardService.copySlots(slots);
    console.log('Copied slots:', slots);
  }

  /**
   * Dismiss the summary banner
   */
  dismissSummary(): void {
    this.businessLogicService.clearSummary();
  }

  /**
   * Open the copy week dialog
   * @param dialogService The dialog management service
   */
  openCopyWeekDialog(dialogService: DialogManagementService): void {
    const dialogRef = dialogService.openCopyWeekDialog();

    dialogRef.afterClosed().subscribe((result: { sourceWeek: Date, targetWeek: Date, conflictResolution: 'skip' | 'replace' }) => {
      if (result) {
        // Handle the copy week result
        // This would typically be handled in the component or delegated to another service
      }
    });
  }

  /**
   * Add a new availability slot
   * @param dialogService The dialog management service
   * @param dialogDataService The dialog data service
   */
  addAvailability(
    dialogService: DialogManagementService,
    dialogDataService: DialogDataService
  ): void {
    const today = new Date();
    // Check if a dialog is already open
    if (dialogService.isAvailabilityDialogOpen()) {
      dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    console.log('Opening new availability dialog');
    const dialogRef = dialogService.openAvailabilityDialog({
      availability: null, 
      date: today,
      startDate: today,
      endDate: new Date(today.getTime() + 60 * 60 * 1000) // Add 1 hour
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      if (result) {
        // Handle the result
        // This would typically be handled in the component
      }
    });
  }
}