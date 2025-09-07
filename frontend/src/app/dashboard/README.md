# Eventide Dashboard Module

## Overview
The dashboard module is the central hub for service providers to manage their business operations. It provides real-time visibility into bookings, availability management, analytics, and other key business metrics.

## Module Structure
```
src/app/dashboard/
├── dashboard-routing.module.ts
├── dashboard.component.ts|.html|.scss
├── dashboard.module.ts
├── components/
│   ├── header/
│   ├── sidebar/
│   └── (shared components)
├── pages/
│   ├── overview/
│   ├── availability/
│   ├── bookings/
│   ├── analytics/
│   └── settings/
├── services/
│   ├── dashboard.service.ts
│   ├── mock-dashboard.service.ts
│   ├── booking.service.ts
│   ├── availability.service.ts
│   └── analytics.service.ts
├── store/
│   ├── actions/
│   ├── reducers/
│   ├── effects/
│   └── selectors/
└── models/
    ├── dashboard.models.ts
    ├── booking.models.ts
    └── availability.models.ts
```

## Key Features
1. **Provider Hub** - Main dashboard for business management
2. **Smart Calendar Management** - Availability scheduling interface
3. **Real-time Booking Updates** - Live booking notifications
4. **Analytics & Reporting** - Business performance metrics
5. **Subscription Management** - Premium feature access
6. **AI Assistant Integration** - Chatbot interface for premium users

## State Management
The dashboard uses NgRx for state management with the following feature states:
- Dashboard stats
- Recent activity
- Bookings
- Availability
- Analytics data

## Services
- **DashboardService** - Main service for dashboard data
- **MockDashboardService** - Mock service for development
- **BookingService** - Service for booking management
- **AvailabilityService** - Service for availability management
- **AnalyticsService** - Service for analytics data
- **DashboardSocketService** - Service for real-time WebSocket updates

## Routing
The dashboard module uses lazy loading with the following routes:
- `/dashboard/overview` - Dashboard overview page
- `/dashboard/availability` - Availability management
- `/dashboard/bookings` - Bookings management
- `/dashboard/analytics` - Business analytics
- `/dashboard/settings` - Account settings

## Authentication
The dashboard is protected by an authentication guard that ensures only logged-in users can access it.

## Real-time Updates
The dashboard uses WebSocket connections for real-time updates on bookings and availability changes.

## Development
To run the dashboard module:
1. Ensure all dependencies are installed (`npm install`)
2. Run the development server (`ng serve`)
3. Navigate to `http://localhost:4200/dashboard/overview`

## Testing
Unit tests are provided for all components and services. Run tests with:
```
ng test
```