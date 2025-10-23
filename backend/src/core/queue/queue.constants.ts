export enum QueueNames {
  BOOKING = 'booking',
  AVAILABILITY = 'availability',
}

export const JobNames = {
  // Booking
  AUTO_COMPLETE_BOOKING: 'auto-complete-booking',

  // Availability
  EXTEND_RECURRING: 'extend-recurring',
  CLEANUP_PAST: 'cleanup-past',
} as const;

export type JobName = typeof JobNames[keyof typeof JobNames];
