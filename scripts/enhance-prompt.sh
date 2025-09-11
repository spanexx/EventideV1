#!/usr/bin/env bash
# Enhance prompts by gathering deep context from the codebase
# Usage: ./enhance-prompt.sh [--json] "prompt text"

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
PROMPT_TEXT=""
ENHANCEMENT_SCOPE="comprehensive"
CONTEXT_DEPTH="deep"
OUTPUT_FORMAT="markdown"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --scope)
            ENHANCEMENT_SCOPE="$2"
            shift 2
            ;;
        --depth)
            CONTEXT_DEPTH="$2"
            shift 2
            ;;
        --format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] \"prompt text\" [options]"
            echo "Options:"
            echo "  --scope <scope>     Enhancement scope (comprehensive/focused/quick)"
            echo "  --depth <depth>     Context depth (deep/medium/shallow)"
            echo "  --format <format>   Output format (markdown/text/html)"
            exit 0
            ;;
        *)
            if [[ -z "$PROMPT_TEXT" ]]; then
                PROMPT_TEXT="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$PROMPT_TEXT" ]]; then
    echo "Usage: $0 [--json] \"prompt text\" [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create prompt enhancement output directory
PROMPT_DIR="$REPO_ROOT/prompt-enhancements"
mkdir -p "$PROMPT_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$PROMPT_DIR/enhanced_prompt_${TIMESTAMP}.md"

# Extract file references from prompt
FILE_REFERENCES=()
while IFS= read -r line; do
    if [[ "$line" =~ @([^[:space:]]+) ]]; then
        FILE_REFERENCES+=("${BASH_REMATCH[1]}")
    fi
done <<< "$PROMPT_TEXT"

# Extract command references from prompt
COMMAND_REFERENCES=()
while IFS= read -r line; do
    if [[ "$line" =~ @commands/([^[:space:]]+) ]]; then
        COMMAND_REFERENCES+=("${BASH_REMATCH[1]}")
    fi
done <<< "$PROMPT_TEXT"

# Analyze prompt for key topics
KEY_TOPICS=()
# Extract common technical terms
if [[ "$PROMPT_TEXT" =~ (frontend|react|angular|vue) ]]; then
    KEY_TOPICS+=("frontend")
fi
if [[ "$PROMPT_TEXT" =~ (backend|api|server|node) ]]; then
    KEY_TOPICS+=("backend")
fi
if [[ "$PROMPT_TEXT" =~ (database|db|sql|mongo) ]]; then
    KEY_TOPICS+=("database")
fi
if [[ "$PROMPT_TEXT" =~ (auth|security|login) ]]; then
    KEY_TOPICS+=("security")
fi
if [[ "$PROMPT_TEXT" =~ (test|testing|spec) ]]; then
    KEY_TOPICS+=("testing")
fi

# Determine enhancement scope based on prompt complexity
if [[ ${#KEY_TOPICS[@]} -gt 3 ]]; then
    ENHANCEMENT_SCOPE="comprehensive"
elif [[ ${#KEY_TOPICS[@]} -gt 1 ]]; then
    ENHANCEMENT_SCOPE="focused"
else
    ENHANCEMENT_SCOPE="quick"
fi

# Generate context gathering commands
CONTEXT_COMMANDS=()
for topic in "${KEY_TOPICS[@]}"; do
    case "$topic" in
        frontend)
            CONTEXT_COMMANDS+=("text:frontend components")
            CONTEXT_COMMANDS+=("code:frontend services")
            ;;
        backend)
            CONTEXT_COMMANDS+=("text:backend services")
            CONTEXT_COMMANDS+=("code:API endpoints")
            ;;
        database)
            CONTEXT_COMMANDS+=("text:database schema")
            CONTEXT_COMMANDS+=("code:database models")
            ;;
        security)
            CONTEXT_COMMANDS+=("sec:authentication")
            CONTEXT_COMMANDS+=("sec:authorization")
            ;;
        testing)
            CONTEXT_COMMANDS+=("text:testing patterns")
            CONTEXT_COMMANDS+=("code:test files")
            ;;
    esac
done

# Execute context gathering
echo "Gathering context for prompt enhancement..."
for cmd in "${CONTEXT_COMMANDS[@]}"; do
    IFS=':' read -r type query <<< "$cmd"
    case "$type" in
        text)
            echo "Researching: $query"
            ;;
        code)
            echo "Analyzing code: $query"
            ;;
        sec)
            echo "Security analysis: $query"
            ;;
        perf)
            echo "Performance analysis: $query"
            ;;
        dep)
            echo "Dependency analysis: $query"
            ;;
    esac
done

# Process file references
echo "Processing file references..."
for file_ref in "${FILE_REFERENCES[@]}"; do
    if [[ -f "$REPO_ROOT/$file_ref" ]]; then
        echo "Including context from: $file_ref"
    elif [[ -d "$REPO_ROOT/$file_ref" ]]; then
        echo "Including context from directory: $file_ref"
    else
        echo "Warning: File not found: $file_ref"
    fi
done

# Process command references
echo "Processing command references..."
for cmd_ref in "${COMMAND_REFERENCES[@]}"; do
    if [[ -f "$REPO_ROOT/commands/$cmd_ref" ]]; then
        echo "Including command context: $cmd_ref"
    else
        echo "Warning: Command file not found: $cmd_ref"
    fi
done

# Generate enhancement summary
ENHANCEMENT_SUMMARY="Enhanced prompt with ${#KEY_TOPICS[@]} technical domains, ${#FILE_REFERENCES[@]} file references, and ${#COMMAND_REFERENCES[@]} command references"

if $JSON_MODE; then
    printf '{"PROMPT_TEXT":"%s","ENHANCEMENT_SCOPE":"%s","CONTEXT_DEPTH":"%s","OUTPUT_FORMAT":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s","KEY_TOPICS":%s,"FILE_REFERENCES":%s,"COMMAND_REFERENCES":%s,"ENHANCEMENT_SUMMARY":"%s"}\n' \
        "$PROMPT_TEXT" "$ENHANCEMENT_SCOPE" "$CONTEXT_DEPTH" "$OUTPUT_FORMAT" "$OUTPUT_FILE" "$REPO_ROOT" \
        "$(printf '%s\n' "${KEY_TOPICS[@]}" | jq -R . | jq -s .)" \
        "$(printf '%s\n' "${FILE_REFERENCES[@]}" | jq -R . | jq -s .)" \
        "$(printf '%s\n' "${COMMAND_REFERENCES[@]}" | jq -R . | jq -s .)" \
        "$ENHANCEMENT_SUMMARY"
else
    echo "PROMPT_TEXT: $PROMPT_TEXT"
    echo "ENHANCEMENT_SCOPE: $ENHANCEMENT_SCOPE"
    echo "CONTEXT_DEPTH: $CONTEXT_DEPTH"
    echo "OUTPUT_FORMAT: $OUTPUT_FORMAT"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
    echo "KEY_TOPICS: ${KEY_TOPICS[*]}"
    echo "FILE_REFERENCES: ${FILE_REFERENCES[*]}"
    echo "COMMAND_REFERENCES: ${COMMAND_REFERENCES[*]}"
    echo "ENHANCEMENT_SUMMARY: $ENHANCEMENT_SUMMARY"
fi
