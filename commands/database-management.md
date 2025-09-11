# Database Management Guide

This document outlines database management practices, migrations, and maintenance procedures for the EventideV1 project.

## Database Architecture

### Primary Database
- **Type**: PostgreSQL
- **Version**: 14+
- **Host**: Production/Staging/Development environments
- **Connection Pool**: Managed by NestJS

### Database Schema
- **Users**: User accounts and profiles
- **Bookings**: Event bookings and reservations
- **Availability**: Time slot availability
- **Audit Logs**: System activity tracking
- **Sessions**: User session management

## Migration Management

### Creating Migrations
```bash
# Generate new migration
npm run migration:generate -- --name=AddUserTable

# Create empty migration
npm run migration:create -- --name=UpdateBookingSchema
```

### Running Migrations
```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Migration Best Practices
- Always backup before running migrations
- Test migrations on staging first
- Use transactions for data migrations
- Include rollback procedures
- Document breaking changes

## Schema Management

### Entity Definition
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Indexing Strategy
```typescript
// Single column index
@Index()
@Column()
email: string;

// Composite index
@Index(['userId', 'createdAt'])
@Column()
userId: string;

// Unique index
@Index({ unique: true })
@Column()
bookingReference: string;
```

## Data Seeding

### Seed Scripts
```bash
# Run seed scripts
npm run seed:run

# Create new seed
npm run seed:create -- --name=UserRoles

# Reset database with seeds
npm run db:reset
```

### Seed Data Structure
```typescript
export class UserRolesSeed implements DataSource {
  async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);
    
    const roles = [
      { name: 'admin', description: 'Administrator' },
      { name: 'user', description: 'Regular user' },
      { name: 'guest', description: 'Guest user' }
    ];

    for (const role of roles) {
      await roleRepository.save(role);
    }
  }
}
```

## Backup and Recovery

### Backup Procedures
```bash
# Full database backup
pg_dump -h localhost -U username -d eventide > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only backup
pg_dump -h localhost -U username -d eventide --schema-only > schema_backup.sql

# Data only backup
pg_dump -h localhost -U username -d eventide --data-only > data_backup.sql
```

### Automated Backups
```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups/eventide"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/eventide_backup_$DATE.sql"

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Recovery Procedures
```bash
# Restore from backup
psql -h localhost -U username -d eventide < backup_file.sql

# Restore specific table
psql -h localhost -U username -d eventide -c "\\copy table_name FROM 'data.csv' CSV HEADER"
```

## Performance Optimization

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE for query analysis
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Create appropriate indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
```

### Connection Pooling
```typescript
// TypeORM configuration
{
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Booking, Availability],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: 20, // Maximum connections
    min: 5,  // Minimum connections
    acquire: 30000, // Connection acquire timeout
    idle: 10000,    // Connection idle timeout
  }
}
```

### Monitoring Queries
```typescript
// Enable query logging
{
  logging: ['query', 'error', 'warn'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 1000, // Log slow queries
}
```

## Data Validation

### Entity Validation
```typescript
import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Length(2, 50)
  firstName: string;

  @IsNotEmpty()
  @Length(2, 50)
  lastName: string;

  @IsOptional()
  @Length(10, 15)
  phoneNumber?: string;
}
```

### Database Constraints
```sql
-- Add constraints
ALTER TABLE users ADD CONSTRAINT chk_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE bookings ADD CONSTRAINT chk_booking_date 
CHECK (booking_date >= CURRENT_DATE);

-- Add foreign key constraints
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

## Security Best Practices

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict database access by IP
- Regular security updates
- Audit database access

### Data Encryption
```typescript
// Encrypt sensitive data
import * as bcrypt from 'bcrypt';

@BeforeInsert()
async hashPassword() {
  this.password = await bcrypt.hash(this.password, 10);
}
```

### SQL Injection Prevention
```typescript
// Use parameterized queries
const user = await userRepository.findOne({
  where: { email: userEmail } // Safe parameterized query
});

// Avoid raw SQL with user input
// BAD: `SELECT * FROM users WHERE email = '${userInput}'`
// GOOD: Use TypeORM query builder or repository methods
```

## Monitoring and Maintenance

### Database Monitoring
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('eventide'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

### Maintenance Tasks
```sql
-- Update table statistics
ANALYZE;

-- Rebuild indexes
REINDEX DATABASE eventide;

-- Vacuum database
VACUUM ANALYZE;
```

### Health Checks
```typescript
// Database health check endpoint
@Get('health/database')
async checkDatabaseHealth() {
  try {
    await this.dataSource.query('SELECT 1');
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Environment-Specific Configuration

### Development
```typescript
// Development database config
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'eventide_dev',
  password: 'dev_password',
  database: 'eventide_dev',
  synchronize: true, // Only in development
  logging: true,
}
```

### Staging
```typescript
// Staging database config
{
  type: 'postgres',
  host: process.env.STAGING_DB_HOST,
  port: parseInt(process.env.STAGING_DB_PORT),
  username: process.env.STAGING_DB_USERNAME,
  password: process.env.STAGING_DB_PASSWORD,
  database: process.env.STAGING_DB_NAME,
  synchronize: false,
  logging: false,
}
```

### Production
```typescript
// Production database config
{
  type: 'postgres',
  host: process.env.PROD_DB_HOST,
  port: parseInt(process.env.PROD_DB_PORT),
  username: process.env.PROD_DB_USERNAME,
  password: process.env.PROD_DB_PASSWORD,
  database: process.env.PROD_DB_NAME,
  synchronize: false,
  logging: false,
  ssl: { rejectUnauthorized: false },
}
```

## Troubleshooting

### Common Issues

#### Connection Timeout
```bash
# Check connection settings
# Increase timeout values
# Verify network connectivity
```

#### Migration Failures
```bash
# Check migration status
npm run migration:show

# Manually fix migration issues
# Rollback and re-run if necessary
```

#### Performance Issues
```sql
-- Identify slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY n_distinct DESC;
```

## Documentation

### Schema Documentation
- Keep entity definitions updated
- Document relationships between tables
- Maintain data dictionary
- Document business rules and constraints

### Migration Documentation
- Document purpose of each migration
- Include rollback procedures
- Note any data transformations
- Document breaking changes

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)
- [Performance Tuning Guide](https://www.postgresql.org/docs/current/performance-tips.html)
