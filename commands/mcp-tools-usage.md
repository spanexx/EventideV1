# MCP Tools Usage Guide

This document provides comprehensive guidance on when and how to use available MCP tools during development and analysis tasks in the Eventide project.

## Usage Pattern

Reference MCP tools using:
```
@mcp-tools-usage.md -[category] "task description"
```

## Tool Categories

### `-code` : Code Analysis & Modification Tools
Example: `@mcp-tools-usage.md -code "analyze user service"`

**Available Tools:**
- `search_codebase` - Search code by symbol or semantic meaning
- `read_file` - Read file contents with dependency context
- `search_replace` - Make precise code modifications
- `edit_file` - Propose code edits with minimal context
- `create_file` - Create new files (max 600 lines)
- `delete_file` - Safely delete files
- `get_problems` - Check compilation/lint errors
- `search_files` - Find files by name or pattern
- `read_many_files` - Read content from multiple files
- `replace` - Replace text in a file with precise matching

**When to Use:**
- Analyzing existing code implementations
- Making targeted code changes
- Creating new components or services
- Fixing compilation errors
- Understanding code dependencies
- Batch reading related files for context
- Making precise text replacements with verification

### `-fs` : File System Operations
Example: `@mcp-tools-usage.md -fs "explore project structure"`

**Available Tools:**
- `list_directory` - Explore directory contents with filtering options
- `glob` - Efficiently find files matching glob patterns
- `search_file_content` - Search for regex patterns within files
- `read_file` - Read specific file contents
- `read_many_files` - Read multiple files at once

**When to Use:**
- Understanding project structure
- Finding specific files or patterns
- Exploring codebase organization
- Locating configuration files
- Searching for specific code patterns across the project
- Getting an overview of related files

### `-exec` : Execution & Testing
Example: `@mcp-tools-usage.md -exec "run backend tests"`

**Available Tools:**
- `run_shell_command` - Execute shell commands with background/foreground options
- `getRecentBrowserLogs` - Retrieve browser console logs
- `searchBrowserLogs` - Search browser logs for specific terms
- `getBrowserLogStatistics` - Get statistics about browser logs
- `clearBrowserLogs` - Clear collected browser logs
- `connectToBrowser` - Connect to existing browser instance
- `navigateToUrl` - Navigate browser to specific URL

**When to Use:**
- Running tests or linters
- Building the application
- Starting development servers
- Installing dependencies
- Checking application status
- Debugging frontend issues through browser logs
- Testing web interfaces with browser automation

### `-knowledge` : Knowledge Management
Example: `@mcp-tools-usage.md -knowledge "search authentication patterns"`

**Available Tools:**
- `search_memory` - Search project knowledge base
- `update_memory` - Store important learnings
- `fetch_rules` - Get detailed rule content
- `save_memory` - Save specific facts to long-term memory
- `loadContextItem` - Load specific context items
- `listContextItems` - List all context items
- `getSessionInfo` - Get current session information

**When to Use:**
- Understanding project architecture
- Finding implementation patterns
- Storing lessons learned
- Retrieving best practices
- Understanding business rules
- Maintaining project-specific knowledge
- Accessing previously stored context

### `-task` : Task Management
Example: `@mcp-tools-usage.md -task "plan feature implementation"`

**Available Tools:**
- `add_tasks` - Create new tasks or subtasks
- `update_tasks` - Modify task status/content
- `createProject` - Create new projects
- `listProjects` - List all projects
- `updateProject` - Update project details
- `deleteProject` - Delete projects
- `createTask` - Create new tasks
- `listTasks` - List all tasks
- `updateTask` - Update task details
- `deleteTask` - Delete tasks
- `searchTasks` - Search across tasks
- `bulkUpdateTasks` - Update multiple tasks
- `archiveProject` - Archive completed projects
- `manageTags` - Create and manage tags

**When to Use:**
- Planning complex multi-step work
- Breaking down large features
- Tracking implementation progress
- Managing development workflow
- Organizing project work
- Tracking task dependencies
- Managing team assignments

