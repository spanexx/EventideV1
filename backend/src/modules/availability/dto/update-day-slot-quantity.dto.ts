import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min, Max, IsBoolean } from 'class-validator';

export class UpdateDaySlotQuantityDto {
  @ApiProperty({ description: 'The provider ID' })
  @IsString()
  providerId: string;

  @ApiProperty({ description: 'Target date for adjustment', type: Date })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ description: 'Desired total number of slots for the day' })
  @IsNumber()
  @Min(1)
  numberOfSlots: number;

  @ApiPropertyOptional({ description: 'Optional minutes per slot; if provided overrides distribution by count' })
  @IsOptional()
  @IsNumber()
  @Min(15)
  minutesPerSlot?: number;

  @ApiPropertyOptional({ description: 'Break time between slots in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  breakTime?: number;

  @ApiPropertyOptional({ description: 'Whether day is recurring; if true uses dayOfWeek' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}


