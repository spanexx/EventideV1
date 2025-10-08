import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'The verification token sent to the user\'s email',
    example: 'abc123def456...'
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
