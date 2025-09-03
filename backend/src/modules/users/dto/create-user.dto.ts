import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
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
