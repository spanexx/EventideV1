# API Documentation Guide

This document outlines the process for creating, maintaining, and updating API documentation for the EventideV1 project.

## Documentation Standards

### OpenAPI Specification
- **Version**: 3.0.3
- **Format**: YAML
- **Location**: `/docs/api/openapi.yaml`
- **Validation**: Swagger Editor compliance

### Documentation Structure
```
docs/
├── api/
│   ├── openapi.yaml          # Main API specification
│   ├── schemas/              # Reusable schema definitions
│   │   ├── user.yaml
│   │   ├── booking.yaml
│   │   └── common.yaml
│   ├── paths/                # Endpoint definitions
│   │   ├── auth.yaml
│   │   ├── users.yaml
│   │   └── bookings.yaml
│   └── examples/             # Request/response examples
│       ├── auth-examples.yaml
│       └── booking-examples.yaml
```

## API Documentation Process

### 1. Planning New Endpoints
```yaml
# Before implementation, define in OpenAPI
paths:
  /api/v1/users:
    post:
      summary: Create a new user
      description: Creates a new user account
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
```

### 2. Schema Definitions
```yaml
# schemas/user.yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - firstName
        - lastName
        - createdAt
      properties:
        id:
          type: string
          format: uuid
          description: Unique user identifier
        email:
          type: string
          format: email
          description: User email address
        firstName:
          type: string
          minLength: 2
          maxLength: 50
          description: User's first name
        lastName:
          type: string
          minLength: 2
          maxLength: 50
          description: User's last name
        createdAt:
          type: string
          format: date-time
          description: Account creation timestamp
```

### 3. Endpoint Documentation
```yaml
# paths/users.yaml
paths:
  /api/v1/users:
    get:
      summary: List users
      description: Retrieve a paginated list of users
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: List of users retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
```

## Code-First Documentation

### Swagger Decorators
```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided information'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data',
    type: ValidationErrorDto 
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Implementation
  }
}
```

### DTO Documentation
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email'
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 50
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50
  })
  lastName: string;
}
```

## Documentation Generation

### Automated Generation
```bash
# Generate OpenAPI spec from code
npm run docs:generate

# Serve documentation locally
npm run docs:serve

# Validate OpenAPI spec
npm run docs:validate
```

### Build Scripts
```json
{
  "scripts": {
    "docs:generate": "swagger-jsdoc -d swagger.config.js -o docs/api/openapi.yaml",
    "docs:serve": "swagger-ui-serve docs/api/openapi.yaml",
    "docs:validate": "swagger-codegen validate -i docs/api/openapi.yaml"
  }
}
```

## Documentation Maintenance

### Version Control
- Keep documentation in sync with code changes
- Use semantic versioning for API versions
- Tag documentation releases
- Maintain changelog for API changes

### Review Process
1. **Code Review**: Include documentation updates in PRs
2. **Technical Review**: Verify accuracy of examples
3. **User Testing**: Validate clarity for API consumers
4. **Regular Audits**: Quarterly documentation reviews

## API Versioning

### Version Strategy
```yaml
# URL versioning
/api/v1/users
/api/v2/users

# Header versioning
Accept: application/vnd.eventide.v1+json
Accept: application/vnd.eventide.v2+json
```

### Version Documentation
```yaml
info:
  title: Eventide API
  version: 1.2.0
  description: Event booking and management API
  contact:
    name: API Support
    email: api-support@eventide.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
```

## Error Documentation

### Error Response Schema
```yaml
components:
  schemas:
    ErrorResponse:
      type: object
      required:
        - error
        - message
        - timestamp
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        timestamp:
          type: string
          format: date-time
          description: Error occurrence timestamp
        details:
          type: object
          description: Additional error details
```

### Error Examples
```yaml
responses:
  '400':
    description: Bad Request
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
        examples:
          validation_error:
            summary: Validation Error
            value:
              error: 'VALIDATION_ERROR'
              message: 'Invalid input data'
              timestamp: '2024-01-15T10:30:00Z'
              details:
                field: 'email'
                reason: 'Invalid email format'
```

## Authentication Documentation

### Security Schemes
```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

### Security Requirements
```yaml
paths:
  /api/v1/users:
    get:
      security:
        - BearerAuth: []
      # ... endpoint definition
```

## Interactive Documentation

### Swagger UI Configuration
```typescript
// swagger.config.ts
export const swaggerConfig = new DocumentBuilder()
  .setTitle('Eventide API')
  .setDescription('Event booking and management API')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Authentication', 'User authentication endpoints')
  .addTag('Users', 'User management endpoints')
  .addTag('Bookings', 'Booking management endpoints')
  .build();
```

### Custom Styling
```css
/* Custom Swagger UI styles */
.swagger-ui .topbar {
  background-color: #2c3e50;
}

.swagger-ui .info .title {
  color: #2c3e50;
}
```

## Testing Documentation

### API Testing Examples
```yaml
# examples/auth-examples.yaml
examples:
  login_success:
    summary: Successful login
    value:
      email: "user@example.com"
      password: "password123"
  login_failure:
    summary: Failed login
    value:
      email: "user@example.com"
      password: "wrongpassword"
```

### Postman Collection
```json
{
  "info": {
    "name": "Eventide API",
    "description": "Complete API collection for Eventide",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/v1/auth/login"
          }
        }
      ]
    }
  ]
}
```

## Documentation Tools

### Required Tools
- **Swagger Editor**: For editing OpenAPI specs
- **Swagger UI**: For interactive documentation
- **Swagger Codegen**: For generating client SDKs
- **Postman**: For API testing and collection management

### Integration
```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Eventide API')
  .setDescription('Event booking and management API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

## Quality Assurance

### Documentation Checklist
- [ ] All endpoints documented
- [ ] Request/response schemas defined
- [ ] Error responses documented
- [ ] Authentication requirements specified
- [ ] Examples provided for all endpoints
- [ ] Version information accurate
- [ ] Links and references working

### Validation
```bash
# Validate OpenAPI specification
swagger-codegen validate -i docs/api/openapi.yaml

# Check for missing examples
swagger-codegen validate -i docs/api/openapi.yaml --check-examples

# Generate client SDKs
swagger-codegen generate -i docs/api/openapi.yaml -l typescript-axios -o clients/typescript
```

## Publishing Documentation

### Hosting Options
- **GitHub Pages**: For public documentation
- **Internal Wiki**: For private documentation
- **Swagger Hub**: For collaborative editing
- **Custom Portal**: For branded documentation

### CI/CD Integration
```yaml
# .github/workflows/docs.yml
name: API Documentation
on:
  push:
    branches: [main]
    paths: ['docs/**', 'src/**']

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Generate Documentation
        run: npm run docs:generate
      - name: Deploy to GitHub Pages
        run: npm run docs:deploy
```

## Best Practices

### Writing Guidelines
- Use clear, concise language
- Provide practical examples
- Include error scenarios
- Document rate limits
- Specify data formats
- Include authentication details

### Maintenance
- Update documentation with every code change
- Regular review and cleanup
- User feedback integration
- Version compatibility notes
- Migration guides for breaking changes

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [API Documentation Best Practices](https://swagger.io/resources/articles/best-practices-in-api-documentation/)
