#!/usr/bin/env bash
# Setup testing environment and determine scope
# Usage: ./setup-testing.sh --json

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
TEST_SCOPE="all"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --scope)
            TEST_SCOPE="$2"
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

# Create test results directory
TEST_RESULTS_DIR="$REPO_ROOT/test-results"
mkdir -p "$TEST_RESULTS_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_FILE="$TEST_RESULTS_DIR/test_results_${CURRENT_BRANCH}_${TIMESTAMP}.md"

if $JSON_MODE; then
    printf '{"FEATURE_DIR":"%s","TEST_SCOPE":"%s","TEST_RESULTS_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$FEATURE_DIR" "$TEST_SCOPE" "$TEST_RESULTS_FILE" "$REPO_ROOT"
else
    echo "FEATURE_DIR: $FEATURE_DIR"
    echo "TEST_SCOPE: $TEST_SCOPE"
    echo "TEST_RESULTS_FILE: $TEST_RESULTS_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
