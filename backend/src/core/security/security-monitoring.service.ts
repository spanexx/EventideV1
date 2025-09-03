import { Injectable, Logger } from '@nestjs/common';

export interface SecurityEvent {
  timestamp: Date;
  eventType: string;
  ip?: string;
  userId?: string;
  email?: string;
  userAgent?: string;
  details?: any;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000; // Limit events to prevent memory growth

  private cleanupOldEvents(): void {
    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      // Remove oldest events, keeping only the most recent MAX_EVENTS
      this.events.splice(0, this.events.length - this.MAX_EVENTS);
    }
  }

  logAuthenticationAttempt(
    success: boolean,
    ip: string,
    email?: string,
    userId?: string,
  ): void {
    const eventType = success ? 'auth_success' : 'auth_failure';

    const event: SecurityEvent = {
      timestamp: new Date(),
      eventType,
      ip,
      email,
      userId,
    };

    this.events.push(event);
    this.cleanupOldEvents(); // Clean up old events
    this.logger.log(
      `Authentication ${success ? 'successful' : 'failed'} for ${email || userId} from IP ${ip}`,
    );

    // Check for suspicious activity
    this.checkSuspiciousActivity(event);
  }

  logSuspiciousActivity(details: Partial<SecurityEvent>): void {
    const event: SecurityEvent = {
      timestamp: new Date(),
      eventType: 'suspicious_activity',
      ...details,
    };

    this.events.push(event);
    this.cleanupOldEvents(); // Clean up old events
    this.logger.warn(
      `Suspicious activity detected: ${JSON.stringify(details)}`,
    );
  }

  private checkSuspiciousActivity(event: SecurityEvent): void {
    // Check for multiple failed attempts from the same IP
    if (event.eventType === 'auth_failure') {
      const recentFailures = this.events.filter(
        (e) =>
          e.eventType === 'auth_failure' &&
          e.ip === event.ip &&
          e.timestamp > new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      );

      if (recentFailures.length >= 5) {
        this.logSuspiciousActivity({
          ip: event.ip,
          details: {
            reason: 'multiple_failed_attempts',
            count: recentFailures.length,
          },
        });
      }
    }

    // Check for attempts with different IPs for the same user
    if (event.userId) {
      const recentUserActivities = this.events.filter(
        (e) =>
          e.userId === event.userId &&
          e.timestamp > new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
      );

      const uniqueIPs = [...new Set(recentUserActivities.map((e) => e.ip))]
        .length;
      if (uniqueIPs >= 3) {
        this.logSuspiciousActivity({
          userId: event.userId,
          details: {
            reason: 'multiple_ips_for_user',
            ipCount: uniqueIPs,
          },
        });
      }
    }
  }

  getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.events.filter((event) => event.timestamp >= cutoff);
  }

  getEventsByType(eventType: string, minutes: number = 60): SecurityEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.events.filter(
      (event) => event.eventType === eventType && event.timestamp >= cutoff,
    );
  }
}
