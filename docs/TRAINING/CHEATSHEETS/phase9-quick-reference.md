# Phase 9 Quick Reference Card
## AlgeriaTrade.dz - AI Analytics & Compliance Engine
### Fiche Mémo Rapide - Carte de Référence Phase 9

---

**Version:** 9.0.0 | **Langue:** Français / العربية | **Classification:** Interne - Référence Rapide
**الإصدار:** ٩.٠.٠ | **اللغة:** الفرنسية / العربية

---

## 📊 AI DASHBOARD NAVIGATION (تنقل لوحة القيادة الذكاء الاصطناعي)

### Keyboard Shortcuts (اختصارات لوحة المفاتيح)

| Action | Shortcut | الوصف |
|--------|----------|-------|
| **Change Period** | `Ctrl+P` | تغيير الفترة الزمنية |
| **Search** | `Ctrl+F` | بحث سريع |
| **Export Data** | `Ctrl+E` | تصدير البيانات |
| **Refresh Dashboard** | `Ctrl+R` | تحديث البيانات |
| **Settings** | `Ctrl+,` | الإعدادات |
| **Save View** | `Ctrl+S` | حفظ العرض الحالي |
| **Alerts Panel** | `Ctrl+A` | لوحة التنبيهات |
| **New Prediction** | `Alt+N` | تنبؤ جديد |
| **Share Report** | `Ctrl+Shift+L` | مشاركة التقرير |
| **Escalate Issue** | `Ctrl+Shift+E` | رفع المشكلة |

### Dashboard Layout Structure (هيكل لوحة القيادة)

```
┌─────────────────────────────────────────────────────────────────┐
│  PREDICTIVE DASHBOARD LAYOUT                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ROW 1] KPI Cards (4 cards):                                   │
│  ├── 💰 Revenue Forecast    (Prévision revenus)                │
│  ├── 📈 Demand Index        (Indice demande)                   │
│  ├── 📦 Orders Predicted    (Commandes prévues)                 │
│  └── 📉 Churn Risk          (Risque départ)                    │
│                                                                 │
│  [ROW 2] Main Chart + Scenarios                                │
│  ├── Trend line with confidence intervals                      │
│  └── Optimistic / Realistic / Conservative scenarios            │
│                                                                 │
│  [ROW 3] Detailed Analysis                                      │
│  ├── Demand by category breakdown                               │
│  └── Priority AI suggestions list                              │
│                                                                 │
│  [ROW 4] Action Items                                           │
│  ├── Pending pricing suggestions                               │
│  └── Churn alerts requiring action                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Navigation Menu Paths (مسارات قائمة التنقل)

| Feature | Path | المسار |
|---------|------|--------|
| **Predictive Dashboard** | Analytics > Predictive Dashboard | التحليلات > لوحة القيادة التنبؤية |
| **Demand Forecasts** | Analytics > Demand > Forecasts | التحليلات > الطلب > التنبؤات |
| **Price Optimization** | Analytics > Pricing > Optimize | التحليلات > الأسعار > التحسين |
| **Churn Monitor** | Analytics > Customers > Churn | التحليلات > العملاء > الفقدان |
| **Supplier Matching** | Marketplace > Match Suppliers | السوق > مطابقة الموردين |
| **RFQ Auto-Match** | RFQ > Auto-Match Settings | طلبات العروض > إعدادات المطابقة |
| **AI Admin Panel** | Admin > AI Management | الإدارة > إدارة الذكاء الاصطناعي |
| **Model Monitoring** | Admin > AI > Models | الإدارة > الذكاء الاصطناعي > النماذج |

---

## 🎯 KEY METRICS QUICK LOOKUP (جدول المؤشرات الرئيسية السريع)

### Confidence Score Interpretation (تفسير درجة الثقة)

```
CONFIDENCE SCORE BAR:

