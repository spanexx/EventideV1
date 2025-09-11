#!/usr/bin/env bash
# Execute deployment operations and environment management
# Usage: ./deployment-guide.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
DEPLOYMENT_TYPE=""
TARGET_ENV=""
BUILD_CONFIG=""
DEPLOYMENT_STRATEGY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        --env)
            TARGET_ENV="$2"
            shift 2
            ;;
        --config)
            BUILD_CONFIG="$2"
            shift 2
            ;;
        --strategy)
            DEPLOYMENT_STRATEGY="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: build-application, deploy-staging, deploy-production, rollback-deployment, health-check, environment-setup, blue-green-deploy"
            exit 0
            ;;
        *)
            if [[ -z "$DEPLOYMENT_TYPE" ]]; then
                DEPLOYMENT_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$DEPLOYMENT_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create deployment output directory
DEPLOYMENT_DIR="$REPO_ROOT/deployments"
mkdir -p "$DEPLOYMENT_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$DEPLOYMENT_DIR/deployment_${DEPLOYMENT_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$DEPLOYMENT_TYPE" in
    build-application)
        echo "Building application..."
        cd "$REPO_ROOT/backend"
        npm run build
        cd "$REPO_ROOT/frontend"
        npm run build
        ;;
    deploy-staging)
        echo "Deploying to staging environment..."
        cd "$REPO_ROOT"
        npm run deploy:staging
        ;;
    deploy-production)
        echo "Deploying to production environment..."
        cd "$REPO_ROOT"
        npm run deploy:production
        ;;
    rollback-deployment)
        echo "Rolling back deployment..."
        cd "$REPO_ROOT"
        npm run deploy:rollback
        ;;
    health-check)
        echo "Checking deployment health..."
        cd "$REPO_ROOT"
        npm run health:check
        ;;
    environment-setup)
        echo "Setting up deployment environment..."
        cd "$REPO_ROOT"
        npm run env:setup
        ;;
    blue-green-deploy)
        echo "Executing blue-green deployment..."
        cd "$REPO_ROOT"
        npm run deploy:blue-green
        ;;
esac

if $JSON_MODE; then
    printf '{"DEPLOYMENT_TYPE":"%s","TARGET_ENV":"%s","BUILD_CONFIG":"%s","DEPLOYMENT_STRATEGY":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$DEPLOYMENT_TYPE" "$TARGET_ENV" "$BUILD_CONFIG" "$DEPLOYMENT_STRATEGY" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "DEPLOYMENT_TYPE: $DEPLOYMENT_TYPE"
    echo "TARGET_ENV: $TARGET_ENV"
    echo "BUILD_CONFIG: $BUILD_CONFIG"
    echo "DEPLOYMENT_STRATEGY: $DEPLOYMENT_STRATEGY"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
