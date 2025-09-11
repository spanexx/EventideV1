# API Validation Protocol

This document provides systematic API validation procedures for the Eventide project, ensuring backend-frontend API compatibility and proper validation across all components.

## Usage Pattern

Reference this validation protocol using:
```bash
@api-validation.md -[component] "validation scope"
```

## Validation Flags

### `-calendar-component-apis` : Calendar Component API Validation
Example: `@api-validation.md -calendar-component-apis "validate calendar endpoints"`
- Validates calendar event CRUD operations
- Checks availability management APIs
- Verifies booking integration endpoints
- Tests real-time Socket.IO events
- Validates date/time handling consistency

### `-auth-apis` : Authentication API Validation
Example: `@api-validation.md -auth-apis "validate authentication flow"`
- Tests JWT token endpoints
- Validates Google OAuth integration
- Checks PIN-based authentication
- Verifies session management
- Tests security middleware

### `-dashboard-apis` : Dashboard API Validation
Example: `@api-validation.md -dashboard-apis "validate dashboard data"`
- Checks metrics and analytics endpoints
- Validates user preferences APIs
- Tests notification system integration
- Verifies real-time updates
- Validates data aggregation services

### `-booking-apis` : Booking System API Validation
Example: `@api-validation.md -booking-apis "validate booking flow"`
- Tests appointment creation/modification
- Validates availability checking
- Checks conflict detection
- Tests guest booking endpoints
- Verifies booking status updates

### `-payment-apis` : Payment Integration API Validation
Example: `@api-validation.md -payment-apis "validate payment processing"`
- Tests Stripe Connect integration
- Validates payment intent creation
- Checks webhook handling
- Tests transaction status updates
- Verifies refund processing

### `-ai-apis` : AI Chatbot API Validation
Example: `@api-validation.md -ai-apis "validate AI interactions"`
- Tests Google AI/Dialogflow integration
- Validates conversation flow APIs
- Checks AI usage tracking
- Tests real-time AI responses
- Verifies context management

### `-user-apis` : User Management API Validation
Example: `@api-validation.md -user-apis "validate user operations"`
- Tests user CRUD operations
- Validates profile management
- Checks preferences handling
- Tests user role management
- Verifies data privacy compliance

### `-reports-apis` : Reports API Validation
Example: `@api-validation.md -reports-apis "validate analytics data"`
- Tests report generation endpoints
- Validates data aggregation
- Checks filtering and sorting
- Tests export functionality
- Verifies performance metrics

### `-settings-apis` : Settings API Validation
Example: `@api-validation.md -settings-apis "validate configuration management"`
- Tests user preferences APIs
- Validates system configuration
- Checks theme and locale settings
- Tests calendar preferences
- Verifies notification settings

## Validation Process

### 1. Backend API Discovery
```bash
# Analyze backend controller endpoints
@deep-research.md -code "ControllerName"

# Check API documentation
@deep-research.md -text "API endpoints swagger"

# Verify route configurations
grep -r "@Controller\|@Get\|@Post\|@Put\|@Delete" backend/src --include="*.ts"
```

### 2. Frontend API Usage Analysis
```bash
# Find API service calls
@deep-research.md -code "HttpClient\|http.get\|http.post"

# Check service implementations
@deep-research.md -code "ServiceName"

# Analyze component API usage
grep -r "subscribe\|pipe\|catchError" frontend/src --include="*.ts"
```

### 3. API Contract Validation
```bash
# Check DTOs and interfaces
@deep-research.md -code "interface\|dto\|model"

# Verify request/response types
@deep-research.md -text "API request response"

# Check validation decorators
grep -r "@IsString\|@IsNumber\|@IsOptional" backend/src --include="*.ts"
```

### 4. Integration Testing
```bash
# Run backend API tests
cd backend && npm run test:e2e

# Test frontend-backend integration
cd frontend && npm run test

# Check API endpoint availability
curl -X GET http://localhost:3000/api/health
```

## Validation Checklist

### API Endpoint Validation
- [ ] **Route Definition**: Backend routes properly defined with decorators
- [ ] **HTTP Methods**: Correct HTTP methods used (GET, POST, PUT, DELETE)
- [ ] **Authentication**: Protected endpoints have proper guards
- [ ] **Authorization**: Role-based access control implemented
- [ ] **Input Validation**: DTOs with proper validation decorators
- [ ] **Error Handling**: Consistent error responses
- [ ] **Documentation**: Swagger/OpenAPI documentation complete

### Frontend Integration Validation
- [ ] **Service Layer**: API services properly implement interfaces
- [ ] **Type Safety**: TypeScript interfaces match API contracts
- [ ] **Error Handling**: Proper error handling in components
- [ ] **Loading States**: UI shows loading/error states
- [ ] **Data Transformation**: Proper data mapping between API and UI
- [ ] **Caching**: Appropriate use of HTTP caching
- [ ] **Real-time Updates**: Socket.IO events properly handled

### Data Flow Validation
- [ ] **Request Format**: Frontend sends correct request structure
- [ ] **Response Format**: Backend returns expected response structure
- [ ] **Data Types**: Type consistency between frontend and backend
- [ ] **Validation Rules**: Business rules enforced on both sides
- [ ] **Error Messages**: User-friendly error messages displayed
- [ ] **Success Feedback**: Appropriate success confirmations

