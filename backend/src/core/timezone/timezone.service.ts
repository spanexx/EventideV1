import { Injectable, Logger } from '@nestjs/common';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

@Injectable()
export class TimezoneService {
  private readonly logger = new Logger(TimezoneService.name);
  private readonly DEFAULT_TIMEZONE = 'UTC';
  private readonly validTimezones = new Set([
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'America/Toronto',
    'America/Mexico_City',
    'Asia/Kolkata',
  ]);
  /**
   * Convert a date from a specific timezone to UTC
   * @param date - The date to convert
   * @param timezone - The timezone to convert from
   * @returns The date in UTC
   */
  convertToUTC(date: Date, timezone: string): Date {
    try {
      const safeTimezone = this.validateTimezone(timezone);
      return fromZonedTime(date, safeTimezone);
    } catch (error) {
      this.logger.warn(
        `Timezone conversion error (${timezone}): ${error instanceof Error ? error.message : String(error)}`,
      );
      // Fallback: treat as UTC if conversion fails
      return new Date(date.getTime());
    }
  }

  /**
   * Convert a date from UTC to a specific timezone
   * @param date - The UTC date to convert
   * @param timezone - The timezone to convert to
   * @returns The date in the specified timezone
   */
  convertFromUTC(date: Date, timezone: string): Date {
    try {
      const safeTimezone = this.validateTimezone(timezone);
      return toZonedTime(date, safeTimezone);
    } catch (error) {
      this.logger.warn(
        `Timezone conversion error (${timezone}): ${error instanceof Error ? error.message : String(error)}`,
      );
      // Fallback: return original date if conversion fails
      return new Date(date.getTime());
    }
  }

  /**
   * Format a date according to a specific timezone
   * @param date - The date to format
   * @param formatStr - The format string
   * @param timezone - The timezone to use for formatting
   * @returns The formatted date string
   */
  formatInTimezone(date: Date, formatStr: string, timezone: string): string {
    try {
      const safeTimezone = this.validateTimezone(timezone);
      const zonedDate = toZonedTime(date, safeTimezone);
      return format(zonedDate, formatStr);
    } catch (error) {
      this.logger.warn(
        `Timezone formatting error (${timezone}): ${error instanceof Error ? error.message : String(error)}`,
      );
      // Fallback: format in UTC
      const utcDate = toZonedTime(date, this.DEFAULT_TIMEZONE);
      return format(utcDate, formatStr);
    }
  }

  /**
   * Validate and sanitize timezone string
   * @param timezone - The timezone to validate
   * @returns A valid timezone string
   */
  private validateTimezone(timezone: string): string {
    if (!timezone || typeof timezone !== 'string') {
      this.logger.warn(
        `Invalid timezone provided: ${timezone}, using ${this.DEFAULT_TIMEZONE}`,
      );
      return this.DEFAULT_TIMEZONE;
    }

    const normalizedTimezone = timezone.trim();

    // Check if it's a recognized timezone
    if (this.validTimezones.has(normalizedTimezone)) {
      return normalizedTimezone;
    }

    // Try to validate with date-fns-tz by testing conversion
    try {
      const testDate = new Date();
      toZonedTime(testDate, normalizedTimezone);
      return normalizedTimezone;
    } catch (error) {
      this.logger.warn(
        `Invalid timezone '${normalizedTimezone}', using ${this.DEFAULT_TIMEZONE}`,
      );
      return this.DEFAULT_TIMEZONE;
    }
  }

  /**
   * Check if a timezone is valid
   * @param timezone - The timezone to check
   * @returns True if the timezone is valid
   */
  isValidTimezone(timezone: string): boolean {
    try {
      if (!timezone || typeof timezone !== 'string') {
        return false;
      }

      const testDate = new Date();
      toZonedTime(testDate, timezone.trim());
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get default timezone
   * @returns The default timezone (UTC)
   */
  getDefaultTimezone(): string {
    return this.DEFAULT_TIMEZONE;
  }
}
