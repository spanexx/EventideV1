# Eventide Project Context

## Project Overview

Eventide is an AI-powered, enterprise-grade booking platform designed for service providers. It enables businesses to manage appointments, define real-time availability, and process payments seamlessly. The system features a unique PIN-based authentication for providers and a flexible guest booking system accessible via shareable links. A premium, AI-powered chatbot assistant allows guests to book appointments through natural conversation, bypassing traditional forms.

This project follows a monorepo structure using Nx, with a NestJS backend and an Angular frontend. We will be using REST API instead of GraphQL.

For detailed project planning and development phases, see [Event.md](Event.md).

## Technical Architecture

- **Monorepo**: Nx
- **Frontend**: Angular, NgRx (State Management), REST API Client, Socket.IO Client, Tailwind CSS
- **Backend**: NestJS, REST API, WebSockets (Socket.IO)
- **Databases**: MongoDB (via Mongoose)
- **Payment Gateway**: Stripe Connect
- **AI & NLU**: Google Dialogflow (or similar)
- **Deployment**: Docker, Kubernetes, Terraform, GitHub Actions for CI/CD

## Backend Structure

The backend is built with NestJS and follows a modular architecture. Key components include:

- **Authentication**: PIN-based authentication system with JWT tokens
- **Security**: Rate limiting, CORS policies, and security headers
- **Database**: MongoDB integration with Mongoose for data management
- **Caching**: Redis-based caching for improved performance
- **Metrics**: Prometheus integration for monitoring
- **Sessions**: Session management for tracking user activity
- **Users**: User management module

## Key Backend Files and Directories

- `src/main.ts`: Application entry point with core setup (Swagger, CORS, global pipes/filters)
- `src/app.module.ts`: Root module importing all feature modules
- `src/auth/`: Authentication module with guards, services, and strategies
- `src/modules/users/`: User management module
- `src/core/`: Core functionality including security, cache, metrics, and sessions
- `package.json`: Defines dependencies and scripts for the backend

## Development Environment Setup

1. Install Node.js (version specified in `.nvmrc` if available)
2. Navigate to the `backend` directory
3. Run `npm install` to install dependencies
4. Create a `.env` file based on `.env.example` with required environment variables
5. Ensure MongoDB is running (local or remote)

## Building and Running the Backend

- **Development Mode**: `npm run start:dev` - Starts the application in watch mode
- **Production Mode**: `npm run build` followed by `npm run start:prod` - Builds and runs the application
- **Debug Mode**: `npm run start:debug` - Starts the application in debug mode with inspection

## Testing

- **Unit Tests**: `npm run test` - Runs Jest unit tests
- **Watch Mode**: `npm run test:watch` - Runs tests in watch mode
- **Coverage**: `npm run test:cov` - Runs tests with coverage report
- **E2E Tests**: `npm run test:e2e` - Runs end-to-end tests

## Linting and Formatting

- **Lint**: `npm run lint` - Runs ESLint to check for code style issues
- **Format**: `npm run format` - Uses Prettier to format code

## Logging

- **View Logs**: `npm run log` - View application logs (requires PM2)
- **Tail Logs**: `npm run log:tail` - Follow log output in real-time
- **Clean Logs**: `npm run log:clean` - Remove old log files

## API Documentation

Swagger documentation is available at `/api` when the application is running.

## Environment Variables

Key environment variables are defined in `.env.example` and validated using `@nestjs/config`. Critical variables include:

- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `FRONTEND_URL`: Allowed CORS origin for frontend requests
- `THROTTLE_TTL`: Rate limiting time-to-live (default: 60 seconds)
- `THROTTLE_LIMIT`: Rate limiting requests per TTL (default: 10 requests)

## Development Commands and Tools

The project includes a comprehensive set of development commands and tools documented in the `commands/` directory. These commands help with various aspects of development:

### Core Development Commands

- **Building**: `@building-the-project.md` - Instructions for building the application
- **Testing**: `@running-tests.md` - Instructions for running tests
- **Linting**: `@running-linters.md` - Instructions for running linters
- **TODO Management**: `@find-todos.md` - Find and manage TODO comments in the codebase

### Planning and Research

- **Planning Workflow**: `@planning-workflow.md` - Systematic approach to planning and context gathering
- **Deep Research**: `@deep-research.md` - Conduct deep analysis of codebase components
- **API Validation**: `@api-validation.md` - Comprehensive API validation between backend and frontend

### Tool Usage

- **MCP Tools**: `@mcp-tools-usage.md` - Comprehensive guide for using MCP tools effectively
- **Command Line Guide**: `@command-line-guide.md` - Platform-specific command line execution instructions
- **Execution Guide**: `@execution-guide.md` - Complete execution instructions for all development commands

### Project Management

- **Project Planning**: `@project-planning-protocol.md` - Systematic approach to project planning
- **Code Review**: `@code-review-protocol.md` - Standardized process for conducting code reviews
- **Command Management**: `@command-management.md` - Instructions for managing and organizing command documentation

For detailed information on any of these commands, refer to the specific documentation files in the `commands/` directory.