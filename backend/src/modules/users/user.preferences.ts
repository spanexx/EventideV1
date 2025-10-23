export interface UserPreferences {
  bookingApprovalMode?: 'auto' | 'manual';
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
  privacy: {
    profileVisibility: 'public' | 'private';
    accessCodeRotation: 'daily' | 'weekly' | 'monthly';
  };
  booking: {
    autoConfirmBookings: boolean;
  };
  payment: {
    requirePaymentForBookings: boolean;
    hourlyRate?: number; // in cents
    currency: string;
    acceptedPaymentMethods?: string[];
  };
  subscription: {
    tier: 'free' | 'premium';
    features?: string[];
  };
  language: string;
  timezone: string;
}

export const defaultUserPreferences: UserPreferences = {
  bookingApprovalMode: 'auto',
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
  privacy: {
    profileVisibility: 'public',
    accessCodeRotation: 'weekly',
  },
  booking: {
    autoConfirmBookings: true, // Default: auto-confirm bookings
  },
  payment: {
    requirePaymentForBookings: false, // Default: free bookings
    hourlyRate: 5000, // Default: $50/hour (in cents)
    currency: 'usd',
    acceptedPaymentMethods: ['card'],
  },
  subscription: {
    tier: 'free',
    features: [],
  },
  language: 'en',
  timezone: 'UTC',
};
