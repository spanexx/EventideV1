# EventideV1 Project

## Project Overview

EventideV1 is a full-stack web application built with the following architecture:

1. **Backend**: NestJS-based API server with MongoDB as the database
2. **Frontend**: Angular application with Material Design components
3. **AI Component**: LangGraph-based AI processing layer for intelligent workflows
4. **Comprehensive Planning**: Structured planning directory with architecture, performance, features, quality, UX, and timeline considerations

The application appears to be a scheduling or booking system with user management, availability management, authentication, and real-time features. Key features include:
- User authentication and management
- Availability scheduling functionality
- Real-time communication via WebSockets
- Browser and backend logging capabilities
- Rate limiting and security features
- API documentation via Swagger

## Project Structure

```
├── backend/            # NestJS API server
├── frontend/           # Angular frontend application  
├── langGraph/          # AI workflow processing with LangGraph
├── logs/               # Log files directory
├── PLAN/               # Project planning and architecture documents
├── node_modules/       # Dependencies
├── .git/               # Git repository
└── .qoder/             # Qwen Code project context
```

### Backend (NestJS)
- **Framework**: NestJS v11.x with TypeScript
- **Database**: MongoDB integration with Mongoose
- **Authentication**: JWT, Google OAuth20, passport
- **Security**: Helmet, rate limiting (throttler), CORS
- **Features**: 
  - User management
  - Availability scheduling
  - Authentication with JWT and OAuth
  - Real-time features via WebSockets
  - Browser and backend logging systems
  - Caching with Redis
  - API documentation with Swagger
  - Task scheduling with @nestjs/schedule

### Frontend (Angular)
- **Framework**: Angular v20.x with TypeScript
- **UI Components**: Angular Material
- **State Management**: NgRx
- **Calendar**: FullCalendar integration
- **Charts**: Chart.js with ng2-charts
- **Real-time**: Socket.io client for WebSocket communication

### LangGraph (AI Layer)
- **Framework**: LangGraph/LangChain for AI workflow processing
- **Features**: State management, node-based processing, workflow orchestration
- **AI Integration**: Google Generative AI integration

### Planning Directory (PLAN/)
- **01-ARCHITECTURE**: Architecture planning documents
- **02-PERFORMANCE**: Performance optimization plans
- **03-FEATURES**: Feature development plans  
- **04-QUALITY**: Quality assurance documents
- **05-UX**: User experience design plans
- **06-TIMELINE**: Project timeline and milestones

## Building and Running

### Backend
```bash
# Navigate to backend directory
cd backend/

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build the application
npm run build

# Run in development mode
npm run start:dev

# Run in production mode
npm run start:prod

# Run tests
npm test
npm run test:e2e
```

### Frontend
```bash
# Navigate to frontend directory
cd frontend/

# Install dependencies
npm install

# Run in development mode
npm run start

# Build for production
npm run build

# Run tests
npm run test
```

### LangGraph (AI Component)
```bash
# Navigate to langGraph directory
cd langGraph/

# Install dependencies
npm install

# Run the example
npm start
# or
node index.js

# Run in development mode (with auto-restart)
npm run dev
```

### Environment Configuration
- **Backend**: Copy `.env.example` to `.env` in the backend directory
- **Frontend**: Environment files located in `src/environments/`

## Development Conventions

### Backend (NestJS)
- Code follows NestJS best practices with modules, controllers, and services
- Uses TypeScript with strict typing
- Implements proper error handling with global exception filters
- Uses interceptors for request/response transformation
- Implements validation pipes for request validation
- Uses decorators for routing and authentication
- Implements security best practices (helmet, CORS, rate limiting)

### Frontend (Angular)
- Uses Angular Material for UI components
- Implements NgRx for state management
- Uses SCSS for styling
- Implements responsive design principles
- Uses Angular routing for navigation
- Implements proper component architecture with services

### Code Quality
- **Backend**: ESLint and Prettier for code formatting
- **Frontend**: ESLint and Prettier with specific configuration
- **Tests**: Jest for backend testing, Karma/Jasmine for frontend testing
- **Documentation**: Swagger API documentation

### Architecture Patterns
- **Backend**: Clean architecture with modules, services, DTOs
- **Frontend**: Component-based architecture with services
- **AI Layer**: State-based workflow patterns with LangGraph

## Key Technologies

### Backend
- Node.js / TypeScript
- NestJS framework
- MongoDB with Mongoose ODM
- JWT authentication
- Passport for authentication strategies
- Socket.IO for real-time communication
- Redis for caching
- Swagger for API documentation
- Google Cloud Storage integration

### Frontend
- Angular framework
- Angular Material components
- NgRx for state management
- FullCalendar for scheduling
- Chart.js for data visualization
- Socket.io-client for WebSocket communication

### AI/ML
- LangGraph for workflow orchestration
- Google Generative AI
- LangChain for AI integration

### Development Tools
- PM2 for production process management
- ESLint for linting
- Prettier for code formatting
- Jest/Karma for testing
- TypeScript for type safety