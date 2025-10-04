import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsBoolean, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';

export class AIConflictDto {
  @ApiProperty({ description: 'Type of conflict detected' })
  @IsEnum(['overlap', 'buffer', 'capacity', 'pattern'])
  type: 'overlap' | 'buffer' | 'capacity' | 'pattern';

  @ApiProperty({ description: 'Severity of the conflict' })
  @IsEnum(['low', 'medium', 'high'])
  severity: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Human-readable description of the conflict' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Array of affected slot IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  affectedSlots: string[];

  @ApiProperty({ description: 'Suggested resolutions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  suggestions: string[];
}

export class AIOptimizationDto {
  @ApiProperty({ description: 'Type of optimization' })
  @IsEnum(['time', 'buffer', 'capacity', 'revenue', 'efficiency'])
  type: 'time' | 'buffer' | 'capacity' | 'revenue' | 'efficiency';

  @ApiProperty({ description: 'Expected impact level' })
  @IsEnum(['low', 'medium', 'high'])
  impact: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Description of the optimization' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Specific recommendation' })
  @IsString()
  recommendation: string;

  @ApiProperty({ description: 'Estimated improvement (e.g., "15% more bookings")' })
  @IsString()
  estimatedImprovement: string;
}

export class AIPatternDto {
  @ApiProperty({ description: 'Type of pattern identified' })
  @IsEnum(['daily', 'weekly', 'monthly', 'seasonal', 'behavioral'])
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'behavioral';

  @ApiProperty({ description: 'Pattern description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Confidence level (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @ApiProperty({ description: 'Business impact description' })
  @IsString()
  impact: string;

  @ApiProperty({ description: 'Actionable recommendation' })
  @IsString()
  recommendation: string;
}

export class AITrendsDto {
  @ApiProperty({ description: 'Booking trends analysis' })
  @IsString()
  bookingTrends: string;

  @ApiProperty({ description: 'Peak hours identified', type: [String] })
  @IsArray()
  @IsString({ each: true })
  peakHours: string[];

  @ApiProperty({ description: 'Seasonal patterns' })
  @IsString()
  seasonality: string;

  @ApiProperty({ description: 'Utilization analysis' })
  @IsString()
  utilization: string;
}

export class AIEnhancedResultDto {
  @ApiProperty({ description: 'AI conflict analysis' })
  @IsOptional()
  conflicts?: {
    hasConflicts: boolean;
    conflicts: AIConflictDto[];
    summary: string;
  };

  @ApiProperty({ description: 'AI optimization suggestions' })
  @IsOptional()
  optimizations?: {
    optimizations: AIOptimizationDto[];
    summary: string;
  };

  @ApiProperty({ description: 'AI pattern analysis' })
  @IsOptional()
  patterns?: {
    patterns: AIPatternDto[];
    trends: AITrendsDto;
    insights: string[];
    summary: string;
  };

  @ApiProperty({ description: 'AI-generated insights', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  insights?: string[];

  @ApiProperty({ description: 'Overall AI analysis summary' })
  @IsOptional()
  @IsString()
  summary?: string;
}