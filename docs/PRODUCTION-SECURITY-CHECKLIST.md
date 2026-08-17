# Production Security Checklist

## AlgeriaTrade.dz B2B Platform - Production Security Hardening

This checklist must be completed before deploying to production. Each item should be verified and signed off by a team member.

---

## 1. Authentication & Access Control

- [ ] **Change all default passwords**
  - [ ] PostgreSQL password changed from default
  - [ ] Redis password set and is strong (32+ characters)
  - [ ] NextAuth secret generated with `openssl rand -base64 32`
  - [ ] Grafana admin password changed
  - [ ] All service accounts have unique, strong passwords

- [ ] **Configure 2FA for admin accounts**
  - [ ] All super-admin accounts have 2FA enabled
  - [ ] TOTP/Authenticator app configured
  - [ ] Backup codes generated and stored securely
  - [ ] 2FA enforcement policy in place

- [ ] **Session management configured**
  - [ ] Session timeout set to reasonable value (≤24h)
  - [ ] Secure cookie flags enabled (HttpOnly, Secure, SameSite)
  - [ ] Session invalidation on password change
  - [ ] Concurrent session limits enforced

- [ ] **Password policy enforced**
  - [ ] Minimum 12 characters required
  - [ ] Complexity requirements (uppercase, lowercase, numbers, symbols)
  - [ ] Password history check (no reuse of last 5)
  - [ ] Account lockout after failed attempts (5 attempts, 15min lockout)

---

## 2. Network Security

- [ ] **Enable HTTPS everywhere**
  - [ ] SSL/TLS certificate installed and valid
  - [ ] HTTP to HTTPS redirect configured
  - [ ] HSTS header enabled with max-age ≥ 31536000
  - [ ] OCSP stapling enabled
  - [ ] Only TLS 1.2 and 1.3 enabled

- [ ] **Configure CORS properly**
  - [ ] CORS origins restricted to known domains only
  - [ ] Wildcard origins (`*`) not used in production
  - [ ] Credentials mode properly configured
  - [ ] Preflight requests handled correctly

- [ ] **Set up IP allowlisting for sensitive endpoints**
  - [ ] Admin API endpoints IP-restricted
  - [ ] Database ports not exposed publicly
  - [ ] Redis port not accessible from outside
  - [ ] SSH access limited to specific IPs

- [ ] **Firewall rules configured**
  - [ ] Only necessary ports open (80, 443)
  - [ ] Rate limiting rules in place
  - [ ] Geo-blocking considered for admin endpoints
  - [ ] DDoS protection enabled (Cloudflare/AWS Shield)

---

## 3. Web Application Firewall (WAF)

- [ ] **Set up WAF rules**
  - [ ] SQL injection protection enabled
  - [ ] XSS attack prevention active
  - [ ] Command injection blocking
  - [ ] Path traversal prevention
  - [ ] File upload restrictions in place

- [ ] **WAF monitoring configured**
  - [ ] Alerts on blocked requests
  - [ ] Regular rule review schedule
  - [ ] False positive handling process
  - [ ] Attack logging enabled

---

## 4. Data Protection

- [ ] **Encryption at rest**
  - [ ] Database encryption enabled (TDE or filesystem)
  - [ ] Backup files encrypted
  - [ ] Sensitive config values encrypted
  - [ ] File storage encryption (S3 SSE-KMS)

- [ ] **Encryption in transit**
  - [ ] All APIs use HTTPS
  - [ ] Database connections use SSL
  - [ ] Redis connection uses TLS
  - [ ] Internal service mTLS considered

- [ ] **Data masking implemented**
  - [ ] PII masked in logs
  - [ ] Credit card numbers never logged
  - [ ] Passwords never in logs
  - [ ] Token values truncated in logs

- [ ] **GDPR compliance**
  - [ ] Privacy policy published
  - [ ] Data deletion endpoint functional
  - [ ] Data export functionality working
  - [ ] Consent tracking implemented

---

## 5. API Security

- [ ] **Review and minimize API permissions**
  - [ ] Principle of least privilege applied
  - [ ] Scoped OAuth tokens used
  - [ ] API keys have minimal required scopes
  - [ ] Public vs private endpoints clearly defined

- [ ] **Rate limiting configured**
  - [ ] Global rate limit (100 req/min per IP)
  - [ ] API-specific rate limits (60 req/min)
  - [ ] Auth endpoint strict limits (5 req/min)
  - [ ] Upload endpoint limits (10 req/min)

- [ ] **Input validation**
  - [ ] Server-side validation on all inputs
  - [ ] SQL parameterized queries only
  - [ ] XSS sanitization on user content
  - [ ] File type validation on uploads

- [ ] **API versioning**
  - [ ] Versioned API endpoints (/api/v1/)
  - [ ] Deprecation policy documented
  - [ ] Breaking changes communicated

---

## 6. Infrastructure Security

- [ ] **Container security**
  - [ ] Non-root user in Docker containers
  - [ ] Read-only filesystem where possible
  - [ ] Resource limits configured
  - [ ] No secrets in images (use secrets manager)
  - [ ] Base images regularly updated

