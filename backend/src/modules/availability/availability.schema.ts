import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsMongoId,
} from 'class-validator';

export enum AvailabilityType {
  RECURRING = 'recurring',
  ONE_OFF = 'one_off',
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Schema({ timestamps: true })
export class Availability {
  @IsMongoId()
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  @IsString()
  providerId: string;

  @Prop({
    type: String,
    enum: AvailabilityType,
    default: AvailabilityType.ONE_OFF,
  })
  @IsEnum(AvailabilityType)
  type: AvailabilityType;

  // For recurring availability
  @Prop({ type: Number, enum: DayOfWeek, required: false })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  // For one-off availability
  @Prop({ type: Date, required: false, index: true })
  @IsOptional()
  @IsDate()
  date?: Date;

  @Prop({ type: Date, required: true })
  @IsDate()
  startTime: Date;

  @Prop({ type: Date, required: true })
  @IsDate()
  endTime: Date;

  @Prop({ type: Number, required: true })
  @IsNumber()
  duration: number; // in minutes

  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  isBooked: boolean;

  @Prop({ type: String, required: false })
  @IsOptional()
  @IsString()
  bookingId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type AvailabilityDocument = Availability & Document;
export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// Index for efficient querying by provider and date
AvailabilitySchema.index({ providerId: 1, date: 1 });
AvailabilitySchema.index({ providerId: 1, dayOfWeek: 1 });

// Ensure the virtual id property is correctly set up
AvailabilitySchema.virtual('id').get(function () {
  return this._id.toString();
});

AvailabilitySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Remove internal properties from JSON output
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});
