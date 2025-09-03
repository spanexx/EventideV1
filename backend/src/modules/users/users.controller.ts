import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import { User } from './user.schema';
import { RolesGuard } from '../../core/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from './user.schema';
import type { Request } from 'express';

@ApiTags('users')
@Controller('users')
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // User preferences endpoints - MUST be before parameterized routes
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user found', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMe(@Req() req: Request): Promise<User> {
    const userId = (req.user as any).id;
    const user = await this.usersService.findById(userId);
    // Remove sensitive fields before returning
    const { password, ...result } = user.toObject();
    return result as User;
  }

  @Get('me/preferences')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: { limit: 100, ttl: 60000 }, // Allow 100 preference reads per minute
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences retrieved successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMyPreferences(
    @Req() req: Request,
  ): Promise<UserPreferencesResponseDto> {
    const userId = (req.user as any).id;
    const preferences = await this.usersService.getUserPreferences(userId);
    return new UserPreferencesResponseDto(preferences);
  }

  @Patch('me/preferences')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Throttle({
    default: { limit: 30, ttl: 60000 }, // Allow 30 preference updates per minute
    short: { limit: 10, ttl: 10000 }, // Allow 10 updates per 10 seconds for quick changes
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences updated successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid preference data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - please wait before making more changes',
  })
  async updateMyPreferences(
    @Req() req: Request,
    @Body() updatePreferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const userId = (req.user as any).id;
    const preferences = await this.usersService.updateUserPreferences(
      userId,
      updatePreferencesDto,
    );
    return new UserPreferencesResponseDto(preferences);
  }

  @Post('me/preferences/reset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: { limit: 5, ttl: 60000 }, // Allow 5 resets per minute (should be enough)
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset current user preferences to defaults' })
  @ApiResponse({
    status: 200,
    description: 'User preferences reset successfully',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many reset requests' })
  async resetMyPreferences(
    @Req() req: Request,
  ): Promise<UserPreferencesResponseDto> {
    const userId = (req.user as any).id;
    const preferences = await this.usersService.resetUserPreferences(userId);
    return new UserPreferencesResponseDto(preferences);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    // Remove sensitive fields before returning
    const { password, ...result } = user.toObject();
    return result as User;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.usersService.updateUser(id, updateUserDto);
    // Remove sensitive fields before returning
    const { password, ...result } = user.toObject();
    return result as User;
  }

  @Patch(':id/subscription')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user subscription tier (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateSubscription(
    @Param('id') id: string,
    @Body('tier') tier: string,
  ): Promise<User> {
    const user = await this.usersService.updateSubscriptionTier(
      id,
      tier as any,
    );
    // Remove sensitive fields before returning
    const { password, ...result } = user.toObject();
    return result as User;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.deactivateUser(id);
  }
}
