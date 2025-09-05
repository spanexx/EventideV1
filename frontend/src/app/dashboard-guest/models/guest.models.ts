export interface GuestInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
  };
  timezone: string;
}