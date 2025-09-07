# PM2 Process Management and Log Management

This document describes the PM2 process management setup and log management configuration for the Eventide backend application.

## Table of Contents
1. [PM2 Overview](#pm2-overview)
2. [Process Configuration](#process-configuration)
3. [Log Management](#log-management)
4. [Log Rotation](#log-rotation)
5. [NPM Scripts](#npm-scripts)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

## PM2 Overview

PM2 is a production process manager for Node.js applications with a built-in load balancer. It allows you to keep applications alive forever, to reload them without downtime, and to facilitate common system admin tasks.

## Process Configuration

The application is configured using `ecosystem.config.js` with the following settings:

```javascript
{
  name: 'eventide-backend',
  script: 'dist/main.js',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '256M', // Restart if memory exceeds 256MB
  env: {
    NODE_ENV: 'development',
    PORT: 3000,
  },
  env_production: {
    NODE_ENV: 'production',
    PORT: 3000,
  },
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  error_file: './logs/pm2-error.log',
  out_file: './logs/pm2-out.log',
  log_file: './logs/pm2-combined.log',
  combine_logs: true,
  kill_timeout: 5000,
  restart_delay: 2000,
  node_args: '--max-old-space-size=256', // Limit Node.js heap to 256MB
}
```

## Log Management

### Log File Locations
- **Output Logs**: `./logs/pm2-out.log`
- **Error Logs**: `./logs/pm2-error.log`
- **Combined Logs**: `./logs/pm2-combined.log`

### Log Size Limits
- Individual log files are limited to **2MB** each
- Only **3** old log files are retained
- Log files older than **3 days** are automatically deleted

### Log Format
Logs are formatted in JSON with timestamps for better parsing and analysis.

## Log Rotation

Log rotation is handled by a custom script located at `scripts/log-rotate.sh`. The script:

1. Checks if log files exceed 2MB
2. Rotates logs by moving old files to numbered backups
3. Keeps only the 3 most recent backup files
4. Deletes log files older than 3 days

The rotation script is scheduled to run daily via cron job.

## NPM Scripts

Several npm scripts are available for log management:

### `npm run log`
Displays the most recent logs (last 50 lines total):
- Last 25 lines of output logs
- Last 25 lines of error logs
- Current memory usage information

### `npm run log:tail`
Follows log files in real-time (similar to `tail -f`):
- Continuously displays new log entries
- Shows both output and error logs

### `npm run log:clean`
Cleans up all log files:
- Removes all PM2 log files
- Frees up disk space used by logs

## Monitoring and Maintenance

### Memory Monitoring
The application includes built-in memory monitoring that logs memory usage every 30 seconds. This helps identify memory leaks and optimize performance.

### Process Restart
PM2 automatically restarts the application if:
- The process crashes
- Memory usage exceeds 256MB
- The application becomes unresponsive

### Health Checks
The application exposes health check endpoints:
- `/api/health` - Basic health status
- `/api/health/details` - Detailed health information including memory usage

## Usage Examples

### Starting the Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Or use the ecosystem file directly
pm2 start .

# Start in production mode
pm2 start ecosystem.config.js --env production
```

### Viewing Process Status
```bash
# View all PM2 processes
pm2 status

# View specific application
pm2 status eventide-backend

# View detailed process information
pm2 show eventide-backend
```

### Managing the Application
```bash
# Restart the application
pm2 restart eventide-backend

# Stop the application
pm2 stop eventide-backend

# Delete the application from PM2
pm2 delete eventide-backend

# Reload the application
pm2 reload eventide-backend
```

### Log Management
```bash
# View recent logs
npm run log

# Follow logs in real-time
npm run log:tail

# Clean up old logs
npm run log:clean

# View PM2 logs directly
pm2 logs eventide-backend

# Flush all logs
pm2 flush
```

## Troubleshooting

### Common Issues

1. **Port already in use**: If the application fails to start due to port conflicts, kill the existing process or change the port in the environment configuration.

2. **Memory issues**: If the application restarts frequently due to memory limits, consider:
   - Increasing the memory limit in `ecosystem.config.js`
   - Investigating potential memory leaks
   - Optimizing cache usage

3. **Log file issues**: If log files grow unexpectedly:
   - Check the log rotation script is running
   - Verify cron job is properly configured
   - Manually clean logs with `npm run log:clean`

### Log Analysis

For detailed log analysis, you can use:
```bash
# Search for specific error patterns
grep "ERROR" logs/pm2-error.log

# Count occurrences of specific events
grep "Memory Usage" logs/pm2-out.log | wc -l

# View logs from a specific time period
awk '/2025-09-02 21:30:00/,/2025-09-02 21:45:00/' logs/pm2-out.log
```

## Best Practices

1. **Regular Monitoring**: Check logs regularly for errors and warnings
2. **Memory Management**: Monitor memory usage and optimize if it consistently exceeds 80% of the limit
3. **Log Rotation**: Ensure log rotation is working properly to prevent disk space issues
4. **Backup Configuration**: Keep backups of the PM2 configuration file
5. **Environment Variables**: Use appropriate environment variables for different deployment environments

## Configuration Files

- **Main Configuration**: `ecosystem.config.js`
- **Log Rotation Script**: `scripts/log-rotate.sh`
- **Log Viewing Script**: `scripts/view-logs.sh`
- **Setup Script**: `scripts/setup-log-rotation.sh`

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Node.js Memory Management](https://nodejs.org/api/process.html#process_process_memoryusage)
- [Log Rotation Best Practices](https://www.digitalocean.com/community/tutorials/how-to-manage-logfiles-with-logrotate-on-ubuntu-20-04)