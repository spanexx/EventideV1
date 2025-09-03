import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'mySecurePassword123',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  constructor(password: string, email?: string) {
    this.password = password;
    this.email = email;
  }
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token',
  })
  @IsString()
  refreshToken!: string;

  constructor(refreshToken: string) {
    this.refreshToken = refreshToken;
  }
}
