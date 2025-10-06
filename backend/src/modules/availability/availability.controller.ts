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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { GetAvailabilityDto } from './dto/get-availability.dto';
import { CreateAllDayAvailabilityDto } from './dto/create-all-day-availability.dto';
import { CreateBulkAvailabilityDto } from './dto/create-bulk-availability.dto';
import { UpdateDaySlotQuantityDto } from './dto/update-day-slot-quantity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IAvailability } from './interfaces/availability.interface';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  private readonly logger = new Logger(AvailabilityController.name);

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

  @Put('day/slots')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adjust number of slots for a specific day' })
  @ApiResponse({ status: 200, description: 'Day slot quantity adjusted successfully', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiBody({ type: UpdateDaySlotQuantityDto })
  async updateDaySlotQuantity(
    @Body() updateDto: UpdateDaySlotQuantityDto,
  ): Promise<IAvailability[]> {
    this.logger.log(
      `Adjusting day slot quantity for provider ${updateDto.providerId} on ${updateDto.date}`,
    );
    return this.availabilityService.adjustDaySlotQuantity(updateDto);
  }

  @Post('all-day')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new all-day availability slots' })
  @ApiResponse({ status: 201, description: 'All-day availability slots created successfully', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiBody({ type: CreateAllDayAvailabilityDto })
  async createAllDay(
    @Body() createAllDayAvailabilityDto: CreateAllDayAvailabilityDto,
  ): Promise<IAvailability[]> {
    this.logger.log(
      `Creating all-day availability slots for provider ${createAllDayAvailabilityDto.providerId}`,
    );
    return this.availabilityService.createAllDaySlots(createAllDayAvailabilityDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple availability slots in bulk' })
  @ApiResponse({ status: 201, description: 'Availability slots created successfully', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiResponse({ status: 409, description: 'Conflict - overlapping slots detected' })
  @ApiBody({ type: CreateBulkAvailabilityDto })
  async createBulk(
    @Body() createBulkAvailabilityDto: CreateBulkAvailabilityDto,
  ): Promise<{ created: IAvailability[]; conflicts: any[] }> {
    this.logger.log(
      `Creating bulk availability slots for provider ${createBulkAvailabilityDto.providerId}`,
    );
    return this.availabilityService.createBulkSlots(createBulkAvailabilityDto);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate availability slots and return conflicts with suggestions' })
  @ApiResponse({ status: 200, description: 'Validation completed', type: Object })
  @ApiBody({ type: CreateBulkAvailabilityDto })
  async validate(
    @Body() dto: CreateBulkAvailabilityDto,
  ): Promise<any> {
    this.logger.log(`Validating availability for provider ${dto.providerId}`);
    return this.availabilityService.validateSlots(dto);
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
    this.logger.log(`Date range: ${query.startDate} to ${query.endDate}`);
    
    const result = await this.availabilityService.findByProviderAndDateRange(
      providerId,
      query.startDate,
      query.endDate,
    );
    
    this.logger.log(`Returning ${result.length} availability slots`);
    return result;
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
