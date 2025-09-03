// import { Injectable, Logger } from '@nestjs/common';
// import { DeprecationLogger } from './deprecated.decorator';

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
//    * Generate a comprehensive deprecation report
//    */
//   generateReport() {
//     const stats = this.getUsageStatistics();
//     const highUsage = this.getHighUsageEndpoints(50);
//     const unused = this.getUnusedEndpoints(30);

//     return {
//       summary: {
//         totalDeprecatedEndpoints: Object.keys(stats).length,
//         highUsageEndpoints: highUsage.length,
//         unusedEndpoints: unused.length,
//         reportGeneratedAt: new Date().toISOString()
//       },
//       statistics: stats,
//       highUsageEndpoints: highUsage,
//       unusedEndpoints: unused
//     };
//   }

//   /**
//    * Reset deprecation statistics
//    */
//   resetStatistics() {
//     DeprecationLogger.resetStats();
//   }
// }