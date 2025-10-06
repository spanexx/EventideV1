import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsService } from '../../../core/websockets/websockets.service';
import { IAvailability } from '../interfaces/availability.interface';

@Injectable()
export class AvailabilityEventsService {
  private readonly logger = new Logger(AvailabilityEventsService.name);

  constructor(
    private readonly websocketsService: WebsocketsService
  ) {}

  /**
   * Emit an event when an availability slot is booked
   */
  emitBooked(providerId: string, availability: IAvailability): void {
    this.websocketsService.emitToRoom(
      `provider-${providerId}`,
      'availabilityBooked',
      availability,
    );
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId,
      action: 'booked',
      data: availability,
    });
  }

  /**
   * Emit an event when an availability slot is unbooked
   */
  emitUnbooked(providerId: string, availability: IAvailability): void {
    this.websocketsService.emitToRoom(
      `provider-${providerId}`,
      'availabilityUnbooked',
      availability,
    );
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId,
      action: 'unbooked',
      data: availability,
    });
  }

  /**
   * Emit availability created event
   */
  emitCreated(providerId: string, availability: IAvailability): void {
    this.websocketsService.emitToRoom(
      `provider-${providerId}`,
      'availabilityCreated',
      availability,
    );
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId,
      action: 'created',
      data: availability,
    });
  }

  /**
   * Emit availability updated event
   */
  emitUpdated(providerId: string, availability: IAvailability): void {
    this.websocketsService.emitToRoom(
      `provider-${providerId}`,
      'availabilityUpdated',
      availability,
    );
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId,
      action: 'updated',
      data: availability,
    });
  }

  /**
   * Emit availability deleted event
   */
  emitDeleted(providerId: string, availabilityId: string): void {
    this.websocketsService.emitToRoom(
      `provider-${providerId}`,
      'availabilityDeleted',
      { id: availabilityId },
    );
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId,
      action: 'deleted',
      data: { id: availabilityId },
    });
  }

  /**
   * Emit bulk availability created event
   */
  emitBulkCreated(providerId: string, availabilities: IAvailability[]): void {
    availabilities.forEach(availability => {
      this.websocketsService.emitToRoom(
        `provider-${providerId}`,
        'availabilityCreated',
        availability,
      );
    });
    
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId,
      action: 'created',
      data: availabilities,
    });
  }
}
