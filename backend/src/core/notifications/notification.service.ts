import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Booking } from '../../modules/booking/booking.schema';
import { format } from 'date-fns';
import { WebsocketsGateway } from '../websockets/websockets.gateway';
import { IBooking } from '../../modules/booking/interfaces/booking.interface';
import { EmailService } from '../email/email.service';
import { UsersService } from '../../modules/users/users.service';

interface AvailabilityOverride {
  date: Date;
  originalHours: string;
  overrideHours: string;
  reason?: string;
}

interface BulkAvailabilityUpdate {
  startDate: Date;
  endDate: Date;
  affectedDays: string[];
  totalSlots: number;
  pattern?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService
  ) {}

  /**
   * Booking-related notifications
   */
  async sendBookingConfirmation(booking: Booking): Promise<void> {
    try {
      const recipientEmail = booking.guestEmail;
      if (!recipientEmail) {
        this.logger.warn(`No email address found for booking ${booking._id}`);
        return;
      }

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: 'Booking Confirmation',
        template: './booking-confirmation',
        context: {
          name: booking.guestName || 'Valued Customer',
          startTime: format(booking.startTime, 'PPpp'),
          duration: booking.duration,
          notes: booking.notes,
        },
      });

      // Send real-time notification via WebSocket
      const guestPayload = {
        type: 'confirmation',
        title: 'Booking Confirmed',
        message: `Your booking for ${format(booking.startTime, 'PPpp')} has been confirmed`,
        bookingId: booking._id,
        startTime: booking.startTime,
        duration: booking.duration,
        emittedAt: new Date().toISOString()
      };
      this.logger.debug(`WS Payload (guest confirmation): ${JSON.stringify(guestPayload)}`);
      this.websocketsGateway.emitBookingNotification(booking.guestId, guestPayload);

      this.logger.log(`Booking confirmation email sent to ${recipientEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send booking confirmation email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendBookingReminder(booking: Booking): Promise<void> {
    try {
      const recipientEmail = booking.guestEmail;
      if (!recipientEmail) {
        this.logger.warn(`No email address found for booking ${booking._id}`);
        return;
      }

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: 'Booking Reminder',
        template: './booking-reminder',
        context: {
          name: booking.guestName || 'Valued Customer',
          startTime: format(booking.startTime, 'PPpp'),
          duration: booking.duration,
          notes: booking.notes,
        },
      });

      this.logger.log(`Booking reminder email sent to ${recipientEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send booking reminder email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendBookingCancellation(booking: Booking): Promise<void> {
    try {
      const recipientEmail = booking.guestEmail;
      if (!recipientEmail) {
        this.logger.warn(`No email address found for booking ${booking._id}`);
        return;
      }

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: 'Booking Cancellation',
        template: './booking-cancellation',
        context: {
          name: booking.guestName || 'Valued Customer',
          startTime: format(booking.startTime, 'PPpp'),
          duration: booking.duration,
          notes: booking.notes,
        },
      });

      this.logger.log(`Booking cancellation email sent to ${recipientEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send booking cancellation email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendBookingModification(booking: Booking, changes: string[]): Promise<void> {
    try {
      const recipientEmail = booking.guestEmail;
      if (!recipientEmail) {
        this.logger.warn(`No email address found for booking ${booking._id}`);
        return;
      }

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: 'Booking Modified',
        template: './booking-modification',
        context: {
          name: booking.guestName || 'Valued Customer',
          startTime: format(booking.startTime, 'PPpp'),
          duration: booking.duration,
          notes: booking.notes,
          changes,
        },
      });

      this.logger.log(`Booking modification email sent to ${recipientEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send booking modification email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendBookingPaymentConfirmation(
    booking: Booking,
    paymentDetails: { amount: number; currency: string; paymentMethod: string },
  ): Promise<void> {
    try {
      const recipientEmail = booking.guestEmail;
      if (!recipientEmail) {
        this.logger.warn(`No email address found for booking ${booking._id}`);
        return;
      }

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: 'Payment Confirmation',
        template: './booking-payment',
        context: {
          name: booking.guestName || 'Valued Customer',
          startTime: format(booking.startTime, 'PPpp'),
          duration: booking.duration,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          paymentMethod: paymentDetails.paymentMethod,
        },
      });

      this.logger.log(`Payment confirmation email sent to ${recipientEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send payment confirmation email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendBookingFeedbackRequest(booking: Booking, feedbackUrl: string): Promise<void> {
    try {
      const recipientEmail = booking.guestEmail;
      if (!recipientEmail) {
        this.logger.warn(`No email address found for booking ${booking._id}`);
        return;
      }

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: 'How was your experience?',
        template: './booking-feedback',
        context: {
          name: booking.guestName || 'Valued Customer',
          startTime: format(booking.startTime, 'PPpp'),
          duration: booking.duration,
          feedbackUrl,
        },
      });

      this.logger.log(`Feedback request email sent to ${recipientEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send feedback request email: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Availability-related notifications
   */
  async sendAvailabilityUpdate(
    providerEmail: string,
    providerName: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: providerEmail,
        subject: 'Availability Updated',
        template: './availability-update',
        context: {
          name: providerName,
        },
      });

      this.logger.log(`Availability update email sent to ${providerEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send availability update email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendAvailabilityCancellation(
    providerEmail: string,
    providerName: string,
    date: Date,
    startTime: string,
    endTime: string,
    reason?: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: providerEmail,
        subject: 'Availability Cancelled',
        template: './availability-cancellation',
        context: {
          name: providerName,
          date: format(date, 'PPP'),
          startTime,
          endTime,
          reason,
        },
      });

      this.logger.log(`Availability cancellation email sent to ${providerEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send availability cancellation email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendBulkAvailabilityUpdate(
    providerEmail: string,
    providerName: string,
    update: BulkAvailabilityUpdate,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: providerEmail,
        subject: 'Bulk Availability Update',
        template: './availability-bulk-update',
        context: {
          name: providerName,
          startDate: format(update.startDate, 'PPP'),
          endDate: format(update.endDate, 'PPP'),
          affectedDays: update.affectedDays,
          totalSlots: update.totalSlots,
          pattern: update.pattern,
        },
      });

      this.logger.log(`Bulk availability update email sent to ${providerEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send bulk availability update email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendAvailabilityOverride(
    providerEmail: string,
    providerName: string,
    override: AvailabilityOverride,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: providerEmail,
        subject: 'Special Availability Override',
        template: './availability-override',
        context: {
          name: providerName,
          date: format(override.date, 'PPP'),
          originalHours: override.originalHours,
          overrideHours: override.overrideHours,
          reason: override.reason,
        },
      });

      this.logger.log(`Availability override email sent to ${providerEmail}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send availability override email: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Booking-specific methods for compatibility with existing booking service
   */
  async sendGuestBookingConfirmation(booking: IBooking, guestEmail: string): Promise<void> {
    try {
      // Get provider timezone
      const provider = await this.usersService.findById(booking.providerId);
      const timezone = provider?.preferences?.timezone || 'UTC';
      
      const startTime = new Date(booking.startTime).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });

      await this.emailService.sendEmail({
        to: guestEmail,
        subject: 'Booking Confirmation',
        template: 'booking-confirmation',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: startTime,
          duration: booking.duration,
          notes: booking.notes,
          timezone: timezone
        }
      });

      // Send real-time WebSocket notification
      this.logger.log(
        `WS: Emitting booking confirmation to user-${booking.guestId} (booking ${booking.serialKey})`
      );
      this.websocketsGateway.emitBookingNotification(booking.guestId, {
        type: 'confirmation',
        title: 'Booking Confirmed',
        message: `Your booking for ${startTime} has been confirmed`,
        bookingId: booking._id,
        startTime: booking.startTime,
        duration: booking.duration,
        emittedAt: new Date().toISOString()
      });

      this.logger.log(`Guest booking confirmation sent to ${guestEmail} for booking ${booking.serialKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send guest booking confirmation: ${error.message}`, error.stack);
    }
  }

  async sendProviderBookingConfirmation(booking: IBooking, providerEmail: string): Promise<void> {
    try {
      // Get provider timezone
      const provider = await this.usersService.findById(booking.providerId);
      const timezone = provider?.preferences?.timezone || 'UTC';
      
      const startTime = new Date(booking.startTime).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });

      await this.emailService.sendEmail({
        to: providerEmail,
        subject: 'New Booking Received',
        template: 'provider-booking-notification',
        context: {
          providerName: provider?.email || 'Provider',
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          serialKey: booking.serialKey,
          startTime: startTime,
          duration: booking.duration,
          notes: booking.notes,
          timezone: timezone
        }
      });

      // Send real-time WebSocket notification to provider
      this.logger.log(
        `WS: Emitting new booking to provider user-${booking.providerId} (booking ${booking.serialKey})`
      );
      const providerPayload = {
        type: 'new_booking',
        title: 'New Booking Received',
        message: `New booking from ${booking.guestName} for ${startTime}`,
        bookingId: booking._id,
        startTime: booking.startTime,
        duration: booking.duration,
        guestName: booking.guestName,
        emittedAt: new Date().toISOString()
      };
      this.logger.debug(`WS Payload (provider new_booking): ${JSON.stringify(providerPayload)}`);
      this.websocketsGateway.emitBookingNotification(booking.providerId, providerPayload);

      this.logger.log(`Provider booking notification sent to ${providerEmail} for booking ${booking.serialKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send provider booking confirmation: ${error.message}`, error.stack);
    }
  }

  async sendCancellationNotifications(booking: IBooking): Promise<void> {
    try {
      // Send to guest
      if (booking.guestEmail) {
        await this.emailService.sendEmail({
          to: booking.guestEmail,
          subject: 'Booking Cancelled',
          template: 'booking-cancellation',
          context: {
            guestName: booking.guestName,
            serialKey: booking.serialKey,
            startTime: new Date(booking.startTime).toLocaleString(),
          }
        });

        // WebSocket notification to guest
        this.logger.log(
          `WS: Emitting booking cancellation to user-${booking.guestId} (booking ${booking.serialKey})`
        );
        const guestCancelPayload = {
          type: 'cancellation',
          title: 'Booking Cancelled',
          message: `Your booking ${booking.serialKey} has been cancelled`,
          bookingId: booking._id,
          emittedAt: new Date().toISOString()
        };
        this.logger.debug(`WS Payload (guest cancellation): ${JSON.stringify(guestCancelPayload)}`);
        this.websocketsGateway.emitBookingNotification(booking.guestId, guestCancelPayload);
      }

      // Send to provider
      const provider = await this.usersService.findById(booking.providerId);
      if (provider?.email) {
        await this.emailService.sendEmail({
          to: provider.email,
          subject: 'Booking Cancelled',
          template: 'provider-booking-cancellation',
          context: {
            providerName: provider.email,
            guestName: booking.guestName,
            serialKey: booking.serialKey,
            startTime: new Date(booking.startTime).toLocaleString(),
          }
        });

        // WebSocket notification to provider
        this.logger.log(
          `WS: Emitting booking cancellation to provider user-${booking.providerId} (booking ${booking.serialKey})`
        );
        const providerCancelPayload = {
          type: 'cancellation',
          title: 'Booking Cancelled',
          message: `Booking ${booking.serialKey} with ${booking.guestName} has been cancelled`,
          bookingId: booking._id,
          emittedAt: new Date().toISOString()
        };
        this.logger.debug(`WS Payload (provider cancellation): ${JSON.stringify(providerCancelPayload)}`);
        this.websocketsGateway.emitBookingNotification(booking.providerId, providerCancelPayload);
      }

      this.logger.log(`Cancellation notifications sent for booking ${booking.serialKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send cancellation notifications: ${error.message}`, error.stack);
    }
  }

  async sendCompletionNotifications(booking: IBooking): Promise<void> {
    try {
      // Send completion notification to guest
      if (booking.guestEmail) {
        await this.emailService.sendEmail({
          to: booking.guestEmail,
          subject: 'Booking Completed',
          template: 'booking-completion',
          context: {
            guestName: booking.guestName,
            serialKey: booking.serialKey,
            startTime: new Date(booking.startTime).toLocaleString(),
          }
        });

        // WebSocket notification
        this.logger.log(
          `WS: Emitting booking completion to user-${booking.guestId} (booking ${booking.serialKey})`
        );
        const completionPayload = {
          type: 'completion',
          title: 'Booking Completed',
          message: `Your booking ${booking.serialKey} has been completed`,
          bookingId: booking._id,
          emittedAt: new Date().toISOString()
        };
        this.logger.debug(`WS Payload (completion): ${JSON.stringify(completionPayload)}`);
        this.websocketsGateway.emitBookingNotification(booking.guestId, completionPayload);
      }

      this.logger.log(`Completion notifications sent for booking ${booking.serialKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send completion notifications: ${error.message}`, error.stack);
    }
  }

  async handleUpdateNotifications(updatedBooking: IBooking, oldBooking: IBooking, changes: any): Promise<void> {
    try {
      const changesList = Object.keys(changes);
      
      // Send to guest
      if (updatedBooking.guestEmail) {
        await this.emailService.sendEmail({
          to: updatedBooking.guestEmail,
          subject: 'Booking Updated',
          template: 'booking-modification',
          context: {
            guestName: updatedBooking.guestName,
            serialKey: updatedBooking.serialKey,
            changes: changesList,
            newStartTime: new Date(updatedBooking.startTime).toLocaleString(),
            oldStartTime: new Date(oldBooking.startTime).toLocaleString(),
          }
        });

        // WebSocket notification
        this.logger.log(
          `WS: Emitting booking modification to user-${updatedBooking.guestId} (booking ${updatedBooking.serialKey})`
        );
        this.websocketsGateway.emitBookingNotification(updatedBooking.guestId, {
          type: 'modification',
          title: 'Booking Updated',
          message: `Your booking ${updatedBooking.serialKey} has been updated`,
          bookingId: updatedBooking._id,
          changes: changesList,
          emittedAt: new Date().toISOString()
        });
      }

      this.logger.log(`Update notifications sent for booking ${updatedBooking.serialKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send update notifications: ${error.message}`, error.stack);
    }
  }

  async sendRecurringSummary(
    guestEmail: string,
    guestName: string,
    providerEmail: string | null,
    bookings: IBooking[]
  ): Promise<void> {
    try {
      // Send summary to guest
      await this.emailService.sendEmail({
        to: guestEmail,
        subject: 'Recurring Booking Summary',
        template: 'recurring-booking-summary',
        context: {
          guestName: guestName,
          bookings: bookings.map(b => ({
            serialKey: b.serialKey,
            startTime: new Date(b.startTime).toLocaleString(),
            duration: b.duration
          })),
          totalBookings: bookings.length
        }
      });

      // Send summary to provider if available
      if (providerEmail) {
        await this.emailService.sendEmail({
          to: providerEmail,
          subject: 'New Recurring Bookings Received',
          template: 'provider-recurring-summary',
          context: {
            guestName: guestName,
            guestEmail: guestEmail,
            bookings: bookings.map(b => ({
              serialKey: b.serialKey,
              startTime: new Date(b.startTime).toLocaleString(),
              duration: b.duration
            })),
            totalBookings: bookings.length
          }
        });
      }

      this.logger.log(`Recurring booking summary sent to ${guestEmail} (${bookings.length} bookings)`);
    } catch (error: any) {
      this.logger.error(`Failed to send recurring summary: ${error.message}`, error.stack);
    }
  }

  async sendPaymentConfirmation(booking: IBooking, paymentDetails: any): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: booking.guestEmail,
        subject: 'Payment Confirmation',
        template: 'payment-confirmation',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          paymentMethod: paymentDetails.paymentMethod,
          startTime: new Date(booking.startTime).toLocaleString(),
        }
      });

      // WebSocket notification
      const paymentPayload = {
        type: 'payment_success',
        title: 'Payment Confirmed',
        message: `Payment of ${paymentDetails.amount} ${paymentDetails.currency} confirmed for booking ${booking.serialKey}`,
        bookingId: booking._id,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        emittedAt: new Date().toISOString()
      };
      this.logger.debug(`WS Payload (payment): ${JSON.stringify(paymentPayload)}`);
      this.websocketsGateway.emitPaymentNotification(booking.guestId, paymentPayload);

      this.logger.log(`Payment confirmation sent for booking ${booking.serialKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send payment confirmation: ${error.message}`, error.stack);
    }
  }

  async sendCancellationCode(guestEmail: string, guestName: string, code: string): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: guestEmail,
        subject: 'Booking Cancellation Code',
        template: 'cancellation-code',
        context: {
          guestName: guestName,
          code: code,
          expiryMinutes: 15
        }
      });

      this.logger.log(`Cancellation code sent to ${guestEmail}`);
    } catch (error: any) {
      this.logger.error(`Failed to send cancellation code: ${error.message}`, error.stack);
    }
  }

  async sendCancellationConfirmation(guestEmail: string, guestName: string, serialKey: string): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: guestEmail,
        subject: 'Booking Cancelled Successfully',
        template: 'cancellation-confirmation',
        context: {
          guestName: guestName,
          serialKey: serialKey,
          timestamp: new Date().toLocaleString()
        }
      });

      this.logger.log(`Cancellation confirmation sent to ${guestEmail} for booking ${serialKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to send cancellation confirmation: ${error.message}`, error.stack);
    }
  }
}
