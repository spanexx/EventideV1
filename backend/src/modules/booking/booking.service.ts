import { 
  Injectable, 
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from './booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsDto } from './dto/get-bookings.dto';
import { IBooking } from './interfaces/booking.interface';
import { AvailabilityService } from '../availability/availability.service';
import { UsersService } from '../users/users.service';
import { BookingBaseService } from './services/booking-base.service';
import { BookingCacheService } from './services/booking-cache.service';
import { BookingEventsService } from './services/booking-events.service';
import { BookingValidationService } from './services/booking-validation.service';
import { BookingSerialKeyService } from './services/booking-serial-key.service';
import { BookingSearchService } from './services/booking-search.service';
import { BookingPaymentService } from './services/booking-payment.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { BookingCreationService } from './services/booking-creation.service';
import { QRCodeService } from 'src/core/utils/qr-code.service';
import { IAvailability } from '../availability/interfaces/availability.interface';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private transactionsSupported = false;

  constructor(
    @InjectConnection() private connection: Connection,
    private readonly availabilityService: AvailabilityService,
    private readonly usersService: UsersService,
    private readonly baseService: BookingBaseService,
    private readonly cacheService: BookingCacheService,
    private readonly eventsService: BookingEventsService,
    private readonly validationService: BookingValidationService,
    private readonly serialKeyService: BookingSerialKeyService,
    private readonly searchService: BookingSearchService,
    private readonly paymentService: BookingPaymentService,
    private readonly notificationService: NotificationService,
    private readonly bookingCreationService: BookingCreationService,
  ) {
    this.checkTransactionSupport();
  }

  private async checkTransactionSupport() {
    try {
      const info = await this.connection.db?.admin().command({ replSetGetStatus: 1 });
      if (info?.ok) {
        this.transactionsSupported = true;
        this.logger.log('MongoDB replica set detected: transactions enabled');
      } else {
        this.logger.warn('MongoDB is not a replica set: transactions disabled. Using fallback mechanism.');
        this.transactionsSupported = false;
      }
    } catch (err) {
      // Error means we're not connected to a replica set
      this.transactionsSupported = false;
      this.logger.warn('MongoDB is not a replica set: transactions disabled. Using fallback mechanism.');
    }
  }

  /**
   * Create a new booking with transactional integrity if available
   */
  async create(createBookingDto: CreateBookingDto): Promise<IBooking | IBooking[]> {
    if (this.transactionsSupported) {
      const session = await this.connection.startSession();
      try {
        session.startTransaction();
        const result = await this.bookingCreationService.createBooking(createBookingDto, session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        this.logger.error(
          `Failed to create booking: ${error.message}`,
          error.stack
        );
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      this.logger.log('Transactions not supported. Running without transaction.');
      return this.bookingCreationService.createBooking(createBookingDto, null);
    }
  }


  /**
   * Update a booking's status or notes
   */
  async update(
    bookingId: string,
    updateBookingDto: UpdateBookingDto
  ): Promise<IBooking> {
    if (this.transactionsSupported) {
      const session = await this.connection.startSession();

      try {
        let result;

        await session.withTransaction(async () => {
          // Get existing booking first
          const oldBooking = await this.baseService.findById(bookingId);
          if (!oldBooking) {
            throw new NotFoundException('Booking not found');
          }

          // Update booking using base service
          const updatedBooking = await this.baseService.findByIdAndUpdate(bookingId, updateBookingDto, session);
          if (!updatedBooking) {
            throw new NotFoundException('Failed to update booking');
          }

          // Handle status changes
          if (updateBookingDto.status && updateBookingDto.status !== oldBooking.status) {
            await this.handleBookingStatusChange(updatedBooking, oldBooking, session);
          }

          // Send notifications for modifications
          if (Object.keys(updateBookingDto).length > 0) {
            await this.notificationService.handleUpdateNotifications(updatedBooking, oldBooking, updateBookingDto);
          }
          
          result = updatedBooking;

          // Emit events
          this.eventsService.emitBookingUpdated(updatedBooking);

          if (updateBookingDto.status === BookingStatus.CANCELLED) {
            this.eventsService.emitAvailabilityStatusChange(updatedBooking, 'released');
          }
          
          if (updateBookingDto.status !== oldBooking.status) {
            this.eventsService.emitBookingStatusChange(
              updatedBooking,
              oldBooking.status as BookingStatus,
              updateBookingDto.status as BookingStatus
            );
          }

          result = updatedBooking;
        });

        return result;
      } catch (error) {
        this.logger.error(
          `Failed to update booking: ${error.message}`,
          error.stack
        );
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // Fallback without transaction for standalone MongoDB
      this.logger.log('Transactions not supported. Running update without transaction.');
      
      try {
        // Get existing booking first
        const oldBooking = await this.baseService.findById(bookingId);
        if (!oldBooking) {
          throw new NotFoundException('Booking not found');
        }

        // Update booking using base service
        const updatedBooking = await this.baseService.findByIdAndUpdate(bookingId, updateBookingDto, null);
        if (!updatedBooking) {
          throw new NotFoundException('Failed to update booking');
        }

        // Handle status changes
        if (updateBookingDto.status && updateBookingDto.status !== oldBooking.status) {
          await this.handleBookingStatusChange(updatedBooking, oldBooking, null);
        }

        // Send notifications for modifications
        if (Object.keys(updateBookingDto).length > 0) {
          await this.notificationService.handleUpdateNotifications(updatedBooking, oldBooking, updateBookingDto);
        }

        // Emit events
        this.eventsService.emitBookingUpdated(updatedBooking);

        if (updateBookingDto.status === BookingStatus.CANCELLED) {
          this.eventsService.emitAvailabilityStatusChange(updatedBooking, 'released');
        }
        
        if (updateBookingDto.status !== oldBooking.status) {
          this.eventsService.emitBookingStatusChange(
            updatedBooking,
            oldBooking.status as BookingStatus,
            updateBookingDto.status as BookingStatus
          );
        }

        return updatedBooking;
      } catch (error) {
        this.logger.error(
          `Failed to update booking: ${error.message}`,
          error.stack
        );
        throw error;
      }
    }
  }

  /**
   * Find bookings with optional filtering
   */
  async findAll(getBookingsDto: GetBookingsDto): Promise<IBooking[]> {
    try {
      return await this.searchService.findByFilter(getBookingsDto);
    } catch (error) {
      this.logger.error(
        `Failed to find bookings: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Handle successful payment and send confirmation
   */
  async handlePaymentSuccess(bookingId: string, paymentDetails: any): Promise<void> {
    try {
      const booking = await this.findOne(bookingId);
      await this.notificationService.sendPaymentConfirmation(booking, paymentDetails);
    } catch (error) {
      this.logger.error(
        `Failed to handle payment success: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find a single booking by ID
   */
  async findOne(id: string): Promise<IBooking> {
    try {
      const booking = await this.baseService.findById(id);
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      return booking;
    } catch (error) {
      this.logger.error(
        `Failed to find booking: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find bookings for a specific guest by email
   */
  async findByGuestEmail(email: string): Promise<IBooking[]> {
    try {
      return await this.searchService.findBookingsByEmail(email);
    } catch (error) {
      this.logger.error(
        `Failed to find bookings by email: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Helper method to get changes between old and new booking
   */
  private async handleBookingStatusChange(
    updatedBooking: IBooking,
    oldBooking: IBooking,
    session?: any
  ): Promise<void> {
    switch (updatedBooking.status) {
    case BookingStatus.CANCELLED:
      await this.availabilityService.markAsAvailable(
        updatedBooking.availabilityId,
        session || null
      );
      await this.notificationService.sendCancellationNotifications(updatedBooking);
      await this.eventsService.emitBookingCancelled(updatedBooking);
      break;

    case BookingStatus.COMPLETED:
      await this.notificationService.sendCompletionNotifications(updatedBooking);
      await this.eventsService.emitBookingCompleted(updatedBooking);
      break;

    case BookingStatus.CONFIRMED:
      // On approval from pending -> confirmed, send confirmation to guest
      if (updatedBooking.guestEmail) {
        await this.notificationService.sendGuestBookingConfirmation(updatedBooking, updatedBooking.guestEmail);
      }
      break;

      // Add other status transitions as needed
    }
  }
  /**
   * Find a booking by its serial key
   * @param serialKey The serial key to search for
   * @returns Promise<IBooking> The booking if found
   */
  async findBySerialKey(serialKey: string): Promise<IBooking> {
    try {
      const booking = await this.baseService.findBySerialKey(serialKey);
      
      if (!booking) {
        throw new NotFoundException('Booking not found with provided serial key');
      }

      // Generate QR code for the booking
      const qrCode = await this.serialKeyService.generateQRCode(serialKey);

      return {
        ...booking,
        qrCode // Include QR code in response
      };
    } catch (error) {
      this.logger.error(
        `Failed to find booking by serial key: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Verify a booking by its serial key
   * @param serialKey The serial key to verify
   * @returns Promise<IBooking> The verified booking if valid
   */
  async verifyBooking(serialKey: string): Promise<IBooking> {
    try {
      const booking = await this.findBySerialKey(serialKey);
      
      // Add any additional verification logic here
      // For example, check if the booking is not expired, cancelled, etc.
      
      return booking;
    } catch (error) {
      this.logger.error(
        `Failed to verify booking: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}

  