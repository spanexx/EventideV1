import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateAvailabilityDto } from '../../dto/update-availability.dto';
import { IAvailabilityBase } from '../../interfaces/availability.interface';
import { AvailabilityBaseService } from '../availability-base.service';
import { AvailabilityCreationService } from '../availability-creation.service';
import { AvailabilityNotificationService } from '../availability-notification.service';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class AvailabilityUpdateHandler {
  private readonly logger = new Logger(AvailabilityUpdateHandler.name);

  constructor(
    private readonly baseService: AvailabilityBaseService,
    private readonly creationService: AvailabilityCreationService,
    private readonly notificationService: AvailabilityNotificationService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Update an availability slot
   */
  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<IAvailabilityBase> {
    const original = await this.baseService.findById(id);
    if (!original) {
      throw new NotFoundException(`Availability slot with ID ${id} not found`);
    }

    // Check if converting from one_off to recurring
    const isConvertingToRecurring = original.type === 'one_off' && updateAvailabilityDto.type === 'recurring';

    const updated = await this.baseService.update(id, updateAvailabilityDto);

    // If converting to recurring, generate additional weekly slots
    if (isConvertingToRecurring && updateAvailabilityDto.dayOfWeek !== undefined) {
      await this.creationService.generateRecurringSlots(updated, updateAvailabilityDto.dayOfWeek);
    }

    // Send appropriate notification based on the update type
    const provider = await this.usersService.findById(original.providerId);
    if (provider && provider.email) {
      if (updated.status === 'cancelled' && updated.status !== original.status) {
        await this.notificationService.notifyCancellation(updated, provider.email);
      } else if (updated.status === 'override' && updated.status !== original.status) {
        await this.notificationService.notifyOverride(original, updated, provider.email);
      } else {
        await this.notificationService.notifyUpdate(original, updated, provider.email);
      }
    }

    return updated;
  }
}
