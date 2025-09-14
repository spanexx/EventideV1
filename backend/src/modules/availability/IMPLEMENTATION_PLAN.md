# Implementation Plan: Fix Timezone Handling for One-Off Availability Slots

## Problem Statement
One-off availability slots disappear from the UI after refresh while recurring slots display correctly. The root cause is a timezone handling mismatch between frontend and backend when filtering one-off slots by date.

## Root Cause Analysis
The issue occurs in the `findByProviderAndDateRange` method in `availability.service.ts`. The current implementation:
1. Constructs date queries using raw Date objects without timezone normalization
2. Uses date-only comparisons that don't account for timezone differences
3. Does not properly handle the start/end of day boundaries in different timezones

## Solution Overview
1. Normalize all date handling to use consistent timezone-aware date objects
2. Modify the backend query logic to properly handle timezone conversions
3. Update the frontend to send timezone-aware date parameters
4. Ensure both one-off and recurring slots are handled consistently

## Detailed Implementation Steps

### Backend Changes (Node.js/NestJS)

1. **Update the findByProviderAndDateRange method**:
   - Implement proper timezone normalization for date parameters
   - Adjust date queries to handle timezone differences correctly
   - Ensure one-off slots are filtered using timezone-aware date ranges

2. **Add timezone utilities**:
   - Create helper functions for timezone conversion
   - Implement consistent date normalization across the service

### Frontend Changes (Angular)

1. **Update the getAvailability method**:
   - Send timezone-aware date parameters to the backend
   - Ensure date ranges account for user's local timezone

2. **Add timezone handling utilities**:
   - Create helper functions for timezone conversion
   - Implement consistent date formatting for API requests

## Testing Plan
1. Test with different timezones (UTC, EST, PST, etc.)
2. Verify one-off slots display correctly after refresh
3. Ensure recurring slots continue to work as expected
4. Test edge cases around day boundaries
5. Validate performance impact is minimal

## Rollback Plan
1. Revert the changes to availability.service.ts
2. Restore the original frontend date handling
3. Clear any cached data that might be affected

## Success Criteria
1. One-off availability slots persist in the UI after refresh
2. Recurring slots continue to display correctly
3. No performance degradation
4. All existing functionality remains intact