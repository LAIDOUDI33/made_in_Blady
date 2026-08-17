#!/bin/bash
# =============================================================================
# OWASP ZAP Automation Script for AlgeriaTrade.dz
# 
# Automated security scanning using OWASP ZAP (Zed Attack Proxy)
# Features:
# - Baseline scan configuration
# - API endpoint testing
# - Authentication testing
# - AJAX spider for SPAs
# - Active and passive scanning
# - Report generation in multiple formats
#
# Prerequisites:
# - Docker installed
# - OWASP ZAP Docker image: owasp/zap2docker-stable
# - Target application running
#
# Usage:
#   ./owasp-zap-automation.sh [--target URL] [--context FILE] [--output DIR]
#
# @version 2.0.0
# =============================================================================

set -euo pipefail

# ===========================================
# Configuration
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
TARGET_URL="${TARGET_URL:-http://localhost:3000}"
OUTPUT_DIR="${OUTPUT_DIR:-${PROJECT_ROOT}/security-reports}"
ZAP_IMAGE="owasp/zap2docker-stable:latest"
ZAP_CONTAINER_NAME="algeriatrade-zap-scan"
CONTEXT_FILE="${CONTEXT_FILE:-${SCRIPT_DIR}/zap.context}"

# Scan configurations
BASELINE_SCAN=true
API_SCAN=true
AUTH_SCAN=false  # Requires credentials
FULL_SCAN=false  # More thorough but slower

# Timing settings
SCAN_TIMEOUT_MINUTES=30
SPIDER_DURATION=5  # minutes
ACTIVE_SCAN_STRENGTH=Medium  # Low, Medium, High, Insane

# Alert thresholds (for CI/CD integration)
MAX_HIGH_ALERTS=0
MEDIUM_ALERTS_ALLOWED=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===========================================
# Helper Functions
# ===========================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    log_info "Cleaning up..."
    if docker ps -q -f name="$ZAP_CONTAINER_NAME" | grep -q .; then
        docker stop "$ZAP_CONTAINER_NAME" >/dev/null 2>&1 || true
    fi
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! docker image inspect "$ZAP_IMAGE" &> /dev/null; then
        log_info "Pulling OWASP ZAP Docker image..."
        docker pull "$ZAP_IMAGE" || {
            log_error "Failed to pull ZAP image"
            exit 1
        }
    fi

    # Create output directory
    mkdir -p "$OUTPUT_DIR"
}

create_context_file() {
    log_info "Creating ZAP context file..."

    cat > "$CONTEXT_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <context>
        <name>AlgeriaTrade Context</name>
        <includeInScope>
            <pattern>https?://.*\.algeriatrade\.dz/.*</pattern>
            <pattern>https?://localhost(:\d+)?/.*</pattern>
            <pattern>https?://127\.0\.0\.1(:\d+)?/.*</pattern>
        </includeInScope>
        <excludeFromScope>
            <pattern>.*\.(js|css|png|jpg|gif|ico|woff|woff2|ttf|svg)$</pattern>
            <pattern>.*/api/health$</pattern>
            <pattern>.*/api/status$</pattern>
        </excludeFromScope>
        
        <!-- Technology -->
        <technology>
            <name>Db.PostgreSQL</name>
            <enabled>true</enabled>
        </technology>
        <technology>
            <name>OS.Linux</name>
            <enabled>true</enabled>
        </technology>
        <technology>
            <name>WS.Nodejs</name>
            <enabled>true</enabled>
        </technology>
        <technology>
            <name>Lang.Js</name>
            <enabled>true</enabled>
        </technology>
        <technology>
            <name>Lang.TypeScript</name>
            <enabled>true</enabled>
        </technology>

        <!-- Authentication (if configured) -->
        <authentication type="script">
            <method name="formBasedAuth">
                <config>
                    <site>.*</site>
                    <loginPage>/login</loginPage>
                    <loginRequestData>email={username}&amp;password={password}</loginRequestData>
                </config>
                <script engine="ECMAScript : Oracle Nashorn"><![CDATA[
                    // Custom authentication script if needed
                ]]></script>
            </method>
        </authentication>
        
        <!-- Session management -->
        <sessionManagement type="cookieBased"/>
        
        <!-- Users for authenticated scans -->
        <users>
            <user name="test-user">
                <authConfig>
                    <username>test@example.com</username>
                    <password>TestPassword123!</password>
                </authConfig>
            </user>
        </users>
    </context>
    
    <!-- Structure definitions for better parsing -->
    <structurers>
        <structurer name="JSON">org.zap.structors.JsonStructurer</structurer>
    </structurers>
</configuration>
EOF

    log_success "Context file created at $CONTEXT_FILE"
}

