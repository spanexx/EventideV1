import { Document, Types } from 'mongoose';
import { AvailabilityType, DayOfWeek, AvailabilityStatus } from '../availability.schema';

export interface IAvailability extends Document {
  _id: Types.ObjectId;
  providerId: string;
  type: AvailabilityType;
  dayOfWeek?: DayOfWeek;
  date?: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  isBooked: boolean;
  bookingId?: string;
  maxBookings: number;
  status: AvailabilityStatus;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
