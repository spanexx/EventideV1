import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user.schema';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { defaultUserPreferences, UserPreferences } from '../user.preferences';

@Injectable()
export class PreferencesHandler {
  private readonly logger = new Logger(PreferencesHandler.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

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
      booking: {
        autoConfirmBookings:
          preferences as any && (preferences as any).booking && typeof (preferences as any).booking.autoConfirmBookings === 'boolean'
            ? (preferences as any).booking.autoConfirmBookings
            : (currentPreferences.booking?.autoConfirmBookings ?? true),
      },
      privacy: {
        ...currentPreferences.privacy,
        ...(preferences as any).privacy,
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
}
