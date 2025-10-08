export interface GuestInfo {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GuestPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  language?: string;
  timezone?: string;
}
