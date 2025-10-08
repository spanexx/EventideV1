import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType, DayOfWeek, AvailabilityStatus } from '../availability.schema';

export class CreateAvailabilityDto {
  @ApiProperty({ description: 'The provider ID for this availability slot' })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({ description: 'The type of availability (recurring or one-off)', enum: AvailabilityType })
  @IsOptional()
  @IsEnum(AvailabilityType)
  type?: AvailabilityType;

  @ApiPropertyOptional({ description: 'The day of the week for recurring availability', enum: DayOfWeek })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({ description: 'The specific date for one-off availability', type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({ description: 'The start time of the availability slot', type: Date })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ description: 'The end time of the availability slot', type: Date })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({ description: 'The duration of the availability slot in minutes' })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({ description: 'Whether this slot is already booked' })
  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;

  @ApiPropertyOptional({ description: 'The maximum number of bookings allowed for this slot', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  maxBookings?: number = 1;

  @ApiPropertyOptional({ description: 'The status of the availability slot', enum: AvailabilityStatus, default: AvailabilityStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  status?: AvailabilityStatus = AvailabilityStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'The reason for cancellation if the slot is cancelled' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiPropertyOptional({ description: 'The booking ID if this slot is booked' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate creations' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'If true, replace conflicting slots instead of failing' })
  @IsOptional()
  @IsBoolean()
  replaceConflicts?: boolean;

  @ApiPropertyOptional({ description: 'If true, validate only and do not create' })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
