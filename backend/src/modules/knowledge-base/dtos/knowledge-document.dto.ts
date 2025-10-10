import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsEnum } from 'class-validator';

export class KnowledgeDocumentCreateDto {
  @ApiProperty({ description: 'Title of the knowledge document' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Content of the knowledge document' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Category of the knowledge document' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Language of the document', required: false, default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ description: 'Tags for the document', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Whether the document is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Whether the document is public', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Whether authentication is required to access', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiresAuthentication?: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false, type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class KnowledgeDocumentUpdateDto {
  @ApiProperty({ description: 'Title of the knowledge document', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Content of the knowledge document', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Category of the knowledge document', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Language of the document', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ description: 'Tags for the document', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Whether the document is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Whether the document is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Whether authentication is required to access', required: false })
  @IsOptional()
  @IsBoolean()
  requiresAuthentication?: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false, type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SearchOptionsDto {
  @ApiProperty({ description: 'Category to filter by', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Tags to filter by', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Text to search for', required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({ description: 'Maximum number of results to return', required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ description: 'Number of results to skip', required: false })
  @IsOptional()
  @IsNumber()
  skip?: number;

  @ApiProperty({ description: 'Field to sort by', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}