# Authentication API Documentation

This document provides comprehensive documentation for the Eventide backend Authentication API, including all endpoints, request/response formats, security measures, and implementation details.

## Table of Contents
1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Security Measures](#security-measures)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Testing](#testing)
8. [Integration Examples](#integration-examples)

## Overview

The Eventide Authentication API provides secure user authentication and authorization services including:
- Traditional email/password signup and login
- JWT token-based authentication
- Password reset functionality
- Google OAuth integration
- Token refresh capabilities

## Authentication Flow

### 1. Traditional Authentication
```
1. User signs up with email/password
2. User logs in with credentials
3. Server returns JWT access token
4. Client includes token in Authorization header for subsequent requests
5. Token can be refreshed when it expires
```

### 2. Google OAuth Authentication
```
1. User initiates Google OAuth flow
2. User authenticates with Google
3. Google redirects to callback endpoint
4. Server creates/updates user and returns JWT token
5. Client uses token for authenticated requests
```

## API Endpoints

### 1. Signup (`POST /api/auth/signup`)

**Description**: Creates a new user account with email and password

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "theme": "system",
    "calendar": {
      "defaultView": "week",
      "firstDayOfWeek": 1,
      "workingHours": {
        "start": "09:00",
        "end": "17:00"
      }
    },
    "language": "en",
    "timezone": "UTC"
  }
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "userId": "user-id-here",
    "email": "user@example.com"
  },
  "message": "Resource created successfully",
  "meta": {
    "timestamp": "2025-09-02T20:25:38.690Z",
    "statusCode": 201
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid input data
- 409 Conflict: Email already exists
- 429 Too Many Requests: Rate limit exceeded

### 2. Login (`POST /api/auth/login`)

**Description**: Authenticates user with email and password

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-access-token-here",
    "userId": "user-id-here",
    "expiresIn": "1h"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T20:25:44.893Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 400 Bad Request: Missing credentials
- 401 Unauthorized: Invalid credentials
- 429 Too Many Requests: Rate limit exceeded

### 3. Refresh Token (`POST /api/auth/refresh`)

**Description**: Refreshes expired access token

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "refreshToken": "expired-jwt-token"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "new-jwt-access-token",
    "userId": "user-id-here",
    "expiresIn": "1h"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T20:28:22.050Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 400 Bad Request: Missing refresh token
- 401 Unauthorized: Invalid or expired token
- 429 Too Many Requests: Rate limit exceeded

### 4. Verify Token (`GET /api/auth/verify`)

**Description**: Verifies JWT token validity

**Request Headers**:
```
Authorization: Bearer jwt-access-token
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Token is valid",
    "user": {
      "email": "user@example.com"
    }
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T20:26:04.215Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or expired token

### 5. Forgot Password (`POST /api/auth/forgot-password`)

**Description**: Initiates password reset process

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with that email, a password reset link has been sent."
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T20:29:05.447Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 429 Too Many Requests: Rate limit exceeded

### 6. Reset Password (`POST /api/auth/reset-password`)

**Description**: Resets user password using reset token

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "token": "password-reset-token",
  "newPassword": "newSecurePassword456"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully."
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T20:29:05.447Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid token or password
- 429 Too Many Requests: Rate limit exceeded

### 7. Google OAuth Initiate (`GET /api/auth/google`)

**Description**: Initiates Google OAuth authentication flow

**Response**: 302 Redirect to Google OAuth

**Error Responses**:
- 401 Unauthorized: Google authentication failed

### 8. Google OAuth Callback (`GET /api/auth/google/callback`)

**Description**: Handles Google OAuth callback (called by Google)

**Response**: 302 Redirect to frontend with JWT token

**Error Responses**:
- 401 Unauthorized: Google authentication failed

## Security Measures

### 1. Password Security
- Passwords are hashed using bcrypt with salt rounds
- Minimum password length enforced (6 characters)
- Strong password validation

### 2. JWT Token Security
- Signed JWT tokens with HMAC SHA-256
- 1-hour token expiration
- Secure token storage recommendations

### 3. Rate Limiting
See [Rate Limiting](#rate-limiting) section below

### 4. Input Validation
- DTO validation for all endpoints
- Email format validation
- Password strength requirements

### 5. Security Headers
- Helmet.js middleware for security headers
- CORS configuration
- Content Security Policy

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {
      "message": "Detailed error message",
      "error": "Error type",
      "statusCode": 400
    }
  },
  "meta": {
    "timestamp": "2025-09-02T20:35:00.000Z",
    "statusCode": 400
  }
}
```

### Common Error Codes
- `BAD_REQUEST` (400): Invalid input or missing required fields
- `UNAUTHORIZED` (401): Invalid credentials or expired token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `INTERNAL_SERVER_ERROR` (500): Server error

## Rate Limiting

### Global Defaults
- 10 requests per 60 seconds per IP address

### Endpoint-Specific Limits

| Endpoint | Limit | Time Window | Purpose |
|----------|-------|-------------|---------|
| POST /api/auth/signup | 5 requests | 1 minute | Prevent account spam |
| | 10 requests | 1 hour | Prevent sustained abuse |
| POST /api/auth/login | 5 requests | 1 minute | Prevent password guessing |
| | 10 requests | 1 hour | Prevent sustained attacks |
| POST /api/auth/refresh | 10 requests | 1 minute | Allow normal token refresh |
| POST /api/auth/forgot-password | 5 requests | 1 minute | Prevent email spam |
| POST /api/auth/reset-password | 5 requests | 1 minute | Prevent token brute force |

### Rate Limit Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Too many requests",
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests",
    "details": {
      "message": "Too many requests",
      "error": "Too Many Requests",
      "statusCode": 429
    }
  },
  "meta": {
    "timestamp": "2025-09-02T20:35:00.000Z",
    "statusCode": 429
  }
}
```

## Testing

### Automated Testing
All auth endpoints have comprehensive unit and integration tests covering:
- Success scenarios
- Error conditions
- Security validations
- Rate limiting
- Edge cases

### Manual Testing Commands

#### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

#### Token Verification
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Token Refresh
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

#### Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

#### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "RESET_TOKEN", "newPassword": "NewSecurePass456!"}'
```

