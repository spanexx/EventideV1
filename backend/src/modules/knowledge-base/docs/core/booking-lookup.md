# Booking Lookup Page

## Overview
The Booking Lookup page allows users to retrieve booking information using a confirmation number or other identifying information. This is particularly useful for users who are not logged in or need to access booking details shared by others.

## Internal Routes
- `/booking-cancel/:id` - Cancel booking if eligible
- `/provider/:id` - View provider details for the booking
- `/dashboard/bookings` - View booking if logged in
- `/home` - Return to home page

## Key Features
- Confirmation number entry field
- Alternative lookup options (email, phone)
- Secure access to booking details
- View-only access without requiring login
- Option to download booking details
- Link to provider information
- Cancellation options (if applicable)
- Integration with booking management system

## How-to Guides
1. To look up a booking:
   - Enter the confirmation number in the provided field
   - Or enter the email address associated with the booking
   - Click "Search" or press Enter
   - Review the booking details that appear

2. To access a booking with a serial key:
   - If you received a booking link with a serial key
   - The system will automatically retrieve the booking details
   - No additional information is needed

3. To cancel a booking from lookup:
   - Find your booking using confirmation number or email
   - View the booking details
   - Select "Cancel Booking" if the option is available
   - Confirm the cancellation in the dialog

## Troubleshooting
- If lookup fails, verify the confirmation number is entered correctly
- For email lookups, ensure you're using the same email as booking
- If you can't cancel, the cancellation window may have passed
- For shared links, ensure the link hasn't expired

## Technical Details
- Secure lookup using encrypted confirmation numbers
- Rate limiting to prevent abuse of the lookup system
- Integration with booking database for real-time information
- Temporary access tokens for secure information retrieval

## FAQ
Q: Do I need to be logged in to look up a booking?
A: No, the booking lookup page allows access to booking information without requiring a login. However, some actions like cancellation may require authentication.

Q: How long are booking lookup links valid?
A: Booking lookup links are typically valid for 30 days after the booking date, but this may vary based on provider policies.