# Availability Management Page

## Overview
The Availability Management page allows service providers to set and manage their available time slots for bookings. Providers can define when they are available to take appointments, block out unavailable times, and configure recurring availability patterns.

## Internal Routes
- `/dashboard/overview` - Return to dashboard overview
- `/dashboard/bookings` - View related bookings
- `/dashboard/settings` - Account settings
- `/booking` - View booking process from user perspective

## Key Features
- Calendar view for visualizing availability
- Time slot creation and editing
- Recurring availability patterns (daily, weekly, monthly)
- Bulk operations for setting multiple availability slots
- Visual indicators for booked vs available times
- Integration with booking system
- Time zone handling
- AI-powered suggestions for optimal availability

## How-to Guides
1. To create new availability slots:
   - Select a date range in the calendar
   - Choose a time range for your availability
   - Set any booking constraints (minimum notice, duration, etc.)
   - Click "Save Availability" to confirm

2. To edit existing availability:
   - Find the time slot you want to modify
   - Click on the slot to open the edit panel
   - Adjust the times, constraints, or other settings
   - Save your changes

3. To set recurring availability:
   - Select the "Recurring" option when creating availability
   - Choose the pattern (daily, weekly, etc.)
   - Specify the recurrence details
   - Save the recurring pattern

## Troubleshooting
- If availability doesn't appear in the booking system, ensure it's set to "active"
- If you see conflicts in your schedule, check for overlapping availability slots
- If recurring patterns don't apply as expected, verify the recurrence settings
- If you can't book during available times, check for any other constraints that might apply

## Technical Details
- POST /availability - Create new availability slots
- PUT /availability/:id - Update existing availability
- DELETE /availability/:id - Remove availability slots
- GET /availability/search - Find available slots for booking
- Integration with calendar systems for real-time updates
- AI conflict detection and resolution

## FAQ
Q: Can I set different availability for different services?
A: Yes, availability can be set per service type. When creating availability, you can specify which services are available during those times.

Q: What happens to existing bookings if I change my availability?
A: Existing bookings are not affected when you modify your availability. Changes only apply to future potential bookings.