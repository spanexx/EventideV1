# Signup Page

## Overview
The Signup page allows new users to create an account in the EventideV1 application. Users can register with their email and password, or use Google to sign up quickly.

## Internal Routes
- `/auth/login` - Return to login page
- `/auth/verify-email` - Email verification process
- `/home` - Return to main page
- `/dashboard/overview` - User dashboard after registration

## Key Features
- Email and password registration
- Google OAuth20 sign-up option
- Password strength validation
- Terms of service agreement
- Real-time form validation
- Email verification requirement after registration

## How-to Guides
1. To sign up with email and password:
   - Enter your email address in the email field
   - Create a strong password that meets the requirements
   - Confirm your password in the confirmation field
   - Accept the terms of service
   - Click the "Sign Up" button
   - Check your email for a verification link
   - Click the verification link to confirm your account

2. To sign up with Google:
   - Click the "Sign up with Google" button
   - Follow the Google authentication prompts
   - You will be redirected to your dashboard upon successful registration

## Troubleshooting
- If registration fails, check that your email is valid and not already in use
- Ensure your password meets the strength requirements (minimum 8 characters, uppercase, lowercase, number, special character)
- If you don't receive the verification email, check your spam folder
- If you continue to have issues, contact support

## Technical Details
- POST /auth/register - Creates a new user account
- GET /auth/verify - Verifies email confirmation tokens
- Form validation includes email format checking and password strength requirements
- Account verification required before full access to application features
- Secure password handling with bcrypt hashing

## FAQ
Q: What if I don't receive the email verification?
A: Check your spam folder and ensure you used the correct email. If needed, request a new verification email from your account settings.

Q: Can I use the same email for multiple accounts?
A: No, each email address can only be associated with one account in the system.