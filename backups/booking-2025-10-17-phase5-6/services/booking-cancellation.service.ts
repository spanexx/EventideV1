import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../booking.schema';
import { NotificationService } from '../../../core/notifications/notification.service';
import { Availability, AvailabilityDocument } from '../../availability/availability.schema';
import { AvailabilityCacheService } from '../../availability/services/availability-cache.service';

interface CancellationCode {
  bookingId: string;
  guestEmail: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class BookingCancellationService {
  private readonly logger = new Logger(BookingCancellationService.name);
  private readonly cancellationCodes = new Map<string, CancellationCode>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly CODE_EXPIRY_MINUTES = 15;

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Availability.name) private availabilityModel: Model<AvailabilityDocument>,
    private readonly notificationService: NotificationService,
    private readonly availabilityCacheService: AvailabilityCacheService,
  ) {
    // Clean up expired codes every 5 minutes
    setInterval(() => this.cleanupExpiredCodes(), 5 * 60 * 1000);
  }

  /**
   * Generate and send a 6-digit verification code to the guest's email
   */
  async requestCancellation(bookingId: string, guestEmail: string, serialKey?: string): Promise<{ message: string }> {
    // Verify booking exists and email matches
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.guestEmail !== guestEmail) {
      throw new BadRequestException('Email does not match booking');
    }

    // If serial key is provided, verify it matches the booking
    if (serialKey && booking.serialKey !== serialKey) {
      throw new BadRequestException('Serial key does not match booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

    // Store code
    const key = `${bookingId}-${guestEmail}`;
    this.cancellationCodes.set(key, {
      bookingId,
      guestEmail,
      code,
      expiresAt,
      attempts: 0,
    });

    this.logger.log(`Cancellation code generated for booking ${bookingId}: ${code}`);

    // Send email with verification code
    try {
      await this.notificationService.sendCancellationCode(
        guestEmail,
        booking.guestName,
        code
      );
    } catch (error) {
      this.logger.error(`Failed to send cancellation email: ${error.message}`);
      // Don't throw error - code is still valid
    }

    return {
      message: `Verification code sent to ${guestEmail}. Please check your email.`,
    };
  }

  /**
   * Verify the code and cancel the booking
   */
  async verifyCancellation(
    bookingId: string,
    guestEmail: string,
    verificationCode: string
  ): Promise<{ message: string; booking: BookingDocument }> {
    const key = `${bookingId}-${guestEmail}`;
    const storedCode = this.cancellationCodes.get(key);

    if (!storedCode) {
      throw new BadRequestException('No cancellation request found. Please request a new code.');
    }

    // Check if code has expired
    if (new Date() > storedCode.expiresAt) {
      this.cancellationCodes.delete(key);
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    // Check attempts
    if (storedCode.attempts >= this.MAX_ATTEMPTS) {
      this.cancellationCodes.delete(key);
      throw new BadRequestException('Too many failed attempts. Please request a new code.');
    }

    // Verify code
    if (storedCode.code !== verificationCode) {
      storedCode.attempts++;
      this.cancellationCodes.set(key, storedCode);
      const remainingAttempts = this.MAX_ATTEMPTS - storedCode.attempts;
      throw new BadRequestException(
        `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
      );
    }

    // Code is valid - cancel the booking
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.updatedAt = new Date();
    await booking.save();

    // Update availability slot's isBooked status
    if (booking.availabilityId) {
      const availability = await this.availabilityModel.findById(booking.availabilityId);
      if (availability) {
        availability.isBooked = false;
        await availability.save();
        
        // Clear the availability cache to ensure the slot shows up as available
        await this.availabilityCacheService.clearProviderCache(availability.providerId);
      }
    }

    // Remove the code
    this.cancellationCodes.delete(key);

    this.logger.log(`Booking ${bookingId} cancelled successfully via verification code`);

    // Send cancellation confirmation email
    try {
      await this.notificationService.sendCancellationConfirmation(
        guestEmail,
        booking.guestName,
        booking.serialKey
      );
    } catch (error) {
      this.logger.error(`Failed to send cancellation confirmation: ${error.message}`);
    }

    return {
      message: 'Booking cancelled successfully',
      booking,
    };
  }

  /**
   * Clean up expired verification codes
   */
  private cleanupExpiredCodes(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [key, code] of this.cancellationCodes.entries()) {
      if (now > code.expiresAt) {
        this.cancellationCodes.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired cancellation codes`);
    }
  }

  /**
   * Get remaining attempts for a cancellation request
   */
  getRemainingAttempts(bookingId: string, guestEmail: string): number {
    const key = `${bookingId}-${guestEmail}`;
    const storedCode = this.cancellationCodes.get(key);

    if (!storedCode) {
      return 0;
    }

    if (new Date() > storedCode.expiresAt) {
      return 0;
    }

    return this.MAX_ATTEMPTS - storedCode.attempts;
  }
}
