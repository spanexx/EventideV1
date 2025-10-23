import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './booking.schema';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { AvailabilityModule } from '../availability/availability.module';
import { WebsocketsModule } from '../../core/websockets';
import { CustomCacheModule } from '../../core/cache/cache.module';
import { SerialKeyService } from '../../core/utils/serial-key.service';
import { QRCodeService } from '../../core/utils/qr-code.service';
import { NotificationModule } from '../../core/notifications/notification.module';
import { BookingBaseService } from './services/booking-base.service';
import { BookingCacheService } from './services/booking-cache.service';
import { BookingEventsService } from './services/booking-events.service';
import { BookingValidationService } from './services/booking-validation.service';
import { BookingSerialKeyService } from './services/booking-serial-key.service';
import { BookingSearchService } from './services/booking-search.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../core/email/email.module';
import { BookingCreationService } from './services/booking-creation.service';
import { BookingCancellationService } from './services/booking-cancellation.service';
import { QueueModule } from '../../core/queue/queue.module';
import { BookingProcessor } from './processors/booking.processor';

// Import modular components
import { RecurringBookingStrategy } from './services/strategies/recurring-booking.strategy';
import { BookingNotificationHandler } from './services/handlers/booking-notification.handler';
import { BookingInstanceUtils } from './services/utils/booking-instance.utils';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema }
    ]),
    AvailabilityModule,
    WebsocketsModule,
    CustomCacheModule,
    UsersModule,
    EmailModule,
    NotificationModule,
    QueueModule,
  ],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingBaseService,
    BookingCacheService,
    BookingEventsService,
    BookingValidationService,
    BookingSerialKeyService,
    BookingSearchService,
    BookingCreationService,
    BookingCancellationService,
    BookingProcessor,
    SerialKeyService,
    QRCodeService,
    // Modular components
    RecurringBookingStrategy,
    BookingNotificationHandler,
    BookingInstanceUtils,
  ],
  exports: [BookingService],
})
export class BookingModule {}
