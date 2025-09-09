# Running Linting

## Backend Linting

### Run linter
```bash
cd backend
npm run lint
```

### Run linter with auto-fix
```bash
cd backend
npm run lint -- --fix
```

## Frontend Linting

### Run linter
```bash
cd frontend
npm run lint
```

### Run linter with auto-fix
```bash
cd frontend
npm run lint -- --fix
```

## CI/CD Lint Commands

To run linting like in the CI/CD pipeline:
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```