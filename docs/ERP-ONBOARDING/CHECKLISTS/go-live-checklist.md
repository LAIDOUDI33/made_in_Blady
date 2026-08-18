# Go-Live Checklist

**ERP Integration Pilot Program - AlgeriaTrade.dz**

Use this checklist to ensure a successful transition to production mode on Day 14.

---

## Document Information

| Property | Value |
|----------|-------|
| **Checklist ID** | CHECKLIST-GOLIVE-001 |
| **Version** | 1.0 |
| **Target Audience** | Project Leads, Operations Managers |
| **Prerequisite** | Pre-Launch Checklist completed |

---

## Pre-Requisites

⚠️ **Do not proceed with go-live until:**

- [ ] All testing phases (Phase 5) completed successfully
- [ ] Sync success rate >99% over 48-hour test period
- [ ] All critical and high-priority issues resolved
- [ ] Stakeholder sign-off obtained
- [ ] Rollback plan documented and tested

---

## Section 1: Technical Validation

### 1.1 Connection Health

| # | Task | Status | Verified By | Date | Evidence/Notes |
|---|------|--------|-------------|------|----------------|
| 1.1.1 | Connection to ERP stable for 48+ hours | ☐ | | | Uptime logs |
| 1.1.2 | No authentication failures in last 24 hours | ☐ | | | Auth logs |
| 1.1.3 | Latency within acceptable range (<500ms) | ☐ | | | Performance metrics |
| 1.1.4 | Automatic token refresh working (if OAuth) | ☐ | | | Token logs |
| 1.1.5 | Backup connection method documented | ☐ | | | Runbook section |

### 1.2 Synchronization Results

| # | Task | Target | Actual | Status | Notes |
|---|------|--------|--------|--------|-------|
| 1.2.1 | Full sync success rate | >99% | ___% | ☐ | |
| 1.2.2 | Incremental sync success rate | >99.5% | ___% | ☐ | |
| 1.2.3 | Products synced correctly | 100% match | ___% | ☐ | Sample verified |
| 1.2.4 | Inventory accuracy | ±0 variance | ___ | ☐ | |
| 1.2.5 | Order sync latency | <15 min avg | ___ min | ☐ | |
| 1.2.6 | Error rate (last 24h) | <0.5% | ___% | ☐ | |

### 1.3 Data Integrity Verification

| # | Verification Task | Status | Tester | Date | Result |
|---|-------------------|--------|--------|------|--------|
| 1.3.1 | Product names match between systems | ☐ | | | Pass/Fail |
| 1.3.2 | Prices display correctly (DZD format) | ☐ | | | Pass/Fail |
| 1.3.3 | Stock quantities accurate | ☐ | | | Pass/Fail |
| 1.3.4 | Categories assigned correctly | ☐ | | | Pass/Fail |
| 1.3.5 | Product images loading properly | ☐ | | | Pass/Fail |
| 1.3.6 | Arabic text displays correctly (if applicable) | ☐ | | | Pass/Fail |
| 1.3.7 | Special characters preserved | ☐ | | | Pass/Fail |

---

## Section 2: Order Flow Testing

### 2.1 End-to-End Order Scenarios

| # | Test Scenario | Expected Result | Actual Result | Status | Issue ID (if any) |
|---|--------------|-----------------|---------------|--------|-------------------|
| 2.1.1 | Create order → appears in ERP | Order in ERP <15min | | ☐ | |
| 2.1.2 | Confirm order in ERP → status updates | Status = confirmed | | ☐ | |
| 2.1.3 | Ship order → tracking syncs back | Tracking visible | | ☐ | |
| 2.1.4 | Cancel order → both systems updated | Status = cancelled | | ☐ | |
| 2.1.5 | Partial refund → amounts correct | Refund processed | | ☐ | |
| 2.1.6 | Multi-item order → all lines present | Complete line items | | ☐ | |
| 2.1.7 | High-value order → extra validation | Flagged/reviewed | | ☐ | |

### 2.2 Inventory Update Scenarios

