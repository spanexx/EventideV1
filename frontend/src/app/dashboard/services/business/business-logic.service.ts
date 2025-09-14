import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { getStartOfWeek, getEndOfWeek, addDays, formatDateAsYYYYMMDD, calculateDurationInMinutes } from '../../utils/dashboard.utils';
import { AvailabilityService, CreateBulkAvailabilityDto } from '../availability.service';
import { DialogManagementService } from '../dialog/dialog-management.service';
import { CalendarOperationsService } from '../calendar/calendar-operations.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DateSelectArg } from '@fullcalendar/core';
import { Availability } from '../../models/availability.models';
import { DialogDataService } from '../dialog/dialog-data.service';

@Injectable({
  providedIn: 'root'
})
export class BusinessLogicService {
  constructor(
    private store: Store,
    private availabilityHttp: AvailabilityService,
    private dialogService: DialogManagementService,
    private calendarService: CalendarOperationsService,
    private dialogDataService: DialogDataService
  ) {}
  // Summary state for UI banner
  summary$ = new BehaviorSubject<{ created: number; skipped: number } | null>(null);

  clearSummary(): void {
    this.summary$.next(null);
  }

  /**
   * Calculate duration in minutes between two dates
   * @param start Start date
   * @param end End date
   * @returns Duration in minutes
   */
  calculateDurationInMinutes(start: Date, end: Date): number {
    return calculateDurationInMinutes(start, end);
  }

