export interface TimeSlot {
  id: string;
  providerId: string;
  date?: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  isBooked: boolean;
}

export interface AvailableSlotsRequest {
  providerId: string;
  date: Date;
  duration: number;
}

export interface SlotAvailabilityRequest {
  providerId: string;
  startTime: Date;
  endTime: Date;
}