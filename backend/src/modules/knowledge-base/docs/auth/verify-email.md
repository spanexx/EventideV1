# Verify Email Page

## Overview
The Verify Email page confirms a user's email address after registration. This step is required to activate the account and gain full access to the EventideV1 application features.

## Internal Routes
- `/auth/login` - Login page after verification
- `/auth/signup` - Account registration page
- `/dashboard/overview` - User dashboard after verification and login

## Key Features
- Automatic email verification upon clicking verification link
- Success or error status display
- Redirect to login page after verification
- Clear messaging about verification status
- Option to request a new verification email if needed

## How-to Guides
1. To verify your email:
   - Click the verification link in the email sent during registration
   - The verification will process automatically
   - You will see a confirmation message that your email is verified
   - You can now log in and use the application with full access

2. To request a new verification email:
   - If your verification link expired or didn't work
   - Contact support to request a new verification email
   - The new verification link will be sent to your registered email address

## Troubleshooting
- If verification fails, ensure the link hasn't expired (usually valid for 24 hours)
- Check that you're using the verification link from the most recent registration
- If the link was copied incorrectly, try copying it again carefully
- If you continue to have issues, contact support

## Technical Details
- GET /auth/verify - Validates email verification token
- Verification tokens are single-use and time-limited (24 hours)
- Account status is updated from 'pending' to 'verified' upon success
- User gains access to full application features after verification

## FAQ
Q: How long is the verification link valid?
A: Email verification links are valid for 24 hours from the time they are sent. If the link expires, you will need to request a new verification email.

Q: What happens after I verify my email?
A: After email verification, you can log in to your account and access all features of the EventideV1 application.