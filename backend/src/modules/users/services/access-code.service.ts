import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user.schema';
import * as crypto from 'crypto';

@Injectable()
export class AccessCodeService {
  private readonly logger = new Logger(AccessCodeService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Generate a unique access code for a provider
   * Format: 8 characters alphanumeric (e.g., "A7K9M2X4")
   */
  generateAccessCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
    let code = '';
    const bytes = crypto.randomBytes(8);
    
    for (let i = 0; i < 8; i++) {
      code += characters[bytes[i] % characters.length];
    }
    
    return code;
  }

  /**
   * Check if access code needs rotation based on user preferences
   */
  needsRotation(user: UserDocument): boolean {
    if (!user.accessCodeGeneratedAt) {
      return true;
    }

    const rotation = user.preferences?.privacy?.accessCodeRotation || 'weekly';
    const now = new Date();
    const generatedAt = new Date(user.accessCodeGeneratedAt);
    const diffMs = now.getTime() - generatedAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    switch (rotation) {
      case 'daily':
        return diffDays >= 1;
      case 'weekly':
        return diffDays >= 7;
      case 'monthly':
        return diffDays >= 30;
      default:
        return false;
    }
  }

  /**
   * Get or generate access code for a provider
   */
  async getOrGenerateAccessCode(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // If profile is public, no access code needed
    if (user.preferences?.privacy?.profileVisibility === 'public') {
      return '';
    }

    // Check if we need to rotate the code
    if (!user.currentAccessCode || this.needsRotation(user)) {
      const newCode = this.generateAccessCode();
      user.currentAccessCode = newCode;
      user.accessCodeGeneratedAt = new Date();
      await user.save();
      
      this.logger.log(`Generated new access code for user ${userId}: ${newCode}`);
      return newCode;
    }

    return user.currentAccessCode;
  }

  /**
   * Validate access code for a provider
   */
  async validateAccessCode(userId: string, accessCode: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      return false;
    }

    // If profile is public, access code is not required
    if (user.preferences?.privacy?.profileVisibility === 'public') {
      return true;
    }

    // Check if code matches and hasn't expired
    if (user.currentAccessCode === accessCode && !this.needsRotation(user)) {
      return true;
    }

    return false;
  }

  /**
   * Get provider's profile visibility setting
   */
  async getProfileVisibility(userId: string): Promise<'public' | 'private'> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user.preferences?.privacy?.profileVisibility || 'public';
  }

  /**
   * Force rotate access code (manual rotation)
   */
  async forceRotateAccessCode(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const newCode = this.generateAccessCode();
    user.currentAccessCode = newCode;
    user.accessCodeGeneratedAt = new Date();
    await user.save();
    
    this.logger.log(`Manually rotated access code for user ${userId}: ${newCode}`);
    return newCode;
  }
}
