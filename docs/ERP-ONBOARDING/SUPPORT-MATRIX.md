# Support Escalation Matrix

**ERP Integration Pilot Program - AlgeriaTrade.dz**

This document defines support levels, escalation paths, and contact information for ERP integration issues.

---

## Document Information

| Property | Value |
|----------|-------|
| **Document ID** | DOC-SUPPORT-MATRIX-001 |
| **Version** | 1.0 |
| **Effective Date** | January 2025 |
| **Review Cycle** | Quarterly |

---

## 1. Issue Severity Classification

### 1.1 Severity Levels

| Severity | Name | Definition | Example | Response Time | Resolution Target |
|----------|------|------------|---------|---------------|-------------------|
| **P1 - Critical** | Business Down | Complete integration failure affecting all operations | No sync for >2 hours, all orders stuck | 15 minutes | 4 hours |
| **P2 - High** | Major Impact | Significant functionality broken, workaround exists | Single entity type not syncing, high error rate | 1 hour | 8 hours |
| **P3 - Medium** | Limited Impact | Partial degradation, core functions work | Some products failing, intermittent errors | 4 hours | 24 hours |
| **P4 - Low** | Minor Issue | Cosmetic or convenience issue | Dashboard display issue, documentation request | 24 hours | 3-5 business days |
| **P5 - Enhancement** | Feature Request | New capability or improvement | Request for new connector, optimization | Acknowledge in 48 hours | Product roadmap |

### 1.2 Severity Decision Tree

```
IS THE INTEGRATION WORKING AT ALL?
│
├─ NO → Can you process ANY orders manually?
│        ├─ NO → P1 CRITICAL (Business Down)
│        └─ YES → Are >50% of operations affected?
│                 ├─ YES → P2 HIGH
│                 └─ NO → P3 MEDIUM
│
└─ YES → Is there a workaround available?
           ├─ NO → P2 HIGH
           └─ YES → How impactful is the issue?
                    ├─ Significant inconvenience → P3 MEDIUM
                    └─ Minor inconvenience → P4 LOW
```

---

## 2. Escalation Matrix by Issue Type

### 2.1 Primary Escalation Matrix

| Issue Category | Level 1 - First Response | Level 2 - Specialist | Level 3 - Management | Level 4 - Executive |
|---------------|-------------------------|---------------------|---------------------|-------------------|
| **Connection Issues** | | | | |
| Cannot connect to ERP | Support Team | ERP Specialist | Technical Lead | CTO |
| Authentication failures | Support Team | Security Team | CISO | CEO |
| Network/firewall issues | Support Team | DevOps/Infra | Infrastructure Lead | CTO |
| Certificate/TLS errors | Support Team | Security Team | CISO | - |
| | | | | |
| **Data Synchronization** | | | | |
| Products not syncing | Support Team | Data Engineer | Technical Lead | - |
| Inventory discrepancies | Support Team | Data Engineer | Operations Manager | - |
| Order sync failures | Support Team | ERP Specialist | Technical Lead | COO |
| Field mapping errors | Support Team | ERP Specialist | - | - |
| Data corruption | Support Team | Data Engineer | CTO | CEO |
| | | | | |
| **Performance Issues** | | | | |
| Slow sync performance | Support Team | DevOps | Infrastructure Lead | CTO |
| Timeout errors | Support Team | DevOps | Infrastructure Lead | - |
| High resource usage | Support Team | DevOps | Infrastructure Lead | - |
| Scalability concerns | Support Team | Architecture Team | CTO | - |
| | | | | |
| **Platform/Portal Issues** | | | | |
| Dashboard errors | Support Team | Frontend Team | Product Manager | - |
| Configuration bugs | Support Team | Backend Team | Tech Lead | - |
| Feature requests | Support Team | Product Manager | CPO | - |
| Documentation issues | Support Team | Docs Team | Product Manager | - |
| | | | | |
| **Security Incidents** | | | | |
| Unauthorized access | Security Team (L1) | CISO | CEO | Board |
| Data breach suspected | Security Team (L1) | CISO | CEO | Board + Authorities |
| Suspicious activity | Security Team (L1) | CISO | - | - |
| DDoS attack | DevOps/Security | CISO | CEO | - |

