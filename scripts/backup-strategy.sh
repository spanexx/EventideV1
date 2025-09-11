#!/usr/bin/env bash
# Execute backup and recovery operations
# Usage: ./backup-strategy.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
BACKUP_TYPE=""
BACKUP_SCOPE=""
RETENTION_PERIOD=""
STORAGE_LOCATION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            BACKUP_TYPE="$2"
            shift 2
            ;;
        --scope)
            BACKUP_SCOPE="$2"
            shift 2
            ;;
        --retention)
            RETENTION_PERIOD="$2"
            shift 2
            ;;
        --storage)
            STORAGE_LOCATION="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: create-backup, incremental-backup, database-backup, file-backup, restore-backup, verify-backup, cleanup-backups"
            exit 0
            ;;
        *)
            if [[ -z "$BACKUP_TYPE" ]]; then
                BACKUP_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$BACKUP_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create backup output directory
BACKUP_DIR="$REPO_ROOT/backups"
mkdir -p "$BACKUP_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$BACKUP_DIR/backup_${BACKUP_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$BACKUP_TYPE" in
    create-backup)
        echo "Creating full system backup..."
        BACKUP_FILE="$BACKUP_DIR/full_backup_${TIMESTAMP}.tar.gz"
        tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.git .
        ;;
    incremental-backup)
        echo "Creating incremental backup..."
        BACKUP_FILE="$BACKUP_DIR/incremental_backup_${TIMESTAMP}.tar.gz"
        tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.git --newer-mtime="1 day ago" .
        ;;
    database-backup)
        echo "Creating database backup..."
        BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
        pg_dump -h localhost -U postgres -d eventide > "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        ;;
    file-backup)
        echo "Creating file backup..."
        BACKUP_FILE="$BACKUP_DIR/files_backup_${TIMESTAMP}.tar.gz"
        tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.git src/ public/ config/
        ;;
    restore-backup)
        echo "Manual restore operation required. Please specify backup file."
        ;;
    verify-backup)
        echo "Verifying backup integrity..."
        find "$BACKUP_DIR" -name "*.tar.gz" -exec tar -tzf {} \; > /dev/null
        ;;
    cleanup-backups)
        echo "Cleaning up old backups..."
        find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
        find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
        ;;
esac

if $JSON_MODE; then
    printf '{"BACKUP_TYPE":"%s","BACKUP_SCOPE":"%s","RETENTION_PERIOD":"%s","STORAGE_LOCATION":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$BACKUP_TYPE" "$BACKUP_SCOPE" "$RETENTION_PERIOD" "$STORAGE_LOCATION" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "BACKUP_TYPE: $BACKUP_TYPE"
    echo "BACKUP_SCOPE: $BACKUP_SCOPE"
    echo "RETENTION_PERIOD: $RETENTION_PERIOD"
    echo "STORAGE_LOCATION: $STORAGE_LOCATION"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
