module.exports = {
  apps: [
    {
      name: 'eventide-backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M', // Reduced from 512M - more reasonable for this app
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging configuration with size limits
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      combine_logs: true,
      // Log rotation settings - much smaller limits
      max_memory_restart: '256M',
      log_type: 'json',
      // Process monitoring
      kill_timeout: 5000,
      restart_delay: 2000,
      // Node.js specific options
      node_args: '--max-old-space-size=256', // Reduced memory limit
    },
  ],
};