### 2.2 Contact Directory

#### AlgeriaTrade.dz Internal Contacts

| Role | Name | Email | Phone | Availability |
|------|------|-------|-------|--------------|
| **ERP Support Team** | - | erp-support@algeriatrade.dz | +213 XX XXX XXX | Mon-Fri 8AM-6PM CET |
| **Technical Support** | - | support@algeriatrade.dz | +213 XX XXX XXX | Mon-Fri 8AM-6PM CET |
| **Security Team** | - | security@algeriatrade.dz | +213 XX XXX XXX | 24/7 for P1/P2 |
| **DevOps/Infrastructure** | - | devops@algeriatrade.dz | - | Mon-Fri 9AM-7PM CET |
| **ERP Specialist (Pilot)** | [Assigned] | [email] | [phone] | Mon-Fri 8AM-8PM CET |
| **On-Call Engineer** | - | oncall@algeriatrade.dz | +213 XX XXX XXX | After hours (P1 only) |
| **Product Manager** | - | product@algeriatrade.dz | - | Business hours |
| | | | | |
| **Executive Escalation** | | | | |
| CTO | - | cto@algeriatrade.dz | - | Emergency only |
| CISO | - | ciso@algeriatrade.dz | - | Security incidents |
| COO | - | coo@algeriatrade.dz | - | Business critical |
| CEO | - | ceo@algeriatrade.dz | - | Board-level only |

#### Customer Internal Contacts (Template)

Complete with your organization's details:

| Role | Name | Email | Phone | Backup Contact |
|------|------|-------|-------|----------------|
| Project Owner | | | | |
| Technical Lead | | | | |
| IT Administrator | | | | |
| Operations Manager | | | | |
| Executive Sponsor | | | | |
| After-Hours Contact | | | | |

---

## 3. Escalation Procedures

### 3.1 Standard Escalation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ISSUE REPORTED                               │
│                         │                                        │
│                         ▼                                        │
│              ┌──────────────────┐                                │
│              │   LEVEL 1         │                                │
│              │   Support Team    │                                │
│              │   Target: 15min   │                                │
│              └────────┬─────────┘                                │
│                       │                                          │
│            ┌──────────┴──────────┐                              │
│            ▼                     ▼                               │
│      ┌──────────┐         ┌──────────┐                          │
│      │ RESOLVED │         │ ESCALATE? │                          │
│      └──────────┘         └────┬─────┘                          │
│                        Yes /     \ No                           │
│                         ▼       ▼                               │
│                ┌──────────────┐  Close Ticket                   │
│                │   LEVEL 2    │                                 │
│                │  Specialist  │                                 │
│                │  Target: 1hr │                                 │
│                └──────┬───────┘                                 │
│                       │                                         │
│              ┌────────┴────────┐                               │
│              ▼                ▼                                 │
│        ┌──────────┐    ┌──────────┐                            │
│        │ RESOLVED │    │ ESCALATE? │                            │
│        └──────────┘    └────┬─────┘                            │
│                       Yes /     \ No                           │
│                        ▼       ▼                               │
│               ┌────────────────┐  Close Ticket                  │
│               │   LEVEL 3      │                               │
│               │  Management    │                               │
│               │  Target: 4hr   │                               │
│               └───────┬────────┘                               │
│                       │                                        │
│              ┌────────┴────────┐                              │
│              ▼                ▼                                │
│        ┌──────────┐    ┌──────────┐                           │
│        │ RESOLVED │    │ ESCALATE? │                           │
│        └──────────┘    └────┬─────┘                           │
│                       Yes /     \ No                          │
│                        ▼       ▼                              │
│               ┌────────────────┐  Close Ticket                 │
│               │   LEVEL 4      │                              │
│               │   Executive    │                              │
│               │   Immediate    │                              │
│               └────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Automatic Escalation Triggers

