import { Module } from '@nestjs/common';
import { BrowserLogsController } from './browser-logs.controller';
import { BrowserLogsService } from './browser-logs.service';
import { LogManagerService } from '../../core/log-manager/log-manager.service';

@Module({
  controllers: [BrowserLogsController],
  providers: [BrowserLogsService, LogManagerService]
})
export class BrowserLogsModule {}
