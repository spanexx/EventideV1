// import { applyDecorators, SetMetadata, Logger } from '@nestjs/common';
// import { ApiHeader, ApiResponse } from '@nestjs/swagger';
// import { FeatureFlag } from '../../modules/feature-flags/decorators/feature-flag.decorator';

// export const DEPRECATED_ENDPOINT_KEY = 'deprecated_endpoint';

// export interface DeprecationOptions {
//   version: string;
//   replacement?: string;
//   sunsetDate?: string;
//   reason?: string;
//   documentation?: string;
// }

// /**
//  * Marks an endpoint as deprecated with appropriate headers and documentation
//  * 
//  * @param options Deprecation configuration options
//  * 
//  * @example
//  * ```typescript
//  * @Deprecated({
//  *   version: '2.0',
//  *   replacement: 'POST /api/availability/query',
//  *   sunsetDate: '2024-12-31',
//  *   reason: 'Replaced by unified availability API',
//  *   documentation: 'https://docs.eventide.com/api-migration'
//  * })
//  * @Get('available/:providerId')
//  * async getAvailableSlots() {
//  *   // Legacy implementation
//  * }
//  * ```
//  */
// export const Deprecated = (options: DeprecationOptions) => {
//   const decorators = [
//     // Set metadata for middleware to detect deprecated endpoints
//     SetMetadata(DEPRECATED_ENDPOINT_KEY, options),
    
//     // Protect with feature flag to control deprecation rollout
//     FeatureFlag('legacy_api_deprecation'),
    
//     // Add Swagger documentation
//     ApiHeader({
//       name: 'X-API-Deprecated',
//       description: 'Indicates this endpoint is deprecated',
//       required: false,
//     }),
    
//     ApiHeader({
//       name: 'X-API-Deprecated-Version',
//       description: 'Version when this endpoint was deprecated',
//       required: false,
//     }),
    
//     ApiResponse({
//       status: 200,
//       description: `⚠️ **DEPRECATED**: This endpoint is deprecated as of version ${options.version}. ${options.replacement ? `Use ${options.replacement} instead.` : ''} ${options.sunsetDate ? `This endpoint will be removed on ${options.sunsetDate}.` : ''}`,
//       headers: {
//         'X-API-Deprecated': {
//           description: 'Always true for deprecated endpoints',
//           schema: { type: 'boolean', example: true }
//         },
//         'X-API-Deprecated-Version': {
//           description: 'Version when endpoint was deprecated',
//           schema: { type: 'string', example: options.version }
//         },
//         'X-API-Replacement': {
//           description: 'Recommended replacement endpoint',
//           schema: { type: 'string', example: options.replacement || 'N/A' }
//         },
//         'X-API-Sunset-Date': {
//           description: 'Date when endpoint will be removed',
//           schema: { type: 'string', example: options.sunsetDate || 'TBD' }
//         },
//         'X-API-Documentation': {
//           description: 'Link to migration documentation',
//           schema: { type: 'string', example: options.documentation || 'N/A' }
//         }
//       }
//     })
//   ];

//   return applyDecorators(...decorators);
// };

// /**
//  * Logs usage of deprecated endpoints for monitoring and analytics
//  */
// export class DeprecationLogger {
//   private static readonly logger = new Logger('DeprecatedEndpoint');
//   private static usageStats = new Map<string, { count: number, lastUsed: Date, users: Set<string> }>();

//   static logUsage(endpoint: string, options: DeprecationOptions, userContext?: any) {
//     const key = `${endpoint}_v${options.version}`;
    
//     // Update usage statistics
//     if (!this.usageStats.has(key)) {
//       this.usageStats.set(key, { count: 0, lastUsed: new Date(), users: new Set() });
//     }
    
//     const stats = this.usageStats.get(key)!;
//     stats.count++;
//     stats.lastUsed = new Date();
    
//     if (userContext?.id) {
//       stats.users.add(userContext.id);
//     }

//     // Log deprecation warning
//     this.logger.warn(
//       `DEPRECATED ENDPOINT USED: ${endpoint} | ` +
//       `Version: ${options.version} | ` +
//       `Replacement: ${options.replacement || 'N/A'} | ` +
//       `Usage Count: ${stats.count} | ` +
//       `Unique Users: ${stats.users.size} | ` +
//       `User: ${userContext?.id || 'anonymous'} | ` +
//       `IP: ${userContext?.ip || 'unknown'} | ` +
//       `User-Agent: ${userContext?.userAgent || 'unknown'}`
//     );

//     // Log additional context if available
//     if (options.sunsetDate) {
//       this.logger.warn(`⚠️  Sunset Date: ${options.sunsetDate} - Please migrate soon!`);
//     }

//     if (options.documentation) {
//       this.logger.warn(`📖 Migration Guide: ${options.documentation}`);
//     }
//   }

//   static getUsageStats() {
//     const stats: any = {};
//     this.usageStats.forEach((value, key) => {
//       stats[key] = {
//         count: value.count,
//         lastUsed: value.lastUsed,
//         uniqueUsers: value.users.size
//       };
//     });
//     return stats;
//   }

//   static resetStats() {
//     this.usageStats.clear();
//     this.logger.log('Deprecation usage statistics reset');
//   }

//   /**
//    * Get endpoints that haven't been used in a while (candidates for removal)
//    */
//   static getUnusedEndpoints(daysSinceLastUse: number = 30): string[] {
//     const cutoffDate = new Date();
//     cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastUse);
    
//     const unused: string[] = [];
//     this.usageStats.forEach((value, key) => {
//       if (value.lastUsed < cutoffDate) {
//         unused.push(key);
//       }
//     });
    
//     return unused;
//   }

//   /**
//    * Get high-usage deprecated endpoints that need priority attention
//    */
//   static getHighUsageEndpoints(minUsageCount: number = 100): Array<{ endpoint: string, stats: any }> {
//     const highUsage: Array<{ endpoint: string, stats: any }> = [];
    
//     this.usageStats.forEach((value, key) => {
//       if (value.count >= minUsageCount) {
//         highUsage.push({
//           endpoint: key,
//           stats: {
//             count: value.count,
//             lastUsed: value.lastUsed,
//             uniqueUsers: value.users.size
//           }
//         });
//       }
//     });
    
//     // Sort by usage count descending
//     return highUsage.sort((a, b) => b.stats.count - a.stats.count);
//   }
// }

// /**
//  * Shorthand decorator for endpoints being replaced by unified API
//  */
// export const DeprecatedByUnifiedAPI = (originalEndpoint: string, sunsetDate?: string) => {
//   return Deprecated({
//     version: '2.0',
//     replacement: 'POST /api/availability/query',
//     sunsetDate: sunsetDate || '2024-12-31',
//     reason: 'Replaced by unified availability API for better performance and consistency',
//     documentation: 'https://docs.eventide.com/api/availability-migration'
//   });
// };

// /**
//  * Shorthand decorator for booking-related endpoints being moved
//  */
// export const DeprecatedBookingEndpoint = (replacement: string, sunsetDate?: string) => {
//   return Deprecated({
//     version: '2.0',
//     replacement,
//     sunsetDate: sunsetDate || '2024-12-31',
//     reason: 'Moved to dedicated availability module for better organization',
//     documentation: 'https://docs.eventide.com/api/booking-migration'
//   });
// };