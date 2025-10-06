import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { CreateBulkAvailabilityDto } from '../dto/create-bulk-availability.dto';
import { AvailabilityType } from '../availability.schema';
import { IAvailability } from '../interfaces/availability.interface';

@Injectable()
export class AvailabilitySlotGeneratorService {
  private readonly logger = new Logger(AvailabilitySlotGeneratorService.name);

  /**
   * Generate alternative slot when conflicts are found
   */
  async generateAlternativeSlot(
    originalSlot: CreateAvailabilityDto,
    conflicts: IAvailability[],
  ): Promise<CreateAvailabilityDto | null> {
    // Sort conflicts by start time
    const sortedConflicts = [...conflicts].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    const slotDuration = originalSlot.endTime.getTime() - originalSlot.startTime.getTime();
    let potentialStart = new Date(originalSlot.startTime);

    // Try to fit the slot between conflicts or after the last conflict
    for (let i = 0; i <= sortedConflicts.length; i++) {
      const nextConflict = sortedConflicts[i];
      const potentialEnd = new Date(potentialStart.getTime() + slotDuration);

      // If we've passed all conflicts or found a gap
      if (!nextConflict || potentialEnd <= nextConflict.startTime) {
        return {
          ...originalSlot,
          startTime: potentialStart,
          endTime: potentialEnd,
        };
      }

      // Move start time to after this conflict
      potentialStart = new Date(nextConflict.endTime);
    }

    return null;
  }

  /**
   * Generate slots from bulk creation DTO
   */
  generateSlotsFromBulkDto(createBulkAvailabilityDto: CreateBulkAvailabilityDto): CreateAvailabilityDto[] {
    const { providerId, startDate, endDate, quantity = 1, type = AvailabilityType.ONE_OFF, dayOfWeek, date } = createBulkAvailabilityDto;

    if (date && quantity) {
      return this.generateEvenlyDistributedSlots(
        providerId,
        date,
        quantity,
        createBulkAvailabilityDto.minutesPerSlot,
        createBulkAvailabilityDto.breakTime,
        type === AvailabilityType.RECURRING,
        dayOfWeek
      );
    }

    if (startDate && endDate) {
      const slots: CreateAvailabilityDto[] = [];
      let current = new Date(startDate);
      const end = new Date(endDate);

      while (current <= end) {
        // For recurring, only generate slots for matching days of week
        if (type === AvailabilityType.RECURRING && dayOfWeek !== undefined) {
          if (current.getDay() === dayOfWeek) {
            const daySlots = this.generateEvenlyDistributedSlots(
              providerId,
              current,
              quantity,
              createBulkAvailabilityDto.minutesPerSlot,
              createBulkAvailabilityDto.breakTime,
              true,
              dayOfWeek
            );
            slots.push(...daySlots);
          }
        } else {
          const daySlots = this.generateEvenlyDistributedSlots(
            providerId,
            current,
            quantity,
            createBulkAvailabilityDto.minutesPerSlot,
            createBulkAvailabilityDto.breakTime,
            false
          );
          slots.push(...daySlots);
        }

        current = new Date(current.setDate(current.getDate() + 1));
      }

      return slots;
    }

    throw new BadRequestException('Invalid slot generation parameters');
  }

  /**
   * Generate evenly distributed slots throughout a working day
   */
  generateEvenlyDistributedSlots(
    providerId: string,
    date: Date,
    numberOfSlots: number,
    minutesPerSlot?: number,
    breakTime: number = 15,
    isRecurring: boolean = false,
    dayOfWeek?: number,
    workingStartTime?: Date,
    workingEndTime?: Date
  ): CreateAvailabilityDto[] {
    const slots: CreateAvailabilityDto[] = [];
    
    // Set up working hours
    const workingStart = this.getWorkingStartTime(workingStartTime, date);
    const workingEnd = this.getWorkingEndTime(workingEndTime, date);
    
    // Handle recurring slots
    if (isRecurring && dayOfWeek !== undefined) {
      this.adjustForRecurring(workingStart, workingEnd, date, dayOfWeek);
    }
    
    const workingMinutes = (workingEnd.getTime() - workingStart.getTime()) / (1000 * 60);
    
    if (workingMinutes <= 0) {
      throw new BadRequestException('Working end time must be after working start time');
    }
    
    // Calculate number of slots based on minutes per slot if provided
    numberOfSlots = this.calculateNumberOfSlots(numberOfSlots, minutesPerSlot, workingMinutes, breakTime);
    
    // Calculate time per slot
    const { timePerSlot, adjustedSlots } = this.calculateTimePerSlot(workingMinutes, numberOfSlots, breakTime);
    numberOfSlots = adjustedSlots;
    
    // Generate slots
    this.generateSlots(
      slots,
      providerId,
      date,
      workingStart,
      timePerSlot,
      numberOfSlots,
      breakTime,
      isRecurring,
      dayOfWeek
    );
    
    return slots;
  }

