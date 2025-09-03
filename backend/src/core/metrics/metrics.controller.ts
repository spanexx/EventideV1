import {
  Controller,
  Get,
  Header,
  Query,
  InternalServerErrorException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { RawDataInterceptor } from '../interceptors/raw-data.interceptor';

@ApiTags('System')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @UseInterceptors(RawDataInterceptor)
  @Header('Content-Type', 'text/plain; version=0.0.4')
  @ApiOperation({
    summary: 'Prometheus metrics endpoint',
    description: 'Exposes application metrics in Prometheus format',
  })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics',
    headers: {
      'Content-Type': {
        description: 'text/plain; version=0.0.4',
        schema: { type: 'string' },
      },
    },
  })
  async getMetrics(): Promise<string> {
    try {
      return this.metricsService.getMetrics();
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Failed to collect metrics',
        error.message ?? 'Unknown error occurred',
      );
    }
  }

  @Get('requests')
  @ApiOperation({
    summary: 'Get recent request metrics',
    description: 'Returns detailed information about recent HTTP requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Request metrics',
  })
  getRecentRequests(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const requests = this.metricsService.getRequestMetrics(limitNum);
    return {
      requests,
      count: requests.length,
    };
  }

  @Get('system')
  @ApiOperation({
    summary: 'Get recent system metrics',
    description: 'Returns detailed information about system resource usage',
  })
  @ApiResponse({
    status: 200,
    description: 'System metrics',
  })
  getRecentSystemMetrics(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const system = this.metricsService.getSystemMetrics(limitNum);
    return {
      system,
      count: system.length,
    };
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recent metrics',
    description:
      'Returns both request and system metrics for the last 5 minutes',
  })
  @ApiResponse({
    status: 200,
    description: 'Combined recent metrics',
  })
  getRecentMetrics(@Query('minutes') minutes?: string) {
    const minutesNum = minutes ? parseInt(minutes, 10) : 5;
    return this.metricsService.getRecentMetrics(minutesNum);
  }
}
