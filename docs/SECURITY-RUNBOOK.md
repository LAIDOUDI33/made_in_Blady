# AlgeriaTrade.dz - Security Runbook & Incident Response Guide

**Version:** 1.0  
**Last Updated:** 2026-08-17  
**Classification:** Internal - Confidential

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Architecture Overview](#security-architecture-overview)
3. [Critical Vulnerabilities Fixed (Phase 1)](#critical-vulnerabilities-fixed-phase-1)
4. [Incident Response Procedures](#incident-response-procedures)
5. [Security Monitoring & Alerting](#security-monitoring--alerting)
6. [Runbooks by Incident Type](#runbooks-by-incident-type)
7. [Security Checklist](#security-checklist)
8. [Escalation Contacts](#escalation-contacts)

---

## Executive Summary

This runbook provides comprehensive security procedures for the AlgeriaTrade B2B Platform. It covers:

- **Immediate response procedures** for security incidents
- **Step-by-step remediation guides** for common attack vectors
- **Monitoring setup** for proactive threat detection
- **Post-incident review** processes

### Platform Security Posture

| Category | Status | Notes |
|----------|--------|-------|
| Authentication | ✅ Secured | JWT with 24h session, 2FA available |
| Authorization | ✅ Secured | Role-based access control |
| Input Validation | ✅ Secured | Comprehensive sanitization library |
| Rate Limiting | ⚠️ Enhanced | In-memory (upgrade to Redis recommended) |
| Encryption | ✅ Active | AES-256-GCM for data at rest |
| CORS | ✅ Secured | Restricted origins only |
| CSP | ✅ Strengthened | Removed unsafe-eval, nonce-based scripts |
| Session Management | ✅ Improved | 24h max (was 30 days) |

---

## Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EDGE LAYER                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │   CDN    │  │   WAF    │  │  DDoS Protection         │   │
│  │ Cloudflare│  │ Custom   │  │  Rate Limiting           │   │
│  └──────────┘  └──────────┘  └──────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js Middleware                       │   │
│  │  • Request Size Limits (10MB max)                    │   │
│  │  • Bot Detection & Blocking                          │   │
│  │  • Security Headers (CSP, HSTS, X-Frame-Options)     │   │
│  │  • Rate Limiting (100 req/min default)               │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │   API      │  │ WebSocket  │  │ Background Jobs    │    │
│  │ Routes     │  │ Messages   │  │ Email/Notifications│    │
│  └────────────┘  └────────────┘  └────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐    │
│  │  SQLite/   │  │   Redis    │  │ File Storage       │    │
│  │  Prisma    │  │  (Cache)   │  │ Cloudinary/S3      │    │
│  └────────────┘  └────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Critical Vulnerabilities Fixed (Phase 1)

### ✅ VULNERABILITY #1: Hardcoded JWT Secret (CRITICAL)

**Severity:** CRITICAL - Allows token forgery, complete authentication bypass  
**Location:** `mini-services/message-service/index.ts`  
**Status:** ✅ FIXED

#### Issue
```typescript
// BEFORE (VULNERABLE)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'algeriatrade-secret-key-2024-production-b2b-platform-secure';
```

#### Fix Applied
```typescript
// AFTER (SECURE)
function validateEnvironmentVariables(): void {
  const required = ['NEXTAUTH_SECRET', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1); // Fail fast - don't start with weak config
  }
}

validateEnvironmentVariables(); // Run on startup
const JWT_SECRET = process.env.NEXTAUTH_SECRET!; // No fallback!
```

#### Verification
```bash
# Test that service fails without secrets
unset NEXTAUTH_SECRET
node mini-services/message-service/index.ts
# Expected: [FATAL] Missing required environment variables...
```

---

### ✅ VULNERABILITY #2: Open CORS Configuration (HIGH)

**Severity:** HIGH - Enables cross-origin attacks, credential theft  
**Location:** `mini-services/message-service/index.ts`  
**Status:** ✅ FIXED

#### Issue
```typescript
// BEFORE (VULNERABLE)
cors: {
  origin: "*", // ANY website can make requests!
}
```

#### Fix Applied
```typescript
// AFTER (SECURE)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 
  'https://algeriatrade.dz,https://www.algeriatrade.dz'
).split(',');

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return ALLOWED_ORIGINS.some(allowed => origin === allowed || 
    origin.endsWith('.' + allowed.replace('https://', ''))
  );
}

cors: { origin: isOriginAllowed, credentials: true }
```

---

### ✅ VULNERABILITY #3: No Request Size Limits (MEDIUM-HIGH)

**Severity:** MEDIUM-HIGH - DoS via large payloads, memory exhaustion  
**Location:** `src/middleware.ts`  
**Status:** ✅ FIXED

#### Fix Applied
Added request size validation:
- **Default:** 10MB max body size
- **Auth endpoints:** 1MB (login/register shouldn't need large payloads)
- **Upload endpoints:** 50MB
- **URL length:** 2048 characters max

Returns HTTP `413 Payload Too Large` when exceeded.

---

### ✅ VULNERABILITY #4: Excessive Session Duration (MEDIUM)

**Severity:** MEDIUM - Extended window for token theft abuse  
**Location:** `src/lib/auth.ts`  
**Status:** ✅ FIXED

#### Change
| Setting | Before | After |
|---------|--------|-------|
| Session Max Age | 30 days | **24 hours** |

**Rationale:** B2B platform handles financial transactions and sensitive business data. Shorter sessions reduce risk window.

---

### ✅ VULNERABILITY #5: Weak Content Security Policy (MEDIUM)

**Severity:** MEDIUM - XSS protection significantly reduced  
**Location:** `src/middleware.ts`  
**Status:** ✅ FIXED

#### Changes
- ❌ Removed `'unsafe-eval'`
- ❌ Removed `'unsafe-inline'` from script-src
- ✅ Added `'nonce-${cspNonce}'` for inline scripts
- ✅ Added `require-trusted-types-for 'script'`

---

### ✅ VULNERABILITY #6: Missing Input Sanitization (MEDIUM)

**Severity:** MEDIUM - XSS, injection attacks possible  
**Status:** ✅ FIXED

Created comprehensive sanitization library at `src/lib/security/inputSanitization.ts`:
- HTML escaping
- SQL injection pattern detection
- XSS prevention
- Path traversal blocking
- Filename sanitization for uploads
- Email/phone validation
- Numeric input validation

---

## Incident Response Procedures

### Severity Levels

| Level | Name | Response Time | Examples |
|-------|------|---------------|----------|
| **P0** | Critical | Immediate | Active breach, data exfiltration, ransomware |
| **P1** | High | < 1 hour | Successful injection, auth bypass, DoS impacting users |
| **P2** | Medium | < 4 hours | Failed attack attempts, vulnerability discovered |
| **P3** | Low | < 24 hours | Security misconfigurations, minor issues |

### Response Workflow

```
DETECT → ASSESS → CONTAIN → ERADICATE → RECOVER → REVIEW
  ↓        ↓         ↓          ↓           ↓         ↓
Monitor  Impact    Isolate    Remove     Restore   Post-Mortem
Alerts   Analysis  Affected  Threat     Service   Lessons
         Scope     Systems              Learned
```

### Step 1: Detection & Triage

**Immediate Actions:**
1. Confirm the incident is not a false positive
2. Assign severity level (P0-P3)
3. Activate incident response team if P0/P1
4. Begin documentation in incident log

**Information to Gather:**
- What was detected? (automated alert, user report, etc.)
- When did it start?
- Which systems/users are affected?
- What is the current impact?

### Step 2: Assessment

**Questions to Answer:**
- Is this an active attack or reconnaissance?
- What is the attacker's objective?
- What is the blast radius?
- Are customer data at risk?

**Tools to Use:**
```bash
# Check recent authentication failures
grep "AUTH_LOGIN" logs/audit.log | grep '"success":false' | tail -50

# Check for blocked IPs
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://api.algeriatrade.dz/api/admin/security/blocked-ips

# Review rate limit violations
grep "RATE_LIMIT" logs/application.log | tail -100

# Check WebSocket connections
netstat -an | grep :3003 | wc -l
```

### Step 3: Containment

**By Attack Type:**

#### Brute Force Attack
```bash
# Block attacking IP at firewall level
iptables -A INPUT -s ATTACKER_IP -j DROP

# Or block via application admin API
curl -X POST https://api.algeriatrade.dz/api/admin/security/block-ip \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ipAddress": "ATTACKER_IP", "durationMs": 86400000, "reason": "Brute force attack"}'

# Force password reset for targeted accounts
# (Implement account lockdown procedure)
```

#### DoS Attack
```bash
# Enable aggressive rate limiting
# 1. Scale horizontally if using cloud provider
# 2. Enable CDN DDoS protection (Cloudflare, etc.)
# 3. Block attacking IP ranges

# Check current connection counts
ss -s
netstat -an | grep :3000 | grep ESTABLISHED | wc -l

# If overwhelmed, enable maintenance mode
echo "maintenance=true" > /tmp/deployment-mode
```

#### Data Breach
```bash
# IMMEDIATE ACTIONS:
# 1. Rotate all credentials
# 2. Revoke all active sessions
# 3. Enable additional logging
# 4. Preserve evidence (don't modify affected systems)

# Revoke sessions via database
npx prisma db execute --stdin <<SQL
DELETE FROM "Session" WHERE "expires" > datetime('now');
SQL

# Force re-authentication for all users
# Notify affected users via email
```

### Step 4: Eradication

**Remove the Threat:**
1. Patch the vulnerability that allowed access
2. Remove malware/backdoors
3. Reset compromised credentials
4. Update firewall rules
5. Verify no persistence mechanisms remain

### Step 5: Recovery

**Restore Services:**
1. From clean backups (if data was corrupted)
2. Monitor for recurrence
3. Gradually increase traffic (if DoS)
4. Verify all security controls are active

### Step 6: Post-Incident Review

**Within 5 Business Days:**
1. Document timeline of events
2. Identify root cause
3. Assess effectiveness of response
4. Update procedures based on lessons learned
5. Implement preventive measures

---

## Runbooks by Incident Type

### 🔴 Runbook: Brute Force Login Attack

**Detection Signs:**
- Multiple failed logins from same IP
- Rate limit errors in logs
- Account lockout notifications

**Response Procedure:**

1. **Identify Source**
   ```bash
   # Get attacker IP from audit logs
   grep -r "failed login" /var/log/algeriatrade/ | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10
   ```

2. **Block Attacker**
   ```bash
   # Application-level block
   curl -X POST /api/admin/security/block-ip \
     -d '{"ip": "X.X.X.X", "reason": "Brute force", "durationHours": 24}'
   
   # Firewall level (if available)
   iptables -A INPUT -s X.X.X.X -j DROP
   ```

3. **Protect Targeted Accounts**
   - Force password reset
   - Enable 2FA requirement
   - Lock accounts after 5 failed attempts

4. **Notify Users**
   - Send security alert if their account was targeted
   - Recommend password change

5. **Post-Incident**
   - Review authentication logs
   - Consider CAPTCHA for suspicious IPs
   - Update rate limiting rules

---

### 🔴 Runbook: Potential Data Breach

**Detection Signs:**
- Unusual data export activity
- Access to sensitive tables outside normal patterns
- Large number of records accessed by single user
- Alerts from database monitoring

**IMMEDIATE RESPONSE (First 30 Minutes):**

1. **Contain**
   ```bash
   # Stop application services
   systemctl stop algeriatrade
   
   # Or put in read-only mode
   echo "readonly=true" > /etc/algeriatrade/maintenance.conf
   ```

2. **Preserve Evidence**
   ```bash
   # Create forensic snapshot
   mkdir -p /forensics/incident-$(date +%Y%m%d-%H%M%S)
   cd /forensics/incident-*
   
   # Copy logs
   cp -r /var/log/algeriatrade/* ./logs/
   
   # Database snapshot
   sqlite3 /data/algeriatrade.db ".dump" > database-dump.sql
   
   # Running processes
   ps aux > processes.txt
   netstat -an > network-connections.txt
   ```

3. **Assess Scope**
   - Which tables were accessed?
   - How many records affected?
   - Was PII/financial data accessed?

4. **Notifications**
   - Legal team (within 1 hour)
   - Executive team (within 2 hours)
   - Data protection authority (if GDPR applies, within 72 hours)
   - Affected customers (as required by law)

---

### 🟡 Runbook: Suspicious System Behavior

**Signs:**
- High CPU/memory usage
- Unknown processes running
- Unusual network connections
- Modified system files

**Response:**

1. **Isolate System**
   - Disconnect from network (if physical access)
   - Change firewall rules to block all inbound except admin IP
   - Take snapshot before investigation (for VMs)

2. **Investigate**
   ```bash
   # Check running processes
   ps aux --sort=-%cpu | head -20
   
   # Network connections
   netstat -tulpn | grep LISTEN
   
   # Recent file changes
   find /var/www -mtime -1 -type f
   
   # Cron jobs
   crontab -l
   ls -la /etc/cron.d/
   
   # User accounts with shell access
   grep -E ":(\/bin\/bash|\/bin\/sh)$" /etc/passwd
   ```

3. **Check Common Indicators of Compromise**
   ```bash
   # Hidden files in web root
   find /var/www -name ".*" -type f
   
   # Recently modified binaries
   find /usr/bin /usr/sbin -mtime -30 -type f
   
   # Setuid files
   find / -perm -4000 -type f 2>/dev/null
   ```

---

## Security Monitoring & Alerting

### Key Metrics to Monitor

| Metric | Threshold | Alert Level | Action |
|--------|-----------|-------------|--------|
| Failed logins/IP | > 10/min | P2 | Increase logging, consider block |
| Failed logins/account | > 5/min | P1 | Lock account, notify user |
| Rate limit hits | > 100/min | P2 | Investigate potential DoS |
| Error rate | > 5% baseline | P2 | Check for issues |
| Response time p99 | > 5s | P3 | Performance investigation |
| New registrations/IP | > 3/hour | P2 | CAPTCHA, manual review |
| Payment failures | > 20% | P1 | Fraud investigation |

### Log Retention Policy

| Log Type | Retention Period | Storage Location |
|----------|------------------|------------------|
| Authentication logs | 1 year | Secure log server |
| Audit logs | 7 years | Immutable storage |
| Application logs | 90 days | Log aggregation |
| Access logs | 1 year | SIEM system |
| Security events | 7 years | Compliance storage |

### Setting Up Alerts

**Example: Failed Login Alert (Prometheus/Grafana)**

```yaml
# prometheus/rules/alerts.yml
groups:
  - name: algeriatrade-security
    interval: 1m
    rules:
      - alert: HighFailedLoginRate
        expr: rate(failed_login_total[5m]) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate of failed logins"
          description: "{{$value}} failed logins per second"
      
      - alert: BruteForceDetected
        expr: rate(failed_login_total{ip="..."}[1m]) > 2
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Possible brute force attack from {{ $labels.ip }}"
```

---

## Security Checklist

### Daily Checks
- [ ] Review error rates in monitoring dashboard
- [ ] Check for blocked IPs and investigate
- [ ] Verify backup completion
- [ ] Review new user registrations for spam patterns

### Weekly Checks
- [ ] Review failed authentication attempts
- [ ] Check for expired SSL certificates
- [ ] Review security event logs
- [ ] Verify dependency updates available
- [ ] Test incident response procedures (tabletop exercise)

### Monthly Checks
- [ ] Review and rotate API keys/secrets
- [ ] Audit user permissions
- [ ] Review third-party access
- [ ] Update security runbook based on lessons learned
- [ ] Penetration test (or schedule)
- [ ] Review and update CORS/CSP configurations

### Quarterly Tasks
- [ ] Full security audit
- [ ] Disaster recovery test
- [ ] Access control review
- [ ] Vendor security assessment
- [ ] Compliance check (GDPR, local regulations)

---

## Escalation Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Security Lead | [Name] | [Email/Phone] | 24/7 for P0/P1 |
| CTO | [Name] | [Email/Phone] | Business hours + Emergency |
| DevOps Lead | [Name] | [Email/Phone] | 24/7 for infrastructure |
| Legal Counsel | [Name] | [Email/Phone] | Business hours + Emergency |
| PR/Communications | [Name] | [Email/Phone] | For public incidents |

### External Contacts (For Major Incidents)

- **CERT Team:** [Local CERT contact]
- **Law Enforcement:** [Cybercrime unit contact]
- **Data Protection Authority:** [APCE or relevant authority]
- **Insurance Provider:** [Cyber insurance claims]

---

## Appendix: Useful Commands

### Quick Security Assessment

```bash
# Check for common vulnerabilities
curl -I https://algeriatrade.dz | grep -E "(Server:|X-Frame|X-Content|CSP)"

# Test rate limiting
for i in {1..110}; do curl -s -o /dev/null -w "%{http_code}" https://api.algeriatrade.dz/api/health; done | grep -c 429

# Check TLS configuration
openssl s_client -connect algeriatrade.dz:443 </dev/null 2>/dev/null | openssl x509 -noout -dates

# Scan for open ports
nmap -sT algeriatrade.dz

# Check DNS configuration
dig algeriatrade.dz ANY
```

### Forensics Collection

```bash
#!/bin/bash
# collect-forensics.sh - Run immediately upon suspected breach
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DIR="/forensics/$TIMESTAMP"
mkdir -p "$DIR"

# System state
ps aux > "$DIR/processes.txt"
netstat -an > "$DIR/network.txt"
last -50 > "$DIR/recent-logins.txt"

# Application logs
cp -r /var/log/algeriatrade/* "$DIR/logs/" 2>/dev/null

# Database
sqlite3 /data/algeriatrade.db ".dump" > "$DIR/database.sql"

# Hash everything for integrity
find "$DIR" -type f -exec sha256sum {} \; > "$DIR/checksums.txt"

echo "Forensics collected in $DIR"
```

---

**Document Control:**  
This runbook should be reviewed quarterly and after any significant security incident.  
All changes must be approved by the Security Lead.

**Next Review Date:** 2026-11-17
