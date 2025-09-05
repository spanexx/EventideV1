export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed'
}

export interface Booking {
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

export interface CreateBookingRequest extends Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> {}

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