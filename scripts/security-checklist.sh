#!/usr/bin/env bash
# Execute security analysis and validation checklist
# Usage: ./security-checklist.sh [--json] <operation> [options]

set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

JSON_MODE=false
SECURITY_TYPE=""
SCAN_SCOPE=""
VULNERABILITY_LEVEL=""
COMPLIANCE_STANDARD="OWASP"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_MODE=true
            shift
            ;;
        --type)
            SECURITY_TYPE="$2"
            shift 2
            ;;
        --scope)
            SCAN_SCOPE="$2"
            shift 2
            ;;
        --level)
            VULNERABILITY_LEVEL="$2"
            shift 2
            ;;
        --compliance)
            COMPLIANCE_STANDARD="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--json] --type <operation> [options]"
            echo "Operations: vulnerability-scan, dependency-check, code-security, authentication-audit, authorization-check, data-protection, compliance-scan"
            exit 0
            ;;
        *)
            if [[ -z "$SECURITY_TYPE" ]]; then
                SECURITY_TYPE="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$SECURITY_TYPE" ]]; then
    echo "Usage: $0 [--json] --type <operation> [options]" >&2
    exit 1
fi

# Get repository root
REPO_ROOT=$(get_repo_root)

# Create security analysis output directory
SECURITY_DIR="$REPO_ROOT/security-analysis"
mkdir -p "$SECURITY_DIR"

# Generate output filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$SECURITY_DIR/security_${SECURITY_TYPE}_${TIMESTAMP}.md"

# Execute operation based on type
case "$SECURITY_TYPE" in
    vulnerability-scan)
        echo "Running vulnerability scan..."
        cd "$REPO_ROOT"
        npm audit
        ;;
    dependency-check)
        echo "Checking dependencies for vulnerabilities..."
        cd "$REPO_ROOT/backend"
        npm audit
        cd "$REPO_ROOT/frontend"
        npm audit
        ;;
    code-security)
        echo "Analyzing code for security issues..."
        cd "$REPO_ROOT"
        npm run security:scan
        ;;
    authentication-audit)
        echo "Auditing authentication mechanisms..."
        cd "$REPO_ROOT/backend"
        npm run security:auth-audit
        ;;
    authorization-check)
        echo "Checking authorization controls..."
        cd "$REPO_ROOT/backend"
        npm run security:authz-check
        ;;
    data-protection)
        echo "Checking data protection measures..."
        cd "$REPO_ROOT/backend"
        npm run security:data-protection
        ;;
    compliance-scan)
        echo "Running compliance scan..."
        cd "$REPO_ROOT"
        npm run security:compliance
        ;;
esac

if $JSON_MODE; then
    printf '{"SECURITY_TYPE":"%s","SCAN_SCOPE":"%s","VULNERABILITY_LEVEL":"%s","COMPLIANCE_STANDARD":"%s","OUTPUT_FILE":"%s","REPO_ROOT":"%s"}\n' \
        "$SECURITY_TYPE" "$SCAN_SCOPE" "$VULNERABILITY_LEVEL" "$COMPLIANCE_STANDARD" "$OUTPUT_FILE" "$REPO_ROOT"
else
    echo "SECURITY_TYPE: $SECURITY_TYPE"
    echo "SCAN_SCOPE: $SCAN_SCOPE"
    echo "VULNERABILITY_LEVEL: $VULNERABILITY_LEVEL"
    echo "COMPLIANCE_STANDARD: $COMPLIANCE_STANDARD"
    echo "OUTPUT_FILE: $OUTPUT_FILE"
    echo "REPO_ROOT: $REPO_ROOT"
fi
