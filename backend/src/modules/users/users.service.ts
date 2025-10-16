import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { User, UserDocument, SubscriptionTier } from './user.schema';
import { UserPreferences } from './user.preferences';

// Import modular components
import { AuthProvider } from './providers/auth.provider';
import { UserQueryUtils } from './utils/user-query.utils';
import { UserManagementUtils } from './utils/user-management.utils';
import { PreferencesHandler } from './handlers/preferences.handler';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';

interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

@Injectable()
export class UsersService {
  constructor(
    private authProvider: AuthProvider,
    private userQueryUtils: UserQueryUtils,
    private userManagementUtils: UserManagementUtils,
    private preferencesHandler: PreferencesHandler,
    private googleOAuthStrategy: GoogleOAuthStrategy,
  ) {}

  // Authentication methods
  async markEmailAsVerified(userId: string): Promise<void> {
    return this.authProvider.markEmailAsVerified(userId);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    return this.authProvider.updatePassword(id, newPassword);
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    return this.authProvider.verifyPassword(email, password);
  }

  async requestPasswordReset(email: string): Promise<void> {
    return this.authProvider.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.authProvider.resetPassword(token, newPassword);
  }

  // Query methods
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userQueryUtils.findByEmail(email);
  }

  async findById(id: string): Promise<UserDocument> {
    return this.userQueryUtils.findById(id);
  }

  async findByIdPublic(id: string): Promise<Partial<UserDocument>> {
    return this.userQueryUtils.findByIdPublic(id);
  }

  async findAllPublicProviders(
    search?: string,
    location?: string,
    service?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    return this.userQueryUtils.findAllPublicProviders(search, location, service, page, limit);
  }

  async findAllActive(): Promise<UserDocument[]> {
    return this.userQueryUtils.findAllActive();
  }

  async findAllActivePaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    return this.userQueryUtils.findAllActivePaginated(page, limit);
  }

  // Management methods
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.userManagementUtils.createUser(createUserDto);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<UserDocument> {
    return this.userManagementUtils.updateUser(id, updates);
  }

  async updateSubscriptionTier(
    id: string,
    tier: SubscriptionTier,
  ): Promise<UserDocument> {
    return this.userManagementUtils.updateSubscriptionTier(id, tier);
  }

  async deactivateUser(id: string): Promise<void> {
    return this.userManagementUtils.deactivateUser(id);
  }

  // User preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    return this.preferencesHandler.getUserPreferences(userId);
  }

  async updateUserPreferences(
    userId: string,
    preferences: UpdateUserPreferencesDto,
  ): Promise<UserPreferences> {
    return this.preferencesHandler.updateUserPreferences(userId, preferences);
  }

  async resetUserPreferences(userId: string): Promise<UserPreferences> {
    return this.preferencesHandler.resetUserPreferences(userId);
  }

  // Google OAuth methods
  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<UserDocument> {
    return this.googleOAuthStrategy.findOrCreateGoogleUser(profile);
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.googleOAuthStrategy.findByGoogleId(googleId);
  }
}
