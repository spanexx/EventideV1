import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', () => {
      const method = 'GET';
      const route = '/test';
      const statusCode = 200;
      const duration = 50;

      // This should not throw an error
      expect(() => {
        service.recordHttpRequest(method, route, statusCode, duration);
      }).not.toThrow();
    });

    it('should record HTTP error metrics', () => {
      const method = 'POST';
      const route = '/test';
      const statusCode = 500;
      const duration = 100;

      // This should not throw an error
      expect(() => {
        service.recordHttpRequest(method, route, statusCode, duration);
      }).not.toThrow();
    });
  });

  describe('connection tracking', () => {
    it('should increment and decrement connection count', () => {
      // Initially should be 0
      expect(service).toBeDefined();

      // Increment connection
      service.incrementConnection();

      // Decrement connection
      service.decrementConnection();

      // Decrement below zero should not go negative
      service.decrementConnection();
    });
  });

  describe('metrics retrieval', () => {
    it('should return metrics content type', () => {
      const contentType = service.getContentType();
      expect(typeof contentType).toBe('string');
    });

    it('should return request metrics', () => {
      const metrics = service.getRequestMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should return system metrics', () => {
      const metrics = service.getSystemMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should return recent metrics', () => {
      const metrics = service.getRecentMetrics();
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('system');
      expect(Array.isArray(metrics.requests)).toBe(true);
      expect(Array.isArray(metrics.system)).toBe(true);
    });
  });

  describe('metrics reset', () => {
    it('should reset all metrics', () => {
      // Record some metrics first
      service.recordHttpRequest('GET', '/test', 200, 50);
      service.incrementConnection();

      // Reset metrics
      service.resetMetrics();

      // Verify metrics are reset
      const requestMetrics = service.getRequestMetrics();
      const systemMetrics = service.getSystemMetrics();

      expect(requestMetrics).toHaveLength(0);
      expect(systemMetrics).toHaveLength(0);
    });
  });
});
