import { Document, Types } from 'mongoose';
import { AvailabilityType, DayOfWeek } from '../availability.schema';

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
  createdAt: Date;
  updatedAt: Date;
}
