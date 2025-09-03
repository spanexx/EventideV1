import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PinMapping {
  _id: any;
  id: any;

  @Prop({ type: String, required: true, unique: true, index: true })
  pinHash!: string;

  @Prop({ type: String, required: true, index: true, ref: 'User' })
  userId!: string;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

export type PinMappingDocument = PinMapping & Document;
export const PinMappingSchema = SchemaFactory.createForClass(PinMapping);
