# Availability Module

## Overview
The Availability module manages provider availability slots for the Eventide booking system. It provides REST APIs for creating, reading, updating, and deleting availability slots.

## Features
- Create and manage availability slots
- Support for both recurring and one-off availability
- Automatic conflict detection
- Caching for improved performance
- Full CRUD operations
- Real-time updates via WebSockets

## API Documentation
See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API documentation.

## Module Structure
```
availability/
├── availability.module.ts
├── availability.controller.ts
├── availability.service.ts
├── availability.schema.ts
├── API_DOCUMENTATION.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── dto/
│   ├── create-availability.dto.ts
│   ├── update-availability.dto.ts
│   └── get-availability.dto.ts
├── interfaces/
│   └── availability.interface.ts
└── availability.service.spec.ts
```

## Dependencies
- `@nestjs/mongoose` for MongoDB integration
- `@nestjs/cache-manager` for caching
- `class-validator` for input validation
- WebSocket gateway for real-time updates

## Installation
The availability module is automatically included when installing the backend dependencies:

```bash
npm install
```

## Running Tests
```bash
npm run test -- src/modules/availability/availability.service.spec.ts
```

## Future Enhancements
- Integration with external calendar systems
- More complex recurrence patterns
- Timezone-aware scheduling
- Availability analytics