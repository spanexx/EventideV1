import { Document, Types } from 'mongoose';
import { AvailabilityType, DayOfWeek, AvailabilityStatus } from '../availability.schema';

export interface IAvailabilityBase {
  id?: string;
  _id?: Types.ObjectId;
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
  isTemplate?: boolean;
  isInstantiated?: boolean;
  
  
  // Template handling
  templateId?: string;
  weekOf?: Date;
}

export interface IAvailabilityDocument extends Document {
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
  
  // Template handling
  templateId?: string;
  weekOf?: Date;
}

// Alias for backward compatibility
export type IAvailability = IAvailabilityBase;
