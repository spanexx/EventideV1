import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from '../../dto/create-booking.dto';
import { IAvailability } from '../../../availability/interfaces/availability.interface';
import { AvailabilityService } from '../../../availability/availability.service';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class BookingInstanceUtils {
  private readonly logger = new Logger(BookingInstanceUtils.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handle recurring slot creation for single bookings
   */
  async handleRecurringSlot(
    template: IAvailability,
    createBookingDto: CreateBookingDto,
    session: any
  ): Promise<IAvailability> {
    const requestedDate = new Date(createBookingDto.startTime);
    const templateStartDate = new Date(template.startTime);

    // Get provider timezone for proper day comparison
    const provider = await this.usersService.findById(template.providerId);
    const providerTimezone = provider?.preferences?.timezone || 'UTC';

    // Check if this is an instantiated slot (ID has date suffix)
    const isInstantiatedSlot = createBookingDto.availabilityId.includes('_') &&
                                createBookingDto.availabilityId.match(/_\d{4}-\d{2}-\d{2}$/);

    // Only validate day match for non-instantiated slots
    if (!isInstantiatedSlot) {
      // Compare times in provider's timezone, not UTC
      const requestedTimeStr = requestedDate.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: providerTimezone
      });
      const templateTimeStr = templateStartDate.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: providerTimezone
      });

      // Get day of week in provider's timezone
      // Convert to provider timezone and get day of week
      const requestedInProviderTZ = new Date(requestedDate.toLocaleString('en-US', { timeZone: providerTimezone }));
      const templateInProviderTZ = new Date(templateStartDate.toLocaleString('en-US', { timeZone: providerTimezone }));
      const requestedDayOfWeek = requestedInProviderTZ.getDay();
      const actualTemplateDayOfWeek = templateInProviderTZ.getDay();

      // Map day numbers to names for better error messages
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Validate day of week matches in provider's timezone
      if (actualTemplateDayOfWeek !== requestedDayOfWeek) {
        const requestedDayName = dayNames[requestedDayOfWeek];
        const templateDayName = dayNames[actualTemplateDayOfWeek];
        const requestedDateStr = requestedDate.toLocaleDateString('en-US', { timeZone: providerTimezone });

        throw new BadRequestException(
          `Day mismatch: You're trying to book ${requestedDayName} (${requestedDateStr}), ` +
          `but this recurring slot is for ${templateDayName}s at ${templateTimeStr} (${providerTimezone}). ` +
          `Please select a ${templateDayName} or choose a different availability slot.`
        );
      }
    } else {
      this.logger.log(`[BookingCreation] Skipping day validation for instantiated slot: ${createBookingDto.availabilityId}`);
    }

    // Keep the date from the booking request but use hours from the template
    const templateStart = new Date(template.startTime);
    const templateEnd = new Date(template.endTime);

    const instanceStartTime = new Date(requestedDate);
    instanceStartTime.setUTCHours(templateStart.getUTCHours(), templateStart.getUTCMinutes(), 0, 0);

    const instanceEndTime = new Date(requestedDate);
    instanceEndTime.setUTCHours(templateEnd.getUTCHours(), templateEnd.getUTCMinutes(), 0, 0);

    // Create a specific instance from the recurring template
    return await this.availabilityService.createInstanceFromRecurring(
      template,
      requestedDate,
      instanceStartTime,
      instanceEndTime,
      session
    );
  }
}