Escalation occurs automatically when:

| Condition | Auto-Escalate To | Time Limit |
|-----------|------------------|------------|
| P1 ticket no response | Level 2 | 15 min |
| P1 ticket unresolved | Level 3 | 2 hours |
| P1 ticket unresolved | Level 4 | 4 hours |
| P2 ticket no response | Level 2 | 1 hour |
| P2 ticket unresolved | Level 3 | 8 hours |
| P3 ticket no response | Level 2 | 4 hours |
| Customer requests escalation | As requested | Immediate |
| Customer dissatisfaction detected | Level+1 | Immediate |

### 3.3 Escalation Communication Template

When escalating, include:

```markdown
## ESCALATION NOTICE

**Ticket ID:** [TICKET-XXX]
**Original Severity:** P[X]
**New Severity:** P[X]
**Escalating From:** [Name/Role]
**Escalating To:** [Name/Role]
**Date/Time:** [ISO format]

### Issue Summary:
[Brief description of the problem]

### Impact Assessment:
[Who is affected, what cannot be done]

### Steps Already Taken:
1. [Action taken]
2. [Action taken]
3. [Action taken]

### Current Status:
[Where things stand right now]

### Requested Action:
[What you need from the escalation target]

### Attachments:
- [Relevant logs]
- [Screenshots]
- [Error messages]

---
**Urgency:** Please acknowledge receipt within [X] minutes
```

---

## 4. SLA Definitions

### 4.1 Response Time SLAs

| Severity | Initial Response | Update Frequency | Max Hold Time |
|----------|------------------|-----------------|---------------|
| P1 - Critical | 15 minutes | Every 30 min | 1 hour |
| P2 - High | 1 hour | Every 2 hours | 4 hours |
| P3 - Medium | 4 hours | Every 8 hours | 24 hours |
| P4 - Low | 24 hours | Every 48 hours | 72 hours |
| P5 - Enhancement | 48 hours | Weekly | N/A |

### 4.2 Resolution Time SLAs

| Severity | Initial Resolution | Workaround Provided | Permanent Fix |
|----------|--------------------|--------------------|--------------|
| P1 - Critical | 4 hours | 1 hour | 24-48 hours |
| P2 - High | 8 hours | 4 hours | 3-5 days |
| P3 - Medium | 24 hours | 12 hours | 1-2 weeks |
| P4 - Low | 3-5 days | N/A | 2-4 weeks |
| P5 - Enhancement | Roadmap | N/A | Per roadmap |

### 4.3 SLA Exclusions

SLAs do not apply when:
- Customer fails to provide required information/access
- Issue caused by customer infrastructure (network, ERP downtime)
- Third-party dependencies (SAP cloud outage, etc.)
- Pre-production/test environments
- Feature requests or enhancements
- Customer-caused data issues requiring cleanup

---

## 5. Incident Management

### 5.1 Major Incident Criteria

Declare a Major Incident when:
- Multiple customers affected (>10% of pilot users)
- P1 issue lasting >2 hours
- Data loss or corruption suspected
- Security breach confirmed
- Revenue impact exceeds threshold

### 5.2 Major Incident Process

Upon declaring a Major Incident:

1. **Immediate (0-5 min)**
   - Assign Incident Commander
   - Open bridge line/conference call
   - Send initial notification to stakeholders

2. **Assessment (5-30 min)**
   - Gather all known information
   - Assess impact scope
   - Identify root cause hypothesis
   - Communicate status update

3. **Resolution (30 min - ongoing)**
   - Implement fix/workaround
   - Validate resolution
   - Communicate to affected parties
   - Monitor for recurrence

4. **Post-Incident (within 72 hours)**
   - Conduct post-mortem
   - Document lessons learned
   - Implement preventive measures
   - Update runbooks if needed

### 5.3 Status Page Updates

During major incidents, update status page every:

| Phase | Update Frequency |
|-------|-----------------|
| Initial | Every 15 minutes |
| Active Investigation | Every 30 minutes |
| Fix Identified | Every 30 minutes |
| Resolved | Final summary |

