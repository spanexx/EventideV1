import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SearchKeywordDocument = SearchKeyword & Document;

@Schema({ timestamps: true })
export class SearchKeyword {
  @Prop({ required: true, unique: true })
  keyword: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [String], default: [] })
  synonyms: string[];

  @Prop({ type: Number, default: 1 })
  weight: number; // For ranking importance

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  relatedKeywords: string[]; // For query expansion
}

export const SearchKeywordSchema = SchemaFactory.createForClass(SearchKeyword);