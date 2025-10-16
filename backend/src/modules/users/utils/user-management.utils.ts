import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, SubscriptionTier } from '../user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../../../core/email/email.service';

@Injectable()
export class UserManagementUtils {
  private readonly logger = new Logger(UserManagementUtils.name);

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
      const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
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

  async updateUser(id: string, updates: Partial<User>): Promise<UserDocument> {
    // Remove password from updates (use updatePassword method instead)
    delete updates.password;

    // Use findByIdAndUpdate to avoid full document validation
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateSubscriptionTier(
    id: string,
    tier: SubscriptionTier,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.subscriptionTier = tier;
    return user.save();
  }

  async deactivateUser(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    user.isActive = false;
    await user.save();
  }
}
