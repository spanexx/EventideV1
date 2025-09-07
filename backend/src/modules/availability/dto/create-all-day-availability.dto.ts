import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType, DayOfWeek } from '../availability.schema';
import { CreateAvailabilityDto } from './create-availability.dto';

export class AllDaySlotDto {
  @ApiProperty({ description: 'The start time of the slot', type: Date })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ description: 'The end time of the slot', type: Date })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({ description: 'The duration of the slot in minutes' })
  @IsNumber()
  duration: number;
}

export class CreateAllDayAvailabilityDto {
  @ApiProperty({ description: 'The provider ID for this availability slot' })
  @IsString()
  providerId: string;

  @ApiPropertyOptional({ description: 'The specific date for all-day availability', type: Date })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ description: 'The number of slots to create for the day' })
  @IsNumber()
  @Min(1)
  numberOfSlots: number;

  @ApiPropertyOptional({ description: 'Whether to auto-distribute time evenly' })
  @IsOptional()
  @IsBoolean()
  autoDistribute?: boolean;

  @ApiPropertyOptional({ 
    description: 'Individual slot configurations (used when autoDistribute is false)', 
    type: [AllDaySlotDto] 
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AllDaySlotDto)
  slots?: AllDaySlotDto[];

  @ApiPropertyOptional({ description: 'Whether this is a recurring all-day slot' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'The day of the week for recurring all-day availability', enum: DayOfWeek })
  @IsOptional()
  @IsEnum(DayOfWeek)
  @ValidateIf((object: CreateAllDayAvailabilityDto) => object.isRecurring === true)
  dayOfWeek?: DayOfWeek;
}