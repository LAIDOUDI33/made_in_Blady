# Pre-Launch Checklist

**ERP Integration Pilot Program - AlgeriaTrade.dz**

Use this checklist to ensure all prerequisites are met before beginning the ERP integration setup.

---

## Document Information

| Property | Value |
|----------|-------|
| **Checklist ID** | CHECKLIST-PRELAUNCH-001 |
| **Version** | 1.0 |
| **Target Audience** | IT Administrators, ERP Specialists |
| **Estimated Time to Complete** | 2-4 hours |

---

## Instructions

1. Review each section carefully
2. Mark items as complete (✅) or not applicable (⏭️)
3. Note any issues or blockers in the Comments column
4. Have your ERP Specialist review before proceeding

---

## Section 1: Administrative Preparation

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 1.1 | Identify pilot program stakeholders | ☐ | | | |
| 1.2 | Assign project lead/owner | ☐ | | | |
| 1.3 | Schedule kickoff call with AlgeriaTrade.dz | ☐ | | | |
| 1.4 | Obtain seller dashboard access credentials | ☐ | | | |
| 1.5 | Create dedicated integration user account | ☐ | | | |
| 1.6 | Review and sign pilot program agreement | ☐ | | | |

---

## Section 2: ERP System Assessment

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 2.1 | Document ERP system name and version | ☐ | | | |
| 2.2 | Confirm ERP is on supported version list | ☐ | | | |
| 2.2a | [SAP] Verify S/4HANA 2020+ or Business One 10.x | ☐ | | | |
| 2.2b | [Odoo] Confirm Odoo 16.0 or 17.0 installed | ☐ | | | |
| 2.2c | [Dynamics] Verify D365 Finance & Operations | ☐ | | | |
| 2.2d | [REST] Document API endpoints available | ☐ | | | |
| 2.3 | Check current ERP patch/update level | ☐ | | | |
| 2.4 | Verify API services are enabled in ERP | ☐ | | | |
| 2.5 | Document number of products to sync | ☐ | | | |
| 2.6 | Document number of active warehouses | ☐ | | | |
| 2.7 | Assess average daily order volume | ☐ | | | |

---

## Section 3: Access & Credentials

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 3.1 | Create service account for integration (recommended) | ☐ | | | |
| 3.2 | Assign appropriate permissions to service account | ☐ | | | |
| 3.3a | [SAP] Generate OAuth2 client credentials | ☐ | | | |
| 3.3b | [Odoo] Generate API key from User Settings | ☐ | | | |
| 3.3c | [Dynamics] Register Azure AD application | ☐ | | | |
| 3.3d | [REST] Prepare authentication credentials | ☐ | | | |
| 3.4 | Test credentials work for API access | ☐ | | | |
| 3.5 | Document credential rotation schedule | ☐ | | | |
| 3.6 | Store credentials securely (no plaintext) | ☐ | | | |

---

## Section 4: Network & Infrastructure

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 4.1 | Verify outbound HTTPS (port 443) is allowed | ☐ | | | |
| 4.2 | Confirm DNS can resolve api.algeriatrade.dz | ☐ | | | |
| 4.3 | Test connectivity to api.algeriatrade.dz:443 | ☐ | | | |
| 4.4 | Whitelist AlgeriaTrade.dz IP addresses | ☐ | | | |
| 4.5 | Configure firewall rules (if required) | ☐ | | | |
| 4.6a | [Webhooks] Open inbound port for webhooks | ☐ | | | |
| 4.6b | [Webhooks] Ensure public HTTPS endpoint available | ☐ | | | |
| 4.7 | Document network architecture diagram | ☐ | | | |
| 4.8 | Involve network/security team for approval | ☐ | | | |

---

## Section 5: Data Preparation

