import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { UserPreferences } from './user.preferences';
import { defaultUserPreferences } from './user.preferences';

export enum UserRole {
  CLIENT = 'client',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, unique: true, required: true, index: true })
  email: string | null = null;

  // Add password field
  @Prop({ type: String, required: false })
  password?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.PROVIDER })
  role: UserRole = UserRole.PROVIDER;

  @Prop({
    type: String,
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier = SubscriptionTier.FREE;

  @Prop({ type: Object, default: defaultUserPreferences })
  preferences: UserPreferences = defaultUserPreferences;

  @Prop({ default: true })
  isActive: boolean = true;

  // Google OAuth fields
  @Prop({ type: String, unique: true, sparse: true })
  googleId?: string;

  @Prop({ type: String })
  firstName?: string;

  @Prop({ type: String })
  lastName?: string;

  @Prop({ type: String })
  picture?: string;

  // Password reset fields
  @Prop({ type: String, required: false })
  resetPasswordToken?: string;

  @Prop({ type: Date, required: false })
  resetPasswordExpires?: Date;

  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure the virtual id property is correctly set up
UserSchema.virtual('id').get(function () {
  return this._id.toString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Remove internal properties from JSON output
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

UserSchema.pre('save', function (next) {
  if (this.isNew) {
    this.preferences = this.preferences || { ...defaultUserPreferences };
    this.subscriptionTier = this.subscriptionTier || SubscriptionTier.FREE;
    this.isActive = true;
  }
  next();
});