| # | Test Scenario | Expected Result | Actual Result | Status | Issue ID (if any) |
|---|--------------|-----------------|---------------|--------|-------------------|
| 2.2.1 | Stock decrease in ERP → updates marketplace | Quantity updated | | ☐ | |
| 2.2.2 | Stock increase in ERP → updates marketplace | Quantity updated | | ☐ | |
| 2.2.3 | Stock reaches zero → out of stock shown | OOS displayed | | ☐ | |
| 2.2.4 | New product added → appears in catalog | Product visible | | ☐ | |
| 2.2.5 | Product disabled → hidden from catalog | Not visible | | ☐ | |

---

## Section 3: Monitoring & Alerting Setup

### 3.1 Dashboard Configuration

| # | Task | Status | Configured By | Date |
|---|------|--------|---------------|------|
| 3.1.1 | Primary monitoring dashboard set up | ☐ | | |
| 3.1.2 | Key metrics widgets configured | ☐ | | |
| 3.1.3 | Custom views created for different teams | ☐ | | |
| 3.1.4 | Dashboard access granted to stakeholders | ☐ | | |

### 3.2 Alert Rules

| # | Alert Condition | Threshold | Notification | Status |
|---|-----------------|-----------|--------------|--------|
| 3.2.1 | Sync failure | Any failure | Email + SMS | ☐ |
| 3.2.2 | High error rate | >5% failures | Email | ☐ |
| 3.2.3 | Authentication failure | Any auth error | Email + SMS | ☐ |
| 3.2.4 | Data anomaly | Volume ±50% | Email | ☐ |
| 3.2.5 | Stalled sync | No sync >2x interval | Email | ☐ |
| 3.2.6 | Token expiry warning | 7 days before | Email | ☐ |

### 3.3 Alert Recipients

| Alert Level | Primary Contact | Secondary Contact | Escalation |
|-------------|-----------------|-------------------|------------|
| P1 - Critical | | | CTO On-Call |
| P2 - High | | | IT Manager |
| P3 - Medium | | | Ops Team |
| P4 - Low | | | Daily Digest |

---

## Section 4: Operational Readiness

### 4.1 Team Training

| # | Task | Trainees | Trainer | Date Completed |
|---|------|----------|---------|----------------|
| 4.1.1 | Dashboard monitoring training | | | |
| 4.1.2 | Error log interpretation | | | |
| 4.1.3 | Manual sync trigger procedure | | | |
| 4.1.4 | Basic troubleshooting steps | | | |
| 4.1.5 | Escalation contact process | | | |
| 4.1.6 | Support ticket creation | | | |

### 4.2 Documentation Handoff

| # | Document | Location | Owner | Last Updated |
|---|----------|----------|-------|--------------|
| 4.2.1 | Integration runbook | | | |
| 4.2.2 | Credential storage location | | | |
| 4.2.3 | Network diagram | | | |
| 4.2.4 | Contact list (internal & support) | | | |
| 4.2.5 | Known issues/workarounds | | | |

### 4.3 Runbook Procedures Documented

| # | Procedure | Documented | Tested | Location |
|---|-----------|------------|--------|----------|
| 4.3.1 | How to trigger manual sync | ☐ | ☐ | |
| 4.3.2 | How to pause/resume sync | ☐ | ☐ | |
| 4.3.3 | How to handle sync failure | ☐ | ☐ | |
| 4.3.4 | How to update credentials | ☐ | ☐ | |
| 4.3.5 | Emergency rollback steps | ☐ | ☐ | |
| 4.3.6 | After-hours escalation | ☐ | ☐ | |

---

## Section 5: Business Readiness

### 5.1 Stakeholder Communication

| # | Task | Audience | Date Sent | Acknowledged |
|---|------|----------|-----------|--------------|
| 5.1.1 | Go-live announcement email | All stakeholders | | ☐ |
| 5.1.2 | Expected behavior changes | Operations team | | ☐ |
| 5.1.3 | Support contact information | Customer service | | ☐ |
| 5.1.4 | Success metrics & monitoring | Management | | ☐ |

### 5.2 Success Criteria Defined

| Metric | Target | Measurement Method | Owner |
|--------|--------|-------------------|-------|
| Sync success rate | >99% | Dashboard | |
| Order sync latency | <15 minutes | Log analysis | |
| Data accuracy | 100% | Spot checks | |
| System uptime | >99.9% | Monitoring | |
| Mean time to recovery | <30 min | Incident logs | |

### 5.3 Post Go-Live Support Plan

