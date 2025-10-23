import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { MetricsAggregatorService } from './services/metrics-aggregator.service';
import { RevenueCalculatorService } from './services/revenue-calculator.service';
import { OccupancyCalculatorService } from './services/occupancy-calculator.service';
import { BookingTrendsService } from './services/booking-trends.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';
import { BookingModule } from '../booking/booking.module';
import { AvailabilityModule } from '../availability/availability.module';
import { CustomCacheModule } from '../../core/cache/cache.module';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Module({
  imports: [BookingModule, AvailabilityModule, CustomCacheModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsGateway,
    MetricsAggregatorService,
    RevenueCalculatorService,
    OccupancyCalculatorService,
    BookingTrendsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [AnalyticsService, AnalyticsGateway],
})
export class AnalyticsModule {}