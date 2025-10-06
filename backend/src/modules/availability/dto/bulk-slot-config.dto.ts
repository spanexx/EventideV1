import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType } from '../availability.schema';

export class BulkSlotConfig {
  @ApiPropertyOptional()
  @IsString()
  providerId: string;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiPropertyOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: AvailabilityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dayOfWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBooked?: boolean = false;
}
