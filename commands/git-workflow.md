# Git Workflow Guide

This document outlines the Git workflow and best practices for the EventideV1 project.

## Branch Strategy

### Main Branches
- **`master`**: Production-ready code
- **`develop`**: Integration branch for features
- **`staging`**: Pre-production testing branch

### Feature Branches
- **Naming**: `{issue-number}-{feature-name}`
- **Examples**: `001-user-authentication`, `002-booking-system`
- **Lifecycle**: Created from `develop`, merged back to `develop`

### Hotfix Branches
- **Naming**: `hotfix-{issue-number}-{description}`
- **Examples**: `hotfix-001-critical-bug-fix`
- **Lifecycle**: Created from `master`, merged to both `master` and `develop`

## Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```
feat(auth): add JWT token validation
fix(booking): resolve timezone handling issue
docs(api): update authentication endpoints
refactor(users): extract user validation logic
```

## Workflow Steps

### 1. Starting a New Feature
```bash
# Switch to develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b 001-feature-name

# Start development
# ... make changes ...
```

### 2. During Development
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat(component): add new functionality"

# Push to remote
git push origin 001-feature-name
```

### 3. Before Merging
```bash
# Update with latest develop
git checkout develop
git pull origin develop
git checkout 001-feature-name
git rebase develop

# Run tests and linting
npm run test
npm run lint

# Push updated branch
git push origin 001-feature-name
```

### 4. Merging Feature
```bash
# Create pull request
# After approval, merge via GitHub/GitLab interface

# Clean up local branch
git checkout develop
git pull origin develop
git branch -d 001-feature-name
```

## Branch Protection Rules

### Master Branch
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to master

### Develop Branch
- Require pull request reviews
- Require status checks to pass
- Allow force pushes (for rebasing)

## Code Review Process

### Pull Request Guidelines
1. **Title**: Clear, descriptive title
2. **Description**: Detailed description of changes
3. **Screenshots**: For UI changes
4. **Testing**: How to test the changes
5. **Breaking Changes**: Document any breaking changes

### Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

## Conflict Resolution

### During Rebase
```bash
# If conflicts occur during rebase
git status
# Edit conflicted files
git add .
git rebase --continue
```

### During Merge
```bash
# If conflicts occur during merge
git status
# Edit conflicted files
git add .
git commit
```

## Git Hooks

### Pre-commit Hook
```bash
#!/bin/sh
# Run linting and tests before commit
npm run lint
npm run test:unit
```

### Pre-push Hook
```bash
#!/bin/sh
# Run full test suite before push
npm run test
npm run build
```

## Useful Git Commands

### Branch Management
```bash
# List all branches
git branch -a

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name

# Rename branch
git branch -m old-name new-name
```

### History and Logs
```bash
# View commit history
git log --oneline

# View file history
git log --follow filename

# View changes in last commit
git show

# View changes between branches
git diff branch1..branch2
```

### Stashing
```bash
# Stash current changes
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove stash
git stash pop
```

### Undoing Changes
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo changes to specific file
git checkout -- filename

# Revert a commit
git revert commit-hash
```

## Best Practices

### Do's
- Keep commits small and focused
- Write descriptive commit messages
- Test before committing
- Use meaningful branch names
- Keep feature branches up to date
- Clean up merged branches

### Don'ts
- Don't commit directly to master
- Don't commit sensitive information
- Don't commit large files
- Don't force push to shared branches
- Don't commit broken code
- Don't ignore merge conflicts

## Emergency Procedures

### Reverting a Release
```bash
# Create revert commit
git revert -m 1 commit-hash

# Push revert
git push origin master
```

### Hotfix Process
```bash
# Create hotfix branch from master
git checkout master
git pull origin master
git checkout -b hotfix-001-critical-fix

# Make fix and commit
# ... make changes ...
git add .
git commit -m "fix: critical security vulnerability"

# Merge to master and develop
git checkout master
git merge hotfix-001-critical-fix
git push origin master

git checkout develop
git merge hotfix-001-critical-fix
git push origin develop
```

## Troubleshooting

### Common Issues

#### "Your branch is ahead of origin"
```bash
git push origin branch-name
```

#### "Your branch is behind origin"
```bash
git pull origin branch-name
```

#### "Merge conflict"
```bash
# Resolve conflicts in files
git add .
git commit
```

#### "Detached HEAD"
```bash
git checkout branch-name
```

#### "Accidentally committed to wrong branch"
```bash
# Create new branch from current commit
git checkout -b correct-branch-name

# Reset original branch
git checkout original-branch
git reset --hard HEAD~1
```

## Integration with CI/CD

### GitHub Actions
- Runs on every push and pull request
- Enforces code quality checks
- Runs automated tests
- Deploys to staging on merge to develop

### Required Checks
- Linting passes
- All tests pass
- Build succeeds
- Security scan passes
- Code coverage meets threshold

## Documentation

### Keeping Documentation Updated
- Update README.md for major changes
- Update API documentation for endpoint changes
- Update deployment docs for infrastructure changes
- Update this guide for workflow changes

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)
