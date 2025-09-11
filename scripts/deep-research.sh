#!/usr/bin/env bash
# Deep research script for comprehensive codebase analysis
# Usage: ./deep-research.sh [--json] -[flag] "search term"
#        ./deep-research.sh --json -text "authentication flow"

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
RESEARCH_TYPE=""
SEARCH_TERM=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        -text|-code|-arch|-perf|-sec|-dep)
            RESEARCH_TYPE="${1#-}"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--json] -[flag] <search_term>"
            echo "Flags: -text, -code, -arch, -perf, -sec, -dep"
            exit 0
            ;;
        *)
            if [[ -z "$SEARCH_TERM" ]]; then
                SEARCH_TERM="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$RESEARCH_TYPE" || -z "$SEARCH_TERM" ]]; then
    echo "Usage: $0 [--json] -[flag] <search_term>" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create research output directory
RESEARCH_DIR="$REPO_ROOT/research"
mkdir -p "$RESEARCH_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$RESEARCH_DIR/${RESEARCH_TYPE}_${TIMESTAMP}.md"

# Determine analysis scope based on research type
case "$RESEARCH_TYPE" in
    text)
        ANALYSIS_SCOPE="codebase,documentation,recent_changes"
        ;;
    code)
        ANALYSIS_SCOPE="implementations,usages,dependencies,tests"
        ;;
    arch)
        ANALYSIS_SCOPE="modules,data_flow,system_design,integration_points"
        ;;
    perf)
        ANALYSIS_SCOPE="bottlenecks,caching,queries,resource_usage"
        ;;
    sec)
        ANALYSIS_SCOPE="vulnerabilities,validation,access_controls,attack_surfaces"
        ;;
    dep)
        ANALYSIS_SCOPE="packages,versions,vulnerabilities,usage_patterns"
        ;;
esac

if $JSON_MODE; then
    printf '{"RESEARCH_TYPE":"%s","SEARCH_TERM":"%s","OUTPUT_FILE":"%s","ANALYSIS_SCOPE":"%s","REPO_ROOT":"%s"}\n' \
        "$RESEARCH_TYPE" "$SEARCH_TERM" "$OUTPUT_FILE" "$ANALYSIS_SCOPE" "$REPO_ROOT"
else
    echo "RESEARCH_TYPE: $RESEARCH_TYPE"
    echo "SEARCH_TERM: $SEARCH_TERM"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "ANALYSIS_SCOPE: $ANALYSIS_SCOPE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
