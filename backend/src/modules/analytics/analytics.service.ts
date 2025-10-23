import { Injectable, Logger, Inject } from '@nestjs/common';
import { CachingService } from '../../core/cache/caching.service';
import { AnalyticsGateway } from './analytics.gateway';
import { MetricsAggregatorService, AnalyticsMetrics } from './services/metrics-aggregator.service';
import { RevenueCalculatorService, TimeSeriesDataPoint } from './services/revenue-calculator.service';
import { OccupancyCalculatorService, OccupancyDataPoint } from './services/occupancy-calculator.service';
import { BookingTrendsService, BookingTrendDataPoint } from './services/booking-trends.service';

export type { AnalyticsMetrics, TimeSeriesDataPoint, OccupancyDataPoint, BookingTrendDataPoint };

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  revenueData: {
    daily: TimeSeriesDataPoint[];
    weekly: TimeSeriesDataPoint[];
    monthly: TimeSeriesDataPoint[];
  };
  occupancyData: {
    daily: OccupancyDataPoint[];
    weekly: OccupancyDataPoint[];
    monthly: OccupancyDataPoint[];
  };
  bookingTrends: BookingTrendDataPoint[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @Inject(CachingService) private readonly cachingService: CachingService,
    private readonly analyticsGateway: AnalyticsGateway,
    private readonly metricsAggregator: MetricsAggregatorService,
    private readonly revenueCalculator: RevenueCalculatorService,
    private readonly occupancyCalculator: OccupancyCalculatorService,
    private readonly bookingTrends: BookingTrendsService,
  ) {}

  async getAnalyticsData(providerId: string, startDate: Date, endDate: Date): Promise<AnalyticsData> {
    const cacheKey = `analytics:${providerId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cachedData = await this.cachingService.get<AnalyticsData>(cacheKey);
    if (cachedData) {
      this.logger.log('📊 [AnalyticsService] Cache HIT for analytics data', { providerId, cacheKey });
      return cachedData;
    }
    
    this.logger.log('📊 [AnalyticsService] Cache MISS - Getting analytics data from database', { providerId, startDate, endDate });
    
    const metrics = await this.metricsAggregator.getMetrics(providerId, startDate, endDate);
    this.logger.log('📈 [AnalyticsService] Metrics retrieved', { providerId, metrics });
    
    const revenueData = await this.revenueCalculator.getRevenueData(providerId, startDate, endDate);
    this.logger.log('💰 [AnalyticsService] Revenue data retrieved', { 
      providerId, 
      dailyCount: revenueData.daily.length,
      weeklyCount: revenueData.weekly.length,
      monthlyCount: revenueData.monthly.length
    });
    
    const occupancyData = await this.occupancyCalculator.getOccupancyData(providerId, startDate, endDate);
    this.logger.log('🏠 [AnalyticsService] Occupancy data retrieved', { 
      providerId, 
      dailyCount: occupancyData.daily.length,
      weeklyCount: occupancyData.weekly.length,
      monthlyCount: occupancyData.monthly.length
    });
    
    const bookingTrendsData = await this.bookingTrends.getBookingTrends(providerId, startDate, endDate);
    this.logger.log('📋 [AnalyticsService] Booking trends retrieved', { providerId, count: bookingTrendsData.length });
    
    const result: AnalyticsData = {
      metrics,
      revenueData,
      occupancyData,
      bookingTrends: bookingTrendsData,
    };
    
    await this.cachingService.set(cacheKey, result, 300);

    this.logger.log('✅ [AnalyticsService] Analytics data compilation complete and cached', { 
      providerId, 
      totalDataSize: JSON.stringify(result).length,
      cacheKey
    });

    this.analyticsGateway.emitAnalyticsUpdate(providerId, result);

    return result;
  }
}
