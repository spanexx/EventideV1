// Booking models
export interface Booking {
  id: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface TimeSlot {
  id: string;
  providerId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  bookingId?: string;
}