- [ ] **Server hardening**
  - [ ] Unnecessary services disabled
  - [ ] SSH key-based auth only (no passwords)
  - [ ] Root login disabled
  - [ ] Automatic security updates enabled
  - [ ] Kernel patches applied

- [ ] **Secrets management**
  - [ ] No secrets in code/repository
  - [ ] Environment variables used for secrets
  - [ ] Secrets rotated regularly (90 days)
  - [ ] Secrets manager (AWS SM, HashiCorp Vault) for production

- [ ] **Network segmentation**
  - [ ] Separate networks for app/db/cache
  - [ ] Internal services not internet-accessible
  - [ ] VPC/subnet isolation (cloud)

---

## 7. Logging & Monitoring

- [ ] **Enable audit logging**
  - [ ] Authentication events logged
  - [ ] Authorization failures logged
  - [ ] Data access logged (especially PII)
  - [ ] Admin actions fully audited
  - [ ] Logs include timestamp, user, action, IP

- [ ] **Security event monitoring**
  - [ ] Failed login attempt alerts (>5 in 5min)
  - [ ] Unusual traffic pattern detection
  - [ ] New geographic location alerts
  - [ ] Privilege escalation alerts

- [ ] **Log integrity**
  - [ ] Logs sent to external system (not on same server)
  - [ ] Log tampering detection
  - [ ] Retention period compliant (≥90 days)

---

## 8. Dependency Security

- [ ] **Vulnerability scanning**
  - [ ] npm/bun dependencies scanned (npm audit / Snyk)
  - [ ] Container images scanned (Trivy / Clair)
  - [ ] Base image vulnerabilities addressed
  - [ ] High/Critical CVEs remediated

- [ ] **Dependency updates**
  - [ ] Automated dependency updates (Dependabot/Renovate)
  - [ ] Security patch SLA (< 48 hours for critical)
  - [ ] Lockfile committed to repository
  - [ ] Reproducible builds verified

- [ ] **Supply chain security**
  - [ ] Signed commits required (main branch)
  - [ ] Pinning digest for base images
  - [ ] SBOM (Software Bill of Materials) generated

---

## 9. DDoS Protection

- [ ] **Set up DDoS protection**
  - [ ] CDN in front (Cloudflare, AWS CloudFront)
  - [ ] DDoS mitigation service (Cloudflare Pro+, AWS Shield)
  - [ ] Rate limiting at edge
  - [ ] Bot protection enabled

- [ ] **Capacity planning**
  - [ ] Auto-scaling configured
  - [ ] Load testing completed
  - [ ] Traffic spikes handled gracefully
  - [ ] Degradation mode defined

---

## 10. Incident Response

- [ ] **Incident response plan**
  - [ ] IR playbook documented
  - [ ] On-call rotation established
  - [ ] Esc contacts available
  - [ ] Communication templates prepared

- [ ] **Recovery procedures tested**
  - [ ] Database restore tested
  - [ ] Backup restoration verified
  - [ ] Failover procedures documented
  - [ ] RTO/RPO defined and achievable

- [ ] **Security contact info**
  - [ ] Security email address public
  - [ ] Bug bounty program (or responsible disclosure page)
  - [ ] Vulnerability reporting process clear

---

## Pre-Launch Verification

### Critical Checks (Must Pass)

| Check | Status | Notes |
|-------|--------|-------|
| SSL certificate valid | ☐ | |
| All default passwords changed | ☐ | |
| HTTPS redirect working | ☐ | |
| HSTS header present | ☐ | |
| Security headers configured | ☐ | |
| CORS properly restricted | ☐ | |
| Rate limiting active | ☐ | |
| WAF rules enabled | ☐ | |
| 2FA enforced for admins | ☐ | |
| Audit logging enabled | ☐ | |
| Backups encrypted | ☐ | |
| Dependencies scanned | ☐ | |
| DDoS protection active | ☐ | |

### Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Security Reviewer | | | |
| DevOps Engineer | | | |
| Product Owner | | | |

---

## Post-Launch Monitoring

### Daily Checks
- [ ] Review security dashboard (Grafana/Sentry)
- [ ] Check for new vulnerability alerts
- [ ] Review blocked request patterns
- [ ] Verify backup completion

### Weekly Reviews
- [ ] Security metrics review
- [ ] Access log analysis
- [ ] Dependency update status
- [ ] Incident response drill

### Monthly Audits
- [ ] Full penetration test
- [ ] Access control review
- [ ] Certificate expiry check
- [ ] Retention policy compliance

---

## Quick Reference Commands

```bash
# Check SSL certificate
echo | openssl s_client -connect algeriatrade.dz:443 2>/dev/null | openssl x509 -noout -dates

# Verify security headers
curl -I https://algeriatrade.dz

# Test rate limiting
for i in {1..150}; do curl -s -o /dev/null -w "%{http_code}" https://algeriatrade.dz/api/test; done

# Scan container image
trivy image ghcr.io/algeriatrade/algeriatrade-dz:latest

# Run dependency audit
bun audit

# Test backup restoration
./scripts/backup-production.sh --verify ./backups/database/latest.sql.gz
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

---

*Last Updated: $(date +"%Y-%m-%d")*
*Version: 1.0*
