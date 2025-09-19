import { Component, OnInit, AfterViewInit, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, BehaviorSubject } from 'rxjs';
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
import * as CalendarSelectors from '../../store-calendar/selectors/calendar.selectors';
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

// Import our new availability services
import { 
  AvailabilityEventHandlerService,
  AvailabilityUiService,
  AvailabilityDialogCoordinatorService
} from '../../services/availability';

// Import the new undo/redo system
import { UndoRedoCoordinatorService } from '../../services/undo-redo';

// Import our smart calendar services
import { SmartCalendarManagerService, ContentMetrics, SmartCalendarConfig, CalendarView } from '../../services/smart-calendar-manager.service';
import { SmartContentAnalyzerService, ContentAnalysisResult } from '../../services/smart-content-analyzer.service';

// Import our new calendar state service
import { CalendarStateService } from '../../services/calendar-state.service';

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
  
  contextMenuPosition = { x: 0, y: 0 };
  
  selectedSlot: Availability | null = null;
  availability$: Observable<Availability[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  summary$!: Observable<{ created: number; skipped: number } | null>;
  
  // Smart calendar observables
  private smartMetricsSubject = new BehaviorSubject<ContentMetrics>({
    totalSlots: 0,
    bookedSlots: 0,
    expiredSlots: 0,
    upcomingSlots: 0,
    conflictingSlots: 0,
    occupancyRate: 0
  });
  
  private viewRecommendationSubject = new BehaviorSubject<string>('');
  private smartRecommendationsSubject = new BehaviorSubject<any[]>([]);
  
  smartMetrics$ = this.smartMetricsSubject.asObservable();
  viewRecommendation$ = this.viewRecommendationSubject.asObservable();
  smartRecommendations$ = this.smartRecommendationsSubject.asObservable();
  
  // We're now using the PendingChangesService for state management
  pendingChangesCount: number = 0;
  
  // Undo/redo state for UI binding
  canUndo: boolean = false;
  canRedo: boolean = false;
  undoDescription: string | null = null;
  redoDescription: string | null = null;

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
    private dragResizeService: DragResizeService,
    // Inject our new availability services
    private eventHandlerService: AvailabilityEventHandlerService,
    private uiService: AvailabilityUiService,
    private dialogCoordinatorService: AvailabilityDialogCoordinatorService,
    private cdr: ChangeDetectorRef,
    // Inject the undo/redo coordinator service
    private undoRedoService: UndoRedoCoordinatorService,
    // Inject our smart calendar services
    private smartCalendarManager: SmartCalendarManagerService,
    private contentAnalyzer: SmartContentAnalyzerService,
    // Inject our new calendar state service
    private calendarStateService: CalendarStateService
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
      // Trigger change detection to avoid ExpressionChangedAfterItHasBeenCheckedError
      this.cdr.detectChanges();
    });
    
    // Subscribe to undo/redo state for UI binding
    this.undoRedoService.canUndo$.subscribe(canUndo => {
      this.canUndo = canUndo;
      this.cdr.detectChanges();
    });
    
    this.undoRedoService.canRedo$.subscribe(canRedo => {
      this.canRedo = canRedo;
      this.cdr.detectChanges();
    });
    
    this.undoRedoService.undoDescription$.subscribe(description => {
      this.undoDescription = description;
      this.cdr.detectChanges();
    });
    
    this.undoRedoService.redoDescription$.subscribe(description => {
      this.redoDescription = description;
      this.cdr.detectChanges();
    });
    
    // Initialize smart calendar features
    this.initializeSmartCalendar();
    
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
    
    // Subscribe to calendar state changes and update smart calendar manager
    this.store.select(CalendarSelectors.selectCurrentView).subscribe(currentView => {
      this.smartCalendarManager.updateConfig({
        viewType: currentView,
        contentDensity: 'medium',
        adaptiveDisplay: true,
        smartFiltering: true,
        contextualInfo: true
      });
    });
  }

  ngAfterViewInit(): void {
    // Wait for the view to be fully initialized before setting up calendar subscriptions
    // Use a small timeout to ensure FullCalendar is completely ready
    setTimeout(() => {
      console.log('[AvailabilityComponent] Initializing calendar subscriptions');
      this.initializeCalendarSubscriptions();
      
      // Now that the calendar is initialized, reset the warning flag
      this.hasLoggedCalendarWarning = false;
      this.currentActiveView = null;
    }, 100);
  }

  private initializeCalendarSubscriptions(): void {
    console.log('[AvailabilityComponent] Initializing calendar subscriptions');
    
    // Subscribe to availability updates and initialize pending changes
    // Then subscribe to current state for calendar updates
    let isInitialized = false;
    let previousAvailability: Availability[] = [];
    
    this.availability$.subscribe(availability => {
      console.log(`[AvailabilityComponent] Availability updated - ${availability.length} slots`);
      
      // Initialize the pending changes service with the original state
      if (!isInitialized && availability.length >= 0) {
        this.pendingChangesService.initialize(availability);
        isInitialized = true;
        // Initialize the previous availability with the store data
        previousAvailability = [...availability];
        console.log('[AvailabilityComponent] Initialized pending changes with', availability.length, 'slots');
      } else if (isInitialized) {
        // If already initialized, update the original state when store changes
        // This happens when data is refreshed from server
        this.pendingChangesService.initialize(availability);
        previousAvailability = [...availability];
        console.log('[AvailabilityComponent] Updated original state with', availability.length, 'slots from store');
      }
    });
    
    // Subscribe to pending changes current state for calendar updates
    // This includes both the original state and any pending changes
    this.pendingChangesService.getCurrentState$().subscribe(currentAvailability => {
      console.log(`[AvailabilityComponent] Pending changes state updated - ${currentAvailability.length} slots`);
      
      // Only update calendar if we have been initialized and calendar is available
      if (isInitialized && this.calendarComponent) {
        // Update the calendar with the current state (original + pending changes)
        this.calendarManager.updateCalendarWithAvailability(
          this.calendarComponent,
          currentAvailability,
          previousAvailability,
          this.updateSingleCalendarEvent.bind(this),
          this.refreshFullCalendar.bind(this),
          this.getChangedEvents.bind(this)
        );
        
        // Update previous state for next comparison
        previousAvailability = [...currentAvailability];
      } else {
        console.log('[AvailabilityComponent] Calendar not yet initialized or calendar component not available');
      }
    });
  }

  // Event handlers
  handleDateSelect(selectInfo: DateSelectArg) {
    // Delegate to the event handler service
    this.eventHandlerService.handleDateSelect(selectInfo, this.availability$);
  }

  handleEventClick(clickInfo: EventClickArg) {
    // Delegate to the event handler service
    this.eventHandlerService.handleEventClick(clickInfo, this.availability$);
  }

  handleEventContextMenu(event: MouseEvent, info: any) {
    // Delegate to the event handler service
    this.eventHandlerService.handleEventContextMenu(event, info, this.availability$);
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
    this.uiService.refreshAvailability();
  }

  dismissSummary(): void {
    this.uiService.dismissSummary();
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
    // Ctrl/Cmd + Z - Undo
    if (this.keyboardShortcutService.isUndoShortcut(event)) {
      event.preventDefault();
      this.undoRedoService.handleUndoShortcut(event);
      return;
    }
    
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
    if (this.keyboardShortcutService.isRedoShortcut(event)) {
      event.preventDefault();
      this.undoRedoService.handleRedoShortcut(event);
      return;
    }
    
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
    this.uiService.openDatePicker(this.calendarComponent);
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
    // Delegate to the dialog coordinator service
    this.dialogCoordinatorService.editSlot(slot);
  }

  /**
   * Copy an availability slot to the clipboard
   * @param slot The slot to copy
   */
  copySlots(slots: Availability[]): void {
    this.uiService.copySlots(slots, this.clipboardService);
    this.snackbarService.showSuccess('Slots copied to clipboard');
  }

  

  deleteSlot(slot: Availability) {
    // Delegate to the dialog coordinator service
    this.dialogCoordinatorService.deleteSlot(slot);
  }

  /**
   * Opens the availability dialog to add a new availability slot
   */
  addAvailability(): void {
    // Delegate to the dialog coordinator service
    this.dialogCoordinatorService.addAvailability();
  }

  openCopyWeekDialog(): void {
    // Delegate to the dialog coordinator service
    this.dialogCoordinatorService.openCopyWeekDialog(this.availability$, this.snackbarService);
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
        // Clear undo/redo stack since changes are now committed
        this.undoRedoService.onChangesSaved();
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
        // Clear undo/redo stack since all changes are reverted
        this.undoRedoService.onChangesDiscarded();
        this.refreshFullCalendar(originalState);
        this.snackbarService.showSuccess('Changes discarded');
      }
    });
  }

  /**
   * Execute undo operation
   */
  undo(): void {
    this.undoRedoService.undo();
  }

  /**
   * Execute redo operation
   */
  redo(): void {
    this.undoRedoService.redo();
  }

  /**
   * Navigate the calendar
   * @param direction Direction to navigate ('prev', 'next', 'today')
   */
  navigateCalendar(direction: 'prev' | 'next' | 'today'): void {
    this.uiService.navigateCalendar(this.calendarComponent, direction);
    
    // Update the calendar state service with the navigation
    this.calendarStateService.navigate(direction);
  }

  /**
   * Change the calendar view
   * @param view The view to change to
   */
  changeView(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): void {
    console.log(`[AvailabilityComponent] Changing calendar view to: ${view}`);
    this.uiService.changeView(this.calendarComponent, view);
    
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
    
    console.log('[AvailabilityComponent] Updating smart calendar manager with config:', configUpdate);
    this.smartCalendarManager.updateConfig(configUpdate);
  }

  /**
   * Check if a view is active
   * @param view The view to check
   * @returns True if the view is active, false otherwise
   */
  isViewActive(view: CalendarView): boolean {
    // Only check if we have a calendar component reference
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        const isActive = calendarApi.view.type === view;
        // Only log when the view is actually active to reduce noise
        if (isActive) {
          // Use a more efficient approach - only update if the view has actually changed
          if (this.currentActiveView !== view) {
            this.currentActiveView = view;
            console.log(`[AvailabilityComponent] View ${view} is active`);
            
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
    // Only log this warning occasionally to reduce noise
    if (!this.hasLoggedCalendarWarning) {
      console.warn('[AvailabilityComponent] Calendar component not yet available for view check');
      this.hasLoggedCalendarWarning = true;
    }
    return false;
  }

  // Add properties to track state and reduce logging
  private currentActiveView: CalendarView | null = null;
  private hasLoggedCalendarWarning = false;

  /**
   * Analyze calendar content using smart content analyzer
   * @param availability Current availability data
   */
  analyzeCalendarContent(availability: Availability[]): void {
    console.log('[AvailabilityComponent] Starting calendar content analysis with data:', availability);
    
    if (availability && availability.length > 0) {
      // Analyze the content using our content analyzer service
      this.contentAnalyzer.analyzeContent(availability).subscribe(analysis => {
        console.log('[AvailabilityComponent] Content analysis results received:', analysis);
        
        // Update metrics
        const totalSlots = availability.length;
        const bookedSlots = availability.filter(slot => slot.isBooked).length;
        const occupancyRate = Math.round((bookedSlots / totalSlots) * 100);
        
        console.log(`[AvailabilityComponent] Calculated metrics - Total: ${totalSlots}, Booked: ${bookedSlots}, Occupancy: ${occupancyRate}%`);
        
        this.smartMetricsSubject.next({
          totalSlots: totalSlots,
          bookedSlots: bookedSlots,
          expiredSlots: 0, // We would calculate this based on dates
          upcomingSlots: 0, // We would calculate this based on dates
          conflictingSlots: 0, // We would calculate this based on overlapping slots
          occupancyRate: occupancyRate
        });
        
        // Update view recommendation from the analysis
        if (analysis.viewOptimization.recommendedView) {
          this.viewRecommendationSubject.next(analysis.viewOptimization.recommendedView);
          console.log('[AvailabilityComponent] Updated view recommendation:', analysis.viewOptimization.recommendedView);
        }
        
        // Also update the content insights
        if (analysis.contentInsights) {
          const insights = analysis.contentInsights;
          const currentMetrics = this.smartMetricsSubject.value;
          
          // Create a new metrics object with updated values
          const updatedMetrics: ContentMetrics = { ...currentMetrics };
          
          if (insights['totalSlots'] !== undefined) {
            updatedMetrics.totalSlots = insights['totalSlots'];
          }
          if (insights['bookedSlots'] !== undefined) {
            updatedMetrics.bookedSlots = insights['bookedSlots'];
          }
          if (insights['occupancyRate'] !== undefined) {
            updatedMetrics.occupancyRate = insights['occupancyRate'];
          }
          
          console.log('[AvailabilityComponent] Updated metrics with content insights:', updatedMetrics);
          this.smartMetricsSubject.next(updatedMetrics);
        }
        
        this.snackbarService.showSuccess('Calendar analysis complete');
      });
    } else {
      console.warn('[AvailabilityComponent] No availability data to analyze');
      this.snackbarService.showInfo('No data to analyze');
    }
  }

  /**
   * Get smart recommendations based on calendar content
   * @param availability Current availability data
   */
  getSmartRecommendations(availability: Availability[]): void {
    console.log('[AvailabilityComponent] Generating smart recommendations with data:', availability);
    
    if (availability && availability.length > 0) {
      // Generate recommendations using our smart calendar manager
      this.smartCalendarManager.generateRecommendations().subscribe(recommendations => {
        console.log('[AvailabilityComponent] Smart recommendations received:', recommendations);
        this.smartRecommendationsSubject.next(recommendations);
        
        if (recommendations.length > 0) {
          console.log(`[AvailabilityComponent] Found ${recommendations.length} recommendations`);
          this.snackbarService.showInfo(`Found ${recommendations.length} recommendations`);
        } else {
          console.log('[AvailabilityComponent] No recommendations at this time');
          this.snackbarService.showInfo('No recommendations at this time');
        }
      });
    } else {
      console.warn('[AvailabilityComponent] No availability data to generate recommendations from');
      this.snackbarService.showInfo('No data to analyze for recommendations');
    }
  }

  /**
   * Initialize the smart calendar features
   */
  private initializeSmartCalendar(): void {
    console.log('[AvailabilityComponent] Initializing smart calendar features');
    
    // Track if we've already processed the initial availability data
    let hasProcessedInitialData = false;
    
    // Subscribe to availability updates to trigger smart calendar analysis
    this.availability$.subscribe(availability => {
      console.log(`[AvailabilityComponent] Availability updated - triggering smart calendar analysis (${availability.length} slots)`);
      
      // Update smart calendar metrics
      if (availability && availability.length > 0) {
        // Only process if this is new data or we haven't processed initial data yet
        if (!hasProcessedInitialData || availability.length !== this.previousAvailabilityLength) {
          hasProcessedInitialData = true;
          this.previousAvailabilityLength = availability.length;
          
          const totalSlots = availability.length;
          const bookedSlots = availability.filter(slot => slot.isBooked).length;
          const occupancyRate = Math.round((bookedSlots / totalSlots) * 100);
          
          // Update metrics subject for UI display
          this.smartMetricsSubject.next({
            totalSlots: totalSlots,
            bookedSlots: bookedSlots,
            expiredSlots: 0, // We would calculate this based on dates
            upcomingSlots: 0, // We would calculate this based on dates
            conflictingSlots: 0, // We would calculate this based on overlapping slots
            occupancyRate: occupancyRate
          });
          
          // Only log when we have meaningful data
          if (totalSlots > 0) {
            console.log('[AvailabilityComponent] Updated smart metrics:', {
              totalSlots: totalSlots,
              bookedSlots: bookedSlots,
              occupancyRate: occupancyRate
            });
          }
          
          // Debounce the content analysis to prevent too many rapid calls
          clearTimeout(this.analysisTimeout);
          this.analysisTimeout = setTimeout(() => {
            // Analyze content to get view recommendations
            this.contentAnalyzer.analyzeContent(availability).subscribe(analysis => {
              // Only log when we have meaningful data
              if (availability.length > 0) {
                console.log('[AvailabilityComponent] Content analysis results:', analysis);
                
                // Update view recommendation from the analysis
                if (analysis.viewOptimization.recommendedView) {
                  this.viewRecommendationSubject.next(analysis.viewOptimization.recommendedView);
                  // Only log when the recommendation changes
                  if (this.previousRecommendedView !== analysis.viewOptimization.recommendedView) {
                    this.previousRecommendedView = analysis.viewOptimization.recommendedView;
                    console.log('[AvailabilityComponent] Updated view recommendation:', analysis.viewOptimization.recommendedView);
                  }
                }
              }
            });
          }, 300); // Debounce for 300ms
        }
      }
    });
    
    // Subscribe to smart calendar manager configuration changes
    this.smartCalendarManager.config$.subscribe(config => {
      // Only log when there are actual changes
      if (JSON.stringify(config) !== JSON.stringify(this.previousConfig)) {
        this.previousConfig = {...config};
        console.log('[AvailabilityComponent] Smart calendar configuration updated:', config);
      }
      // Handle configuration changes if needed
    });
    
    // Subscribe to smart calendar manager metrics changes
    this.smartCalendarManager.metrics$.subscribe(metrics => {
      // Only log when there are actual changes
      if (JSON.stringify(metrics) !== JSON.stringify(this.previousMetrics)) {
        this.previousMetrics = {...metrics};
        console.log('[AvailabilityComponent] Smart calendar metrics updated:', metrics);
      }
      // Handle metrics changes if needed
    });
  }

  // Add variables to track previous state and debounce timeouts
  private previousAvailabilityLength: number = -1;
  private previousRecommendedView: CalendarView | null = null;
  private previousConfig: Partial<SmartCalendarConfig> = {};
  private previousMetrics: ContentMetrics = {
    totalSlots: 0,
    bookedSlots: 0,
    expiredSlots: 0,
    upcomingSlots: 0,
    conflictingSlots: 0,
    occupancyRate: 0
  };
  private analysisTimeout: any;
}