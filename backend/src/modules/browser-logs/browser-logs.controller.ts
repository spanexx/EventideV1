import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BrowserLogsService } from './browser-logs.service';

@Controller('browser-logs')
export class BrowserLogsController {
  constructor(private readonly browserLogsService: BrowserLogsService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  log(@Body('log') log: string) {
    this.browserLogsService.log(log);
  }
}