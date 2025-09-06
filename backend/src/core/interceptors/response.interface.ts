/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
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