### 5.1 Product Data Quality

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 5.1.1 | Export product master data from ERP | ☐ | | | |
| 5.1.2 | Review data for completeness | ☐ | | | |
| 5.1.3 | Identify products with missing required fields | ☐ | | | |
| 5.1.4 | Fix products missing SKU/article number | ☐ | | | |
| 5.1.5 | Fix products missing name/title | ☐ | | | |
| 5.1.6 | Fix products missing price | ☐ | | | |
| 5.1.7 | Fix products with invalid prices (negative, zero) | ☐ | | | |
| 5.1.8 | Standardize units of measure across products | ☐ | | | |
| 5.1.9 | Remove duplicate SKUs | ☐ | | | |
| 5.1.10 | Clean up special characters in names/descriptions | ☐ | | | |

### 5.2 Category Mapping

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 5.2.1 | Request AlgeriaTaxonomy export from support | ☐ | | | |
| 5.2.2 | Map internal categories to taxonomy IDs | ☐ | | | |
| 5.2.3 | Handle unmapped categories (plan B) | ☐ | | | |
| 5.2.4 | Validate mapping covers all active products | ☐ | | | |

### 5.3 Inventory Data

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 5.3.1 | Export inventory/stock data from ERP | ☐ | | | |
| 5.3.2 | Verify stock quantities are accurate | ☐ | | | |
| 5.3.3 | Confirm warehouse/location codes documented | ☐ | | | |
| 5.3.4 | Decide which warehouses to sync | ☐ | | | |
| 5.3.5 | Plan handling of negative stock (if applicable) | ☐ | | | |

---

## Section 6: Technical Resources

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 6.1 | Assign technical lead for integration | ☐ | | | |
| 6.2 | Identify backup technical contact | ☐ | | | |
| 6.3 | Allocate time for testing (Days 10-12) | ☐ | | | |
| 6.4 | Prepare test environment or plan production use | ☐ | | | |
| 6.5 | Create test buyer account on AlgeriaTrade.dz | ☐ | | | |
| 6.6 | Set up monitoring/alerting contacts | ☐ | | | |
| 6.7 | Establish communication channel with support | ☐ | | | |

---

## Section 7: Documentation & Planning

| # | Task | Status | Owner | Due Date | Comments |
|---|------|--------|-------|----------|----------|
| 7.1 | Read PILOT-GUIDE.md completely | ☐ | | | |
| 7.2 | Read TECHNICAL-REFERENCE.md completely | ☐ | | | |
| 7.3 | Review sample configurations relevant to your ERP | ☐ | | | |
| 7.4 | Document internal go-live criteria | ☐ | | | |
| 7.5 | Define rollback procedure | ☐ | | | |
| 7.6 | Schedule daily standups during onboarding period | ☐ | | | |
| 7.7 | Plan training for operations team | ☐ | | | |

---

## Section 8: Risk Assessment

| # | Risk Item | Likelihood | Impact | Mitigation | Status |
|---|-----------|------------|--------|------------|--------|
| 8.1 | Network/firewall blocks API access | Medium | High | Pre-test, involve IT early | ☐ |
| 8.2 | Data quality issues cause sync failures | Medium | Medium | Clean data before starting | ☐ |
| 8.3 | Credential expiry during pilot | Low | High | Use service account, document rotation | ☐ |
| 8.4 | ERP performance degradation under load | Low | Medium | Schedule heavy syncs off-peak | ☐ |
| 8.5 | Key person unavailable during onboarding | Medium | Medium | Cross-train team members | ☐ |
| 8.6 | Scope creep (too many products initially) | Medium | Low | Start with subset, expand later | ☐ |

---

## Sign-Off

Before proceeding to Phase 2 (Connection Setup), obtain sign-off:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Lead | | | |
| IT/Technical Lead | | | |
| Business Stakeholder | | | |
| AlgeriaTrade.dz ERP Specialist | | | |

---

## Notes & Additional Items

```
[Space for additional notes, concerns, or action items]

_______________________________________________
_______________________________________________
_______________________________________________
```

---

*Checklist Version 1.0 | Last Updated: January 2025*