### Security Validation
- [ ] **Authentication Required**: Protected endpoints require valid tokens
- [ ] **Input Sanitization**: Malicious input properly handled
- [ ] **CORS Configuration**: Cross-origin requests properly configured
- [ ] **Rate Limiting**: API rate limiting implemented where needed
- [ ] **Sensitive Data**: No sensitive data exposed in responses
- [ ] **HTTPS Only**: Production APIs use HTTPS only

## Validation Commands

### Backend API Testing
```bash
# Start backend development server
cd backend && npm run start:dev

# Run API integration tests
cd backend && npm run test:e2e

# Check API documentation
open http://localhost:3000/api/docs

# Test specific endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

### Frontend API Testing
```bash
# Start frontend development server
cd frontend && npm start

# Run frontend tests with API mocking
cd frontend && npm run test

# Check network requests in browser dev tools
# Navigate to component and monitor Network tab
```

### End-to-End Validation
```bash
# Run full application
npm run dev

# Execute Cypress E2E tests
npx cypress run

# Run Playwright tests
cd frontend && npx playwright test
```

## API Documentation Validation

### Swagger/OpenAPI Validation
```typescript
// Verify controller documentation
@Controller('calendar')
@ApiTags('calendar')
export class CalendarController {
  @Get('events')
  @ApiOperation({ summary: 'Get calendar events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(@Query() query: GetEventsDto) {
    // Implementation
  }
}
```

### DTO Validation Examples
```typescript
// Backend DTO validation
export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;
}

// Frontend interface matching
interface CreateEventRequest {
  title: string;
  startDate: string;
  description?: string;
}
```

## Common Validation Issues

### 1. Type Mismatches
```bash
# Issue: Frontend expects string, backend returns number
# Solution: Ensure DTO types match frontend interfaces
# Validation: Check both sides use consistent types
```

### 2. Missing Authentication
```bash
# Issue: Protected endpoint accessible without token
# Solution: Add @UseGuards(JwtAuthGuard) to controller methods
# Validation: Test endpoint access without authentication
```

### 3. Validation Errors
```bash
# Issue: Invalid data accepted by API
# Solution: Add proper validation decorators to DTOs
# Validation: Test with invalid input data
```

### 4. Real-time Sync Issues
```bash
# Issue: Frontend not receiving Socket.IO events
# Solution: Verify event names and payload structure
# Validation: Test real-time features end-to-end
```

## Best Practices

### 1. Contract-First Development
- Define API contracts before implementation
- Use shared types/interfaces between frontend and backend
- Maintain API documentation alongside code

### 2. Comprehensive Testing
- Unit tests for individual API endpoints
- Integration tests for API workflows
- E2E tests for complete user journeys

### 3. Error Handling Strategy
- Consistent error response format
- Meaningful error messages
- Proper HTTP status codes

### 4. Performance Considerations
- Implement request/response caching
- Use pagination for large datasets
- Optimize database queries

### 5. Security First
- Always validate input data
- Implement proper authentication/authorization
- Use HTTPS in production

## Validation Report Template

```markdown
## API Validation Report: [Component Name]

### Validation Scope
- Component: [Component Name]
- Backend Controllers: [List controllers]
- Frontend Services: [List services]
- Test Date: [Date]

### Endpoints Validated
- [ ] GET /api/[endpoint] - [Description]
- [ ] POST /api/[endpoint] - [Description]
- [ ] PUT /api/[endpoint] - [Description]
- [ ] DELETE /api/[endpoint] - [Description]

### Validation Results
#### ✅ Passing
- Authentication working correctly
- Input validation implemented
- Error handling proper

#### ⚠️ Issues Found
- Issue 1: [Description and fix]
- Issue 2: [Description and fix]

#### 🔧 Recommendations
- Recommendation 1
- Recommendation 2

### Test Coverage
- Unit Tests: [X]%
- Integration Tests: [X]%
- E2E Tests: [X]%
```

## Integration with Development Workflow

This API validation protocol integrates with:
- `@running-tests.md` for test execution
- `@deep-research.md` for code analysis
- `@mcp-tools-usage.md` for automated validation
- `@code-review-protocol.md` for quality assurance

## Quick Reference Commands

### Complete API Validation Workflow
```bash
# 1. Analyze component APIs
@api-validation.md -[component]-apis "validate endpoints"

# 2. Run backend tests
@running-tests.md # Backend E2E tests

# 3. Test frontend integration
@running-tests.md # Frontend tests

# 4. Validate end-to-end
npm run dev # Start full application
npx cypress run # Run E2E tests
```

### Emergency API Debugging
```bash
# Quick endpoint check
curl -X GET http://localhost:3000/api/health

# Check API documentation
open http://localhost:3000/api/docs

# Review recent API changes
git log --oneline --grep="api\|endpoint\|controller"
```

This validation protocol ensures robust API integration between the NestJS backend and Angular frontend, maintaining the high-quality standards expected in the Eventide project.