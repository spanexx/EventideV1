import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiResponse } from '../interceptors/response.interface';

/**
 * Global exception filter to standardize error response format
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapter: any) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // Use the provided httpAdapter directly
    const httpAdapter = this.httpAdapter;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the error for debugging
    this.logger.error(
      `Error occurred: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Prepare standardized error response
    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
      error: {
        code: this.getErrorCode(httpStatus),
        message:
          exception instanceof HttpException
            ? exception.message
            : 'Internal server error',
        details:
          exception instanceof HttpException
            ? exception.getResponse()
            : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: httpStatus,
      },
    };

    // Send the standardized error response
    httpAdapter.reply(response, errorResponse, httpStatus);
  }

  /**
   * Get error code based on HTTP status
   * @param status HTTP status code
   * @returns Error code string
   */
  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_ERROR';
      case HttpStatus.NOT_IMPLEMENTED:
        return 'NOT_IMPLEMENTED';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}
