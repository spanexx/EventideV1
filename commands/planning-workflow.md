# Planning and Context Gathering Workflow

This document outlines the systematic approach to planning and gathering context before implementing any changes in the Eventide project.

## Quick Usage

```bash
@planning-workflow.md -task "Your task description"
```

## Workflow Steps

### 1. Initial Context Gathering
```bash
# Analyze related files
@deep-research.md -text "your feature keywords"

# Review architecture impact
@deep-research.md -arch "your feature area"

# Check existing implementations
@deep-research.md -code "related component name"
```

### 2. Dependency Analysis
```bash
# Check affected dependencies
@deep-research.md -dep "affected module"

# Review security implications
@deep-research.md -sec "security concerns"

# Analyze performance impact
@deep-research.md -perf "performance metrics"
```

## Planning Checklist

### 1. Requirements Analysis ✍️
- [ ] Understand core requirements
- [ ] Identify edge cases
- [ ] List acceptance criteria
- [ ] Document assumptions
- [ ] Identify stakeholders

### 2. Technical Assessment 🔍
- [ ] Review existing codebase
- [ ] Identify affected components
- [ ] Check dependencies
- [ ] Assess security implications
- [ ] Consider performance impact

### 3. Architecture Review 🏗️
- [ ] Validate against current architecture
- [ ] Check design patterns
- [ ] Review data flow
- [ ] Assess scalability impact
- [ ] Consider maintainability

### 4. Risk Assessment ⚠️
- [ ] Identity potential risks
- [ ] Plan mitigation strategies
- [ ] Consider rollback options
- [ ] Document critical paths
- [ ] Review failure scenarios

### 5. Implementation Strategy 📋
- [ ] Break down into tasks
- [ ] Estimate effort
- [ ] Plan testing strategy
- [ ] Document required changes
- [ ] Define success criteria

## Context Gathering Commands

### 1. Codebase Analysis
```bash
# Search for related code
@deep-research.md -code "component name"

# Find usage examples
@deep-research.md -text "feature usage"

# Review test coverage
npm run test:coverage
```

### 2. Documentation Review
```bash
# Check API documentation
@deep-research.md -text "API endpoints"

# Review architecture docs
@deep-research.md -arch "system design"
```

### 3. Performance Consideration
```bash
# Check performance metrics
@deep-research.md -perf "metrics"

# Review existing bottlenecks
@deep-research.md -perf "bottlenecks"
```

## Decision Documentation

### Template
```markdown
## Feature Planning: [Feature Name]

### Context
- Requirement overview
- Current system state
- Constraints and limitations

### Considerations
- Technical implications
- Security considerations
- Performance impact
- Maintenance overhead

### Proposed Solution
- Implementation approach
- Alternative solutions
- Trade-offs
- Success metrics

### Action Items
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
```

## Best Practices

1. **Always Start with Research**
   - Review existing code
   - Check documentation
   - Understand current implementation

2. **Document Decisions**
   - Record assumptions
   - Note trade-offs
   - Explain approach

3. **Consider Impact**
   - Security implications
   - Performance effects
   - Maintenance overhead
   - User experience

4. **Plan for Quality**
   - Test strategy
   - Error handling
   - Edge cases
   - Monitoring needs

5. **Think Long-term**
   - Scalability
   - Maintainability
   - Future extensions
   - Technical debt

## Example Usage

```bash
# For a new feature
@planning-workflow.md -task "Implement user authentication"

# Review implementation plan
@deep-research.md -arch "authentication flow"
@deep-research.md -sec "authentication security"
@deep-research.md -perf "auth performance"
```

## Note
This workflow is designed to be thorough while remaining practical. Adjust the depth of analysis based on the task's complexity and impact.