90-100% ████████████████████ ✅ HIGH TRUST - Use for critical decisions
75-89%  █████████████████░░░ ✅ GOOD - Plan with safety margin
60-74%  ██████████████░░░░░ ⚠️ MODERATE - Enhanced monitoring required
40-59%  ██████████░░░░░░░░ ❌ LOW - Manual validation mandatory
<40%     █████░░░░░░░░░░░░░ 🚫 UNRELIABLE - Do NOT use for planning
```

| Score Range | Trust Level | Recommended Action | Usage |
|-------------|-------------|-------------------|-------|
| **90-100%** | Très haute fiabilité | Planifier avec certitude | Budgets, contrats majeurs |
| **75-89%** | Bonne fiabilité | Planifier avec marge ±10% | Reporting, planification normale |
| **60-74%** | Fiabilité modérée | Surveillance renforcée | Décisions non-critiques |
| **40-59%** | Faible fiabilité | Validation manuelle requise | Information uniquement |
| **<40%** | Non fiable | Ne pas utiliser | Ignorer, attendre mise à jour |

### Demand Index Reference (مرجع مؤشر الطلب)

| Value | Meaning | Action |
|-------|---------|--------|
| **>120** | Demande très forte | Augmenter stock, activer suppliers backup |
| **100-119** | Au-dessus moyenne | Surveillance normale |
| **80-99** | En-dessous moyenne | Analyser causes, ajuster prévisions |
| **<80** | Demande faible | Réduire commandes, promos possibles |

*Base 100 = Moyenne historique 2024*

### Churn Risk Levels (مستويات خطر الفقدان)

| Level | Score | Color | Response Time | Action Required |
|-------|-------|-------|---------------|-----------------|
| 🔴 **Critique** | 80-100% | Red | < 24 hours | Call key account, special offer |
| 🟠 **Élevé** | 60-79% | Orange | < 72 hours | Personalized email, survey |
| 🟡 **Modéré** | 40-59% | Yellow | Weekly | Targeted newsletter, new products |
| 🟢 **Faible** | 20-39% | Green | Monthly | Standard follow-up, satisfaction check |
| ⚪ **Minimal** | 0-19% | White | Quarterly | Relationship maintenance |

### Pricing Strategy Matrix (مصفوفة استراتيجيات التسعير)

| Situation | Strategy | Price Volatility | When to Use |
|-----------|----------|------------------|-------------|
| Exclusive product, low competition | Margin Maximization | High (±10%) | Premium brands, patents |
| New launch, high competition | Market Share | Low (±3%) | Product introduction |
| Standard, balanced market | Optimal Balance | Medium (±5%) | Default strategy |
| Commodity, price-driven | Competitive | Very low (±2%) | Standard materials |

### Supplier Matching Score Breakdown (تفصيل درجة مطابقة الموردين)

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Product Fit** | 30% | Category, specs, quality match |
| **Location** | 20% | Wilaya proximity, free zone status |
| **Capacity** | 15% | Available volume, delivery time |
| **Certification** | 15% | ISO, approvals, compliance status |
| **Price Competitiveness** | 10% | vs market median |
| **Performance History** | 10% | Reviews, delivery record, disputes |

```
MATCH SCORE INTERPRETATION:
90-100 █████████████████████ EXCELLENT - Priority #1 contact
75-89  ████████████████████░ GOOD - Highly recommended
60-74  █████████████████░░░░ ACCEPTABLE - Consider seriously
40-59  █████████████░░░░░░░ WEAK - Better alternatives exist
<40    █████████░░░░░░░░░░░ NOT RECOMMENDED - Avoid
```

---

## ⚖️ COMPLIANCE SCORE RANGES & ACTIONS (نطاقات درجات الامتثال والإجراءات)

### Global Compliance Score (درجة الامتثال العامة)

```
COMPLIANCE SCORE METER (0-100):

