import { Controller, Get, Param, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './user.schema';
import { ProviderPublicDto, ListProvidersResponseDto } from './dto/provider-public.dto';
import { AccessCodeService } from './services/access-code.service';

@ApiTags('public')
@Controller('public/providers')
export class PublicUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly accessCodeService: AccessCodeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all public providers' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or bio' })
  @ApiQuery({ name: 'location', required: false, description: 'Filter by location' })
  @ApiQuery({ name: 'service', required: false, description: 'Filter by service' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns list of providers',
    type: ListProvidersResponseDto,
  })
  async listPublicProviders(
    @Query('search') search?: string,
    @Query('location') location?: string,
    @Query('service') service?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ListProvidersResponseDto> {
    return this.usersService.findAllPublicProviders(
      search,
      location,
      service,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public provider information (public profiles only)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns public provider information',
    type: ProviderPublicDto,
  })
  @ApiResponse({ status: 403, description: 'Provider profile is private' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getPublicProvider(@Param('id') id: string): Promise<Partial<User>> {
    try {
      // Check if profile is public
      const visibility = await this.accessCodeService.getProfileVisibility(id);
      
      if (visibility === 'private') {
        throw new ForbiddenException('This provider profile is private. An access code is required.');
      }

      const provider = await this.usersService.findByIdPublic(id);
      return provider;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }
  }

  @Get(':id/:accessCode')
  @ApiOperation({ summary: 'Get provider information with access code (for private profiles)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiParam({ name: 'accessCode', description: 'Access code for private profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns provider information',
    type: ProviderPublicDto,
  })
  @ApiResponse({ status: 403, description: 'Invalid or expired access code' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderWithAccessCode(
    @Param('id') id: string,
    @Param('accessCode') accessCode: string,
  ): Promise<Partial<User>> {
    try {
      // Validate access code
      const isValid = await this.accessCodeService.validateAccessCode(id, accessCode);
      
      if (!isValid) {
        throw new ForbiddenException('Invalid or expired access code');
      }

      const provider = await this.usersService.findByIdPublic(id);
      return provider;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }
  }
}
