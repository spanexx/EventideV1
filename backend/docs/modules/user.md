# User Module Documentation

## Overview
The User module manages user accounts, authentication, and preferences for the Eventide booking system. It provides REST APIs for user registration, authentication, profile management, and preference customization.

## Features
- User registration and authentication
- Profile management
- Preference customization
- Role-based access control
- Password reset functionality
- Google OAuth integration
- Public provider information endpoints
- Subscription tier management

## Module Structure
```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── user.schema.ts
├── user.entity.ts
├── user.preferences.ts
├── public-users.controller.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   ├── update-user-preferences.dto.ts
│   ├── user-preferences-response.dto.ts
│   └── paginated-users.dto.ts
├── users.controller.spec.ts
├── users.service.spec.ts
├── users.controller.preferences.spec.ts
└── users.service.preferences.spec.ts
```

## Data Model

### User Schema
The user schema supports different user roles and subscription tiers:

```typescript
interface User {
  email: string;
  password?: string;
  role: 'client' | 'provider' | 'admin';
  subscriptionTier: 'free' | 'premium';
  preferences: UserPreferences;
  isActive: boolean;
  googleId?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}
```

### User Preferences
Users can customize their experience with detailed preferences:

```typescript
interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  calendar: {
    defaultView: 'day' | 'week' | 'month';
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    workingHours: {
      start: string; // HH:mm format
      end: string; // HH:mm format
    };
  };
  language: string;
  timezone: string;
}
```

## API Endpoints

### User Authentication and Registration
```
POST /auth/signup
POST /auth/login
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
GET /auth/verify
GET /auth/google
GET /auth/google/callback
```

### Current User Management
```
GET /users/me
GET /users/me/preferences
PATCH /users/me/preferences
POST /users/me/preferences/reset
```

### User Administration (Admin only)
```
GET /users/:id
PATCH /users/:id
PATCH /users/:id/subscription
DELETE /users/:id
```

### Public Provider Information
```
GET /public/providers/:id
```

## Authentication
The user module implements a comprehensive authentication system:
- JWT-based authentication with refresh tokens
- Password hashing using bcrypt
- Google OAuth 2.0 integration
- Rate limiting for authentication endpoints
- Password reset with secure token generation

## Authorization
The module implements role-based access control:
- Clients: Can book appointments and manage their bookings
- Providers: Can manage availability and services
- Admins: Full system access including user management

## Preferences Management
Users can customize their experience with granular preferences:
- Notification settings (email, SMS, push)
- UI theme (light, dark, system)
- Calendar settings (default view, working hours)
- Language and timezone preferences

## Security
The user module implements multiple security measures:
- Password strength requirements
- Rate limiting on authentication endpoints
- Secure password reset with time-limited tokens
- Input validation and sanitization
- Protection against common web vulnerabilities

## Testing
The module includes comprehensive unit tests:
- Service layer testing with mocked dependencies
- Controller testing with simulated requests
- Preference management validation
- Authentication flow verification

## Future Enhancements
- Multi-factor authentication
- Social login providers (Facebook, Apple)
- User analytics and insights
- Advanced role management
- Audit logging for user actions