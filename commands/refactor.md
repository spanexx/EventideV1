# Refactoring Command

This command provides guidelines and procedures for refactoring code while preserving original content and following industry best practices.

## Usage Pattern

Reference this command when you need to refactor code:
```
@commands/refactor -[approach] "component/description"
```

Or simply:
```
@refactor -[approach] "component/description"
```

## Refactoring Approaches

### `-comment` : Comment-Based Refactoring
Example: `@refactor -comment "availability service"`
- For minor changes (under 50 lines)
- Comment out original code with `// REFACTOR: [reason]`
- Add new implementation with clear comments
- Preserve git history and enable easy rollback

### `-backup` : Backup-Based Refactoring
Example: `@refactor -backup "booking module"`
- For major changes (over 50 lines)
- Create backup before refactoring
- Implement changes in new files
- Maintain clear separation between old and new

### `-incremental` : Incremental Refactoring
Example: `@refactor -incremental "user authentication"`
- For complex systems
- Refactor in small, manageable steps
- Create feature flags for new implementations
- Gradually migrate functionality

## Refactoring Process

### 1. Preparation Phase
```bash
# Analyze the component to refactor
@deep-research.md -code "component name"

# Review existing tests
@deep-research.md -text "component tests"

# Check dependencies
@deep-research.md -dep "component dependencies"
```

### 2. Safety Measures
```bash
# Ensure all tests pass before refactoring
@running-tests.md # Run all tests

# Create backup for major refactoring
git stash push -m "backup-before-refactor-$(date +%s)"

# Document current state
@deep-research.md -arch "component architecture"
```

### 3. Refactoring Execution
```bash
# For minor changes, use comment approach
// REFACTOR: [Date] - [Reason for refactoring]
// Original code:
// [Original implementation]
// New implementation:
// [New implementation]

# For major changes, create backups
cp original-file.ts original-file.backup.ts
```

## Industry Standards for Refactoring

### 1. Code Quality Principles
- **SOLID Principles**: Ensure code follows Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Eliminate code duplication
- **KISS (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones
- **YAGNI (You Aren't Gonna Need It)**: Implement only what is needed

### 2. Refactoring Patterns
- **Extract Method**: Break down large methods into smaller, more manageable ones
- **Extract Class**: Move related functionality to separate classes
- **Inline Method**: Replace method calls with method body when appropriate
- **Rename**: Use clear, descriptive names for variables, methods, and classes
- **Move Method/Field**: Move functionality to the class that should be responsible for it
- **Replace Conditional with Polymorphism**: Use polymorphism instead of complex conditionals

### 3. Testing Requirements
- **Maintain Test Coverage**: Ensure refactored code has the same or better test coverage
- **Regression Testing**: Verify that existing functionality still works
- **Performance Testing**: Check that performance hasn't degraded
- **Integration Testing**: Ensure integration with other components still works

## Refactoring Safety Guidelines

### Before Refactoring
1. **Run All Tests**: Ensure current codebase is in a working state
2. **Create Backups**: For major changes, create backups of original files
3. **Document Current State**: Record the current implementation and its behavior
4. **Plan Changes**: Clearly define what will be changed and why

### During Refactoring
1. **Small Steps**: Make small, incremental changes
2. **Frequent Testing**: Run tests after each small change
3. **Clear Comments**: Document why changes are being made
4. **Version Control**: Commit frequently with descriptive messages

### After Refactoring
1. **Comprehensive Testing**: Run all tests to ensure nothing is broken
2. **Code Review**: Have others review the changes
3. **Performance Check**: Verify performance hasn't degraded
4. **Documentation Update**: Update any relevant documentation

## Comment-Based Refactoring Format

For minor refactoring (under 50 lines), use this format:

```typescript
// REFACTOR: [Date] - [Reason for refactoring]
// Problem: [Brief description of the issue]
// Solution: [Brief description of the solution]
// Original code:
/*
[Original implementation - commented out]
*/
// New implementation:
[New implementation]
```

## Backup-Based Refactoring Process

For major refactoring (over 50 lines):

1. **Create Backup**:
   ```bash
   cp src/modules/component/component.service.ts src/modules/component/component.service.backup.ts
   ```

2. **Document Current Implementation**:
   ```markdown
   ## Component: [Component Name]
   ### Date: [Date]
   ### Reason for Refactoring: [Reason]
   ### Original Implementation Summary: [Brief summary]
   ```

3. **Implement Changes**:
   - Make changes in the original file
   - Reference the backup file for original implementation
   - Add comments explaining major changes

4. **Verify Implementation**:
   ```bash
   # Run tests
   @running-tests.md
   
   # Check for linting issues
   @running-linters.md
   
   # Validate API contracts
   @api-validation.md -[component] "refactored component"
   ```

## Incremental Refactoring Process

For complex systems that require gradual refactoring:

1. **Feature Flag Implementation**:
   ```typescript
   // Add feature flag to toggle between old and new implementations
   const useNewImplementation = process.env.USE_NEW_IMPLEMENTATION === 'true';
   
   if (useNewImplementation) {
     // New implementation
   } else {
     // Original implementation
   }
   ```

2. **Gradual Migration**:
   - Implement new functionality alongside old
   - Add monitoring to track usage
   - Gradually shift traffic to new implementation
   - Remove old implementation when confident

3. **Rollback Plan**:
   - Maintain original implementation
   - Use feature flags for quick rollback
   - Monitor for issues after deployment

## Best Practices

### 1. Preserve Original Content
- Always keep original code accessible
- Use comments to mark refactored sections
- Create backups for major changes
- Maintain git history

### 2. Follow Industry Standards
- Apply established refactoring patterns
- Adhere to coding standards and conventions
- Maintain or improve test coverage
- Ensure performance doesn't degrade

### 3. Document Changes
- Record reasons for refactoring
- Document the approach taken
- Update relevant documentation
- Communicate changes to team

### 4. Test Thoroughly
- Run existing tests before and after
- Add new tests for new functionality
- Perform regression testing
- Check integration with other components

## Integration with Other Commands

This refactoring command works well with:

- `@deep-research.md` - For understanding existing code and dependencies
- `@running-tests.md` - For ensuring refactored code still works
- `@running-linters.md` - For maintaining code quality
- `@api-validation.md` - For validating API contracts
- `@code-review-protocol.md` - For getting feedback on refactored code

## Quick Reference

### When to Use Comment-Based Refactoring
- Minor code improvements (under 50 lines)
- Simple refactorings (rename, extract method)
- Quick fixes and optimizations
- When preserving exact original code is important

### When to Use Backup-Based Refactoring
- Major structural changes (over 50 lines)
- Complete rewrites of components
- When significant functionality changes
- When you need a clean rollback option

### When to Use Incremental Refactoring
- Complex systems with many dependencies
- High-risk refactorings
- When you need to maintain uptime
- When gradual migration is preferred

## Note

This command is designed to ensure safe refactoring practices while preserving the ability to rollback changes if needed. Always follow industry best practices and maintain thorough testing throughout the refactoring process.