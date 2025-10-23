# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

Eventide is a booking and provider discovery platform with:
- Backend: NestJS (TypeScript) - Located in `backend/` directory
- Frontend: Angular - Located in `frontend/` directory

## Common Development Commands

### Backend (NestJS)
- Install dependencies: `cd backend && npm install`
- Start development server: `cd backend && npm run start:dev`
- Build: `cd backend && npm run build`
- Lint: `cd backend && npm run lint`
- Run tests: `cd backend && npm test`
- Run a single test: `cd backend && npm test -- -t "test name"`
- View logs: `cd backend && npm run log:tail`
- Seed database: `cd backend && npm run seed`

### Frontend (Angular)
- Install dependencies: `cd frontend && npm install`
- Start development server: `cd frontend && ng serve`
- Build: `cd frontend && ng build`
- Run tests: `cd frontend && ng test`

## Code Architecture

### Backend Structure
The backend follows a modular NestJS architecture:

Main modules:
- `auth/` - Authentication and authorization
- `modules/users/` - User management
- `modules/availability/` - Availability management
- `modules/booking/` - Booking functionality
- `modules/search/` - Search functionality
- `modules/dashboard/` - Dashboard features
- `modules/knowledge-base/` - Knowledge base system
- `modules/analytics/` - Analytics functionality
- `core/` - Core services including security, cache, websockets, queue processing
- `agents/` - AI agent functionality

Key services:
- Security module with rate limiting and security event tracking
- Cache module using Redis
- WebSockets for real-time communication
- Queue processing with BullMQ for background jobs
- Logging system with separate backend and browser logs

### Frontend Structure
The frontend follows an Angular modular architecture:

Main sections:
- `auth/` - Authentication flows
- `dashboard/` - Main dashboard components
- `booking/` - Booking functionality
- `provider-search/` - Provider discovery
- `components/` - Shared UI components
- `core/` - Core services and guards
- `store/` - NgRx state management

## Environment and Configuration

- Backend environment files: `.env`, `.env.development`, `.env.example`
- Frontend environment files: `src/environments/`
- Configuration validation schemas in backend

## Logging

- Backend logs: `backend/backend-logs/current.log`
- Browser logs: `backend/browser-logs/current.log`
- View logs with: `tail -100 backend/backend-logs/current.log`

## Testing

Backend uses Jest for testing with separate configurations for unit and e2e tests.
Frontend uses Karma/Jasmine for testing.

## Analytics API

The application includes an Analytics API with the following endpoints:
- `GET /api/analytics` - Retrieve analytics data for a provider
- `GET /api/analytics/report` - Generate a report in PDF or CSV format

Documentation for these endpoints can be found in `docs/ANALYTICS_API.md`.

## Development Notes

- Follow existing code style
- Add debugging logs when implementing features
- Get full context before implementing features
- Use curl for API testing with authentication when needed