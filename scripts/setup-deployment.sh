#!/usr/bin/env bash
# Setup deployment environment and configuration
# Usage: ./setup-deployment.sh --json

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
DEPLOYMENT_TARGET="staging"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --target)
            DEPLOYMENT_TARGET="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] [--target <target>]"
            exit 0
            ;;
        *)
            echo "Usage: $0 [--json] [--target <target>]" >&2
            exit 1
            ;;
    esac
done

# Get feature paths
eval $(get_feature_paths)

# Create deployment directory
DEPLOYMENT_DIR="$REPO_ROOT/deployments"
mkdir -p "$DEPLOYMENT_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOYMENT_RESULTS_FILE="$DEPLOYMENT_DIR/deployment_${CURRENT_BRANCH}_${DEPLOYMENT_TARGET}_${TIMESTAMP}.md"

# Load deployment configuration
DEPLOYMENT_CONFIG="$REPO_ROOT/config/deployment/${DEPLOYMENT_TARGET}.json"
if [[ ! -f "$DEPLOYMENT_CONFIG" ]]; then
    # Create default configuration
    mkdir -p "$(dirname "$DEPLOYMENT_CONFIG")"
    cat > "$DEPLOYMENT_CONFIG" << EOF
{
  "target": "$DEPLOYMENT_TARGET",
  "environment": "production",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "eventide_${DEPLOYMENT_TARGET}"
  },
  "services": {
    "backend": {
      "port": 3000,
      "health_check": "/health"
    },
    "frontend": {
      "port": 4200,
      "build_dir": "dist/frontend"
    }
  }
}
EOF
fi

if $JSON_MODE; then
    printf '{"FEATURE_DIR":"%s","DEPLOYMENT_TARGET":"%s","DEPLOYMENT_CONFIG":"%s","DEPLOYMENT_RESULTS_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$FEATURE_DIR" "$DEPLOYMENT_TARGET" "$DEPLOYMENT_CONFIG" "$DEPLOYMENT_RESULTS_FILE" "$REPO_ROOT"
else
    echo "FEATURE_DIR: $FEATURE_DIR"
    echo "DEPLOYMENT_TARGET: $DEPLOYMENT_TARGET"
    echo "DEPLOYMENT_CONFIG: $DEPLOYMENT_CONFIG"
    echo "DEPLOYMENT_RESULTS_FILE: $DEPLOYMENT_RESULTS_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
