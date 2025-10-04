import { Injectable } from '@angular/core';

export interface SmartCalendarLogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SmartCalendarLoggerService {
  private logs: SmartCalendarLogEntry[] = [];

  debug(source: string, message: string, data?: any): void {
    this.log('debug', source, message, data);
  }

  info(source: string, message: string, data?: any): void {
    this.log('info', source, message, data);
  }

  warn(source: string, message: string, data?: any): void {
    this.log('warn', source, message, data);
  }

  error(source: string, message: string, data?: any): void {
    this.log('error', source, message, data);
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', source: string, message: string, data?: any): void {
    const entry: SmartCalendarLogEntry = {
      timestamp: new Date(),
      level,
      source,
      message,
      data
    };

    this.logs.push(entry);
    
    // Also log to console for immediate visibility
    const logMessage = `[SmartCalendar][${level.toUpperCase()}][${source}] ${message}`;
    switch (level) {
      case 'debug':
        console.debug(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }

  getLogs(): SmartCalendarLogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: 'debug' | 'info' | 'warn' | 'error'): SmartCalendarLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsBySource(source: string): SmartCalendarLogEntry[] {
    return this.logs.filter(log => log.source === source);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}