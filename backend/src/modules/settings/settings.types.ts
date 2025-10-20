export interface WorkingHours {
  start: string;
  end: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  calendar: {
    defaultView: 'day' | 'week' | 'month';
    firstDayOfWeek: number;
    workingHours: WorkingHours;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    accessCodeRotation: 'daily' | 'weekly' | 'monthly';
  };
  booking: {
    autoConfirmBookings: boolean;
  };
}

export type UpdateSettingsDto = Partial<Omit<UserSettings, 'id' | 'userId'>>;