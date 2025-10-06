import { IsString, IsEmail, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProviderPublicDto {
  @ApiProperty({ description: 'Provider ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Provider email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'Business name', required: false })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({ description: 'Bio/description', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiProperty({ description: 'Location', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Contact phone', required: false })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({ description: 'Services offered', required: false })
  @IsArray()
  @IsOptional()
  services?: string[];

  @ApiProperty({ description: 'Available appointment durations', required: false })
  @IsArray()
  @IsOptional()
  availableDurations?: number[];

  @ApiProperty({ description: 'Rating', required: false })
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: 'Review count', required: false })
  @IsNumber()
  @IsOptional()
  reviewCount?: number;

  @ApiProperty({ description: 'Subscription tier' })
  @IsString()
  subscriptionTier: string;
}

export class ListProvidersQueryDto {
  @ApiProperty({ description: 'Search query', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ description: 'Location filter', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Service filter', required: false })
  @IsString()
  @IsOptional()
  service?: string;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class ListProvidersResponseDto {
  @ApiProperty({ type: [ProviderPublicDto] })
  providers: ProviderPublicDto[];

  @ApiProperty({ description: 'Total number of providers' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;
}
