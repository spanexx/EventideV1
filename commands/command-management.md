# Command Management Instructions

This document provides instructions for managing command files and documentation in the Eventide project.

## Usage Patterns

### Cleanup Instructions
```bash
@command-management.md -cleanup "feature/topic name"
```

### Documentation Creation
```bash
@command-management.md -doc "feature/topic name"
```

---

## 🧹 Cleanup Operations (`-cleanup`)

When the `-cleanup` flag is used, the following actions should be taken:

### File Removal Strategy
1. **Identify Outdated Files**: Remove planning, research, and draft files that are no longer needed
2. **Preserve Essential Documentation**: Keep final implementation docs and completion summaries
3. **Consolidate Information**: Merge scattered information into single comprehensive documents

### Cleanup Patterns

#### For Feature Implementation Cleanup:
- **Remove**: `*-planning.md`, `*-research.md`, `*-draft.md`, `*-temp.md`
- **Remove**: Multiple phase files when consolidated into completion doc
- **Keep**: Final implementation guides, completion documentation, usage instructions
- **Keep**: Reference materials and best practices

#### For Timezone Cleanup Example:
- **Remove**: `timezone-execution.md` (replaced by completion doc)
- **Remove**: Any `timezone-planning.md`, `timezone-research.md` files
- **Keep**: `timezone-implementation-complete.md` (final documentation)
- **Keep**: `command-line-guide.md` (reference material)

### Cleanup Checklist
- [ ] Identify all files related to the topic/feature
- [ ] Determine which files contain unique/essential information
- [ ] Merge information from multiple files into comprehensive docs
- [ ] Remove redundant or outdated files
- [ ] Update README.md to reflect file changes
- [ ] Verify no broken references remain

---

## 📝 Documentation Creation (`-doc`)

When the `-doc` flag is used, the following actions should be taken:

### Documentation Standards
1. **Comprehensive Coverage**: Document what was implemented, how it works, and impact
2. **Technical Details**: Include code changes, architecture decisions, and patterns used
3. **Business Value**: Explain problem solved and value delivered
4. **Future Reference**: Provide information useful for maintenance and enhancement
5. **Proper Location**: Create completion documentation in `docs/` folder, not `commands/`

### Documentation Structure Template
```markdown
# [Feature Name] - Complete ✅

## Implementation Status: COMPLETE
- Implementation Date
- Total Time  
- Status Summary

## 🎯 What Was Accomplished
- Major achievements
- Technical implementations
- Business value delivered

## 🔧 Technical Implementation Details
- Code changes made
- Architecture decisions
- Design patterns used

## 🚀 Functional Achievements
- Before/after comparison
- User experience improvements
- System capabilities gained

## 🔍 Architecture & Design Patterns
- Code examples
- Integration patterns
- Best practices implemented

## 📊 Performance & Quality Metrics
- Performance measurements
- Quality standards met
- Testing validation

## 🎯 Business Impact
- Problems solved
- Value delivered
- User benefits

## 📁 Files Modified
- List of all changed files
- Summary of changes per file

## 🎉 Success Criteria Met
- Functional requirements checklist
- Technical requirements checklist
- Quality requirements checklist

## 🚀 Next Steps (Optional)
- Future enhancement opportunities
- Maintenance considerations

## 📖 Related Documentation
- Links to relevant docs
- Reference materials

## 🎯 Conclusion
- Summary of completion
- Production readiness status
```

### Documentation Best Practices
1. **Clear Status**: Always indicate completion status clearly
2. **Technical Depth**: Include enough detail for future maintenance
3. **Business Context**: Explain why the work was important
4. **Code Examples**: Show key implementation patterns
5. **File Tracking**: List all modified files
6. **Success Validation**: Confirm requirements were met

---

## 🔄 Workflow Integration

### With Project Planning
- Use after completing major features or implementations
- Integrate with existing documentation standards
- Follow the established development workflow

### With Task Management
- Mark related tasks as complete when documentation is finished
- Update project status documents
- Notify stakeholders of completion

### With Version Control
- Include documentation updates in feature completion commits
- Tag releases with appropriate documentation
- Maintain documentation history

---

## 📋 Examples

### Timezone Implementation Example
```bash
# Cleanup timezone files
@command-management.md -cleanup "timezone"
# Result: Remove timezone-execution.md from commands/, keep docs/timezone-implementation-complete.md

# Document timezone implementation  
@command-management.md -doc "timezone"
# Result: Create comprehensive timezone-implementation-complete.md in docs/ folder
```

### Feature Development Example
```bash
# After completing user authentication feature
@command-management.md -cleanup "authentication" 
# Remove: auth-planning.md, auth-research.md, auth-draft.md from commands/
# Keep: docs/auth-implementation-complete.md, docs/auth-security-guide.md

@command-management.md -doc "authentication"
# Create: comprehensive authentication implementation documentation in docs/
```

---

## 🎯 Goals

### Documentation Goals
- **Completeness**: Capture all important implementation details
- **Clarity**: Make documentation easily understandable
- **Maintenance**: Enable future developers to understand and modify
- **Knowledge Transfer**: Preserve institutional knowledge

### Cleanup Goals  
- **Organization**: Keep command directory clean and organized
- **Relevance**: Remove outdated and redundant files
- **Efficiency**: Make it easier to find current, relevant documentation
- **Standards**: Maintain consistent documentation structure

---

## 📚 File Management Rules

### Keep These File Types
- **Completion Documentation**: `*-complete.md`, `*-implementation.md`
- **Reference Guides**: `*-guide.md`, `*-protocol.md`
- **Usage Instructions**: `*-usage.md`, `*-reference.md`
- **Best Practices**: `*-best-practices.md`, `*-standards.md`

### Remove These File Types (During Cleanup)
- **Planning Files**: `*-planning.md`, `*-plan.md`
- **Research Files**: `*-research.md`, `*-analysis.md`
- **Draft Files**: `*-draft.md`, `*-temp.md`, `*-wip.md`
- **Execution Files**: `*-execution.md` (when replaced by completion docs)

### Update These Files
- **README.md**: Update with new documentation references
- **Index Files**: Update any documentation indexes
- **Related Documentation**: Update cross-references

---

## 🎯 Success Criteria

### For Cleanup Operations
- [ ] Redundant files removed
- [ ] Essential information preserved
- [ ] Documentation consolidated
- [ ] References updated
- [ ] Directory remains organized

### For Documentation Operations
- [ ] Comprehensive documentation created
- [ ] Technical details captured
- [ ] Business value explained
- [ ] Future maintenance enabled
- [ ] Standards followed

---

This instruction file enables consistent management of command documentation, ensuring the commands directory remains organized while preserving essential information for future reference and maintenance.