# Reset Password Page

## Overview
The Reset Password page allows users to create a new password after initiating the password recovery process. Users must enter and confirm a new password to complete the recovery.

## Internal Routes
- `/auth/login` - Return to login page after reset
- `/auth/forgot-password` - Password recovery initiation
- `/dashboard/overview` - User dashboard after successful reset

## Key Features
- New password entry field with strength validation
- Password confirmation field
- Form validation for matching passwords
- Clear instructions for creating a strong password
- Security measures to prevent unauthorized access

## How-to Guides
1. To complete password reset:
   - Navigate to the reset password page via the link sent to your email
   - Enter your new password in the "New Password" field
   - Confirm your new password in the "Confirm Password" field
   - Ensure the new password meets strength requirements
   - Click the "Update Password" button
   - You will be redirected to the login page after successful update

## Troubleshooting
- If the password reset fails, ensure both password fields match exactly
- Verify that your reset link hasn't expired (typically valid for 1 hour)
- Ensure your new password meets all security requirements
- If you continue to have issues, contact support

## Technical Details
- POST /auth/reset-password - Updates user password with validation
- Password reset tokens are single-use and time-limited
- Passwords are securely hashed using bcrypt before storage
- User must re-authenticate after password reset for security

## FAQ
Q: What are the password requirements?
A: Passwords must be at least 8 characters long and include uppercase and lowercase letters, numbers, and special characters.

Q: Can I reuse my old password?
A: For security reasons, you cannot reuse the same password you had before. Choose a new, unique password.