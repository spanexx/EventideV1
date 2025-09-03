import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: false })
  userId?: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  entityType!: string;

  @Prop({ required: true })
  entityId!: string;

  @Prop({ type: Map, of: String })
  changes!: Map<string, string>;

  @Prop({ type: Map, of: String })
  metadata!: Map<string, string>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
