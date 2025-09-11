# Database Management Report

**Operation Type:** {{OPERATION_TYPE}}  
**Migration Name:** {{MIGRATION_NAME}}  
**Seed Name:** {{SEED_NAME}}  
**Database Environment:** {{DATABASE_ENV}}  
**Generated:** {{TIMESTAMP}}  
**Repository:** {{REPO_ROOT}}

## Executive Summary

- **Operation Status:** [SUCCESS/FAILED/PARTIAL]
- **Operation Duration:** [Time]
- **Database Environment:** {{DATABASE_ENV}}
- **Operation Type:** {{OPERATION_TYPE}}

## Operation Details

### Pre-Operation Status
- **Database Connection:** [Connected/Disconnected]
- **Migration Status:** [Up to date/Behind/Ahead]
- **Database Size:** [Size]
- **Active Connections:** [Count]

### Operation Execution
- **Command Executed:** [Database command]
- **Parameters Used:** [Command parameters]
- **Execution Time:** [Time]
- **Exit Code:** [0/1/Other]

### Post-Operation Status
- **Database Connection:** [Connected/Disconnected]
- **Migration Status:** [Up to date/Behind/Ahead]
- **Database Size:** [Size]
- **Active Connections:** [Count]

## Database Information

### Connection Details
- **Host:** [Hostname]
- **Port:** [Port number]
- **Database:** [Database name]
- **User:** [Username]
- **Environment:** {{DATABASE_ENV}}

### Schema Information
- **Version:** [Schema version]
- **Tables:** [Count]
- **Indexes:** [Count]
- **Constraints:** [Count]

## Migration Details

### Migration Status
| Migration | Status | Applied Date | Duration |
|-----------|--------|--------------|----------|
| [Migration 1] | [Applied/Pending/Failed] | [Date] | [Time] |
| [Migration 2] | [Applied/Pending/Failed] | [Date] | [Time] |
| [Migration 3] | [Applied/Pending/Failed] | [Date] | [Time] |

### Migration Files
- **Created:** [Count]
- **Modified:** [Count]
- **Deleted:** [Count]
- **Pending:** [Count]

### Migration Content
```sql
-- Migration: {{MIGRATION_NAME}}
[SQL content]

-- Rollback: {{MIGRATION_NAME}}
[Rollback SQL content]
```

## Seed Data Information

### Seed Status
| Seed | Status | Records | Duration |
|------|--------|---------|----------|
| [Seed 1] | [Executed/Failed] | [Count] | [Time] |
| [Seed 2] | [Executed/Failed] | [Count] | [Time] |
| [Seed 3] | [Executed/Failed] | [Count] | [Time] |

### Seed Content
```typescript
// Seed: {{SEED_NAME}}
[Seed code content]
```

## Database Performance

### Query Performance
- **Average Query Time:** [Time]
- **Slow Queries:** [Count]
- **Query Cache Hit Rate:** [Percentage]

### Resource Usage
- **CPU Usage:** [Percentage]
- **Memory Usage:** [Percentage]
- **Disk Usage:** [Percentage]
- **Connection Pool:** [Active/Max]

### Index Analysis
- **Unused Indexes:** [Count]
- **Missing Indexes:** [Count]
- **Duplicate Indexes:** [Count]

## Backup Information

### Backup Status
- **Last Backup:** [Date and time]
- **Backup Size:** [Size]
- **Backup Location:** [Path]
- **Backup Status:** [Success/Failed]

### Backup Details
- **Backup Type:** [Full/Incremental/Differential]
- **Compression:** [Yes/No]
- **Encryption:** [Yes/No]
- **Retention Period:** [Days]

## Data Integrity

### Integrity Checks
- **Foreign Key Constraints:** [Pass/Fail]
- **Check Constraints:** [Pass/Fail]
- **Unique Constraints:** [Pass/Fail]
- **Data Validation:** [Pass/Fail]

### Data Quality
- **Orphaned Records:** [Count]
- **Duplicate Records:** [Count]
- **Null Values:** [Count]
- **Data Inconsistencies:** [Count]

## Issues and Resolutions

### Operation Issues
- [Issue 1]: [Description and resolution]
- [Issue 2]: [Description and resolution]
- [Issue 3]: [Description and resolution]

### Migration Issues
- [Issue 1]: [Description and resolution]
- [Issue 2]: [Description and resolution]
- [Issue 3]: [Description and resolution]

### Performance Issues
- [Issue 1]: [Description and resolution]
- [Issue 2]: [Description and resolution]
- [Issue 3]: [Description and resolution]

## Security Analysis

### Access Control
- **User Permissions:** [Status]
- **Role Assignments:** [Status]
- **Access Logs:** [Status]

### Data Protection
- **Encryption at Rest:** [Status]
- **Encryption in Transit:** [Status]
- **Sensitive Data:** [Status]

## Monitoring and Alerts

### Database Monitoring
- **Health Checks:** [Status]
- **Performance Monitoring:** [Status]
- **Error Monitoring:** [Status]

### Alert Configuration
- **Connection Alerts:** [Configured/Not configured]
- **Performance Alerts:** [Configured/Not configured]
- **Error Alerts:** [Configured/Not configured]

## Recommendations

### Performance Optimization
- [ ] [Recommendation 1]
- [ ] [Recommendation 2]
- [ ] [Recommendation 3]

### Security Improvements
- [ ] [Recommendation 1]
- [ ] [Recommendation 2]
- [ ] [Recommendation 3]

### Maintenance Tasks
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

## Next Steps

### Immediate Actions
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

### Scheduled Tasks
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

### Long-term Planning
- [ ] [Plan 1]
- [ ] [Plan 2]
- [ ] [Plan 3]

## Conclusion

[Overall assessment of the database operation and recommendations for next steps]

---

*This database management report was generated automatically. Please review and validate the operation results before proceeding.*
