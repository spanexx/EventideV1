// Availability models
export interface Availability {
  id: string;
  providerId: string;
  dayOfWeek?: number;
  date?: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  isRecurring: boolean;
  isBooked: boolean;
  bookingId?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Metrics {
  totalBookings: number;
  revenue: number;
  cancellations: number;
  occupancyRate: number;
}