95-100 █████████████████████✅ EXCELLENT - Fast track processing
85-94  ████████████████████░✅ GOOD - Standard processing
75-84  █████████████████░░░⚠️ ACCEPTABLE - Minor review needed
60-74  ██████████████░░░░░🟡 MODERATE - Additional documentation
40-59  ██████████░░░░░░░░🟠 ELEVATED - Manager approval required
20-39  ██████░░░░░░░░░░░░🔴 HIGH RISK - Senior review + hold
<20    ████░░░░░░░░░░░░░🚫 CRITICAL - Block transaction
```

### Module-Specific Scores (الدرجات الخاصة بالوحدات)

| Module | Full Points | Deduction Triggers |
|--------|-------------|-------------------|
| **Commercial (Code Commerce)** | 25 pts | RC invalid (-25), expired docs (-10), wrong legal form (-15) |
| **Fiscal/TVA** | 25 pts | Wrong TVA rate (-20), missing NIF (-15), invoice errors (-10) |
| **Trade Compliance** | 20 pts | Missing license (-20), invalid COO (-15), sanction match (-20) |
| **Data Protection** | 15 pts | Missing consent (-10), data breach (-15), retention issue (-5) |
| **Sanctions Screening** | 15 points | Exact match (-15), high probability (-10), medium prob (-5) |

### Score-to-Action Mapping (خريطة الدرجة إلى الإجراء)

| Score Range | Processing | Approval | Hold? | Review By |
|-------------|------------|----------|-------|-----------|
| **90-100** | Automatic | None | No | System |
| **75-89** | Standard | Operator | No | Compliance Op |
| **60-74** | Delayed | Senior Op | Possible | Senior Compliance |
| **40-59** | Manual | Manager | Yes | Compliance Manager |
| **<40** | Blocked | Director | Mandatory | CLO/Director |

---

## ⏱️ RESPONSE SLAS BY SEVERITY LEVEL (أوقات الاستجابة حسب مستوى الخطورة)

### Violation Severity Levels (مستويات خطورة الانتهاكات)

| Severity | Color | Code | Definition | Examples |
|----------|-------|------|------------|----------|
| **P1 - Critical** | 🔴 Red | CRIT | Immediate threat | Sanctions exact match, data breach, fraud |
| **P2 - Major** | 🟠 Orange | MAJOR | Significant risk | Expired critical doc, TVA error >100K DZD |
| **P3 - Moderate** | 🟡 Yellow | MOD | Notable issue | Minor doc expiry, low-probability match |
| **P4 - Minor** | 🔵 Blue | MIN | Low impact | Typo in name, cosmetic issue |
| **P5 - Info** | ⚪ White | INFO | Informational | Suggestion for improvement |

### SLA Response Times (أوقات الاستجاجة SLA)

```
RESPONSE TIME MATRIX:

SEVERITY    ACKNOWLEDGE    INITIAL RESPONSE    RESOLUTION     ESCALATION
─────────────────────────────────────────────────────────────────────────
P1 CRITICAL   < 15 min       < 1 hour           < 4 hours      → CLO immediately
P2 MAJOR      < 30 min       < 4 hours          < 24 hours     → Compliance Dir.
P3 MODERATE   < 2 hours      < 24 hours         < 72 hours     → Senior Compliance
P4 MINOR      < 8 hours      < 48 hours         < 5 days       → Team Lead
P5 INFO       < 24 hours     < 72 hours         < 10 days      → As available
```

### Escalation Triggers (محفزات التصعيد)

| Trigger Condition | Escalate To | Timeline |
|-------------------|-------------|----------|
| No response after initial SLA | Next level up | At SLA + 50% |
| Customer complaint received | Manager immediately | Instant |
| Regulatory inquiry | Legal/CLO immediately | Instant |
| Financial exposure > 10M DZD | Director + Finance | Within 1 hour |
| Media/potential PR issue | Communications + CLO | Within 30 min |
| Repeat violation same entity | Compliance Manager | After 2nd occurrence |

---

## 📞 EMERGENCY CONTACTS MATRIX (مصفوفة جهات الاتصال الطارئة)

### Internal Contacts (جهات الاتصال الداخلية)

| Role | Name/Team | Contact | Availability | For |
|------|-----------|---------|--------------|-----|
| **CLO (Chief Legal Officer)** | Legal Department | clo@algeriatrade.dz | 24/7 | Critical legal issues |
| **Compliance Director** | Compliance Team | compliance-dir@algeriatrade.dz | Business hours | Policy decisions |
| **Senior Compliance** | Compliance Ops | senior-compliance@algeriatrade.dz | Business hours | Complex cases |
| **DPO** | Privacy Team | dpo@algeriatrade.dz | Business hours | Data protection issues |
| **Security Officer** | IT Security | security@algeriatrade.dz | 24/7 | Security incidents |
| **On-Call Engineer** | Platform Ops | oncall@algeriatrade.dz | 24/7 | Technical issues |
| **AI/ML Team** | Data Science | ai-team@algeriatrade.dz | Business hours | Model issues |

### External Contacts (جهات الاتصال الخارجية)

| Organization | Purpose | Contact | Notes |
|--------------|---------|---------|-------|
| **ANPD** (Autorité Nationale Protection Données) | Data protection authority | anpd.gouv.dz | Breach notification within 72h |
| **DGI** (Direction Générale Impôts) | Tax authority inquiries | dgf.gov.dz | TVA questions |
| **CNRC** (Centre National Registre Commerce) | RC verification | cnrc.dz | Company registration checks |
| **Douanes Algériennes** | Import/export questions | douane.gov.dz | Trade compliance |
| **Conseil de la Concurrence** | Competition law | concurrence.dz | Anti-trust matters |
| **APN** (Assemblée Populaire Nationale) | Legislative references | apn.dz | Law text verification |

### Emergency Escalation Tree (شجرة التصعيد الطارئ)

```
EMERGENCY ESCALATION FLOW:

