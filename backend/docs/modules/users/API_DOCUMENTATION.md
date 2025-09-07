# Users API Documentation

## Overview
This document provides detailed information about the Users API endpoints available in the Eventide booking system.

## Authentication
Most user endpoints require authentication using a JWT token. The token should be included in the Authorization header as a Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

## User Endpoints

### Get Current User Profile
```
GET /api/users/me
```
Retrieves the profile information of the currently authenticated user.

**Response:**
```json
{
  "email": "user@example.com",
  "role": "provider",
  "subscriptionTier": "free",
  "isActive": true,
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://example.com/avatar.jpg",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Get Current User Preferences
```
GET /api/users/me/preferences
```
Retrieves the preferences of the currently authenticated user.

**Response:**
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
  "timezone": "UTC",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Update Current User Preferences
```
PATCH /api/users/me/preferences
```
Updates the preferences of the currently authenticated user.

**Request Body:**
```json
{
  "notifications": {
    "email": false,
    "sms": true
  },
  "theme": "dark"
}
```

**Response:**
```json
{
  "notifications": {
    "email": false,
    "sms": true,
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
  "language": "en",
  "timezone": "UTC",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Reset Current User Preferences
```
POST /api/users/me/preferences/reset
```
Resets the preferences of the currently authenticated user to system defaults.

**Response:**
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
  "timezone": "UTC",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Get User by ID
```
GET /api/users/{id}
```
Retrieves a user's public profile information by their ID. This endpoint does not require authentication.

**Response:**
```json
{
  "email": "user@example.com",
  "role": "provider",
  "subscriptionTier": "free",
  "isActive": true,
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://example.com/avatar.jpg",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Update User
```
PATCH /api/users/{id}
```
Updates a user's information. Requires authentication and appropriate permissions.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "isActive": false
}
```

**Response:**
```json
{
  "email": "newemail@example.com",
  "role": "provider",
  "subscriptionTier": "free",
  "isActive": false,
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://example.com/avatar.jpg",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Update User Subscription Tier
```
PATCH /api/users/{id}/subscription
```
Updates a user's subscription tier. Requires admin privileges.

**Request Body:**
```json
{
  "tier": "premium"
}
```

**Response:**
```json
{
  "email": "user@example.com",
  "role": "provider",
  "subscriptionTier": "premium",
  "isActive": true,
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://example.com/avatar.jpg",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Deactivate User
```
DELETE /api/users/{id}
```
Deactivates a user account. Requires admin privileges.

**Response:**
```
Status: 204 No Content
```

## Public Provider Endpoints

### Get Public Provider Information
```
GET /api/public/providers/{id}
```
Retrieves public information about a provider. This endpoint does not require authentication.

**Response:**
```json
{
  "email": "provider@example.com",
  "role": "provider",
  "subscriptionTier": "premium",
  "firstName": "Jane",
  "lastName": "Smith",
  "picture": "https://example.com/provider-avatar.jpg"
}
```

## Error Responses
The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200 OK` - The request was successful
- `201 Created` - A new resource was created successfully
- `204 No Content` - The request was successful, but there is no content to return
- `400 Bad Request` - The request was invalid or cannot be served
- `401 Unauthorized` - Authentication is required and has failed or has not yet been provided
- `403 Forbidden` - The request is valid, but the server is refusing action
- `404 Not Found` - The requested resource could not be found
- `409 Conflict` - The request could not be completed due to a conflict with the current state of the target resource
- `429 Too Many Requests` - The user has sent too many requests in a given amount of time
- `500 Internal Server Error` - An error occurred on the server while processing the request

## Rate Limiting
To ensure fair usage and system stability, the API implements rate limiting:

- Authentication endpoints: 10 requests per minute
- Preference read operations: 100 requests per minute
- Preference update operations: 30 requests per minute
- Other endpoints: 1000 requests per minute

When a rate limit is exceeded, the API returns a 429 status code with a message indicating how long to wait before making another request.