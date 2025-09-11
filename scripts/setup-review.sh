#!/usr/bin/env bash
# Setup review environment and determine scope
# Usage: ./setup-review.sh --json

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
REVIEW_SCOPE="full"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --scope)
            REVIEW_SCOPE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] [--scope <scope>]"
            exit 0
            ;;
        *)
            echo "Usage: $0 [--json] [--scope <scope>]" >&2
            exit 1
            ;;
    esac
done

# Get feature paths
eval $(get_feature_paths)

# Create review output directory
REVIEW_DIR="$REPO_ROOT/reviews"
mkdir -p "$REVIEW_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$REVIEW_DIR/review_${CURRENT_BRANCH}_${TIMESTAMP}.md"

if $JSON_MODE; then
    printf '{"FEATURE_DIR":"%s","REVIEW_SCOPE":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$FEATURE_DIR" "$REVIEW_SCOPE" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "FEATURE_DIR: $FEATURE_DIR"
    echo "REVIEW_SCOPE: $REVIEW_SCOPE"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
