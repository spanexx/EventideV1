export interface Booking {
  id: string;
  providerId: string;
  providerName: string;
  service: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: BookingStatus;
  guestNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  COMPLETED = 'completed'
}