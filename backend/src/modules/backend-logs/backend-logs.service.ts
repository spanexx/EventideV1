import { Injectable, OnModuleInit, LoggerService as NestLoggerService } from '@nestjs/common';
import { LogManagerService } from '../../core/log-manager/log-manager.service';
import * as path from 'path';

const LOG_DIR = path.join(__dirname, '..', '..', '..', 'backend-logs');
const CURRENT_LOG_FILE = 'current.log';

@Injectable()
export class BackendLogsService implements NestLoggerService, OnModuleInit {
  constructor(private logManager: LogManagerService) {}

  async onModuleInit() {
    await this.logManager.initializeLogFile(LOG_DIR, CURRENT_LOG_FILE);
  }

  log(message: string, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logManager.log(LOG_DIR, CURRENT_LOG_FILE, `[LOG] ${logMessage}`);
  }

  error(message: string, trace?: string, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logManager.log(LOG_DIR, CURRENT_LOG_FILE, `[ERROR] ${logMessage}\nTrace: ${trace}`);
  }

  warn(message: string, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logManager.log(LOG_DIR, CURRENT_LOG_FILE, `[WARN] ${logMessage}`);
  }

  debug?(message: string, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logManager.log(LOG_DIR, CURRENT_LOG_FILE, `[DEBUG] ${logMessage}`);
  }

  verbose?(message: string, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logManager.log(LOG_DIR, CURRENT_LOG_FILE, `[VERBOSE] ${logMessage}`);
  }
}