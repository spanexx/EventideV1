import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AvailabilityComponent } from './availability.component';
import { AvailabilityClipboardService } from '../../services/clipboard/availability-clipboard.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../../services/dialog/dialog-management.service';
import { CalendarOperationsService } from '../../services/calendar/calendar-operations.service';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { DialogDataService } from '../../services/dialog/dialog-data.service';
import { CalendarService } from './calendar/calendar.service';
import { CalendarEventsService } from './calendar/calendar-events.service';
import { AvailabilityService } from '../../services/availability.service';
import { PendingChangesService, ChangesSynchronizerService, DragResizeService } from '../../services/pending-changes';
import { AvailabilityEventHandlerService, AvailabilityUiService, AvailabilityDialogCoordinatorService, AvailabilityStateService } from '../../services/availability';
import { UndoRedoCoordinatorService } from '../../services/undo-redo';
import { Availability } from '../../models/availability.models';
import { mockAvailabilityStateService } from '../../services/availability/availability-state.service.spec';

describe('AvailabilityComponent', () => {
  let component: AvailabilityComponent;
  let fixture: ComponentFixture<AvailabilityComponent>;
  let mockStore: jasmine.SpyObj<Store>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockAvailabilityService: jasmine.SpyObj<AvailabilityService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialogService: jasmine.SpyObj<DialogManagementService>;
  let mockCalendarService: jasmine.SpyObj<CalendarOperationsService>;
  let mockKeyboardShortcutService: jasmine.SpyObj<KeyboardShortcutService>;
  let mockDialogDataService: jasmine.SpyObj<DialogDataService>;
  let mockCalendarManager: jasmine.SpyObj<CalendarService>;
  let mockCalendarEvents: jasmine.SpyObj<CalendarEventsService>;
  let mockClipboardService: jasmine.SpyObj<AvailabilityClipboardService>;
  let mockPendingChangesService: jasmine.SpyObj<PendingChangesService>;
  let mockChangesSynchronizerService: jasmine.SpyObj<ChangesSynchronizerService>;
  let mockDragResizeService: jasmine.SpyObj<DragResizeService>;
  let mockEventHandlerService: jasmine.SpyObj<AvailabilityEventHandlerService>;
  let mockUiService: jasmine.SpyObj<AvailabilityUiService>;
  let mockDialogCoordinatorService: jasmine.SpyObj<AvailabilityDialogCoordinatorService>;
  let mockUndoRedoService: jasmine.SpyObj<UndoRedoCoordinatorService>;

  const mockAvailability: Availability = {
    id: '1',
    providerId: 'provider1',
    type: 'one_off',
    startTime: new Date('2023-01-01T09:00:00'),
    endTime: new Date('2023-01-01T10:00:00'),
    duration: 60,
    isBooked: false
  };

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockAvailabilityService = jasmine.createSpyObj('AvailabilityService', ['convertToCalendarEvents']);
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
    mockDialogService = jasmine.createSpyObj('DialogManagementService', ['openConfirmationDialog', 'openAvailabilityDialog']);
    mockCalendarService = jasmine.createSpyObj('CalendarOperationsService', ['isDateInPast', 'hasExistingAvailability']);
    mockKeyboardShortcutService = jasmine.createSpyObj('KeyboardShortcutService', ['isCalendarFocused', 'isUndoShortcut', 'isRedoShortcut', 'isRefreshShortcut', 'isF5RefreshShortcut', 'isAddAvailabilityShortcut', 'isAvailabilityDialogOpen', 'focusExistingAvailabilityDialog']);
    mockDialogDataService = jasmine.createSpyObj('DialogDataService', ['prepareAvailabilityDialogData']);
    mockCalendarManager = jasmine.createSpyObj('CalendarService', ['initializeCalendarOptions', 'updateCalendarWithAvailability', 'refreshFullCalendar', 'updateSingleCalendarEvent', 'openContextMenuAtPosition', 'isDateInPast']);
    mockCalendarEvents = jasmine.createSpyObj('CalendarEventsService', ['handleEventClick']);
    mockClipboardService = jasmine.createSpyObj('AvailabilityClipboardService', ['copySlots']);
    mockPendingChangesService = jasmine.createSpyObj('PendingChangesService', ['initialize', 'getCurrentState$', 'getPendingChanges', 'saveChanges', 'hasPendingChanges', 'discardChanges']);
    mockChangesSynchronizerService = jasmine.createSpyObj('ChangesSynchronizerService', ['saveChanges']);
    mockDragResizeService = jasmine.createSpyObj('DragResizeService', ['handleEventResize', 'handleEventDrop']);
    mockEventHandlerService = jasmine.createSpyObj('AvailabilityEventHandlerService', ['handleDateSelect', 'handleEventClick', 'handleEventContextMenu']);
    mockUiService = jasmine.createSpyObj('AvailabilityUiService', ['refreshAvailability', 'dismissSummary', 'openDatePicker', 'copySlots', 'navigateCalendar', 'changeView', 'isViewActive']);
    mockDialogCoordinatorService = jasmine.createSpyObj('AvailabilityDialogCoordinatorService', ['addAvailability', 'editSlot', 'deleteSlot', 'openCopyWeekDialog']);
    mockUndoRedoService = jasmine.createSpyObj('UndoRedoCoordinatorService', ['handleUndoShortcut', 'handleRedoShortcut', 'onChangesSaved', 'onChangesDiscarded', 'undo', 'redo']);

    mockStore.select.and.returnValue(of('user1'));
    mockPendingChangesService.getCurrentState$.and.returnValue(of([mockAvailability]));

    await TestBed.configureTestingModule({
      imports: [AvailabilityComponent],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: MatDialog, useValue: mockDialog },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: DialogManagementService, useValue: mockDialogService },
        { provide: CalendarOperationsService, useValue: mockCalendarService },
        { provide: KeyboardShortcutService, useValue: mockKeyboardShortcutService },
        { provide: DialogDataService, useValue: mockDialogDataService },
        { provide: CalendarService, useValue: mockCalendarManager },
        { provide: CalendarEventsService, useValue: mockCalendarEvents },
        { provide: AvailabilityClipboardService, useValue: mockClipboardService },
        { provide: PendingChangesService, useValue: mockPendingChangesService },
        { provide: ChangesSynchronizerService, useValue: mockChangesSynchronizerService },
        { provide: DragResizeService, useValue: mockDragResizeService },
        { provide: AvailabilityEventHandlerService, useValue: mockEventHandlerService },
        { provide: AvailabilityUiService, useValue: mockUiService },
        { provide: AvailabilityDialogCoordinatorService, useValue: mockDialogCoordinatorService },
        { provide: UndoRedoCoordinatorService, useValue: mockUndoRedoService },
        { provide: AvailabilityStateService, useValue: mockAvailabilityStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('copySlots', () => {
    it('should copy a slot to the clipboard service', () => {
      component.copySlots([mockAvailability]);
      
      expect(mockUiService.copySlots).toHaveBeenCalledWith([mockAvailability], mockClipboardService);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Slots copied to clipboard');
    });
  });

  describe('Event Handlers', () => {
    it('should delegate handleDateSelect to the event handler service', () => {
      const mockSelectInfo = {};
      component.handleDateSelect(mockSelectInfo as any);
      
      expect(mockEventHandlerService.handleDateSelect).toHaveBeenCalledWith(mockSelectInfo, jasmine.any(Object));
    });

    it('should delegate handleEventClick to the event handler service', () => {
      const mockClickInfo = {};
      component.handleEventClick(mockClickInfo as any);
      
      expect(mockEventHandlerService.handleEventClick).toHaveBeenCalledWith(mockClickInfo, jasmine.any(Object));
    });
  });

  describe('UI Operations', () => {
    it('should delegate refreshAvailability to the UI service', () => {
      component.refreshAvailability();
      
      expect(mockUiService.refreshAvailability).toHaveBeenCalled();
    });

    it('should delegate dismissSummary to the UI service', () => {
      component.dismissSummary();
      
      expect(mockUiService.dismissSummary).toHaveBeenCalled();
    });

    it('should delegate openDatePicker to the UI service', () => {
      component.openDatePicker();
      
      expect(mockUiService.openDatePicker).toHaveBeenCalledWith(component.calendarComponent);
    });

    it('should delegate navigateCalendar to the UI service', () => {
      component.navigateCalendar('prev');
      
      expect(mockUiService.navigateCalendar).toHaveBeenCalledWith(component.calendarComponent, 'prev');
    });

    it('should delegate changeView to the UI service', () => {
      component.changeView('timeGridWeek');
      
      expect(mockUiService.changeView).toHaveBeenCalledWith(component.calendarComponent, 'timeGridWeek');
    });

    it('should delegate isViewActive to the UI service', () => {
      mockUiService.isViewActive.and.returnValue(true);
      const result = component.isViewActive('timeGridWeek');
      
      expect(mockUiService.isViewActive).toHaveBeenCalledWith(component.calendarComponent, 'timeGridWeek');
      expect(result).toBe(true);
    });
  });

  describe('Dialog Operations', () => {
    it('should delegate editSlot to the dialog coordinator service', () => {
      component.editSlot(mockAvailability);
      
      expect(mockDialogCoordinatorService.editSlot).toHaveBeenCalledWith(mockAvailability);
    });

    it('should delegate deleteSlot to the dialog coordinator service', () => {
      component.deleteSlot(mockAvailability);
      
      expect(mockDialogCoordinatorService.deleteSlot).toHaveBeenCalledWith(mockAvailability);
    });

    it('should delegate addAvailability to the dialog coordinator service', () => {
      component.addAvailability();
      
      expect(mockDialogCoordinatorService.addAvailability).toHaveBeenCalled();
    });

    it('should delegate openCopyWeekDialog to the dialog coordinator service', () => {
      component.openCopyWeekDialog();
      
      expect(mockDialogCoordinatorService.openCopyWeekDialog).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle copy shortcut (Ctrl+C)', () => {
      const mockEvent = new KeyboardEvent('keydown', { ctrlKey: true, key: 'c' });
      spyOn(component, 'copySlots');
      component.selectedSlot = mockAvailability;
      
      component.handleKeyboardEvent(mockEvent);
      
      expect(component.copySlots).toHaveBeenCalledWith([mockAvailability]);
    });
  });
});