---

## 6. Communication Channels

### 6.1 Channel Usage Guide

| Channel | Purpose | Response Expectation |
|---------|---------|---------------------|
| Email (support@) | Non-urgent issues, documentation | 24 hours |
| Email (erp-support@) | ERP-specific questions | 4-8 hours |
| Portal Ticket System | All tracked issues | Per SLA |
| Phone (Emergency Line) | P1 issues only | Immediate |
| Slack/Teams Channel | Pilot program participants | 4 hours (business hours) |
| Video Call | Complex troubleshooting | Scheduled |

### 6.2 After-Hours Support

| Condition | Contact Method |
|-----------|---------------|
| P1 Critical Only | Emergency hotline: +213 XX XXX XXX |
| P2-P5 | Leave message / Submit ticket |
| Security Incident | security@algeriatrade.dz (monitored 24/7) |

### 6.3 Maintenance Windows

Scheduled maintenance may affect availability:

| Window | Frequency | Duration | Impact |
|--------|-----------|----------|--------|
| Sunday 02:00-04:00 CET | Weekly | Up to 2 hours | Possible sync delays |
| Monthly patching | Monthly | Up to 4 hours | Read-only mode possible |
| Emergency maintenance | As needed | Variable | Advance notice when possible |

---

## 7. Reporting & Metrics

### 7.1 Customer-Facing Reports Available

| Report | Frequency | Access |
|--------|-----------|--------|
| Sync Health Dashboard | Real-time | Seller Portal |
| Monthly Performance Report | Monthly | Emailed to admin |
| Quarterly Business Review | Quarterly | Meeting with account team |
| Custom Reports | On request | Contact support |

### 7.2 Key Metrics Tracked

| Metric | Description | Target |
|--------|-------------|--------|
| First Response Time | Time to initial reply | Per SLA |
| Mean Time to Resolve | Average resolution time | <24h (all tickets) |
| First Contact Resolution | % resolved at L1 | >60% |
| Customer Satisfaction (CSAT) | Post-ticket survey score | >4.5/5 |
| Escalation Rate | % tickets escalated | <15% |
| Repeat Issues | % same issue recurring | <5% |

---

## 8. Feedback & Improvement

### 8.1 Providing Feedback

We value your feedback on support quality:

| Method | When to Use | Contact |
|--------|-------------|---------|
| Post-Ticket Survey | After ticket closure | Automatic email |
| Compliment/Complaint | Anytime | feedback@algeriatrade.dz |
| Quarterly Review | Scheduled meeting | Account manager |
| Escalation Review | Within 48 hours of escalations | support@algeriatrade.dz |

### 8.2 Continuous Improvement Process

1. All P1/P2 incidents reviewed weekly
2. Trends analyzed monthly
3. Process updates quarterly
4. Full matrix review semi-annually

---

## Appendix A: Quick Reference Card

Print and post near your workstation:

```
╔═══════════════════════════════════════════════════════════════╗
║          ALGERIATRADE.DZ ERP SUPPORT QUICK REFERENCE          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📧 GENERAL SUPPORT:    support@algeriatrade.dz               ║
║  🔌 ERP SPECIALIST:     erp-support@algeriatrade.dz           ║
║  🔒 SECURITY:           security@algeriatrade.dz              ║
║                                                               ║
║  📞 EMERGENCY (P1 ONLY): +213 XX XXX XXX                      ║
║                                                               ║
║  SEVERITY LEVELS:                                              ║
║  🔴 P1 Critical → 15min response → 4hr resolve                ║
║  🟠 P2 High      → 1hr response   → 8hr resolve               ║
║  🟡 P3 Medium    → 4hr response   → 24hr resolve              ║
║  🟢 P4 Low       → 24hr response  → 3-5 day resolve           ║
║                                                               ║
║  PORTAL: seller.algeriatrade.dz/integrations/support          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

*Support Matrix Version 1.0 | Last Updated: January 2025*
