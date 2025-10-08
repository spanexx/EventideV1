import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../../core/email/email.service';
import { IAvailabilityBase } from '../interfaces/availability.interface';
import { format } from 'date-fns';

@Injectable()
export class AvailabilityNotificationService {
  private readonly logger = new Logger(AvailabilityNotificationService.name);

  constructor(private readonly emailService: EmailService) {}

  async notifyBulkUpdate(providerId: string, dates: Date[], recipientEmail: string) {
    try {
      await this.emailService.sendTemplatedEmail({
        to: recipientEmail,
        template: 'availability-bulk-update',
        context: {
          providerName: providerId, // TODO: Get actual provider name
          dates: dates.map(date => format(date, 'MMMM d, yyyy')),
          totalDates: dates.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send bulk update notification: ${error.message}`);
    }
  }

  async notifyCancellation(availability: IAvailabilityBase, recipientEmail: string) {
    try {
      await this.emailService.sendTemplatedEmail({
        to: recipientEmail,
        template: 'availability-cancellation',
        context: {
          date: format(availability.startTime, 'MMMM d, yyyy'),
          startTime: format(availability.startTime, 'h:mm a'),
          endTime: format(availability.endTime, 'h:mm a'),
          providerId: availability.providerId, // TODO: Get actual provider name
          reason: availability.cancellationReason || 'Not specified'
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send cancellation notification: ${error.message}`);
    }
  }

  async notifyOverride(
    original: IAvailabilityBase, 
    override: IAvailabilityBase, 
    recipientEmail: string
  ) {
    try {
      await this.emailService.sendTemplatedEmail({
        to: recipientEmail,
        template: 'availability-override',
        context: {
          originalDate: format(original.startTime, 'MMMM d, yyyy'),
          originalStartTime: format(original.startTime, 'h:mm a'),
          originalEndTime: format(original.endTime, 'h:mm a'),
          newDate: format(override.startTime, 'MMMM d, yyyy'),
          newStartTime: format(override.startTime, 'h:mm a'),
          newEndTime: format(override.endTime, 'h:mm a'),
          providerId: original.providerId // TODO: Get actual provider name
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send override notification: ${error.message}`);
    }
  }

  async notifyUpdate(
    original: IAvailabilityBase, 
    updated: IAvailabilityBase, 
    recipientEmail: string
  ) {
    try {
      await this.emailService.sendTemplatedEmail({
        to: recipientEmail,
        template: 'availability-update',
        context: {
          date: format(updated.startTime, 'MMMM d, yyyy'),
          originalStartTime: format(original.startTime, 'h:mm a'),
          originalEndTime: format(original.endTime, 'h:mm a'),
          newStartTime: format(updated.startTime, 'h:mm a'),
          newEndTime: format(updated.endTime, 'h:mm a'),
          providerId: updated.providerId, // TODO: Get actual provider name
          changes: this.getChanges(original, updated)
        }
      });
    } catch (error) {
      this.logger.error(`Failed to send update notification: ${error.message}`);
    }
  }

  private getChanges(original: IAvailabilityBase, updated: IAvailabilityBase): string[] {
    const changes: string[] = [];
    
    if (format(original.startTime, 'HH:mm') !== format(updated.startTime, 'HH:mm')) {
      changes.push('Start time');
    }
    if (format(original.endTime, 'HH:mm') !== format(updated.endTime, 'HH:mm')) {
      changes.push('End time');
    }
    if (original.maxBookings !== updated.maxBookings) {
      changes.push('Maximum bookings');
    }
    if (original.status !== updated.status) {
      changes.push('Status');
    }
    
    return changes;
  }
}
