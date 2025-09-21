import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class AIValidationErrorDto {
  @ApiProperty({ description: 'Field that has the validation error' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Type of validation error' })
  @IsEnum(['required', 'format', 'logic', 'range', 'business', 'conflict'])
  type: 'required' | 'format' | 'logic' | 'range' | 'business' | 'conflict';

  @ApiProperty({ description: 'Error message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Error severity' })
  @IsEnum(['error', 'warning', 'info'])
  severity: 'error' | 'warning' | 'info';

  @ApiProperty({ description: 'Optional suggestion for fixing the error' })
  @IsOptional()
  @IsString()
  suggestion?: string;
}

export class AIValidationResultDto {
  @ApiProperty({ description: 'Whether the input data is valid' })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({ description: 'Array of validation errors', type: [AIValidationErrorDto] })
  @IsArray()
  errors: AIValidationErrorDto[];

  @ApiProperty({ description: 'AI-generated suggestions for improvement', type: [String] })
  @IsArray()
  @IsString({ each: true })
  suggestions: string[];

  @ApiProperty({ description: 'Summary of validation results' })
  @IsString()
  summary: string;
}

export class AIBulkValidationResultDto {
  @ApiProperty({ description: 'Overall validation result for bulk data' })
  @IsBoolean()
  overallValid: boolean;

  @ApiProperty({ description: 'Individual validation results for each item', type: [AIValidationResultDto] })
  @IsArray()
  results: AIValidationResultDto[];

  @ApiProperty({ description: 'Summary of bulk validation' })
  @IsString()
  summary: string;

  @ApiProperty({ description: 'Number of valid items' })
  validCount: number;

  @ApiProperty({ description: 'Number of invalid items' })
  invalidCount: number;

  @ApiProperty({ description: 'Common issues found across items', type: [String] })
  @IsArray()
  @IsString({ each: true })
  commonIssues: string[];
}