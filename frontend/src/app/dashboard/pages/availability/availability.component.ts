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
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { DialogDataService } from '../../services/dialog/dialog-data.service';
import { BusinessLogicService } from '../../services/business/business-logic.service';
import { AvailabilityClipboardService } from '../../services/clipboard/availability-clipboard.service';
import { calculateDurationInMinutes } from '../../utils/dashboard.utils';
import { renderEventContent, handleDayCellRender } from '../../utils/calendar-rendering.utils';
import { CalendarService } from './calendar/calendar.service';
import { CalendarEventsService } from './calendar/calendar-events.service';
import { take } from 'rxjs/operators';

// Import our new pending changes services
import { 
  PendingChangesService, 
  ChangesSynchronizerService, 
  DragResizeService,
  Change
} from '../../services/pending-changes';

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
  
  selectedSlot: Availability | null = null;
  availability$: Observable<Availability[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  summary$!: Observable<{ created: number; skipped: number } | null>;
  
  // We're now using the PendingChangesService for state management
  pendingChangesCount: number = 0;

  calendarOptions: any;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private availabilityService: AvailabilityService,
    private snackbarService: SnackbarService,
    private dialogService: DialogManagementService,
    private calendarService: CalendarOperationsService,
    private keyboardShortcutService: KeyboardShortcutService,
    private dialogDataService: DialogDataService,
    private businessLogicService: BusinessLogicService,
    private calendarManager: CalendarService,
    private calendarEvents: CalendarEventsService,
    private clipboardService: AvailabilityClipboardService,
    // Inject our new services
    private pendingChangesService: PendingChangesService,
    private changesSynchronizerService: ChangesSynchronizerService,
    private dragResizeService: DragResizeService
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
    
    // Subscribe to pending changes to update the count
    this.pendingChangesService.pendingChanges$.subscribe(state => {
      this.pendingChangesCount = state.changes.length;
    });
    
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
      // Initialize the pending changes service with the original state
      if (previousAvailability.length === 0) {
        this.pendingChangesService.initialize(availability);
      }
      
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
    this.calendarEvents.handleEventClick(clickInfo, this.availability$).subscribe(slot => {
      if (slot) {
        // Set the selected slot for copy/paste operations
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
          this.showContextMenu(clickInfo.jsEvent, slot);
        } 
        // Check if it's a Ctrl/Meta click (alternative delete)
        else if (clickInfo.jsEvent.ctrlKey || clickInfo.jsEvent.metaKey) {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
          } else {
            if (confirm('Are you sure you want to delete this availability slot?')) {
              // Instead of directly deleting, add to pending changes
              const change: Change = {
                id: `delete-${slot.id}-${Date.now()}`,
                type: 'delete',
                entityId: slot.id,
                // For delete operations, we typically don't need the full entity
                timestamp: new Date()
              };
              this.pendingChangesService.addChange(change);
            }
          }
        } else {
          if (isPastDay) {
            this.snackbarService.showError('This slot is in the past and cannot be modified.');
          } else {
            // Edit the slot
            this.editSlot(slot);
          }
        }
      }
    });
  }

  handleEventContextMenu(event: MouseEvent, info: any) {
    // Prevent the browser's default context menu
    event.preventDefault();
    
    // Check if we clicked on an event or empty space
    const eventElement = event.target as HTMLElement;
    const isEventClick = eventElement.closest('.fc-event') !== null;
    
    if (isEventClick) {
      // Clicked on an event, find the slot
      this.availability$.pipe(take(1)).subscribe(av => {
        const slot = av.find(a => a.id === info.event.id);
        if (slot) {
          this.showContextMenu(event, slot);
        }
      });
    } else {
      // Clicked on empty space
      this.showContextMenu(event);
    }
  }

  handleEvents(events: EventApi[]) {
    // Handle events update
    // This method is called when events are updated in the calendar
    // No specific action needed here as the state is managed by NgRx
    // But we can add any necessary logic here if needed
  }

  handleEventResize(resizeInfo: any) {
    // Use our new drag resize service instead of the old one
    this.availability$.pipe(take(1)).subscribe(availability => {
      this.dragResizeService.handleEventResize(resizeInfo, availability);
    });
  }

  handleEventDrop(dropInfo: any) {
    // Use our new drag resize service instead of the old one
    this.availability$.pipe(take(1)).subscribe(availability => {
      this.dragResizeService.handleEventDrop(dropInfo, availability);
    });
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
    // Ctrl/Cmd + S - Save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.saveChanges();
      return;
    }
    
    // Ctrl/Cmd + C - Copy selected slot
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      if (this.selectedSlot) {
        this.copySlots([this.selectedSlot]);
      } else {
        this.snackbarService.showError('No slot selected to copy');
      }
      return;
    }
    
    // R - Refresh
    if (this.keyboardShortcutService.isRefreshShortcut(event)) {
      event.preventDefault();
      this.refreshAvailability();
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

  showContextMenu(event: MouseEvent, slot?: Availability) {
    // Prevent the browser's default context menu
    event.preventDefault();
    
    // Set the position for the context menu
    this.contextMenuPosition.x = event.clientX;
    this.contextMenuPosition.y = event.clientY;
    
    // Set the selected slot for copy/paste operations
    if (slot) {
      this.selectedSlot = slot;
      this.contextMenuTrigger.menuData = { slot };
    } else {
      this.selectedSlot = null;
    }
    
    // Open the context menu at the mouse position
    this.calendarManager.openContextMenuAtPosition(this.contextMenuTrigger, event);
  }

  editSlot(slot: Availability) {
    // Check if a dialog is already open
    if (this.dialogService.isAvailabilityDialogOpen()) {
      this.dialogService.focusExistingAvailabilityDialog();
      return;
    }
    
    console.log('Opening edit availability dialog for slot:', slot);
    const dialogRef = this.dialogService.openAvailabilityDialog({
      availability: slot, 
      date: slot.date
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      if (result) {
        // Instead of directly updating, add to pending changes
        if (result.id) {
          const change: Change = {
            id: `update-${result.id}-${Date.now()}`,
            type: 'update',
            entityId: result.id,
            entity: result,
            previousEntity: slot,
            timestamp: new Date()
          };
          this.pendingChangesService.addChange(change);
        }
      }
    });
  }

  /**
   * Copy an availability slot to the clipboard
   * @param slot The slot to copy
   */
  copySlots(slots: Availability[]): void {
    this.clipboardService.copySlots(slots);
    this.snackbarService.showSuccess('Slots copied to clipboard');
    console.log('Copied slots:', slots);
  }

  

  deleteSlot(slot: Availability) {
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Delete Availability Slot',
      message: 'Are you sure you want to delete this availability slot? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Instead of directly deleting, add to pending changes
        const change: Change = {
          id: `delete-${slot.id}-${Date.now()}`,
          type: 'delete',
          entityId: slot.id,
          // For delete operations, we typically don't need the full entity
          timestamp: new Date()
        };
        this.pendingChangesService.addChange(change);
      }
    });
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

  openCopyWeekDialog(): void {
    const dialogRef = this.dialogService.openCopyWeekDialog();

    dialogRef.afterClosed().subscribe((result: { sourceWeek: Date, targetWeek: Date, conflictResolution: 'skip' | 'replace' }) => {
      if (result) {
        this.handleCopyWeek(result);
      }
    });
  }

  private handleCopyWeek(result: { sourceWeek: Date, targetWeek: Date, conflictResolution: 'skip' | 'replace' }): void {
    const { sourceWeek, targetWeek, conflictResolution } = result;

    // 1. Get user ID
    this.store.select(AuthSelectors.selectUserId).pipe(take(1)).subscribe(userId => {
      if (!userId) {
        this.snackbarService.showError('User not found. Please log in again.');
        return;
      }

      // 2. Get current availability
      this.availability$.pipe(take(1)).subscribe(availability => {
        
        // 3. Filter slots from source week
        const sourceStartDate = new Date(sourceWeek);
        sourceStartDate.setDate(sourceStartDate.getDate() - sourceStartDate.getDay()); // Start of the week (Sunday)
        sourceStartDate.setHours(0, 0, 0, 0);

        const sourceEndDate = new Date(sourceStartDate);
        sourceEndDate.setDate(sourceEndDate.getDate() + 7); // End of the week (next Sunday)

        const sourceSlots = availability.filter(slot => {
          const slotDate = new Date(slot.startTime);
          return slotDate >= sourceStartDate && slotDate < sourceEndDate;
        });

        if (sourceSlots.length === 0) {
          this.snackbarService.showInfo('No availability slots found in the source week to copy.');
          return;
        }

        // 4. Calculate date offset
        const targetStartDate = new Date(targetWeek);
        targetStartDate.setDate(targetStartDate.getDate() - targetStartDate.getDay()); // Start of the target week (Sunday)
        targetStartDate.setHours(0, 0, 0, 0);
        
        const dateOffset = targetStartDate.getTime() - sourceStartDate.getTime();

        // 5. Create new slots for target week
        const newSlots = sourceSlots.map(slot => {
          const newStartTime = new Date(new Date(slot.startTime).getTime() + dateOffset);
          const newEndTime = new Date(new Date(slot.endTime).getTime() + dateOffset);
          
          // Create a new object without the id property for new slots
          const { id, ...newSlot } = {
            ...slot,
            startTime: newStartTime,
            endTime: newEndTime,
            date: newStartTime, // Ensure date is updated
            isBooked: false // Copied slots should not be booked
          };
          
          return newSlot as Availability;
        });

        // 6. Instead of directly calling the service, add to pending changes
        newSlots.forEach(slot => {
          const change: Change = {
            id: `create-${Date.now()}-${Math.random()}`,
            type: 'create',
            entity: slot,
            timestamp: new Date()
          };
          this.pendingChangesService.addChange(change);
        });

        this.snackbarService.showSuccess(`Copied ${newSlots.length} slots to pending changes. Click Save to apply.`);
      });
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
        // Instead of directly creating, add to pending changes
        if (Array.isArray(result)) {
          result.forEach(slot => {
            const change: Change = {
              id: `create-${Date.now()}-${Math.random()}`,
              type: 'create',
              entity: slot,
              timestamp: new Date()
            };
            this.pendingChangesService.addChange(change);
          });
        } else {
          const change: Change = {
            id: `create-${Date.now()}-${Math.random()}`,
            type: 'create',
            entity: result,
            timestamp: new Date()
          };
          this.pendingChangesService.addChange(change);
        }
      }
    });
  }

  /**
   * Save all pending changes
   */
  saveChanges(): void {
    const changes = this.pendingChangesService.getPendingChanges();
    
    if (changes.length === 0) {
      this.snackbarService.showInfo('No changes to save');
      return;
    }
    
    this.changesSynchronizerService.saveChanges(changes).subscribe(result => {
      if (result.success) {
        this.snackbarService.showSuccess(result.message);
        // Clear pending changes
        this.pendingChangesService.saveChanges();
        // Refresh the calendar
        this.refreshAvailability();
      } else {
        this.snackbarService.showError(result.message);
        // Show failed changes if any
        if (result.failed.length > 0) {
          console.error('Failed changes:', result.failed);
        }
      }
    });
  }

  /**
   * Discard all pending changes
   */
  discardChanges(): void {
    if (!this.pendingChangesService.hasPendingChanges()) {
      this.snackbarService.showInfo('No changes to discard');
      return;
    }
    
    const dialogRef = this.dialogService.openConfirmationDialog({
      title: 'Discard Changes',
      message: 'Are you sure you want to discard all pending changes? This action cannot be undone.',
      confirmText: 'Discard',
      cancelText: 'Cancel'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const originalState = this.pendingChangesService.discardChanges();
        this.refreshFullCalendar(originalState);
        this.snackbarService.showSuccess('Changes discarded');
      }
    });
  }

  /**
   * Navigate the calendar
   * @param direction Direction to navigate ('prev', 'next', 'today')
   */
  navigateCalendar(direction: 'prev' | 'next' | 'today'): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
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
   * @param view The view to change to
   */
  changeView(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): void {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        calendarApi.changeView(view);
      }
    }
  }

  /**
   * Check if a view is active
   * @param view The view to check
   * @returns True if the view is active, false otherwise
   */
  isViewActive(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): boolean {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        return calendarApi.view.type === view;
      }
    }
    return false;
  }
}
