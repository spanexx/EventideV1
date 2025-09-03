// import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import { Reflector } from '@nestjs/core';
// import { DEPRECATED_ENDPOINT_KEY, DeprecationOptions, DeprecationLogger } from './deprecated.decorator';

// interface RequestWithUser extends Request {
//   user?: {
//     id: string;
//     email: string;
//     [key: string]: any;
//   };
// }

// @Injectable()
// export class DeprecationMiddleware implements NestMiddleware {
//   private readonly logger = new Logger(DeprecationMiddleware.name);

//   constructor(private reflector: Reflector) {}

//   use(req: RequestWithUser, res: Response, next: NextFunction): void {
//     // Store original res.end to intercept response
//     const originalEnd = res.end;
//     const self = this;

//     // Override res.end to add deprecation headers
//     res.end = function(this: Response, ...args: any[]) {
//       // Try to get route handler from the request
//       const route = (req as any).route;
//       const endpoint = `${req.method} ${route?.path || req.path}`;
      
//       // Check if this endpoint is deprecated via route handler metadata
//       // Note: This is a simplified approach since we don't have direct access to the handler here
//       // In a real implementation, you might need to store deprecation info differently
      
//       // For now, let's handle known deprecated endpoints based on the endpoint pattern
//       const deprecationInfo = self.getDeprecationInfo(endpoint, req.originalUrl);
      
//       if (deprecationInfo) {
//         // Add deprecation headers
//         res.setHeader('X-API-Deprecated', 'true');
//         res.setHeader('X-API-Deprecated-Version', deprecationInfo.version);
        
//         if (deprecationInfo.replacement) {
//           res.setHeader('X-API-Replacement', deprecationInfo.replacement);
//         }
        
//         if (deprecationInfo.sunsetDate) {
//           res.setHeader('X-API-Sunset-Date', deprecationInfo.sunsetDate);
//         }
        
//         if (deprecationInfo.documentation) {
//           res.setHeader('X-API-Documentation', deprecationInfo.documentation);
//         }

//         res.setHeader('X-API-Deprecation-Reason', deprecationInfo.reason || 'Endpoint is deprecated');

//         // Log usage
//         const userContext = {
//           id: req.user?.id || 'anonymous',
//           ip: req.ip || req.connection.remoteAddress,
//           userAgent: req.get('User-Agent')
//         };

//         DeprecationLogger.logUsage(endpoint, deprecationInfo, userContext);

//         // Add warning header as per RFC 7234
//         const warningMessage = `299 - "Deprecated API" "${deprecationInfo.replacement ? `Use ${deprecationInfo.replacement} instead` : 'This endpoint is deprecated'}"`;
//         res.setHeader('Warning', warningMessage);
//       }

//       // Call original end method and return its result
//       return originalEnd.apply(this, args as any);
//     };

//     next();
//   }

//   /**
//    * Get deprecation information for known deprecated endpoints
//    * This is a fallback method since we can't easily access decorator metadata in middleware
//    */
//   private getDeprecationInfo(endpoint: string, originalUrl: string): DeprecationOptions | null {
//     // Known deprecated endpoints - in a real implementation, this would be more dynamic
//     const deprecatedEndpoints: Record<string, DeprecationOptions> = {
//       // Booking controller deprecated endpoints
//       'GET /bookings/available/:providerId': {
//         version: '2.0',
//         replacement: 'POST /api/availability/query',
//         sunsetDate: '2024-12-31',
//         reason: 'Replaced by unified availability API',
//         documentation: 'https://docs.eventide.com/api/availability-migration'
//       },
//       'GET /bookings/availability/:providerId': {
//         version: '2.0',
//         replacement: 'GET /api/providers/:providerId/availability',
//         sunsetDate: '2024-12-31',
//         reason: 'Moved to dedicated availability module',
//         documentation: 'https://docs.eventide.com/api/availability-migration'
//       },
//       'POST /bookings/availability': {
//         version: '2.0',
//         replacement: 'POST /api/providers/:providerId/availability',
//         sunsetDate: '2024-12-31',
//         reason: 'Moved to dedicated availability module',
//         documentation: 'https://docs.eventide.com/api/availability-migration'
//       },
//       'PATCH /bookings/availability/:id': {
//         version: '2.0',
//         replacement: 'PUT /api/providers/:providerId/availability/:availabilityId',
//         sunsetDate: '2024-12-31',
//         reason: 'Moved to dedicated availability module',
//         documentation: 'https://docs.eventide.com/api/availability-migration'
//       },
//       'DELETE /bookings/availability/:id': {
//         version: '2.0',
//         replacement: 'DELETE /api/providers/:providerId/availability/:availabilityId',
//         sunsetDate: '2024-12-31',
//         reason: 'Moved to dedicated availability module',
//         documentation: 'https://docs.eventide.com/api/availability-migration'
//       },
//       // Public booking controller deprecated endpoints
//       'GET /public/slots/available': {
//         version: '2.0',
//         replacement: 'POST /api/availability/query',
//         sunsetDate: '2024-12-31',
//         reason: 'Replaced by unified availability API with better caching and performance',
//         documentation: 'https://docs.eventide.com/api/availability-migration'
//       }
//     };