### `-web` : Web Research & Analysis
Example: `@mcp-tools-usage.md -web "research latest Angular patterns"`

**Available Tools:**
- `search_web` - Real-time web search
- `fetch_content` - Get webpage content
- `web_fetch` - Fetch and process web content with AI
- `mcp_fetch_fetch` - Advanced web content fetching

**When to Use:**
- Researching current best practices
- Finding solutions to technical problems
- Checking latest documentation
- Validating implementation approaches
- Getting examples from real-world implementations
- Staying updated with technology changes

### `-docs` : Documentation & Library Research
Example: `@mcp-tools-usage.md -docs "get Angular Material docs"`

**Available Tools:**
- `mcp_context7_resolve-library-id` - Find library IDs
- `mcp_context7_get-library-docs` - Get library documentation
- `getDocumentation` - Retrieve content from documentation files
- `listDocumentation` - List all available documentation files
- `findTodos` - Search for TODO comments in codebase

**When to Use:**
- Understanding framework APIs
- Learning library usage patterns
- Finding code examples
- Checking version compatibility
- Accessing project documentation
- Finding implementation guidance

### `-github` : GitHub Operations
Example: `@mcp-tools-usage.md -github "create pull request"`

**Available Tools:**
- `mcp_github_search_code` - Search code in repositories
- `mcp_github_search_issues` - Search issues in repositories
- `mcp_github_search_repositories` - Search for repositories
- `mcp_github_get_repository` - Get repository information
- `mcp_github_list_files` - List files in a repository
- `mcp_github_get_file_content` - Get file content from repository
- `mcp_github_create_issue` - Create new issues
- `mcp_github_update_issue` - Update existing issues
- `mcp_github_list_issues` - List repository issues
- `mcp_github_get_issue` - Get specific issue details
- `mcp_github_create_pull_request` - Create pull requests
- `mcp_github_list_pull_requests` - List pull requests
- `mcp_github_get_pull_request` - Get pull request details
- `mcp_github_merge_pull_request` - Merge pull requests
- `mcp_github_create_branch` - Create new branches
- `mcp_github_list_branches` - List repository branches

**When to Use:**
- Managing repository operations
- Creating/updating issues or PRs
- Searching GitHub for solutions
- Collaborating on code changes
- Reviewing community implementations
- Contributing to open source projects

### `-browser` : Browser Automation
Example: `@mcp-tools-usage.md -browser "test web interface"`

**Available Tools:**
- `mcp_playwright_connect_active_tab` - Connect to existing browser
- `mcp_playwright_navigate` - Navigate to URLs
- `mcp_playwright_screenshot` - Take screenshots
- `mcp_playwright_click` - Click elements
- `mcp_playwright_fill` - Fill input fields
- `mcp_playwright_select` - Select dropdown options
- `mcp_playwright_hover` - Hover over elements
- `mcp_playwright_evaluate` - Execute JavaScript in browser
- `puppeteer_connect_active_tab` - Connect to Chrome instance
- `puppeteer_navigate` - Navigate to URLs
- `puppeteer_screenshot` - Take screenshots
- `puppeteer_click` - Click elements
- `puppeteer_fill` - Fill input fields
- `puppeteer_select` - Select dropdown options
- `puppeteer_hover` - Hover over elements
- `puppeteer_evaluate` - Execute JavaScript in browser

**When to Use:**
- Testing web interfaces
- Automating user workflows
- Capturing UI state
- Debugging frontend issues
- Creating visual documentation
- Regression testing UI changes

### `-think` : Complex Problem Solving
Example: `@mcp-tools-usage.md -think "analyze system architecture"`

**Available Tools:**
- `mcp_sequential-thinking_sequentialthinking` - Structured thinking process

**When to Use:**
- Breaking down complex problems
- Planning multi-step solutions
- Analyzing system design decisions
- Reasoning through trade-offs
- Creating implementation strategies
- Evaluating architectural decisions

