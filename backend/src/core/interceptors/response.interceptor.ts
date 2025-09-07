import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from './response.interface';
import { instanceToPlain, classToPlain } from 'class-transformer';

/**
 * Global interceptor to standardize API response format
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const now = Date.now();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // Check if response contains paginated data
        const isPaginated =
          data &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          'results' in data &&
          Array.isArray(data.results) &&
          'pagination' in data &&
          data.pagination !== null &&
          typeof data.pagination === 'object';

        return {
          success: true,
          data: isPaginated
            ? this.serializeData(data.results)
            : data
              ? this.serializeData(data)
              : null,
          message: this.getDefaultMessage(statusCode),
          meta: {
            timestamp: new Date().toISOString(),
            statusCode,
            ...(isPaginated ? { pagination: data.pagination } : {}),
          },
        };
      }),
    );
  }

  /**
   * Serialize data if it's a class instance with Expose decorators
   * @param data The data to serialize
   * @returns Serialized data or original data if not a class instance
   */
  private serializeData(data: any): any {
    try {
      // If data is an array, serialize each item
      if (Array.isArray(data)) {
        return data.map((item) => this.serializeItem(item));
      }

      // If data is a single object, serialize it
      return this.serializeItem(data);
    } catch (error) {
      // If serialization fails, return the original data
      console.error('Serialization error:', error);
      return data;
    }
  }

  /**
   * Serialize a single item
   * @param item The item to serialize
   * @returns Serialized item or original item if serialization fails
   */
  private serializeItem(item: any): any {
    // If item is null or undefined, return as is
    if (item === null || item === undefined) {
      return item;
    }

    // If item is a Mongoose document, convert to object first
    if (
      item &&
      typeof item === 'object' &&
      typeof item.toObject === 'function'
    ) {
      item = item.toObject({ getters: true, virtuals: true });
    }

    // If item is a plain object, return as is
    if (item && typeof item === 'object' && item.constructor === Object) {
      return item;
    }

    // If item is a class instance with metadata, serialize it
    if (
      item &&
      typeof item === 'object' &&
      item.constructor &&
      item.constructor.name !== 'Object'
    ) {
      try {
        // Use class-transformer to convert class instance to plain object
        return instanceToPlain(item);
      } catch (error) {
        // If class-transformer fails, return the item as is
        console.error('Class-transformer error:', error);
        return item;
      }
    }

    // For primitive types or other cases, return as is
    return item;
  }

  /**
   * Get default message based on status code
   * @param statusCode HTTP status code
   * @returns Default message for the status code
   */
  private getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case 200:
        return 'Request successful';
      case 201:
        return 'Resource created successfully';
      case 204:
        return 'Request successful (no content)';
      default:
        return 'Request successful';
    }
  }
}
