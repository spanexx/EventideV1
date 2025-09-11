# Enhanced Prompt

**Original Prompt:** {{PROMPT_TEXT}}  
**Enhancement Scope:** {{ENHANCEMENT_SCOPE}}  
**Context Depth:** {{CONTEXT_DEPTH}}  
**Generated:** {{TIMESTAMP}}  
**Repository:** {{REPO_ROOT}}

## Original Prompt

{{PROMPT_TEXT}}

## Contextual Information

### Codebase Analysis
- **Key Topics Identified:** {{KEY_TOPICS}}
- **File References:** {{FILE_REFERENCES}}
- **Command References:** {{COMMAND_REFERENCES}}
- **Enhancement Summary:** {{ENHANCEMENT_SUMMARY}}

### Related Components
| Component | Type | Location | Relevance |
|-----------|------|----------|-----------|
| [Component 1] | [Service/Controller/Model] | [Path] | [High/Medium/Low] |
| [Component 2] | [Service/Controller/Model] | [Path] | [High/Medium/Low] |
| [Component 3] | [Service/Controller/Model] | [Path] | [High/Medium/Low] |

### Architecture Context
- **System Architecture:** [Architecture overview]
- **Design Patterns:** [Patterns used in the codebase]
- **Technology Stack:** [Technologies and frameworks]
- **Integration Points:** [Key integration points]

## Technical Considerations

### Security Implications
- **Authentication:** [Current auth implementation and considerations]
- **Authorization:** [Access control patterns and requirements]
- **Data Protection:** [Data security measures and requirements]
- **Input Validation:** [Validation patterns and security measures]

### Performance Factors
- **Response Time:** [Performance requirements and current metrics]
- **Scalability:** [Scalability considerations and patterns]
- **Caching Strategy:** [Caching implementation and opportunities]
- **Resource Usage:** [Memory, CPU, and network considerations]

### Integration Points
- **API Endpoints:** [Relevant API endpoints and patterns]
- **Database Operations:** [Database patterns and considerations]
- **External Services:** [Third-party integrations and requirements]
- **Event Handling:** [Event patterns and messaging]

### Dependencies
- **Direct Dependencies:** [Required packages and libraries]
- **Internal Dependencies:** [Internal modules and services]
- **External Dependencies:** [External services and APIs]
- **Version Constraints:** [Version requirements and compatibility]

## Implementation Guidance

### Best Practices
- **Coding Standards:** [Project coding standards and conventions]
- **Error Handling:** [Error handling patterns and requirements]
- **Logging:** [Logging patterns and requirements]
- **Testing:** [Testing patterns and requirements]

### Code Examples
```typescript
// Example implementation pattern
export class ExampleService {
  constructor(
    private readonly dependency: DependencyService,
    private readonly logger: Logger
  ) {}

  async processRequest(request: Request): Promise<Response> {
    try {
      // Implementation following project patterns
      const result = await this.dependency.process(request);
      this.logger.info('Request processed successfully', { requestId: request.id });
      return result;
    } catch (error) {
      this.logger.error('Request processing failed', { error, requestId: request.id });
      throw new ProcessingError('Failed to process request', error);
    }
  }
}
```

### Common Patterns
- **Service Pattern:** [How services are structured in the project]
- **Controller Pattern:** [How controllers handle requests]
- **Model Pattern:** [How data models are defined]
- **Repository Pattern:** [How data access is handled]

### Testing Considerations
- **Unit Tests:** [Unit testing patterns and requirements]
- **Integration Tests:** [Integration testing patterns]
- **End-to-End Tests:** [E2E testing considerations]
- **Mocking Strategy:** [Mocking patterns and tools]

## Reference Materials

### Related Documentation
- **API Documentation:** [Links to relevant API docs]
- **Architecture Documentation:** [Links to architecture docs]
- **Development Guidelines:** [Links to development guidelines]
- **Deployment Documentation:** [Links to deployment docs]

### Similar Implementations
- **Existing Features:** [Similar features in the codebase]
- **Code Examples:** [Relevant code examples and patterns]
- **Configuration Examples:** [Configuration patterns and examples]
- **Integration Examples:** [Integration patterns and examples]

### External Resources
- **Framework Documentation:** [Links to framework docs]
- **Library Documentation:** [Links to library docs]
- **Best Practices:** [Links to best practice guides]
- **Community Resources:** [Links to community resources]

## File Context

### Referenced Files
| File | Type | Content Summary | Relevance |
|------|------|-----------------|-----------|
| [File 1] | [Type] | [Summary] | [High/Medium/Low] |
| [File 2] | [Type] | [Summary] | [High/Medium/Low] |
| [File 3] | [Type] | [Summary] | [High/Medium/Low] |

### Key Code Snippets
```typescript
// From [file path]
[Code snippet with context]

// From [file path]
[Code snippet with context]

// From [file path]
[Code snippet with context]
```

### Configuration Examples
```json
// From [config file]
{
  "example": "configuration",
  "with": "relevant settings"
}
```

## Command Context

### Referenced Commands
| Command | Purpose | Usage | Relevance |
|---------|---------|-------|-----------|
| [Command 1] | [Purpose] | [Usage] | [High/Medium/Low] |
| [Command 2] | [Purpose] | [Usage] | [High/Medium/Low] |
| [Command 3] | [Purpose] | [Usage] | [High/Medium/Low] |

### Command Instructions
- **Planning Workflow:** [Relevant planning instructions]
- **Execution Guidelines:** [Relevant execution instructions]
- **Research Protocols:** [Relevant research instructions]
- **Review Processes:** [Relevant review instructions]

## Enhanced Prompt

### Contextualized Request
Based on the analysis above, here's the enhanced prompt with full context:

**Original Request:** {{PROMPT_TEXT}}

**Enhanced Context:**
- **Project Context:** [Project-specific context and constraints]
- **Technical Context:** [Technical requirements and considerations]
- **Implementation Context:** [Implementation patterns and best practices]
- **Integration Context:** [Integration requirements and patterns]

### Specific Requirements
- **Functional Requirements:** [Specific functional requirements]
- **Non-functional Requirements:** [Performance, security, scalability requirements]
- **Technical Constraints:** [Technology and framework constraints]
- **Integration Requirements:** [Integration and compatibility requirements]

### Implementation Approach
- **Recommended Approach:** [Recommended implementation approach]
- **Alternative Approaches:** [Alternative implementation approaches]
- **Risk Considerations:** [Implementation risks and mitigation strategies]
- **Success Criteria:** [Success criteria and validation methods]

## Next Steps

### Immediate Actions
- [ ] [Action 1 based on context]
- [ ] [Action 2 based on context]
- [ ] [Action 3 based on context]

### Implementation Tasks
- [ ] [Task 1 with specific context]
- [ ] [Task 2 with specific context]
- [ ] [Task 3 with specific context]

### Follow-up Activities
- [ ] [Activity 1 with context]
- [ ] [Activity 2 with context]
- [ ] [Activity 3 with context]

## Conclusion

This enhanced prompt provides comprehensive context from the codebase analysis, including relevant components, technical considerations, implementation guidance, and reference materials. The enhanced context should enable more accurate and relevant AI responses that align with the project's architecture, patterns, and requirements.

---

*This enhanced prompt was generated automatically. Please review and validate the context before proceeding with implementation.*
