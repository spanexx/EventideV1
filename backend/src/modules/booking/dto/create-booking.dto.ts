import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  Length,
  IsPhoneNumber,
  IsUUID,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecurringBookingOptions {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;  // When to stop recurring bookings

  @IsOptional()
  @IsString()
  frequency?: 'weekly' | 'daily';  // How often to repeat

  @IsOptional()
  @Type(() => Number)
  occurrences?: number;  // How many times to repeat (alternative to endDate)
}

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  guestId?: string;

  @IsString()
  @Length(1, 100)
  guestName: string;

  @IsOptional()
  recurring?: RecurringBookingOptions;

  @IsOptional()
  @IsString()
  serialKey?: string; // Added for internal use

  @IsEmail()
  guestEmail: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)'
  })
  guestPhone?: string;

  @IsString()
  providerId: string;

  @IsString()
  availabilityId: string;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @IsOptional()
  @IsString()
  @IsUUID(4)
  idempotencyKey?: string;
}
