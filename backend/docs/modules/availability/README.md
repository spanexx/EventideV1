# Availability Module

## Overview
The Availability module manages provider availability slots for the Eventide booking system. It provides REST APIs for creating, reading, updating, and deleting availability slots with support for both recurring and one-off patterns.

## Features
- Create and manage availability slots
- Support for both recurring and one-off availability
- Automatic conflict detection
- Caching for improved performance
- Real-time updates through WebSocket integration

## Module Structure
```
src/modules/availability/
├── availability.module.ts
├── availability.controller.ts
├── availability.service.ts
├── availability.schema.ts
├── dto/
│   ├── create-availability.dto.ts
│   ├── update-availability.dto.ts
│   └── get-availability.dto.ts
├── interfaces/
│   └── availability.interface.ts
└── ...
```

## Documentation
- [Module Documentation](./availability.md)
- [API Documentation](./API_DOCUMENTATION.md)

## Related Modules
- [Users Module](../users/README.md)
- [Bookings Module](../bookings/README.md) (when implemented)

## Testing
The module includes unit tests for core functionality.

## Contributing
When making changes to this module, please ensure:
1. All existing tests pass
2. New functionality is covered by tests
3. Documentation is updated accordingly
4. Code follows the project's style guidelines