# Eventide Command Execution Guide

This document provides comprehensive instructions for executing all development commands and workflows in the Eventide project.

## Usage Pattern

Execute any command using the reference pattern:
```bash
@[command-file].md -[flag] "description"
```

---

## 📋 Getting Started

### Prerequisites
- Node.js 18+
- Git
- Code editor (VS Code recommended)
- Terminal/Command line access

### Initial Setup
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd Eventide

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Verify setup
npm --version
node --version
```

---

## 🛠️ Available Commands & Execution Instructions

### 1. Building the Project
**Reference:** `@building-the-project.md`

```bash
# Backend build
cd backend && npm run build

# Frontend build
cd frontend && npm run build

# Production builds
cd backend && npm run build
cd frontend && npm run build:prod

# Built application execution
cd backend && npm run start:prod
cd frontend && npm run start:prod
```

### 2. Running Tests
**Reference:** `@running-tests.md`

```bash
# Backend tests
cd backend && npm run test           # All tests
cd backend && npm run test:watch     # Watch mode
cd backend && npm run test:cov       # With coverage
cd backend && npm run test:e2e       # End-to-end tests

# Frontend tests  
cd frontend && npm run test          # All tests
cd frontend && npm run test:watch    # Watch mode
cd frontend && npm run test:cov      # With coverage

# Specific test files
cd backend && npm run test src/modules/users/users.service.spec.ts
```

### 3. Running Linters
**Reference:** `@running-linters.md`

```bash
# Backend linting
cd backend && npm run lint           # Check linting
cd backend && npm run lint -- --fix  # Auto-fix issues

# Frontend linting
cd frontend && npm run lint          # Check linting  
cd frontend && npm run lint -- --fix # Auto-fix issues
```

### 4. Finding TODOs
**Reference:** `@find-todos.md`

```bash
# Search for TODO comments
grep -rn "TODO" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist

# Search for multiple patterns
grep -rn -E "(TODO|FIXME|HACK|NOTE)" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist

# Create TODO list file
echo "# Project TODO List\n" > TODO.md
grep -rn "TODO" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist | sed 's/^/- /' >> TODO.md

# Using ripgrep (if available - faster)
rg "TODO" .
rg -E "(TODO|FIXME|HACK|NOTE)" .
```

---

## 🔍 Analysis & Research Commands

### 5. Deep Research
**Reference:** `@deep-research.md -[flag] "search text"`

```bash
# General text search
@deep-research.md -text "authentication flow"

# Code analysis
@deep-research.md -code "AuthService"

# Architecture analysis
@deep-research.md -arch "booking system"

# Performance analysis
@deep-research.md -perf "database queries"

# Security analysis
@deep-research.md -sec "authentication"

# Dependency analysis
@deep-research.md -dep "mongodb"
```

### 6. Planning Workflow
**Reference:** `@planning-workflow.md -task "description"`

```bash
# Start feature planning
@planning-workflow.md -task "implement user authentication"

# Example planning workflow:
# 1. Initial context gathering
@deep-research.md -text "authentication flow"
@deep-research.md -arch "authentication flow"
@deep-research.md -code "AuthService"

# 2. Dependency analysis
@deep-research.md -dep "affected module"
@deep-research.md -sec "security concerns"
@deep-research.md -perf "performance metrics"
```

### 7. MCP Tools Usage
**Reference:** `@mcp-tools-usage.md -[category] "task"`

```bash
# Code analysis & modification
@mcp-tools-usage.md -code "analyze user service"

# File system operations
@mcp-tools-usage.md -fs "explore project structure"

# Execution & testing
@mcp-tools-usage.md -exec "run backend tests"

# Knowledge management
@mcp-tools-usage.md -knowledge "search auth patterns"

# Task management
@mcp-tools-usage.md -task "plan feature impl"

# Web research
@mcp-tools-usage.md -web "research Angular patterns"

# Documentation research
@mcp-tools-usage.md -docs "get Angular Material docs"

# GitHub operations
@mcp-tools-usage.md -github "create pull request"

# Browser automation
@mcp-tools-usage.md -browser "test web interface"

# Complex problem solving
@mcp-tools-usage.md -think "analyze system architecture"

# Project management
@mcp-tools-usage.md -project "create development project"
```

---

## 📊 Code Review & Quality

### 8. Code Review Protocol
**Reference:** `@code-review-protocol.md -[flag] "component"`

```bash
# Functionality review
@code-review-protocol.md -func "BookingService"

# Code style review
@code-review-protocol.md -style "AuthController"

# Test coverage review
@code-review-protocol.md -test "PaymentModule"

# Performance review
@code-review-protocol.md -perf "DatabaseQueries"

# Security review
@code-review-protocol.md -sec "UserAuthentication"
```

### 9. Project Planning Protocol
**Reference:** `@project-planning-protocol.md -[flag] "feature"`

```bash
# Initial planning
@project-planning-protocol.md -init "BookingSystem"

# Architecture planning
@project-planning-protocol.md -arch "PaymentIntegration"

# Resource planning
@project-planning-protocol.md -res "UserDashboard"

# Risk assessment
@project-planning-protocol.md -risk "AuthenticationSystem"

# Dependency planning
@project-planning-protocol.md -dep "APIIntegration"
```

---

## 🚀 Development Workflows

### Complete Feature Development Workflow

```bash
# 1. Planning Phase
@planning-workflow.md -task "implement new feature"
@project-planning-protocol.md -init "FeatureName"

