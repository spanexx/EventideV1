import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KnowledgeDocumentDocument = KnowledgeDocument & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class KnowledgeDocument {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, default: 'en' })
  language: string;

  @Prop({ type: [Number], required: true, index: '2dsphere' }) // For vector similarity search
  embedding: number[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: false })
  requiresAuthentication: boolean;

  @Prop()
  tags?: string[];

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;
}

export const KnowledgeDocumentSchema = SchemaFactory.createForClass(KnowledgeDocument);

// Add text index for content-based search
KnowledgeDocumentSchema.index({ content: 'text', title: 'text' });

// Add compound index for category and tags
KnowledgeDocumentSchema.index({ category: 1, tags: 1, isActive: 1 });