//     // Try to match the endpoint pattern
//     for (const [pattern, info] of Object.entries(deprecatedEndpoints)) {
//       if (this.matchesPattern(endpoint, pattern, originalUrl)) {
//         return info;
//       }
//     }

//     return null;
//   }

//   /**
//    * Check if an endpoint matches a deprecation pattern
//    */
//   private matchesPattern(endpoint: string, pattern: string, originalUrl: string): boolean {
//     // Simple pattern matching - in a real implementation, this would be more sophisticated
//     const endpointParts = endpoint.split(' ');
//     const patternParts = pattern.split(' ');

//     if (endpointParts.length !== patternParts.length) {
//       return false;
//     }

//     const method = endpointParts[0];
//     const path = endpointParts[1];
//     const patternMethod = patternParts[0];
//     const patternPath = patternParts[1];

//     // Check method match
//     if (method !== patternMethod) {
//       return false;
//     }

//     // Check if the original URL matches the pattern (simple check)
//     if (patternPath.includes(':') && originalUrl) {
//       // Handle parameterized paths
//       const pathSegments = path.split('/');
//       const patternSegments = patternPath.split('/');
//       const urlSegments = originalUrl.split('/');

//       if (pathSegments.length !== patternSegments.length) {
//         return false;
//       }

//       for (let i = 0; i < patternSegments.length; i++) {
//         const patternSegment = patternSegments[i];
//         const urlSegment = urlSegments[i];

//         if (patternSegment.startsWith(':')) {
//           // Parameter segment - accept any value
//           continue;
//         } else if (patternSegment !== urlSegment) {
//           return false;
//         }
//       }

//       return true;
//     } else {
//       // Direct path match
//       return originalUrl.includes(path.replace(/:\w+/g, ''));
//     }
//   }
// }

// /**
//  * Injectable service to manage deprecation information
//  */
// @Injectable()
// export class DeprecationService {
//   private readonly logger = new Logger(DeprecationService.name);

//   /**
//    * Get usage statistics for all deprecated endpoints
//    */
//   getUsageStatistics() {
//     return DeprecationLogger.getUsageStats();
//   }

//   /**
//    * Get high-usage deprecated endpoints that need attention
//    */
//   getHighUsageEndpoints(minUsage: number = 50) {
//     return DeprecationLogger.getHighUsageEndpoints(minUsage);
//   }

//   /**
//    * Get unused endpoints that are candidates for removal
//    */
//   getUnusedEndpoints(daysSinceLastUse: number = 30) {
//     return DeprecationLogger.getUnusedEndpoints(daysSinceLastUse);
//   }

//   /**
//    * Reset usage statistics
//    */
//   resetStatistics() {
//     DeprecationLogger.resetStats();
//     this.logger.log('Deprecation usage statistics have been reset');
//   }

//   /**
//    * Generate deprecation report
//    */
//   generateReport() {
//     const stats = this.getUsageStatistics();
//     const highUsage = this.getHighUsageEndpoints();
//     const unused = this.getUnusedEndpoints();

//     return {
//       summary: {
//         totalDeprecatedEndpoints: Object.keys(stats).length,
//         highUsageEndpoints: highUsage.length,
//         unusedEndpoints: unused.length,
//         generatedAt: new Date().toISOString()
//       },
//       statistics: stats,
//       highUsageEndpoints: highUsage,
//       unusedEndpoints: unused,
//       recommendations: this.generateRecommendations(highUsage, unused)
//     };
//   }

//   /**
//    * Generate recommendations based on usage patterns
//    */
//   private generateRecommendations(highUsage: any[], unused: string[]) {
//     const recommendations: string[] = [];

//     if (highUsage.length > 0) {
//       recommendations.push(
//         `🚨 High Priority: ${highUsage.length} deprecated endpoints have high usage. Consider extending sunset dates or accelerating migration support.`
//       );
      
//       highUsage.slice(0, 3).forEach(endpoint => {
//         recommendations.push(
//           `⚠️  ${endpoint.endpoint}: ${endpoint.stats.count} requests from ${endpoint.stats.uniqueUsers} users - needs immediate attention`
//         );
//       });
//     }

//     if (unused.length > 0) {
//       recommendations.push(
//         `✅ Low Priority: ${unused.length} deprecated endpoints haven't been used recently and are candidates for removal.`
//       );
//     }

//     if (highUsage.length === 0 && unused.length === 0) {
//       recommendations.push(
//         '🎉 All deprecated endpoints have reasonable usage patterns. Continue monitoring for safe removal.'
//       );
//     }

//     return recommendations;
//   }
// }