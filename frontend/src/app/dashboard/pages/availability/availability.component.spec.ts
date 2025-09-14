import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AvailabilityComponent } from './availability.component';
import { AvailabilityClipboardService } from '../../services/clipboard/availability-clipboard.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { DialogManagementService } from '../../services/dialog/dialog-management.service';
import { CalendarOperationsService } from '../../services/calendar/calendar-operations.service';
import { HistoryManagementService } from '../../services/history/history-management.service';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { DialogDataService } from '../../services/dialog/dialog-data.service';
import { BusinessLogicService } from '../../services/business/business-logic.service';
import { CalendarService } from './calendar/calendar.service';
import { CalendarEventsService } from './calendar/calendar-events.service';
import { AvailabilityService } from '../../services/availability.service';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';

describe('AvailabilityComponent', () => {
  let component: AvailabilityComponent;
  let fixture: ComponentFixture<AvailabilityComponent>;
  let mockStore: jasmine.SpyObj<Store>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockAvailabilityService: jasmine.SpyObj<AvailabilityService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialogService: jasmine.SpyObj<DialogManagementService>;
  let mockCalendarService: jasmine.SpyObj<CalendarOperationsService>;
  let mockHistoryService: jasmine.SpyObj<HistoryManagementService>;
  let mockKeyboardShortcutService: jasmine.SpyObj<KeyboardShortcutService>;
  let mockDialogDataService: jasmine.SpyObj<DialogDataService>;
  let mockBusinessLogicService: jasmine.SpyObj<BusinessLogicService>;
  let mockCalendarManager: jasmine.SpyObj<CalendarService>;
  let mockCalendarEvents: jasmine.SpyObj<CalendarEventsService>;
  let mockClipboardService: jasmine.SpyObj<AvailabilityClipboardService>;

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
    // Create spy objects for all services
    mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockAvailabilityService = jasmine.createSpyObj('AvailabilityService', ['convertToCalendarEvents']);
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    mockDialogService = jasmine.createSpyObj('DialogManagementService', [
      'isAvailabilityDialogOpen',
      'focusExistingAvailabilityDialog',
      'openAvailabilityDialog',
      'openConfirmationDialog'
    ]);
    mockCalendarService = jasmine.createSpyObj('CalendarOperationsService', ['isDateInPast', 'hasExistingAvailability']);
    mockHistoryService = jasmine.createSpyObj('HistoryManagementService', [
      'saveToHistory',
      'getPreviousState',
      'getNextState',
      'canUndo',
      'canRedo'
    ]);
    mockKeyboardShortcutService = jasmine.createSpyObj('KeyboardShortcutService', [
      'isCalendarFocused',
      'isUndoShortcut',
      'isRedoShortcut',
      'isRefreshShortcut',
      'isCopyWeekShortcut',
      'isAddAvailabilityShortcut',
      'isF5RefreshShortcut',
      'isAvailabilityDialogOpen',
      'focusExistingAvailabilityDialog'
    ]);
    mockDialogDataService = jasmine.createSpyObj('DialogDataService', ['prepareAvailabilityDialogData']);
    mockBusinessLogicService = jasmine.createSpyObj('BusinessLogicService', ['summary$', 'refreshAvailability', 'clearSummary']);
    mockCalendarManager = jasmine.createSpyObj('CalendarService', ['initializeCalendarOptions']);
    mockCalendarEvents = jasmine.createSpyObj('CalendarEventsService', ['handleEventClick']);
    mockClipboardService = jasmine.createSpyObj('AvailabilityClipboardService', [
      'copySlots'
    ]);

    // Set up default return values
    mockStore.select.and.returnValue(of([]));
    mockCalendarManager.initializeCalendarOptions.and.returnValue({});
    Object.defineProperty(mockBusinessLogicService, 'summary$', { value: of(null) });

    await TestBed.configureTestingModule({
      imports: [AvailabilityComponent],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: MatDialog, useValue: mockDialog },
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: DialogManagementService, useValue: mockDialogService },
        { provide: CalendarOperationsService, useValue: mockCalendarService },
        { provide: HistoryManagementService, useValue: mockHistoryService },
        { provide: KeyboardShortcutService, useValue: mockKeyboardShortcutService },
        { provide: DialogDataService, useValue: mockDialogDataService },
        { provide: BusinessLogicService, useValue: mockBusinessLogicService },
        { provide: CalendarService, useValue: mockCalendarManager },
        { provide: CalendarEventsService, useValue: mockCalendarEvents },
        { provide: AvailabilityClipboardService, useValue: mockClipboardService }
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
      
      expect(mockClipboardService.copySlots).toHaveBeenCalledWith([mockAvailability]);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Slots copied to clipboard');
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