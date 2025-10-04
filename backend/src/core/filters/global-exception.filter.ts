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
    const aiErrorCode = this.getAIErrorCode(exception);
    const errorCode = aiErrorCode || this.getErrorCode(httpStatus);
    
    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error',
      error: {
        code: errorCode,
        message:
          exception instanceof HttpException
            ? exception.message
            : 'Internal server error',
        details:
          exception instanceof HttpException
            ? exception.getResponse()
            : undefined,
        ...(aiErrorCode && { aiService: true }), // Flag AI-related errors
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
      // AI-specific error codes
      case HttpStatus.REQUEST_TIMEOUT:
        return 'AI_SERVICE_TIMEOUT';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'AI_PROMPT_TOO_LARGE';
      case HttpStatus.BAD_GATEWAY:
        return 'AI_SERVICE_UNAVAILABLE';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'AI_RESPONSE_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Get AI-specific error code based on error message patterns
   * @param exception The exception that occurred
   * @returns AI-specific error code if applicable, null otherwise
   */
  private getAIErrorCode(exception: unknown): string | null {
    if (!(exception instanceof Error)) {
      return null;
    }

    const message = exception.message.toLowerCase();
    
    // AI service connection errors
    if (message.includes('gemini api') || message.includes('ai service')) {
      if (message.includes('timeout')) {
        return 'AI_SERVICE_TIMEOUT';
      }
      if (message.includes('quota') || message.includes('limit')) {
        return 'AI_QUOTA_EXCEEDED';
      }
      if (message.includes('invalid') || message.includes('parse')) {
        return 'AI_INVALID_RESPONSE';
      }
      if (message.includes('unauthorized') || message.includes('api key')) {
        return 'AI_AUTHENTICATION_FAILED';
      }
      return 'AI_SERVICE_ERROR';
    }

    // AI validation errors
    if (message.includes('validation') && message.includes('ai')) {
      return 'AI_VALIDATION_FAILED';
    }

    // AI analysis errors
    if (message.includes('analysis') && message.includes('failed')) {
      return 'AI_ANALYSIS_FAILED';
    }

    return null;
  }
}
