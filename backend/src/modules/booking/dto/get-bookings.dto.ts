import { IsOptional, IsDate, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../booking.schema';

export class GetBookingsDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  guestId?: string;
}
