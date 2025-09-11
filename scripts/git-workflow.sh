#!/usr/bin/env bash
# Git workflow operations and branch management
# Usage: ./git-workflow.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
OPERATION_TYPE=""
BRANCH_NAME=""
COMMIT_MESSAGE=""
TARGET_BRANCH=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --operation)
            OPERATION_TYPE="$2"
            shift 2
            ;;
        --branch)
            BRANCH_NAME="$2"
            shift 2
            ;;
        --message)
            COMMIT_MESSAGE="$2"
            shift 2
            ;;
        --target)
            TARGET_BRANCH="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --operation <operation> [options]"
            echo "Operations: create-feature, create-hotfix, commit-changes, merge-feature, merge-hotfix, rebase-branch, cleanup-branches, resolve-conflicts"
            exit 0
            ;;
        *)
            if [[ -z "$OPERATION_TYPE" ]]; then
                OPERATION_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$OPERATION_TYPE" ]]; then
    echo "Usage: $0 [--json] --operation <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)
CURRENT_BRANCH=$(get_current_branch)

# Create git operations output directory
GIT_OPS_DIR="$REPO_ROOT/git-operations"
mkdir -p "$GIT_OPS_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$GIT_OPS_DIR/git_${OPERATION_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$OPERATION_TYPE" in
    create-feature)
        if [[ -z "$BRANCH_NAME" ]]; then
            echo "Error: Branch name required for create-feature operation" >&2
            exit 1
        fi
        git checkout develop
        git pull origin develop
        git checkout -b "$BRANCH_NAME"
        ;;
    create-hotfix)
        if [[ -z "$BRANCH_NAME" ]]; then
            echo "Error: Branch name required for create-hotfix operation" >&2
            exit 1
        fi
        git checkout master
        git pull origin master
        git checkout -b "$BRANCH_NAME"
        ;;
    commit-changes)
        if [[ -z "$COMMIT_MESSAGE" ]]; then
            echo "Error: Commit message required for commit-changes operation" >&2
            exit 1
        fi
        git add .
        git commit -m "$COMMIT_MESSAGE"
        ;;
    merge-feature)
        if [[ -z "$BRANCH_NAME" ]]; then
            echo "Error: Branch name required for merge-feature operation" >&2
            exit 1
        fi
        git checkout develop
        git merge "$BRANCH_NAME"
        git push origin develop
        ;;
    merge-hotfix)
        if [[ -z "$BRANCH_NAME" ]]; then
            echo "Error: Branch name required for merge-hotfix operation" >&2
            exit 1
        fi
        git checkout master
        git merge "$BRANCH_NAME"
        git push origin master
        git checkout develop
        git merge "$BRANCH_NAME"
        git push origin develop
        ;;
    rebase-branch)
        if [[ -z "$TARGET_BRANCH" ]]; then
            TARGET_BRANCH="develop"
        fi
        git rebase "$TARGET_BRANCH"
        ;;
    cleanup-branches)
        git branch --merged | grep -v "\*\|master\|develop" | xargs -n 1 git branch -d
        ;;
    resolve-conflicts)
        echo "Manual conflict resolution required. Please resolve conflicts and run 'git add .' then 'git commit'"
        ;;
esac

if $JSON_MODE; then
    printf '{"OPERATION_TYPE":"%s","BRANCH_NAME":"%s","COMMIT_MESSAGE":"%s","TARGET_BRANCH":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s","CURRENT_BRANCH":"%s"}\n' \
        "$OPERATION_TYPE" "$BRANCH_NAME" "$COMMIT_MESSAGE" "$TARGET_BRANCH" "$OUTPUT_FILE" "$REPO_ROOT" "$CURRENT_BRANCH"
else
    echo "OPERATION_TYPE: $OPERATION_TYPE"
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "COMMIT_MESSAGE: $COMMIT_MESSAGE"
    echo "TARGET_BRANCH: $TARGET_BRANCH"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
    echo "CURRENT_BRANCH: $CURRENT_BRANCH"
fi
