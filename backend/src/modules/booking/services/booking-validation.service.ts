import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { BookingStatus } from '../booking.schema';
import { IBooking } from '../interfaces/booking.interface';

@Injectable()
export class BookingValidationService {
  private readonly logger = new Logger(BookingValidationService.name);

  validateCreateBookingDto(dto: CreateBookingDto): void {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (dto.endTime.getTime() - dto.startTime.getTime() <= 0) {
      throw new BadRequestException('Invalid booking duration');
    }

    // Add more validations as needed
  }

  validateUpdateBookingDto(currentBooking: IBooking, dto: UpdateBookingDto): void {
    if (dto.status) {
      this.validateStatusTransition(currentBooking.status as BookingStatus, dto.status as BookingStatus);
    }

    if (dto.startTime && dto.endTime) {
      if (dto.startTime >= dto.endTime) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    // Add more validations as needed
  }

  private validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    type TransitionMap = {
      [key in BookingStatus]: BookingStatus[];
    };

    const validTransitions: TransitionMap = {
      [BookingStatus.CONFIRMED]: [BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.NO_SHOW]: [],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}
