#!/usr/bin/env bash
# Set up monitoring and observability for the application
# Usage: ./monitoring-setup.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
MONITORING_TYPE=""
METRICS_SCOPE=""
ALERT_THRESHOLDS=""
DASHBOARD_CONFIG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            MONITORING_TYPE="$2"
            shift 2
            ;;
        --scope)
            METRICS_SCOPE="$2"
            shift 2
            ;;
        --thresholds)
            ALERT_THRESHOLDS="$2"
            shift 2
            ;;
        --dashboard)
            DASHBOARD_CONFIG="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: setup-application-monitoring, setup-infrastructure-monitoring, setup-logging, setup-alerts, setup-dashboards, setup-health-checks, setup-metrics"
            exit 0
            ;;
        *)
            if [[ -z "$MONITORING_TYPE" ]]; then
                MONITORING_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$MONITORING_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create monitoring output directory
MONITORING_DIR="$REPO_ROOT/monitoring"
mkdir -p "$MONITORING_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$MONITORING_DIR/monitoring_${MONITORING_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$MONITORING_TYPE" in
    setup-application-monitoring)
        echo "Setting up application monitoring..."
        cd "$REPO_ROOT/backend"
        npm run monitor:app-setup
        ;;
    setup-infrastructure-monitoring)
        echo "Setting up infrastructure monitoring..."
        cd "$REPO_ROOT"
        npm run monitor:infra-setup
        ;;
    setup-logging)
        echo "Setting up centralized logging..."
        cd "$REPO_ROOT/backend"
        npm run monitor:logging-setup
        ;;
    setup-alerts)
        echo "Setting up alerting rules..."
        cd "$REPO_ROOT"
        npm run monitor:alerts-setup
        ;;
    setup-dashboards)
        echo "Setting up monitoring dashboards..."
        cd "$REPO_ROOT"
        npm run monitor:dashboards-setup
        ;;
    setup-health-checks)
        echo "Setting up health check endpoints..."
        cd "$REPO_ROOT/backend"
        npm run monitor:health-setup
        ;;
    setup-metrics)
        echo "Setting up metrics collection..."
        cd "$REPO_ROOT/backend"
        npm run monitor:metrics-setup
        ;;
esac

if $JSON_MODE; then
    printf '{"MONITORING_TYPE":"%s","METRICS_SCOPE":"%s","ALERT_THRESHOLDS":"%s","DASHBOARD_CONFIG":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$MONITORING_TYPE" "$METRICS_SCOPE" "$ALERT_THRESHOLDS" "$DASHBOARD_CONFIG" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "MONITORING_TYPE: $MONITORING_TYPE"
    echo "METRICS_SCOPE: $METRICS_SCOPE"
    echo "ALERT_THRESHOLDS: $ALERT_THRESHOLDS"
    echo "DASHBOARD_CONFIG: $DASHBOARD_CONFIG"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
