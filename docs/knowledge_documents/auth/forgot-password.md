# Auth Page: Forgot Password

## Overview
The forgot password page allows users to initiate password reset if they cannot access their account.

## Key Features
- Email-based password reset
- Security verification
- Password reset workflow

## How-to Guides
### Resetting Your Password
1. Enter the email address associated with your account
2. Click the "Send Reset Link" button
3. Check your email for the password reset link
4. Click the link in the email
5. Enter a new password
6. Confirm the new password
7. Your password will be updated and you can log in with the new credentials

## Troubleshooting
- **Email not received**: Check spam/junk folder and ensure you entered the correct email
- **Reset link expired**: Request a new reset link if the previous one expired
- **Invalid reset link**: Ensure you clicked the correct link from the email

## Technical Details
- API endpoint: `/auth/forgot-password`
- Generates secure reset tokens with expiration
- Rate-limited to prevent abuse
- Sends reset email through configured email service

## FAQ
Q: How long is the reset link valid?
A: Password reset links are valid for 24 hours from generation.

Q: Can I reset my password multiple times?
A: Yes, but each new reset request invalidates previous reset links.