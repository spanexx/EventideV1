import { Component, OnInit, AfterViewInit, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
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
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../../services/availability.service';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../../services/dialog/dialog-management.service';
import { CalendarOperationsService } from '../../services/calendar/calendar-operations.service';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { DialogDataService } from '../../services/dialog/dialog-data.service';
import { AvailabilityClipboardService } from '../../services/clipboard/availability-clipboard.service';
import { calculateDurationInMinutes } from '../../utils/dashboard.utils';
import { renderEventContent, handleDayCellRender } from '../../utils/calendar-rendering.utils';
import { CalendarService } from './calendar/calendar.service';
import { CalendarEventsService } from './calendar/calendar-events.service';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

// Import our new pending changes services
import { 
  ChangesSynchronizerService, 
  DragResizeService,
  PendingChangesService
} from '../../services/pending-changes';

// Import our new availability services
import { 
  AvailabilityEventHandlerService,
  AvailabilityUiService,
  AvailabilityDialogCoordinatorService,
  AvailabilityStateService
} from '../../services/availability';

// Import the new undo/redo system
import { UndoRedoCoordinatorService } from '../../services/undo-redo';

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
export class AvailabilityComponent implements OnInit, AfterViewInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @ViewChild('contextMenu') contextMenu!: MatMenu;
  @ViewChild(MatMenuTrigger) contextMenuTrigger!: MatMenuTrigger;
  
  // All state is now managed by the AvailabilityStateService
  // We expose the service directly to the template for easy binding
  constructor(
    private store: Store,
    private dialog: MatDialog,
    private availabilityService: AvailabilityService,
    private snackbarService: SnackbarService,
    private dialogService: DialogManagementService,
    private calendarService: CalendarOperationsService,
    private keyboardShortcutService: KeyboardShortcutService,
    private dialogDataService: DialogDataService,
    private calendarManager: CalendarService,
    private calendarEvents: CalendarEventsService,
    private clipboardService: AvailabilityClipboardService,
    private changesSynchronizerService: ChangesSynchronizerService,
    private dragResizeService: DragResizeService,
    private eventHandlerService: AvailabilityEventHandlerService,
    private uiService: AvailabilityUiService,
    private dialogCoordinatorService: AvailabilityDialogCoordinatorService,
    private cdr: ChangeDetectorRef,
    private undoRedoService: UndoRedoCoordinatorService,
    private pendingChangesService: PendingChangesService,
    public state: AvailabilityStateService // Make the state service public
  ) {
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
  }

  // Expose observables from the state service to the template
  availability$: Observable<Availability[]> = this.state.availability$;
  loading$: Observable<boolean> = this.state.loading$;
  error$: Observable<string | null> = this.state.error$;
  summary$!: Observable<{ created: number; skipped: number } | null> = this.state.summary$;
  pendingChangesCount$: Observable<number> = this.state.pendingChangesCount$;
  canUndo$: Observable<boolean> = this.state.canUndo$;
  canRedo$: Observable<boolean> = this.state.canRedo$;
  undoDescription$: Observable<string | null> = this.state.undoDescription$;
  redoDescription$: Observable<string | null> = this.state.redoDescription$;

  // Local properties for context menu
  contextMenuPosition = { x: 0, y: 0 };
  selectedSlot: Availability | null = null;

  calendarOptions: any;

  ngOnInit(): void {
    // Load availability data
    const today = new Date();
    
    // Subscribe to state changes for local properties
    this.state.selectedSlot$.subscribe(slot => this.selectedSlot = slot);
    this.state.contextMenuPosition$.subscribe(pos => this.contextMenuPosition = pos);

    // Get the current user and load availability for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: today
        }));
      }
    });
    
    // Subscribe to error updates and show snackbar notifications
    this.error$.subscribe(error => {
      if (error) {
        this.snackbarService.showError('Error loading availability: ' + error);
      }
    });
  }

  ngAfterViewInit(): void {
    // Wait for the view to be fully initialized before setting up calendar subscriptions
    setTimeout(() => {
      this.initializeCalendarSubscriptions();
    }, 100);
  }

  private initializeCalendarSubscriptions(): void {
    let isInitialized = false;
    let previousAvailability: Availability[] = [];
    
    this.availability$.subscribe(availability => {
      if (!isInitialized && availability.length >= 0) {
        this.pendingChangesService.initialize(availability);
        isInitialized = true;
        previousAvailability = [...availability];
      } else if (isInitialized) {
        this.pendingChangesService.initialize(availability);
        previousAvailability = [...availability];
      }
    });
    
    this.pendingChangesService.getCurrentState$().subscribe(currentAvailability => {
      if (isInitialized && this.calendarComponent) {
        this.calendarManager.updateCalendarWithAvailability(
          this.calendarComponent,
          currentAvailability,
          previousAvailability,
          this.updateSingleCalendarEvent.bind(this),
          this.refreshFullCalendar.bind(this),
          this.getChangedEvents.bind(this)
        );
        previousAvailability = [...currentAvailability];
      }
    });
  }

  // Event handlers
  handleDateSelect(selectInfo: DateSelectArg) {
    this.eventHandlerService.handleDateSelect(selectInfo, this.availability$);
  }

  handleEventClick(clickInfo: EventClickArg) {
    this.eventHandlerService.handleEventClick(clickInfo, this.availability$);
  }

  handleEventContextMenu(event: MouseEvent, info: any) {
    this.eventHandlerService.handleEventContextMenu(event, info, this.availability$);
  }

  handleEvents(events: EventApi[]) {
    // No specific action needed here
  }

  handleEventResize(resizeInfo: any) {
    this.availability$.pipe(take(1)).subscribe(availability => {
      this.dragResizeService.handleEventResize(resizeInfo, availability);
    });
  }

  handleEventDrop(dropInfo: any) {
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
    this.uiService.refreshAvailability();
  }

  dismissSummary(): void {
    this.uiService.dismissSummary();
  }

  private getChangedEvents(previous: Availability[], current: Availability[]): Availability[] {
    const changed: Availability[] = [];
    const previousMap = new Map<string, Availability>();
    previous.forEach(slot => previousMap.set(slot.id, slot));
    
    current.forEach(slot => {
      const previousSlot = previousMap.get(slot.id);
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
    if (!this.keyboardShortcutService.isCalendarFocused(event)) {
      return;
    }
    this.handleKeyboardShortcut(event);
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    if (this.keyboardShortcutService.isUndoShortcut(event)) {
      event.preventDefault();
      this.undoRedoService.handleUndoShortcut(event);
    } else if (this.keyboardShortcutService.isRedoShortcut(event)) {
      event.preventDefault();
      this.undoRedoService.handleRedoShortcut(event);
    } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.saveChanges();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      if (this.selectedSlot) {
        this.copySlots([this.selectedSlot]);
      } else {
        this.snackbarService.showError('No slot selected to copy');
      }
    } else if (this.keyboardShortcutService.isRefreshShortcut(event) || this.keyboardShortcutService.isF5RefreshShortcut(event)) {
      event.preventDefault();
      this.refreshAvailability();
    } else if (this.keyboardShortcutService.isAddAvailabilityShortcut(event)) {
      event.preventDefault();
      this.handleAddAvailabilityShortcut();
    }
  }

  private handleAddAvailabilityShortcut(): void {
    if (this.keyboardShortcutService.isAvailabilityDialogOpen()) {
      this.keyboardShortcutService.focusExistingAvailabilityDialog();
      return;
    }
    
    const today = new Date();
    const dialogRef = this.dialogService.openAvailabilityDialog(
      this.dialogDataService.prepareAvailabilityDialogData(
        null, 
        today,
        today,
        new Date(today.getTime() + 60 * 60 * 1000)
      )
    );

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
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
    this.uiService.openDatePicker(this.calendarComponent);
  }

  renderEventContent(eventInfo: any) {
    return renderEventContent(eventInfo, calculateDurationInMinutes);
  }

  handleDayCellRender(info: any) {
    handleDayCellRender(info, this.availability$, this.calendarService.isDateInPast.bind(this.calendarService));
  }

  showContextMenu(event: MouseEvent, slot?: Availability) {
    event.preventDefault();
    this.state.setContextMenuPosition({ x: event.clientX, y: event.clientY });
    
    if (slot) {
      this.state.setSelectedSlot(slot);
      this.contextMenuTrigger.menuData = { slot };
    } else {
      this.state.setSelectedSlot(null);
    }
    
    this.calendarManager.openContextMenuAtPosition(this.contextMenuTrigger, event);
  }

  editSlot(slot: Availability) {
    this.dialogCoordinatorService.editSlot(slot);
  }

  copySlots(slots: Availability[]): void {
    this.uiService.copySlots(slots, this.clipboardService);
    this.snackbarService.showSuccess('Slots copied to clipboard');
  }

  deleteSlot(slot: Availability) {
    this.dialogCoordinatorService.deleteSlot(slot);
  }

  addAvailability(): void {
    this.dialogCoordinatorService.addAvailability();
  }

  openCopyWeekDialog(): void {
    this.dialogCoordinatorService.openCopyWeekDialog(this.availability$, this.snackbarService);
  }

  saveChanges(): void {
    const changes = this.pendingChangesService.getPendingChanges();
    if (changes.length === 0) {
      this.snackbarService.showInfo('No changes to save');
      return;
    }
    
    this.changesSynchronizerService.saveChanges(changes).subscribe(result => {
      if (result.success) {
        this.snackbarService.showSuccess(result.message);
        this.pendingChangesService.saveChanges();
        this.undoRedoService.onChangesSaved();
        this.refreshAvailability();
      } else {
        this.snackbarService.showError(result.message);
        if (result.failed.length > 0) {
          console.error('Failed changes:', result.failed);
        }
      }
    });
  }

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
        this.undoRedoService.onChangesDiscarded();
        this.refreshFullCalendar(originalState);
        this.snackbarService.showSuccess('Changes discarded');
      }
    });
  }

  undo(): void {
    this.undoRedoService.undo();
  }

  redo(): void {
    this.undoRedoService.redo();
  }

  navigateCalendar(direction: 'prev' | 'next' | 'today'): void {
    this.uiService.navigateCalendar(this.calendarComponent, direction);
  }

  changeView(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): void {
    this.uiService.changeView(this.calendarComponent, view);
  }

  isViewActive(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): boolean {
    return this.uiService.isViewActive(this.calendarComponent, view);
  }
}