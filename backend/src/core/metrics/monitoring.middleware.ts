import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MonitoringMiddleware.name);

  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Increment connection count
    this.metricsService.incrementConnection();

    const startTime = Date.now();
    const { method, originalUrl: url } = req;

    // Log request
    this.logger.log(`${method} ${url} - START`);

    // Capture response finish event
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // Decrement connection count
      this.metricsService.decrementConnection();

      // Record metrics
      this.metricsService.recordHttpRequest(method, url, statusCode, duration);

      // Log response
      this.logger.log(`${method} ${url} - ${statusCode} - ${duration}ms`);

      // Log slow requests (> 1 second)
      if (duration > 1000) {
        this.logger.warn(
          `Slow request: ${method} ${url} - ${statusCode} - ${duration}ms`,
        );
      }

      // Log high error rate requests
      if (statusCode >= 500) {
        this.logger.error(
          `Server error: ${method} ${url} - ${statusCode} - ${duration}ms`,
        );
      }
    });

    // Capture response close event (client disconnected)
    res.on('close', () => {
      this.metricsService.decrementConnection();
    });

    next();
  }
}