run_baseline_scan() {
    log_info "Running baseline scan on $TARGET_URL..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="${OUTPUT_DIR}/zap-baseline-${timestamp}.md"
    local xml_report="${OUTPUT_DIR}/zap-baseline-${timestamp}.xml"

    docker run --rm \
        --name "$ZAP_CONTAINER_NAME" \
        -u zap \
        -v "${OUTPUT_DIR}:/zap/wrk/:rw" \
        -t "$ZAP_IMAGE" \
        zap-baseline.py \
        -t "$TARGET_URL" \
        -c "$CONTEXT_FILE" \
        -r "/zap/wrk/$(basename "$report_file")" \
        -w "/zap/wrk/$(basename "$xml_report")" \
        -I \
        --auto \
        || {
            log_warning "Baseline scan completed with warnings"
        }

    log_success "Baseline report saved to $report_file"
}

run_api_scan() {
    log_info "Running API security scan..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="${OUTPUT_DIR}/zap-api-${timestamp}.md"
    
    # Define API endpoints to test
    local api_spec=""
    if [ -f "${PROJECT_ROOT}/openapi.yaml" ]; then
        api_spec="-f /zap/wrk/openapi.yaml"
    elif [ -f "${PROJECT_ROOT}/swagger.json" ]; then
        api_spec="-f /zap/wkr/swagger.json"
    fi
    
    docker run --rm \
        --name "$ZAP_CONTAINER_NAME" \
        -u zap \
        -v "${OUTPUT_DIR}:/zap/wrk/:rw" \
        -v "${PROJECT_ROOT}:/app/:ro" \
        -t "$ZAP_IMAGE" \
        zap-api-scan.py \
        -t "$TARGET_URL/api" \
        -c "$CONTEXT_FILE" \
        -r "/zap/wrk/$(basename "$report_file")" \
        $api_spec \
        -I \
        || {
            log_warning "API scan completed with warnings"
        }

    log_success "API scan report saved to $report_file"
}

run_full_scan() {
    log_warning "Running full scan (this may take a while)..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="${OUTPUT_DIR}/zap-full-${timestamp}.md"
    
    docker run --rm \
        --name "$ZAP_CONTAINER_NAME" \
        -u zap \
        -v "${OUTPUT_DIR}:/zap/wrk/:rw" \
        -t "$ZAP_IMAGE" \
        zap-full-scan.py \
        -t "$TARGET_URL" \
        -c "$CONTEXT_FILE" \
        -r "/zap/wrk/$(basename "$report_file")" \
        -m "$((SCAN_TIMEOUT_MINUTES * 60 * 1000))" \
        -I \
        || {
            log_error "Full scan failed or timed out"
            return 1
        }

    log_success "Full scan report saved to $report_file"
}