┌─────────────────────────────────────────────────────────────┐
│                     ISSUE DETECTED                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Can you resolve alone? │
              └────────────┬───────────┘
                    │       │
               YES  │       │  NO
                    ▼       ▼
           ┌──────────┐  ┌──────────────────┐
           │ RESOLVE  │  │ Check severity:   │
           │ & LOG    │  │                  │
           └──────────┘  │ P1/P2 → Immediate │
                          │ P3/P4 → Queue    │
                          │ P5 → Log only    │
                          └────────┬─────────┘
                                   ▼
                    ┌────────────────────────┐
                    │ Contact per matrix above│
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
                    │ No response in SLA?    │──→ ESCALATE UP
                    └────────────────────────┘
```

---

## 🔧 COMMON TROUBLESHOOTING FIXES (إصلاحات استكشاف الأخطاء الشائعة)

### AI Analytics Issues (مشكلات تحليلات الذكاء الاصطناعي)

| Problem | Symptom | Cause | Solution |
|---------|---------|-------|----------|
| **Predictions not loading** | Infinite spinner | Network/API issue | Refresh page (F5), check connection, clear cache |
| **Confidence score seems wrong** | Unexpected value | Data staleness | Verify last update timestamp, check drift alerts |
| **Price suggestion extreme** | >15% change suggested | Outlier in input data | Do NOT auto-apply; review manually first |
| **Match scores inconsistent** | Same supplier varies | Profile not updated | Request supplier profile refresh |
| **Dashboard very slow** | Loading > 10 sec | Large date range selected | Reduce range to 3 months max |
| **Alerts not triggering** | Expected alerts missing | Notification settings off | Check user preferences, browser permissions |
| **Export fails** | Download error/crash | Too much data | Try PDF instead of Excel; reduce export scope |
| **Churn alert false positive** | Healthy client flagged | Recent behavior change | Review signals; can dismiss with reason |
| **Forecast way off** | Prediction unrealistic | Market event not modeled | Flag to AI team; use manual override |
| **Model unavailable** | Error message displayed | Maintenance/retraining | Switch to backup mode; notify users |

### Compliance Issues (مشكلات الامتثال)

| Problem | Symptom | Cause | Solution |
|---------|---------|-------|----------|
| **RC verification fails** | "Invalid RC" message | Wrong format/expired | Verify number format (XXBNNNNNNN); request fresh extract |
| **TVA calculation error** | Wrong tax amount | Category misclassified | Check product category assignment |
| **Sanctions false positive** | Legitimate entity blocked | Name similarity | Collect DOB/address proof; document decision |
| **Document upload fails** | Error on upload | File too large/wrong type | Max 10MB; PDF/JPG/PNG only |
| **Score not updating** | Old score displayed | Cache issue | Hard refresh (Ctrl+F5); wait 5 min |
| **Missing checklist item** | Can't proceed | Document not uploaded | Upload required doc; verify readability |
| **Compliance hold stuck** | Transaction blocked | Pending manager action | Follow up with assigned approver |
| **Audit trail gap** | Missing log entries | System issue | Report to IT; manual notation possible |
| **Consent not recorded** | Privacy module alert | User skipped step | Request consent capture retroactively |
| **Export license query** | Unknown requirement | Product classification | Contact trade compliance team |

### Quick Fix Commands (أوامر الإصلاح السريعة)

```bash
# Browser-level fixes (try in order):
1. Hard Refresh:        Ctrl + Shift + R  (or Cmd + Shift + R)
2. Clear Cache:         Ctrl + Shift + Delete → Clear
3. Disable Extensions:  Test in Incognito mode
4. Check Console:       F12 → Console tab for errors
5. Reset View:          URL parameter ?reset=true

