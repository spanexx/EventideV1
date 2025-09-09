# Code Review Protocol

This document outlines the standardized process for conducting thorough code reviews in the project.

## Usage

Reference this protocol during code reviews by using:
```
@code-review-protocol.md -[flag] "component/feature"
```

## Review Flags

### `-func` : Functionality Review
Example: `@code-review-protocol.md -func "BookingService"`
- Verifies business logic implementation
- Checks edge cases handling
- Reviews error management
- Validates input/output processing
- Examines state management

### `-style` : Code Style Review
Example: `@code-review-protocol.md -style "AuthController"`
- Checks coding standards compliance
- Reviews naming conventions
- Validates documentation quality
- Examines code organization
- Verifies formatting rules

### `-test` : Test Coverage Review
Example: `@code-review-protocol.md -test "PaymentModule"`
- Analyzes test coverage
- Reviews test quality
- Checks edge case testing
- Validates mocking approach
- Examines test organization

### `-perf` : Performance Review
Example: `@code-review-protocol.md -perf "DatabaseQueries"`
- Reviews algorithmic efficiency
- Checks resource usage
- Analyzes bottlenecks
- Examines caching strategy
- Validates optimization opportunities

### `-sec` : Security Review
Example: `@code-review-protocol.md -sec "UserAuthentication"`
- Reviews security practices
- Checks input validation
- Examines authorization logic
- Validates data protection
- Reviews error exposure

## Review Process

1. **Initial Assessment**
   - Code organization review
   - Documentation check
   - Test coverage analysis
   - Style compliance verification

2. **Deep Analysis**
   - Logic review
   - Edge case examination
   - Error handling check
   - Performance assessment
   - Security evaluation

3. **Integration Check**
   - API compatibility
   - Dependencies review
   - Breaking changes assessment
   - Migration requirements

4. **Quality Verification**
   - Code duplication check
   - Complexity assessment
   - Maintainability review
   - Scalability evaluation

## Review Checklist

### Functionality
- [ ] Implements requirements correctly
- [ ] Handles edge cases appropriately
- [ ] Includes proper error handling
- [ ] Maintains backward compatibility
- [ ] Follows business logic accurately

### Code Quality
- [ ] Follows coding standards
- [ ] Uses clear naming conventions
- [ ] Includes proper documentation
- [ ] Maintains single responsibility
- [ ] Avoids code duplication

### Testing
- [ ] Has adequate test coverage
- [ ] Includes edge case tests
- [ ] Uses appropriate test patterns
- [ ] Maintains test independence
- [ ] Includes integration tests

### Performance
- [ ] Uses efficient algorithms
- [ ] Manages resources properly
- [ ] Implements appropriate caching
- [ ] Handles scale requirements
- [ ] Optimizes critical paths

### Security
- [ ] Validates inputs properly
- [ ] Implements proper authentication
- [ ] Manages authorization correctly
- [ ] Protects sensitive data
- [ ] Handles errors securely

## Review Comment Template

```markdown
## Review Feedback: [Component/Feature]

### Strengths
- Point 1
- Point 2

### Areas for Improvement
- Issue 1
  - Suggestion:
  - Priority: [High/Medium/Low]

### Security Considerations
- Consideration 1
- Consideration 2

### Performance Notes
- Note 1
- Note 2

### Additional Comments
- Any other relevant feedback
```

## Best Practices

1. **Be Constructive**
   - Focus on improvement
   - Provide specific feedback
   - Suggest solutions
   - Explain reasoning

2. **Be Thorough**
   - Review completely
   - Check all aspects
   - Consider edge cases
   - Think about scale

3. **Be Collaborative**
   - Engage in discussion
   - Be open to alternatives
   - Share knowledge
   - Mentor when possible

## Note
This protocol should be used in conjunction with the project's other development guidelines and standards.
