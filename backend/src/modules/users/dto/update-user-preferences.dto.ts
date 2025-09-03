import {
  IsOptional,
  IsBoolean,
  IsIn,
  IsString,
  ValidateNested,
  IsObject,
  Matches,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class NotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

class WorkingHoursDto {
  @ApiPropertyOptional({
    description: 'Start time in HH:mm format',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format',
  })
  start?: string;

  @ApiPropertyOptional({
    description: 'End time in HH:mm format',
    example: '17:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format',
  })
  end?: string;
}

class CalendarPreferencesDto {
  @ApiPropertyOptional({
    description: 'Default calendar view',
    enum: ['day', 'week', 'month'],
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  defaultView?: 'day' | 'week' | 'month';

  @ApiPropertyOptional({
    description: 'First day of week (0 = Sunday, 1 = Monday, etc.)',
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  firstDayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Working hours configuration',
    type: WorkingHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;
}

export class UpdateUserPreferencesDto {
  @ApiPropertyOptional({
    description: 'Notification preferences',
    type: NotificationPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;

  @ApiPropertyOptional({
    description: 'Theme preference',
    enum: ['light', 'dark', 'system'],
  })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';

  @ApiPropertyOptional({
    description: 'Calendar preferences',
    type: CalendarPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarPreferencesDto)
  calendar?: CalendarPreferencesDto;

  @ApiPropertyOptional({
    description: 'Language preference (ISO 639-1 code)',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}$/, {
    message: 'Language must be a valid ISO 639-1 code (e.g., en, es, fr)',
  })
  language?: string;

  @ApiPropertyOptional({
    description: 'Timezone preference (IANA timezone)',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
