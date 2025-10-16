/**
 * Timezone utility functions for consistent handling between frontend and backend
 */

/**
 * Create a date range with buffer days to account for timezone differences
 * FIXED: Extended range to cover multiple weeks for recurring bookings
 * @param date - The reference date
 * @param bufferDays - Number of days to buffer on each side (default: 1)
 * @returns Object with startDate and endDate
 */
export function createDateRangeWithBuffer(date: Date, bufferDays: number = 1): { startDate: Date; endDate: Date } {
  // Start of month (1st day)
  const startDate = new Date(date);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  
  // End of month (last day) + 2 weeks buffer for recurring bookings
  const endDate = new Date(date);
  endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of current month
  endDate.setDate(endDate.getDate() + 14); // Add 2 weeks buffer
  endDate.setHours(23, 59, 59, 999);
  
  // Apply additional buffer if specified
  if (bufferDays > 0) {
    startDate.setDate(startDate.getDate() - bufferDays);
    endDate.setDate(endDate.getDate() + bufferDays);
  }
  
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