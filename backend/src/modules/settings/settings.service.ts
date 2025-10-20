import { Injectable } from '@nestjs/common';
import { UserSettings, UpdateSettingsDto } from './settings.types';

@Injectable()
export class SettingsService {
  private settings: Map<string, UserSettings> = new Map();

  async getUserSettings(userId: string): Promise<UserSettings> {
    const existingSettings = this.settings.get(userId);
    if (!existingSettings) {
      // Return default settings if none exist
      const defaultSettings: UserSettings = {
        id: `settings-${userId}`,
        userId,
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        calendar: {
          defaultView: 'week',
          firstDayOfWeek: 1,
          workingHours: {
            start: '09:00',
            end: '17:00'
          }
        },
        privacy: {
          profileVisibility: 'public',
          accessCodeRotation: 'weekly'
        },
        booking: {
          autoConfirmBookings: false
        }
      };
      this.settings.set(userId, defaultSettings);
      return defaultSettings;
    }
    return existingSettings;
  }

  async updateUserSettings(
    userId: string,
    updateSettingsDto: UpdateSettingsDto
  ): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings = {
      ...currentSettings,
      ...updateSettingsDto,
      notifications: {
        ...currentSettings.notifications,
        ...updateSettingsDto.notifications
      }
    };
    this.settings.set(userId, updatedSettings);
    return updatedSettings;
  }

  async updateWorkingHours(
    userId: string,
    workingHours: { start: string; end: string }
  ): Promise<UserSettings> {
    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings = {
      ...currentSettings,
      workingHours
    };
    this.settings.set(userId, updatedSettings);
    return updatedSettings;
  }
}