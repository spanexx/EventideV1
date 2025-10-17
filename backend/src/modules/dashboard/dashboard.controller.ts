import { Controller, Get, Query, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags, ApiOperation } from '@nestjs/swagger';
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
  async getStats(@CurrentUser('id') providerId: string) {
    console.log('📊 [DashboardController] GET /dashboard/stats', { providerId });
    return this.dashboardService.getStats(providerId);
  }

  @Get('activity')
  @ApiOkResponse({ description: 'Recent activity items' })
  async getRecentActivity(@CurrentUser('id') providerId: string) {
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
    @CurrentUser('id') providerId: string,
    @Query() query: DashboardBookingsQueryDto
  ) {
    console.log('📒 [DashboardController] GET /dashboard/bookings', { providerId, query });
    return this.dashboardService.getBookings(providerId, query);
  }

  @Patch('bookings/:id/approve')
  @ApiOperation({ summary: 'Approve a pending booking' })
  @ApiOkResponse({ description: 'Booking approved successfully' })
  async approveBooking(
    @CurrentUser('id') providerId: string,
    @Param('id') bookingId: string
  ) {
    console.log('✅ [DashboardController] PATCH /dashboard/bookings/:id/approve', { providerId, bookingId });
    return this.dashboardService.approveBooking(providerId, bookingId);
  }

  @Patch('bookings/:id/decline')
  @ApiOperation({ summary: 'Decline a pending booking' })
  @ApiOkResponse({ description: 'Booking declined successfully' })
  async declineBooking(
    @CurrentUser('id') providerId: string,
    @Param('id') bookingId: string
  ) {
    console.log('❌ [DashboardController] PATCH /dashboard/bookings/:id/decline', { providerId, bookingId });
    return this.dashboardService.declineBooking(providerId, bookingId);
  }

  @Patch('bookings/:id/complete')
  @ApiOperation({ summary: 'Mark booking as completed' })
  @ApiOkResponse({ description: 'Booking completed successfully' })
  async completeBooking(
    @CurrentUser('id') providerId: string,
    @Param('id') bookingId: string,
    @Body() body: { reason?: string }
  ) {
    console.log('✅ [DashboardController] PATCH /dashboard/bookings/:id/complete REACHED', { 
      providerId, 
      bookingId, 
      body,
      route: 'bookings/:id/complete',
      fullPath: `/api/dashboard/bookings/${bookingId}/complete`
    });
    try {
      const result = await this.dashboardService.completeBooking(providerId, bookingId, body.reason);
      console.log('✅ [DashboardController] completeBooking SUCCESS', { bookingId, result });
      return result;
    } catch (error) {
      console.error('❌ [DashboardController] completeBooking ERROR', { bookingId, error: error.message });
      throw error;
    }
  }

  @Patch('bookings/:id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiOkResponse({ description: 'Booking cancelled successfully' })
  async cancelBooking(
    @CurrentUser('id') providerId: string,
    @Param('id') bookingId: string
  ) {
    console.log('🚫 [DashboardController] PATCH /dashboard/bookings/:id/cancel', { providerId, bookingId });
    return this.dashboardService.cancelBooking(providerId, bookingId);
  }
}
