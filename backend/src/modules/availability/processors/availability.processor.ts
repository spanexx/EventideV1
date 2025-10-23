import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNames, JobNames } from '../../../core/queue/queue.constants';
import { AvailabilitySchedulerService } from '../services/availability-scheduler.service';

@Processor(QueueNames.AVAILABILITY)
@Injectable()
export class AvailabilityProcessor extends WorkerHost {
  private readonly logger = new Logger(AvailabilityProcessor.name);

  constructor(private readonly scheduler: AvailabilitySchedulerService) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`[AvailabilityProcessor] Running job ${job.name}`);
    switch (job.name) {
      case JobNames.EXTEND_RECURRING:
        await this.scheduler.extendRecurringSlots();
        break;
      case JobNames.CLEANUP_PAST:
        await this.scheduler.cleanupPastSlots();
        break;
      default:
        this.logger.warn(`[AvailabilityProcessor] Unknown job name: ${job.name}`);
    }
  }
}
