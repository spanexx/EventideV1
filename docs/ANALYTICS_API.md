# Analytics API Documentation

This document describes the Analytics API endpoints available in the EventideV1 application.

## Overview

The Analytics API provides endpoints for retrieving analytics data and generating reports for providers. All endpoints require authentication using a valid JWT token.

## Base URL

```
http://localhost:3000/api/analytics
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Get Analytics Data

Retrieves analytics data for a provider within a specified date range.

```
GET /api/analytics
```

#### Query Parameters

| Parameter | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| startDate | string | No       | Start date (ISO 8601)    |
| endDate   | string | No       | End date (ISO 8601)      |

If no date range is provided, the API will return data for the last 30 days.

#### Response

```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalBookings": 42,
      "revenue": 2450.00,
      "cancellations": 3,
      "occupancyRate": 78
    },
    "revenueData": {
      "daily": [
        { "date": "2025-10-01T00:00:00.000Z", "amount": 150 }
      ],
      "weekly": [
        { "date": "2025-09-28T00:00:00.000Z", "amount": 1200 }
      ],
      "monthly": [
        { "date": "2025-10-01T00:00:00.000Z", "amount": 5000 }
      ]
    },
    "occupancyData": {
      "daily": [
        { "date": "2025-10-01T00:00:00.000Z", "rate": 65 }
      ],
      "weekly": [
        { "date": "2025-09-28T00:00:00.000Z", "rate": 68 }
      ],
      "monthly": [
        { "date": "2025-10-01T00:00:00.000Z", "rate": 70 }
      ]
    },
    "bookingTrends": [
      { "date": "2025-10-01T00:00:00.000Z", "count": 5 }
    ]
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-10-22T17:15:47.035Z",
    "statusCode": 200
  }
}
```

### Generate Report

Generates a report in the specified format for a provider within a specified date range.

```
GET /api/analytics/report
```

#### Query Parameters

| Parameter  | Type   | Required | Description              |
|------------|--------|----------|--------------------------|
| startDate  | string | Yes      | Start date (ISO 8601)    |
| endDate    | string | Yes      | End date (ISO 8601)      |
| reportType | string | Yes      | Report format (pdf,csv)  |

#### Response

```json
{
  "success": true,
  "data": {
    "type": "pdf",
    "data": "Report for provider_id from Wed Oct 01 2025 to Wed Oct 22 2025\nReport type: pdf"
  },
  "message": "Request successful",
  "meta": {
    "timestamp": "2025-10-22T17:15:53.603Z",
    "statusCode": 200
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "success": false,
  "data": null,
  "message": "Unauthorized",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized",
    "details": {
      "message": "Unauthorized",
      "statusCode": 401
    }
  },
  "meta": {
    "timestamp": "2025-10-22T17:15:42.195Z",
    "statusCode": 401
  }
}
```

### 400 Bad Request

```json
{
  "success": false,
  "data": null,
  "message": "Bad Request",
  "error": {
    "code": "BAD_REQUEST",
    "message": "Bad Request",
    "details": {
      "message": "Bad Request",
      "statusCode": 400
    }
  },
  "meta": {
    "timestamp": "2025-10-22T17:15:42.195Z",
    "statusCode": 400
  }
}
```

## Implementation Details

The Analytics API is implemented using the following components:

1. **AnalyticsModule** - NestJS module that provides the analytics functionality
2. **AnalyticsController** - Controller that handles HTTP requests
3. **AnalyticsService** - Service that contains the business logic for analytics
4. **AnalyticsDataDto** - DTO for the analytics data response
5. **AnalyticsQueryDto** - DTO for the analytics query parameters
6. **ReportQueryDto** - DTO for the report query parameters

The frontend analytics dashboard consumes these endpoints through:
1. **AnalyticsService** - Angular service that makes HTTP requests
2. **AnalyticsEffects** - NgRx effects that handle API interactions
3. **AnalyticsActions** - NgRx actions for analytics state management
4. **AnalyticsReducers** - NgRx reducers for updating state
5. **AnalyticsSelectors** - NgRx selectors for accessing state