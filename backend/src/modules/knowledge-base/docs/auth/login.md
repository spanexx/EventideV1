# Login Page

## Overview
The Login page allows existing users to authenticate and access their EventideV1 accounts. Users can log in using their email and password, or through Google authentication for a quick login experience.

## Internal Routes
- `/auth/login` - Login page
- `/auth/signup` - Create new account
- `/auth/forgot-password` - Password recovery
- `/home` - Return to main page
- `/dashboard/overview` - User dashboard after login

## Key Features
- Email and password authentication
- Google OAuth20 login option
- "Forgot Password" link for password recovery
- "Sign Up" link for new users
- Real-time form validation
- Responsive design for all device sizes

## How-to Guides
1. To log in with email and password:
   - Enter your registered email address in the email field
   - Enter your password in the password field
   - Click the "Login" button
   - You will be redirected to your dashboard upon successful authentication

2. To log in with Google:
   - Click the "Login with Google" button
   - Follow the Google authentication prompts
   - You will be redirected to your dashboard upon successful authentication

3. To recover a forgotten password:
   - Click the "Forgot Password?" link
   - Enter your email address on the password recovery page
   - Check your email for a password reset link
   - Follow the link to reset your password

## Troubleshooting
- If login fails, verify that your email and password are correct
- Check if your account has been verified via email confirmation
- If using Google login, ensure you're using the correct Google account
- If you continue to have issues, contact support

## Technical Details
- POST /auth/login - Authenticates user credentials and returns JWT tokens
- GET /auth/google - Initiates Google OAuth flow
- POST /auth/google/callback - Handles Google OAuth callback
- Form validation includes email format checking and password strength requirements
- Secure password handling with bcrypt hashing

## FAQ
Q: What if I don't receive the email verification?
A: Check your spam folder and ensure you used the correct email. If needed, request a new verification email from your account settings.

Q: Can I change my login email after registration?
A: Yes, you can update your email address in the account settings section of your profile.