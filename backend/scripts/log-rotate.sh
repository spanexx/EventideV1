#!/bin/bash

# Log rotation script for Eventide backend
LOG_DIR="/home/spanexx/Desktop/Projects/EventideV1/backend/logs"
MAX_SIZE=2097152  # 2MB (much smaller than 10MB)
MAX_FILES=3       # Keep only 3 old log files instead of 5

# Check if log directory exists
if [ ! -d "$LOG_DIR" ]; then
  mkdir -p "$LOG_DIR"
fi

# Rotate pm2 logs
for logfile in "$LOG_DIR"/pm2-*.log; do
  if [ -f "$logfile" ]; then
    # Check file size
    if [ $(stat -c%s "$logfile") -gt $MAX_SIZE ]; then
      # Rotate logs
      for i in $(seq $((MAX_FILES - 1)) -1 1); do
        if [ -f "${logfile}.$i" ]; then
          mv "${logfile}.$i" "${logfile}.$((i + 1))"
        fi
      done
      mv "$logfile" "${logfile}.1"
      touch "$logfile"
    fi
  fi
done

# Clean up old log files (keep only last 3 days)
find "$LOG_DIR" -name "pm2-*.log.*" -mtime +3 -delete

echo "Log rotation completed: $(date)"