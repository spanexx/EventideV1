# Duration Selection Page

## Overview
The Duration Selection page is part of the booking wizard that allows users to specify how long their appointment should last. This step ensures accurate scheduling and helps providers allocate appropriate time for each service.

## Internal Routes
- `/booking/:providerId/availability` - Select availability slots
- `/booking/:providerId/information` - Enter guest information
- `/providers` - Find providers with different duration options
- `/dashboard/availability` - Provider view of duration settings

## Key Features
- Visual display of available duration options
- Clear pricing information for different durations
- Automatic adjustment of availability based on duration
- Real-time validation of selected duration
- Option to request custom duration (if supported)
- Integration with provider preferences

## How-to Guides
1. To select a duration:
   - Review the available duration options for the selected service
   - Choose the duration that best fits your needs
   - Note any price differences based on duration
   - Click "Continue" to proceed to the next step

2. To request a custom duration (if available):
   - Look for a "Custom Duration" or "Request Special Time" option
   - Enter your preferred duration
   - Provide any additional information requested
   - Submit your request for provider approval

## Troubleshooting
- If duration options don't appear, verify the selected service is valid
- If available times change after selection, the system is adjusting for your duration
- If you can't find a suitable duration, contact the provider directly
- For very long appointments, multiple consecutive slots may be needed

## Technical Details
- Integration with service definition system for duration options
- Real-time availability adjustment based on duration
- Validation against provider's maximum and minimum duration settings
- Calculation of pricing based on duration and service type

## FAQ
Q: Why are some durations not available?
A: Durations may be unavailable due to provider preferences, overlapping appointments, or constraints on service availability.

Q: Can I change the duration after booking?
A: Duration changes require rescheduling the appointment. Contact the provider or use the reschedule option in your booking list.