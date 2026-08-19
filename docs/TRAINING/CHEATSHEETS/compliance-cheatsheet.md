# Compliance Quick Reference Guide
## AlgeriaTrade.dz Phase 9 - Moteur de Conformité
### Fiche Mémo Rapide - Cheatsheet Conformité

---

**Version:** 9.0.0 | **Langue:** Français / العربية | **Classification:** Interne - Conformité

---

## ⚖️ Compliance Score Ranges (نطاقات درجات الامتثال)

### Global Score Interpretation (تفسير الدرجة العالمية)

```
┌─────────────────────────────────────────────────────────────┐
│  ÉCHELLE SCORE CONFORMITÉ GLOBAL (0-100)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  0 ──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬── 100        │
│      │       │       │       │       │                    │
│   CRITIQUE  FAIBLE  ACCEPTABLE   BON     EXCELLENT         │
│    🔴        🟠       🟡          🟢        🟢             │
│                                                             │
│  0-39:    BLOQUER - Risque significatif                     │
│  40-59:  ATTENTION - Vérifications approfondies            │
│  60-74:  ACCEPTABLE - Monitoring renforcé                  │
│  75-89:  BON - Procédure standard                          │
│  90-100: EXCELLENT - Processus allégé possible             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Module Scores Breakdown (تفصيل الدرجات حسب الوحدة)

| Module | Poids | Full Score | Description |
|--------|-------|------------|-------------|
| **Commercial** | 20% | 100 | Code de Commerce compliance |
| **Fiscal/TVA** | 25% | 100 | TVA rules, fiscal status |
| **Trade Extérieur** | 15% | 100 | Import/export regulations |
| **Privacy** | 15% | 100 | Data protection (Loi 18-07) |
| **Sanctions** | 25% | 100 | OFAC/EU/UN/DZ screening |

---

## 🚨 Violation Severity Levels (مستويات خطورة الانتهاكات)

### Severity Matrix (مصفوفة الخطورة)

| Level | Code | Score Impact | Color | Response Time |
|-------|------|--------------|-------|---------------|
| **CRITIQUE** | 🔴 Red | -50 to -100 | 🔴 | < 1 hour |
| **MAJEUR** | 🟠 Orange | -25 to -49 | 🟠 | < 24 hours |
| **MODÉRÉ** | 🟡 Yellow | -10 to -24 | 🟡 | < 72 hours |
| **MINEUR** | 🔵 Blue | -1 to -9 | 🔵 | < 7 days |
| **INFO** | ⚪ White | 0 | ⚪ | Next review |

### Response Actions by Severity (الإجراءات حسب الخطورة)

```
🔴 CRITIQUE → SUSPENDRE + Notifier Direction + Escalader immédiatement
🟠 MAJEUR   → MARQUER "Attention" + Demander corrections + Limiter transactions
🟡 MODÉRÉ  → Notifier entité + Délai régularisation 14j + Suivi actif
🔵 MINEUR   → Note dossier + Correction prochaine opportunité
⚪ INFO     → Observation interne + Amélioration continue
```

---

## 💰 TVA Rates Reference (مرجع أسعار الضريبة)

### Main TVA Rates in Algeria (أسعار الضريبة الرئيسية في الجزائر)

```
┌─────────────────────────────────────────────────────────────┐
│  TAUX TVA ALGÉRIE - RÉSUMÉ                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  19% ████████████████████████████ TAUX NORMAL              │
│  ├── Par défaut pour tous biens/services                   │
│  ├── Électronique, textile, machines                       │
│  ├── Services B2B, consulting                              │
│  └── Électroménager, matériaux construction                │
│                                                             │
│  9%  ██████████████████ TAUX RÉDUIT                       │
│  ├── Produits alimentaires de base                         │
│  │   (farine, huile table, lait, sucre, semoule)         │
│  ├── Médicaments et produits pharmaceutiques               │
│  ├── Produits agricoles frais                              │
│  ├── Livres et fournitures scolaires                       │
│  └── Certain services de base                             │
│                                                             │
│  0%  ░░░░░░░░░░░░░░░ EXONÉRATION                          │
│  ├── Exportations de biens et services                     │
│  ├── Intrants agricoles (engrais, pesticides)              │
│  ├── Transport international                               │
│  ├── Journaux et publications                              │
│  └── Opérations zones franches                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quick Decision Tree - TVA Rate (شجرة قرار سريعة - سعر الضريبة)

