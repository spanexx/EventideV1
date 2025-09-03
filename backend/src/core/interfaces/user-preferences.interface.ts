export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface WorkingHours {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface CalendarPreferences {
  defaultView: 'day' | 'week' | 'month';
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  workingHours: WorkingHours;
  slotDuration?: number; // Default slot duration in minutes
  bufferTime?: number; // Buffer time between appointments in minutes
  autoAcceptBookings?: boolean; // Automatically accept bookings within availability
  showWeekends?: boolean; // Show weekends in calendar view
  timeFormat?: '12h' | '24h'; // Time format preference
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'system';
  calendar: CalendarPreferences;
  language: string;
  timezone: string;
}

export interface UpdateUserPreferencesDto {
  notifications?: Partial<NotificationPreferences>;
  theme?: 'light' | 'dark' | 'system';
  calendar?: Partial<CalendarPreferences>;
  language?: string;
  timezone?: string;
}

export const defaultUserPreferences: UserPreferences = {
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
  theme: 'system',
  calendar: {
    defaultView: 'week',
    firstDayOfWeek: 1, // Monday
    workingHours: {
      start: '09:00',
      end: '17:00',
    },
    slotDuration: 30,
    bufferTime: 0,
    autoAcceptBookings: true,
    showWeekends: true,
    timeFormat: '24h',
  },
  language: 'en',
  timezone: 'UTC',
};
