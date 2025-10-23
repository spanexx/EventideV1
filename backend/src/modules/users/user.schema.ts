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

export enum IndustryCategory {
  // Business & Consulting
  BUSINESS_CONSULTING = 'Business Consulting',
  MANAGEMENT_CONSULTING = 'Management Consulting',
  STRATEGY_CONSULTING = 'Strategy Consulting',
  
  // Technology
  SOFTWARE_DEVELOPMENT = 'Software Development',
  WEB_DEVELOPMENT = 'Web Development',
  MOBILE_DEVELOPMENT = 'Mobile Development',
  IT_CONSULTING = 'IT Consulting',
  CYBERSECURITY = 'Cybersecurity',
  DATA_ANALYTICS = 'Data Analytics',
  CLOUD_SERVICES = 'Cloud Services',
  
  // Marketing & Design
  DIGITAL_MARKETING = 'Digital Marketing',
  GRAPHIC_DESIGN = 'Graphic Design',
  BRANDING = 'Branding',
  CONTENT_CREATION = 'Content Creation',
  SOCIAL_MEDIA = 'Social Media',
  SEO_SEM = 'SEO/SEM',
  
  // Finance & Legal
  FINANCIAL_SERVICES = 'Financial Services',
  ACCOUNTING = 'Accounting',
  LEGAL_SERVICES = 'Legal Services',
  TAX_CONSULTING = 'Tax Consulting',
  
  // Health & Wellness
  HEALTH_WELLNESS = 'Health & Wellness',
  LIFE_COACHING = 'Life Coaching',
  CAREER_COACHING = 'Career Coaching',
  FITNESS = 'Fitness',
  
  // Creative Services
  PHOTOGRAPHY = 'Photography',
  VIDEOGRAPHY = 'Videography',
  WRITING = 'Writing',
  TRANSLATION = 'Translation',
  
  // Real Estate & Property
  REAL_ESTATE = 'Real Estate',
  PROPERTY_MANAGEMENT = 'Property Management',
  
  // Events & Hospitality
  EVENT_PLANNING = 'Event Planning',
  HOSPITALITY = 'Hospitality',
  CATERING = 'Catering',
  
  // Logistics & Operations
  LOGISTICS = 'Logistics',
  SUPPLY_CHAIN = 'Supply Chain',
  TRANSPORTATION = 'Transportation',
  
  // Human Resources
  HR_CONSULTING = 'HR Consulting',
  RECRUITMENT = 'Recruitment',
  TRAINING = 'Training & Development',
  
  // Sales & Business Development
  SALES_TRAINING = 'Sales Training',
  BUSINESS_DEVELOPMENT = 'Business Development',
  
  // Other
  OTHER = 'Other',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, unique: true, required: true, index: true })
  email: string | null = null;

  // Username field - unique and searchable
  @Prop({ type: String, unique: true, sparse: true, index: true })
  username?: string;

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

  @Prop({ default: false })
  isEmailVerified: boolean = false;

  // Google OAuth fields
  @Prop({ type: String, unique: true, sparse: true })
  googleId?: string;

  @Prop({ type: String })
  firstName?: string;

  @Prop({ type: String })
  lastName?: string;

  @Prop({ type: String })
  picture?: string;

  // Business/Provider fields
  @Prop({ type: String })
  businessName?: string;

  @Prop({ type: String })
  bio?: string;

  // Legacy location field (kept for backward compatibility)
  @Prop({ type: String })
  location?: string;

  // Structured location object
  @Prop({
    type: {
      country: { type: String },
      countryCode: { type: String },
      city: { type: String },
      cityCode: { type: String },
      address: { type: String }
    }
  })
  locationDetails?: {
    country?: string;
    countryCode?: string;
    city?: string;
    cityCode?: string;
    address?: string;
  };

  @Prop({ type: String })
  contactPhone?: string;

  @Prop({ type: [String], default: [] })
  services?: string[];

  // Industry categories - can select from predefined or add custom
  @Prop({ 
    type: [String], 
    default: [],
    index: true 
  })
  categories?: string[];

  // Custom categories created by the provider
  @Prop({ type: [String], default: [] })
  customCategories?: string[];

  @Prop({ type: [Number], default: [30, 60, 90] })
  availableDurations?: number[];

  @Prop({ type: Number, default: 0 })
  rating?: number;

  @Prop({ type: Number, default: 0 })
  reviewCount?: number;

  // Privacy and access control fields
  @Prop({ type: String })
  currentAccessCode?: string;

  @Prop({ type: Date })
  accessCodeGeneratedAt?: Date;

  // Password reset fields
  @Prop({ type: String, required: false })
  resetPasswordToken?: string;

  @Prop({ type: Date, required: false })
  resetPasswordExpires?: Date;

  // Payment and subscription fields
  @Prop({ type: String, required: false })
  stripeCustomerId?: string;

  @Prop({ type: String, required: false })
  stripeAccountId?: string; // For providers receiving payments

  @Prop({ type: Date, required: false })
  subscriptionStartDate?: Date;

  @Prop({ type: Date, required: false })
  subscriptionEndDate?: Date;

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
