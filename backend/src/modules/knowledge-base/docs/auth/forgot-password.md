# Forgot Password Page

## Overview
The Forgot Password page allows users to initiate the password recovery process when they cannot remember their current password. Users enter their email address to receive a password reset link.

## Internal Routes
- `/auth/login` - Return to login page
- `/auth/reset-password` - Password reset form
- `/auth/signup` - Create new account

## Key Features
- Email entry field for password recovery
- Form validation and error handling
- Password reset link sent to registered email
- Clear instructions for completing the reset process
- Link to return to login page

## How-to Guides
1. To initiate password recovery:
   - Enter your registered email address in the email field
   - Click the "Send Reset Link" button
   - Check your email for the password reset link
   - Follow the link to the password reset page
   - Create a new password and confirm it
   - Click "Update Password" to complete the process

## Troubleshooting
- If you don't receive the reset email, check your spam folder
- Ensure you're using the same email address you registered with
- The reset link expires after a certain period (typically 1 hour)
- If you continue to have issues, contact support

## Technical Details
- POST /auth/forgot-password - Initiates password reset process
- Password reset tokens are valid for 1 hour
- Reset links are sent via secure email service
- User sessions are invalidated during password reset

## FAQ
Q: How long is the password reset link valid?
A: Password reset links are valid for 1 hour from the time they are sent. If the link expires, you will need to request a new reset email.

Q: I didn't receive the password reset email?
A: Check your spam folder first. If you still don't see the email, ensure you're checking the email address you used to register. You may need to request the reset again if the email is still missing.