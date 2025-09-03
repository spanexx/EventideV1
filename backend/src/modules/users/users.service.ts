import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, SubscriptionTier } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { defaultUserPreferences, UserPreferences } from './user.preferences';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { EmailService } from '../../core/email/email.service';

interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly PASSWORD_RESET_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    try {
      // Check if user already exists
      this.logger.log(
        `Checking if user already exists: ${createUserDto.email}`,
      );
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        this.logger.warn(
          `User already exists with email: ${createUserDto.email}`,
        );
        throw new ConflictException('Email already exists');
      }

      // Hash the password
      this.logger.log(`Hashing password for user: ${createUserDto.email}`);
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create the user
      this.logger.log(`Creating user document for: ${createUserDto.email}`);
      const createdUser = new this.userModel({
        email: createUserDto.email,
        password: hashedPassword,
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        preferences: createUserDto.preferences || {},
        isActive: true,
      });

      this.logger.log(`Saving user to database: ${createUserDto.email}`);
      const user = await createdUser.save();

      // Send welcome email
      try {
        this.logger.log(`Sending welcome email to: ${createUserDto.email}`);
        await this.emailService.sendWelcomeEmailPassword(createUserDto.email);
      } catch (emailError) {
        this.logger.warn(
          `Failed to send welcome email to ${createUserDto.email}, but user was created successfully:`,
          emailError,
        );
        // Don't throw the error, as we want to allow signup to complete even if email fails
      }

      this.logger.log(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to create user with email ${createUserDto.email}:`,
        error,
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByIdPublic(id: string): Promise<Partial<UserDocument>> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }
    
    // Return only public information that exists in the User schema
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      picture: user.picture // Using picture instead of avatar as it exists in the schema
    };
  }

  /**
   * Find all active users
   * @returns Promise<UserDocument[]>
   */
  async findAllActive(): Promise<UserDocument[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<UserDocument> {
    const user = await this.findById(id);

    delete updates.password;

    Object.assign(user, updates);
    return user.save();
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user || !user.password) return false;
    return await bcrypt.compare(password, user.password);
  }

  async updateSubscriptionTier(
    id: string,
    tier: SubscriptionTier,
  ): Promise<UserDocument> {
    const user = await this.findById(id);
    user.subscriptionTier = tier;
    return user.save();
  }

  async deactivateUser(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isActive = false;
    await user.save();
  }

  // Password reset methods
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.findByEmail(email);
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

  // User preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    this.logger.log(`Getting preferences for user: ${userId}`);

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.preferences || defaultUserPreferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: UpdateUserPreferencesDto,
  ): Promise<UserPreferences> {
    this.logger.log(`Updating preferences for user: ${userId}`);
    this.logger.log(
      `Received preferences DTO:`,
      JSON.stringify(preferences, null, 2),
    );

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Merge the existing preferences with the new ones
    const currentPreferences = user.preferences || defaultUserPreferences;
    this.logger.log(
      `Current user preferences:`,
      JSON.stringify(currentPreferences, null, 2),
    );

    const updatedPreferences: UserPreferences = {
      notifications: {
        ...currentPreferences.notifications,
        ...preferences.notifications,
      },
      theme: preferences.theme ?? currentPreferences.theme,
      calendar: {
        ...currentPreferences.calendar,
        ...preferences.calendar,
        firstDayOfWeek: (preferences.calendar?.firstDayOfWeek ??
          currentPreferences.calendar.firstDayOfWeek) as
          | 0
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6,
        workingHours: {
          ...currentPreferences.calendar.workingHours,
          ...preferences.calendar?.workingHours,
        },
      },
      language: preferences.language ?? currentPreferences.language,
      timezone: preferences.timezone ?? currentPreferences.timezone,
    };

    this.logger.log(
      `Merged preferences before save:`,
      JSON.stringify(updatedPreferences, null, 2),
    );
    this.logger.log(
      `New timezone value: ${preferences.timezone} -> ${updatedPreferences.timezone}`,
    );

    user.preferences = updatedPreferences;
    const savedUser = await user.save();

    this.logger.log(
      `Saved user document:`,
      JSON.stringify(savedUser.toObject(), null, 2),
    );
    this.logger.log(
      `Saved user preferences:`,
      JSON.stringify(savedUser.preferences, null, 2),
    );
    this.logger.log(`Successfully updated preferences for user: ${userId}`);

    // Log what we're returning
    this.logger.log(
      `Returning preferences:`,
      JSON.stringify(savedUser.preferences, null, 2),
    );
    this.logger.log(`Returning timezone: ${savedUser.preferences.timezone}`);

    return savedUser.preferences;
  }

  async resetUserPreferences(userId: string): Promise<UserPreferences> {
    this.logger.log(`Resetting preferences to defaults for user: ${userId}`);

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.preferences = { ...defaultUserPreferences };
    const savedUser = await user.save();

    this.logger.log(`Successfully reset preferences for user: ${userId}`);
    return savedUser.preferences;
  }

  // Google OAuth methods
  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<UserDocument> {
    // Try to find existing user by Google ID
    let user = await this.userModel
      .findOne({ googleId: profile.googleId })
      .exec();

    if (user) {
      // Update user info if needed
      user.firstName = profile.firstName;
      user.lastName = profile.lastName;
      user.picture = profile.picture;
      return await user.save();
    }

    // If not found by Google ID, try to find by email
    user = await this.userModel.findOne({ email: profile.email }).exec();

    if (user) {
      // Link existing account with Google
      user.googleId = profile.googleId;
      user.firstName = profile.firstName;
      user.lastName = profile.lastName;
      user.picture = profile.picture;
      return await user.save();
    }

    // Create new user
    return await this.userModel.create({
      email: profile.email,
      googleId: profile.googleId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
      role: UserRole.PROVIDER,
      subscriptionTier: SubscriptionTier.FREE,
      preferences: {},
      isActive: true,
    });
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }
}
