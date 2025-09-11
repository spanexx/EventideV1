# Enhanced All-Day Availability Slot Management

## Overview

The enhanced all-day availability feature allows providers to specify the number of sub-slots when creating all-day availability and automatically calculates time distribution. This feature improves the scheduling experience by providing more granular control over how all-day availability is divided.

## Features

### 1. Configurable Slot Count
Providers can specify how many sub-slots they want for an all-day period (1-24 slots).

### 2. Custom Working Hours
Providers can specify custom working start and end times for the day, rather than being limited to the default 8 AM to 8 PM window.

### 3. Auto-Distribution
The system automatically distributes time evenly throughout the working day with configurable breaks between slots.

### 4. Manual Configuration
Providers can manually configure each slot's start time and duration when auto-distribution is disabled.

### 5. Preview Functionality
A preview shows how time will be divided before saving the configuration.

### 6. Recurring Support
All-day slots can be configured as recurring availability for specific days of the week.

## API Endpoints

### Create All-Day Availability Slots
```
POST /availability/all-day
```

#### Request Body
```typescript
interface CreateAllDayAvailabilityDto {
  providerId: string;
  date: Date;
  workingStartTime?: Date; // Custom working start time (optional)
  workingEndTime?: Date; // Custom working end time (optional)
  numberOfSlots?: number; // Required if minutesPerSlot not provided
  minutesPerSlot?: number; // Required if numberOfSlots not provided
  breakTime?: number; // Break time between slots in minutes (default: 15)
  autoDistribute?: boolean; // defaults to true
  slots?: AllDaySlot[]; // required when autoDistribute is false
  isRecurring?: boolean; // defaults to false
  dayOfWeek?: DayOfWeek; // required when isRecurring is true
}

interface AllDaySlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}
```

#### Response
```typescript
interface Availability {
  id: string;
  providerId: string;
  type: 'recurring' | 'one_off';
  date?: Date; // for one-off slots
  dayOfWeek?: DayOfWeek; // for recurring slots
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  isBooked: boolean;
  bookingId?: string;
}
```

## Implementation Details

### Frontend Components

#### Availability Dialog Component
The `AvailabilityDialogComponent` handles the UI for creating and editing availability slots, including the enhanced all-day functionality.

Key properties:
- `numberOfSlots`: Number of sub-slots for all-day availability (1-24)
- `dayStartTime`: Custom working start time (default: '08:00')
- `dayEndTime`: Custom working end time (default: '20:00')
- `autoDistribute`: Whether to automatically distribute slots
- `slotPreview`: Preview of slot distribution

Key methods:
- `onNumberOfSlotsChange()`: Handles changes to the number of slots input
- `onDayTimeChange()`: Handles changes to the day start/end times
- `onAutoDistributeChange()`: Handles changes to the auto-distribute toggle
- `updateSlotPreview()`: Updates the preview of slot distribution
- `calculateEvenDistribution()`: Calculates even distribution of slots using custom working hours
- `createAllDaySlots()`: Creates all-day slots via the availability service

### Backend Services

#### Availability Service
The `AvailabilityService` provides methods for managing availability slots, including the new all-day functionality.

Key methods:
- `createAllDaySlots()`: Creates multiple availability slots for an all-day period with support for custom working hours
- `generateEvenlyDistributedSlots()`: Generates evenly distributed slots throughout a working day, using custom hours when provided

### Database Schema

The enhanced feature uses the existing `Availability` schema without modifications:

```typescript
@Schema({ timestamps: true })
export class Availability {
  @Prop({ type: String, required: true, index: true })
  providerId: string;

  @Prop({
    type: String,
    enum: AvailabilityType,
    default: AvailabilityType.ONE_OFF,
  })
  type: AvailabilityType;

  // For recurring availability
  @Prop({ type: Number, enum: DayOfWeek, required: false })
  dayOfWeek?: DayOfWeek;

  // For one-off availability
  @Prop({ type: Date, required: false, index: true })
  date?: Date;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({ type: Number, required: true })
  duration: number; // in minutes

  @Prop({ type: Boolean, default: false })
  isBooked: boolean;

  @Prop({ type: String, required: false })
  bookingId?: string;
}
```

