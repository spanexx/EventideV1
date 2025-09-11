#!/usr/bin/env bash
# Set up and configure development environments
# Usage: ./environment-setup.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
ENVIRONMENT_TYPE=""
CONFIG_PROFILE=""
DEPENDENCIES=""
SETUP_MODE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            ENVIRONMENT_TYPE="$2"
            shift 2
            ;;
        --profile)
            CONFIG_PROFILE="$2"
            shift 2
            ;;
        --deps)
            DEPENDENCIES="$2"
            shift 2
            ;;
        --mode)
            SETUP_MODE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: setup-development, setup-staging, setup-production, setup-testing, update-environment, validate-environment, clean-environment"
            exit 0
            ;;
        *)
            if [[ -z "$ENVIRONMENT_TYPE" ]]; then
                ENVIRONMENT_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$ENVIRONMENT_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create environment setup output directory
ENV_DIR="$REPO_ROOT/environment-setup"
mkdir -p "$ENV_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$ENV_DIR/env_${ENVIRONMENT_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$ENVIRONMENT_TYPE" in
    setup-development)
        echo "Setting up development environment..."
        cd "$REPO_ROOT"
        cp .env.example .env.development
        cd "$REPO_ROOT/backend"
        npm install
        cd "$REPO_ROOT/frontend"
        npm install
        ;;
    setup-staging)
        echo "Setting up staging environment..."
        cd "$REPO_ROOT"
        cp .env.example .env.staging
        cd "$REPO_ROOT/backend"
        npm run build
        cd "$REPO_ROOT/frontend"
        npm run build
        ;;
    setup-production)
        echo "Setting up production environment..."
        cd "$REPO_ROOT"
        cp .env.example .env.production
        cd "$REPO_ROOT/backend"
        npm ci --production
        cd "$REPO_ROOT/frontend"
        npm ci --production
        ;;
    setup-testing)
        echo "Setting up testing environment..."
        cd "$REPO_ROOT"
        cp .env.example .env.testing
        cd "$REPO_ROOT/backend"
        npm install --dev
        cd "$REPO_ROOT/frontend"
        npm install --dev
        ;;
    update-environment)
        echo "Updating existing environment..."
        cd "$REPO_ROOT"
        npm run env:update
        ;;
    validate-environment)
        echo "Validating environment configuration..."
        cd "$REPO_ROOT"
        npm run env:validate
        ;;
    clean-environment)
        echo "Cleaning up environment..."
        cd "$REPO_ROOT"
        rm -rf node_modules
        cd "$REPO_ROOT/backend"
        rm -rf node_modules
        cd "$REPO_ROOT/frontend"
        rm -rf node_modules
        ;;
esac

if $JSON_MODE; then
    printf '{"ENVIRONMENT_TYPE":"%s","CONFIG_PROFILE":"%s","DEPENDENCIES":"%s","SETUP_MODE":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$ENVIRONMENT_TYPE" "$CONFIG_PROFILE" "$DEPENDENCIES" "$SETUP_MODE" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "ENVIRONMENT_TYPE: $ENVIRONMENT_TYPE"
    echo "CONFIG_PROFILE: $CONFIG_PROFILE"
    echo "DEPENDENCIES: $DEPENDENCIES"
    echo "SETUP_MODE: $SETUP_MODE"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
