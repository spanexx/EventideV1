import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class SerialKeyService {
  /**
   * Generate a unique booking serial key
   * Format: EVT-YYYYMMDD-XXXXX (e.g., EVT-20251004-A7B9C)
   */
  generateBookingSerialKey(date: Date = new Date()): string {
    const prefix = 'EVT';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${dateStr}-${randomStr}`;
  }

  /**
   * Validate a booking serial key format
   */
  isValidSerialKey(key: string): boolean {
    const regex = /^EVT-\d{8}-[0-9A-F]{6}$/;
    return regex.test(key);
  }
}