## Algorithm Details

### Auto-Distribution Algorithm

1. Working hours are defined by `workingStartTime` and `workingEndTime` (defaulting to 8 AM to 8 PM if not provided)
2. Break time between slots is 15 minutes by default
3. Time per slot is calculated as:
   ```
   totalTimeForBreaks = (numberOfSlots - 1) * breakTime
   timePerSlot = (workingMinutes - totalTimeForBreaks) / numberOfSlots
   ```
4. If `timePerSlot` is less than 15 minutes, the number of slots is automatically adjusted
5. Slots are distributed evenly with breaks between them

## Error Handling

The system handles several edge cases:

1. **Invalid Slot Count**: Too many slots (> 24) or too few (< 1) are automatically clamped
2. **Time Distribution Issues**: Insufficient time for the specified number of slots automatically adjusts the slot count
3. **Invalid Working Hours**: `workingEndTime` must be after `workingStartTime`
4. **Conflicts**: Overlapping slots are detected and prevented

## Testing

### Unit Tests

Unit tests are provided for both frontend and backend components:

- Frontend: `availability-dialog.component.spec.ts`
- Backend: `availability.service.spec.ts`

### Integration Tests

Integration tests verify the communication between frontend and backend:

- `availability.service.spec.ts` (frontend)

## Usage Examples

### Creating Auto-Distributed All-Day Slots with Custom Hours
```typescript
const allDayDto = {
  providerId: 'provider-123',
  date: new Date('2023-01-01'),
  workingStartTime: new Date('2023-01-01T09:00:00'),
  workingEndTime: new Date('2023-01-01T17:00:00'),
  numberOfSlots: 4,
  autoDistribute: true
};

availabilityService.createAllDayAvailability(allDayDto).subscribe(
  slots => console.log('Created slots:', slots),
  error => console.error('Error:', error)
);
```

### Creating Auto-Distributed All-Day Slots with Minutes Per Slot
```typescript
const allDayDto = {
  providerId: 'provider-123',
  date: new Date('2023-01-01'),
  workingStartTime: new Date('2023-01-01T09:00:00'),
  workingEndTime: new Date('2023-01-01T17:00:00'),
  minutesPerSlot: 60,
  breakTime: 30,
  autoDistribute: true
};

availabilityService.createAllDayAvailability(allDayDto).subscribe(
  slots => console.log('Created slots:', slots),
  error => console.error('Error:', error)
);
```

### Creating Manually Configured All-Day Slots
```typescript
const allDayDto = {
  providerId: 'provider-123',
  date: new Date('2023-01-01'),
  numberOfSlots: 2,
  autoDistribute: false,
  slots: [
    {
      startTime: new Date('2023-01-01T09:00:00'),
      endTime: new Date('2023-01-01T11:00:00'),
      duration: 120
    },
    {
      startTime: new Date('2023-01-01T14:00:00'),
      endTime: new Date('2023-01-01T16:00:00'),
      duration: 120
    }
  ]
};

availabilityService.createAllDayAvailability(allDayDto).subscribe(
  slots => console.log('Created slots:', slots),
  error => console.error('Error:', error)
);
```

### Creating Recurring All-Day Slots with Custom Hours
```typescript
const allDayDto = {
  providerId: 'provider-123',
  date: new Date('2023-01-01'),
  workingStartTime: new Date('2023-01-01T09:00:00'),
  workingEndTime: new Date('2023-01-01T17:00:00'),
  numberOfSlots: 3,
  autoDistribute: true,
  isRecurring: true,
  dayOfWeek: DayOfWeek.MONDAY
};

availabilityService.createAllDayAvailability(allDayDto).subscribe(
  slots => console.log('Created slots:', slots),
  error => console.error('Error:', error)
);
```