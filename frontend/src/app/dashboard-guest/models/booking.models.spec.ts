import { BookingStatus } from './booking.models';

describe('BookingModels', () => {
  it('should have correct BookingStatus enum values', () => {
    expect(BookingStatus.PENDING).toBe('pending');
    expect(BookingStatus.CONFIRMED).toBe('confirmed');
    expect(BookingStatus.CANCELLED).toBe('cancelled');
    expect(BookingStatus.RESCHEDULED).toBe('rescheduled');
    expect(BookingStatus.COMPLETED).toBe('completed');
  });
});