# Availability API Documentation

## Overview
The Availability API provides endpoints for managing provider availability slots. Providers can define both recurring and one-off availability time blocks that guests can book appointments against.

## Base URL
```
/api/availability
```

## Authentication
All endpoints require authentication using a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Data Models

### Availability
```typescript
interface Availability {
  id: string;
  providerId: string;
  type: 'recurring' | 'one_off';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday), required for recurring
  date?: Date; // Required for one-off
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  isBooked: boolean;
  bookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Endpoints

### Create Availability Slot
```
POST /availability
```

#### Request Body
```json
{
  "providerId": "provider-123",
  "type": "one_off",
  "date": "2023-06-15T00:00:00.000Z",
  "startTime": "2023-06-15T09:00:00.000Z",
  "endTime": "2023-06-15T10:00:00.000Z",
  "duration": 60
}
```

#### Response
```json
{
  "id": "availability-123",
  "providerId": "provider-123",
  "type": "one_off",
  "date": "2023-06-15T00:00:00.000Z",
  "startTime": "2023-06-15T09:00:00.000Z",
  "endTime": "2023-06-15T10:00:00.000Z",
  "duration": 60,
  "isBooked": false,
  "createdAt": "2023-06-01T10:00:00.000Z",
  "updatedAt": "2023-06-01T10:00:00.000Z"
}
```

### Get Provider Availability
```
GET /availability/:providerId
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | Date (ISO) | Start date for filtering (optional) |
| endDate | Date (ISO) | End date for filtering (optional) |

#### Response
```json
[
  {
    "id": "availability-123",
    "providerId": "provider-123",
    "type": "one_off",
    "date": "2023-06-15T00:00:00.000Z",
    "startTime": "2023-06-15T09:00:00.000Z",
    "endTime": "2023-06-15T10:00:00.000Z",
    "duration": 60,
    "isBooked": false,
    "createdAt": "2023-06-01T10:00:00.000Z",
    "updatedAt": "2023-06-01T10:00:00.000Z"
  }
]
```

### Get Specific Availability Slot
```
GET /availability/:id
```

#### Response
```json
{
  "id": "availability-123",
  "providerId": "provider-123",
  "type": "one_off",
  "date": "2023-06-15T00:00:00.000Z",
  "startTime": "2023-06-15T09:00:00.000Z",
  "endTime": "2023-06-15T10:00:00.000Z",
  "duration": 60,
  "isBooked": false,
  "createdAt": "2023-06-01T10:00:00.000Z",
  "updatedAt": "2023-06-01T10:00:00.000Z"
}
```

### Update Availability Slot
```
PUT /availability/:id
```

#### Request Body
```json
{
  "startTime": "2023-06-15T10:00:00.000Z",
  "endTime": "2023-06-15T11:00:00.000Z",
  "duration": 60
}
```

#### Response
```json
{
  "id": "availability-123",
  "providerId": "provider-123",
  "type": "one_off",
  "date": "2023-06-15T00:00:00.000Z",
  "startTime": "2023-06-15T10:00:00.000Z",
  "endTime": "2023-06-15T11:00:00.000Z",
  "duration": 60,
  "isBooked": false,
  "createdAt": "2023-06-01T10:00:00.000Z",
  "updatedAt": "2023-06-01T11:00:00.000Z"
}
```

### Delete Availability Slot
```
DELETE /availability/:id
```

#### Response
```json
{
  "success": true
}
```

## Error Responses
All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Availability slot with ID not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "This availability slot conflicts with an existing slot"
}
```

## Implementation Details

### Conflict Detection
The service automatically checks for conflicts when creating or updating availability slots. A conflict occurs when:
1. Two slots overlap in time
2. Both slots are for the same provider
3. Both slots are for the same date (for one-off slots)

### Caching
Availability data is cached for 5 minutes to improve performance. Cache is automatically invalidated when availability slots are created, updated, or deleted.

### Validation
All input data is validated using class-validator decorators:
- Required fields are checked
- Date formats are validated
- Time ranges are validated (endTime must be after startTime)
- Duration is validated to match the time range

## Future Enhancements
- Support for more complex recurrence patterns (bi-weekly, monthly, etc.)
- Integration with external calendar systems (Google Calendar, Outlook)
- Timezone-aware scheduling
- Availability analytics and reporting