# Account-level fixes:
6. Re-login:            Logout → Clear cookies → Login again
7. Check Permissions:   Settings > My Access > Verify roles
8. Sync Profile:        Profile > Force Sync (admin function)
```

---

## 📅 ALGERIAN SEASONALITY QUICK REFERENCE (مرجع سريع للموسمية الجزائرية)

### Key Dates Impact Table (جدول تأثير التواريخ الرئيسية)

| Date Range | Event | Demand Impact | Affected Categories | Action |
|------------|-------|---------------|---------------------|--------|
| **Variable** | Ramadan | Day -30% / Night +40% | Food, textile, electronics | Night campaigns, extend SLAs |
| **Ramadan +10d** | Aïd El-Fitr | +200% week before | Clothing, food, gifts | Stock up 2 weeks prior |
| **Dhu al-Hijjah 10** | Aïd El-Adha | +150% week before | Livestock, food, clothes | Pre-order livestock early |
| **1 Muharram** | New Hijri Year | Moderate +10% | All sectors | Light promotion |
| **November 1** | Revolution Day | -50% (holiday) | B2B services | Pause campaigns day-of |
| **July-August** | Summer Vacation | -40% B2B | Industry, services | Reduce inventory targets |
| **September** | Back to School | +60% | Supplies, equipment | Launch promotions August |
| **December** | Year-End | +30% | All categories | Clearance + stock buildup |

### Seasonality Coefficients (المعاملات الموسمية)

```
MONTHLY COEFFICIENTS (applied automatically):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
January:    0.85  ████░░░░░░ Post-holidays slowdown
February:   0.90  █████░░░░░ Pre-Ramadan (if applicable)
March:      1.05  ███████░░░░ Construction season starts
April:      1.15  █████████░░ Spring peak, agriculture
May:        1.20  ██████████░ Full economic activity
June:       1.10  ████████░░░ Pre-vacation period
July:       0.70  █████░░░░░░ Summer vacation
August:      0.65  ████░░░░░░ Main holidays
September:  1.25  ███████████ Strong return
October:     1.15  █████████░░ High activity
November:    0.95  ██████░░░░░ Nov 1st holiday
December:    1.30  ██████████░ Year-end preparation
```

---

## 📋 DOCUMENT VALIDITY PERIODS (فترات صلاحية المستندات)

### Maximum Accepted Age (الحد الأقصى لعمر المستند المقبول)

| Document Type | Max Age | Renewal Notice | Source |
|---------------|---------|---------------|--------|
| **Registre du Commerce (RC) extract** | 30 days | Alert at 25 days | CNRC |
| **Attestation fiscale NIF/NIS/AI** | Per printed date | 30 days before expiry | DGI |
| **Statuts (Articles of Association)** | Current version | On any change | Notary |
| **PV Assemblée Générale** | 12 months | Before next AG | Company records |
| **CNI Passeport (ID)** | Per validity | 6 months before expiry | ANI |
| **Commercial Lease** | Current year | 2 months before expiry | Landlord |
| **Insurance Certificate** | Current year | 30 days before expiry | Insurer |
| **Import License** | Per licence terms | 90 days before expiry | Ministry |
| **Quality Certificates (ISO)** | Per certificate | 6 months before expiry | Certifying body |
| **Sanctions Screen Result** | 24 hours (P1) | Real-time monitoring | OFAC/EU/UN |

### Document Expiry Workflow (سير عمل انتهاء صلاحية المستند)

```
DOCUMENT EXPIRY WORKFLOW:

T-30 Days  ──→ Auto-alert to entity + account manager
T-14 Days  ──→ Reminder email + phone call
T-7 Days   ───→ Urgent notice + temporary restrictions
T-0 Day    ───→ Document EXPIRED → transactions blocked
             ↓
Post-Expiry → Grace period: 7 days (manager approval only)
             ↓
T+7 Days    ──→ HARD BLOCK - no exceptions without CLO approval
```

---

## 🔄 DAILY/WEEKLY CHECKLISTS (قوائم يومية/أسبوعية)

### Daily Operations Checklist (قائمة العمليات اليومية)

```
☐ DAILY AI ANALYTICS CHECK:
  ☐ Dashboard loads correctly (all widgets visible)
  ☐ Review overnight alerts (if any notifications)
  ☐ Check for critical prediction failures
  ☐ Scan churn alerts requiring action today
  ☐ Review pending pricing suggestions
  ☐ Verify model health indicators green
  ☐ Process escalated items from yesterday
  ☐ Note anomalies for weekly review meeting

☐ DAILY COMPLIANCE CHECK:
  ☐ Review new compliance alerts queue
  ☐ Process P1/P2 items within SLA
  ☐ Check document expirations due today
  ☐ Verify sanctions screening completed for new entities
  ☐ Log all decisions with proper rationale
  ☐ Update case statuses before EOD
