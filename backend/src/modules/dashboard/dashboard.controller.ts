import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { GetBookingsDto } from '../booking/dto/get-bookings.dto';
import { DashboardBookingsQueryDto } from './dto/bookings-query.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiTags('dashboard')
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOkResponse({ description: 'Dashboard stats for the provider' })
  async getStats(@CurrentUser('providerId') providerId: string) {
    console.log('📊 [DashboardController] GET /dashboard/stats', { providerId });
    return this.dashboardService.getStats(providerId);
  }

  @Get('activity')
  @ApiOkResponse({ description: 'Recent activity items' })
  async getRecentActivity(@CurrentUser('providerId') providerId: string) {
    console.log('📰 [DashboardController] GET /dashboard/activity', { providerId });
    return this.dashboardService.getRecentActivity(providerId);
  }

  @Get('bookings')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO 8601' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO 8601' })
  @ApiQuery({ name: 'page', required: false, schema: { default: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 20 } })
  @ApiQuery({ name: 'sortBy', required: false, schema: { default: 'startTime' } })
  @ApiQuery({ name: 'order', required: false, schema: { default: 'desc', enum: ['asc', 'desc'] } })
  @ApiOkResponse({ description: 'Paginated list of bookings' })
  async getBookings(
    @CurrentUser('providerId') providerId: string,
    @Query() query: DashboardBookingsQueryDto
  ) {
    console.log('📒 [DashboardController] GET /dashboard/bookings', { providerId, query });
    return this.dashboardService.getBookings(providerId, query);
  }
}
