import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule as BullMQModule } from '@nestjs/bullmq';
import { QueueNames } from './queue.constants';
import { BookingQueueService } from './booking-queue.service';
import { AvailabilityQueueService } from './availability-queue.service';

@Module({
  imports: [
    ConfigModule,
    BullMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        connection: {
          host: cfg.get<string>('REDIS_HOST', 'localhost'),
          port: cfg.get<number>('REDIS_PORT', 6379),
          password: cfg.get<string>('REDIS_PASSWORD'),
          db: cfg.get<number>('REDIS_DB', 0),
        },
      }),
    }),
    BullMQModule.registerQueue({ name: QueueNames.BOOKING }),
    BullMQModule.registerQueue({ name: QueueNames.AVAILABILITY }),
  ],
  providers: [BookingQueueService, AvailabilityQueueService],
  exports: [BookingQueueService, AvailabilityQueueService, BullMQModule],
})
export class QueueModule {}