```

### Weekly Admin Checklist (قائمة الإدارة الأسبوعية)

```
☐ WEEKLY AI ADMIN CHECK:
  ☐ Review model performance metrics vs targets
  ☐ Check retraining completion status
  ☐ Analyze failure rates and patterns
  ☐ Review user feedback on AI suggestions
  ☐ Audit system access logs
  ☐ Update documentation if needed
  ☐ Prepare weekly compliance summary report
  ☐ Test one prediction scenario manually

☐ WEEKLY COMPLIANCE ADMIN CHECK:
  ☐ Review all escalation cases this week
  ☐ Audit sample of P3/P4 resolutions
  ☐ Check regulatory updates (ANPD, DGI, etc.)
  ☐ Update sanctions lists verification
  ☐ Review training/compliance gaps
  ☐ Prepare metrics report for management
  ☐ Archive resolved cases properly
```

---

## 📊 MODEL PERFORMANCE TARGETS (أهداف أداء النموذج)

### Acceptable Thresholds (العتبات المقبولة)

| Metric | Target | Warning | Critical | Action if Critical |
|--------|--------|---------|----------|-------------------|
| **Accuracy** | > 88% | 82-88% | < 82% | Retrain model |
| **Precision** | > 83% | 78-83% | < 78% | Review features |
| **Recall** | > 86% | 80-86% | < 80% | Increase sensitivity |
| **F1-Score** | > 84% | 78-84% | < 78% | Comprehensive review |
| **Error Rate** | < 2% | 2-5% | > 5% | Emergency investigation |
| **Latency (p99)** | < 2s | 2-5s | > 5s | Infrastructure check |
| **Uptime** | > 99.5% | 99-99.5% | < 99% | Incident response |

### Retraining Schedule (جدول إعادة التدريب)

| Model | Frequency | Run Time | Exception Trigger |
|-------|-----------|----------|-------------------|
| **Demand_Forecast** | Weekly | Sunday 02:00 | Drift detected |
| **Price_Optimizer** | Monthly | 1st of month 03:00 | Market crisis |
| **Churn_Predictor** | Bi-monthly | 15th + Last day | New segment added |
| **Supplier_Matcher** | Daily | 04:00 | Bulk supplier import |
| **Category_Classifier** | Quarterly | Quarter start | New categories added |

---

## 🚨 EMERGENCY PROCEDURES (إجراءات الطوارئ)

### System Down Protocol (بروتوكول تعطل النظام)

```
IF AI SYSTEM COMPLETELY DOWN:

1. IMMEDIATE (within 5 min):
   ├── Notify: oncall@algeriatrade.dz
   ├── Notify: #platform-incidents Slack channel
   └── Assess: Is it local or widespread?

2. SHORT-TERM (within 30 min):
   ├── Switch to MANUAL MODE for critical operations
   ├── Post maintenance banner on platform
   └── Begin incident documentation

3. USER COMMUNICATION:
   ├── Template: "AI services temporarily unavailable"
   ├── ETA: Provide when known (max 2 hours for estimate)
   └── Workaround: Manual processes documented

4. RECOVERY:
   ├── Verify all predictions post-recovery
   ├── Check for missed alerts during downtime
   └── Post-incident review within 48 hours
```

### Security Incident Protocol (بروتوكول حادث الأمان)

```
IF SECURITY INCIDENT DETECTED:

1. CONTAIN (immediate):
   ├── Isolate affected systems if needed
   ├── Preserve evidence (DO NOT modify)
   └── Notify security@algeriatrade.dz

2. ASSESS (within 1 hour):
   ├── Determine scope and impact
   ├── Classify incident type
   └── Identify data potentially affected

3. NOTIFY (per timeline):
   ├── Internal: CLO, Compliance Dir (immediate)
   ├── ANPD: If personal data breach (< 72 hours)
   └── Users: If their data affected (as required)

4. REMEDIATE:
   ├── Fix vulnerability
   ├── Implement additional controls
   └── Document lessons learned
