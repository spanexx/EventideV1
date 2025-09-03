import { ApiProperty } from '@nestjs/swagger';
import type { MulterFile } from '../types/multer.types';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: MulterFile;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ required: false, type: 'array', items: { type: 'string' } })
  tags?: string[];
}
