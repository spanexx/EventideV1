# Auth Page: Signup

## Overview
The signup page allows new users to create an account in the EventideV1 application.

## Key Features
- New user registration
- Email verification requirement
- Password strength validation
- Account type selection (provider vs client)

## How-to Guides
### Creating an Account
1. Enter your email address in the email field
2. Enter your name in the name field
3. Create a strong password (minimum 8 characters, including uppercase, lowercase, number)
4. Confirm your password in the confirmation field
5. Select your account type (Provider or Client)
6. Click the "Sign Up" button
7. Check your email for verification instructions

## Troubleshooting
- **Email already exists**: Try logging in instead or use a different email
- **Invalid email format**: Ensure proper email format (e.g., user@example.com)
- **Password too weak**: Follow the strength requirements shown on the form

## Technical Details
- API endpoint: `/auth/signup`
- Form validation includes email format and password strength
- Sends verification email after successful registration
- Redirects to email verification page after signup

## FAQ
Q: How long does email verification take?
A: Verification emails are sent immediately. Check your spam folder if not received within 5 minutes.

Q: What account types are available?
A: Provider (for service providers) and Client (for booking services).