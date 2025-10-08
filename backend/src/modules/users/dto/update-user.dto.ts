import { IsOptional, IsEmail, IsBoolean, IsString, MinLength, Matches, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UserPreferences } from '../user.preferences';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiPropertyOptional({
    example: 'johndoe123',
    description: 'Unique username (3-30 characters, alphanumeric and underscores only)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,30}$/, {
    message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
  })
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Business or provider name',
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Bio or description',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Location (city, state, country)',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Services offered (array of strings)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({ 
    example: ['Business Consulting', 'IT Consulting'], 
    type: [String],
    description: 'Industry categories (predefined or custom)'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ 
    example: ['Custom Category 1'], 
    type: [String],
    description: 'Custom categories created by provider'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customCategories?: string[];

  @ApiPropertyOptional({
    description: 'Available appointment durations in minutes',
    type: [Number],
  })
  @IsOptional()
  availableDurations?: number[];

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