```
START: Quel taux TVA ?
         │
         ├─→ Export/Hors DZ? ──→ 0%
         │
         ├─→ Médicament/Pharma? ──→ 9%
         │
         ├─→ Aliment de BASE? (farine, huile, lait, sucre)
         │       └─→ 9%
         │
         ├─→ Livre/Fourniture scolaire? ──→ 9%
         │
         ├─→ Engrais/Pesticides? ──→ 0%
         │
         └─→ TOUT AUTRE ──→ 19%
```

### Common TVA Mistakes (أخطاء شائعة في الضريبة)

| Error | Wrong | Correct | Impact |
|-------|-------|---------|--------|
| Food luxury at reduced rate | 9% | 19% | Underpayment |
| Medicine at normal rate | 19% | 9% | Overcharge |
| Missing NIF on invoice | - | Required | Non-deductible |
| HT/TTC confusion | TTC as HT | Separate | Tax error |
| Export with TVA | 19% | 0% | Customer overpays |

---

## 🔍 Sanctions Screening Levels (مستويات فحص العقوبات)

### Match Levels Explained (شرح مستويات المطابقة)

| Level | Score | Meaning | Action |
|-------|-------|---------|--------|
| **EXACT** | 100% | Identical entity on list | 🔴 BLOCK immediately |
| **HIGH** | 75-99% | Very likely same entity | 🔴 BLOCK + investigate |
| **MEDIUM** | 40-74% | Similarities, ambiguous | ⏸️ PAUSE + manual review |
| **LOW** | 1-39% | Some similarities | ✅ Document + monitor |
| **NO MATCH** | 0% | No significant similarity | ✅ CLEAR - proceed |

### Lists Screened (القوائم المفحوصة)

| List | Source | Update Freq | Priority |
|------|--------|-------------|----------|
| **OFAC SDN** | US Treasury | Daily | High (secondary sanctions) |
| **EU Consolidated** | EU Council | Weekly | High (EU partners) |
| **UN Security Council** | UN | Regular | Obligatory (UN member) |
| **National DZ** | Government DZ | Variable | Obligatory |

### False Positive Handling (معالجة الإيجابيات الكاذبة)

```
FAUX POSITIF WORKFLOW:
1. COLLECT preuves: Passeport, domicile, emploi, état civil
2. COMPARE: Nom, DOB, lieu, nationalité, adresse
3. DECIDE: Documenter si faux positif confirmé
4. REPORT: Si requis par réglementation
5. WHITELIST: Ajouter si approuvé (avec validation)
```

---

## 📋 Document Checklist by Entity Type (قائمة المستندات حسب نوع الكيان)

### Enterprise/SARL (مؤسسة/ذ.م.م)

```
DOCUMENTS OBLIGATOIRES SARL:
☑ Extrait RC (< 30 jours)
☑ Statuts mis à jour (toutes modifications)
☑ PV AG désignant gérant(s)
☑ CNI des gérants
☑ Attestation fiscale (NIF, NIS, AI)
☑ Registre bénéficiaires effectifs
☑ Pouvoirs de signature (si signataire ≠ gérant)
```

### Individual/Artisan (فرد/حرفي)

```
DOCUMENTS OBLIGATOIRES INDIVIDUEL:
☑ Extrait RC (si commerçant)
☑ CNI/Passeport en cours validité
☑ Attestation fiscale (NIF, NIS, AI)
☑ Justificatif domicile
☑ Certificat artisan (si applicable)
☑ Assurance professionnelle
```

### Foreign Company (شركة أجنبية)

```
DOCUMENTS SUPPLÉMENTAIRES ÉTRANGER:
☑ Preuve existence légale (pays origine)
☑ Attestation représentation en Algérie (ou preuve absence établissement stable)
☑ Certificat conformité CE (produits)
☑ Coordonnées banque correspondante DZ (si existe)
☑ Attestation non-sanction (auto-déclaration)
```

### Government/Administration (حكومة/إدارة)

```
DOCUMENTS SPÉCIFIQUES ADMINISTRATION:
☑ Arrêté de création/nomination
☑ Pouvoirs du signataire autorisé
☑ Budget affectation (si commande publique)
☑ Marché public ou bon de commande (si applicable)
☑ NIF spécial administration
```

---

## ⏰ Response SLAs by Severity (اتفاقيات مستوى الخدمة حسب الخطورة)

