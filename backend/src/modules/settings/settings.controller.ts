import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import * as SettingsTypes from './settings.types';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentUser() userId: string): Promise<SettingsTypes.UserSettings> {
    return this.settingsService.getUserSettings(userId);
  }

  @Patch()
  async updateSettings(
    @CurrentUser() userId: string,
    @Body() updateSettingsDto: SettingsTypes.UpdateSettingsDto
  ): Promise<SettingsTypes.UserSettings> {
    return this.settingsService.updateUserSettings(userId, updateSettingsDto);
  }

  @Patch('working-hours')
  async updateWorkingHours(
    @CurrentUser() userId: string,
    @Body('start') start: string,
    @Body('end') end: string
  ): Promise<SettingsTypes.UserSettings> {
    return this.settingsService.updateWorkingHours(userId, { start, end });
  }
}