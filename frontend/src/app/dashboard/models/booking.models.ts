// Booking models matching backend interface
export interface Booking {
  _id?: string;
  id?: string;
  providerId: string;
  availabilityId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  startTime: Date;
  endTime: Date;
  duration?: number;
  status: BookingStatus;
  notes?: string;
  serialKey?: string;
  qrCode?: string;
  guestId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface CreateBookingDto {
  providerId: string;
  availabilityId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  guestId?: string;
  serialKey?: string;
  idempotencyKey?: string;
  recurring?: {
    endDate?: Date;
    frequency?: 'weekly' | 'daily';
    occurrences?: number;
  };
}

export interface UpdateBookingDto {
  status?: BookingStatus;
  notes?: string;
  guestEmail?: string; // Required for cancellations
}

export interface GetBookingsDto {
  providerId?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
}

export interface BookingQRCode {
  qrCode: string;
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