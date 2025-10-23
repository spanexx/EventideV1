# Bookings Page

## Overview
The Bookings page provides a comprehensive view of all appointments and reservations in the EventideV1 application. Users can view, manage, and track their bookings, with options to reschedule, cancel, or get details about each booking.

## Internal Routes
- `/dashboard/overview` - Return to dashboard overview
- `/dashboard/availability` - Manage availability
- `/booking` - Create new bookings
- `/booking-lookup` - Lookup bookings by confirmation
- `/providers` - Find more providers

## Key Features
- Comprehensive booking list with status indicators
- Filtering and sorting options for bookings
- Detailed booking information view
- Actions for rescheduling, canceling, or contacting
- Status tracking (confirmed, pending, completed, canceled)
- Search functionality for specific bookings
- Export options for booking history
- Integration with calendar systems

## How-to Guides
1. To view all bookings:
   - Navigate to the Bookings page from the dashboard
   - View the list of all your bookings
   - Use filters to narrow down by date, status, or provider

2. To view booking details:
   - Click on any booking in the list
   - See all details including time, date, provider, service type
   - Access actions like reschedule or cancel from this view

3. To cancel a booking:
   - Find the booking in your list
   - Click on the booking to open details
   - Select "Cancel Booking" option
   - Confirm the cancellation in the confirmation dialog

4. To reschedule a booking:
   - Open the booking details
   - Select "Reschedule" option
   - Choose a new time slot from available options
   - Confirm the new time

## Troubleshooting
- If a booking doesn't appear in the list, check the date filters
- If you can't cancel a booking, it may be too close to the appointment time
- If booking details aren't loading, refresh the page
- For issues with rescheduling, check if there are available time slots

## Technical Details
- GET /booking/user/:userId - Retrieve user's bookings
- PUT /booking/:id - Update booking information
- DELETE /booking/:id - Cancel a booking
- POST /booking/confirm/:id - Confirm a pending booking
- Real-time status updates via WebSocket
- Integration with provider availability system

## FAQ
Q: Can I cancel a booking at any time?
A: Cancellation policies vary by provider. Most providers allow cancellations up to 24 hours before the appointment. Check the specific cancellation policy for each booking.

Q: How do I know if a booking is confirmed?
A: Confirmed bookings will show a "Confirmed" status in the list. You will also receive a confirmation email with booking details.