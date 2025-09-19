// Calendar models
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export interface CalendarState {
  currentView: CalendarView;
  dateRange: DateRange;
  loading: boolean;
  error: string | null;
}