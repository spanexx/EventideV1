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
  ConflictException,
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
import { AIConflictAnalysis } from '../../../core/ai/interfaces/ai-availability.interface';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { IAvailabilityBase } from '../interfaces/availability.interface';

@ApiTags('availability-ai')
@Controller('availability/ai')
export class AvailabilityAiController {
  private readonly logger = new Logger(AvailabilityAiController.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly aiAvailabilityService: AiAvailabilityService,
  ) {}

  /**
   * Get AI-enhanced availability data with insights
   */
  @Get(':providerId/enhanced')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get AI-enhanced availability data with insights',
    description: 'Retrieves availability data with AI-powered insights and optimization suggestions'
  })
  @ApiResponse({ status: 200, description: 'AI-enhanced availability data retrieved successfully' })
  @ApiParam({ name: 'providerId', description: 'The provider\'s ID', type: String })
  @ApiQuery({ name: 'startDate', description: 'Start date for filtering', required: false, type: Date })
  @ApiQuery({ name: 'endDate', description: 'End date for filtering', required: false, type: Date })
  @ApiQuery({ name: 'includeAnalysis', description: 'Include AI analysis', required: false, type: Boolean })
  async getEnhancedAvailability(
    @Param('providerId') providerId: string,
    @Query() query: GetAvailabilityDto,
  ): Promise<{
    data: IAvailabilityBase[];
    aiAnalysis?: {
      conflicts?: AIConflictAnalysis;
      patterns?: any;
      optimizations?: any;
      insights?: string[];
      summary?: string;
    };
  }> {
    this.logger.log(`Getting AI-enhanced availability for provider ${providerId}`);
    
    // Get basic availability data
    const availability = await this.availabilityService.findByProviderAndDateRange(
      providerId,
      query.startDate,
      query.endDate,
    );

    // Add AI analysis if requested
    let aiAnalysis;
    if (query.includeAnalysis !== false) {
      try {
        // Convert IAvailabilityBase[] to the format expected by AI service
        const availabilityForAI = availability.map(slot => ({
          ...slot,
          _id: slot._id || undefined
        })) as any[];
        
        const conflicts = await this.aiAvailabilityService.analyzeScheduleConflicts(availabilityForAI);
        aiAnalysis = {
          conflicts,
          insights: ['AI analysis available'],
          summary: `Found ${availability.length} slots with ${conflicts.conflicts.length} potential conflicts`
        };
      } catch (error) {
        this.logger.warn('AI analysis failed:', error.message);
        aiAnalysis = {
          insights: ['AI analysis temporarily unavailable'],
          summary: 'Basic availability data only'
        };
      }
    }

    return {
      data: availability,
      aiAnalysis
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
    data: IAvailabilityBase | null;
    aiAnalysis: {
      validation: AIValidationResultDto;
      conflicts?: AIConflictAnalysis;
      suggestions?: string[];
    };
  }> {
    this.logger.log(`Creating AI-optimized availability slot for provider ${createAvailabilityDto.providerId}`);
    
    // Add idempotency key if not provided
    if (!createAvailabilityDto.idempotencyKey) {
      createAvailabilityDto.idempotencyKey = `ai-create-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    // AI validation first
    const validation = await this.aiAvailabilityService.validateInput(createAvailabilityDto);
    
    if (!validation.isValid) {
      return {
        data: null,
        aiAnalysis: {
          validation,
          suggestions: ['Fix validation errors before proceeding'],
        }
      };
    }

    // Add dryRun flag to check for conflicts first
    const dryRunDto = { ...createAvailabilityDto, dryRun: true };
    
    try {
      // First try dry run to check for conflicts
      await this.availabilityService.create(dryRunDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        const conflictData = error.getResponse() as any;
        this.logger.warn(`Conflicts detected during AI creation:`, conflictData);
        return {
          data: null,
          aiAnalysis: {
            validation: {
              isValid: false,
              errors: [{
                field: 'time',
                type: 'conflict',
                message: conflictData.message,
                severity: 'error'
              }],
              suggestions: ['Try a different time slot', 'Consider using replaceConflicts option'],
              summary: 'Time slot unavailable due to conflicts'
            },
            conflicts: {
              hasConflicts: true,
              conflicts: conflictData.data || [],
              summary: conflictData.message
            },
            suggestions: ['Choose a different time', 'Use update instead of create']
          }
        };
      }
      throw error;
    }

    // Check for AI recommendations
    let scheduleConflicts: AIConflictAnalysis | undefined;
    try {
      const existingData = await this.availabilityService.findByProviderAndDateRange(
        createAvailabilityDto.providerId,
        new Date(createAvailabilityDto.startTime),
        new Date(createAvailabilityDto.endTime)
      );

      scheduleConflicts = await this.aiAvailabilityService.analyzeScheduleConflicts([...existingData, createAvailabilityDto as any]);
    } catch (error) {
      this.logger.warn('AI conflict analysis failed, proceeding with creation:', error.message);
    }

    // Create the availability slot
    const created = await this.availabilityService.create(createAvailabilityDto);

    // Return success response with AI analysis
    return {
      data: created,
      aiAnalysis: {
        validation,
        conflicts: scheduleConflicts?.hasConflicts ? scheduleConflicts : undefined,
        suggestions: validation.suggestions
      }
    };
  }
}