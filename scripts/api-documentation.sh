#!/usr/bin/env bash
# Generate and maintain API documentation using OpenAPI specification
# Usage: ./api-documentation.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
DOC_TYPE=""
ENDPOINT_PATH=""
SCHEMA_NAME=""
OUTPUT_FORMAT="yaml"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            DOC_TYPE="$2"
            shift 2
            ;;
        --endpoint)
            ENDPOINT_PATH="$2"
            shift 2
            ;;
        --schema)
            SCHEMA_NAME="$2"
            shift 2
            ;;
        --format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: generate-spec, update-endpoint, create-schema, validate-spec, serve-docs, export-postman, generate-client"
            exit 0
            ;;
        *)
            if [[ -z "$DOC_TYPE" ]]; then
                DOC_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$DOC_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create API documentation output directory
API_DOCS_DIR="$REPO_ROOT/api-docs"
mkdir -p "$API_DOCS_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$API_DOCS_DIR/api_${DOC_TYPE}_${TIMESTAMP}.${OUTPUT_FORMAT}"

# Execute operation based on type
case "$DOC_TYPE" in
    generate-spec)
        cd "$REPO_ROOT/backend"
        npm run docs:generate
        ;;
    update-endpoint)
        if [[ -z "$ENDPOINT_PATH" ]]; then
            echo "Error: Endpoint path required for update-endpoint operation" >&2
            exit 1
        fi
        echo "Manual endpoint update required for: $ENDPOINT_PATH"
        ;;
    create-schema)
        if [[ -z "$SCHEMA_NAME" ]]; then
            echo "Error: Schema name required for create-schema operation" >&2
            exit 1
        fi
        echo "Manual schema creation required for: $SCHEMA_NAME"
        ;;
    validate-spec)
        cd "$REPO_ROOT/backend"
        npm run docs:validate
        ;;
    serve-docs)
        cd "$REPO_ROOT/backend"
        npm run docs:serve
        ;;
    export-postman)
        cd "$REPO_ROOT/backend"
        npm run docs:export-postman
        ;;
    generate-client)
        cd "$REPO_ROOT/backend"
        npm run docs:generate-client
        ;;
esac

if $JSON_MODE; then
    printf '{"DOC_TYPE":"%s","ENDPOINT_PATH":"%s","SCHEMA_NAME":"%s","OUTPUT_FORMAT":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$DOC_TYPE" "$ENDPOINT_PATH" "$SCHEMA_NAME" "$OUTPUT_FORMAT" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "DOC_TYPE: $DOC_TYPE"
    echo "ENDPOINT_PATH: $ENDPOINT_PATH"
    echo "SCHEMA_NAME: $SCHEMA_NAME"
    echo "OUTPUT_FORMAT: $OUTPUT_FORMAT"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
