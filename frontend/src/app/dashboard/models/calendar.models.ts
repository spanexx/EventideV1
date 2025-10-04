// Calendar models
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export interface CalendarState {
  currentView: CalendarView;
  preferredView: CalendarView | null; // User's preferred default view
  dateRange: DateRange;
  loading: boolean;
  error: string | null;
}

// Calendar preferences for user settings
export interface CalendarPreferences {
  defaultView: CalendarView;
  autoSwitchView: boolean; // Whether to auto-switch based on content
  rememberLastView: boolean; // Whether to remember last used view
  smartRecommendations: boolean; // Whether to show view recommendations
  // Go to Date behavior settings
  goToDateBehavior: 'temporary-day' | 'temporary-preferred' | 'change-to-day' | 'change-to-preferred'; // How "Go to Date" should behave
}