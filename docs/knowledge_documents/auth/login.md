# Auth Page: Login

## Overview
The login page allows users to authenticate to the EventideV1 application using their credentials.

## Key Features
- Email and password authentication
- Social login (Google)
- Forgot password link
- Sign up option for new users

## How-to Guides
### Logging In
1. Enter your email address in the email field
2. Enter your password in the password field
3. Click the "Login" button
4. If successful, you will be redirected to your dashboard

### Forgot Password
1. Click on the "Forgot Password" link
2. Enter your email address
3. Check your email for password reset instructions

## Troubleshooting
- **Invalid credentials**: Ensure email and password are correct (case-sensitive)
- **Account locked**: Contact support if your account is locked
- **Google login fails**: Check if Google authentication is enabled in your browser

## Technical Details
- API endpoint: `/auth/login`
- Form validation handles email format
- Uses JWT tokens for session management
- Redirects to dashboard after successful login

## FAQ
Q: What if I can't remember my email address?
A: Contact support with other identity information to recover your account.

Q: Why does the login fail with correct credentials?
A: Check if your account is activated and not locked due to multiple failed attempts.