# User API Documentation

This document provides comprehensive documentation for the Eventide backend User API, including all endpoints, request/response formats, security measures, and implementation details.

## Table of Contents
1. [Overview](#overview)
2. [User Data Model](#user-data-model)
3. [API Endpoints](#api-endpoints)
4. [Authentication and Authorization](#authentication-and-authorization)
5. [Preferences Management](#preferences-management)
6. [Security Measures](#security-measures)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Testing](#testing)
10. [Integration Examples](#integration-examples)

## Overview

The Eventide User API provides comprehensive user management services including:
- User profile retrieval and updates
- User preferences management
- Public user information
- Admin-level user management
- Role-based access control

## User Data Model

### User Schema
```typescript
interface User {
  _id: string;
  email: string;
  role: 'provider' | 'client' | 'admin';
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

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

### 1. Get Current User Profile (`GET /api/users/me`)

**Description**: Retrieves the profile information of the currently authenticated user

**Authentication**: Required - JWT Bearer Token

**Request Headers**:
```
Authorization: Bearer jwt-access-token
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "68b752c2eee2717754d75337",
    "email": "user@example.com",
    "role": "provider",
    "subscriptionTier": "free",
    "isActive": true,
    "createdAt": "2025-09-02T20:25:38.011Z",
    "updatedAt": "2025-09-02T21:04:14.554Z",
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
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:02:47.338Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token
- 404 Not Found: User not found

### 2. Get Current User Preferences (`GET /api/users/me/preferences`)

**Description**: Retrieves only the preferences of the currently authenticated user

**Authentication**: Required - JWT Bearer Token

**Request Headers**:
```
Authorization: Bearer jwt-access-token
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
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
    "timezone": "UTC",
    "updatedAt": "2025-09-02T21:03:14.240Z"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:03:14.241Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token
- 404 Not Found: User not found

### 3. Update User Preferences (`PATCH /api/users/me/preferences`)

**Description**: Updates the preferences of the currently authenticated user

**Authentication**: Required - JWT Bearer Token

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer jwt-access-token
```

**Request Body**:
```json
{
  "theme": "dark",
  "language": "es",
  "notifications": {
    "email": false
  }
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": {
      "email": false,
      "sms": false,
      "push": true
    },
    "theme": "dark",
    "calendar": {
      "defaultView": "week",
      "firstDayOfWeek": 1,
      "workingHours": {
        "start": "09:00",
        "end": "17:00"
      }
    },
    "language": "es",
    "timezone": "UTC",
    "updatedAt": "2025-09-02T21:03:44.294Z"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:03:44.295Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid preference data
- 401 Unauthorized: Invalid or missing JWT token
- 404 Not Found: User not found
- 429 Too Many Requests: Rate limit exceeded

### 4. Reset User Preferences (`POST /api/users/me/preferences/reset`)

**Description**: Resets the preferences of the currently authenticated user to default values

**Authentication**: Required - JWT Bearer Token

**Request Headers**:
```
Authorization: Bearer jwt-access-token
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
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
    "timezone": "UTC",
    "updatedAt": "2025-09-02T21:04:14.555Z"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:04:14.556Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing JWT token
- 404 Not Found: User not found
- 429 Too Many Requests: Rate limit exceeded

### 5. Get User by ID (`GET /api/users/:id`)

**Description**: Retrieves the profile information of a specific user by ID (public endpoint with limited information)

**Authentication**: Not required for public information

**Request Parameters**:
- `id` (string, required): User ID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "68b752c2eee2717754d75337",
    "email": "user@example.com",
    "role": "provider",
    "subscriptionTier": "premium",
    "isActive": true,
    "createdAt": "2025-09-02T20:25:38.011Z",
    "updatedAt": "2025-09-02T21:05:30.385Z",
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
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:05:07.091Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 404 Not Found: User with specified ID not found

### 6. Update User (`PATCH /api/users/:id`)

**Description**: Updates a specific user's information (authenticated user can only update their own profile, admins can update any user)

**Authentication**: Required - JWT Bearer Token

**Request Parameters**:
- `id` (string, required): User ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer jwt-access-token
```

**Request Body**:
```json
{
  "subscriptionTier": "premium"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "68b752c2eee2717754d75337",
    "email": "user@example.com",
    "role": "provider",
    "subscriptionTier": "premium",
    "isActive": true,
    "createdAt": "2025-09-02T20:25:38.011Z",
    "updatedAt": "2025-09-02T21:05:30.385Z",
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
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:05:30.386Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid update data
- 401 Unauthorized: Invalid or missing JWT token
- 403 Forbidden: Insufficient permissions to update this user
- 404 Not Found: User with specified ID not found

### 7. Get Public Provider (`GET /api/public/providers/:id`)

**Description**: Retrieves public information about a provider (limited information exposure)

**Authentication**: Not required

**Request Parameters**:
- `id` (string, required): Provider ID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "68b752c2eee2717754d75337",
    "email": "user@example.com",
    "role": "provider",
    "subscriptionTier": "premium"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:05:50.132Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 404 Not Found: Provider with specified ID not found

### 8. Update User Subscription Tier (`PATCH /api/users/:id/subscription`)

**Description**: Updates a user's subscription tier (admin-only endpoint)

**Authentication**: Required - JWT Bearer Token with Admin role

**Request Parameters**:
- `id` (string, required): User ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer jwt-access-token
```

**Request Body**:
```json
{
  "tier": "enterprise"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "68b752c2eee2717754d75337",
    "email": "user@example.com",
    "role": "provider",
    "subscriptionTier": "enterprise",
    "isActive": true,
    "createdAt": "2025-09-02T20:25:38.011Z",
    "updatedAt": "2025-09-02T21:05:30.385Z"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-09-02T21:05:30.386Z",
    "statusCode": 200
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid subscription tier
- 401 Unauthorized: Invalid or missing JWT token
- 403 Forbidden: Insufficient permissions (admin required)
- 404 Not Found: User with specified ID not found

## Authentication and Authorization

### JWT Token Requirements
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Role-Based Access Control
- **Providers/Clients**: Can access their own profile and preferences
- **Admins**: Can access and modify any user's information and subscription tiers

### Token Validation
Tokens are validated using the standard JWT authentication guard. Expired or invalid tokens will result in 401 Unauthorized responses.

## Preferences Management

### Preference Structure
User preferences are organized into logical groups:
1. **Notifications**: Email, SMS, and push notification preferences
2. **Theme**: UI theme selection (light, dark, system)
3. **Calendar**: Calendar view preferences and working hours
4. **Language**: User interface language
5. **Timezone**: User's timezone preference

### Updating Preferences
Preferences can be updated partially - only the provided fields will be updated. For example:
```json
{
  "theme": "dark",
  "notifications": {
    "email": false
  }
}
```
This will update only the theme and email notification preference, leaving all other preferences unchanged.

### Default Preferences
When preferences are reset, the following defaults are applied:
```json
{
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
```

## Security Measures

### 1. Authentication
- JWT token-based authentication for all protected endpoints
- Secure token validation with expiration checking
- Automatic token refresh support

### 2. Authorization
- Role-based access control
- User-specific data access restrictions
- Admin-only endpoints for sensitive operations

### 3. Data Protection
- Sensitive fields (passwords, tokens) removed from API responses
- Input validation for all update operations
- Proper error handling without information leakage

### 4. Rate Limiting
See [Rate Limiting](#rate-limiting) section below

### 5. Input Validation
- DTO validation for all request bodies
- Type checking for all parameters
- Sanitization of user inputs

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
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `INTERNAL_SERVER_ERROR` (500): Server error

## Rate Limiting

### Global Defaults
- 10 requests per 60 seconds per IP address

### Endpoint-Specific Limits

| Endpoint | Limit | Time Window | Purpose |
|----------|-------|-------------|---------|
| GET /api/users/me/preferences | 100 requests | 1 minute | Allow frequent preference reads |
| PATCH /api/users/me/preferences | 30 requests | 1 minute | Allow moderate preference updates |
| | 10 requests | 10 seconds | Allow quick successive changes |
| POST /api/users/me/preferences/reset | 5 requests | 1 minute | Prevent excessive resets |
| All other endpoints | Global default | 1 minute | Standard rate limiting |

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
All user endpoints have comprehensive unit and integration tests covering:
- Success scenarios
- Error conditions
- Security validations
- Rate limiting
- Role-based access control
- Data validation

### Manual Testing Commands

#### Get Current User Profile
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get User Preferences
```bash
curl -X GET http://localhost:3000/api/users/me/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update User Preferences
```bash
curl -X PATCH http://localhost:3000/api/users/me/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"theme": "dark", "language": "es"}'
```

#### Reset User Preferences
```bash
curl -X POST http://localhost:3000/api/users/me/preferences/reset \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get User by ID
```bash
curl -X GET http://localhost:3000/api/users/USER_ID
```

#### Update User
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"subscriptionTier": "premium"}'
```

#### Get Public Provider
```bash
curl -X GET http://localhost:3000/api/public/providers/PROVIDER_ID
```

## Integration Examples

### JavaScript/TypeScript Frontend Integration

#### Get User Profile
```javascript
async function getUserProfile() {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error.message);
    throw error;
  }
}
```

#### Update User Preferences
```javascript
async function updateUserPreferences(preferences) {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/users/me/preferences', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to update preferences:', error.message);
    throw error;
  }
}
```

#### Reset User Preferences
```javascript
async function resetUserPreferences() {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/users/me/preferences/reset', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to reset preferences:', error.message);
    throw error;
  }
}
```

### Mobile App Integration (React Native Example)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class UserService {
  static async getUserProfile() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch('YOUR_API_BASE_URL/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
  
  static async getUserPreferences() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch('YOUR_API_BASE_URL/api/users/me/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
  
  static async updateUserPreferences(preferences) {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch('YOUR_API_BASE_URL/api/users/me/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
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
  
  static async resetUserPreferences() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch('YOUR_API_BASE_URL/api/users/me/preferences/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
}
```

## Best Practices

### 1. User Data Management
- Always validate user inputs before updating preferences
- Implement proper error handling for user-facing operations
- Use partial updates to minimize data transfer
- Cache frequently accessed user data when appropriate

### 2. Preference Handling
- Allow users to reset preferences to defaults
- Provide clear UI for managing notification preferences
- Validate calendar working hours format (HH:mm)
- Support common timezone identifiers

### 3. Security Considerations
- Never expose sensitive user information in API responses
- Implement proper role-based access control
- Use HTTPS in production environments
- Sanitize all user inputs
- Implement rate limiting to prevent abuse

### 4. Performance Optimization
- Implement caching for frequently accessed user data
- Use pagination for endpoints that return lists
- Optimize database queries for user-related operations
- Monitor API response times and resource usage

### 5. Error Handling
- Provide user-friendly error messages
- Log security-related events appropriately
- Implement graceful degradation for non-critical failures
- Use consistent error response formats

## API Monitoring

### Health Checks
- `/api/health` - Basic health status
- `/api/health/details` - Detailed health information including memory usage

### Metrics
- User profile access frequency
- Preference update frequency
- Error rates and patterns
- Authentication success/failure rates
- Rate limiting events

## Troubleshooting

### Common Issues

1. **401 Unauthorized Errors**
   - Check token expiration
   - Verify token format
   - Confirm token validity with auth service

2. **403 Forbidden Errors**
   - Check user roles and permissions
   - Verify access to requested resource
   - Confirm admin privileges for admin-only endpoints

3. **429 Too Many Requests**
   - Implement rate limiting awareness in client
   - Add delays between requests
   - Use exponential backoff for retries

4. **404 Not Found**
   - Verify user ID exists
   - Check endpoint URL correctness
   - Confirm user is active

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

For issues with the User API, please:
1. Check the application logs using `npm run log`
2. Verify the health status endpoints
3. Review the rate limiting documentation
4. Contact the development team with detailed error information

This documentation provides comprehensive coverage of the Eventide User API and should serve as a complete reference for developers integrating with the user management system.