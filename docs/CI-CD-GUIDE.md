# AlgeriaTrade.dz - Complete CI/CD Pipeline Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Workflows Explained](#workflows-explained)
4. [Configuration Guide](#configuration-guide)
5. [Secrets & Variables Setup](#secrets--variables-setup)
6. [Deployment Procedures](#deployment-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Overview

AlgeriaTrade.dz features **enterprise-grade CI/CD pipelines** powered by GitHub Actions, providing:

- ✅ Automated code quality checks (ESLint, Prettier, TypeScript)
- ✅ Comprehensive security scanning (SAST, DAST, dependency audit)
- ✅ Multi-environment deployments (Staging → Production)
- ✅ Mobile app builds (iOS, Android) with store submission
- ✅ Performance monitoring (Lighthouse CI)
- ✅ Database migration automation
- ✅ Multi-channel notifications (Slack, Email, Discord, Telegram)

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB EVENTS                             │
│  Push / PR / Schedule / Manual Dispatch                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  MAIN CI/CD PIPELINE                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐  │
│  │ Code      │  │ Tests     │  │ Build     │  │ Docker   │  │
│  │ Quality   │→ │ Unit+Int  │→ │ Next.js   │→ │ Build    │  │
│  │ + Security│  │           │  │           │  │ + Push   │  │
│  └───────────┘  └───────────┘  └───────────┘  └─────────┘  │
│       │              │              │             │         │
│       ▼              ▼              ▼             ▼         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              DEPLOYMENT STAGES                      │   │
│  │  Staging → Validation → Production → Monitoring     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflows Explained

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Trigger:** Push to any branch, PRs, manual dispatch

**Jobs:**
| Job | Purpose | Duration |
|-----|---------|----------|
| `code-quality` | ESLint, Prettier, TypeScript, Security Audit | ~10 min |
| `test` | Unit & Integration tests with coverage | ~25 min |
| `build` | Next.js production build | ~15 min |
| `docker` | Multi-platform image build & push | ~25 min |
| `deploy-staging` | Deploy to staging environment | ~10 min |
| `deploy-production` | Deploy to production (with approval) | ~15 min |

**Manual Triggers:**
```bash
# Trigger via GitHub CLI
gh workflow run ci-cd.yml -f environment=production

# Or via UI: Actions → CI/CD Pipeline → Run workflow
```

### 2. PR Review Automation (`pr-review.yml`)

**Features:**
- Automatic PR validation (title format, linked issues, size)
- Code complexity analysis
- Security pattern detection
- Auto-generated review comments
- Merge readiness gates

**PR Commands:**
- `/retest` - Re-run all tests
- `/deploy-staging` - Deploy current PR to staging
- `/review` - Trigger additional code analysis

### 3. Dependency Management (`dependency-updates.yml`)

**Schedule:** Daily at 3 AM Algiers time

**Features:**
- Outdated package detection
- Automatic security vulnerability fixes
- Version bump PR creation (minor/major)
- Lockfile maintenance
- Tracking issue updates

**Dependabot Configuration:**
- NPM packages: Weekly on Mondays
- Docker: Weekly on Wednesdays
- GitHub Actions: Monthly

### 4. Database Migrations (`database-migration.yml`)

**Safety Features:**
- Schema change validation
- Breaking change detection
- Test database verification
- Pre-deployment backups
- One-click rollback capability

**Manual Migration:**
```bash
# Create new migration
gh workflow run database-migration.yml \
  -f environment=staging \
  -f migration_name="add_user_preferences"

# Rollback (emergency)
gh workflow run database-migration.yml \
  -f environment=production \
  -f rollback=true
```

### 5. Mobile App Builds (`mobile-build.yml`)

**Platforms:**
- Android (APK for preview, AAB for Play Store)
- iOS (Simulator builds, IPA for App Store)

**Build Profiles:**
| Profile | Use Case | Distribution |
|---------|----------|---------------|
| `preview` | Development testing | EAS/QR codes |
| `development` | QA/Staging | Internal test |
| `production` | Release | App Stores |

**Store Submission:**
```bash
# Submit to both stores
gh workflow run mobile-build.yml \
  -f platform=all \
  -f profile=production \
  -f submit_store=true

# Version bump + build
gh workflow run mobile-build.yml \
  -f platform=all \
  -f profile=production \
  -f version_bump=true
```

### 6. Performance Monitoring (`performance.yml`)

**Tools:**
- Lighthouse CI (6 core metrics)
- Custom performance budgets
- Web Vitals tracking
- Regression detection
- Bundle size analysis

**Budget Thresholds:**
```javascript
{
  "categories:performance": ["error", {"minScore": 0.9}],      // 90+
  "categories:accessibility": ["error", {"minScore": 0.95}], // 95+
  "first-contentful-paint": ["error", {"maxNumericValue": 2000}], // 2s
  "largest-contentful-paint": ["error", {"maxNumericValue": 2500}], // 2.5s
  "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]     // 0.1
}
```

### 7. Security Scanning (`security-scan.yml`)

**Scanners:**
| Scanner | Type | What it finds |
|---------|------|---------------|
| CodeQL | SAST | Code vulnerabilities, bugs |
| pnpm audit | Dependencies | Known CVEs in packages |
| TruffleHog | Secrets | Exposed credentials |
| Gitleaks | Secrets | Additional secret patterns |
| Snyk | Comprehensive | All of the above + remediation |
| Trivy | Container | Docker image vulnerabilities |
| OWASP ZAP | DAST | Runtime security issues |
| OSSF Scorecard | Supply Chain | Project security hygiene |

**Schedule:** Daily at 4 AM + on every push/PR

### 8. Notifications (`notifications.yml`)

**Channels:**
- **Slack** - Real-time build status, alerts
- **Email** - Failure notifications, daily digests
- **Discord** - Embed-style updates
- **Telegram** - Mobile-friendly alerts
- **PagerDuty** - Critical incident paging

---

## Configuration Guide

### Required Repository Variables

Go to: Settings → Variables and secrets → Variables

```bash
# Deployment Platform Options:
DEPLOYMENT_PLATFORM=vercel|netlify|docker
BACKUP_BEFORE_DEPLOY=true|false

# Feature Flags:
SLACK_ALERTS_CHANNEL=<webhook-url>
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_CHAT_ID=<chat-id>
DISCORD_WEBHOOK_URL=<webhook-url>
PAGERDUTY_INTEGRATION_KEY=<key>
SNYK_TOKEN=<token>
SNYK_ORG=<org-name>

# External Services:
ZAP_API_KEY=<api-key-for-dast-scans>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<email>
```

### Required Secrets

Go to: Settings → Variables and secrets → Secrets

#### Core Secrets
```bash
# Authentication
NEXTAUTH_SECRET=<random-string>
GITHUB_TOKEN=<pat-with-repo-scope>

# Database
STAGING_DATABASE_URL=<connection-string>
PRODUCTION_DATABASE_URL=<connection-string>
STAGING_DB_PASSWORD=<password>
PRODUCTION_DB_PASSWORD=<password>
PRODUCTION_DB_HOST=<hostname>
```

#### Vercel Deployment
```bash
VERCEL_TOKEN=<oauth-token>
VERCEL_ORG_ID=<team-id>
VERCEL_PROJECT_ID=<project-id>
```

#### Netlify Deployment (Alternative)
```bash
NETLIFY_AUTH_TOKEN=<oauth-token>
NETLIFY_SITE_ID=<site-id>
```

#### Docker Deployment (Alternative)
```bash
DEPLOY_HOST=<server-ip>
DEPLOY_USER=<ssh-user>
DEPLOY_SSH_KEY=<private-key>
```

#### Mobile App Signing
```bash
# Android
ANDROID_KEYSTORE_BASE64=<base64-encoded-keystore>
ANDROID_KEYSTORE_PASSWORD=<password>
ANDROID_KEY_ALIAS=<alias>
ANDROID_KEY_PASSWORD=<password>

# Apple
IOS_DIST_P12_BASE64=<base64-encoded-p12>
IOS_DIST_PASSWORD=<password>
IOS_PROVISION_PROFILE_BASE64=<base64-encoded-profile>
APPLE_ID=<apple-id-email>
APPLE_APP_SPECIFIC_PASSWORD=<app-specific-password>
APPLE_TEAM_ID=<team-id>
EXPO_TOKEN=<expo-account-token>
```

#### Notification Channels
```bash
SLACK_WEBHOOK_URL=<webhook-url>
SMTP_HOST=<smtp-server>
SMTP_USER=<username>
SMTP_PASSWORD=<password>
```

---

## Deployment Procedures

### Standard Deployment Flow

```
develop branch ──→ Staging (auto) ──→ Validation ──→ main branch ──→ Production (manual approval)
```

### Deploying to Staging

**Automatic:** Any push to `develop` triggers staging deployment.

**Manual:**
```bash
gh workflow run ci-cd.yml -f environment=staging
```

### Deploying to Production

**Option 1: Merge to Main**
```bash
# 1. Ensure develop is stable
gh pr create --title "Release v1.x.x" --body "Production release" --base main

# 2. After merge, production deploys automatically
# OR manually trigger:
gh workflow run ci-cd.yml -f environment=production
```

**Option 2: Manual Dispatch**
1. Go to Actions → CI/CD Pipeline
2. Click "Run workflow"
3. Select `production`
4. Click "Run workflow"

### Rollback Procedure

**Vercel:**
```bash
# List recent deployments
vercel ls <project-name>

# Rollback to specific deployment
vercel rollback <deployment-url>
```

**Docker:**
```bash
ssh deploy@server "cd /opt/algeriatrade && docker compose down && docker compose up -d --scale app=0 && docker compose up -d"
```

**Database:**
```bash
# Emergency rollback
gh workflow run database-migration.yml \
  -f environment=production \
  -f rollback=true
```

---

## Troubleshooting

### Common Issues

#### 1. Workflow Not Triggering
**Check:**
- Branch filters match your branch
- Path filters (if configured)
- Workflow file is valid YAML
- No syntax errors in `on:` section

#### 2. Permission Errors
**Solution:**
```yaml
# Ensure these permissions are set in workflow
permissions:
  contents: read
  pull-requests: write
  issues: write
  packages: write
```

#### 3. Secret Not Found
**Check:**
- Secret name matches exactly (case-sensitive)
- Secret is set at correct level (repo/org/env)
- No trailing whitespace in secret value

#### 4. Rate Limiting
**Symptoms:** `API rate limit exceeded` errors

**Solution:**
- Use `GITHUB_TOKEN` instead of PAT where possible
- Cache dependencies aggressively
- Minimize API calls in scripts

#### 5. Flaky Tests
**Solution:**
```yaml
# Add retries in vitest.config.ts
test: {
  retry: 2,
  testTimeout: 10000
}
```

### Debug Mode

Enable debug logging:
```bash
# Run workflow with debug
ACTIONS_STEP_DEBUG=true ACTIONS_RUNNER_DEBUG=true gh workflow run ci-cd.yml
```

View detailed logs:
1. Go to the failed workflow run
2. Click on the failed job
3. Expand the step showing error
4. Click "Create issue with details" for automatic bug report

### Getting Help

1. Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
2. Review workflow logs for specific errors
3. Open an issue with template:
   ```markdown
   ## Bug Report
   
   **Workflow:** <workflow-name>
   **Run ID:** <run-id>
   **Error Message:** 
   ```
   
   **Steps to Reproduce:**
   1.
   2.
   
   **Expected Behavior:**
   
   **Actual Behavior:**
   
   **Logs:**
   <details>
   <summary>Click to expand</summary>
   
   ```
   Paste relevant log output here
   ```
   </details>
   ```

---

## Best Practices

### 1. Keep Workflows Fast
- Use caching liberally
- Run jobs in parallel when possible
- Fail fast with early validation

### 2. Secure Your Secrets
- Rotate secrets regularly
- Use minimal permission scopes
- Never commit secrets to repo

### 3. Monitor Everything
- Set up Slack/email notifications
- Review security scan results weekly
- Track deployment success rates

### 4. Document Changes
- Update this guide when modifying workflows
- Comment complex logic in YAML
- Maintain CHANGELOG.md for pipeline changes

---

*Last updated: $(date +%Y-%m-%d)*
*Version: 1.0.0*
