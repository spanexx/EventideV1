import { Component, OnInit, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as DashboardActions from '../../store/actions/dashboard.actions';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import * as DashboardSelectors from '../../store/selectors/dashboard.selectors';
import * as AvailabilitySelectors from '../../store-availability/selectors/availability.selectors';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../../services/availability.service';
import { AvailabilityDialogComponent } from '../../components/availability-dialog/availability-dialog.component';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../../services/dialog/dialog-management.service';
import { CalendarOperationsService } from '../../services/calendar/calendar-operations.service';
import { HistoryManagementService } from '../../services/history/history-management.service';
import { EventHandlingService } from '../../services/event/event-handling.service';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { DialogDataService } from '../../services/dialog/dialog-data.service';
import { BusinessLogicService } from '../../services/business/business-logic.service';
import { calculateDurationInMinutes, getStartOfWeek, getEndOfWeek, addDays, formatDateAsYYYYMMDD } from '../../utils/dashboard.utils';
import { renderEventContent, handleDayCellRender } from '../../utils/calendar-rendering.utils';

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
  
  // Performance logging
  private performanceLoggingEnabled = true;

  calendarOptions: CalendarOptions = this.initializeCalendarOptions();

  /**
   * Initialize calendar options
   * @returns CalendarOptions object with all configuration
   */
  private initializeCalendarOptions(): CalendarOptions {
    return {
      plugins: [
        interactionPlugin,
        dayGridPlugin,
        timeGridPlugin
      ],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,datePickerButton'
      },
      customButtons: {
        datePickerButton: {
          text: 'Go to date',
          click: this.openDatePicker.bind(this)
        }
      },
      initialView: 'timeGridWeek',
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      select: this.handleDateSelect.bind(this),
      eventClick: this.handleEventClick.bind(this),
      eventsSet: this.handleEvents.bind(this),
      eventContent: this.renderEventContent,
      eventClassNames: (arg) => {
        if (arg.event.extendedProps['isBooked']) {
          return ['event-booked'];
        }
        return ['event-available'];
      },
      // Custom rendering for days with availability
      dayCellDidMount: this.handleDayCellRender.bind(this),
      // Enable drag-to-resize functionality
      eventResizableFromStart: true,
      eventResize: this.handleEventResize.bind(this),
      // Enable drag-to-move functionality
      eventDrop: this.handleEventDrop.bind(this)
    };
  }

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private availabilityService: AvailabilityService,
    private snackbarService: SnackbarService,
    private dialogService: DialogManagementService,
    private calendarService: CalendarOperationsService,
    private historyService: HistoryManagementService,
    private eventHandlingService: EventHandlingService,
    private keyboardShortcutService: KeyboardShortcutService,
    private dialogDataService: DialogDataService,
    private businessLogicService: BusinessLogicService
  ) {
    this.availability$ = this.store.select(AvailabilitySelectors.selectAvailability);
    this.loading$ = this.store.select(AvailabilitySelectors.selectAvailabilityLoading);
    this.error$ = this.store.select(AvailabilitySelectors.selectAvailabilityError);
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
      this.updateCalendarWithAvailability(availability, previousAvailability);
      
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

  handleEventClick(clickInfo: EventClickArg) {
    // Handle event click for editing availability slots
    this.eventHandlingService.handleEventClick(clickInfo, this.availability$, this.selectedSlot).subscribe(slot => {
      if (slot) {
        // Store the selected slot
        this.selectedSlot = slot;
        
        // Check if it's a right click
        if (clickInfo.jsEvent.which === 3 || clickInfo.jsEvent.button === 2) {
          // Show context menu
          this.showContextMenu(clickInfo.jsEvent);
        } 
        // Check if it's a Ctrl/Meta click (alternative delete)
        else if (clickInfo.jsEvent.ctrlKey || clickInfo.jsEvent.metaKey) {
          // Delete the slot
          if (confirm('Are you sure you want to delete this availability slot?')) {
            this.store.dispatch(AvailabilityActions.deleteAvailability({ id: slot.id }));
          }
        } else {
          // Edit the slot
          this.editSlot();
        }
      }
    });
  }

  handleEvents(events: EventApi[]) {
    // Handle events update
    // This method is called when events are updated in the calendar
    // No specific action needed here as the state is managed by NgRx
    // But we can add any necessary logic here if needed
  }

  handleEventResize(resizeInfo: any) {
    // Log performance metrics and handle event resize
    this.handleCalendarEvent('resize', resizeInfo, (info) => 
      this.eventHandlingService.handleEventResize(info, this.availability$, calculateDurationInMinutes)
    );
  }

  handleEventDrop(dropInfo: any) {
    // Log performance metrics and handle event drop
    this.handleCalendarEvent('drop', dropInfo, (info) => 
      this.eventHandlingService.handleEventDrop(info, this.availability$)
    );
  }

  /**
   * Handle calendar events with logging
   * @param eventType Type of event (resize, drop, etc.)
   * @param eventInfo Event information
   * @param handler Function to handle the event
   */
  private handleCalendarEvent(
    eventType: string, 
    eventInfo: any, 
    handler: (info: any) => void
  ): void {
    // Log performance metrics
    if (this.performanceLoggingEnabled) {
      console.log(`[Performance] Handling event ${eventType} in AvailabilityComponent`, {
        eventId: eventInfo.event.id,
        start: eventInfo.event.start,
        end: eventInfo.event.end
      });
    }
    
    // Handle the event
    handler(eventInfo);
  }

  /**
   * Update the calendar with new availability data
   * @param availability Current availability data
   * @param previousAvailability Previous availability data for comparison
   */
  private updateCalendarWithAvailability(
    availability: Availability[], 
    previousAvailability: Availability[]
  ): void {
    // Use a small delay to ensure the calendar component is fully initialized
    setTimeout(() => {
      if (this.calendarComponent) {
        const calendarApi = this.calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          // Determine if this is a single event update by comparing with the previous state
          if (previousAvailability.length > 0) {
            // Check if only one event has changed
            const changedEvents = this.getChangedEvents(previousAvailability, availability);
            if (changedEvents.length === 1) {
              // Single event change, update only that event
              this.updateSingleCalendarEvent(changedEvents[0]);
            } else {
              // Multiple events changed or new events added, do full refresh
              this.refreshFullCalendar(availability);
            }
          } else {
            // Initial load, do full refresh
            this.refreshFullCalendar(availability);
          }
        }
      }
    }, 0);
  }

  /**
   * Refresh the entire calendar with new events
   * @param availability Current availability data
   */
  private refreshFullCalendar(availability: Availability[]): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        const events = this.availabilityService.convertToCalendarEvents(availability);
        calendarApi.removeAllEvents();
        calendarApi.addEventSource(events);
      }
    }
  }

  /**
   * Update a single event in the calendar without refreshing the entire calendar
   * This is more efficient during drag operations
   * @param updatedSlot The updated availability slot
   */
  private updateSingleCalendarEvent(updatedSlot: Availability): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        // Find the existing event and update it
        const existingEvent = calendarApi.getEventById(updatedSlot.id);
        if (existingEvent) {
          existingEvent.setDates(updatedSlot.startTime, updatedSlot.endTime);
          existingEvent.setProp('title', updatedSlot.isBooked ? 'Booked' : 'Available');
          existingEvent.setExtendedProp('isBooked', updatedSlot.isBooked);
          existingEvent.setExtendedProp('isRecurring', updatedSlot.type === 'recurring');
        }
      }
    }
  }

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
        // The dialog component will dispatch the create action
        // No additional action needed here
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
    this.openContextMenuAtPosition(event);
  }

  /**
   * Open the context menu at the specified position
   * @param event MouseEvent containing position information
   */
  private openContextMenuAtPosition(event: MouseEvent): void {
    if (this.contextMenuTrigger) {
      // Use setTimeout to ensure the position is set before opening
      setTimeout(() => {
        this.contextMenuTrigger.openMenu();
        // After opening, adjust the position with CSS
        const panel = document.querySelector('.mat-menu-panel');
        if (panel) {
          (panel as HTMLElement).style.position = 'fixed';
          (panel as HTMLElement).style.left = event.clientX + 'px';
          (panel as HTMLElement).style.top = event.clientY + 'px';
        }
      });
    }
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
        // The dialog component will dispatch the create action
        // No additional action needed here
      }
    });
  }
}
