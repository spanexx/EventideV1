import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'New password',
  })
  @IsString()
  @MinLength(6)
  newPassword!: string;

  @ApiProperty({
    description: 'Password reset token',
  })
  @IsString()
  token!: string;
}
