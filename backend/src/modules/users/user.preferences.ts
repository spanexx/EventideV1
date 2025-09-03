export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  calendar: {
    defaultView: 'day' | 'week' | 'month';
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    workingHours: {
      start: string; // HH:mm format
      end: string; // HH:mm format
    };
  };
  language: string;
  timezone: string;
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
  },
  language: 'en',
  timezone: 'UTC',
};
