import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

export interface RequestMetrics {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

export interface SystemMetrics {
  cpuUsage: NodeJS.CpuUsage;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  timestamp: Date;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);

  // Prometheus metrics
  private httpRequestDuration!: client.Histogram;
  private httpRequestTotal!: client.Counter;
  private httpErrorsTotal!: client.Counter;
  private activeConnections!: client.Gauge;
  private memoryUsage!: client.Gauge;
  private cpuUsage!: client.Gauge;

  // In-memory metrics storage for detailed analysis
  private readonly requestMetrics: RequestMetrics[] = [];
  private readonly systemMetrics: SystemMetrics[] = [];
  private connectionCount = 0;

  constructor() {
    // Initialize Prometheus metrics with singleton pattern
    this.initializeMetrics();
  }

  private initializeMetrics() {
    const register = client.register;

    // Check if metrics already exist, if so, use them
    try {
      this.httpRequestDuration =
        (register.getSingleMetric(
          'http_request_duration_seconds',
        ) as client.Histogram) ||
        new client.Histogram({
          name: 'http_request_duration_seconds',
          help: 'Duration of HTTP requests in seconds',
          labelNames: ['method', 'route', 'status_code'],
          buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
          registers: [register],
        });

      this.httpRequestTotal =
        (register.getSingleMetric('http_requests_total') as client.Counter) ||
        new client.Counter({
          name: 'http_requests_total',
          help: 'Total number of HTTP requests',
          labelNames: ['method', 'route', 'status_code'],
          registers: [register],
        });

      this.httpErrorsTotal =
        (register.getSingleMetric('http_errors_total') as client.Counter) ||
        new client.Counter({
          name: 'http_errors_total',
          help: 'Total number of HTTP errors',
          labelNames: ['method', 'route', 'status_code'],
          registers: [register],
        });

      this.activeConnections =
        (register.getSingleMetric('active_connections') as client.Gauge) ||
        new client.Gauge({
          name: 'active_connections',
          help: 'Number of active connections',
          registers: [register],
        });

      this.memoryUsage =
        (register.getSingleMetric('memory_usage_bytes') as client.Gauge) ||
        new client.Gauge({
          name: 'memory_usage_bytes',
          help: 'Memory usage in bytes',
          labelNames: ['type'], // heap_used, heap_total, rss, external
          registers: [register],
        });

      this.cpuUsage =
        (register.getSingleMetric('cpu_usage_percent') as client.Gauge) ||
        new client.Gauge({
          name: 'cpu_usage_percent',
          help: 'CPU usage percentage',
          registers: [register],
        });
    } catch (error) {
      this.logger.error('Error initializing metrics', error);
    }
  }

  onModuleInit() {
    // Register default metrics
    client.collectDefaultMetrics({
      prefix: 'eventide_',
      register: client.register,
    });

    // Start system metrics collection
    this.startSystemMetricsCollection();

    this.logger.log('Metrics service initialized');
  }

  private startSystemMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
  }

  private collectSystemMetrics() {
    try {
      const cpuUsage = process.cpuUsage();
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Update Prometheus metrics
      this.memoryUsage.set({ type: 'heap_used' }, memoryUsage.heapUsed);
      this.memoryUsage.set({ type: 'heap_total' }, memoryUsage.heapTotal);
      this.memoryUsage.set({ type: 'rss' }, memoryUsage.rss);
      this.memoryUsage.set({ type: 'external' }, memoryUsage.external);

      // Calculate CPU usage percentage (approximate)
      const cpuPercent = cpuUsage.user / 1000000; // Convert microseconds to percentage
      this.cpuUsage.set(cpuPercent);

      // Store in memory for detailed analysis
      this.systemMetrics.push({
        cpuUsage,
        memoryUsage,
        uptime,
        timestamp: new Date(),
      });

      // Keep only last 1000 records
      if (this.systemMetrics.length > 1000) {
        this.systemMetrics.shift();
      }
    } catch (error) {
      this.logger.error('Error collecting system metrics', error);
    }
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    try {
      // Record request metrics
      this.httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        duration / 1000, // Convert ms to seconds
      );

      this.httpRequestTotal.inc({ method, route, status_code: statusCode });

      // Record errors
      if (statusCode >= 400) {
        this.httpErrorsTotal.inc({ method, route, status_code: statusCode });
      }

      // Store in memory for detailed analysis
      this.requestMetrics.push({
        method,
        route,
        statusCode,
        duration,
        timestamp: new Date(),
      });

      // Keep only last 10000 records
      if (this.requestMetrics.length > 10000) {
        this.requestMetrics.shift();
      }
    } catch (error) {
      this.logger.error('Error recording HTTP request metrics', error);
    }
  }

  incrementConnection() {
    this.connectionCount++;
    this.activeConnections.set(this.connectionCount);
  }

  decrementConnection() {
    this.connectionCount = Math.max(0, this.connectionCount - 1);
    this.activeConnections.set(this.connectionCount);
  }

  getMetrics() {
    return client.register.metrics();
  }

  getContentType() {
    return client.register.contentType;
  }

  getRequestMetrics(limit = 100): RequestMetrics[] {
    return this.requestMetrics.slice(-limit);
  }

  getSystemMetrics(limit = 100): SystemMetrics[] {
    return this.systemMetrics.slice(-limit);
  }

  getRecentMetrics(minutes = 5): {
    requests: RequestMetrics[];
    system: SystemMetrics[];
  } {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    const recentRequests = this.requestMetrics.filter(
      (metric) => metric.timestamp >= cutoffTime,
    );

    const recentSystem = this.systemMetrics.filter(
      (metric) => metric.timestamp >= cutoffTime,
    );

    return {
      requests: recentRequests,
      system: recentSystem,
    };
  }

  resetMetrics() {
    this.requestMetrics.length = 0;
    this.systemMetrics.length = 0;
    this.connectionCount = 0;
    this.activeConnections.set(0);
  }
}