| Time Period | Support Coverage | Activities |
|-------------|------------------|------------|
| Day 1 (Go-live) | Extended (8AM-10PM) | Real-time monitoring, immediate response |
| Days 2-7 | Business hours + on-call | Daily health checks, issue resolution |
| Week 3-4 | Standard business hours | Weekly reviews, optimization |
| Ongoing | Standard SLAs | Monthly reviews, quarterly audits |

---

## Section 6: Security & Compliance

| # | Task | Status | Verified By | Date |
|---|------|--------|-------------|------|
| 6.1 | Production credentials separate from test | ☐ | | |
| 6.2 | No hardcoded secrets in configs | ☐ | | |
| 6.3 | Access control lists reviewed | ☐ | | |
| 6.4 | Audit logging enabled | ☐ | | |
| 6.5 | IP allowlists configured (if applicable) | ☐ | | |
| 6.6 | TLS certificates valid | ☐ | | |
| 6.7 | Webhook signatures verified | ☐ | | |
| 6.8 | Data retention policy confirmed | ☐ | | |

---

## Section 7: Final Checks Before Toggle

### ⚠️ COMPLETE THESE IMMEDIATELY BEFORE GO-LIVE

| # | Final Check | Status | Time |
|---|------------|--------|------|
| 7.1 | No active sync jobs running | ☐ | :__ |
| 7.2 | All test orders cancelled/cleaned up | ☐ | :__ |
| 7.3 | Test products removed or marked as test | ☐ | :__ |
| 7.4 | Schedule changed from test to production frequency | ☐ | :__ |
| 7.5 | Conflict resolution strategy confirmed | ☐ | :__ |
| 7.6 | All team members notified of go-live time | ☐ | :__ |
| 7.7 | Support team on standby | ☐ | :__ |
| 7.8 | Rollback procedure reviewed and ready | ☐ | :__ |

---

## Go-Live Execution

### Execution Checklist

| Step | Action | Performed By | Time | Status |
|------|--------|--------------|------|--------|
| 1 | Announce go-live window starting | | | ☐ |
| 2 | Verify no blocking issues in queue | | | ☐ |
| 3 | Switch toggle from Test → Production | | | ☐ |
| 4 | Confirm dashboard shows "Production - Active" | | | ☐ |
| 5 | Monitor first sync cycle completes successfully | | | ☐ |
| 6 | Verify first order flows correctly (if any) | | | ☐ |
| 7 | Confirm alerts working (test alert) | | | ☐ |
| 8 | Announce go-live complete | | | ☐ |
| 9 | Begin post-go-live monitoring period | | | ☐ |

---

## Post Go-Live (First 24 Hours)

### Hour 0-2: Intensive Monitoring

- [ ] Sync cycles completing successfully
- [ ] No unexpected errors in logs
- [ ] Dashboard metrics within normal range
- [ ] Orders processing correctly (if any)
- [ ] Team on standby responding to any issues

### Hour 2-8: Active Monitoring

- [ ] Review sync success rate hourly
- [ ] Check for any data discrepancies
- [ ] Respond to any user-reported issues
- [ ] Document any observations

### Hour 8-24: Normalized Monitoring

- [ ] Transition to standard monitoring rhythm
- [ ] Compile first-day summary report
- [ ] Identify any optimization opportunities
- [ ] Plan Day 2 activities if needed

---

## Sign-Off

### Pre Go-Live Authorization

| Role | Name | Signature | Date | Approved? |
|------|------|-----------|------|-----------|
| Project Lead | | | | ☐ Yes / ☐ No |
| Technical Lead | | | | ☐ Yes / ☐ No |
| Operations Manager | | | | ☐ Yes / ☐ No |
| Business Sponsor | | | | ☐ Yes / ☐ No |

### Post Go-Live Confirmation

| Role | Name | Signature | Date | Confirmed? |
|------|------|-----------|------|------------|
| Executed By | | | | ☐ Yes |
| Monitored By | | | | ☐ Yes |
| Issues Found | None / List: ____________________ | | |

---

## Incident Log (During Go-Live)

| Time | Issue | Severity | Resolution | Resolved By |
|------|-------|----------|------------|-------------|
| | | | | |
| | | | | |
| | | | | |

---

*Checklist Version 1.0 | Last Updated: January 2025*
