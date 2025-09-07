# Availability Module Documentation

## Overview
The Availability module manages provider availability slots for the Eventide booking system. It provides REST APIs for creating, reading, updating, and deleting availability slots with support for both recurring and one-off patterns.

## Features
- Create and manage availability slots
- Support for both recurring and one-off availability
- Automatic conflict detection
- Caching for improved performance
- Real-time updates through WebSocket integration
- Full CRUD operations

## Module Structure
```
src/modules/availability/
├── availability.module.ts
├── availability.controller.ts
├── availability.service.ts
├── availability.schema.ts
├── API_DOCUMENTATION.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── dto/
│   ├── create-availability.dto.ts
│   ├── update-availability.dto.ts
│   └── get-availability.dto.ts
├── interfaces/
│   └── availability.interface.ts
└── availability.service.spec.ts
```

## Data Model

### Availability Schema
The availability schema supports both recurring and one-off availability patterns:

```typescript
interface Availability {
  providerId: string;
  type: 'recurring' | 'one_off';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday), required for recurring
  date?: Date; // Required for one-off
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  isBooked: boolean;
  bookingId?: string;
}
```

## API Endpoints

### Create Availability Slot
```
POST /availability
```

### Get Provider Availability
```
GET /availability/:providerId
```

### Get Specific Availability Slot
```
GET /availability/:id
```

### Update Availability Slot
```
PUT /availability/:id
```

### Delete Availability Slot
```
DELETE /availability/:id
```

## Caching
The availability module implements caching for improved performance:
- Provider availability data is cached for 5 minutes
- Cache is automatically invalidated when data changes
- Uses the core caching service with Redis or in-memory fallback

## Real-time Updates
The module is designed to integrate with WebSocket functionality:
- Availability changes trigger real-time notifications
- Clients receive instant updates without polling
- Room-based organization ensures efficient message routing

## Conflict Detection
The service automatically checks for conflicts when creating or updating availability slots:
- Prevents overlapping time slots for the same provider
- Checks both recurring and one-off patterns
- Returns appropriate error responses when conflicts are detected

## Testing
The module includes unit tests for core functionality:
- Service layer testing with mocked dependencies
- CRUD operation validation
- Conflict detection verification

## Future Enhancements
- Integration with external calendar systems
- More complex recurrence patterns
- Timezone-aware scheduling
- Availability analytics