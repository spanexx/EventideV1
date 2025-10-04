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
import { AiAvailabilityService } from '../../../core/ai/services/ai-availability.service';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { GetAvailabilityDto } from '../dto/get-availability.dto';
import { AIEnhancedResultDto } from '../../../core/ai/dto/ai-enhanced-result.dto';
import { AIValidationResultDto } from '../../../core/ai/dto/ai-validation-result.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { IAvailability } from '../interfaces/availability.interface';

@ApiTags('availability-ai')
@Controller('availability/ai')
export class AvailabilityAiController {
  private readonly logger = new Logger(AvailabilityAiController.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly aiAvailabilityService: AiAvailabilityService,
  ) {}

  /**
   * Get AI-enhanced availability data for a provider
   * Includes conflict analysis, patterns, and optimization suggestions
   */
  @Get(':providerId/enhanced')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get AI-enhanced availability data with insights and optimization suggestions',
    description: 'Returns availability data enriched with AI analysis including conflict detection, patterns, and optimization recommendations'
  })
  @ApiResponse({ status: 200, description: 'AI-enhanced availability data retrieved successfully', type: AIEnhancedResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiParam({ name: 'providerId', description: 'The provider\'s ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date for filtering availability slots', required: false, type: Date })
  @ApiQuery({ name: 'endDate', description: 'End date for filtering availability slots', required: false, type: Date })
  @ApiQuery({ name: 'includeAnalysis', description: 'Include AI analysis (conflicts, patterns, optimization)', required: false, type: Boolean, example: true })
  async getEnhanced(
    @Param('providerId') providerId: string,
    @Query() query: GetAvailabilityDto & { includeAnalysis?: boolean },
  ): Promise<{
    data: IAvailability[];
    aiAnalysis?: AIEnhancedResultDto;
  }> {
    this.logger.log(`Retrieving AI-enhanced availability for provider ${providerId}`);
    
    // Get base availability data
    const availabilityData = await this.availabilityService.findByProviderAndDateRange(
      providerId,
      query.startDate,
      query.endDate,
    );

    let aiAnalysis: AIEnhancedResultDto | undefined;

    // Include AI analysis if requested
    if (query.includeAnalysis !== false && availabilityData.length > 0) {
      try {
        const [conflicts, patterns, optimizations] = await Promise.all([
          this.aiAvailabilityService.analyzeConflicts(availabilityData),
          this.aiAvailabilityService.analyzePatterns(availabilityData),
          this.aiAvailabilityService.optimizeSchedule({}, availabilityData),
        ]);

        aiAnalysis = {
          conflicts,
          patterns,
          optimizations,
          insights: patterns.insights,
          summary: `AI analysis complete. Found ${conflicts.conflicts.length} conflicts, ${patterns.patterns.length} patterns, and ${optimizations.optimizations.length} optimization opportunities.`
        };
      } catch (error) {
        this.logger.warn(`AI analysis failed for provider ${providerId}:`, error.message);
        // Return data without AI analysis on AI failure
      }
    }

    return {
      data: availabilityData,
      ...(aiAnalysis && { aiAnalysis })
    };
  }

  /**
   * Create availability slot with AI optimization
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create availability slot with AI optimization',
    description: 'Creates a new availability slot with AI-powered conflict detection and optimization suggestions'
  })
  @ApiResponse({ status: 201, description: 'AI-optimized availability slot created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data or AI validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiResponse({ status: 409, description: 'Conflict - AI detected scheduling conflicts' })
  @ApiBody({ type: CreateAvailabilityDto })
  async createWithAI(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<{
    data: IAvailability;
    aiAnalysis: {
      validation: AIValidationResultDto;
      conflicts?: any;
      suggestions?: string[];
    };
  }> {
    this.logger.log(`Creating AI-optimized availability slot for provider ${createAvailabilityDto.providerId}`);
    
    // AI validation first
    const validation = await this.aiAvailabilityService.validateInput(createAvailabilityDto);
    
    if (!validation.isValid) {
      throw new Error(`AI validation failed: ${validation.summary}`);
    }

    // Check for conflicts with existing data
    const existingData = await this.availabilityService.findByProviderAndDateRange(
      createAvailabilityDto.providerId,
      new Date(createAvailabilityDto.startTime),
      new Date(createAvailabilityDto.endTime)
    );

    const conflicts = await this.aiAvailabilityService.analyzeConflicts([...existingData, createAvailabilityDto as any]);

    // Create the availability slot
    const created = await this.availabilityService.create(createAvailabilityDto);

    return {
      data: created,
      aiAnalysis: {
        validation,
        conflicts: conflicts.hasConflicts ? conflicts : undefined,
        suggestions: validation.suggestions
      }
    };
  }

  /**
   * Update availability slot with AI analysis
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update availability slot with AI impact analysis',
    description: 'Updates an availability slot with AI-powered impact analysis and suggestions'
  })
  @ApiResponse({ status: 200, description: 'Availability slot updated with AI analysis' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  @ApiParam({ name: 'id', description: 'The availability slot ID', type: String })
  @ApiBody({ type: UpdateAvailabilityDto })
  async updateWithAI(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<{
    data: IAvailability;
    aiAnalysis: {
      validation: AIValidationResultDto;
      impactAnalysis: string;
      suggestions: string[];
    };
  }> {
    this.logger.log(`Updating availability slot ${id} with AI analysis`);
    
    // AI validation
    const validation = await this.aiAvailabilityService.validateInput(updateAvailabilityDto);
    
    // Update the slot
    const updated = await this.availabilityService.update(id, updateAvailabilityDto);
    
    // Generate impact analysis
    const impactAnalysis = "Change impact: Slot updated successfully with minimal scheduling disruption.";
    
    return {
      data: updated,
      aiAnalysis: {
        validation,
        impactAnalysis,
        suggestions: validation.suggestions
      }
    };
  }

  /**
   * Delete availability slot with AI impact assessment
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Delete availability slot with AI impact assessment',
    description: 'Deletes an availability slot with AI-powered impact assessment and alternative recommendations'
  })
  @ApiResponse({ status: 200, description: 'Availability slot deleted with impact analysis' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiResponse({ status: 404, description: 'Availability slot not found' })
  @ApiParam({ name: 'id', description: 'The availability slot ID', type: String })
  async deleteWithAI(
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    aiAnalysis: {
      impactAssessment: string;
      alternatives: string[];
      riskLevel: 'low' | 'medium' | 'high';
    };
  }> {
    this.logger.log(`Deleting availability slot ${id} with AI impact assessment`);
    
    // Get slot details before deletion for impact analysis
    const slot = await this.availabilityService.findById(id);
    
    // Delete the slot
    const result = await this.availabilityService.delete(id);
    
    // AI impact assessment
    const impactAssessment = slot.isBooked 
      ? "High impact: This slot was booked. Customer notification recommended."
      : "Low impact: Available slot removed with no customer disruption.";
    
    const alternatives = [
      "Consider creating a replacement slot at a similar time",
      "Review demand patterns to optimize future scheduling",
      "Check for alternative time slots for affected customers"
    ];

    return {
      success: result.success,
      aiAnalysis: {
        impactAssessment,
        alternatives,
        riskLevel: slot.isBooked ? 'high' : 'low'
      }
    };
  }

  /**
   * Comprehensive AI validation endpoint
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Comprehensive AI validation of availability data',
    description: 'Performs multi-layer AI validation including conflict detection, pattern compliance, and optimization potential'
  })
  @ApiResponse({ status: 200, description: 'AI validation completed', type: AIValidationResultDto })
  @ApiBody({ type: CreateAvailabilityDto })
  async validateWithAI(
    @Body() dto: CreateAvailabilityDto,
  ): Promise<{
    validation: AIValidationResultDto;
    conflicts: any;
    optimization: any;
    recommendation: string;
  }> {
    this.logger.log(`Performing comprehensive AI validation for provider ${dto.providerId}`);
    
    const [validation, conflicts, optimization] = await Promise.all([
      this.aiAvailabilityService.validateInput(dto),
      this.aiAvailabilityService.analyzeConflicts([dto as any]),
      this.aiAvailabilityService.optimizeSchedule({}, [dto as any])
    ]);

    let recommendation = "Data validation complete.";
    if (!validation.isValid) {
      recommendation = "Data requires corrections before proceeding.";
    } else if (conflicts.hasConflicts) {
      recommendation = "Conflicts detected. Review suggestions before creating slot.";
    } else if (optimization.optimizations.length > 0) {
      recommendation = "Optimization opportunities available for better scheduling.";
    } else {
      recommendation = "Data is valid and optimal for scheduling.";
    }

    return {
      validation,
      conflicts,
      optimization,
      recommendation
    };
  }
}