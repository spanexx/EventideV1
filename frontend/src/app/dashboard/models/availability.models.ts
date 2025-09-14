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

export interface BulkSlotConfig {
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface CreateBulkAvailabilityDto {
  providerId: string;
  type?: 'recurring' | 'one_off';
  dayOfWeek?: number;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  quantity?: number;
  slots?: BulkSlotConfig[];
  skipConflicts?: boolean;
  replaceConflicts?: boolean;
  dryRun?: boolean;
  idempotencyKey?: string;
}