import { Controller, Get, Query, UseGuards, ParseEnumPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDataDto } from './dto/analytics-response.dto';
import { AnalyticsQueryDto, ReportQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiTags('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOkResponse({ description: 'Analytics data for the provider', type: AnalyticsDataDto })
  async getAnalyticsData(
    @CurrentUser('id') providerId: string,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsDataDto> {
    console.log('📊 [AnalyticsController] GET /analytics', { providerId, query });
    
    // Parse dates or use defaults (last 30 days)
    const end = query.endDate ? new Date(query.endDate) : new Date();
    const start = query.startDate ? new Date(query.startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return this.analyticsService.getAnalyticsData(providerId, start, end);
  }
  
  @Get('report')
  @ApiOkResponse({ description: 'Generated report' })
  async generateReport(
    @CurrentUser('id') providerId: string,
    @Query() query: ReportQueryDto,
  ) {
    console.log('📊 [AnalyticsController] GET /analytics/report', { providerId, query });
    
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    
    // For now, return a placeholder response
    // In a real implementation, this would generate actual PDF or CSV reports
    return {
      type: query.reportType,
      data: `Report for ${providerId} from ${start.toDateString()} to ${end.toDateString()}\nReport type: ${query.reportType}`
    };
  }
}