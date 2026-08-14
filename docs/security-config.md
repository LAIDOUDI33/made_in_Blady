# =============================================================================
# Security Configuration - AlgeriaTrade.dz
# Complete security hardening for production
# =============================================================================

# This file contains security best practices and configurations
# that should be implemented across the entire stack

# =============================================================================
# 1. SECURITY HEADERS (Already in next.config.ts)
# =============================================================================
# Ensure these headers are set:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# =============================================================================
# 2. CONTENT SECURITY POLICY (CSP)
# =============================================================================
# Recommended CSP for AlgeriaTrade.dz:

Content-Security-Policy: \
  default-src 'self'; \
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com https://sentry.io; \
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; \
  img-src 'self' data: blob: https: *.algeriatrade.dz *.cloudinary.com *.amazonaws.com *.googleapis.com *.gstatic.com; \
  font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; \
  connect-src 'self' https://api.github.com https://o*.ingest.sentry.io https://*.google-analytics.com https://analytics.google.com https://openai.api.com https://api.anthropic.com; \
  frame-ancestors 'none'; \
  base-uri 'self'; \
  form-action 'self';

# =============================================================================
# 3. RATE LIMITING CONFIGURATION
# =============================================================================

RATE_LIMITS:
  # API Endpoints
  api:
    window: 15 minutes
    max_requests: 100
    
  # Authentication endpoints (stricter)
  auth:
    window: 15 minutes
    max_requests: 20
    
  # Search endpoints
  search:
    window: 1 minute
    max_requests: 30
    
  # File uploads
  upload:
    window: 1 hour
    max_requests: 10

# =============================================================================
# 4. CORS CONFIGURATION
# =============================================================================

CORS_ALLOWED_ORIGINS:
  production:
    - "https://algeriatrade.dz"
    - "https://www.algeriatrade.dz"
    - "https://app.algeriatrace.dz"
    
  staging:
    - "https://staging.algeriatrade.dz"
    - "https://preview-*.vercel.app"
    
  development:
    - "http://localhost:3000"
    - "http://127.0.0.1:3000"

CORS_ALLOWED_METHODS:
  - GET
  - POST
  - PUT
  - PATCH
  - DELETE
  - OPTIONS

CORS_ALLOWED_HEADERS:
  - Content-Type
  - Authorization
  - X-Requested-With
  - X-Request-ID
  - Accept-Language

# =============================================================================
# 5. INPUT VALIDATION RULES
# =============================================================================

VALIDATION_RULES:
  # Usernames
  username:
    pattern: "^[a-zA-Z0-9_]{3,30}$"
    min_length: 3
    max_length: 30
    
  # Passwords (strong requirements)
  password:
    min_length: 12
    require_uppercase: true
    require_lowercase: true
    require_number: true
    require_special_char: true
    forbidden_patterns:
      - "password"
      - "12345678"
      - "qwerty"
      
  # Email addresses
  email:
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    
  # Phone numbers (Algerian format)
  phone_algeria:
    pattern: "^\\+?213[5-7][0-9]{8}$"
    
  # Product names
  product_name:
    min_length: 3
    max_length: 200
    allowed_chars: "letters, numbers, spaces, -, ., /, (, )"

# =============================================================================
# 6. SQL INJECTION PREVENTION
# =============================================================================
# All database queries MUST use parameterized queries (Prisma handles this)
# Never concatenate user input into queries

# Example of SAFE query (using Prisma):
# const users = await prisma.user.findMany({
#   where: {
#     email: userInput, // Prisma automatically escapes this
#   }
# });

# Example of UNSAFE query (NEVER do this):
# const result = await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`);

# =============================================================================
# 7. XSS PREVENTION
# =============================================================================
# Rules to prevent XSS attacks:

XSS_PREVENTION:
  # Always sanitize user input before rendering
  # Use React's built-in JSX escaping (automatic)
  
  # For dynamic HTML content, use DOMPurify or similar
  dangerous_html_sanitization: true
  
  # Disable dangerouslySetInnerHTML where possible
  prefer_jsx_over_html: true
  
  # Validate and sanitize URLs
  url_validation:
    allow_protocols: ["https:", "http:"]
    block_javascript: true
    block_data: true

# =============================================================================
# 8. CSRF PROTECTION
# =============================================================================
CSRF_PROTECTION:
  enabled: true
  token_name: "X-CSRF-Token"
  header_name: "X-CSRF-Token"
  cookie_name: "csrf_token"
  same_site: "Strict"
  secure: true  # Only send over HTTPS

# =============================================================================
# 9. FILE UPLOAD SECURITY
# =============================================================================
FILE_UPLOAD_SECURITY:
  # Allowed MIME types
  allowed_mime_types:
    - "image/jpeg"
    - "image/png"
    - "image/gif"
    - "image/webp"
    - "application/pdf"
    - "text/csv"
    - "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
  # Maximum file sizes
  max_sizes:
    avatar: "5MB"
    product_image: "10MB"
    document: "50MB"
    
  # Scan uploads for malware
  virus_scanning: true
  
  # Generate random filenames
  randomize_filenames: true
  
  # Store uploads outside web root
  private_storage: true

