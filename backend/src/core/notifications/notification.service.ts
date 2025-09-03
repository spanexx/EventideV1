// import { Injectable, Logger } from '@nestjs/common';
// import { MailerService } from '@nestjs-modules/mailer';
// // import { Booking } from '../../modules/bookings/booking.schema';

// export interface EmailTemplate {
//   subject: string;
//   template: string;
//   context: Record<string, any>;
// }

// @Injectable()
// export class NotificationService {
//   private readonly logger = new Logger(NotificationService.name);

//   constructor(private readonly mailerService: MailerService) {}

//   async sendBookingConfirmation(booking: Booking): Promise<void> {
//     try {
//       // In a real implementation, we would fetch the user details
//       // For now, we'll use the guest details from the booking
//       const recipientEmail = booking.guestDetails?.email;
//       if (!recipientEmail) {
//         this.logger.warn(`No email address found for booking ${booking.id}`);
//         return;
//       }

//       await this.mailerService.sendMail({
//         to: recipientEmail,
//         subject: 'Booking Confirmation',
//         template: './booking-confirmation',
//         context: {
//           name: booking.guestDetails?.name || 'Valued Customer',
//           startTime: booking.startTime,
//           duration: booking.duration,
//           notes: booking.notes,
//         },
//       });

//       this.logger.log(`Booking confirmation email sent to ${recipientEmail}`);
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to send booking confirmation email: ${error.message}`,
//         error.stack,
//       );
//     }
//   }

//   async sendBookingReminder(booking: Booking): Promise<void> {
//     try {
//       const recipientEmail = booking.guestDetails?.email;
//       if (!recipientEmail) {
//         this.logger.warn(`No email address found for booking ${booking.id}`);
//         return;
//       }

//       await this.mailerService.sendMail({
//         to: recipientEmail,
//         subject: 'Booking Reminder',
//         template: './booking-reminder',
//         context: {
//           name: booking.guestDetails?.name || 'Valued Customer',
//           startTime: booking.startTime,
//           duration: booking.duration,
//           notes: booking.notes,
//         },
//       });

//       this.logger.log(`Booking reminder email sent to ${recipientEmail}`);
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to send booking reminder email: ${error.message}`,
//         error.stack,
//       );
//     }
//   }

//   async sendBookingCancellation(booking: Booking): Promise<void> {
//     try {
//       const recipientEmail = booking.guestDetails?.email;
//       if (!recipientEmail) {
//         this.logger.warn(`No email address found for booking ${booking.id}`);
//         return;
//       }

//       await this.mailerService.sendMail({
//         to: recipientEmail,
//         subject: 'Booking Cancellation',
//         template: './booking-cancellation',
//         context: {
//           name: booking.guestDetails?.name || 'Valued Customer',
//           startTime: booking.startTime,
//           duration: booking.duration,
//           notes: booking.notes,
//         },
//       });

//       this.logger.log(`Booking cancellation email sent to ${recipientEmail}`);
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to send booking cancellation email: ${error.message}`,
//         error.stack,
//       );
//     }
//   }

//   async sendAvailabilityUpdate(
//     providerEmail: string,
//     providerName: string,
//   ): Promise<void> {
//     try {
//       await this.mailerService.sendMail({
//         to: providerEmail,
//         subject: 'Availability Updated',
//         template: './availability-update',
//         context: {
//           name: providerName,
//         },
//       });

//       this.logger.log(`Availability update email sent to ${providerEmail}`);
//     } catch (error: any) {
//       this.logger.error(
//         `Failed to send availability update email: ${error.message}`,
//         error.stack,
//       );
//     }
//   }
// }
