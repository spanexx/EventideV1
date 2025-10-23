import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QueueNames, JobNames } from '../../../core/queue/queue.constants';
import { BookingService } from '../booking.service';
import { BookingStatus } from '../booking.schema';

@Processor(QueueNames.BOOKING)
@Injectable()
export class BookingProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingProcessor.name);

  constructor(private readonly bookingService: BookingService) {
    super();
  }

  // BullMQ worker method (override WorkerHost.process)
  async process(job: Job<{ bookingId: string }>) {
    const { bookingId } = job.data;
    this.logger.log(`[BookingProcessor] Auto-complete job started for ${bookingId}`);

    try {
      const booking = await this.bookingService.findOne(bookingId);

      // Idempotency: skip if already terminal
      if ([BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW].includes(booking.status as BookingStatus)) {
        this.logger.log(`[BookingProcessor] Booking ${bookingId} already in terminal status: ${booking.status}`);
        return;
      }

      // Only auto-complete confirmed/in_progress bookings
      if (![BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(booking.status as BookingStatus)) {
        this.logger.warn(`[BookingProcessor] Skipping auto-complete for ${bookingId} with status ${booking.status}`);
        return;
      }

      await this.bookingService.update(bookingId, { status: BookingStatus.COMPLETED });
      this.logger.log(`[BookingProcessor] Booking ${bookingId} marked COMPLETED`);
    } catch (err: any) {
      this.logger.error(`[BookingProcessor] Failed to auto-complete ${bookingId}: ${err?.message}`);
      throw err;
    }
  }
}
