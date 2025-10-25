import { Component, OnInit, AfterViewInit, ViewChild, HostListener, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, BehaviorSubject, Subscription, Subject } from 'rxjs';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import * as AvailabilitySelectors from '../../store-availability/selectors/availability.selectors';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as CalendarSelectors from '../../store-calendar/selectors/calendar.selectors';
import * as CalendarActions from '../../store-calendar/actions/calendar.actions';
import { Availability } from '../../models/availability.models';
import { AvailabilityService } from '../../services/availability.service';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../../services/dialog/dialog-management.service';
import { CalendarOperationsService } from '../../services/calendar/calendar-operations.service';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { DialogDataService } from '../../services/dialog/dialog-data.service';
import { BusinessLogicService } from '../../services/business/business-logic.service';
import { calculateDurationInMinutes } from '../../utils/dashboard.utils';
import { renderEventContent, handleDayCellRender } from '../../utils/calendar-rendering.utils';
import { CalendarService } from './calendar/calendar.service';
import { CalendarEventsService } from './calendar/calendar-events.service';
import { take, takeUntil, filter } from 'rxjs/operators';

// Import our new pending changes services
import { 
  PendingChangesService,
  PendingChangesSignalService, 
  ChangesSynchronizerService, 
  DragResizeService,
  Change
} from '../../services/pending-changes';

// Import our new availability services
import { 
  AvailabilityEventHandlerService,
  AvailabilityUiService,
  AvailabilityDialogCoordinatorService,
  SmartCalendarOperationsService,
  AvailabilityClipboardService,
  AvailabilityCalendarOperationsService,
  AvailabilityPendingChangesService,
  AvailabilityKeyboardOperationsService
} from '../../services/availability';

// Import the new undo/redo system
import { UndoRedoCoordinatorService, UndoRedoSignalService } from '../../services/undo-redo';

// Import our smart calendar services
import { SmartCalendarManagerService, ContentMetrics, SmartCalendarConfig, CalendarView, FilterOptions } from '../../services/smart-calendar-manager.service';
import { SmartContentAnalyzerService, ContentAnalysisResult } from '../../services';

// Import our new calendar state service
import { CalendarStateService } from '../../services/calendar-state.service';
import { CalendarStateCoordinatorService } from '../../services/calendar-state-coordinator.service';
import { GoToDateRequest } from '../../services/availability/availability-dialog-coordinator.service';

import { SmartCalendarAnalysisDialogComponent } from '../../components/smart-calendar-analysis-dialog/smart-calendar-analysis-dialog.component';
import { SmartCalendarRecommendationsDialogComponent } from '../../components/smart-calendar-recommendations-dialog/smart-calendar-recommendations-dialog.component';

// Import the new availability header component
import { AvailabilityHeaderComponent } from './availability-header/availability-header';
import { CalendarFilterDialogModule } from '../../components/calendar-filter-dialog/calendar-filter-dialog.module';
import { CalendarFilterDialogComponent } from '../../components/calendar-filter-dialog/calendar-filter-dialog.component';

// Import AI Components
import { AIInsightsCompactComponent, AIInsightSummary } from '../../../shared/components/ai-components/ai-insights-compact.component';
import { AIInsightsPanelComponent } from '../../../shared/components/ai-components/ai-insights-panel.component';
import { AIRecommendationsComponent } from '../../../shared/components/ai-components/ai-recommendations.component';
import { AIConflictResolverComponent } from '../../../shared/components/ai-components/ai-conflict-resolver.component';

