import { IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UserPreferences } from '../user.preferences';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User preferences for customizing their experience',
  })
  @IsOptional()
  preferences?: UserPreferences;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
