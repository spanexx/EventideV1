// import { Controller, Get, UseGuards, Logger, Query } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { DeprecationService } from './deprecation.service';

// @ApiTags('deprecation')
// @Controller('admin/deprecation')
// @UseGuards(JwtAuthGuard)
// export class DeprecationController {
//   private readonly logger = new Logger(DeprecationController.name);

//   constructor(private readonly deprecationService: DeprecationService) {}

//   @Get('statistics')
//   @ApiOperation({ summary: 'Get deprecated endpoint usage statistics' })
//   @ApiResponse({ status: 200, description: 'Returns deprecation usage statistics' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden' })
//   getStatistics() {
//     this.logger.log('Admin requested deprecation statistics');
//     return this.deprecationService.getUsageStatistics();
//   }

//   @Get('high-usage')
//   @ApiOperation({ summary: 'Get high-usage deprecated endpoints' })
//   @ApiResponse({ status: 200, description: 'Returns high-usage deprecated endpoints' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden' })
//   getHighUsageEndpoints(@Query('minUsage') minUsage?: string) {
//     const minUsageNum = minUsage ? parseInt(minUsage, 10) : 50;
//     this.logger.log(`Admin requested high-usage deprecated endpoints (min: ${minUsageNum})`);
//     return this.deprecationService.getHighUsageEndpoints(minUsageNum);
//   }

//   @Get('unused')
//   @ApiOperation({ summary: 'Get unused deprecated endpoints' })
//   @ApiResponse({ status: 200, description: 'Returns unused deprecated endpoints' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden' })
//   getUnusedEndpoints(@Query('days') days?: string) {
//     const daysNum = days ? parseInt(days, 10) : 30;
//     this.logger.log(`Admin requested unused deprecated endpoints (days: ${daysNum})`);
//     return this.deprecationService.getUnusedEndpoints(daysNum);
//   }

//   @Get('report')
//   @ApiOperation({ summary: 'Generate comprehensive deprecation report' })
//   @ApiResponse({ status: 200, description: 'Returns comprehensive deprecation report' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden' })
//   getReport() {
//     this.logger.log('Admin requested comprehensive deprecation report');
//     return this.deprecationService.generateReport();
//   }

//   @Get('reset')
//   @ApiOperation({ summary: 'Reset deprecation usage statistics' })
//   @ApiResponse({ status: 200, description: 'Statistics reset successfully' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden' })
//   resetStatistics() {
//     this.logger.warn('Admin requested deprecation statistics reset');
//     this.deprecationService.resetStatistics();
//     return {
//       success: true,
//       message: 'Deprecation usage statistics have been reset',
//       timestamp: new Date().toISOString()
//     };
//   }
// }
