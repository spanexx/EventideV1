import { IsOptional, IsEnum, IsString, Length, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../booking.schema';

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;
}
