import { IsString, IsNumber, IsEmail, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Amount in cents' })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'usd' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ description: 'Success redirect URL' })
  @IsString()
  successUrl: string;

  @ApiProperty({ description: 'Cancel redirect URL' })
  @IsString()
  cancelUrl: string;
}
