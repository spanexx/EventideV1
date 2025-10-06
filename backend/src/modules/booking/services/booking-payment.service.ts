import { Injectable, Logger } from '@nestjs/common';
import { IBooking } from '../interfaces/booking.interface';
import { BookingNotificationService } from './booking-notification.service';

@Injectable()
export class BookingPaymentService {
  private readonly logger = new Logger(BookingPaymentService.name);

  constructor(
    private readonly notificationService: BookingNotificationService
  ) {}

  async handlePaymentSuccess(booking: IBooking, paymentDetails: any): Promise<void> {
    try {
      await this.notificationService.sendPaymentConfirmation(booking, paymentDetails);
    } catch (error) {
      this.logger.error(
        `Failed to handle payment success: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async processRefund(booking: IBooking, refundDetails: any): Promise<void> {
    // Add refund processing logic here
    // This is a placeholder for future implementation
    throw new Error('Refund processing not implemented');
  }
}
