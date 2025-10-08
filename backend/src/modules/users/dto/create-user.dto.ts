import { IsEmail, IsNotEmpty, IsOptional, MinLength, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserPreferences } from '../user.preferences';

export class CreateUserDto {
  @ApiProperty({
    example: 'provider@example.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({
    example: 'johndoe123',
    description: 'Unique username (3-30 characters, alphanumeric and underscores only)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @Matches(/^[a-zA-Z0-9_]{3,30}$/, {
    message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
  })
  username?: string;

  @ApiProperty({
    example: 'mySecurePassword123',
    description: 'Password for authentication',
  })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    description: 'User preferences for customizing their experience',
  })
  @IsOptional()
  preferences?: Partial<UserPreferences>;
}
