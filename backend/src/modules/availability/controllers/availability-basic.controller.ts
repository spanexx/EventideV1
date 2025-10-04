import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AvailabilityService } from '../availability.service';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { GetAvailabilityDto } from '../dto/get-availability.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { IAvailability } from '../interfaces/availability.interface';

@ApiTags('availability-basic')
@Controller('availability')
export class AvailabilityBasicController {
  private readonly logger = new Logger(AvailabilityBasicController.name);

  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new availability slot' })
  @ApiResponse({ status: 201, description: 'Availability slot created successfully', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiBody({ type: CreateAvailabilityDto })
  async create(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<IAvailability> {
    this.logger.log(
      `Creating availability slot for provider ${createAvailabilityDto.providerId}`,
    );
    return this.availabilityService.create(createAvailabilityDto);
  }

  /**
   * Get availability slots for a provider
   * @param providerId - The provider's ID
   * @param query - Query parameters for date range
   * @returns Array of availability slots
   */
  @Get(':providerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get availability slots for a provider' })
  @ApiResponse({ status: 200, description: 'Availability slots retrieved successfully', type: [Object] })
  @ApiParam({ name: 'providerId', description: 'The provider\'s ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date for filtering availability slots', required: false, type: Date })
  @ApiQuery({ name: 'endDate', description: 'End date for filtering availability slots', required: false, type: Date })
  async findByProvider(
    @Param('providerId') providerId: string,
    @Query() query: GetAvailabilityDto,
  ): Promise<IAvailability[]> {
    this.logger.log(`Retrieving availability for provider ${providerId}`);
    return this.availabilityService.findByProviderAndDateRange(
      providerId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * Get a specific availability slot by ID
   * @param id - The availability slot ID
   * @returns The availability slot
   */
  @Get('slot/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific availability slot by ID' })
  @ApiResponse({ status: 200, description: 'Availability slot retrieved successfully', type: Object })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  @ApiParam({ name: 'id', description: 'The availability slot ID', type: String })
  async findById(@Param('id') id: string): Promise<IAvailability> {
    this.logger.log(`Retrieving availability slot with ID ${id}`);
    return this.availabilityService.findById(id);
  }

  /**
   * Update an availability slot
   * @param id - The availability slot ID
   * @param updateAvailabilityDto - Data for updating the availability slot
   * @returns The updated availability slot
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an availability slot' })
  @ApiResponse({ status: 200, description: 'Availability slot updated successfully', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  @ApiParam({ name: 'id', description: 'The availability slot ID', type: String })
  @ApiBody({ type: UpdateAvailabilityDto })
  async update(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<IAvailability> {
    this.logger.log(`Updating availability slot with ID ${id}`);
    return this.availabilityService.update(id, updateAvailabilityDto);
  }

  /**
   * Delete an availability slot
   * @param id - The availability slot ID
   * @returns Success confirmation
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an availability slot' })
  @ApiResponse({ status: 200, description: 'Availability slot deleted successfully', type: Object })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  @ApiParam({ name: 'id', description: 'The availability slot ID', type: String })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    this.logger.log(`Deleting availability slot with ID ${id}`);
    return this.availabilityService.delete(id);
  }

  @Delete('cleanup/past')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup past one-off availability slots' })
  @ApiResponse({ status: 200, description: 'Past availability slots cleaned up', type: Object })
  async cleanupPastSlots(): Promise<{ removed: number }> {
    const removed = await this.availabilityService.cleanupPastOneOffSlots();
    return { removed };
  }
}