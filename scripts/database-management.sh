#!/usr/bin/env bash
# Database management operations including migrations, seeding, and maintenance
# Usage: ./database-management.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
OPERATION_TYPE=""
MIGRATION_NAME=""
SEED_NAME=""
DATABASE_ENV="development"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --operation)
            OPERATION_TYPE="$2"
            shift 2
            ;;
        --migration)
            MIGRATION_NAME="$2"
            shift 2
            ;;
        --seed)
            SEED_NAME="$2"
            shift 2
            ;;
        --env)
            DATABASE_ENV="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --operation <operation> [options]"
            echo "Operations: create-migration, run-migrations, revert-migration, create-seed, run-seeds, backup-database, restore-database, optimize-database, check-health"
            exit 0
            ;;
        *)
            if [[ -z "$OPERATION_TYPE" ]]; then
                OPERATION_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$OPERATION_TYPE" ]]; then
    echo "Usage: $0 [--json] --operation <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create database operations output directory
DB_OPS_DIR="$REPO_ROOT/database-operations"
mkdir -p "$DB_OPS_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$DB_OPS_DIR/db_${OPERATION_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$OPERATION_TYPE" in
    create-migration)
        if [[ -z "$MIGRATION_NAME" ]]; then
            echo "Error: Migration name required for create-migration operation" >&2
            exit 1
        fi
        cd "$REPO_ROOT/backend"
        npm run migration:generate -- --name="$MIGRATION_NAME"
        ;;
    run-migrations)
        cd "$REPO_ROOT/backend"
        npm run migration:run
        ;;
    revert-migration)
        cd "$REPO_ROOT/backend"
        npm run migration:revert
        ;;
    create-seed)
        if [[ -z "$SEED_NAME" ]]; then
            echo "Error: Seed name required for create-seed operation" >&2
            exit 1
        fi
        cd "$REPO_ROOT/backend"
        npm run seed:create -- --name="$SEED_NAME"
        ;;
    run-seeds)
        cd "$REPO_ROOT/backend"
        npm run seed:run
        ;;
    backup-database)
        BACKUP_FILE="$DB_OPS_DIR/backup_${DATABASE_ENV}_${TIMESTAMP}.sql"
        pg_dump -h localhost -U postgres -d "eventide_${DATABASE_ENV}" > "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        ;;
    restore-database)
        echo "Manual restore operation required. Please specify backup file."
        ;;
    optimize-database)
        cd "$REPO_ROOT/backend"
        psql -h localhost -U postgres -d "eventide_${DATABASE_ENV}" -c "VACUUM ANALYZE;"
        ;;
    check-health)
        cd "$REPO_ROOT/backend"
        npm run db:health-check
        ;;
esac

if $JSON_MODE; then
    printf '{"OPERATION_TYPE":"%s","MIGRATION_NAME":"%s","SEED_NAME":"%s","DATABASE_ENV":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$OPERATION_TYPE" "$MIGRATION_NAME" "$SEED_NAME" "$DATABASE_ENV" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "OPERATION_TYPE: $OPERATION_TYPE"
    echo "MIGRATION_NAME: $MIGRATION_NAME"
    echo "SEED_NAME: $SEED_NAME"
    echo "DATABASE_ENV: $DATABASE_ENV"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
