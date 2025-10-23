# Auth Page: Reset Password

## Overview
The reset password page allows users to set a new password after receiving a reset link.

## Key Features
- Password creation form
- Password strength validation
- Token verification

## How-to Guides
### Setting a New Password
1. Access this page through the reset link in your email
2. Create a new password (minimum 8 characters, including uppercase, lowercase, number)
3. Confirm the new password in the confirmation field
4. Click the "Reset Password" button
5. You will be redirected to login with your new password

## Troubleshooting
- **Invalid token**: The reset link may have expired; request a new reset email
- **Password mismatch**: Ensure both password fields match exactly
- **Password too weak**: Follow the strength requirements shown on the form

## Technical Details
- API endpoint: `/auth/reset-password`
- Token validation occurs before form submission
- Redirects to login page after successful reset
- Invalidates reset token after use

## FAQ
Q: What happens after I reset my password?
A: You can immediately use the new password to log in to your account.

Q: Can I use the same reset link again?
A: No, reset links are single-use and expire after 24 hours.