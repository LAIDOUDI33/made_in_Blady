#!/bin/bash
#
# AlgeriaTrade.dz Payment Test Suite Runner
# Staging Environment Validation Script
#
# Usage: ./scripts/run-payment-tests.sh [options]
#
# Options:
#   --unit          Run unit tests only
#   --integration   Run integration tests only
#   --load          Run load tests only
#   --all           Run all tests (default)
#   --coverage      Generate coverage report
#   --verbose       Verbose output
#   --help          Show this help message
#
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
#   2 - Configuration error
#   3 - Execution error
#

set -e  # Exit on error

# ============================================
# CONFIGURATION
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_LOAD=false
COVERAGE=false
VERBOSE=false
REPORT_DIR="$PROJECT_ROOT/test-reports/payment"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ============================================
# HELPER FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}     AlgeriaTrade.dz Payment Test Suite - Staging Runner     ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Timestamp: $(date)"
    echo -e "Environment: ${STAGING_ENV:-staging}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${YELLOW}━━━ $1 ━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================
# PRE-RUN CHECKS
# ============================================

check_prerequisites() {
    print_section "Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js found: $node_version"
    else
        missing_deps+=("node")
        print_error "Node.js not found"
    fi
    
    # Check bun or npm
    if command -v bun &> /dev/null; then
        print_success "Bun found: $(bun --version)"
    elif command -v npm &> /dev/null; then
        print_success "npm found: $(npm --version)"
    else
        missing_deps+=("bun/npm")
        print_error "No package manager found (bun or npm required)"
    fi
    
    # Check jest availability
    if [ -f "$PROJECT_ROOT/node_modules/.bin/jest" ]; then
        print_success "Jest available"
    else
        missing_deps+=("jest")
        print_warning "Jest not installed locally, will use npx"
    fi
    
    # Check test directories exist
    local test_dirs=(
        "$PROJECT_ROOT/__tests__/payments"
        "$PROJECT_ROOT/__tests__/utils"
        "$PROJECT_ROOT/__tests__/fixtures"
        "$PROJECT_ROOT/__tests__/integration"
    )
    
    for dir in "${test_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_success "Test directory exists: $(basename $(dirname $dir))/$(basename $dir)"
        else
            print_warning "Test directory missing: $dir"
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    return 0
}

setup_environment() {
    print_section "Setting Up Environment"
    
    # Create report directory
    mkdir -p "$REPORT_DIR"
    print_info "Report directory: $REPORT_DIR"
    
    # Set staging environment variables if not set
    export NODE_ENV="${NODE_ENV:-test}"
    export STAGING_ENV="${STAGING_ENV:-true}"
    
    print_info "NODE_ENV=$NODE_ENV"
    print_info "STAGING_ENV=$STAGING_ENV"
}

# ============================================
# TEST EXECUTION FUNCTIONS
# ============================================

run_unit_tests() {
    print_section "Running Unit Tests"
    
    local coverage_flag=""
    local verbose_flag=""
    
    if [ "$COVERAGE" = true ]; then
        coverage_flag="--coverage"
    fi
    
    if [ "$VERBOSE" = true ]; then
        verbose_flag="--verbose"
    fi
    
    local junit_report="$REPORT_DIR/junit-unit-$TIMESTAMP.xml"
    
    cd "$PROJECT_ROOT"
    
    print_info "Executing payment flow tests..."
    
    if command -v bun &> /dev/null; then
        bun run jest \
            __tests__/payments/staging-flows.test.ts \
            --config=jest.config.js \
            $coverage_flag \
            $verbose_flag \
            --ci \
            --forceExit \
            --detectOpenHandles \
            2>&1 | tee "$REPORT_DIR/unit-test-output.log"
        local exit_code=${PIPESTATUS[0]}
    else
        npx jest \
            __tests__/payments/staging-flows.test.ts \
            --config=jest.config.js \
            $coverage_flag \
            $verbose_flag \
            --ci \
            --forceExit \
            --detectOpenHandles \
            2>&1 | tee "$REPORT_DIR/unit-test-output.log"
        local exit_code=${PIPESTATUS[0]}
    fi
    
    if [ $exit_code -eq 0 ]; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed with exit code $exit_code"
    fi
    
    return $exit_code
}

run_integration_tests() {
    print_section "Running Integration Tests"
    
    local verbose_flag=""
    
    if [ "$VERBOSE" = true ]; then
        verbose_flag="--verbose"
    fi
    
    cd "$PROJECT_ROOT"
    
    print_info "Executing integration test scenarios..."
    
    if command -v bun &> /dev/null; then
        bun run jest \
            __tests__/integration/payment-integration.test.ts \
            --config=jest.config.js \
            $verbose_flag \
            --ci \
            --forceExit \
            --detectOpenHandles \
            --testTimeout=60000 \
            2>&1 | tee "$REPORT_DIR/integration-test-output.log"
        local exit_code=${PIPESTATUS[0]}
    else
        npx jest \
            __tests__/integration/payment-integration.test.ts \
            --config=jest.config.js \
            $verbose_flag \
            --ci \
            --forceExit \
            --detectOpenHandles \
            --testTimeout=60000 \
            2>&1 | tee "$REPORT_DIR/integration-test-output.log"
        local exit_code=${PIPESTATUS[0]}
    fi
    
    if [ $exit_code -eq 0 ]; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed with exit code $exit_code"
    fi
    
    return $exit_code
}

