# Prompt Enhancement Command

This command enhances prompts by gathering deep context from the codebase and providing detailed information to improve AI responses.

## Usage Pattern

Reference this command when you need to enhance a prompt with detailed context:
```
@commands/enhance-prompt -"your prompt here"
```

Or simply:
```
@enhance-prompt -"your prompt here"
```

## How It Works

When invoked, this command will:

1. **Gather Deep Context**
   - Uses `@deep-research.md` to conduct comprehensive analysis
   - Searches for relevant code, documentation, and patterns
   - Maps related components and dependencies
   - Reviews architecture and design decisions

2. **Analyze Requirements**
   - Identifies key technical considerations
   - Reviews security implications
   - Assesses performance impacts
   - Checks existing implementations

3. **Enhance the Prompt**
   - Adds relevant context from codebase
   - Includes technical details and constraints
   - Provides examples and best practices
   - References related components and files

## Enhancement Process

### Step 1: Context Gathering
```bash
# Analyze the prompt topic
@deep-research.md -text "prompt keywords"

# Find related code implementations
@deep-research.md -code "related components"

# Review architecture implications
@deep-research.md -arch "system design"
```

### Step 2: Technical Analysis
```bash
# Check security considerations
@deep-research.md -sec "security concerns"

# Analyze performance impacts
@deep-research.md -perf "performance metrics"

# Review dependencies
@deep-research.md -dep "affected modules"
```

### Step 3: Pattern Recognition
```bash
# Find similar implementations
@deep-research.md -code "similar patterns"

# Review best practices
@deep-research.md -text "best practices"

# Check existing solutions
@deep-research.md -text "existing solutions"
```

## Enhanced Prompt Format

The enhanced prompt will include:

1. **Contextual Information**
   - Relevant code snippets
   - Architecture details
   - Design patterns used
   - Related components

2. **Technical Considerations**
   - Security implications
   - Performance factors
   - Integration points
   - Dependencies

3. **Implementation Guidance**
   - Best practices
   - Code examples
   - Common pitfalls
   - Testing considerations

4. **Reference Materials**
   - Related documentation
   - Similar implementations
   - External resources

## Example Usage

### Basic Enhancement
```bash
@enhance-prompt -"implement user authentication"
```

This would produce an enhanced prompt with:
- Context about the current authentication system
- Code examples from existing auth implementations
- Security considerations for authentication
- Performance implications
- Related components (AuthService, AuthController, etc.)

### Feature-Specific Enhancement
```bash
@enhance-prompt -"add real-time notifications"
```

This would produce an enhanced prompt with:
- Information about existing WebSocket implementations
- Context about the notification system
- Integration points with other services
- Performance considerations for real-time features
- Security implications for real-time communication

## Best Practices

1. **Be Specific**
   - Use clear, descriptive prompts
   - Include context about what you're trying to achieve
   - Mention any constraints or requirements

2. **Reference Existing Components**
   - Mention related features or modules
   - Reference existing patterns in the codebase
   - Note any similar implementations

3. **Include Technical Requirements**
   - Mention security considerations
   - Note performance requirements
   - Include integration needs

4. **Specify Output Format**
   - Request specific types of output (code, documentation, etc.)
   - Mention preferred implementation approaches
   - Note any framework or library preferences

## Integration with Other Commands

This enhancement command works well with:

- `@planning-workflow.md` - For feature planning and context gathering
- `@deep-research.md` - For detailed codebase analysis
- `@code-review-protocol.md` - For implementation quality checks
- `@mcp-tools-usage.md` - For selecting appropriate development tools

## Referencing Files in Prompts

When you need to reference specific files in your prompts, use the @path format:

### Referencing Individual Files
```bash
@enhance-prompt -"fix the bug in @frontend/src/app/dashboard/pages/availability/availability.component.ts"
```

### Referencing Multiple Files
```bash
@enhance-prompt -"implement snackbar notifications using @frontend/src/app/shared/services/snackbar.service.ts and @frontend/src/app/dashboard/components/availability-dialog/availability-dialog.component.ts"
```

### Referencing Directories
```bash
@enhance-prompt -"refactor all files in @frontend/src/app/dashboard/store-availability/ to improve error handling"
```

### Referencing Command Files
```bash
@enhance-prompt -"create a new command following the pattern in @commands/execution-guide.md"
```

## Using Command Instructions in Prompts

You can reference specific command instructions to guide the enhancement:

### Planning Commands
```bash
@enhance-prompt -"plan a new feature using @commands/planning-workflow.md and include @frontend/src/app/dashboard/pages/availability/availability.component.ts"
```

### Research Commands
```bash
@enhance-prompt -"research calendar integration patterns using @commands/deep-research.md -code 'FullCalendar' and referencing @frontend/src/app/dashboard/pages/availability/availability.component.ts"
```

### Execution Commands
```bash
@enhance-prompt -"implement error handling following @commands/execution-guide.md and using @frontend/src/app/shared/services/snackbar.service.ts"
```

## File Reference Guidelines

### When to Reference Files
1. **Specific Implementation Details**: When you need changes to particular files
2. **Context for Understanding**: When files provide important context
3. **Integration Points**: When you need to understand how components work together
4. **Examples to Follow**: When existing files show the pattern to use

### File Reference Format
- Use absolute paths from project root: `@/path/to/file.ts`
- For directories: `@/path/to/directory/`
- For command files: `@commands/filename.md`

### File Reference Best Practices
1. **Be Selective**: Only reference files that are truly relevant
2. **Prioritize Important Files**: Reference the most critical files first
3. **Include Context Files**: Add files that provide necessary background
4. **Consider Dependencies**: Reference files that the main files depend on

## Quick Reference

### Common Enhancement Patterns

1. **Feature Implementation**
   ```bash
   @enhance-prompt -"implement [feature name] in @/path/to/component.ts"
   ```

2. **Bug Fixing**
   ```bash
   @enhance-prompt -"fix [issue description] in @/path/to/file.ts"
   ```

3. **Code Refactoring**
   ```bash
   @enhance-prompt -"refactor [component name] in @/path/to/directory/"
   ```

4. **Performance Optimization**
   ```bash
   @enhance-prompt -"optimize [component/performance area] in @/path/to/file.ts using @commands/execution-guide.md"
   ```

5. **Security Enhancement**
   ```bash
   @enhance-prompt -"improve security for [component/feature] in @/path/to/file.ts following @commands/deep-research.md -sec guidelines"
   ```

## Note

This command is designed to provide rich context for AI-assisted development, making responses more accurate and relevant to the specific project requirements and existing codebase patterns. When referencing files with @path, the system will automatically include relevant context from those files in the enhanced prompt.