@Component({
  selector: 'app-availability',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CalendarFilterDialogModule,
    AvailabilityHeaderComponent,
    AIInsightsCompactComponent
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss'
})
export class AvailabilityComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
  @ViewChild('contextMenu') contextMenu!: MatMenu;
  @ViewChild(MatMenuTrigger) contextMenuTrigger!: MatMenuTrigger;
  
  contextMenuPosition = { x: 0, y: 0 };
  
  selectedSlot: Availability | null = null;
  availability$: Observable<Availability[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  summary$!: Observable<{ created: number; skipped: number } | null>;
  
  // AI-Enhanced observables
  aiData$: Observable<any>;
  availabilityWithAI$: Observable<any>;
  
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
  
  // Teardown
  private destroy$ = new Subject<void>();
  
  // MIGRATION: Removed manual state properties - header component gets state directly from signals
  // pendingChangesCount, canUndo, canRedo, undoDescription, redoDescription are now signals

  calendarOptions: any;
  
  // Add properties for filtering
  private currentFilters: FilterOptions = { type: 'all' };
  
  // Add properties to track previous state and debounce timeouts
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
    // Inject our new services - MIGRATION: Using both old and new services during transition
    private pendingChangesService: PendingChangesService,
    private pendingChangesSignalService: PendingChangesSignalService,
    private changesSynchronizerService: ChangesSynchronizerService,
    private dragResizeService: DragResizeService,
    // Inject our new availability services
    private eventHandlerService: AvailabilityEventHandlerService,
    private uiService: AvailabilityUiService,
    private dialogCoordinatorService: AvailabilityDialogCoordinatorService,
    private smartCalendarOperationsService: SmartCalendarOperationsService,
    private availabilityClipboardService: AvailabilityClipboardService,
    private availabilityCalendarOperationsService: AvailabilityCalendarOperationsService,
    private availabilityPendingChangesService: AvailabilityPendingChangesService,
    private availabilityKeyboardOperationsService: AvailabilityKeyboardOperationsService,
    private cdr: ChangeDetectorRef,
    // Inject the undo/redo services - MIGRATION: Using both old and new during transition
    private undoRedoService: UndoRedoCoordinatorService,
    private undoRedoSignalService: UndoRedoSignalService,
    // Inject our smart calendar services
    private smartCalendarManager: SmartCalendarManagerService,
    private contentAnalyzer: SmartContentAnalyzerService,
    // Inject our new calendar state services
    private calendarStateService: CalendarStateService,
    private calendarStateCoordinator: CalendarStateCoordinatorService
  ) {
    this.availability$ = this.store.select(AvailabilitySelectors.selectAvailability);
    this.loading$ = this.store.select(AvailabilitySelectors.selectAvailabilityLoading);
    this.error$ = this.store.select(AvailabilitySelectors.selectAvailabilityError);
    
    // Initialize AI-Enhanced observables
    this.aiData$ = this.store.select(AvailabilitySelectors.selectAIData);
    this.availabilityWithAI$ = this.store.select(AvailabilitySelectors.selectAvailabilityWithAI);
    
    // Initialize calendar options first with default view, will be updated later with preferences
    this.calendarOptions = this.calendarManager.initializeCalendarOptions(
      this.handleDateSelect.bind(this),
      this.handleEventClick.bind(this),
      this.handleEvents.bind(this),
      this.renderEventContent.bind(this),
      this.handleDayCellRender.bind(this),
      this.handleEventResize.bind(this),
      this.handleEventDrop.bind(this),
      this.openDatePicker.bind(this),
      this.handleEventContextMenu.bind(this),
      'timeGridWeek' // Default view, will be updated in ngOnInit
    );
    // Initialize summary stream after DI is available
    this.summary$ = this.businessLogicService.summary$;
  }


  ngOnInit(): void {
    console.log('🚀 [AvailabilityComponent] ngOnInit called - Component initializing');
    
    // Load calendar preferences first
    console.log('[AvailabilityComponent] Loading calendar preferences');
    this.calendarStateService.loadPreferences();
    
    // Get preferred view and update calendar options
    const preferredView = this.calendarStateService.getPreferredView();
    console.log('[AvailabilityComponent] Preferred view from service:', preferredView);
    
    // Update calendar options with preferred view
    if (preferredView !== 'timeGridWeek') {
      this.calendarOptions = {
        ...this.calendarOptions,
        initialView: preferredView
      };
      console.log('[AvailabilityComponent] Updated calendar options with preferred view:', preferredView);
    }
    
    // Listen for go to date requests from dialog coordinator
    this.dialogCoordinatorService.goToDateRequested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(request => {
        this.handleGoToDateRequest(request);
      });
    
    // Load availability data
    const today = new Date();
    
    // MIGRATION: Removed manual subscriptions - header component gets state directly from signals
    // No need for manual change detection since signals provide automatic reactivity
    
    // Initialize smart calendar features
    this.initializeSmartCalendar();
    
    // Get the current user and load availability for that user
    // FIXED: Removed take(1) to allow reloading when returning to component
    console.log('🔍 [AvailabilityComponent] Subscribing to userId selector');
    this.store.select(AuthSelectors.selectUserId)
      .pipe(
        filter(userId => {
          console.log('🔍 [AvailabilityComponent] UserId from store:', userId, 'Type:', typeof userId);
          return !!userId && userId !== '';
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(userId => {
        console.log('✅ [AvailabilityComponent] Loading availability for user', userId, 'at', new Date().toISOString());
        this.store.dispatch(AvailabilityActions.loadAvailability({ 
          providerId: userId, 
          date: today
        }));
        // Trigger change detection to ensure UI updates with OnPush
        this.cdr.markForCheck();
        console.log('✅ [AvailabilityComponent] Change detection marked');
      });
    
    // Subscribe to error updates and show snackbar notifications
    this.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          console.log('[AvailabilityComponent] Error loading availability:', error);
          this.snackbarService.showError('Error loading availability: ' + error);
        }
      });
    
    // Subscribe to calendar state changes and update smart calendar manager
    this.store.select(CalendarSelectors.selectCurrentView)
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentView => {
        console.log('[AvailabilityComponent] Updating smart calendar manager with current view:', currentView);
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
      
      // Apply preferred view after calendar is ready
      this.applyPreferredViewToCalendar();
    }, 100);
  }

  private initializeCalendarSubscriptions(): void {
    console.log('[AvailabilityComponent] Initializing calendar subscriptions');
    
    // Subscribe to availability updates and initialize pending changes
    // Then subscribe to current state for calendar updates
    let isInitialized = false;
    let previousAvailability: Availability[] = [];
    
    this.availability$
      .pipe(takeUntil(this.destroy$))
      .subscribe(availability => {
      console.log(`[AvailabilityComponent] Availability updated - ${availability.length} slots`);
      
      // Initialize once from store
      if (!isInitialized && availability.length >= 0) {
        this.pendingChangesSignalService.initialize(availability);
        isInitialized = true;
        previousAvailability = [...availability];
        console.log('[AvailabilityComponent] Initialized signal-based pending changes with', availability.length, 'slots');
        return;
      }

      // After first init: avoid overwriting local pending state while user has unsaved changes
      const hasPending = this.pendingChangesSignalService.hasPendingChanges();
      const commitInProgress = this.pendingChangesSignalService.isCommitInProgress();
      const storeSyncSuspended = this.pendingChangesSignalService.isStoreSyncSuspended();
      console.log('[AvailabilityComponent] Store emission guard', { hasPending, commitInProgress, storeSyncSuspended });
      if (hasPending || commitInProgress || storeSyncSuspended) {
        console.log('[AvailabilityComponent] Store emission ignored (pending/commit/suspended)');
        return;
      }

      // No pending changes and not in a commit window: adopt store as the new original state
      this.pendingChangesSignalService.updateCurrentState(availability);
      previousAvailability = [...availability];
      console.log('[AvailabilityComponent] Adopted store state as current/original with', availability.length, 'slots');
    });
    
    // MIGRATION: Subscribe to signal-based pending changes current state for calendar updates
    // This includes both the original state and any pending changes
    this.pendingChangesSignalService.getCurrentState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentAvailability => {
      console.log(`[AvailabilityComponent] Signal-based pending changes state updated - ${currentAvailability.length} slots`);
      
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
    this.eventHandlerService.handleDateSelect(selectInfo, this.availability$);
  }

  handleEventClick(clickInfo: EventClickArg) {
    this.eventHandlerService.handleEventClick(clickInfo, this.availability$);
  }

  handleEventContextMenu(event: MouseEvent, info: any) {
    this.eventHandlerService.handleEventContextMenu(event, info, this.availability$);
  }

  handleEvents(events: EventApi[]) {
    // Handle events update
    // This method is called when events are updated in the calendar
    // No specific action needed here as the state is managed by NgRx
    // But we can add any necessary logic here if needed
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
    this.availabilityKeyboardOperationsService.handleKeyboardShortcut(
      event,
      () => this.undo(),
      () => this.redo(),
      () => this.saveChanges(),
      () => this.refreshAvailability(),
      (slots) => this.copySlots(slots),
      this.selectedSlot,
      this.snackbarService,
      () => this.addAvailability()
    );
  }

  /**
   * Handle the add availability keyboard shortcut
   */
  private handleAddAvailabilityShortcut(): void {
    this.availabilityKeyboardOperationsService.handleAddAvailabilityShortcut(this.snackbarService);
  }

  

  openDatePicker(): void {
    this.dialogCoordinatorService.openDatePicker();
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
    this.dialogCoordinatorService.editSlot(slot);
  }

  /**
   * Copy an availability slot to the clipboard
   * @param slot The slot to copy
   */
  copySlots(slots: Availability[]): void {
    this.availabilityClipboardService.copySlots(slots);
    this.snackbarService.showSuccess('Slots copied to clipboard');
  }

  

  deleteSlot(slot: Availability) {
    this.dialogCoordinatorService.deleteSlot(slot);
  }

  /**
   * Opens the availability dialog to add a new availability slot
   */
  addAvailability(): void {
    this.dialogCoordinatorService.addAvailability();
  }

  openCopyWeekDialog(): void {
    this.dialogCoordinatorService.openCopyWeekDialog(this.availability$, this.snackbarService);
  }

  /**
   * Save all pending changes
   */
  saveChanges(): void {
    this.availabilityPendingChangesService.saveChanges(() => this.refreshAvailability());
  }

  /**
   * Discard all pending changes
   */
  discardChanges(): void {
    this.availabilityPendingChangesService.discardChanges((availability) => this.refreshFullCalendar(availability));
  }

  /**
   * Execute undo operation
   */
  undo(): void {
    // MIGRATION: Use signal-based undo/redo service
    this.undoRedoSignalService.undo();
  }

  /**
   * Execute redo operation
   */
  redo(): void {
    // MIGRATION: Use signal-based undo/redo service
    this.undoRedoSignalService.redo();
  }

  /**
   * Navigate the calendar
   * @param direction Direction to navigate ('prev', 'next', 'today')
   */
  navigateCalendar(direction: 'prev' | 'next' | 'today'): void {
    this.availabilityCalendarOperationsService.navigateCalendar(this.calendarComponent, direction);
  }

  /**
   * Change the calendar view
   * @param view The view to change to
   */
  changeView(view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'): void {
    console.log('[AvailabilityComponent] Changing view to:', view);
    
    // Update the calendar view
    this.availabilityCalendarOperationsService.changeView(this.calendarComponent, view);
    
    // Update the state through the coordinator (handles preferences automatically)
    this.calendarStateService.setView(view);
  }

  /**
   * Check if a view is active
   * @param view The view to check
   * @returns True if the view is active, false otherwise
   */
  isViewActive(view: CalendarView): boolean {
    return this.availabilityCalendarOperationsService.isViewActive(
      this.calendarComponent, 
      view, 
      this.currentActiveView, 
      this.hasLoggedCalendarWarning
    );
  }

  // Add properties to track state and reduce logging
  private currentActiveView: CalendarView | null = null;

  getCurrentActiveView(): CalendarView {
    return this.currentActiveView || 'timeGridWeek';
  }
  private hasLoggedCalendarWarning = false;

  /**
   * Analyze calendar content using smart content analyzer
   * @param availability Current availability data
   */
  analyzeCalendarContent(availability: Availability[]): void {
    this.smartCalendarOperationsService.analyzeCalendarContent(
      availability,
      this.smartMetricsSubject,
      this.viewRecommendationSubject
    );
  }

  /**
   * Get smart recommendations based on calendar content
   * @param availability Current availability data
   */
  getSmartRecommendations(availability: Availability[]): void {
    this.smartCalendarOperationsService.getSmartRecommendations(
      availability,
      this.smartRecommendationsSubject
    );
  }
  
  /**
   * Performs a search on the calendar data using enhanced AI-powered natural language processing
   */
  async performSearch(query: string, availability: Availability[]): Promise<void> {
    // Get calendar API if available
    let calendarApi = null;
    if (this.calendarComponent) {
      calendarApi = this.calendarComponent.getApi();
    }
    
    await this.smartCalendarOperationsService.performSearch(
      query,
      availability,
      (results) => this.refreshFullCalendar(results),
      this.smartMetricsSubject,
      this.contentAnalyzer,
      calendarApi
    );
  }
  
  /**
   * Opens a filter dialog to configure calendar filters
   */
  openFilterDialog(): void {
    const dialogRef = this.dialog.open(CalendarFilterDialogComponent, {
      width: '500px',
      data: { filters: this.currentFilters }
    });

    dialogRef.afterClosed().subscribe((result: FilterOptions) => {
      if (result) {
        this.applyFilters(result);
        this.snackbarService.showSuccess('Filters applied successfully');
      }
    });
  }

  /**
   * Apply filters to the calendar data
   */
  applyFilters(filters: FilterOptions): void {
    this.smartCalendarOperationsService.applyFilters(
      filters,
      this.currentFilters,
      this.availability$,
      (results) => this.refreshFullCalendar(results),
      this.smartMetricsSubject,
      this.smartCalendarManager,
      this.contentAnalyzer
    );
  }

  /**
   * Initialize the smart calendar features
   */
  private initializeSmartCalendar(): void {
    // Initialize smart calendar features using our new service
    this.smartCalendarOperationsService.initializeSmartCalendar(
      this.availability$,
      this.smartMetricsSubject,
      this.viewRecommendationSubject,
      this.previousAvailabilityLength,
      this.previousRecommendedView,
      this.previousConfig,
      this.previousMetrics,
      this.analysisTimeout,
      this.contentAnalyzer
    );
  }

  // Event handler methods for the availability header component
  onSearch(query: string): void {
    // Always search against the original store data, not the current filtered results
    // This ensures each search starts with the full dataset
    this.store.select(AvailabilitySelectors.selectAvailability).pipe(take(1)).subscribe((originalAvailability: Availability[]) => {
      this.performSearch(query, originalAvailability);
    });
  }

  onSearchClear(): void {
    // When search is cleared, restore the original data from store
    this.store.select(AvailabilitySelectors.selectAvailability).pipe(take(1)).subscribe((originalAvailability: Availability[]) => {
      this.refreshFullCalendar(originalAvailability);
      // Update metrics to reflect the full dataset
      const totalSlots = originalAvailability.length;
      const bookedSlots = originalAvailability.filter(slot => slot.isBooked).length;
      const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
      
      this.smartMetricsSubject.next({
        totalSlots: totalSlots,
        bookedSlots: bookedSlots,
        expiredSlots: 0,
        upcomingSlots: 0,
        conflictingSlots: this.contentAnalyzer.detectConflicts(originalAvailability).length,
        occupancyRate: occupancyRate
      });
      
      this.snackbarService.showInfo('Search cleared - showing all slots');
    });
  }

  onFilter(): void {
    this.openFilterDialog();
  }

  onAnalyze(): void {
    this.availability$.pipe(take(1)).subscribe(availability => {
      this.analyzeCalendarContent(availability);
    });
  }

  onRecommendations(): void {
    this.availability$.pipe(take(1)).subscribe(availability => {
      this.getSmartRecommendations(availability);
    });
  }

  /**
   * Load AI-enhanced availability data
   */
  loadAIEnhancedAvailability(): void {
    this.store.select(AuthSelectors.selectUserId).pipe(
      filter(userId => {
        console.log('[AvailabilityComponent] loadAIEnhancedAvailability - userId check:', { userId, hasValue: !!userId });
        return !!userId && userId !== '';
      }),
      take(1),
      takeUntil(this.destroy$)
    ).subscribe(userId => {
      console.log('[AvailabilityComponent] Loading AI-enhanced availability for user:', { userId });
      const today = new Date();
      this.store.dispatch(AvailabilityActions.loadAIEnhancedAvailability({ 
        providerId: userId, 
        date: today,
        includeAnalysis: true
      }));
    });
  }

  /**
   * Get AI insights for current availability data
   */
  getAIInsights(): void {
    this.availability$.pipe(take(1)).subscribe(availability => {
      this.store.dispatch(AvailabilityActions.getAIInsights({ 
        availabilityData: availability
      }));
    });
  }

  /**
   * Refresh AI analysis
   */
  refreshAIAnalysis(): void {
    this.getAIInsights();
  }

  /**
   * Handle AI-specific actions
   */
  onAIAction(action: string): void {
    switch (action) {
      case 'insights':
        this.getAIInsights();
        break;
      case 'enhance':
        this.loadAIEnhancedAvailability();
        break;
      case 'refresh':
        this.refreshAIAnalysis();
        break;
      default:
        console.warn('Unknown AI action:', action);
    }
  }

  /**
   * Transform AI data to the expected format for AIInsightsCompactComponent
   */
  getAIInsightsSummary(aiData: any): AIInsightSummary {
    return {
      conflictsCount: aiData.conflicts?.conflicts?.length || 0,
      patternsCount: aiData.insights?.patterns?.length || 0,
      optimizationsCount: aiData.optimizations?.optimizations?.length || 0,
      summary: aiData.analysis?.summary || 'AI analysis complete',
      lastUpdate: aiData.lastUpdate,
      hasHighPriorityIssues: (aiData.conflicts?.conflicts?.length || 0) > 0
    };
  }

  /**
   * Handle viewing AI details
   */
  onViewAIDetails(aiData: any): void {
    // Open detailed AI insights dialog
    const dialogRef = this.dialog.open(AIInsightsPanelComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { aiData },
      panelClass: 'ai-insights-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.refresh) {
        this.refreshAIAnalysis();
      }
    });
  }

  onRefresh(): void {
    this.refreshAvailability();
  }

  ngOnDestroy(): void {
    console.log('🔴 [AvailabilityComponent] ngOnDestroy called - Component being destroyed at', new Date().toISOString());
    this.destroy$.next();
    this.destroy$.complete();
    console.log('🔴 [AvailabilityComponent] All subscriptions cleaned up');
  }

  // TrackBy functions for performance optimization
  trackByAvailabilitySlot(index: number, slot: any): string {
    return slot.id || `${slot.startTime}-${slot.endTime}-${slot.date}`;
  }

  trackByCalendarEvent(index: number, event: any): string {
    return event.id || `${event.title}-${event.start}-${event.end}`;
  }

  trackByFilterOption(index: number, option: any): string {
    return option.id || option.value || option.label || index.toString();
  }

  trackByDialogOption(index: number, option: any): string {
    return option.id || option.label || option.value || index.toString();
  }

  /**
   * Apply the preferred view to the calendar after it's initialized
   */
  private applyPreferredViewToCalendar(): void {
    if (this.calendarComponent) {
      const preferredView = this.calendarStateService.getPreferredView();
      const calendarApi = this.calendarComponent.getApi();
      
      if (calendarApi && calendarApi.view.type !== preferredView) {
        console.log('[AvailabilityComponent] Applying preferred view to initialized calendar:', preferredView);
        calendarApi.changeView(preferredView);
        
        // Update the state to reflect the applied view
        this.calendarStateService.setView(preferredView);
      }
    }
  }

  /**
   * Handle go to date request from dialog coordinator
   * Implements the specific behavior: change to day view temporarily and navigate to date
   * Does NOT update the preferred view in storage
   * @param request The go to date request
   */
  private handleGoToDateRequest(request: GoToDateRequest): void {
    console.log('[AvailabilityComponent] Handling go to date request:', request);
    
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      
      if (calendarApi) {
        // 1. Store current view to potentially restore later
        const currentView = calendarApi.view.type;
        console.log('[AvailabilityComponent] Current view before go to date:', currentView);
        
        // 2. Change to day view temporarily (as per requirement)
        // Use FullCalendar API directly without triggering state updates
        calendarApi.changeView(request.temporaryView);
        console.log('[AvailabilityComponent] Changed to temporary view:', request.temporaryView);
        
        // 3. Navigate to the selected date
        calendarApi.gotoDate(request.date);
        console.log('[AvailabilityComponent] Navigated to date:', request.date);
        
        // 4. Do NOT dispatch any state updates to prevent preference changes
        // The calendar view is now temporarily changed without affecting user preferences
        
        // Show success message
        this.snackbarService.showSuccess(`Navigated to ${request.date.toDateString()} in ${request.temporaryView === 'timeGridDay' ? 'Day' : 'Week'} view`);
      }
    }
  }
}