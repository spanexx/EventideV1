#!/usr/bin/env bash
# Implement and configure logging strategies
# Usage: ./logging-strategy.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
LOGGING_TYPE=""
LOG_LEVEL=""
OUTPUT_FORMAT=""
ROTATION_POLICY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            LOGGING_TYPE="$2"
            shift 2
            ;;
        --level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        --format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --rotation)
            ROTATION_POLICY="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: setup-logging, configure-levels, setup-rotation, centralize-logs, add-structured-logging, setup-monitoring, optimize-performance"
            exit 0
            ;;
        *)
            if [[ -z "$LOGGING_TYPE" ]]; then
                LOGGING_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$LOGGING_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create logging output directory
LOGGING_DIR="$REPO_ROOT/logging"
mkdir -p "$LOGGING_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$LOGGING_DIR/logging_${LOGGING_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$LOGGING_TYPE" in
    setup-logging)
        echo "Setting up application logging..."
        cd "$REPO_ROOT/backend"
        npm run logging:setup
        ;;
    configure-levels)
        echo "Configuring log levels and filtering..."
        cd "$REPO_ROOT/backend"
        npm run logging:levels
        ;;
    setup-rotation)
        echo "Setting up log rotation and retention..."
        cd "$REPO_ROOT"
        npm run logging:rotation
        ;;
    centralize-logs)
        echo "Setting up centralized logging..."
        cd "$REPO_ROOT"
        npm run logging:centralize
        ;;
    add-structured-logging)
        echo "Implementing structured logging..."
        cd "$REPO_ROOT/backend"
        npm run logging:structured
        ;;
    setup-monitoring)
        echo "Setting up log monitoring..."
        cd "$REPO_ROOT"
        npm run logging:monitoring
        ;;
    optimize-performance)
        echo "Optimizing logging performance..."
        cd "$REPO_ROOT/backend"
        npm run logging:optimize
        ;;
esac

if $JSON_MODE; then
    printf '{"LOGGING_TYPE":"%s","LOG_LEVEL":"%s","OUTPUT_FORMAT":"%s","ROTATION_POLICY":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$LOGGING_TYPE" "$LOG_LEVEL" "$OUTPUT_FORMAT" "$ROTATION_POLICY" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "LOGGING_TYPE: $LOGGING_TYPE"
    echo "LOG_LEVEL: $LOG_LEVEL"
    echo "OUTPUT_FORMAT: $OUTPUT_FORMAT"
    echo "ROTATION_POLICY: $ROTATION_POLICY"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
