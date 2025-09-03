import { format, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Converts a date string to a Date object in the specified timezone
 * @param dateString - The date string to convert
 * @param timezone - The timezone to use for conversion
 * @returns The Date object
 */
export function convertDateStringToTimezone(
  dateString: string,
  timezone: string,
): Date {
  const date = parseISO(dateString);
  return toZonedTime(date, timezone);
}

/**
 * Converts a Date object to a string in the specified timezone
 * @param date - The Date object to convert
 * @param timezone - The timezone to use for conversion
 * @param formatStr - The format string (optional, defaults to 'yyyy-MM-dd HH:mm:ss')
 * @returns The formatted date string
 */
export function convertDateToTimezoneString(
  date: Date,
  timezone: string,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss',
): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, formatStr);
}

/**
 * Converts a date from one timezone to another
 * @param date - The date to convert
 * @param fromTimezone - The source timezone
 * @param toTimezone - The target timezone
 * @returns The date in the target timezone
 */
export function convertBetweenTimezones(
  date: Date,
  fromTimezone: string,
  toTimezone: string,
): Date {
  const utcDate = fromZonedTime(date, fromTimezone);
  return toZonedTime(utcDate, toTimezone);
}
