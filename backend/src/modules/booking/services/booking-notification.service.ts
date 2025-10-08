import { Injectable, Logger } from '@nestjs/common';
import { IBooking } from '../interfaces/booking.interface';
import { EmailService } from 'src/core/email/email.service';
import { UsersService } from '../../../modules/users/users.service';

@Injectable()
export class BookingNotificationService {
  private readonly logger = new Logger(BookingNotificationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly usersService: UsersService
  ) {}

  async sendGuestBookingConfirmation(booking: IBooking, guestEmail: string) {
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
      const endTime = new Date(booking.endTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });

      const html = `
        <h1>Booking Confirmation</h1>
        <p>Hello ${booking.guestName},</p>
        <p>Your booking has been confirmed!</p>
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Booking ID:</strong> ${booking.serialKey}</li>
          <li><strong>Date & Time:</strong> ${startTime} - ${endTime}</li>
          <li><strong>Duration:</strong> ${booking.duration} minutes</li>
        </ul>
        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        <p><em>Times shown in ${timezone} timezone</em></p>
        <p>You will receive a reminder before your session.</p>
        <p>Best regards,<br/>The Eventide Team</p>
      `;

      await this.emailService.sendEmail({
        to: guestEmail,
        subject: 'Booking Confirmation',
        html
      });
    } catch (error) {
      this.logger.error(`Failed to send guest booking confirmation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendCancellationNotifications(booking: IBooking) {
    try {
      // Get provider email
      const provider = await this.getProviderEmail(booking.providerId);

      // Send notifications in parallel
      const promises: Promise<any>[] = [];
      
      // Notify provider
      if (provider) {
        promises.push(this.emailService.sendEmail({
          template: 'booking-cancelled-provider',
          to: provider,
          subject: 'Booking Cancelled',
          context: { booking }
        }));
      }

      // Notify guest using guestEmail directly
      if (booking.guestEmail) {
        promises.push(this.emailService.sendEmail({
          template: 'booking-cancelled-guest',
          to: booking.guestEmail,
          subject: 'Booking Cancelled',
          context: { booking }
        }));
      }

      await Promise.all(promises);
    } catch (error) {
      this.logger.error(`Failed to send cancellation notifications: ${error.message}`, error.stack);
      // Don't throw error for notification failures
      this.logger.warn('Continuing despite notification failure');
    }
  }


  async handleUpdateNotifications(updatedBooking: IBooking, oldBooking: IBooking, changes: any) {
    try {
      if (Object.keys(changes).length === 0) return;

      // Get provider email
      const provider = await this.getProviderEmail(updatedBooking.providerId);

      const promises: Promise<any>[] = [];

      // Notify provider
      if (provider) {
        promises.push(
          this.emailService.sendEmail({
            template: 'booking-updated-provider',
            to: provider,
            subject: 'Booking Updated',
            context: { booking: updatedBooking, changes }
          }).catch(err => {
            this.logger.warn(`Failed to send provider notification: ${err.message}`);
            return null;
          })
        );
      }

      // Notify guest using guestEmail directly from booking
      if (updatedBooking.guestEmail) {
        promises.push(
          this.emailService.sendEmail({
            template: 'booking-updated-guest',
            to: updatedBooking.guestEmail,
            subject: 'Booking Updated',
            context: { booking: updatedBooking, changes }
          }).catch(err => {
            this.logger.warn(`Failed to send guest notification: ${err.message}`);
            return null;
          })
        );
      }

      await Promise.allSettled(promises);
      this.logger.log('Update notifications processed (some may have failed)');
    } catch (error) {
      this.logger.error(`Failed to send update notifications: ${error.message}`, error.stack);
      // Don't throw error for notification failures - log and continue
      this.logger.warn('Continuing despite notification failure');
    }
  }

  /**
   * Send cancellation verification code to guest
   */
  async sendCancellationCode(
    guestEmail: string,
    guestName: string,
    code: string,
    serialKey: string,
    expiryMinutes: number
  ): Promise<void> {
    try {
      const html = `
        <h1>Booking Cancellation Request</h1>
        <p>Hello ${guestName},</p>
        <p>We received a request to cancel your booking <strong>${serialKey}</strong>.</p>
        <p>To confirm the cancellation, please use the following verification code:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p><strong>This code will expire in ${expiryMinutes} minutes.</strong></p>
        <p>If you did not request this cancellation, please ignore this email and your booking will remain active.</p>
        <p>Best regards,<br/>The Eventide Team</p>
      `;

      await this.emailService.sendEmail({
        to: guestEmail,
        subject: 'Booking Cancellation - Verification Code',
        html
      });

      this.logger.log(`Cancellation code sent to ${guestEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send cancellation code email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send cancellation confirmation to guest
   */
  async sendCancellationConfirmation(
    guestEmail: string,
    guestName: string,
    serialKey: string,
    startTime: Date
  ): Promise<void> {
    try {
      const formattedDate = new Date(startTime).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const html = `
        <h1>Booking Cancelled</h1>
        <p>Hello ${guestName},</p>
        <p>Your booking has been successfully cancelled.</p>
        <h3>Cancelled Booking Details:</h3>
        <ul>
          <li><strong>Booking ID:</strong> ${serialKey}</li>
          <li><strong>Original Date & Time:</strong> ${formattedDate}</li>
        </ul>
        <p>If you cancelled by mistake or would like to rebook, please visit our booking page.</p>
        <p>Best regards,<br/>The Eventide Team</p>
      `;

      await this.emailService.sendEmail({
        to: guestEmail,
        subject: 'Booking Cancellation Confirmed',
        html
      });

      this.logger.log(`Cancellation confirmation sent to ${guestEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send cancellation confirmation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getProviderEmail(providerId: string): Promise<string | null> {
    const provider = await this.usersService.findById(providerId);
    return provider?.email || null;
  }

  private async getGuestEmail(guestId: string): Promise<string | null> {
    const guest = await this.usersService.findById(guestId);
    return guest?.email || null;
  }

  async sendCompletionNotifications(booking: IBooking) {
    try {
      // Get provider email
      const provider = await this.getProviderEmail(booking.providerId);

      const promises: Promise<any>[] = [];

      // Send feedback request to guest using guestEmail directly
      if (booking.guestEmail) {
        promises.push(this.emailService.sendEmail({
          template: 'booking-feedback-request',
          to: booking.guestEmail,
          subject: 'How was your experience?',
          context: { booking }
        }));
      }

      // Send completion notification to provider
      if (provider) {
        promises.push(this.emailService.sendEmail({
          template: 'booking-completed-provider',
          to: provider,
          subject: 'Booking Completed',
          context: { booking }
        }));
      }

      await Promise.all(promises);
    } catch (error) {
      this.logger.error(`Failed to send completion notifications: ${error.message}`, error.stack);
      // Don't throw error for notification failures
      this.logger.warn('Continuing despite notification failure');
    }
  }






  async sendProviderBookingConfirmation(booking: IBooking, providerEmail: string) {
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
      const endTime = new Date(booking.endTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });

      const html = `
        <h1>New Booking Received</h1>
        <p>Hello,</p>
        <p>You have received a new booking!</p>
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Booking ID:</strong> ${booking.serialKey}</li>
          <li><strong>Guest:</strong> ${booking.guestName}</li>
          <li><strong>Email:</strong> ${booking.guestEmail}</li>
          ${booking.guestPhone ? `<li><strong>Phone:</strong> ${booking.guestPhone}</li>` : ''}
          <li><strong>Date & Time:</strong> ${startTime} - ${endTime}</li>
          <li><strong>Duration:</strong> ${booking.duration} minutes</li>
        </ul>
        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        <p><em>Times shown in ${timezone} timezone</em></p>
        <p>Best regards,<br/>The Eventide Team</p>
      `;

      await this.emailService.sendEmail({
        to: providerEmail,
        subject: 'New Booking Received',
        html
      });
    } catch (error) {
      this.logger.error(`Failed to send provider booking confirmation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBookingCancellation(booking: IBooking, providerEmail: string) {
    try {
      // Send cancellation notice to guest
      await this.emailService.sendEmail({
        template: 'booking-cancellation',
        to: booking.guestEmail,
        subject: 'Booking Cancellation',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
        }
      });

      // Send notification to provider
      await this.emailService.sendEmail({
        template: 'booking-cancellation-provider',
        to: providerEmail,
        subject: 'Booking Cancelled',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send booking cancellation emails: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBookingModification(
    booking: IBooking,
    providerEmail: string,
    changes: Record<string, any>
  ) {
    try {
      // Send modification notice to guest
      await this.emailService.sendEmail({
        template: 'booking-modification',
        to: booking.guestEmail,
        subject: 'Booking Modified',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
          changes,
        }
      });

      // Send notification to provider
      await this.emailService.sendEmail({
        template: 'booking-modification-provider',
        to: providerEmail,
        subject: 'Booking Modified',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
          changes,
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send booking modification emails: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendBookingReminder(booking: IBooking, providerEmail: string) {
    try {
      // Send reminder to guest
      await this.emailService.sendEmail({
        template: 'booking-reminder',
        to: booking.guestEmail,
        subject: 'Upcoming Booking Reminder',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
        }
      });

      // Send reminder to provider
      await this.emailService.sendEmail({
        template: 'booking-reminder-provider',
        to: providerEmail,
        subject: 'Upcoming Booking Reminder',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send booking reminder emails: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send feedback request email after booking completion
   */
  async sendFeedbackRequest(booking: IBooking) {
    try {
      await this.emailService.sendEmail({
        template: 'booking-feedback',
        to: booking.guestEmail,
        subject: 'Share Your Experience',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
          feedbackUrl: `${process.env.FRONTEND_URL}/feedback/${booking.serialKey}`,
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send feedback request email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send follow-up email after booking
   */
  async sendFollowUp(booking: IBooking) {
    try {
      await this.emailService.sendEmail({
        template: 'booking-followup',
        to: booking.guestEmail,
        subject: 'How Was Your Experience?',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send follow-up email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(booking: IBooking, paymentDetails: any) {
    try {
      await this.emailService.sendEmail({
        template: 'booking-payment',
        to: booking.guestEmail,
        subject: 'Payment Confirmation',
        context: {
          guestName: booking.guestName,
          serialKey: booking.serialKey,
          startTime: booking.startTime,
          endTime: booking.endTime,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          paymentMethod: paymentDetails.method,
          transactionId: paymentDetails.transactionId,
          receiptUrl: paymentDetails.receiptUrl,
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send summary email for recurring bookings
   */
  async sendRecurringSummary(
    guestEmail: string,
    guestName: string,
    providerEmail: string | null,
    bookings: IBooking[]
  ): Promise<void> {
    try {
      // Get provider timezone
      const provider = await this.usersService.findById(bookings[0].providerId);
      const timezone = provider?.preferences?.timezone || 'UTC';
      
      const bookingsList = bookings
        .map(b => {
          const start = new Date(b.startTime).toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone
          });
          const end = new Date(b.endTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone
          });
          return `<li><strong>${b.serialKey}</strong>: ${start} - ${end}</li>`;
        })
        .join('');

      const guestHtml = `
        <h1>Recurring Booking Confirmation</h1>
        <p>Hello ${guestName},</p>
        <p>Your recurring booking has been confirmed for <strong>${bookings.length}</strong> sessions:</p>
        <ul>${bookingsList}</ul>
        <p><em>Times shown in ${timezone} timezone</em></p>
        <p>You will receive individual reminders before each session.</p>
        <p>Best regards,<br/>The Eventide Team</p>
      `;

      const providerHtml = `
        <h1>New Recurring Booking Received</h1>
        <p>Hello,</p>
        <p>A new recurring booking has been made by <strong>${guestName}</strong> (${guestEmail}) for <strong>${bookings.length}</strong> sessions:</p>
        <ul>${bookingsList}</ul>
        <p><em>Times shown in ${timezone} timezone</em></p>
        <p>Best regards,<br/>The Eventide Team</p>
      `;

      // Send both emails in parallel
      const promises: Promise<any>[] = [
        this.emailService.sendEmail({
          to: guestEmail,
          subject: `Recurring Booking Confirmation - ${bookings.length} Sessions`,
          html: guestHtml
        })
      ];

      if (providerEmail) {
        promises.push(
          this.emailService.sendEmail({
            to: providerEmail,
            subject: `New Recurring Booking - ${bookings.length} Sessions`,
            html: providerHtml
          })
        );
      }

      await Promise.all(promises);
      this.logger.log(`Recurring booking summary sent to guest and provider for ${bookings.length} bookings`);
    } catch (error) {
      this.logger.error(`Failed to send recurring booking summary: ${error.message}`, error.stack);
      throw error;
    }
  }
}
