#!/usr/bin/env bash
# Check implementation prerequisites and available tasks
# Usage: ./check-implementation-prerequisites.sh --json

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--json]"
            exit 0
            ;;
        *)
            echo "Usage: $0 [--json]" >&2
            exit 1
            ;;
    esac
done

# Get feature paths
eval $(get_feature_paths)

# Check if feature directory exists
if [[ ! -d "$FEATURE_DIR" ]]; then
    echo "ERROR: Feature directory not found: $FEATURE_DIR" >&2
    exit 1
fi

# Check available tasks
AVAILABLE_TASKS=()
if [[ -f "$TASKS" ]]; then
    # Extract task numbers from tasks.md
    while IFS= read -r line; do
        if [[ "$line" =~ ^T[0-9]+ ]]; then
            task_id=$(echo "$line" | grep -o '^T[0-9]\+')
            AVAILABLE_TASKS+=("$task_id")
        fi
    done < "$TASKS"
fi

# Convert array to JSON format
TASKS_JSON=$(printf '%s\n' "${AVAILABLE_TASKS[@]}" | jq -R . | jq -s .)

if $JSON_MODE; then
    printf '{"FEATURE_DIR":"%s","TASKS_FILE":"%s","AVAILABLE_TASKS":%s,"REPO_ROOT":"%s"}\n' \
        "$FEATURE_DIR" "$TASKS" "$TASKS_JSON" "$REPO_ROOT"
else
    echo "FEATURE_DIR: $FEATURE_DIR"
    echo "TASKS_FILE: $TASKS"
    echo "AVAILABLE_TASKS: ${AVAILABLE_TASKS[*]}"
    echo "REPO_ROOT: $REPO_ROOT"
fi
