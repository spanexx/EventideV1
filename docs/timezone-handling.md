# Timezone Handling in Availability Module

## Overview

This document explains the timezone handling fixes implemented in the Availability module to resolve the issue where one-off availability slots were disappearing from the UI after refresh while recurring slots displayed correctly.

## Problem Description

The issue occurred due to timezone handling mismatches between the frontend and backend when filtering one-off availability slots by date:

1. **Frontend**: Sent date parameters to the backend in UTC format
2. **Backend**: Compared these dates with the `date` field in the database without proper timezone normalization
3. **Result**: One-off slots could fall outside the query date range due to timezone differences, causing them to disappear after refresh

## Solution

### Backend Changes

The `findByProviderAndDateRange` method in `availability.service.ts` was updated to:

1. **Expand the date range**: Add a one-day buffer on each side of the requested date range to account for timezone differences
2. **Filter results**: Apply a secondary filter to ensure only slots within the actual requested date range are returned

```typescript
// Expand the start and end dates by one day
if (start) {
  const expandedStart = new Date(start);
  expandedStart.setDate(expandedStart.getDate() - 1);
  oneOffCondition.date = { ...oneOffCondition.date, $gte: expandedStart };
}
if (end) {
  const expandedEnd = new Date(end);
  expandedEnd.setDate(expandedEnd.getDate() + 1);
  oneOffCondition.date = { ...oneOffCondition.date, $lte: expandedEnd };
}

// Filter results to ensure they're within the actual date range
let filteredResult = result;
if (start || end) {
  filteredResult = result.filter(slot => {
    // For recurring slots, always include them
    if (slot.type === 'recurring') {
      return true;
    }
    
    // For one-off slots, check if they fall within the actual date range
    if (slot.type === 'one_off' && slot.date) {
      const slotDate = new Date(slot.date);
      slotDate.setHours(0, 0, 0, 0); // Compare only the date part
      
      const startDateOnly = start ? new Date(start) : null;
      if (startDateOnly) {
        startDateOnly.setHours(0, 0, 0, 0);
      }
      
      const endDateOnly = end ? new Date(end) : null;
      if (endDateOnly) {
        endDateOnly.setHours(0, 0, 0, 0);
      }
      
      const isAfterStart = !startDateOnly || slotDate >= startDateOnly;
      const isBeforeEnd = !endDateOnly || slotDate <= endDateOnly;
      
      return isAfterStart && isBeforeEnd;
    }
    
    return true;
  });
}
```

### Frontend Changes

The `getAvailability` method in `availability.service.ts` was updated to:

1. **Expand the date range**: Send a wider date range to the backend to ensure all relevant slots are retrieved

```typescript
// Calculate start and end dates for the week with buffer for timezone differences
const { startDate, endDate } = createDateRangeWithBuffer(date, 1);

let params = new HttpParams();
params = params.append('startDate', startDate.toISOString());
params = params.append('endDate', endDate.toISOString());
```

### Utility Functions

New timezone utility functions were created in `timezone.utils.ts`:

1. `createDateRangeWithBuffer`: Creates a date range with buffer days
2. `normalizeDate`: Normalizes a date to remove time component
3. `isDateInRange`: Checks if a date falls within a range

## Testing

The changes were tested with the existing test suite, which continues to pass all tests.

## Deployment

No special deployment steps are required. The changes are backward compatible and will automatically take effect when deployed.