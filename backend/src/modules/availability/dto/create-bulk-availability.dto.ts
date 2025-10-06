import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType, DayOfWeek } from '../availability.schema';
import { CreateAvailabilityDto } from './create-availability.dto';

export class BulkSlotConfig {
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
}

export class CreateBulkAvailabilityDto {
  @ApiProperty({ description: 'The provider ID for these availability slots' })
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

  @ApiPropertyOptional({ 
    description: 'Date range for creating multiple slots across several days', 
    type: Date 
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ 
    description: 'End date for creating multiple slots across several days', 
    type: Date 
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Number of slots to create' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  quantity?: number;

  @ApiPropertyOptional({ 
    description: 'Individual slot configurations for precise control', 
    type: [BulkSlotConfig] 
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BulkSlotConfig)
  slots?: BulkSlotConfig[];

    @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(15)
  minutesPerSlot?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakTime?: number = 15;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  skipConflicts?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  replaceConflicts?: boolean = false;

  @ApiPropertyOptional({ description: 'If true, validate only and return conflicts without creating' })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({ description: 'Idempotency key to deduplicate bulk operations' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}