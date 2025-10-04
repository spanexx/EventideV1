import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

type LogLevel = 'log' | 'error' | 'warn' | 'info';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private http = inject(HttpClient);
  private readonly backendUrl = `${environment.apiUrl}/browser-logs`;

  private originalConsole: Record<LogLevel, (...args: any[]) => void> = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
  };

  constructor() {}

  public init(): Promise<void> {
    this.overrideConsole();
    return Promise.resolve();
  }

  private overrideConsole(): void {
    (Object.keys(this.originalConsole) as LogLevel[]).forEach(level => {
      console[level] = this.log.bind(this, level);
    });
  }

  private log(level: LogLevel, ...args: any[]): void {
    // Also call the original console method
    this.originalConsole[level](...args);

    const message = args.map(arg => this.stringify(arg)).join(' ');
    const logEntry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;

    this.http.post(this.backendUrl, { log: logEntry }).subscribe({
      error: (err) => {
        this.originalConsole.error('Failed to send log to backend:', err);
      }
    });
  }

  private stringify(arg: any): string {
    if (typeof arg === 'string') {
      return arg;
    }
    if (arg instanceof Error) {
      return arg.stack || arg.message;
    }
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      return 'Un-stringifiable object';
    }
  }
}
