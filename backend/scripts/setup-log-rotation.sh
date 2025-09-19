#!/bin/bash

# Setup log rotation for Eventide backend

# Create logrotate configuration
cat > /tmp/eventide-logrotate << 'EOF'
/home/spanexx/Desktop/Projects/EventideV1/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 spanexx spanexx
    size 10M
    postrotate
        pm2 reloadLogs >/dev/null 2>&1 || true
    endscript
}
EOF

# Copy to logrotate directory (if we have permissions)
if [ -w "/etc/logrotate.d/" ]; then
    sudo cp /tmp/eventide-logrotate /etc/logrotate.d/eventide-backend
    echo "Log rotation configured via logrotate"
else
    # Create a simple daily cron job instead
    (crontab -l 2>/dev/null; echo "0 2 * * * /home/spanexx/Desktop/Projects/EventideV1/backend/scripts/log-rotate.sh") | crontab -
    echo "Log rotation configured via cron job (runs daily at 2 AM)"
fi

# Clean up temporary file
rm -f /tmp/eventide-logrotate