  private getWorkingStartTime(workingStartTime: Date | undefined, date: Date): Date {
    const workingStart = workingStartTime 
      ? new Date(workingStartTime) 
      : new Date(date);
      
    if (!workingStartTime) {
      workingStart.setHours(8, 0, 0, 0);
    }
    
    return workingStart;
  }

  private getWorkingEndTime(workingEndTime: Date | undefined, date: Date): Date {
    const workingEnd = workingEndTime 
      ? new Date(workingEndTime) 
      : new Date(date);
      
    if (!workingEndTime) {
      workingEnd.setHours(20, 0, 0, 0);
    }
    
    return workingEnd;
  }

  private adjustForRecurring(
    workingStart: Date,
    workingEnd: Date,
    date: Date,
    dayOfWeek: number
  ): void {
    const currentDate = new Date(date);
    const currentDay = currentDate.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    currentDate.setDate(currentDate.getDate() + daysUntilTarget);
    
    workingStart.setDate(currentDate.getDate());
    workingStart.setMonth(currentDate.getMonth());
    workingStart.setFullYear(currentDate.getFullYear());
    
    workingEnd.setDate(currentDate.getDate());
    workingEnd.setMonth(currentDate.getMonth());
    workingEnd.setFullYear(currentDate.getFullYear());
  }

  private calculateNumberOfSlots(
    numberOfSlots: number,
    minutesPerSlot: number | undefined,
    workingMinutes: number,
    breakTime: number
  ): number {
    if (minutesPerSlot && minutesPerSlot > 0) {
      numberOfSlots = Math.floor((workingMinutes + breakTime) / (minutesPerSlot + breakTime));
      if (numberOfSlots < 1) numberOfSlots = 1;
    }
    return numberOfSlots;
  }

  private calculateTimePerSlot(
    workingMinutes: number,
    numberOfSlots: number,
    breakTime: number
  ): { timePerSlot: number; adjustedSlots: number } {
    const totalTimeForBreaks = (numberOfSlots - 1) * breakTime;
    const timePerSlot = (workingMinutes - totalTimeForBreaks) / numberOfSlots;
    
    if (timePerSlot < 15) {
      const adjustedSlots = Math.floor((workingMinutes + breakTime) / (15 + breakTime));
      return {
        timePerSlot: 15,
        adjustedSlots: adjustedSlots > 0 ? adjustedSlots : 1
      };
    }
    
    return { timePerSlot, adjustedSlots: numberOfSlots };
  }

  private generateSlots(
    slots: CreateAvailabilityDto[],
    providerId: string,
    date: Date,
    startTime: Date,
    timePerSlot: number,
    numberOfSlots: number,
    breakTime: number,
    isRecurring: boolean,
    dayOfWeek?: number
  ): void {
    let currentTime = new Date(startTime);
    
    for (let i = 0; i < numberOfSlots; i++) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + timePerSlot * 60000);
      
      slots.push({
        providerId,
        date,
        startTime: slotStart,
        endTime: slotEnd,
        duration: Math.round(timePerSlot),
        type: isRecurring ? AvailabilityType.RECURRING : AvailabilityType.ONE_OFF,
        dayOfWeek: isRecurring ? dayOfWeek : undefined,
        isBooked: false
      });
      
      if (i < numberOfSlots - 1) {
        currentTime = new Date(slotEnd.getTime() + breakTime * 60000);
      }
    }
  }
}