# =============================================================================
# 10. SESSION SECURITY
# =============================================================================
SESSION_SECURITY:
  # Session configuration
  cookie:
    http_only: true
    secure: true      # Production only
    same_site: "Strict"
    path: "/"
    domain: ".algeriatrade.dz"
    
  # Session timeout
  timeout:
    absolute: 24 hours        # Maximum session duration
    idle: 30 minutes          # Logout after idle time
      
  # Regenerate session ID after login
  regenerate_on_auth: true
  
  # Store session data server-side only
  server_side_sessions: true

# =============================================================================
# 11. API KEY SECURITY
# =============================================================================
API_KEY_SECURITY:
  # Key generation
  key_length: 64 characters
  key_encoding: hex
  
  # Key storage
  hashing_algorithm: "argon2id"
  salt_rounds: 19
  
  # Key validation
  format_prefix: "at_"  # AlgeriaTrade prefix
  
  # Rate limiting per key
  key_rate_limits:
    free: "100/day"
    pro: "10000/day"
    enterprise: "unlimited"

# =============================================================================
# 12. DEPENDENCY SECURITY
# =============================================================================
DEPENDENCY_SECURITY:
  # Automated dependency updates
  auto_update:
    patch: true       # Auto-update patch versions
    minor: false      # Manual review for minor versions
    major: false      # Manual review for major versions
    
  # Vulnerability scanning tools
  scanners:
    - npm audit
    - Snyk
    - Dependabot
    - GitHub Advisory Database
    
  # Action on critical vulnerabilities
  critical_vulnerability_action: "block_deploy"

# =============================================================================
# 13. LOGGING & AUDITING
# =============================================================================
SECURITY_LOGGING:
  # Events to log
  log_events:
    - login_success
    - login_failure
    - logout
    - password_change
    - permission_change
    - api_key_creation
    - sensitive_data_access
    - admin_actions
    
  # Log retention
  retention:
    access_logs: 90 days
    error_logs: 30 days
    audit_logs: 1 year
    
  # PII handling in logs
  pii_handling:
    mask_email: true
    mask_phone: true
    mask_ip: false  # Keep IP for security analysis

# =============================================================================
# 14. ENCRYPTION STANDARDS
# =============================================================================
ENCRYPTION:
  # Data at rest
  at_rest:
    algorithm: "AES-256-GCM"
    key_management: "AWS KMS" or "HashiCorp Vault"
    
  # Data in transit
  in_transit:
    tls_version: "1.3"  # Minimum TLS 1.2, prefer 1.3
    cipher_suites:
      - "TLS_AES_256_GCM_SHA384"
      - "TLS_CHACHA20_POLY1305_SHA256"
      - "TLS_AES_128_GCM_SHA256"
      
  # Sensitive fields encryption
  field_encryption:
    ssn: true
    credit_card: true
    bank_account: true
    api_keys: true

# =============================================================================
# 15. BACKUP & DISASTER RECOVERY
# =============================================================================
BACKUP_SECURITY:
  # Backup frequency
  frequency:
    database: daily
    files: hourly
    configs: on_change
    
  # Backup encryption
  encrypted: true
  algorithm: "AES-256"
  
  # Backup storage locations
  locations:
    primary: "AWS S3 (different region)"
    secondary: "Cloud Storage (different provider)"
    local: "Encrypted external drive"
    
  # Recovery testing
  recovery_test_frequency: monthly
  rto_target: "4 hours"  # Recovery Time Objective
  rpo_target: "1 hour"   # Recovery Point Objective

# =============================================================================
# 16. INCIDENT RESPONSE PLAN
# =============================================================================
INCIDENT_RESPONSE:
  # Severity levels
  severity_levels:
    - P1-Critical: Data breach, system down
    - P2-High: Security vulnerability exploited
    - P3-Medium: Suspicious activity detected
    - P4-Low: Policy violation
    
  # Response team contacts
  team:
    security_lead: "security@algeriatrade.dz"
    cto: "cto@algeriatrade.dz"
    legal: "legal@algeriatrade.dz"
    
  # Communication plan
  communication:
    internal: immediate
    customers: within 24 hours
    public: as required by law
    
  # Post-incident
  post_incident:
    root_cause_analysis: required
    remediation_plan: required
    timeline: 72 hours

# =============================================================================
# 17. COMPLIANCE CHECKLIST
# =============================================================================
COMPLIANCE:
  gdpr:
    enabled: true
    data_protection_officer: dpo@algeriatrade.dz
    privacy_policy_url: https://algeriatrade.dz/privacy
    cookie_consent: required
    
  algerian_law:
    data_localization: preferred  # Store Algerian data locally when possible
    language_requirements: fr, ar
    
  pci_dss:
    applicable: false  # Not processing payments directly (using gateways)
    
  accessibility:
    wcag_level: AA
    screen_reader_support: true
    keyboard_navigation: true
