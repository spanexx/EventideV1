# Project Overview

This is a full-stack web application with a NestJS backend and an Angular frontend.

**Backend (NestJS):**

*   **Framework:** NestJS, a progressive Node.js framework.
*   **Language:** TypeScript
*   **Package Manager:** npm
*   **Key Dependencies:**
    *   `@nestjs/core`: Core NestJS framework
    *   `@nestjs/mongoose`: MongoDB object modeling
    *   `@nestjs/jwt`: JSON Web Token implementation
    *   `@nestjs/passport`: Authentication strategies
    *   `passport-google-oauth20`: Google OAuth 2.0 authentication strategy
*   **Testing:** Jest for unit and end-to-end testing.

**Frontend (Angular):**

*   **Framework:** Angular
*   **Language:** TypeScript
*   **Package Manager:** npm
*   **Key Dependencies:**
    *   `@angular/core`: Core Angular framework
    *   `@angular/router`: Routing functionality
    *   `rxjs`: Reactive programming library
*   **Testing:** Karma and Jasmine for unit testing.

# Building and Running

## Backend

**Installation:**

```bash
cd backend
npm install
```

**Running the application:**

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```

**Running tests:**

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Frontend

**Installation:**

```bash
cd frontend
npm install
```

**Running the application:**

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

**Building the application:**

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

**Running tests:**

```bash
# Unit tests
ng test
```

# Development Conventions

*   **Backend:** The backend follows the standard NestJS project structure. It uses decorators for routing, dependency injection, and other features. The code is organized into modules, with each module representing a specific feature or domain.
*   **Frontend:** The frontend follows the standard Angular project structure. It uses components, services, and modules to create a modular and maintainable application.
*   **Coding Style:** Both the backend and frontend use Prettier for code formatting. The configuration files are located in the respective `backend` and `frontend` directories.
