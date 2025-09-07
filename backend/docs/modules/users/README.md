# Users Module

## Overview
The Users module is responsible for managing user accounts, authentication, and preferences in the Eventide booking system. It handles user registration, login, profile management, and preference customization.

## Features
- User registration and authentication
- Profile management
- Preference customization
- Role-based access control
- Password reset functionality
- Google OAuth integration
- Public provider information endpoints

## Module Structure
```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── user.schema.ts
├── user.entity.ts
├── user.preferences.ts
├── public-users.controller.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   ├── update-user-preferences.dto.ts
│   ├── user-preferences-response.dto.ts
│   └── paginated-users.dto.ts
└── ...
```

## Documentation
- [Module Documentation](./user.md)
- [API Documentation](./API_DOCUMENTATION.md)

## Related Modules
- [Authentication Module](../../auth/README.md)
- [Availability Module](../availability/README.md)

## Testing
The module includes comprehensive unit tests for all functionality.

## Contributing
When making changes to this module, please ensure:
1. All existing tests pass
2. New functionality is covered by tests
3. Documentation is updated accordingly
4. Code follows the project's style guidelines