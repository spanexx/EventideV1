# Guest Information Page

## Overview
The Guest Information page collects necessary details from the person making the booking. This information is used for appointment confirmation, communication, and record-keeping purposes.

## Internal Routes
- `/booking/:providerId/availability` - Select time slots
- `/booking/:providerId/confirmation` - Confirm booking
- `/dashboard/bookings` - View booking history
- `/dashboard/settings` - Update contact information

## Key Features
- Form fields for essential contact information
- Optional fields for special requirements or notes
- Real-time validation of input
- Secure handling of personal information
- Option to save information for future bookings
- Integration with user profile data

## How-to Guides
1. To provide guest information:
   - Fill in the required fields (name, email, phone)
   - Add any special requirements or notes in the provided field
   - Review the information for accuracy
   - Click "Continue" to proceed with the booking

2. To save information for future use:
   - Complete all information fields
   - Look for an option to "Save for future bookings"
   - This information will auto-populate in future bookings

3. To update information from profile:
   - If you're logged in, some information may auto-populate
   - Verify that the information is current and accurate
   - Make any necessary updates before proceeding

## Troubleshooting
- If form validation fails, check that all required fields are completed correctly
- For phone number issues, ensure the correct format is used
- If email validation fails, verify the email format is correct
- If the continue button is disabled, ensure all required fields are filled

## Technical Details
- Form validation using client and server-side validation
- Sanitization of input to prevent security vulnerabilities
- Integration with user profile system for auto-population
- Secure transmission and storage of personal information

## FAQ
Q: Why do you need all this information?
A: We collect this information to confirm your booking, communicate important updates, and provide the best service possible. Your information is kept secure and not shared with third parties.

Q: Will my information be shared with the provider?
A: Basic contact information will be shared with the provider to facilitate your appointment. Additional information is only shared if necessary for the service.