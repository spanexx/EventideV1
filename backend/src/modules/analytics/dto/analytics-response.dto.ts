import { ApiProperty } from '@nestjs/swagger';

class AnalyticsMetricsDto {
  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  cancellations: number;

  @ApiProperty()
  occupancyRate: number;
}

class TimeSeriesDataPointDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  amount: number;
}

class OccupancyDataPointDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  rate: number;
}

class BookingTrendDataPointDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  count: number;
}

class RevenueDataDto {
  @ApiProperty({ type: [TimeSeriesDataPointDto] })
  daily: TimeSeriesDataPointDto[];

  @ApiProperty({ type: [TimeSeriesDataPointDto] })
  weekly: TimeSeriesDataPointDto[];

  @ApiProperty({ type: [TimeSeriesDataPointDto] })
  monthly: TimeSeriesDataPointDto[];
}

class OccupancyDataDto {
  @ApiProperty({ type: [OccupancyDataPointDto] })
  daily: OccupancyDataPointDto[];

  @ApiProperty({ type: [OccupancyDataPointDto] })
  weekly: OccupancyDataPointDto[];

  @ApiProperty({ type: [OccupancyDataPointDto] })
  monthly: OccupancyDataPointDto[];
}

export class AnalyticsDataDto {
  @ApiProperty({ type: AnalyticsMetricsDto })
  metrics: AnalyticsMetricsDto;

  @ApiProperty({ type: RevenueDataDto })
  revenueData: RevenueDataDto;

  @ApiProperty({ type: OccupancyDataDto })
  occupancyData: OccupancyDataDto;

  @ApiProperty({ type: [BookingTrendDataPointDto] })
  bookingTrends: BookingTrendDataPointDto[];
}