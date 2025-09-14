/**
 * Timezone utility functions for consistent handling between frontend and backend
 */

/**
 * Create a date range with buffer days to account for timezone differences
 * @param date - The reference date
 * @param bufferDays - Number of days to buffer on each side (default: 1)
 * @returns Object with startDate and endDate
 */
export function createDateRangeWithBuffer(date: Date, bufferDays: number = 1): { startDate: Date; endDate: Date } {
  // Start of week (Sunday)
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  startDate.setHours(0, 0, 0, 0);
  
  // End of week (Saturday)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  // Apply buffer
  startDate.setDate(startDate.getDate() - bufferDays);
  endDate.setDate(endDate.getDate() + bufferDays);
  
  return { startDate, endDate };
}

/**
 * Normalize a date to remove time component (set to 00:00:00)
 * @param date - The date to normalize
 * @returns Normalized date
 */
export function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}