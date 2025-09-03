import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FileMetadataDocument = HydratedDocument<FileMetadata>;

@Schema({
  timestamps: true,
  collection: 'file_metadata',
})
export class FileMetadata {
  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  originalname!: string;

  @Prop({ required: true })
  mimetype!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ required: true })
  url!: string;

  @Prop()
  publicUrl?: string;

  @Prop({ required: true })
  bucket!: string;

  @Prop()
  userId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);
