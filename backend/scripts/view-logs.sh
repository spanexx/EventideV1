#!/bin/bash

# Script to view recent logs
LOG_DIR="./logs"

if [ ! -d "$LOG_DIR" ]; then
  echo "Log directory not found. Starting application with 'npm run start'..."
  npm run start
  exit 0
fi

echo "=== Recent Application Logs (last 50 lines total) ==="
echo ""

# Check for PM2 logs first
if [ -f "$LOG_DIR/pm2-out.log" ] || [ -f "$LOG_DIR/pm2-error.log" ]; then
  echo "--- Output Logs (last 25 lines) ---"
  if [ -f "$LOG_DIR/pm2-out.log" ]; then
    tail -n 25 "$LOG_DIR/pm2-out.log" 2>/dev/null || echo "No output logs available"
  else
    echo "Output log file not found"
  fi
  
  echo ""
  echo "--- Error Logs (last 25 lines) ---"
  if [ -f "$LOG_DIR/pm2-error.log" ]; then
    tail -n 25 "$LOG_DIR/pm2-error.log" 2>/dev/null || echo "No error logs available"
  else
    echo "Error log file not found"
  fi
else
  echo "No PM2 logs found. Starting application with 'npm run start'..."
  npm run start
fi

echo ""
echo "=== Memory Usage ==="
# Show current memory usage if application is running
if pgrep -f "eventide-backend" > /dev/null; then
  PM2_PID=$(pgrep -f "eventide-backend")
  echo "Application is running (PID: $PM2_PID)"
  ps -p $PM2_PID -o pid,vsz,rss,comm
else
  echo "Application is not currently running"
fi