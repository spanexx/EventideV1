import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { CalendarStateService } from '../services/calendar-state.service';
import * as CalendarActions from '../store-calendar/actions/calendar.actions';
import { CalendarView, DateRange } from '../models/calendar.models';

describe('CalendarStateService', () => {
  let service: CalendarStateService;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  const initialState = {
    calendar: {
      currentView: 'timeGridWeek' as CalendarView,
      dateRange: {
        startDate: new Date(),
        endDate: new Date()
      },
      loading: false,
      error: null
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalendarStateService,
        provideMockStore({ initialState })
      ]
    });

    service = TestBed.inject(CalendarStateService);
    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dispatch setCalendarView action when setView is called', () => {
    const view: CalendarView = 'dayGridMonth';
    service.setView(view);
    expect(dispatchSpy).toHaveBeenCalledWith(CalendarActions.setCalendarView({ view }));
  });

  it('should dispatch setDateRange action when setDateRange is called', () => {
    const dateRange: DateRange = {
      startDate: new Date(),
      endDate: new Date()
    };
    service.setDateRange(dateRange);
    expect(dispatchSpy).toHaveBeenCalledWith(CalendarActions.setDateRange({ dateRange }));
  });

  it('should dispatch navigateCalendar action when navigate is called', () => {
    const direction: 'prev' | 'next' | 'today' = 'next';
    service.navigate(direction);
    expect(dispatchSpy).toHaveBeenCalledWith(CalendarActions.navigateCalendar({ direction }));
  });

  it('should dispatch refreshCalendar action when refresh is called', () => {
    service.refresh();
    expect(dispatchSpy).toHaveBeenCalledWith(CalendarActions.refreshCalendar());
  });
});