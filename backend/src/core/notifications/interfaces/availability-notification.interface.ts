export interface BulkAvailabilityUpdateContext {
  name: string;
  startDate: Date;
  endDate: Date;
  affectedDays: string[];
  totalSlots: number;
  pattern?: string;
}

export interface AvailabilityOverrideContext {
  name: string;
  date: Date;
  originalHours: string;
  overrideHours: string;
  reason?: string;
}

export interface AvailabilityCancellationContext {
  name: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason?: string;
}
