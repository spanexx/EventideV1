# Booking Wizard Page

## Overview
The Booking Wizard is a multi-step process that guides users through creating a booking appointment. It provides a streamlined experience with clear steps and progress indicators, making it easy to schedule appointments with service providers.

## Internal Routes
- `/providers` - Find more providers
- `/dashboard/bookings` - View created bookings
- `/booking-lookup` - Lookup booking by confirmation
- `/home` - Return to home page

## Key Features
- Multi-step booking process with progress indicator
- Provider and service selection
- Duration selection interface
- Availability calendar with time slot selection
- Guest information collection
- Booking confirmation and summary
- Real-time validation and error handling
- Integration with provider availability system

## How-to Guides
1. To start a booking:
   - Navigate to the booking section or click a "Book Now" button
   - Select the service provider you want to book with
   - Proceed through each step of the wizard
   - Complete all required information at each step

2. To select a service and provider:
   - Browse or search for providers
   - Select the service you need from the provider's offerings
   - Review service details and duration requirements

3. To find available time slots:
   - Use the calendar interface to select a date
   - Choose from available time slots for that date
   - If no slots are available, try different dates or providers

4. To complete the booking:
   - Provide required guest information
   - Review booking details for accuracy
   - Confirm the booking to finalize

## Troubleshooting
- If time slots don't appear, check your selected date and provider
- If the booking fails to confirm, verify all required fields are filled
- If you see availability that doesn't match the provider's schedule, refresh the page
- For payment issues during booking, verify your payment method details

## Technical Details
- Multi-step form with state management
- Real-time validation at each step
- Integration with availability management system
- Reservation system that temporarily holds time slots
- Progress tracking and state persistence
- Integration with payment systems (if applicable)

## FAQ
Q: Can I book multiple services at once?
A: Currently, each booking is for a single service. For multiple services, you'll need to create separate bookings, though they can be scheduled consecutively.

Q: What if I need to change my booking after it's confirmed?
A: You can modify or cancel your booking using the options in your booking list, subject to the provider's cancellation policy.