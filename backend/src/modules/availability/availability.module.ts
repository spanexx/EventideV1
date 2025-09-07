import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Availability, AvailabilitySchema } from './availability.schema';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { CustomCacheModule } from '../../core/cache/cache.module';
import { WebsocketsModule } from '../../core/websockets';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Availability.name, schema: AvailabilitySchema },
    ]),
    CustomCacheModule,
    WebsocketsModule,
  ],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
