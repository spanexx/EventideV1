export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

// Main booking interface matching backend
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
  totalAmount?: number;
  currency?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  serialKey?: string;
  qrCode?: string;
  guestId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Legacy interface for backward compatibility
export interface LegacyBooking {
  id: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  providerId: string;
  availabilityId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  startTime: Date;
  endTime: Date;
  totalAmount?: number;
  currency?: string;
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

export interface BookingResponse {
  booking: Booking;
  success: boolean;
}

export interface GuestInfo {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}