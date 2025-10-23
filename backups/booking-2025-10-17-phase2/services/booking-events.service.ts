import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsService } from '../../../core/websockets';
import { IBooking } from '../interfaces/booking.interface';
import { BookingStatus } from '../booking.schema';

@Injectable()
export class BookingEventsService {
  private readonly logger = new Logger(BookingEventsService.name);

  constructor(private readonly websocketsService: WebsocketsService) {}

  emitBookingCreated(booking: IBooking): void {
    this.websocketsService.emitToRoom(
      `provider-${booking.providerId}`,
      'bookingCreated',
      booking
    );
  }

  emitBookingUpdated(booking: IBooking): void {
    this.websocketsService.emitToRoom(
      `provider-${booking.providerId}`,
      'bookingUpdated',
      booking
    );
  }

  emitAvailabilityStatusChange(booking: IBooking, action: 'booked' | 'released'): void {
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId: booking.providerId,
      availabilityId: booking.availabilityId,
      action
    });
  }

  emitBookingCancelled(booking: IBooking): void {
    this.websocketsService.emitToRoom(
      `provider-${booking.providerId}`,
      'bookingCancelled',
      booking
    );
  }

  emitBookingCompleted(booking: IBooking): void {
    this.websocketsService.emitToRoom(
      `provider-${booking.providerId}`,
      'bookingCompleted',
      booking
    );
  }

  emitBookingStatusChange(booking: IBooking, oldStatus: BookingStatus, newStatus: BookingStatus): void {
    this.websocketsService.emitToRoom(
      `provider-${booking.providerId}`,
      'bookingStatusChanged',
      {
        bookingId: booking._id,
        oldStatus,
        newStatus,
        booking
      }
    );
  }
}
