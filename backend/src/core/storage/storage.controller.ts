import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { FileMetadata } from './schemas/file-metadata.schema';
import type { MulterFile } from './types/multer.types';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to cloud storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        // Allow only images and PDFs
        if (
          !file.mimetype.match(
            /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/,
          )
        ) {
          return cb(new Error('Only images and PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body() dto: FileUploadDto,
  ): Promise<FileMetadata> {
    return this.storageService.uploadFile(
      file,
      dto.userId,
      dto.metadata,
      dto.tags,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiParam({ name: 'id', description: 'File metadata ID' })
  async getFileMetadata(@Param('id') id: string): Promise<FileMetadata> {
    return this.storageService.getFileMetadata(id);
  }

  @Get()
  @ApiOperation({ summary: 'Search files' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'tags', required: false, isArray: true })
  async searchFiles(
    @Query('userId') userId?: string,
    @Query('tags') tags?: string[],
  ): Promise<FileMetadata[]> {
    return this.storageService.searchFiles({ userId, tags });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File metadata ID' })
  async deleteFile(@Param('id') id: string): Promise<void> {
    await this.storageService.deleteFile(id);
  }
}
