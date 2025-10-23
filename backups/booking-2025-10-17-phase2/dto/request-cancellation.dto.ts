import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RequestCancellationDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsEmail()
  @IsNotEmpty()
  guestEmail: string;

  @IsString()
  @IsOptional()
  serialKey?: string;
}
