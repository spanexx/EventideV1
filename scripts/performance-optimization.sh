#!/usr/bin/env bash
# Analyze and optimize application performance
# Usage: ./performance-optimization.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
OPTIMIZATION_TYPE=""
TARGET_COMPONENT=""
METRICS_THRESHOLD=""
ANALYSIS_SCOPE="full"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            OPTIMIZATION_TYPE="$2"
            shift 2
            ;;
        --target)
            TARGET_COMPONENT="$2"
            shift 2
            ;;
        --threshold)
            METRICS_THRESHOLD="$2"
            shift 2
            ;;
        --scope)
            ANALYSIS_SCOPE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: analyze-bottlenecks, optimize-queries, improve-caching, optimize-bundle, memory-analysis, load-testing, monitor-metrics"
            exit 0
            ;;
        *)
            if [[ -z "$OPTIMIZATION_TYPE" ]]; then
                OPTIMIZATION_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$OPTIMIZATION_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create performance analysis output directory
PERF_DIR="$REPO_ROOT/performance-analysis"
mkdir -p "$PERF_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$PERF_DIR/perf_${OPTIMIZATION_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$OPTIMIZATION_TYPE" in
    analyze-bottlenecks)
        echo "Analyzing performance bottlenecks..."
        # Run performance analysis tools
        cd "$REPO_ROOT/backend"
        npm run perf:analyze
        ;;
    optimize-queries)
        echo "Optimizing database queries..."
        cd "$REPO_ROOT/backend"
        npm run db:optimize
        ;;
    improve-caching)
        echo "Improving caching strategy..."
        cd "$REPO_ROOT/backend"
        npm run cache:optimize
        ;;
    optimize-bundle)
        echo "Optimizing frontend bundle..."
        cd "$REPO_ROOT/frontend"
        npm run build:analyze
        ;;
    memory-analysis)
        echo "Analyzing memory usage..."
        cd "$REPO_ROOT/backend"
        npm run perf:memory
        ;;
    load-testing)
        echo "Running load tests..."
        cd "$REPO_ROOT"
        npm run test:load
        ;;
    monitor-metrics)
        echo "Setting up performance monitoring..."
        cd "$REPO_ROOT/backend"
        npm run monitor:setup
        ;;
esac

if $JSON_MODE; then
    printf '{"OPTIMIZATION_TYPE":"%s","TARGET_COMPONENT":"%s","METRICS_THRESHOLD":"%s","ANALYSIS_SCOPE":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$OPTIMIZATION_TYPE" "$TARGET_COMPONENT" "$METRICS_THRESHOLD" "$ANALYSIS_SCOPE" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "OPTIMIZATION_TYPE: $OPTIMIZATION_TYPE"
    echo "TARGET_COMPONENT: $TARGET_COMPONENT"
    echo "METRICS_THRESHOLD: $METRICS_THRESHOLD"
    echo "ANALYSIS_SCOPE: $ANALYSIS_SCOPE"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
