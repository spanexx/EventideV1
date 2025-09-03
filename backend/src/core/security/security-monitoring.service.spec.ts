import { Test, TestingModule } from '@nestjs/testing';
import {
  SecurityMonitoringService,
  SecurityEvent,
} from './security-monitoring.service';

describe('SecurityMonitoringService', () => {
  let service: SecurityMonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityMonitoringService],
    }).compile();

    service = module.get<SecurityMonitoringService>(SecurityMonitoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAuthenticationAttempt', () => {
    it('should log successful authentication attempts', () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'log');

      service.logAuthenticationAttempt(
        true,
        '127.0.0.1',
        'test@example.com',
        'user123',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        'Authentication successful for test@example.com from IP 127.0.0.1',
      );
    });

    it('should log failed authentication attempts', () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'log');

      service.logAuthenticationAttempt(false, '127.0.0.1', 'test@example.com');

      expect(loggerSpy).toHaveBeenCalledWith(
        'Authentication failed for test@example.com from IP 127.0.0.1',
      );
    });
  });

  describe('logSuspiciousActivity', () => {
    it('should log suspicious activity', () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'warn');

      service.logSuspiciousActivity({
        ip: '127.0.0.1',
        details: { reason: 'test_reason' },
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        'Suspicious activity detected: {"ip":"127.0.0.1","details":{"reason":"test_reason"}}',
      );
    });
  });

  describe('checkSuspiciousActivity', () => {
    it('should detect multiple failed attempts from the same IP', () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'warn');

      // Log multiple failed attempts from the same IP
      for (let i = 0; i < 5; i++) {
        service.logAuthenticationAttempt(
          false,
          '127.0.0.1',
          `user${i}@example.com`,
        );
      }

      expect(loggerSpy).toHaveBeenCalledWith(
        'Suspicious activity detected: {"ip":"127.0.0.1","details":{"reason":"multiple_failed_attempts","count":5}}',
      );
    });

    it('should detect multiple IPs for the same user', () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'warn');

      // Log attempts from different IPs for the same user
      service.logAuthenticationAttempt(
        true,
        '127.0.0.1',
        'test@example.com',
        'user123',
      );
      service.logAuthenticationAttempt(
        false,
        '127.0.0.2',
        'test@example.com',
        'user123',
      );
      service.logAuthenticationAttempt(
        true,
        '127.0.0.3',
        'test@example.com',
        'user123',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        'Suspicious activity detected: {"userId":"user123","details":{"reason":"multiple_ips_for_user","ipCount":3}}',
      );
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events', () => {
      // Clear any existing events by creating a new service instance
      const newService = new SecurityMonitoringService();

      newService.logAuthenticationAttempt(
        true,
        '127.0.0.1',
        'test@example.com',
      );

      const events = newService.getRecentEvents(60); // Last 60 minutes
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('auth_success');
      expect(events[0].ip).toBe('127.0.0.1');
    });
  });

  describe('getEventsByType', () => {
    it('should return events filtered by type', () => {
      // Clear any existing events by creating a new service instance
      const newService = new SecurityMonitoringService();

      newService.logAuthenticationAttempt(
        true,
        '127.0.0.1',
        'test1@example.com',
      );
      newService.logAuthenticationAttempt(
        false,
        '127.0.0.2',
        'test2@example.com',
      );

      const successEvents = newService.getEventsByType('auth_success');
      const failureEvents = newService.getEventsByType('auth_failure');

      expect(successEvents).toHaveLength(1);
      expect(successEvents[0].eventType).toBe('auth_success');

      expect(failureEvents).toHaveLength(1);
      expect(failureEvents[0].eventType).toBe('auth_failure');
    });
  });
});
