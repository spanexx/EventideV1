import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserPreferences } from '../user.preferences';

export class NotificationPreferencesResponse {
  @ApiProperty({ description: 'Email notifications enabled' })
  @Expose()
  email!: boolean;

  @ApiProperty({ description: 'SMS notifications enabled' })
  @Expose()
  sms!: boolean;

  @ApiProperty({ description: 'Push notifications enabled' })
  @Expose()
  push!: boolean;
}

export class WorkingHoursResponse {
  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '09:00',
  })
  @Expose()
  start!: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '17:00',
  })
  @Expose()
  end!: string;
}

export class CalendarPreferencesResponse {
  @ApiProperty({
    description: 'Default calendar view',
    enum: ['day', 'week', 'month'],
  })
  @Expose()
  defaultView!: 'day' | 'week' | 'month';

  @ApiProperty({
    description: 'First day of week (0 = Sunday, 1 = Monday, etc.)',
    minimum: 0,
    maximum: 6,
  })
  @Expose()
  firstDayOfWeek!: number;

  @ApiProperty({
    description: 'Working hours configuration',
    type: WorkingHoursResponse,
  })
  @Expose()
  workingHours!: WorkingHoursResponse;
}

export class PrivacyPreferencesResponse {
  @ApiProperty({ description: 'Profile visibility setting' })
  @Expose()
  profileVisibility!: 'public' | 'private';

  @ApiProperty({ description: 'Access code rotation frequency' })
  @Expose()
  accessCodeRotation!: 'daily' | 'weekly' | 'monthly';
}

export class BookingPreferencesResponse {
  @ApiProperty({ description: 'Auto-confirm bookings setting' })
  @Expose()
  autoConfirmBookings!: boolean;
}

export class PaymentPreferencesResponse {
  @ApiProperty({ description: 'Require payment for bookings' })
  @Expose()
  requirePaymentForBookings!: boolean;

  @ApiProperty({ description: 'Hourly rate in cents', required: false })
  @Expose()
  hourlyRate?: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)' })
  @Expose()
  currency!: string;

  @ApiProperty({ description: 'Accepted payment methods', type: [String], required: false })
  @Expose()
  acceptedPaymentMethods?: string[];
}

export class UserPreferencesResponseDto {
  @ApiProperty({
    description: 'Notification preferences',
    type: NotificationPreferencesResponse,
  })
  @Expose()
  notifications!: NotificationPreferencesResponse;

  @ApiProperty({
    description: 'Theme preference',
    enum: ['light', 'dark', 'system'],
  })
  @Expose()
  theme!: 'light' | 'dark' | 'system';

  @ApiProperty({
    description: 'Calendar preferences',
    type: CalendarPreferencesResponse,
  })
  @Expose()
  calendar!: CalendarPreferencesResponse;

  @ApiProperty({
    description: 'Privacy preferences',
    type: PrivacyPreferencesResponse,
  })
  @Expose()
  privacy!: PrivacyPreferencesResponse;

  @ApiProperty({
    description: 'Booking preferences',
    type: BookingPreferencesResponse,
  })
  @Expose()
  booking!: BookingPreferencesResponse;

  @ApiProperty({
    description: 'Payment preferences',
    type: PaymentPreferencesResponse,
  })
  @Expose()
  payment!: PaymentPreferencesResponse;

  @ApiProperty({
    description: 'Booking approval mode',
    enum: ['auto', 'manual'],
  })
  @Expose()
  bookingApprovalMode!: 'auto' | 'manual' | undefined;

  @ApiProperty({
    description: 'Language preference (ISO 639-1 code)',
    example: 'en',
  })
  @Expose()
  language!: string;

  @ApiProperty({
    description: 'Timezone preference (IANA timezone)',
    example: 'America/New_York',
  })
  @Expose()
  timezone!: string;

  @ApiProperty({
    description: 'Timestamp of last update',
    type: Date,
  })
  @Expose()
  updatedAt!: Date;

  constructor(preferences: UserPreferences, updatedAt: Date = new Date()) {
    console.log('🔧 UserPreferencesResponseDto constructor called');
    console.log('🔧 Input preferences:', JSON.stringify(preferences, null, 2));

    this.notifications = preferences.notifications;
    this.theme = preferences.theme;
    this.calendar = preferences.calendar;
    this.privacy = preferences.privacy;
    this.booking = preferences.booking;
    this.payment = preferences.payment;
    this.bookingApprovalMode = preferences.bookingApprovalMode;
    this.language = preferences.language;
    this.timezone = preferences.timezone;

    console.log('🔧 Setting timezone to:', preferences.timezone);
    console.log('💰 Setting payment to:', JSON.stringify(preferences.payment, null, 2));

    this.updatedAt = updatedAt;

    console.log('🔧 Final DTO:', JSON.stringify(this, null, 2));
  }
}
