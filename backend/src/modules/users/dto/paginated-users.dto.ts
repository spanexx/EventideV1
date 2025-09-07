import { User } from '../user.schema';

export interface PaginatedUsersDto {
  /**
   * Array of user objects
   */
  results: User[];

  /**
   * Pagination metadata
   */
  pagination: {
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
}
