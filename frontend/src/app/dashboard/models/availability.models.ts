// Availability models
export interface Availability {
  id: string;
  providerId: string;
  type: 'recurring' | 'one_off';
  dayOfWeek?: number;
  date?: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
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