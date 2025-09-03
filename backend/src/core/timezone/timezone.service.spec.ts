import { Test, TestingModule } from '@nestjs/testing';
import { TimezoneService } from './timezone.service';

describe('TimezoneService', () => {
  let service: TimezoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimezoneService],
    }).compile();

    service = module.get<TimezoneService>(TimezoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should convert date to UTC', () => {
    const date = new Date('2023-01-01T12:00:00');
    const timezone = 'America/New_York';
    const utcDate = service.convertToUTC(date, timezone);

    // The UTC time for 12:00 PM EST is 17:00 UTC
    expect(utcDate.getUTCHours()).toBe(17);
  });

  it('should convert date from UTC', () => {
    const utcDate = new Date('2023-01-01T17:00:00Z');
    const timezone = 'America/New_York';
    const zonedDate = service.convertFromUTC(utcDate, timezone);

    // The local time for 17:00 UTC in EST is 12:00 PM
    expect(zonedDate.getHours()).toBe(12);
  });

  it('should format date in timezone', () => {
    const utcDate = new Date('2023-01-01T17:00:00Z');
    const timezone = 'America/New_York';
    const formattedDate = service.formatInTimezone(
      utcDate,
      'yyyy-MM-dd HH:mm:ss',
      timezone,
    );

    // The formatted date should be 2023-01-01 12:00:00
    expect(formattedDate).toBe('2023-01-01 12:00:00');
  });
});
