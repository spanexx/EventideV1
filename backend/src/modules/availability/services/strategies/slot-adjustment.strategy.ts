import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument } from '../../availability.schema';
import { UpdateDaySlotQuantityDto } from '../../dto/update-day-slot-quantity.dto';
import { IAvailability } from '../../interfaces/availability.interface';
import { AvailabilitySlotGeneratorService } from '../availability-slot-generator.service';

@Injectable()
export class SlotAdjustmentStrategy {
  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly slotGeneratorService: AvailabilitySlotGeneratorService,
  ) {}

  /**
   * Adjust the number of slots for a specific day
   */
  async adjustDaySlotQuantity(updateDto: UpdateDaySlotQuantityDto): Promise<IAvailability[]> {
    const { providerId, date, numberOfSlots, minutesPerSlot, breakTime, isRecurring } = updateDto;

    const slots = await this.slotGeneratorService.generateEvenlyDistributedSlots(
      providerId,
      date,
      numberOfSlots,
      minutesPerSlot,
      breakTime,
      isRecurring,
      isRecurring ? 0 : undefined, // dayOfWeek only for recurring
    );

    // Delete existing slots for this day
    await this.availabilityModel.deleteMany({
      providerId,
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    });

    // Create new slots
    const newSlots = slots.map(slot => ({
      providerId,
      type: isRecurring ? 'recurring' : 'one_off',
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: minutesPerSlot,
      isBooked: false,
    }));

    const createdSlots = await this.availabilityModel.insertMany(newSlots);
    return createdSlots.map(slot => slot.toObject());
  }
}