  /**
   * Refresh availability for the current user
   */
  refreshAvailability(): void {
    // Get the current user and refresh availability for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
        const today = new Date();
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: today
        }));
      }
    });
  }

  /**
   * Handle date selection for creating new availability slots
   * @param selectInfo The date selection information
   * @param availability$ Observable of availability data
   * @param dialogService Dialog management service
   * @param calendarService Calendar operations service
   * @param snackbarService Snackbar service for notifications
   */
  handleDateSelection(
    selectInfo: DateSelectArg,
    availability$: Observable<Availability[]>,
    dialogService: DialogManagementService,
    calendarService: CalendarOperationsService,
    snackbarService: SnackbarService
  ): void {
    // Handle date selection for creating new availability slots
    // Check if a dialog is already open
    if (dialogService.isAvailabilityDialogOpen()) {
      dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    // Prevent event propagation
    if (selectInfo.jsEvent) {
      selectInfo.jsEvent.preventDefault();
      selectInfo.jsEvent.stopPropagation();
    }
    
    // Check if the selected date is in the past
    if (calendarService.isDateInPast(selectInfo.start)) {
      snackbarService.showError('Cannot create availability for past dates');
      return;
    }
    
    // Check if there's existing availability for this date
    calendarService.hasExistingAvailability(availability$, selectInfo.start).subscribe(hasExistingAvailability => {
      if (hasExistingAvailability) {
        // Show a confirmation dialog to ask if they want to proceed
        const dialogRef = dialogService.openConfirmationDialog({
          title: 'Existing Availability',
          message: 'There is already availability set for this date. Do you want to create additional slots?',
          confirmText: 'Continue',
          cancelText: 'Cancel'
        });
        
        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {
            // Proceed with opening the availability dialog
            this.openAvailabilityDialog(selectInfo, dialogService);
          }
        });
      } else {
        // No existing availability, proceed with opening the dialog
        this.openAvailabilityDialog(selectInfo, dialogService);
      }
    });
  }

  /**
   * Open the availability dialog with the provided selection info
   * @param selectInfo The date selection information
   * @param dialogService Dialog management service
   */
  private openAvailabilityDialog(selectInfo: DateSelectArg, dialogService: DialogManagementService) {
    console.log('Opening new availability dialog for date selection');
    const dialogRef = dialogService.openAvailabilityDialog({
      availability: null, 
      date: selectInfo.start,
      startDate: selectInfo.start,
      endDate: selectInfo.end,
      allDay: selectInfo.allDay
    });

    // Note: The component that calls this method should handle the afterClosed subscription
    // to dispatch the create action and refresh the calendar
  }

  /**
   * Render event content for the calendar
   * @param eventInfo The event information
   * @returns The rendered event content
   */
  renderEventContent(eventInfo: any) {
    // Calculate duration in minutes
    const start = new Date(eventInfo.event.start);
    const end = new Date(eventInfo.event.end);
    const duration = this.calculateDurationInMinutes(start, end);
    
    // Check if it's a recurring event
    const isRecurring = eventInfo.event.extendedProps?.isRecurring || false;
    const isBooked = eventInfo.event.extendedProps?.isBooked || false;
    
    // Create tooltip content
    const tooltipText = `${eventInfo.event.title}
${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
Duration: ${duration} minutes
${isRecurring ? 'Recurring' : 'One-time'}${isBooked ? ' (Booked)' : ''}`;
    
    return {
      html: `
        <div class="fc-event-main-frame" title="${tooltipText}">
          <div class="fc-event-time">${eventInfo.timeText}</div>
          <div class="fc-event-title-container">
            <div class="fc-event-title">${eventInfo.event.title}</div>
            <div class="fc-event-details">
              <span class="fc-event-duration">${duration} min</span>
              ${isRecurring ? '<span class="fc-event-recurring">🔁</span>' : ''}
            </div>
          </div>
        </div>
      `
    };
  }

  /**
   * Handle day cell rendering to provide visual feedback for dates with existing availability
   * @param info Information about the day cell being rendered
   * @param availability$ Observable of availability data
   * @param calendarService Calendar operations service
   */
  handleDayCellRender(
    info: any, 
    availability$: Observable<Availability[]>,
    calendarService: CalendarOperationsService
  ): void {
    // Get the date for this cell
    const cellDate = new Date(info.date);
    cellDate.setHours(0, 0, 0, 0);
    
    // Check if there's existing availability for this date
    availability$.subscribe((availability: Availability[]) => {
      const hasAvailability = availability.some(slot => {
        if (!slot.date && slot.startTime) {
          // For slots with only startTime, check if it's on the same date
          const slotDate = new Date(slot.startTime);
          slotDate.setHours(0, 0, 0, 0);
          return slotDate.getTime() === cellDate.getTime();
        } else if (slot.date) {
          // For slots with a date field, check if it matches
          const slotDate = new Date(slot.date);
          slotDate.setHours(0, 0, 0, 0);
          return slotDate.getTime() === cellDate.getTime();
        }
        return false;
      });
      
      // Add a class to indicate existing availability
      if (hasAvailability) {
        info.el.classList.add('has-availability');
      }
      
      // Check if the date is in the past
      if (calendarService.isDateInPast(cellDate)) {
        info.el.classList.add('past-date');
      }
    });
  }

  /**
   * Copy week schedule from source to target week
   * @param sourceWeek The source week date
   * @param targetWeek The target week date
   * @param availability$ Observable of availability data
   */
  copyWeekSchedule(sourceWeek: Date, targetWeek: Date, availability$: Observable<Availability[]>): void {
    // Get the start and end dates for the source week
    const sourceStart = getStartOfWeek(sourceWeek);
    const sourceEnd = getEndOfWeek(sourceWeek);
    
    // Get the start and end dates for the target week
    const targetStart = getStartOfWeek(targetWeek);
    
    // Calculate day offset between source and target weeks
    const msPerDay = 24 * 60 * 60 * 1000;
    const offsetDays = Math.round((targetStart.getTime() - sourceStart.getTime()) / msPerDay);
    
    // Get the current user and load availability for that user
    this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
      if (userId) {
        // Dispatch action to load availability for the source week
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: sourceStart
        }));
        
        // Get the source week's availability and validate bulk creation for the target week
        availability$.pipe(take(1)).subscribe((availability: Availability[]) => {
          // Filter for slots in the source week
          const sourceWeekSlots = availability.filter(slot => {
            const slotDate = new Date(slot.date || slot.startTime);
            return slotDate >= sourceStart && slotDate <= sourceEnd;
          });
          
          // Prepare bulk payload
          const slots = sourceWeekSlots.map(slot => {
            const startTime = addDays(new Date(slot.startTime), offsetDays);
            const endTime = addDays(new Date(slot.endTime), offsetDays);
            const date = slot.date ? formatDateAsYYYYMMDD(addDays(new Date(slot.date), offsetDays)) : undefined;
            return {
              startTime,
              endTime,
              duration: slot.duration,
              date
            } as any;
          });

          const idempotencyKey = this.availabilityHttp.generateIdempotencyKey('copy-week');
          const validatePayload: CreateBulkAvailabilityDto = {
            providerId: userId,
            type: 'one_off',
            slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
            dryRun: true,
            idempotencyKey
          } as any;

          // Validate first
          this.availabilityHttp.validateAvailability(validatePayload).pipe(take(1)).subscribe(validation => {
            const conflictsCount = validation?.conflicts?.length || 0;
            if (conflictsCount > 0) {
              const dialogRef = this.dialogService.openConflictResolutionDialog({
                count: conflictsCount,
                conflicts: validation.conflicts,
                suggestions: validation.suggestions
              });
              dialogRef.afterClosed().pipe(take(1)).subscribe((choice: any) => {
                if (choice === true) {
                  // Replace
                  this.availabilityHttp.createBulkAvailability({
                    providerId: userId,
                    type: 'one_off',
                    slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
                    replaceConflicts: true,
                    idempotencyKey
                  } as any).pipe(take(1)).subscribe((res: any) => {
                    const createdCount = Array.isArray(res) ? res.length : (res?.created?.length || 0);
                    const skippedCount = Array.isArray(res) ? 0 : (res?.conflicts?.length || 0);
                    this.summary$.next({ created: createdCount, skipped: skippedCount });
                    // Summarize and refresh
                    this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetStart }));
                  });
                } else if (choice === 'edit') {
                  // For now, use first suggestion as a quick fix for all conflicts
                  const adjusted = slots.slice();
                  (validation.suggestions || []).forEach((sug: any, idx: number) => {
                    if (adjusted[idx]) {
                      adjusted[idx].startTime = sug.alternative.startTime;
                      adjusted[idx].endTime = sug.alternative.endTime;
                    }
                  });
                  this.availabilityHttp.createBulkAvailability({
                    providerId: userId,
                    type: 'one_off',
                    slots: adjusted.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
                    idempotencyKey
                  } as any).pipe(take(1)).subscribe((res: any) => {
                    const createdCount = Array.isArray(res) ? res.length : (res?.created?.length || 0);
                    const skippedCount = Array.isArray(res) ? 0 : (res?.conflicts?.length || 0);
                    this.summary$.next({ created: createdCount, skipped: skippedCount });
                    this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetStart }));
                  });
                } else {
                  // Cancel
                }
              });
            } else {
              // No conflicts, proceed to create
              this.availabilityHttp.createBulkAvailability({
                providerId: userId,
                type: 'one_off',
                slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, duration: s.duration })),
                idempotencyKey
              } as any).pipe(take(1)).subscribe((res: any) => {
                const createdCount = Array.isArray(res) ? res.length : (res?.created?.length || 0);
                const skippedCount = Array.isArray(res) ? 0 : (res?.conflicts?.length || 0);
                this.summary$.next({ created: createdCount, skipped: skippedCount });
                this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetStart }));
              });
            }
          });
        });
      }
    });
  }

  /**
   * Open date picker
   * @param calendarComponent The calendar component
   * @param date The date to go to
   */
  openDatePicker(calendarComponent: any, date: Date): void {
    if (calendarComponent) {
      const calendarApi = calendarComponent.getApi();
      // Check if calendarApi is available before using it
      if (calendarApi) {
        calendarApi.gotoDate(date);
      }
    }
  }
}