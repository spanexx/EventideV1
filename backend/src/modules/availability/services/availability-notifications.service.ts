import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../../core/email/email.service';
import { IAvailability } from '../interfaces/availability.interface';
import { UserDocument } from '../../users/user.schema';

@Injectable()
export class AvailabilityNotificationsService {
  private readonly logger = new Logger(AvailabilityNotificationsService.name);

  constructor(private readonly emailService: EmailService) {}

  private getProviderName(provider: UserDocument): string {
    if (provider.firstName && provider.lastName) {
      return `${provider.firstName} ${provider.lastName}`;
    } else if (provider.firstName) {
      return provider.firstName;
    } else if (provider.lastName) {
      return provider.lastName;
    }
    return 'Provider';
  }

  private validateEmail(provider: UserDocument): string {
    if (!provider.email) {
      throw new Error('Provider email is required for notifications');
    }
    return provider.email;
  }

  async sendBulkUpdateNotification(
    provider: UserDocument,
    updates: IAvailability[],
  ): Promise<void> {
    await this.emailService.sendTemplatedEmail({
      to: this.validateEmail(provider),
      template: 'availability-bulk-update',
      context: {
        name: this.getProviderName(provider),
        updatesCount: updates.length,
        updates: updates.map(update => ({
          date: update.date,
          startTime: update.startTime,
          endTime: update.endTime
        }))
      }
    });
  }

  async sendCancellationNotification(
    provider: UserDocument,
    cancelled: IAvailability,
  ): Promise<void> {
    await this.emailService.sendTemplatedEmail({
      to: this.validateEmail(provider),
      template: 'availability-cancellation',
      context: {
        name: this.getProviderName(provider),
        date: cancelled.date,
        startTime: cancelled.startTime,
        endTime: cancelled.endTime
      }
    });
  }

  async sendOverrideNotification(
    provider: UserDocument,
    original: IAvailability,
    override: IAvailability,
  ): Promise<void> {
    await this.emailService.sendTemplatedEmail({
      to: this.validateEmail(provider),
      template: 'availability-override',
      context: {
        name: this.getProviderName(provider),
        originalDate: original.date,
        originalStart: original.startTime,
        originalEnd: original.endTime,
        newDate: override.date,
        newStart: override.startTime,
        newEnd: override.endTime
      }
    });
  }

  async sendUpdateNotification(
    provider: UserDocument,
    original: IAvailability,
    updated: IAvailability,
  ): Promise<void> {
    await this.emailService.sendTemplatedEmail({
      to: this.validateEmail(provider),
      template: 'availability-update',
      context: {
        name: this.getProviderName(provider),
        originalDate: original.date,
        originalStart: original.startTime,
        originalEnd: original.endTime,
        newDate: updated.date,
        newStart: updated.startTime,
        newEnd: updated.endTime
      }
    });
  }
}
