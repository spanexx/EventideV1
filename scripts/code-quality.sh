#!/usr/bin/env bash
# Execute code quality analysis and improvement operations
# Usage: ./code-quality.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
QUALITY_TYPE=""
ANALYSIS_SCOPE=""
METRICS_THRESHOLD=""
IMPROVEMENT_LEVEL=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            QUALITY_TYPE="$2"
            shift 2
            ;;
        --scope)
            ANALYSIS_SCOPE="$2"
            shift 2
            ;;
        --threshold)
            METRICS_THRESHOLD="$2"
            shift 2
            ;;
        --level)
            IMPROVEMENT_LEVEL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: analyze-quality, run-linting, check-complexity, measure-coverage, detect-duplicates, improve-readability, optimize-performance"
            exit 0
            ;;
        *)
            if [[ -z "$QUALITY_TYPE" ]]; then
                QUALITY_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$QUALITY_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create code quality output directory
QUALITY_DIR="$REPO_ROOT/code-quality"
mkdir -p "$QUALITY_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$QUALITY_DIR/quality_${QUALITY_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$QUALITY_TYPE" in
    analyze-quality)
        echo "Analyzing code quality metrics..."
        cd "$REPO_ROOT"
        npm run quality:analyze
        ;;
    run-linting)
        echo "Running code linting and formatting..."
        cd "$REPO_ROOT/backend"
        npm run lint
        cd "$REPO_ROOT/frontend"
        npm run lint
        ;;
    check-complexity)
        echo "Analyzing code complexity..."
        cd "$REPO_ROOT"
        npm run quality:complexity
        ;;
    measure-coverage)
        echo "Measuring test coverage..."
        cd "$REPO_ROOT/backend"
        npm run test:coverage
        cd "$REPO_ROOT/frontend"
        npm run test:coverage
        ;;
    detect-duplicates)
        echo "Detecting code duplication..."
        cd "$REPO_ROOT"
        npm run quality:duplicates
        ;;
    improve-readability)
        echo "Improving code readability..."
        cd "$REPO_ROOT"
        npm run quality:readability
        ;;
    optimize-performance)
        echo "Optimizing code performance..."
        cd "$REPO_ROOT"
        npm run quality:performance
        ;;
esac

if $JSON_MODE; then
    printf '{"QUALITY_TYPE":"%s","ANALYSIS_SCOPE":"%s","METRICS_THRESHOLD":"%s","IMPROVEMENT_LEVEL":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$QUALITY_TYPE" "$ANALYSIS_SCOPE" "$METRICS_THRESHOLD" "$IMPROVEMENT_LEVEL" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "QUALITY_TYPE: $QUALITY_TYPE"
    echo "ANALYSIS_SCOPE: $ANALYSIS_SCOPE"
    echo "METRICS_THRESHOLD: $METRICS_THRESHOLD"
    echo "IMPROVEMENT_LEVEL: $IMPROVEMENT_LEVEL"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
