import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interceptor that bypasses the global response interceptor for endpoints that should return raw data
 */
@Injectable()
export class RawDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // For endpoints that should return raw data, we bypass the global response interceptor
    // by directly returning the data without wrapping it
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    // Check if this is a request to the metrics endpoint
    if (request.path === '/metrics' && request.method === 'GET') {
      // Set the correct content type for Prometheus metrics
      response.set('Content-Type', 'text/plain; version=0.0.4');
      // Return the raw data without wrapping it
      return next.handle();
    }

    // For all other endpoints, let the global interceptor handle it
    return next.handle();
  }
}