### Response Time Matrix (مصفوفة وقت الاستجابة)

| Severity | Initial Response | Resolution Target | Escalation If |
|----------|------------------|-------------------|---------------|
| 🔴 Critical | < 1 hour | < 4 hours | Not resolved in 2h |
| 🟠 Major | < 4 hours | < 48 hours | Not resolved in 24h |
| 🟠 Moderate | < 24 hours | < 7 days | Not resolved in 72h |
| 🔵 Minor | < 72 hours | < 30 days | Not resolved in 2 weeks |

### Document Expiry Alerts (تنبيهات انتهاء المستندات)

| Timeline | Alert Type | Action |
|----------|-----------|--------|
| **90 days before** | Informational | Plan renewal |
| **60 days before** | Reminder | Initiate process |
| **30 days before** | Warning | Urgency notification |
| **15 days before** | Critical warning | Last chance |
| **0 day (expired)** | Block | Suspend transactions |
| **Post-expiry** | Escalate | Unblock procedure |

---

## 📞 Escalation Matrix (مصفوفة التصعيد)

### Contacts by Level (جهات الاتصال حسب المستوى)

| Level | Role | Contact | Availability |
|-------|------|---------|-------------|
| **N1** | Operator | compliance-ops@algeriatrade.dz | Business hours |
| **N2** | Senior | compliance-senior@... | Extended hours |
| **N3** | Manager | compliance-manager@... | 24/7 mobile |
| **N4** | Director | EA Direction Générale | Crisis only |
| **N5** | External Legal | Cabinet XYZ | By appointment |

### When to Escalate (متى يتم التصعيد)

```
ESCALER IMMÉDIATEMENT SI:
🔴 Match sanction exact ou high probability confirmé
🔴 Suspicion blanchiment ou financement terrorisme
🔴 Violation données personnelles (breach)
🔴 Demande autorité (audit, enquête)
🔴 Crise médiatique potentielle

ESCALER SOUS 24H SI:
🟠 Faux positif complexe à résoudre
🟠 Client important mençant départ
🟠 Anomalie fiscale significative
🟠 Conflit interprétation réglementaire

ESCALADER SOUS 72H SI:
🟠 Document expiré non renouvelé
🟠 Pattern erreurs répétées
🟠 Nouvelle exigence réglementaire
```

---

## 🚨 Emergency Procedures (إجراءات الطوارئ)

### Security Incident ( Breach Données)

```
DATA BREACH PROTOCOL - LOI 18-07:
1. CONTENIR: Isoler systèmes affectés
2. DOCUMENTER: Chronologie détaillée, impact estimé
3. NOTIFIER ANPD: Sous 72 heures maximum
4. NOTIFIER PERSONNES: Sans délai injustifié
5. INFORMER INTERNE: Direction, juridique, communication
6. PRÉSERVER PREUVES: Logs, emails, accès
7. COORDONNER: Avec assurance cyber si existante
```

### Sanctions Match Confirmed (تأكيد مطابقة عقوبات)

```
SANCTIONS MATCH CONFIRMED PROTOCOL:
1. BLOQUER: Transaction ET entité immédiatement
2. NE PAS ALERTER: L'entité soupçonnée
3. DOCUMENTER: Capture écran, preuves match
4. ESCALADER: Compliance Manager obligatoire
5. REPORTING: Selon obligations (CTF, Banque DZ, OFAC via canal officiel)
6. ARCHIVER: Dossier complet 10 ans minimum
```

### Regulatory Inquiry (استفسار تنظيمي)

```
AUDIT/ENQUÊTE PROTOCOL:
1. ACCUSER RÉCEPTION: De la demande officielle
2. DÉSIGNER: Point contact unique
3. RASSEMBLER: Documents demandés (délai raisonnable)
4. COLLABORER: Répondre aux questions (refus = obstruction)
5. CONSERVER: Copies de tout document fourni
6. NE PAS DÉTRUIRE: Aucun document lié à l'enquête
7. ASSISTANCE: Droit d'être accompagné d'un conseil
```

---

## 📊 Key Compliance Metrics (مقاييس الامتثال الرئيسية)

