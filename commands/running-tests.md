# Running Tests

## Backend Tests

### Run all tests
```bash
cd backend
npm run test
```

### Run tests in watch mode
```bash
cd backend
npm run test:watch
```

### Run tests with coverage
```bash
cd backend
npm run test:cov
```

### Run specific test files
```bash
cd backend
npm run test src/modules/users/users.service.spec.ts
```

### Run tests for a specific directory
```bash
cd backend
npm run test src/modules/users/
```

### Run end-to-end tests
```bash
cd backend
npm run test:e2e
```

## Frontend Tests

### Run all tests
```bash
cd frontend
npm run test
```

### Run tests in watch mode
```bash
cd frontend
npm run test:watch
```

### Run tests with coverage
```bash
cd frontend
npm run test:cov
```

## CI/CD Test Commands

To run tests like in the CI/CD pipeline:
```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test
```

## Troubleshooting

### Common Test Issues

1. **Dependency Injection Errors**
   - If you see "Nest can't resolve dependencies" errors, check that all required services are provided in the test module configuration
   - Example fix: Add missing providers to the `providers` array in `Test.createTestingModule`

2. **Timeout Errors in E2E Tests**
   - E2E tests may fail with "Exceeded timeout of 5000 ms"
   - Solution: Increase timeout values or optimize test setup/teardown
   - To increase timeout: Add `{ timeout: 10000 }` as a third parameter to `it()` calls

3. **Source Map Errors**
   - Some tests may fail with TypeError related to source maps
   - Solution: Update Jest configuration or clear Jest cache with `jest --clearCache`

### Test Performance

- **Unit tests** should run quickly (under 10 seconds)
- **Integration tests** may take longer (10-30 seconds)
- **E2E tests** typically take the longest (30+ seconds)
- If tests are consistently timing out, consider optimizing the test environment setup

### Test Coverage

To generate and view test coverage:
```bash
cd backend
npm run test:cov
# Open coverage/index.html in your browser
```

The coverage report will show:
- Line coverage percentages
- Functions covered
- Branches covered
- Statements covered