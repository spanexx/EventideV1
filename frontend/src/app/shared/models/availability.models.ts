export interface TimeSlot {
  id: string;
  providerId: string;
  date?: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  isBooked: boolean;
  bookingId?: string;
}

export interface AvailableSlotsRequest {
  providerId: string;
  date: Date;
  duration: number;
}

export interface SlotAvailabilityRequest {
  slotId: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
}