import { Injectable, OnModuleInit } from '@nestjs/common';
import { LogManagerService } from '../../core/log-manager/log-manager.service';
import * as path from 'path';

const LOG_DIR = path.join(__dirname, '..', '..', '..', 'browser-logs');
const CURRENT_LOG_FILE = 'current.log';

@Injectable()
export class BrowserLogsService implements OnModuleInit {
  constructor(private logManager: LogManagerService) {}

  async onModuleInit() {
    await this.logManager.initializeLogFile(LOG_DIR, CURRENT_LOG_FILE);
  }

  async log(message: string) {
    await this.logManager.log(LOG_DIR, CURRENT_LOG_FILE, message);
  }
}
