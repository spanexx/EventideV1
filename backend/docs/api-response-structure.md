# Eventide API Response Structure

This document outlines the standardized response format used across all Eventide API endpoints.

## Standard Response Format

All API responses follow a consistent structure with the following properties:

```typescript
interface ApiResponse<T> {
  /**
   * Indicates if the request was successful
   */
  success: boolean;

  /**
   * The actual data payload returned by the endpoint
   */
  data: T;

  /**
   * Optional human-readable message
   */
  message?: string;

  /**
   * Optional error details when success is false
   */
  error?: {
    /**
     * Error code for programmatic handling
     */
    code: string;

    /**
     * Human-readable error message
     */
    message: string;

    /**
     * Optional additional error details
     */
    details?: any;
  };

  /**
   * Optional metadata about the response
   */
  meta?: {
    /**
     * Timestamp of when the response was generated
     */
    timestamp: string;

    /**
     * HTTP status code
     */
    statusCode: number;

    /**
     * Optional pagination metadata for list endpoints
     */
    pagination?: {
      /**
       * Current page number
       */
      page: number;

      /**
       * Number of items per page
       */
      limit: number;

      /**
       * Total number of items
       */
      total: number;

      /**
       * Total number of pages
       */
      totalPages: number;
    };
  };
}
```

## Success Responses

For successful requests, the API will return a response with `success: true` and the requested data in the `data` field.

### Example Success Response

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "message": "User retrieved successfully",
  "meta": {
    "timestamp": "2023-01-01T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Example Success Response with Pagination

For paginated endpoints, the response will include pagination metadata:

```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    {
      "id": "user_456",
      "name": "Jane Smith",
      "email": "jane.smith@example.com"
    }
  ],
  "message": "Users retrieved successfully",
  "meta": {
    "timestamp": "2023-01-01T12:00:00.000Z",
    "statusCode": 200,
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

## Error Responses

When an error occurs, the API will return a response with `success: false` and details about the error in the `error` field.

### Example Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Bad Request",
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Invalid email address"
    }
  },
  "meta": {
    "timestamp": "2023-01-01T12:00:00.000Z",
    "statusCode": 400
  }
}
```

## HTTP Status Codes

The API uses standard HTTP status codes to indicate the result of requests:

- `200`: OK - Request successful
- `201`: Created - Resource created successfully
- `204`: No Content - Request successful, no content returned
- `400`: Bad Request - Invalid request data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Access denied
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource conflict
- `422`: Unprocessable Entity - Validation failed
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Unexpected server error
- `503`: Service Unavailable - Service temporarily unavailable

## Implementation Details

The response structure is implemented using:
1. `ResponseInterceptor` - Standardizes successful responses
2. `GlobalExceptionFilter` - Standardizes error responses
3. `ApiResponse<T>` interface - Defines the response structure

All controllers automatically use these components to ensure consistent response formatting across the API.