### `-project` : Project Management
Example: `@mcp-tools-usage.md -project "create development project"`

**Available Tools:**
- `mcp_task-management_createProject` - Create new projects
- `mcp_task-management_listProjects` - List all projects
- `mcp_task-management_updateProject` - Update project details
- `mcp_task-management_deleteProject` - Delete projects
- `mcp_task-management_createTask` - Create new tasks
- `mcp_task-management_listTasks` - List all tasks
- `mcp_task-management_updateTask` - Update task details
- `mcp_task-management_deleteTask` - Delete tasks
- `mcp_task-management_searchTasks` - Search across tasks
- `mcp_task-management_bulkUpdateTasks` - Update multiple tasks
- `mcp_task-management_archiveProject` - Archive completed projects
- `mcp_task-management_manageTags` - Create and manage tags
- `mcp_task-management_getDatabaseInfo` - Get database statistics
- `mcp_task-management_getSessionContext` - Get session information
- `mcp_task-management_openDashboard` - Open web dashboard

**When to Use:**
- Managing development projects
- Organizing feature development
- Tracking progress across teams
- Planning project milestones
- Managing task dependencies
- Creating project reports

### `-database` : Database Operations
Example: `@mcp-tools-usage.md -database "check user data"`

**Available Tools:**
- `listDatabases` - List all MongoDB databases
- `listEventideCollections` - List collections in eventide database
- `listEventideUsers` - List all users
- `countEventideUsers` - Count users
- `createEventideUser` - Create new user
- `updateEventideUser` - Update user
- `deleteEventideUser` - Delete user
- `listEventideBookings` - List all bookings
- `countEventideBookings` - Count bookings
- `createEventideBooking` - Create new booking
- `updateEventideBooking` - Update booking
- `deleteLastEventideBooking` - Delete last booking
- `listEventideServices` - List all services
- `countEventideServices` - Count services
- `createEventideService` - Create new service
- `deleteLastEventideService` - Delete last service
- `listEventideAvailabilities` - List all availabilities
- `createEventideAvailability` - Create new availability
- `deleteLastEventideAvailability` - Delete last availability
- `explainMongoDB` - Get MongoDB command explanations

**When to Use:**
- Checking database state during development
- Setting up test data
- Debugging data-related issues
- Verifying database operations
- Managing test environments
- Understanding database schema

## Best Practices by Scenario

### 1. Code Analysis Workflow
```markdown
1. Use `search_codebase` to find relevant components
2. Use `read_file` with dependencies to understand context
3. Use `search_memory` to find related patterns
4. Use `get_problems` to check current state
5. Use `search_files` to locate related files
6. Use `read_many_files` for comprehensive context
```

### 2. Feature Implementation Workflow
```markdown
1. Use `search_memory` to understand requirements
2. Use `add_tasks` to break down the work
3. Use `search_codebase` to find similar implementations
4. Use `create_file` or `search_replace` to implement
5. Use `run_shell_command` to test changes
6. Use `update_tasks` to track progress
7. Use `get_problems` to verify implementation
```

### 3. Debugging Workflow
```markdown
1. Use `get_problems` to see compilation errors
2. Use `search_file_content` to find error patterns
3. Use `search_web` to research solutions
4. Use `read_file` to understand context
5. Use `search_replace` to fix issues
6. Use `run_shell_command` to verify fixes
7. Use `getRecentBrowserLogs` for frontend issues
```

### 4. Research & Learning Workflow
```markdown
1. Use `search_memory` for project knowledge
2. Use `mcp_context7_get-library-docs` for framework docs
3. Use `search_web` for latest best practices
4. Use `update_memory` to store learnings
5. Use `mcp_github_search_code` for community solutions
6. Use `getDocumentation` for project docs
```