# 2. Research Phase
@deep-research.md -text "feature requirements"
@deep-research.md -arch "system integration"
@deep-research.md -code "similar implementations"

# 3. Implementation Phase
@mcp-tools-usage.md -code "create feature components"
@mcp-tools-usage.md -task "track implementation progress"

# 4. Quality Assurance Phase
@code-review-protocol.md -func "FeatureComponent"
@running-tests.md # Run all tests
@running-linters.md # Check code quality

# 5. Validation Phase
@mcp-tools-usage.md -exec "run integration tests"
@mcp-tools-usage.md -browser "test user interface"
```

### Bug Investigation Workflow

```bash
# 1. Investigation
@deep-research.md -code "BuggyComponent"
@mcp-tools-usage.md -fs "find related files"

# 2. Analysis  
@deep-research.md -perf "performance impact"
@deep-research.md -sec "security implications"

# 3. Resolution
@mcp-tools-usage.md -code "implement bug fix"
@running-tests.md # Verify fix

# 4. Validation
@code-review-protocol.md -func "FixedComponent"
@mcp-tools-usage.md -exec "run regression tests"
```

### Performance Optimization Workflow

```bash
# 1. Analysis
@deep-research.md -perf "performance bottlenecks"
@mcp-tools-usage.md -exec "run performance tests"

# 2. Research
@mcp-tools-usage.md -web "research optimization techniques"
@mcp-tools-usage.md -docs "check framework optimization docs"

# 3. Implementation
@mcp-tools-usage.md -code "implement optimizations"
@code-review-protocol.md -perf "OptimizedComponent"

# 4. Validation
@running-tests.md # Performance test validation
@building-the-project.md # Verify build performance
```

---

## 🔧 Environment-Specific Execution

### Development Environment

```bash
# Start development servers
cd backend && npm run start:dev
cd frontend && npm run start

# Watch mode for development
cd backend && npm run test:watch
cd frontend && npm run test:watch

# Development linting
cd backend && npm run lint -- --fix
cd frontend && npm run lint -- --fix
```

### Testing Environment

```bash
# Full test suite
cd backend && npm run test:cov
cd frontend && npm run test:cov

# End-to-end testing
cd backend && npm run test:e2e
# Frontend E2E with Cypress/Playwright

# Integration testing
@mcp-tools-usage.md -exec "run integration test suite"
```

### Production Environment

```bash
# Production builds
cd backend && npm run build
cd frontend && npm run build:prod

# Production deployment validation
cd backend && npm run start:prod
cd frontend && npm run start:prod

# Production testing
@mcp-tools-usage.md -browser "test production deployment"
```

---

## 🚨 Troubleshooting & Emergency Procedures

### Common Issue Resolution

```bash
# Dependency issues
rm -rf node_modules package-lock.json
npm install

# Build issues
@building-the-project.md # Follow build troubleshooting
@mcp-tools-usage.md -exec "clean and rebuild"

# Test failures
@running-tests.md # Check test troubleshooting section
@mcp-tools-usage.md -code "analyze failing tests"

# Linting errors
@running-linters.md # Auto-fix linting issues
cd backend && npm run lint -- --fix
cd frontend && npm run lint -- --fix
```

### Emergency Debugging

```bash
# Quick debugging workflow
@mcp-tools-usage.md -exec "check application status"
@deep-research.md -code "problematic component"
@mcp-tools-usage.md -fs "find relevant log files"

# Performance debugging
@deep-research.md -perf "performance bottleneck"
@mcp-tools-usage.md -browser "capture performance metrics"

# Security incident response
@deep-research.md -sec "security vulnerability"
@code-review-protocol.md -sec "affected components"
```

---

## 📚 Best Practices for Command Execution

### 1. Always Start with Planning
```bash
# Before any major change
@planning-workflow.md -task "describe your task"
@deep-research.md -text "research relevant context"
```

### 2. Use Systematic Approach
```bash
# Follow the workflow: Plan → Research → Implement → Test → Review
# Use appropriate MCP tool categories for each phase
```

### 3. Validate Changes
```bash
# After any code changes
@running-tests.md # Run tests
@running-linters.md # Check code quality
@building-the-project.md # Verify builds
```

### 4. Document Decisions
```bash
# Use project planning protocol for major decisions
@project-planning-protocol.md -init "decision documentation"
```

### 5. Leverage MCP Tools Efficiently
```bash
# Use parallel operations for read-only tasks
# Use sequential operations for modifying tasks
# Refer to @mcp-tools-usage.md for best practices
```

---

## 📞 Quick Reference Commands

### Daily Development
```bash
# Start working
cd backend && npm run start:dev
cd frontend && npm run start

# Before committing
npm run lint && npm run test
@building-the-project.md # Verify build
```

### Code Analysis
```bash
@deep-research.md -code "ComponentName"
@mcp-tools-usage.md -code "analyze component usage"
```

### Problem Solving
```bash
@mcp-tools-usage.md -think "analyze complex problem"
@deep-research.md -text "search for solution patterns"
```

### Project Management
```bash
@mcp-tools-usage.md -task "track project progress"
@project-planning-protocol.md -res "resource planning"
```

---

## 📖 Additional Resources

- **Command Documentation**: All `.md` files in `/commands` directory
- **Project Documentation**: `/docs` directory
- **Task Planning**: `/Tasks` directory  
- **Scripts**: `/scripts` directory for automation

This execution guide provides the framework for efficiently using all available commands and workflows in the Eventide project. Always refer to the specific command documentation for detailed instructions and use the MCP tools framework for enhanced productivity.