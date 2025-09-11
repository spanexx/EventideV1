import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import * as AvailabilitySelectors from '../../store-availability/selectors/availability.selectors';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../../services/availability.service';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../../services/dialog/dialog-management.service';
import { CalendarOperationsService } from '../../services/calendar/calendar-operations.service';
import { HistoryManagementService } from '../../services/history/history-management.service';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { DialogDataService } from '../../services/dialog/dialog-data.service';
import { BusinessLogicService } from '../../services/business/business-logic.service';
import { calculateDurationInMinutes } from '../../utils/dashboard.utils';
import { renderEventContent, handleDayCellRender } from '../../utils/calendar-rendering.utils';
import { CalendarService } from './calendar/calendar.service';
import { CalendarEventsService } from './calendar/calendar-events.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss'
})
export class AvailabilityComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @ViewChild('contextMenu') contextMenu!: MatMenu;
  @ViewChild(MatMenuTrigger) contextMenuTrigger!: MatMenuTrigger;
  
  contextMenuPosition = { x: 0, y: 0 };
  
  availability$: Observable<Availability[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  summary$!: Observable<{ created: number; skipped: number } | null>;
  selectedSlot: Availability | null = null;
  
  // History management
  private history: Availability[][] = [];
  private historyIndex = -1;
  private readonly MAX_HISTORY = 50;
  
  // Throttling for history updates
  private lastHistorySaveTime = 0;
  private readonly HISTORY_SAVE_THROTTLE = 1000; // 1 second

  calendarOptions: any;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private availabilityService: AvailabilityService,
    private snackbarService: SnackbarService,
    private dialogService: DialogManagementService,
    private calendarService: CalendarOperationsService,
    private historyService: HistoryManagementService,
    private keyboardShortcutService: KeyboardShortcutService,
    private dialogDataService: DialogDataService,
    private businessLogicService: BusinessLogicService,
    private calendarManager: CalendarService,
    private calendarEvents: CalendarEventsService
  ) {
    this.availability$ = this.store.select(AvailabilitySelectors.selectAvailability);
    this.loading$ = this.store.select(AvailabilitySelectors.selectAvailabilityLoading);
    this.error$ = this.store.select(AvailabilitySelectors.selectAvailabilityError);
    
    // Initialize calendar options
    this.calendarOptions = this.calendarManager.initializeCalendarOptions(
      this.handleDateSelect.bind(this),
      this.handleEventClick.bind(this),
      this.handleEvents.bind(this),
      this.renderEventContent.bind(this),
      this.handleDayCellRender.bind(this),
      this.handleEventResize.bind(this),
      this.handleEventDrop.bind(this),
      this.openDatePicker.bind(this),
      this.handleEventContextMenu.bind(this)
    );
    // Initialize summary stream after DI is available
    this.summary$ = this.businessLogicService.summary$;
  }

  ngOnInit(): void {
    // Load availability data
    const today = new Date();
    
    // Get the current user and load availability for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: today
        }));
      }
    });
    
    // Subscribe to availability updates and convert to calendar events
    let previousAvailability: Availability[] = [];
    this.availability$.subscribe(availability => {
      // Update the calendar with the new availability data
      this.calendarManager.updateCalendarWithAvailability(
        this.calendarComponent,
        availability,
        previousAvailability,
        this.updateSingleCalendarEvent.bind(this),
        this.refreshFullCalendar.bind(this),
        this.getChangedEvents.bind(this)
      );
      
      // Save previous state for comparison
      previousAvailability = [...availability];
      
      // Save to history for undo/redo functionality with throttling
      this.saveHistoryWithThrottling(availability);
    });
    
    // Subscribe to error updates and show snackbar notifications
    this.error$.subscribe(error => {
      if (error) {
        this.snackbarService.showError('Error loading availability: ' + error);
      }
    });
  }

  // Event handlers
  handleDateSelect(selectInfo: DateSelectArg) {
    // Handle date selection for creating new availability slots
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    // Prevent event propagation
    if (selectInfo.jsEvent) {
      selectInfo.jsEvent.preventDefault();
      selectInfo.jsEvent.stopPropagation();
    }
    
    // Check if the selected date is in the past
    if (this.calendarService.isDateInPast(selectInfo.start)) {
      this.snackbarService.showError('Cannot create availability for past dates');
      return;
    }
    
    // Check if there's existing availability for this date
    this.calendarService.hasExistingAvailability(this.availability$, selectInfo.start).subscribe(hasExistingAvailability => {
      if (hasExistingAvailability) {
        // Show a confirmation dialog to ask if they want to proceed
        const dialogRef = this.dialogService.openConfirmationDialog({
          title: 'Existing Availability',
          message: 'There is already availability set for this date. Do you want to create additional slots?',
          confirmText: 'Continue',
          cancelText: 'Cancel'
        });
        
        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {
            // Proceed with opening the availability dialog
            this.openAvailabilityDialog(selectInfo);
          }
        });
      } else {
        // No existing availability, proceed with opening the dialog
        this.openAvailabilityDialog(selectInfo);
      }
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    // Handle event click for editing availability slots
    this.calendarEvents.handleEventClick(clickInfo, this.availability$, this.selectedSlot).subscribe(slot => {
      if (slot) {
        // Store the selected slot
        this.selectedSlot = slot;
        // Prevent edits/deletes for past-day slots
        const slotDay = new Date(slot.startTime);
        slotDay.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        const isPastDay = slotDay < today;
        
        // Check if it's a right click
        if (clickInfo.jsEvent.which === 3 || clickInfo.jsEvent.button === 2) {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
            return;
          }
          this.showContextMenu(clickInfo.jsEvent);
        } 
        // Check if it's a Ctrl/Meta click (alternative delete)
        else if (clickInfo.jsEvent.ctrlKey || clickInfo.jsEvent.metaKey) {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
          } else {
            if (confirm('Are you sure you want to delete this availability slot?')) {
              this.store.dispatch(AvailabilityActions.deleteAvailability({ id: slot.id }));
            }
          }
        } else {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
          } else {
            // Edit the slot
            this.editSlot();
          }
        }
      }
    });
  }

  handleEventContextMenu(e: MouseEvent, info: any) {
    // Select the slot based on the event id
    this.availability$.subscribe(av => {
      const slot = av.find(a => a.id === info.event.id);
      if (slot) {
        this.selectedSlot = slot;
        this.showContextMenu(e);
      }
    }).unsubscribe();
  }

  handleEvents(events: EventApi[]) {
    // Handle events update
    // This method is called when events are updated in the calendar
    // No specific action needed here as the state is managed by NgRx
    // But we can add any necessary logic here if needed
  }

  handleEventResize(resizeInfo: any) {
    // Log performance metrics and handle event resize
    this.calendarEvents.handleCalendarEvent('resize', resizeInfo, (info) => 
      this.calendarEvents.handleEventResize(info, this.availability$, calculateDurationInMinutes)
    );
  }

  handleEventDrop(dropInfo: any) {
    // Log performance metrics and handle event drop
    this.calendarEvents.handleCalendarEvent('drop', dropInfo, (info) => 
      this.calendarEvents.handleEventDrop(info, this.availability$)
    );
  }

  // Calendar update methods
  private refreshFullCalendar(availability: Availability[]): void {
    this.calendarManager.refreshFullCalendar(this.calendarComponent, availability);
  }

  private updateSingleCalendarEvent(updatedSlot: Availability): void {
    this.calendarManager.updateSingleCalendarEvent(this.calendarComponent, updatedSlot);
  }

  // Utility methods
  refreshAvailability(): void {
    this.businessLogicService.refreshAvailability();
  }

  dismissSummary(): void {
    this.businessLogicService.clearSummary();
  }

  /**
   * Save to history with throttling to prevent excessive memory usage during drag operations
   * @param availability The current availability state
   */
  private saveHistoryWithThrottling(availability: Availability[]): void {
    const currentTime = Date.now();
    // Only save to history if enough time has passed since the last save
    if (currentTime - this.lastHistorySaveTime > this.HISTORY_SAVE_THROTTLE) {
      this.historyService.saveToHistory(availability);
      this.lastHistorySaveTime = currentTime;
    }
  }

  undo(): void {
    const prevState = this.historyService.getPreviousState();
    if (prevState) {
      // Update the calendar with the previous state
      if (this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          const events = this.availabilityService.convertToCalendarEvents(prevState);
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }
      }
    }
  }

  /**
   * Compare two arrays of availability slots and return the changed events
   * @param previous Previous availability state
   * @param current Current availability state
   * @returns Array of changed availability slots
   */
  private getChangedEvents(previous: Availability[], current: Availability[]): Availability[] {
    const changed: Availability[] = [];
    
    // Create a map of previous events for quick lookup
    const previousMap = new Map<string, Availability>();
    previous.forEach(slot => previousMap.set(slot.id, slot));
    
    // Check each current event
    current.forEach(slot => {
      const previousSlot = previousMap.get(slot.id);
      // If there's no previous slot or the slot has changed, add it to changed events
      if (!previousSlot || 
          previousSlot.startTime.getTime() !== slot.startTime.getTime() ||
          previousSlot.endTime.getTime() !== slot.endTime.getTime() ||
          previousSlot.isBooked !== slot.isBooked) {
        changed.push(slot);
      }
    });
    
    return changed;
  }

  redo(): void {
    const nextState = this.historyService.getNextState();
    if (nextState) {
      // Update the calendar with the next state
      if (this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          const events = this.availabilityService.convertToCalendarEvents(nextState);
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }
      }
    }
  }

  canUndo(): boolean {
    return this.historyService.canUndo();
  }

  canRedo(): boolean {
    return this.historyService.canRedo();
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only handle shortcuts when the calendar is focused
    if (!this.keyboardShortcutService.isCalendarFocused(event)) {
      return;
    }
    
    // Handle the specific keyboard shortcut
    this.handleKeyboardShortcut(event);
  }

  /**
   * Handle keyboard shortcuts for the availability calendar
   * @param event KeyboardEvent to handle
   */
  private handleKeyboardShortcut(event: KeyboardEvent): void {
    // Ctrl/Cmd + Z - Undo
    if (this.keyboardShortcutService.isUndoShortcut(event)) {
      event.preventDefault();
      this.undo();
      return;
    }
    
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
    if (this.keyboardShortcutService.isRedoShortcut(event)) {
      event.preventDefault();
      this.redo();
      return;
    }
    
    // R - Refresh
    if (this.keyboardShortcutService.isRefreshShortcut(event)) {
      event.preventDefault();
      this.refreshAvailability();
      return;
    }
    
    // C - Copy week
    if (this.keyboardShortcutService.isCopyWeekShortcut(event)) {
      event.preventDefault();
      this.copyWeekSchedule();
      return;
    }
    
    // A - Add availability
    if (this.keyboardShortcutService.isAddAvailabilityShortcut(event)) {
      event.preventDefault();
      this.handleAddAvailabilityShortcut();
      return;
    }
    
    // F5 - Refresh (standard browser refresh)
    if (this.keyboardShortcutService.isF5RefreshShortcut(event)) {
      event.preventDefault();
      this.refreshAvailability();
      return;
    }
  }

  /**
   * Handle the add availability keyboard shortcut
   */
  private handleAddAvailabilityShortcut(): void {
    // Check if a dialog is already open
    if (this.keyboardShortcutService.isAvailabilityDialogOpen()) {
      this.keyboardShortcutService.focusExistingAvailabilityDialog();
      return;
    }
    
    console.log('Opening new availability dialog via keyboard shortcut');
    // Open the add availability dialog with today's date
    const today = new Date();
    const dialogRef = this.dialogService.openAvailabilityDialog(
      this.dialogDataService.prepareAvailabilityDialogData(
        null, 
        today,
        today,
        new Date(today.getTime() + 60 * 60 * 1000) // Add 1 hour
      )
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      if (result) {
        // Ensure calendar refreshes for the relevant week after creation
        const fallback = new Date();
        const targetDate: Date = Array.isArray(result) && result.length > 0
          ? new Date(result[0].startTime || result[0].date || fallback)
          : fallback;
        this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
          if (userId) {
            this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetDate }));
          }
        });
      }
    });
  }

  copyWeekSchedule(): void {
    const dialogRef = this.dialogService.openCopyWeekDialog(this.dialogDataService.prepareCopyWeekDialogData());

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.businessLogicService.copyWeekSchedule(result.sourceWeek, result.targetWeek, this.availability$);
      }
    });
  }

  openDatePicker(): void {
    const dialogRef = this.dialogService.openDatePickerDialog(
      this.dialogDataService.prepareDatePickerDialogData(new Date())
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && this.calendarComponent) {
        this.businessLogicService.openDatePicker(this.calendarComponent, result);
      }
    });
  }

  renderEventContent(eventInfo: any) {
    return renderEventContent(eventInfo, calculateDurationInMinutes);
  }

  /**
   * Handle day cell rendering to provide visual feedback for dates with existing availability
   * @param info Information about the day cell being rendered
   */
  handleDayCellRender(info: any) {
    handleDayCellRender(info, this.availability$, this.calendarService.isDateInPast.bind(this.calendarService));
  }

  showContextMenu(event: MouseEvent) {
    // Prevent the browser's default context menu
    event.preventDefault();
    
    // Set the position for the context menu
    this.contextMenuPosition.x = event.clientX;
    this.contextMenuPosition.y = event.clientY;
    
    // Open the context menu at the mouse position
    this.calendarManager.openContextMenuAtPosition(this.contextMenuTrigger, event);
  }

  editSlot() {
    if (this.selectedSlot) {
      // Check if a dialog is already open
      if (this.dialogService.isAvailabilityDialogOpen()) {
        this.dialogService.focusExistingAvailabilityDialog();
        return;
      }
      
      console.log('Opening edit availability dialog for slot:', this.selectedSlot);
      const dialogRef = this.dialogService.openAvailabilityDialog({
        availability: this.selectedSlot, 
        date: this.selectedSlot.date
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        console.log('Dialog closed with result:', result);
        if (result) {
          // The dialog component will dispatch the update action
          // No additional action needed here
        }
      });
    }
  }

  deleteSlot() {
    if (this.selectedSlot) {
      const dialogRef = this.dialogService.openConfirmationDialog({
        title: 'Delete Availability Slot',
        message: 'Are you sure you want to delete this availability slot? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.store.dispatch(AvailabilityActions.deleteAvailability({ id: this.selectedSlot!.id }));
        }
      });
    }
  }

  /**
   * Opens the availability dialog to add a new availability slot
   */
  addAvailability(): void {
    const today = new Date();
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    console.log('Opening new availability dialog');
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: null, 
      date: today,
      startDate: today,
      endDate: new Date(today.getTime() + 60 * 60 * 1000) // Add 1 hour
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      if (result) {
        const targetDate: Date = Array.isArray(result) && result.length > 0
          ? new Date(result[0].startTime || result[0].date || today)
          : today;
        this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
          if (userId) {
            this.store.dispatch(AvailabilityActions.loadAvailability({ providerId: userId, date: targetDate }));
          }
        });
      }
    });
  }

  /**
   * Open the availability dialog with the provided selection info
   * @param selectInfo The date selection information
   */
  private openAvailabilityDialog(selectInfo: DateSelectArg) {
    console.log('Opening new availability dialog for date selection');
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: null, 
      date: selectInfo.start,
      startDate: selectInfo.start,
      endDate: selectInfo.end,
      allDay: selectInfo.allDay
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      if (result) {
        // The dialog component will dispatch the create action
        // No additional action needed here
      }
    });
  }
}