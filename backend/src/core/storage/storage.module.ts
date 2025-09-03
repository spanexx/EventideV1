import { Module } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { MulterModule } from '@nestjs/platform-express';
import {
  FileMetadata,
  FileMetadataSchema,
} from './schemas/file-metadata.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: FileMetadata.name, schema: FileMetadataSchema },
    ]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService, Storage],
  exports: [StorageService],
})
export class StorageModule {}
