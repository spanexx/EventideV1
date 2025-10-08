import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Booking } from '../../modules/booking/booking.schema';
import { format } from 'date-fns';

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

  constructor(private readonly mailerService: MailerService) {}

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
}