#### Google OAuth
Navigate to: `http://localhost:3000/api/auth/google`

## Integration Examples

### JavaScript/TypeScript Frontend Integration

#### User Signup
```javascript
async function signup(email, password) {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Signup successful:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Signup failed:', error.message);
    throw error;
  }
}
```

#### User Login
```javascript
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store token in localStorage or secure storage
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('user_id', data.data.userId);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}
```

#### Authenticated Request
```javascript
async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  const response = await fetch(`/api${endpoint}`, mergedOptions);
  const data = await response.json();
  
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  return { response, data };
}
```

#### Token Verification
```javascript
async function verifyToken() {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error;
  }
}
```

### Mobile App Integration (React Native Example)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  static async signup(email, password) {
    try {
      const response = await fetch('YOUR_API_BASE_URL/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  }
  
  static async login(email, password) {
    try {
      const response = await fetch('YOUR_API_BASE_URL/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('access_token', data.data.access_token);
        await AsyncStorage.setItem('user_id', data.data.userId);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  }
  
  static async logout() {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user_id');
  }
  
  static async getToken() {
    return await AsyncStorage.getItem('access_token');
  }
}
```

## Best Practices

### 1. Token Management
- Store tokens securely (HTTP-only cookies or secure storage)
- Implement automatic token refresh
- Handle token expiration gracefully
- Validate tokens before making requests

### 2. Password Security
- Enforce strong password policies
- Implement password complexity requirements
- Use secure password reset mechanisms
- Hash passwords with strong algorithms

### 3. Rate Limiting Compliance
- Implement client-side rate limiting awareness
- Handle 429 responses gracefully
- Provide user-friendly error messages
- Implement exponential backoff for retries

### 4. Error Handling
- Never expose sensitive information in error messages
- Log security events appropriately
- Implement consistent error response formats
- Provide clear user feedback

### 5. Security Considerations
- Use HTTPS in production
- Implement proper CORS policies
- Sanitize all user inputs
- Regularly update dependencies
- Monitor for suspicious activities

## API Monitoring

### Health Checks
- `/api/health` - Basic health status
- `/api/health/details` - Detailed health information including memory usage

### Metrics
- Request count and response times
- Error rates and patterns
- Authentication success/failure rates
- Rate limiting events

## Troubleshooting

### Common Issues

1. **401 Unauthorized Errors**
   - Check token expiration
   - Verify token format
   - Confirm token validity with verify endpoint

2. **429 Too Many Requests**
   - Implement rate limiting awareness in client
   - Add delays between requests
   - Use exponential backoff for retries

3. **409 Conflict on Signup**
   - Check if email already exists
   - Implement email availability check

4. **Google OAuth Issues**
   - Verify Google OAuth credentials
   - Check redirect URIs in Google Console
   - Ensure proper environment configuration

### Debugging Tips

1. **Check Application Logs**
   ```bash
   npm run log
   ```

2. **Verify Health Status**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Check Detailed Health**
   ```bash
   curl http://localhost:3000/api/health/details
   ```

4. **View Recent Logs**
   ```bash
   npm run log:tail
   ```

## Support

For issues with the Authentication API, please:
1. Check the application logs using `npm run log`
2. Verify the health status endpoints
3. Review the rate limiting documentation
4. Contact the development team with detailed error information

This documentation provides comprehensive coverage of the Eventide Authentication API and should serve as a complete reference for developers integrating with the authentication system.