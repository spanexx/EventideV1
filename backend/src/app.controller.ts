import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection as MongoConnection, ConnectionStates } from 'mongoose';
import { MetricsService } from './core/metrics/metrics.service';

@Controller()
@ApiTags('System')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly mongoConnection: MongoConnection,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable - Database connection issues',
  })
  async healthCheck(): Promise<{
    status: string;
    details: Record<string, unknown>;
    metrics?: {
      uptime: number;
      memory: NodeJS.MemoryUsage;
      cpu: NodeJS.CpuUsage;
      activeConnections: number;
    };
  }> {
    try {
      // Check MongoDB connection by attempting a ping
      const isMongoConnected =
        this.mongoConnection.readyState === ConnectionStates.connected;

      if (this.mongoConnection.db) {
        await this.mongoConnection.db.admin().ping();
      } else {
        throw new Error('MongoDB connection not initialized');
      }

      // Get recent metrics for health overview
      const recentMetrics = this.metricsService.getRecentMetrics(1); // Last 1 minute
      const requestCount = recentMetrics.requests.length;
      const errorCount = recentMetrics.requests.filter(
        (r) => r.statusCode >= 500,
      ).length;
      const avgResponseTime =
        requestCount > 0
          ? recentMetrics.requests.reduce((sum, r) => sum + r.duration, 0) /
            requestCount
          : 0;

      return {
        status: 'ok',
        details: {
          mongodb: isMongoConnected ? 'connected' : 'disconnected',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString(),
          requestMetrics: {
            totalRequests: requestCount,
            errorCount,
            avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
          },
        },
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          activeConnections: recentMetrics.requests.filter(
            (r) => r.statusCode < 400,
          ).length,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableException(errorMessage);
    }
  }

  @Get('health/details')
  @ApiOperation({ summary: 'Detailed health check endpoint' })
  @ApiResponse({ status: 200, description: 'Detailed application health' })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable - System issues detected',
  })
  async detailedHealthCheck(): Promise<any> {
    try {
      // Basic health checks
      const isMongoConnected =
        this.mongoConnection.readyState === ConnectionStates.connected;

      if (this.mongoConnection.db) {
        await this.mongoConnection.db.admin().ping();
      }

      // System metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();

      // Application metrics
      const recentMetrics = this.metricsService.getRecentMetrics(5); // Last 5 minutes
      const requestCount = recentMetrics.requests.length;
      const errorCount = recentMetrics.requests.filter(
        (r) => r.statusCode >= 500,
      ).length;

      // Calculate performance indicators
      const avgResponseTime =
        requestCount > 0
          ? recentMetrics.requests.reduce((sum, r) => sum + r.duration, 0) /
            requestCount
          : 0;

      const requestsPerMinute = requestCount / 5; // Since we're looking at 5 minutes

      // Check for potential issues
      const memoryUsagePercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      const isHighMemoryUsage = memoryUsagePercent > 80;

      const isHighErrorRate = errorCount > requestCount * 0.05; // More than 5% errors
      const isSlowResponseTime = avgResponseTime > 1000; // More than 1 second avg

      const status =
        isHighMemoryUsage || isHighErrorRate || isSlowResponseTime
          ? 'warning'
          : 'ok';

      return {
        status,
        timestamp: new Date().toISOString(),
        system: {
          uptime,
          memory: {
            usage: memoryUsage,
            percent: memoryUsagePercent.toFixed(2) + '%',
            isHigh: isHighMemoryUsage,
          },
          cpu: cpuUsage,
        },
        application: {
          mongodb: {
            status: isMongoConnected ? 'connected' : 'disconnected',
          },
          performance: {
            requestsPerMinute: requestsPerMinute.toFixed(2),
            totalRequests: requestCount,
            errorCount,
            errorRate:
              ((errorCount / Math.max(requestCount, 1)) * 100).toFixed(2) + '%',
            isHighErrorRate,
            avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
            isSlowResponseTime,
          },
        },
        recommendations: this.getRecommendations(
          isHighMemoryUsage,
          isHighErrorRate,
          isSlowResponseTime,
        ),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableException(errorMessage);
    }
  }

  private getRecommendations(
    isHighMemoryUsage: boolean,
    isHighErrorRate: boolean,
    isSlowResponseTime: boolean,
  ): string[] {
    const recommendations: string[] = [];

    if (isHighMemoryUsage) {
      recommendations.push(
        'High memory usage detected. Consider increasing memory allocation or investigating memory leaks.',
      );
    }

    if (isHighErrorRate) {
      recommendations.push(
        'High error rate detected. Check application logs for error details.',
      );
    }

    if (isSlowResponseTime) {
      recommendations.push(
        'Slow response times detected. Consider scaling up resources or optimizing database queries.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating normally.');
    }

    return recommendations;
  }
}
