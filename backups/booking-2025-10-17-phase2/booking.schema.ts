import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDate,
  IsMongoId,
  IsNumber,
} from 'class-validator';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NO_SHOW = 'no_show',
}

export enum CompletionReason {
  MANUAL_DURING = 'manual_during',
  MANUAL_AFTER = 'manual_after', 
  AUTO_COMPLETED = 'auto_completed',
  NO_SHOW = 'no_show',
}

@Schema({ timestamps: true })
export class Booking {
  @IsMongoId()
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  @IsString()
  providerId: string;

  @Prop({ type: String, required: true })
  @IsString()
  availabilityId: string;

  @Prop({ type: String, required: true, index: true })
  @IsString()
  guestId: string;

  @Prop({ type: String, required: true })
  @IsString()
  guestName: string;

  @Prop({ type: String, required: true })
  @IsEmail()
  guestEmail: string;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  guestPhone?: string;

  @Prop({ type: Date, required: true, index: true })
  @IsDate()
  startTime: Date;

  @Prop({ type: Date, required: true })
  @IsDate()
  endTime: Date;

  @Prop({ type: String, required: true, unique: true, index: true })
  @IsString()
  serialKey: string;

  @Prop({ type: Number, required: true })
  @IsNumber()
  duration: number; // in minutes

  @Prop({
    type: String,
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @Prop({ 
    type: String, 
    enum: CompletionReason, 
    required: false 
  })
  @IsOptional()
  @IsEnum(CompletionReason)
  completionReason?: CompletionReason;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  completionNotes?: string;

  @Prop({ type: Date, required: false })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  // For idempotency
  @Prop({ type: String, required: false, unique: true, sparse: true })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = Booking & Document;
export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes for efficient querying
BookingSchema.index({ providerId: 1, startTime: 1 });
BookingSchema.index({ guestEmail: 1 });
BookingSchema.index({ status: 1 });
