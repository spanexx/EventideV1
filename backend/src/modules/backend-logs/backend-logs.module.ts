import { Module } from '@nestjs/common';
import { BackendLogsService } from './backend-logs.service';
import { LogManagerService } from '../../core/log-manager/log-manager.service';

@Module({
  providers: [BackendLogsService, LogManagerService],
  exports: [BackendLogsService],
})
export class BackendLogsModule {}
