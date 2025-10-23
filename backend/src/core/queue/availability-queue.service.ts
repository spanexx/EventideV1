import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QueueNames, JobNames } from './queue.constants';

@Injectable()
export class AvailabilityQueueService {
  private readonly logger = new Logger(AvailabilityQueueService.name);

  constructor(
    @InjectQueue(QueueNames.AVAILABILITY) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async scheduleExtendRecurring(): Promise<void> {
    this.logger.log('[AvailabilityQueue] Scheduling weekly extend-recurring job');
    await this.queue.add(
      JobNames.EXTEND_RECURRING,
      {},
      {
        jobId: 'extend-recurring',
        repeat: { cron: '0 2 * * 0', tz: 'UTC' } as any, // every Sunday 02:00 UTC
        attempts: 5,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
      },
    );
  }

  async scheduleCleanupPast(): Promise<void> {
    this.logger.log('[AvailabilityQueue] Scheduling daily cleanup-past job');
    await this.queue.add(
      JobNames.CLEANUP_PAST,
      {},
      {
        jobId: 'cleanup-past',
        repeat: { cron: '0 3 * * *', tz: 'UTC' } as any, // every day 03:00 UTC
        attempts: 5,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: true,
      },
    );
  }
}
