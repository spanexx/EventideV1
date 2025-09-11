#!/usr/bin/env bash
# Manage project dependencies and package updates
# Usage: ./dependency-management.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
DEPENDENCY_TYPE=""
PACKAGE_NAME=""
VERSION_RANGE=""
UPDATE_STRATEGY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            DEPENDENCY_TYPE="$2"
            shift 2
            ;;
        --package)
            PACKAGE_NAME="$2"
            shift 2
            ;;
        --version)
            VERSION_RANGE="$2"
            shift 2
            ;;
        --strategy)
            UPDATE_STRATEGY="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: install-dependencies, update-dependencies, audit-dependencies, add-dependency, remove-dependency, check-outdated, lock-dependencies"
            exit 0
            ;;
        *)
            if [[ -z "$DEPENDENCY_TYPE" ]]; then
                DEPENDENCY_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$DEPENDENCY_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create dependency management output directory
DEPS_DIR="$REPO_ROOT/dependency-management"
mkdir -p "$DEPS_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$DEPS_DIR/deps_${DEPENDENCY_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$DEPENDENCY_TYPE" in
    install-dependencies)
        echo "Installing project dependencies..."
        cd "$REPO_ROOT/backend"
        npm install
        cd "$REPO_ROOT/frontend"
        npm install
        ;;
    update-dependencies)
        echo "Updating dependencies to latest versions..."
        cd "$REPO_ROOT/backend"
        npm update
        cd "$REPO_ROOT/frontend"
        npm update
        ;;
    audit-dependencies)
        echo "Auditing dependencies for vulnerabilities..."
        cd "$REPO_ROOT/backend"
        npm audit
        cd "$REPO_ROOT/frontend"
        npm audit
        ;;
    add-dependency)
        if [[ -z "$PACKAGE_NAME" ]]; then
            echo "Error: Package name required for add-dependency operation" >&2
            exit 1
        fi
        echo "Adding new dependency: $PACKAGE_NAME"
        cd "$REPO_ROOT/backend"
        npm install "$PACKAGE_NAME"
        ;;
    remove-dependency)
        if [[ -z "$PACKAGE_NAME" ]]; then
            echo "Error: Package name required for remove-dependency operation" >&2
            exit 1
        fi
        echo "Removing dependency: $PACKAGE_NAME"
        cd "$REPO_ROOT/backend"
        npm uninstall "$PACKAGE_NAME"
        ;;
    check-outdated)
        echo "Checking for outdated dependencies..."
        cd "$REPO_ROOT/backend"
        npm outdated
        cd "$REPO_ROOT/frontend"
        npm outdated
        ;;
    lock-dependencies)
        echo "Locking dependency versions..."
        cd "$REPO_ROOT/backend"
        npm ci
        cd "$REPO_ROOT/frontend"
        npm ci
        ;;
esac

if $JSON_MODE; then
    printf '{"DEPENDENCY_TYPE":"%s","PACKAGE_NAME":"%s","VERSION_RANGE":"%s","UPDATE_STRATEGY":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$DEPENDENCY_TYPE" "$PACKAGE_NAME" "$VERSION_RANGE" "$UPDATE_STRATEGY" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "DEPENDENCY_TYPE: $DEPENDENCY_TYPE"
    echo "PACKAGE_NAME: $PACKAGE_NAME"
    echo "VERSION_RANGE: $VERSION_RANGE"
    echo "UPDATE_STRATEGY: $UPDATE_STRATEGY"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