```

---

## 📝 REGULATORY QUICK REFERENCE (مرجع تنظيمي سريع)

### Key Algerian Laws (القوانين الجزائرية الرئيسية)

| Law | Reference | Date | Governs | Key Requirement |
|-----|-----------|------|---------|-----------------|
| **Code de Commerce** | Ordonnance 75-59 | 26 Sep 1975 | Commercial activity | RC registration mandatory |
| **Code TVA** | Ordonnance 76-147 | 30 Dec 1976 | VAT taxation | Correct rate application |
| **Data Protection** | Loi 18-07 | 10 Jun 2018 | Personal data | Consent, rights SUJT |
| **Foreign Trade** | Loi 03-01 | 26 Feb 2003 | Import/export | Licenses, certificates |
| **Competition** | Loi 03-03 | 2003 | Fair competition | No price-fixing |
| **Labor Code** | Loi 90-11 | 21 Apr 1990 | Employment | Work permits for foreign |

### TVA Rate Cheat Sheet (ورقة غش أسعار الضريبة)

```
QUICK TVA REFERENCE:

19% (NORMAL RATE) ─────────────────────────
→ Default rate for most goods/services
→ Electronics, machinery, textiles, B2B services
→ Formula: TTC = HT × 1.19

9% (REDUCED RATE) ──────────────────────────
→ Basic food items (flour, oil, milk, sugar)
→ Medicines and pharmaceutical products
→ Fresh agricultural products
→ Books and school supplies
→ Formula: TTC = HT × 1.09

0% (EXEMPT/ZERO-RATED) ─────────────────────
→ Exports (with proof)
→ Fertilizers and pesticides
→ Newspapers and periodicals
→ Certain financial operations
→ Formula: TTC = HT × 1.00
```

### Compliance Score Quick Decision (قرار سريع لدرجة الامتثال)

```
QUICK DECISION TREE:

Entity Score ≥ 75?
    │
    ├── YES → Any P1/P2 violations?
    │           │
    │           ├── NO → PROCESS normally ✓
    │           └── YES → Handle violation first
    │
    └── NO → Score ≥ 60?
                │
                ├── YES → Senior approval needed
                └── NO → MANAGER approval + hold
                              │
                              └── Score < 40?
                                  │
                                  └── YES → BLOCK + escalate to CLO
```

---

## 📌 IMPORTANT URLs & RESOURCES (روابط وموارد مهمة)

### Internal Resources (موارد داخلية)

| Resource | URL | Description |
|----------|-----|-------------|
| **AI Documentation** | internal.wiki/ai-phase9 | Complete technical docs |
| **Compliance Policies** | internal.wiki/compliance-policies | All policy documents |
| **Training Materials** | learn.algeriatrade.dz/phase9 | This training portal |
| **Support Portal** | support.algeriatrade.dz | Ticket submission |
| **Status Page** | status.algeriatrade.dz | System health |

### External References (مراجع خارجية)

| Resource | URL | Description |
|----------|-----|-------------|
| **Journal Officiel** | jor.dz | Official law publication |
| **ANPD** | anpd.gov.dz | Data protection authority |
| **CNRC** | cnrc.dz | Commercial registry |
| **DGI** | dgf.gov.dz | Tax authority |
| **Douanes** | douane.gov.dz | Customs service |
| **Conseil Concurrence** | concurrence.dz | Competition authority |

---

## ✅ CERTIFICATION REQUIREMENTS (متطلبات الشهادة)

### Phase 9 Certification Criteria (معايير شهادة المرحلة ٩)

```
CERTIFICATION CHECKLIST:

TRAINING COMPLETION:
☐ Module 1: AI Predictions Overview (completed)
☐ Module 2: Predictive Dashboard Usage (completed)
☐ Module 3: Recommendation Engine (completed)
☐ Module 4: Admin AI Management (completed)
☐ Module 5: Algerian Legal Framework (completed)
☐ Module 6: Compliance Checker Usage (completed)
☐ Module 7: Tax Compliance TVA (completed)
☐ Module 8: Sanctions Screening (completed)
☐ Module 9: Document Management (completed)

ASSESSMENT:
☐ Quiz MCQ: Score ≥ 80% (24/30 correct)
☐ Scenario Questions: Score ≥ 80%
☐ Practical Exercise: Completed satisfactorily

VALID FOR: 12 months from certification date
RENEWAL: Refresher training + reassessment required
```

---

**Document Version:** 9.0.0  
**Last Updated:** January 2025  
**Next Review:** April 2025  
**Owner:** Training & Compliance Team  
**Classification:** INTERNAL USE ONLY - CONFIDENTIAL

---

*End of Phase 9 Quick Reference Card*
*نهاية بطاقة المراجعة السريعة للمرحلة ٩*