### Dashboard KPIs (مؤشرات لوحة القيادة)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Entities Verified** | 1,247 | Growing | ✅ |
| **Pending Reviews** | 12 | < 20 | ✅ |
| **Active Alerts** | 3 | < 5 | ✅ |
| **Avg Processing Time** | 4.2h | < 8h | ✅ |
| **False Positive Rate** | 2.3% | < 5% | ✅ |
| **Document Expiry Rate** | 0.6% | < 2% | ✅ |
| **Screening Coverage** | 99.8% | > 99% | ✅ |

---

## 📝 Daily Checklist (قائمة يومية)

### For Compliance Operators (لمشغلي الامتثال)

```
DAILY COMPLIANCE CHECKLIST:
☐ Review overnight alerts (if any)
☐ Process pending verifications (SLA < 24h for standard)
☐ Check documents expiring today/tomorrow
☐ Review sanctions screening queue
☐ Respond to user queries (< 4h response)
☐ Update cases in progress
☐ Log any unusual patterns noticed
☐ Handover notes if shift end
```

### For Compliance Manager (لمدير الامتثال)

```
WEEKLY MANAGER CHECKLIST:
☐ Review KPIs dashboard
☐ Check escalated cases resolution
☐ Audit random sample of decisions (5-10)
☐ Review training/compliance status team
☐ Monitor regulatory updates (new laws, decrees)
☐ Coordinate with DPO on privacy matters
☐ Prepare weekly/monthly reports
☐ Follow up on action items from audits
```

---

## 📚 Key Regulatory References (مراجع تنظيمية رئيسية)

### Algerian Laws (قوانين جزائرية)

| Code/Law | Reference | Key Topic |
|-----------|-----------|-----------|
| **Code de Commerce** | Ordonnance 75-59 | RC, formes juridiques, pouvoirs |
| **Code TVA** | Ordonnance 76-147 | Taux 19%/9%/0%, facturation |
| **Commerce Extérieur** | Loi 03-01 | Import/export, licences |
| **Protection Données** | Loi 18-07 | Consentement, droits SUJT |
| **Concurrence** | Loi 03-03 | Pratiques anticoncurrentielles |
| **Blanchiment** | Loi 05-04 | AML/CTF obligations |
| **Protection Consommateur** | Loi 09-04 | Droits consommateurs |

### Key Contacts (جهات اتصال رئيسية)

| Organization | Purpose | Contact |
|-------------|---------|---------|
| **DGI** | Fiscal questions | www.mf.gov.dz |
| **Banque d'Algère** | Change, devises | www.bank-of-algeria.dz |
| **CNRC** | RC verification | www.cnrc.org.dz |
| **CTF** | Suspicion reporting | Official secure channel |
| **ANPD** | Data protection | To be determined |
| **Ministère Commerce** | Trade licences | www.mincommerce.gov.dz |

---

## ⌨️ Keyboard Shortcuts (اختصارات لوحة المفاتيح)

| Action | Shortcut | الوصف |
|--------|-----------|-------|
| New verification | `Ctrl+N` | تحقق جديد |
| History | `Ctrl+H` | السجل |
| Export | `Ctrl+E` | تصدير |
| Share link | `Ctrl+Shift+L` | مشاركة الرابط |
| Approve | `Ctrl+Enter` | قبول |
| Reject | `Ctrl+Shift+R` | رفض |
| Hold/Pause | `Ctrl+Shift+P` | تعليق |
| Escalate | `Ctrl+Shift+E` | تصعيد |
| Search | `Ctrl+F` | بحث |
| Help | `F1` | مساعدة |

---

## ❓ Frequently Asked Questions (أسئلة شائعة)

### Q: What's the minimum score to approve a transaction?
**A:** Generally 60+, but 75+ for automatic approval. Below 60 requires senior review.

### Q: How long are documents considered valid?
**A:** Most documents: 30 days from issue date. Some (like fiscal attestation): per validity date shown.

### Q: Can I override a sanctions alert?
**A:** Only a Senior Compliance or Manager can approve after documented false positive investigation.

### Q: What if a client refuses to provide requested documents?
**A:** Transaction cannot proceed. Entity remains in "pending" status until compliant.

### Q: How do I handle an expired document post-transaction?
**A:** Past transaction is valid if document was valid at transaction time. Future transactions blocked until renewal.

---

**Document Version:** 9.0.0  
**Last Updated:** January 2025  
**Next Review:** April 2025  
**Owner:** Compliance Team

---

*End of Compliance Cheatsheet*
*نهاية ورقة مراجعة الامتثال*
