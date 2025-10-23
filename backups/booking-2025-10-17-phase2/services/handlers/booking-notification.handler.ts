import { Injectable, Logger } from '@nestjs/common';
import { IBooking } from '../../interfaces/booking.interface';
import { IAvailability } from '../../../availability/interfaces/availability.interface';
import { AvailabilityService } from '../../../availability/availability.service';
import { BookingEventsService } from '../booking-events.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class BookingNotificationHandler {
  private readonly logger = new Logger(BookingNotificationHandler.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly usersService: UsersService,
    private readonly eventsService: BookingEventsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Handle notifications and events for a booking
   */
  async handleBookingNotifications(
    booking: IBooking,
    provider: any,
    availabilityId: string,
    session: any
  ): Promise<void> {
    await this.availabilityService.markAsBooked(
      availabilityId,
      booking._id.toString(),
      session
    );

    // Send booking confirmation notifications
    if (provider?.email) {
      await this.notificationService.sendProviderBookingConfirmation(booking, provider.email);
    }
    if (booking.guestEmail) {
      await this.notificationService.sendGuestBookingConfirmation(booking, booking.guestEmail);
    }

    await this.eventsService.emitBookingCreated(booking);
    await this.eventsService.emitAvailabilityStatusChange(booking, 'booked');
  }

  /**
   * Handle summary notifications for recurring bookings
   */
  async handleRecurringBookingSummary(
    template: IAvailability,
    createdBookings: IBooking[],
    session: any
  ): Promise<void> {
    if (createdBookings.length === 0) return;

    const provider = await this.usersService.findById(template.providerId);

    // Create availability instances for all bookings in parallel
    const instancePromises = createdBookings.map(booking =>
      this.availabilityService.createInstanceFromRecurring(
        template,
        new Date(booking.startTime),
        new Date(booking.startTime),
        new Date(booking.endTime),
        session
      )
    );
    const instances = await Promise.all(instancePromises);

    // Mark all instances as booked in parallel
    const markBookedPromises = instances.map((instance, index) =>
      this.availabilityService.markAsBooked(
        instance._id?.toString() || instance.id || '',
        createdBookings[index]._id.toString(),
        session
      )
    );
    await Promise.all(markBookedPromises);

    // Send summary email (2 emails total: guest + provider)
    await this.notificationService.sendRecurringSummary(
      createdBookings[0].guestEmail,
      createdBookings[0].guestName,
      provider?.email || null,
      createdBookings
    );

    // Emit events for all bookings
    const eventPromises = createdBookings.flatMap(booking => [
      this.eventsService.emitBookingCreated(booking),
      this.eventsService.emitAvailabilityStatusChange(booking, 'booked')
    ]);
    await Promise.allSettled(eventPromises);
  }
}
