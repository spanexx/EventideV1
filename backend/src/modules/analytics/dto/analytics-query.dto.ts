import { IsOptional, IsISO8601, IsEnum } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

export class ReportQueryDto {
  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsEnum(['pdf', 'csv'])
  reportType: 'pdf' | 'csv';
}