export interface ScheduleConstraints {
  minSlotDuration?: number;
  maxSlotDuration?: number;
  bufferTime?: number;
  maxSlotsPerDay?: number;
  preferredTimes?: string[];
  blackoutTimes?: string[];
  workingDays?: number[];
  capacity?: number;
}