analyze_results() {
    log_info "Analyzing scan results..."
    
    local latest_report=$(ls -t "${OUTPUT_DIR}"/*.md 2>/dev/null | head -1)
    
    if [ ! -f "$latest_report" ]; then
        log_warning "No reports found to analyze"
        return
    fi
    
    # Count alerts by severity
    local high_count=$(grep -c "^| High" "$latest_report" 2>/dev/null || echo 0)
    local medium_count=$(grep -c "^| Medium" "$latest_report" 2>/dev/null || echo 0)
    local low_count=$(grep -c "^| Low" "$latest_report" 2>/dev/null || echo 0)
    local info_count=$(grep -c "^| Informational" "$latest_report" 2>/dev/null || echo 0)
    
    echo ""
    echo "=========================================="
    echo "       SCAN RESULTS SUMMARY"
    echo "=========================================="
    echo "High Severity:     ${high_count}"
    echo "Medium Severity:   ${medium_count}"
    echo "Low Severity:      ${low_count}"
    echo "Informational:     ${info_count}"
    echo "=========================================="
    echo ""
    
    # Check against thresholds
    if [ "$high_count" -gt "$MAX_HIGH_ALERTS" ]; then
        log_error "FAILED: Found ${high_count} high severity issues (threshold: ${MAX_HIGH_ALERTS})"
        return 1
    fi
    
    if [ "$medium_count" -gt "$MEDIUM_ALERTS_ALLOWED" ]; then
        log_warning "WARNING: Found ${medium_count} medium severity issues (threshold: ${MEDIUM_ALERTS_ALLOWED})"
    fi
    
    log_success "Security scan passed!"
    return 0
}

generate_summary_report() {
    log_info "Generating summary report..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local summary_file="${OUTPUT_DIR}/security-summary-${timestamp}.md"
    
    cat > "$summary_file" << EOF
# AlgeriaTrade.dz Security Scan Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Target:** $TARGET_URL
**Scanner:** OWASP ZAP $(docker run --rm owasp/zap2docker-stable:latest -version 2>/dev/null | head -1)

---

## Executive Summary

This automated security scan was performed using OWASP ZAP (Zed Attack Proxy) 
to identify potential vulnerabilities in the AlgeriaTrade.dz B2B platform.

### Scan Coverage

- **Target URL:** $TARGET_URL
- **Scan Type:** Baseline + API Security
- **Duration:** ~10 minutes

### Findings Summary

$(ls -t "${OUTPUT_DIR}"/*baseline*.md 2>/dev/null | head -1 | xargs cat 2>/dev/null || echo "No baseline results")

## Recommendations

### Immediate Actions (High/Critical)
1. Review all high-severity findings
2. Address authentication and authorization issues
3. Fix any injection vulnerabilities

### Short-term Improvements (Medium)
1. Implement missing security headers
2. Enhance input validation
3. Configure Content Security Policy

### Long-term Enhancements (Low/Info)
1. Remove version information from responses
2. Implement additional monitoring
3. Regular security assessments

## Next Steps

1. Review detailed reports in this directory
2. Prioritize fixes based on risk assessment
3. Re-run scans after fixes are applied
4. Integrate into CI/CD pipeline

---

*Report generated automatically by OWASP ZAP automation script*
EOF

    log_success "Summary report saved to $summary_file"
}

# ===========================================
# Main Execution
# ===========================================

main() {
    echo ""
    echo "╔══════════════════════════════════════════╗"
    echo "║  AlgeriaTrade.dz Security Scanner v2.0   ║"
    echo "║  Powered by OWASP ZAP                   ║"
    echo "╚══════════════════════════════════════════╝"
    echo ""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --target)
                TARGET_URL="$2"
                shift 2
                ;;
            --output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --full)
                FULL_SCAN=true
                shift
                ;;
            --auth)
                AUTH_SCAN=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --target URL    Target URL to scan (default: http://localhost:3000)"
                echo "  --output DIR    Output directory for reports"
                echo "  --full          Run full scan (slower but more thorough)"
                echo "  --auth          Include authenticated scans"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Run checks
    check_dependencies
    create_context_file
    
    # Execute scans
    if [ "$BASELINE_SCAN" = true ]; then
        run_baseline_scan
    fi
    
    if [ "$API_SCAN" = true ]; then
        run_api_scan
    fi
    
    if [ "$FULL_SCAN" = true ]; then
        run_full_scan
    fi
    
    # Analyze and report
    analyze_results
    generate_summary_report
    
    echo ""
    log_success "Security scanning complete! Reports saved to: $OUTPUT_DIR"
    echo ""
}

main "$@"
