# Deep Research Protocol

This document serves as an automated research protocol that can be invoked with specific flags to conduct deep analysis of different aspects of the codebase.

## Usage

When you mention this file with a flag and argument:
```
@deep-research.md -[flag] "search text"
```

The system will automatically conduct thorough research based on the flag type.

## Available Flags

### `-text` : General Text Search
Example: `@deep-research.md -text "authentication flow"`
- Performs semantic code search
- Analyzes documentation
- Looks for related test files
- Examines recent changes
- Maps related functions and usages

### `-code` : Code Analysis
Example: `@deep-research.md -code "AuthService"`
- Finds all implementations and usages
- Maps dependencies
- Analyzes test coverage
- Reviews related PRs
- Examines error logs

### `-arch` : Architecture Analysis
Example: `@deep-research.md -arch "booking system"`
- Maps module relationships
- Analyzes data flow
- Reviews system design
- Examines scalability points
- Documents integration points

### `-perf` : Performance Analysis
Example: `@deep-research.md -perf "database queries"`
- Identifies bottlenecks
- Reviews caching strategy
- Analyzes query patterns
- Examines load handling
- Maps resource usage

### `-sec` : Security Analysis
Example: `@deep-research.md -sec "authentication"`
- Reviews security measures
- Analyzes vulnerability points
- Examines input validation
- Reviews access controls
- Maps attack surfaces

### `-dep` : Dependency Analysis
Example: `@deep-research.md -dep "mongodb"`
- Maps direct dependencies
- Finds indirect dependencies
- Reviews version constraints
- Checks for vulnerabilities
- Examines usage patterns

## Research Steps

For each research request, the system will:

1. **Initial Scan**
   - Review relevant documentation
   - Search codebase for matches
   - Map related components
   - Conduct web search for best practices and known issues
   - Review relevant technology documentation

2. **External Research**
   - Search official documentation
   - Review technology forums
   - Examine similar implementations
   - Study industry standards
   - Analyze common pitfalls

3. **Deep Analysis**
   - Examine implementation details
   - Review test coverage
   - Analyze dependencies
   - Check error patterns

3. **Context Building**
   - Map component relationships
   - Document data flow
   - Identify integration points

4. **Quality Assessment**
   - Review performance implications
   - Check security considerations
   - Examine error handling
   - Validate test coverage

5. **Documentation**
   - Summarize findings
   - Highlight key points
   - Provide recommendations
   - List related resources

## Output Format

The research results will be organized as follows:

```markdown
## Research Results: [Topic]

### Overview
- Brief description of findings
- Key components identified
- Critical considerations

### Technical Details
- Implementation specifics
- Dependencies and relationships
- Performance implications
- Security considerations

### Recommendations
- Suggested improvements
- Best practices to follow
- Potential optimizations

### Related Resources
- Documentation links
- Code references
- Test coverage
- Related PRs
- External resources
  - Official documentation
  - Community discussions
  - Stack Overflow threads
  - Blog posts and tutorials
  - Industry best practices
```

## Best Practices

1. **Be Specific**
   - Use precise search terms
   - Include context in requests
   - Specify scope when needed

2. **Follow Up**
   - Review findings thoroughly
   - Ask clarifying questions
   - Request deeper analysis if needed

3. **Document Insights**
   - Save important findings
   - Update documentation
   - Share key learnings
   - Reference external sources
   - Create knowledge base entries

4. **External Knowledge Integration**
   - Link to official documentation
   - Reference community solutions
   - Document industry standards
   - Maintain external resource links
   - Track technology updates

## Note
This is a living document. Flags and functionality may be updated based on project needs and feedback.
