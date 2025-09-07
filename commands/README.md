# Eventide Development Commands

This directory contains documentation for common development commands used in the Eventide project.

## Available Commands

- [running-tests.md](running-tests.md) - Instructions for running tests
- [running-linters.md](running-linters.md) - Instructions for running linters
- [building-the-project.md](building-the-project.md) - Instructions for building the application
- [find-todos.md](find-todos.md) - Find TODO comments in the codebase
- [api-validation.md](api-validation.md) - Comprehensive API validation between backend and frontend
- [deep-research.md](../docs/deep-research.md) - Conduct deep analysis of codebase components
- [planning-workflow.md](planning-workflow.md) - Systematic approach to planning and context gathering
- [mcp-tools-usage.md](mcp-tools-usage.md) - Comprehensive guide for using MCP tools effectively
- [command-line-guide.md](command-line-guide.md) - Platform-specific command line execution instructions
- [execution-guide.md](execution-guide.md) - Complete execution instructions for all development commands
- [command-management.md](command-management.md) - Instructions for managing and organizing command documentation
- [i18n-execution.md](i18n-execution.md) - Step-by-step execution guide for implementing native internationalization
- [enhance-prompt.md](enhance-prompt.md) - Enhance prompts with detailed codebase context
- [refactor.md](refactor.md) - Safe refactoring with original content preservation
- [deep-research-refactoring.md](deep-research-refactoring.md) - Industry standards for refactoring

### API Validation
For comprehensive backend-frontend API validation:
```bash
@api-validation.md -[component] "validation scope"

# Examples:
@api-validation.md -calendar-component-apis "validate calendar endpoints"  # Calendar API validation
@api-validation.md -auth-apis "validate authentication flow"              # Auth API validation
@api-validation.md -dashboard-apis "validate dashboard data"               # Dashboard API validation
@api-validation.md -booking-apis "validate booking flow"                  # Booking API validation
@api-validation.md -payment-apis "validate payment processing"            # Payment API validation
@api-validation.md -ai-apis "validate AI interactions"                    # AI API validation
@api-validation.md -user-apis "validate user operations"                  # User API validation
@api-validation.md -reports-apis "validate analytics data"                # Reports API validation
@api-validation.md -settings-apis "validate configuration management"     # Settings API validation
```
For organizing and managing command documentation:
```bash
@command-management.md -cleanup "feature/topic name"   # Clean up outdated files
@command-management.md -doc "feature/topic name"       # Create comprehensive documentation
```

### Planning and Analysis
To start planning a new feature or change:
```bash
@planning-workflow.md -task "Your task description"
```

This will guide you through:
1. Initial context gathering
2. Dependency analysis
3. Requirements analysis
4. Technical assessment
5. Architecture review
6. Risk assessment
7. Implementation strategy

### Deep Research Usage
You can invoke deep research analysis using flags:
```bash
@deep-research.md -[flag] "search text"

# Examples:
@deep-research.md -text "authentication flow"   # General text search
@deep-research.md -code "AuthService"          # Code analysis
@deep-research.md -arch "booking system"       # Architecture analysis
@deep-research.md -perf "database queries"     # Performance analysis
@deep-research.md -sec "authentication"        # Security analysis
@deep-research.md -dep "mongodb"               # Dependency analysis
```

### Command Line Platform Guide
For platform-specific command line syntax and execution:
```bash
@command-line-guide.md -[platform] "command description"

# Examples:
@command-line-guide.md -powershell "navigate and build"     # PowerShell syntax
@command-line-guide.md -bash "unix command patterns"        # Bash/Zsh syntax  
@command-line-guide.md -cross "cross-platform setup"        # Cross-platform commands
@command-line-guide.md -env "environment configuration"      # Environment variables
@command-line-guide.md -path "path handling syntax"          # Path and navigation
```

### General Command Execution
For comprehensive execution instructions across all commands:
```bash
@execution-guide.md -[workflow] "description"

# Examples:
@execution-guide.md -build "compile applications"          # Building & deployment
@execution-guide.md -test "run test suites"               # Testing workflows  
@execution-guide.md -debug "troubleshoot issues"          # Debugging procedures
@execution-guide.md -feature "complete development flow"   # Feature development
@execution-guide.md -review "code quality assurance"      # Code review process
```

### MCP Tools Usage
For advanced development tasks using MCP tools:
```bash
@mcp-tools-usage.md -[category] "task description"

# Examples:
@mcp-tools-usage.md -code "analyze user service"     # Code analysis & modification
@mcp-tools-usage.md -exec "run backend tests"        # Execution & testing
@mcp-tools-usage.md -knowledge "search auth patterns" # Knowledge management
@mcp-tools-usage.md -task "plan feature impl"        # Task management
@mcp-tools-usage.md -web "research Angular patterns"  # Web research
@mcp-tools-usage.md -github "create pull request"    # GitHub operations
@mcp-tools-usage.md -browser "test web interface"    # Browser automation
```

### i18n Implementation Execution
For implementing native internationalization across the platform:
```bash
@i18n-execution.md -[phase] "step description"

# Examples:
@i18n-execution.md -frontend "setup Angular i18n"     # Frontend i18n setup
@i18n-execution.md -backend "configure NestJS i18n"   # Backend i18n setup
@i18n-execution.md -content "extract translations"    # Content extraction
@i18n-execution.md -test "validate i18n setup"        # Testing validation
@i18n-execution.md -deploy "build multi-locale"       # Build & deployment
```

### Prompt Enhancement
For enhancing prompts with detailed codebase context:
```bash
@enhance-prompt -"your prompt here"

# Examples:
@enhance-prompt -"implement user authentication"        # Enhance auth implementation prompt
@enhance-prompt -"add real-time notifications"          # Enhance notifications prompt
@enhance-prompt -"optimize database queries"            # Enhance performance optimization prompt
@enhance-prompt -"improve security for API endpoints"   # Enhance security enhancement prompt
```

### Safe Refactoring
For refactoring code while preserving original content:
```bash
@refactor -[approach] "component/description"

# Examples:
@refactor -comment "availability service"        # Minor refactoring with comments
@refactor -backup "booking module"               # Major refactoring with backups
@refactor -incremental "user authentication"     # Gradual refactoring with feature flags
```

### Deep Research for Refactoring
For understanding industry standards and best practices for refactoring:
```bash
@deep-research-refactoring -[flag] "topic"

# Examples:
@deep-research-refactoring -patterns "extract method"        # Refactoring patterns
@deep-research-refactoring -principles "solid principles"    # Refactoring principles
@deep-research-refactoring -tools "automated refactoring"    # Refactoring tools
@deep-research-refactoring -process "safety measures"        # Refactoring process
@deep-research-refactoring -testing "regression testing"     # Refactoring testing
```

## Quick Reference

### Backend

```bash
# Install dependencies
cd backend && npm install

# Run tests
cd backend && npm run test

# Run linter
cd backend && npm run lint

# Build application
cd backend && npm run build

# Start development server
cd backend && npm run start:dev
```

### Frontend

```bash
# Install dependencies
cd frontend && npm install

# Run tests
cd frontend && npm run test

# Run linter
cd frontend && npm run lint

# Build application
cd frontend && npm run build

# Start development server
cd frontend && npm run start
```