run_load_tests() {
    print_section "Running Load Tests"
    
    cd "$PROJECT_ROOT"
    
    print_info "Executing load test script..."
    
    if command -v bun &> /dev/null; then
        bun run scripts/payment-load-test.ts 2>&1 | tee "$REPORT_DIR/load-test-output.log"
        local exit_code=${PIPESTATUS[0]}
    else
        npx tsx scripts/payment-load-test.ts 2>&1 | tee "$REPORT_DIR/load-test-output.log"
        local exit_code=${PIPESTATUS[0]}
    fi
    
    if [ $exit_code -eq 0 ]; then
        print_success "Load tests passed"
    else
        print_error "Load tests failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# ============================================
# REPORT GENERATION
# ============================================

generate_summary_report() {
    print_section "Generating Summary Report"
    
    local report_file="$REPORT_DIR/summary-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Payment Test Suite Report

**Generated:** $(date)  
**Environment:** ${STAGING_ENV:-staging}  
**Node Version:** $(node --version 2>/dev/null || echo "N/A")

## Test Results

| Suite | Status | Duration |
|-------|--------|----------|
| Unit Tests | ${UNIT_STATUS:-Not Run} | ${UNIT_DURATION:-N/A} |
| Integration Tests | ${INTEGRATION_STATUS:-Not Run} | ${INTEGRATION_DURATION:-N/A} |
| Load Tests | ${LOAD_STATUS:-Not Run} | ${LOAD_DURATION:-N/A} |

## Notes

- Unit tests cover individual payment method functionality
- Integration tests cover end-to-end user flows
- Load tests validate system performance under concurrent load

## Files Generated

- Unit Test Output: unit-test-output.log
- Integration Test Output: integration-test-output.log
- Load Test Output: load-test-output.log
- Load Test Report: payment-load-test-report.json (if run)
EOF

    print_success "Summary report generated: $report_file"
}

# ============================================
# MAIN EXECUTION
# ============================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit)
                RUN_UNIT=true
                RUN_INTEGRATION=false
                RUN_LOAD=false
                shift
                ;;
            --integration)
                RUN_UNIT=false
                RUN_INTEGRATION=true
                RUN_LOAD=false
                shift
                ;;
            --load)
                RUN_UNIT=false
                RUN_INTEGRATION=false
                RUN_LOAD=true
                shift
                ;;
            --all)
                RUN_UNIT=true
                RUN_INTEGRATION=true
                RUN_LOAD=true
                shift
                ;;
            --coverage)
                COVERAGE=true
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                echo "AlgeriaTrade.dz Payment Test Suite Runner"
                echo ""
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --unit          Run unit tests only"
                echo "  --integration   Run integration tests only"
                echo "  --load          Run load tests only"
                echo "  --all           Run all tests (default: unit + integration)"
                echo "  --coverage      Generate coverage report"
                echo "  --verbose       Verbose output"
                echo "  --help          Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 2
                ;;
        esac
    done
}

main() {
    parse_arguments "$@"
    
    print_header
    
    # Pre-run checks
    if ! check_prerequisites; then
        print_error "Prerequisites check failed"
        exit 2
    fi
    
    setup_environment
    
    local overall_exit_code=0
    local start_time=$(date +%s)
    
    # Run unit tests
    if [ "$RUN_UNIT" = true ]; then
        local unit_start=$(date +%s)
        
        if run_unit_tests; then
            UNIT_STATUS="✅ Passed"
        else
            UNIT_STATUS="❌ Failed"
            overall_exit_code=1
        fi
        
        UNIT_DURATION="$(($(date +%s) - unit_start))s"
    fi
    
    # Run integration tests
    if [ "$RUN_INTEGRATION" = true ]; then
        local integration_start=$(date +%s)
        
        if run_integration_tests; then
            INTEGRATION_STATUS="✅ Passed"
        else
            INTEGRATION_STATUS="❌ Failed"
            overall_exit_code=1
        fi
        
        INTEGRATION_DURATION="$(($(date +%s) - integration_start))s"
    fi
    
    # Run load tests
    if [ "$RUN_LOAD" = true ]; then
        local load_start=$(date +%s)
        
        if run_load_tests; then
            LOAD_STATUS="✅ Passed"
        else
            LOAD_STATUS="❌ Failed"
            overall_exit_code=1
        fi
        
        LOAD_DURATION="$(($(date +%s) - load_start))s"
    fi
    
    local total_duration="$(($(date +%s) - start_time))s"
    
    # Generate summary
    generate_summary_report
    
    # Final summary
    print_section "Final Summary"
    
    echo ""
    echo "┌─────────────────────┬──────────────┐"
    echo "│ Suite               │ Status       │"
    echo "├─────────────────────┼──────────────┤"
    
    if [ "$RUN_UNIT" = true ]; then
        printf "│ %-19s │ %-12s │\n" "Unit Tests" "$UNIT_STATUS"
    fi
    
    if [ "$RUN_INTEGRATION" = true ]; then
        printf "│ %-19s │ %-12s │\n" "Integration Tests" "$INTEGRATION_STATUS"
    fi
    
    if [ "$LOAD" = true ]; then
        printf "│ %-19s │ %-12s │\n" "Load Tests" "$LOAD_STATUS"
    fi
    
    echo "├─────────────────────┼──────────────┤"
    printf "│ %-19s │ %-12s │\n" "Total Duration" "$total_duration"
    echo "└─────────────────────┴──────────────┘"
    echo ""
    
    if [ $overall_exit_code -eq 0 ]; then
        print_success "All requested tests passed! 🎉"
    else
        print_error "Some tests failed. Check logs above for details."
    fi
    
    echo ""
    print_info "Reports saved to: $REPORT_DIR"
    
    exit $overall_exit_code
}

# Run main function
main "$@"
