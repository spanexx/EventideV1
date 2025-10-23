# Google Callback Page

## Overview
The Google Callback page handles the OAuth20 authentication flow after a user successfully authenticates with Google. This is an internal page that processes the authentication response and creates or logs in the user account.

## Internal Routes
- `/dashboard/overview` - User dashboard after successful authentication
- `/auth/login` - Login page if authentication fails
- `/auth/signup` - Account creation flow

## Key Features
- Processes Google OAuth20 callback responses
- Handles user account creation or login for Google-authenticated users
- Secure token validation and processing
- Automatic redirect to user dashboard after successful authentication
- Error handling for failed authentication attempts

## How-to Guides
1. The Google Callback page is used automatically during the OAuth flow:
   - User clicks "Login with Google" or "Sign up with Google" on auth pages
   - User authenticates with Google and grants permissions
   - Google redirects back to this callback page with authentication data
   - The system processes the data and creates/updates the user account
   - User is redirected to their dashboard

## Troubleshooting
- If the Google callback fails, it's usually due to invalid configuration
- Check that the Google OAuth client ID and secret are correctly set
- Ensure the authorized redirect URI matches the callback endpoint
- If users see an error page, they should return to the login page and try again
- If issues persist, contact technical support

## Technical Details
- GET /auth/google/callback - Processes OAuth callback with authorization code
- Validates state parameter to prevent CSRF attacks
- Exchanges authorization code for access and refresh tokens
- Creates new user account if this is the first Google login from this user
- Updates profile information from Google if needed
- Sets secure authentication cookies for the session

## FAQ
Q: What happens to my Google account information?
A: EventideV1 only accesses basic profile information (name, email, profile picture) to create or link your account. We don't access your Google Drive, Gmail, or other Google services.

Q: Can I disconnect my Google account later?
A: Yes, you can manage your authentication methods in your account settings. However, if you only registered with Google and want to disconnect it, you'll need to set up an email/password login first.