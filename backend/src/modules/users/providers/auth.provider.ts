import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user.schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { EmailService } from '../../../core/email/email.service';

@Injectable()
export class AuthProvider {
  private readonly logger = new Logger(AuthProvider.name);
  private readonly PASSWORD_RESET_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  async markEmailAsVerified(userId: string): Promise<void> {
    this.logger.log(`Marking email as verified for user: ${userId}`);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.isEmailVerified = true;
    await user.save();
    this.logger.log(`Email marked as verified for user: ${userId}`);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || !user.password) return false;
    return await bcrypt.compare(password, user.password);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      // We don't reveal whether an account exists with that email for security reasons
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(
      Date.now() + this.PASSWORD_RESET_TOKEN_EXPIRY,
    );

    // Save token and expiry to user
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email with reset link
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}:`,
        error,
      );
      throw new Error('Failed to send password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user with matching token that hasn't expired
    const user = await this.userModel
      .findOne({
        resetPasswordToken: { $exists: true },
        resetPasswordExpires: { $gt: new Date() },
      })
      .exec();

    if (!user || !user.resetPasswordToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Verify token
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isTokenValid) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
  }
}
