import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QueueNames, JobNames } from './queue.constants';
import { IBooking } from '../../modules/booking/interfaces/booking.interface';

@Injectable()
export class BookingQueueService {
  private readonly logger = new Logger(BookingQueueService.name);
  private readonly defaultHours: number;

  constructor(
    @InjectQueue(QueueNames.BOOKING) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {
    this.defaultHours = Number(this.config.get('BOOKING_AUTOCOMPLETE_AFTER_HOURS', 2));
  }

  async scheduleAutoComplete(bookingId: string, endTime: Date, hoursAfter?: number): Promise<void> {
    const hours = hoursAfter ?? this.defaultHours;
    const when = new Date(endTime).getTime() + hours * 3600_000;
    const delay = Math.max(0, when - Date.now());

    const jobId = `booking:${bookingId}:auto-complete`;

    this.logger.log(`[BookingQueue] Scheduling auto-complete for ${bookingId} in ${Math.round(delay/1000)}s`);

    await this.queue.add(
      JobNames.AUTO_COMPLETE_BOOKING,
      { bookingId },
      {
        jobId,
        delay,
        attempts: 5,
        removeOnComplete: true,
        backoff: { type: 'exponential', delay: 10_000 },
      },
    );
  }

  async scheduleAutoCompleteMany(bookings: IBooking[], hoursAfter?: number): Promise<void> {
    for (const b of bookings) {
      await this.scheduleAutoComplete((b as any)._id || (b as any).id, new Date(b.endTime), hoursAfter);
    }
  }

  async cancelAutoComplete(bookingId: string): Promise<void> {
    try {
      const jobId = `booking:${bookingId}:auto-complete`;
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`[BookingQueue] Cancelled auto-complete job for ${bookingId}`);
      } else {
        this.logger.log(`[BookingQueue] No auto-complete job found to cancel for ${bookingId}`);
      }
    } catch (err) {
      this.logger.error(`[BookingQueue] Failed to cancel auto-complete for ${bookingId}: ${(err as any)?.message}`);
    }
  }

  async rescheduleAutoComplete(bookingId: string, newEndTime: Date, hoursAfter?: number): Promise<void> {
    await this.cancelAutoComplete(bookingId);
    await this.scheduleAutoComplete(bookingId, newEndTime, hoursAfter);
  }
}
