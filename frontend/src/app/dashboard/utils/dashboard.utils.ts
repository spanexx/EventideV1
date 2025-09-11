/**
 * Utility functions for the dashboard module
 */

/**
 * Calculate the duration between two dates in minutes
 * @param start Start date
 * @param end End date
 * @returns Duration in minutes
 */
export function calculateDurationInMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Get the start of the week for a given date (Sunday)
 * @param date The date to get the start of the week for
 * @returns The start of the week
 */
export function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

/**
 * Get the end of the week for a given date (Saturday)
 * @param date The date to get the end of the week for
 * @returns The end of the week
 */
export function getEndOfWeek(date: Date): Date {
  const end = getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  return end;
}

/**
 * Add days to a date
 * @param date The date to add days to
 * @param days The number of days to add
 * @returns The new date
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * Format a date as YYYY-MM-DD
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDateAsYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}