### 5. Testing Workflow
```markdown
1. Use `run_shell_command` to execute tests
2. Use `mcp_playwright_*` for UI testing
3. Use `get_terminal_output` to check results
4. Use `run_preview` to test web interfaces
5. Use `get_problems` to verify code quality
6. Use `getRecentBrowserLogs` for frontend testing
```

### 6. Database Management Workflow
```markdown
1. Use `listEventideUsers` to check user data
2. Use `listEventideAvailabilities` to verify availability data
3. Use `createEventideUser` to set up test users
4. Use `deleteLastEventideAvailability` to clean up test data
5. Use `explainMongoDB` to understand database operations
```

## Tool Selection Guidelines

### Parallel vs Sequential Operations
- **Run in Parallel**: `read_file`, `list_directory`, `search_codebase` (read-only operations)
- **Run Sequential**: `search_replace`, `edit_file`, `run_shell_command` (modifying operations)

### File Operations Priority
1. **First Choice**: `search_replace` for precise modifications
2. **Alternative**: `edit_file` for complex edits with context
3. **Creation**: `create_file` for new files (≤600 lines)
4. **Batch Operations**: `read_many_files` for multiple files

### Research Efficiency
1. **Project Knowledge**: `search_memory` first
2. **Code Patterns**: `search_codebase` with symbols
3. **External Info**: `search_web` or library docs
4. **Deep Analysis**: `mcp_sequential-thinking_sequentialthinking`
5. **Documentation**: `getDocumentation` for project docs

### Error Resolution
1. **Check Issues**: `get_problems` immediately after changes
2. **Find Patterns**: `search_file_content` for error signatures
3. **Research Solutions**: `search_web` + library docs
4. **Apply Fixes**: `search_replace` with precise changes
5. **Verify Fixes**: `run_shell_command` to test

## Common Anti-Patterns to Avoid

### ❌ Don't
- Use `edit_file` for simple replacements (use `search_replace`)
- Run file operations in parallel (causes conflicts)
- Create files >600 lines (split into multiple calls)
- Skip dependency context when reading complex files
- Forget to check compilation errors after changes
- Use `run_shell_command` for long-running processes without background flag
- Ignore browser logs when debugging frontend issues

### ✅ Do
- Use appropriate tool for task complexity
- Run read-only operations in parallel when possible
- Always verify changes with `get_problems`
- Store important learnings with `update_memory`
- Break complex tasks into manageable steps
- Use `run_shell_command` with `is_background: true` for servers
- Check browser logs with `getRecentBrowserLogs` for frontend debugging
- Use database tools to verify data operations

## Integration with Existing Workflows

This MCP tools guide integrates with existing command documentation:
- Use with `@planning-workflow.md` for systematic feature planning
- Combine with `@deep-research.md` for thorough code analysis
- Reference `@code-review-protocol.md` for quality assurance
- Follow `@project-planning-protocol.md` for project management
- Use `@execution-guide.md` for implementation workflows
- Apply `@api-validation.md` for API compatibility

## Quick Reference

### Most Common Operations
```bash
# Code analysis
search_codebase → read_file → search_memory

# Code modification  
search_codebase → search_replace → get_problems

# Feature planning
search_memory → add_tasks → search_codebase

# Testing
run_shell_command → get_terminal_output → get_problems

# Research
search_memory → search_web → update_memory

# Frontend debugging
getRecentBrowserLogs → searchBrowserLogs → navigateToUrl

# Database operations
listEventideUsers → createEventideUser → listEventideUsers
```

### Emergency Debugging
```bash
get_problems → search_file_content → search_web → search_replace → get_problems
getRecentBrowserLogs → searchBrowserLogs → puppeteer_navigate
```

### Project Management
```bash
createProject → createTask → listTasks → updateTask → archiveProject
manageTags → searchTasks → bulkUpdateTasks
```

## Note
This guide should be referenced when choosing the appropriate MCP tool for any development task. The tools are designed to work together in workflows that maximize efficiency while maintaining code quality. Always consider the specific requirements of your task when selecting tools, and remember that combining multiple tools often yields the best results.