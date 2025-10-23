import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyCancellationDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsEmail()
  @IsNotEmpty()
  guestEmail: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  verificationCode: string;
}
