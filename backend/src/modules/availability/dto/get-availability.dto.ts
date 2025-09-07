import {
  IsString,
  IsOptional,
  IsDate,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetAvailabilityDto {
  @ApiPropertyOptional({ description: 'The provider ID to get availability for' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ description: 'The start date for filtering availability slots', type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'The end date for filtering availability slots', type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
