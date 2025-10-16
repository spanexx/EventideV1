import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType } from '../availability.schema';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { IAvailabilityBase, IAvailability } from '../interfaces/availability.interface';
import { Booking, BookingDocument } from '../../booking/booking.schema';

@Injectable()
export class AvailabilityValidationService {
  private readonly logger = new Logger(AvailabilityValidationService.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  /**
   * Check for conflicts with existing availability slots
   */
  async checkForConflicts(
    availabilityDto: CreateAvailabilityDto | UpdateAvailabilityDto,
    excludeId?: string,
  ): Promise<void> {
    // Check for conflicts with existing availability slots
    const conflicts = await this.findConflicts(availabilityDto, excludeId);
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: `Conflicts with ${conflicts.length} existing slots`,
        data: conflicts.map(c => ({
          id: c.id || c._id?.toString?.(),
          startTime: c.startTime,
          endTime: c.endTime
        }))
      });
    }
    
    // Check for conflicts with existing bookings
    const bookingConflicts = await this.checkBookingConflicts(availabilityDto);
    if (bookingConflicts.length > 0) {
      throw new ConflictException({
        message: `Cannot create availability slot - conflicts with ${bookingConflicts.length} existing booking(s)`,
        data: bookingConflicts.map(b => ({
          bookingId: b.serialKey,
          startTime: b.startTime,
          endTime: b.endTime
        }))
      });
    }
  }
  
  /**
   * Check for conflicts with existing bookings
   */
  private async checkBookingConflicts(
    availabilityDto: CreateAvailabilityDto | UpdateAvailabilityDto
  ): Promise<any[]> {
    const { providerId, startTime, endTime } = availabilityDto as any;
    
    // Find bookings that overlap with this time slot
    const bookings = await this.bookingModel.find({
      providerId,
      status: { $in: ['confirmed', 'pending', 'in_progress'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    }).select('serialKey startTime endTime').lean();
    
    return bookings;
  }

  /**
   * Find conflicts without throwing
   */
  async findConflicts(
    availabilityDto: CreateAvailabilityDto | UpdateAvailabilityDto,
    excludeId?: string,
  ): Promise<IAvailability[]> {
    const perfStart = Date.now();
    const { providerId, startTime: slotStartTime, endTime: slotEndTime, date, type, dayOfWeek } = availabilityDto as any;
    
    this.logger.debug(`Checking conflicts for ${type} slot:`, {
      providerId,
      startTime: slotStartTime,
      endTime: slotEndTime,
      date,
      dayOfWeek,
      excludeId
    });
    
    const query: any = {
      providerId,
      $or: [{
        startTime: { $lt: slotEndTime },
        endTime: { $gt: slotStartTime },
      }],
    };

    if (type) {
      query.type = type;
      if (type === AvailabilityType.RECURRING && dayOfWeek !== undefined) {
        query.dayOfWeek = dayOfWeek;
      } else if (type === AvailabilityType.ONE_OFF && date) {
        query.date = date;
      }
    } else if (date) {
      query.date = date;
    }

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const conflictingSlots = await this.availabilityModel.find(query);
    
    const perfEnd = Date.now();
    this.logger.log(`Conflict check completed in ${perfEnd - perfStart}ms, found ${conflictingSlots.length} conflicts`);
    
    return conflictingSlots;
  }

  /**
   * Validate a batch of availability slots and return conflicts and suggestions
   */
  async validateBatch(slots: CreateAvailabilityDto[]): Promise<{
    valid: CreateAvailabilityDto[];
    conflicts: Array<{
      slot: CreateAvailabilityDto;
      conflictingWith: IAvailability[];
      suggestion?: { startTime: Date; endTime: Date };
    }>;
  }> {
    const valid: CreateAvailabilityDto[] = [];
    const conflicts: Array<{
      slot: CreateAvailabilityDto;
      conflictingWith: IAvailability[];
      suggestion?: { startTime: Date; endTime: Date };
    }> = [];

    for (const slot of slots) {
      const found = await this.findConflicts(slot);
      if (found.length === 0) {
        valid.push(slot);
      } else {
        // Create a naive suggestion by pushing to after the latest conflict
        const latestEnd = new Date(Math.max(...found.map(c => new Date(c.endTime).getTime())));
        const suggestedStart = new Date(latestEnd);
        const suggestedEnd = new Date(suggestedStart.getTime() + (slot.duration || 60) * 60000);

        conflicts.push({
          slot,
          conflictingWith: found,
          suggestion: { startTime: suggestedStart, endTime: suggestedEnd }
        });
      }
    }

    return { valid, conflicts };
  }
}
