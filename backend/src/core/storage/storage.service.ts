/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { FileMetadata } from './schemas/file-metadata.schema';
import { MulterFile } from './types/multer.types';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService {
  private bucket: string;

  constructor(
    private configService: ConfigService,
    @InjectModel(FileMetadata.name)
    private fileMetadataModel: Model<FileMetadata>,
    private readonly storage: Storage,
  ) {
    const bucketName = this.configService.get<string>(
      'GOOGLE_CLOUD_STORAGE_BUCKET',
    );
    if (!bucketName) {
      throw new Error('Missing GOOGLE_CLOUD_STORAGE_BUCKET configuration');
    }
    this.bucket = bucketName;
  }

  async uploadFile(
    file: MulterFile,
    userId?: string,
    metadata?: Record<string, any>,
    tags?: string[],
  ): Promise<FileMetadata> {
    const uniqueFilename = this.generateUniqueFilename(
      (file as any).originalname,
    );
    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(uniqueFilename);

    // Upload file to Google Cloud Storage
    await blob.save((file as any).buffer, {
      contentType: (file as any).mimetype,
      metadata: {
        metadata: {
          originalname: (file as any).originalname,
          userId,
          ...metadata,
        },
      },
    });

    // Generate signed URL (valid for 7 days)
    const [url] = await blob.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Save file metadata to MongoDB
    const fileMetadata = new this.fileMetadataModel({
      filename: uniqueFilename,
      originalname: (file as any).originalname,
      mimetype: (file as any).mimetype,
      size: (file as any).size,
      url,
      bucket: this.bucket,
      userId,
      metadata,
      tags: tags || [],
    });

    return fileMetadata.save();
  }

  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const metadata = await this.fileMetadataModel.findById(fileId);
    if (!metadata) {
      throw new NotFoundException('File metadata not found');
    }
    return metadata;
  }

  async deleteFile(fileId: string): Promise<void> {
    const metadata = await this.getFileMetadata(fileId);
    const bucket = this.storage.bucket(this.bucket);
    const file = bucket.file(metadata.filename);

    await file.delete();
    await this.fileMetadataModel.findByIdAndDelete(fileId);
  }

  async generateSignedUrl(
    filename: string,
    action: 'read' | 'write' = 'read',
    expiresIn: number = 7 * 24 * 60 * 60 * 1000,
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const file = bucket.file(filename);
    const [url] = await file.getSignedUrl({
      action,
      expires: Date.now() + expiresIn,
    });
    return url;
  }

  private generateUniqueFilename(originalname: string): string {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalname);
    const sanitizedName = path
      .basename(originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    return `${sanitizedName}-${timestamp}-${hash}${ext}`;
  }

  async searchFiles(query: {
    userId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<FileMetadata[]> {
    const filter: FilterQuery<FileMetadata> = {};

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.tags?.length) {
      filter.tags = { $all: query.tags };
    }

    if (query.metadata) {
      Object.entries(query.metadata).forEach(([key, value]) => {
        filter[`metadata.${key}` as keyof FileMetadata] = value;
      });
    }

    return this.fileMetadataModel.find(filter).sort({ createdAt: -1 });
  }
}
