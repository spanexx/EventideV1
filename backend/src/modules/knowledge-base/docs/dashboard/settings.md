# Settings Page

## Overview
The Settings page allows users to customize their EventideV1 application experience, manage account preferences, configure notifications, and update personal information. This is the central location for all user-specific configurations.

## Internal Routes
- `/dashboard/overview` - Return to dashboard overview
- `/dashboard/availability` - Manage booking availability
- `/dashboard/bookings` - View booking settings
- `/auth/login` - Security and login settings

## Key Features
- Account information management (name, email, password)
- Notification preferences (email, push, SMS)
- Privacy settings and data controls
- Connected applications and integrations
- Theme and display preferences
- Calendar integration settings
- Payment information management
- Account deletion options

## How-to Guides
1. To update your profile information:
   - Navigate to the Settings page
   - Select the "Profile" section
   - Edit your name, email, or other personal information
   - Click "Save Changes" to confirm

2. To configure notification preferences:
   - Go to the Settings page
   - Select the "Notifications" section
   - Choose which notifications you want to receive
   - Select your preferred delivery method (email, push, SMS)
   - Save your preferences

3. To change your password:
   - Access the Settings page
   - Select "Security" or "Password" section
   - Enter your current password
   - Create and confirm your new password
   - Save the changes

4. To connect calendar applications:
   - Go to the Settings page
   - Select the "Integrations" or "Calendar" section
   - Choose your calendar provider (Google, Outlook, etc.)
   - Follow the authorization steps
   - Confirm the integration

## Troubleshooting
- If changes don't save, verify all required fields are completed
- For notification issues, check your email settings and spam folder
- If calendar integration fails, ensure you have proper permissions
- For password changes, ensure your new password meets security requirements

## Technical Details
- PUT /user/profile - Update user profile information
- PUT /user/settings - Update user settings
- Integration with various calendar APIs (Google, Outlook, etc.)
- Secure handling of sensitive information
- Real-time synchronization for some settings

## FAQ
Q: How often should I update my password?
A: We recommend updating your password every 3-6 months for security best practices.

Q: Can other users see my settings?
A: No, all settings are private to your account and are not visible to other users.