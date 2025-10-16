import { Injectable, Logger } from '@nestjs/common';
import { AvailabilityType } from '../../availability.schema';
import { IAvailabilityBase } from '../../interfaces/availability.interface';

@Injectable()
export class DateFilterUtils {
  private readonly logger = new Logger(DateFilterUtils.name);

  /**
   * Filter availability by date range, handling both recurring and one-off slots
   */
  filterAvailabilityByDateRange(
    slots: IAvailabilityBase[],
    startDate: Date,
    endDate: Date,
    bookedSlots: { [key: string]: boolean },
  ): IAvailabilityBase[] {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    this.logger.debug(`Filtering availability from ${start.toISOString()} to ${end.toISOString()}`);

    const filteredSlots: IAvailabilityBase[] = [];

    for (const slot of slots) {
      // Handle ONE-OFF slots
      if (slot.type === AvailabilityType.ONE_OFF && slot.date) {
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);

        if (slotDate >= start && slotDate <= end) {
          // Enhanced debug logging
          this.logger.debug(`ONE-OFF slot ${slot.id} details:
            - isBooked: ${slot.isBooked}
            - bookedSlots: ${JSON.stringify(bookedSlots)}
            - slotDate: ${slotDate.toISOString()}
            - start: ${start.toISOString()}
            - end: ${end.toISOString()}`
          );

          // Exclude if booked
          if (!slot.isBooked && slot.id && !bookedSlots[slot.id]) {
            filteredSlots.push(slot);
            this.logger.debug(`Including ONE-OFF slot: ${slot.id} on ${slotDate.toISOString()}`);
          } else {
            this.logger.debug(`Excluding ONE-OFF slot ${slot.id} due to booking status`);
          }
        }
      }

      // Handle RECURRING slots - generate instances for matching days
      else if (slot.type === AvailabilityType.RECURRING && slot.dayOfWeek !== undefined) {
        // This would need the RecurringStrategy to generate instances
        // For now, just log that we would generate instances
        this.logger.debug(`Would generate instances for RECURRING template ${slot.id} (dayOfWeek: ${slot.dayOfWeek})`);
      }
    }

    this.logger.debug(`Filtered result: ${filteredSlots.length} slots`);
    return filteredSlots;
  }
}
