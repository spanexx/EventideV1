# Building the Project

## Backend Build

### Build the backend application
```bash
cd backend
npm run build
```

### Production build
```bash
cd backend
npm run build
```

The build output will be in the `dist/` directory.

## Frontend Build

### Development build
```bash
cd frontend
npm run build
```

### Production build
```bash
cd frontend
npm run build:prod
```

The build output will be in the `dist/` directory.

## Running Built Applications

### Run built backend application
```bash
cd backend
npm run start:prod
```

### Run built frontend application
```bash
cd frontend
npm run start:prod
```

## CI/CD Build Commands

To build like in the CI/CD pipeline:
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```