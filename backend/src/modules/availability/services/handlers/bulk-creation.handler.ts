import { Injectable, Logger } from '@nestjs/common';
import { CreateBulkAvailabilityDto } from '../../dto/create-bulk-availability.dto';
import { IAvailabilityBase } from '../../interfaces/availability.interface';
import { AvailabilityCreationService } from '../availability-creation.service';
import { AvailabilityValidationService } from '../availability-validation.service';
import { AvailabilitySlotGeneratorService } from '../availability-slot-generator.service';
import { AvailabilityNotificationService } from '../availability-notification.service';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class BulkCreationHandler {
  private readonly logger = new Logger(BulkCreationHandler.name);

  constructor(
    private readonly creationService: AvailabilityCreationService,
    private readonly validationService: AvailabilityValidationService,
    private readonly slotGeneratorService: AvailabilitySlotGeneratorService,
    private readonly notificationService: AvailabilityNotificationService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create multiple availability slots in bulk
   */
  async createBulkSlots(
    createBulkAvailabilityDto: CreateBulkAvailabilityDto,
  ): Promise<{ created: IAvailabilityBase[]; conflicts: any[] }> {
    // Convert BulkSlotConfig[] to CreateAvailabilityDto[]
    const slots = createBulkAvailabilityDto.slots?.map(slot => ({
      ...slot,
      providerId: createBulkAvailabilityDto.providerId
    }));

    const result = await this.creationService.createBatchSlots(slots || [], {
      skipConflicts: createBulkAvailabilityDto.skipConflicts,
      replaceConflicts: createBulkAvailabilityDto.replaceConflicts,
      dryRun: createBulkAvailabilityDto.dryRun,
      idempotencyKey: createBulkAvailabilityDto.idempotencyKey,
    });

    // Send notification for bulk creation if slots were created
    if (!createBulkAvailabilityDto.dryRun && result.created.length > 0) {
      const provider = await this.usersService.findById(createBulkAvailabilityDto.providerId);
      if (provider && provider.email) {
        const dates = result.created.map(slot => slot.startTime);
        await this.notificationService.notifyBulkUpdate(
          createBulkAvailabilityDto.providerId,
          dates,
          provider.email
        );
      }
    }

    return result;
  }

  /**
   * Validate a batch of availability slots
   */
  async validateSlots(createBulkAvailabilityDto: CreateBulkAvailabilityDto): Promise<{
    requested: number;
    conflicts: any[];
    suggestions: any[];
  }> {
    // Generate slots from bulk DTO and ensure each slot has a providerId
    let slots = createBulkAvailabilityDto.slots?.map(slot => ({
      ...slot,
      providerId: createBulkAvailabilityDto.providerId
    })) || this.slotGeneratorService.generateSlotsFromBulkDto(createBulkAvailabilityDto);

    const conflicts: any[] = [];
    const suggestions: any[] = [];

    for (const slot of slots) {
      const validationSlot = {
        ...slot,
        providerId: createBulkAvailabilityDto.providerId
      };

      const slotConflicts = await this.validationService.findConflicts(validationSlot);
      if (slotConflicts.length > 0) {
        conflicts.push({
          requested: validationSlot,
          conflictingWith: slotConflicts,
        });

        // Generate suggestions for conflicting slots
        const suggestedSlot = await this.slotGeneratorService.generateAlternativeSlot(
          validationSlot,
          slotConflicts
        );
        if (suggestedSlot) {
          suggestions.push({
            original: validationSlot,
            suggested: suggestedSlot,
          });
        }
      }
    }

    return {
      requested: slots.length,
      conflicts,
      suggestions,
    };
  }
}
