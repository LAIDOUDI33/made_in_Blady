# AI Analytics Quick Reference Guide
## AlgeriaTrade.dz Phase 9 - Intelligence Artificielle
### Fiche Mémo Rapide - Cheatsheet Analytics

---

**Version:** 9.0.0 | **Langue:** Français / العربية | **Classification:** Interne

---

## 📊 Dashboard Navigation (التنقل في لوحة القيادة)

### Raccourcis Clavier Principaux

| Action | Raccourci | الوصف |
|--------|-----------|-------|
| **Changer période** | `Ctrl+P` | تغيير الفترة الزمنية |
| **Recherche** | `Ctrl+F` | بحث سريع |
| **Exporter** | `Ctrl+E` | تصدير البيانات |
| **Actualiser** | `Ctrl+R` | تحديث البيانات |
| **Paramètres** | `Ctrl+,` | الإعدادات |
| **Sauvegarder vue** | `Ctrl+S` | حفظ العرض |
| **Alertes** | `Ctrl+A` | التنبيهات |

### Structure du Tableau de Bord

```
┌─────────────────────────────────────────────────────────────┐
│  LAYOUT PRINCIPAL DASHBOARD                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Ligne 1] 4 Cartes KPI:                                    │
│  ├── 💰 Revenue Forecast     (Prévision revenus)           │
│  ├── 📈 Demand Index          (Indice demande)             │
│  ├── 📦 Orders Predicted      (Commandes prévues)           │
│  └── 📉 Margin Prediction     (Prédiction marge)            │
│                                                             │
│  [Ligne 2] Graphique principal + Scénarios                  │
│  ├── Courbe tendance avec intervalles confiance             │
│  └── Scénarios Optimiste/Réaliste/Conservateur              │
│                                                             │
│  [Ligne 3] Analyses détaillées                               │
│  ├── Demande par catégorie                                  │
│  └── Suggestions IA prioritaires                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 KPI Cards - Quick Reference (بطاقات المؤشرات - مرجع سريع)

### Revenue Forecast (Prévision Revenus)

| Élément | Signification | Action si Anormal |
|---------|--------------|-------------------|
| **Valeur Centrale** | Prédiction la plus probable | - |
| **vs Période Précédente** | Évolution tendancielle | Si <-10%, investiguer |
| **vs Budget** | Performance vs objectifs | Si <-5%, ajuster plan |
| **Confiance** | Fiabilité prédiction | Si <70%, prendre marge |

**Score Confiance Interprétation:**
```
90-100% ████████████████████ Planifier avec certitude
75-89%  █████████████████░░░ Planifier avec marge
60-74%  ██████████████░░░░░ Surveillance renforcée
40-59%  ██████████░░░░░░░░ Validation manuelle requise
<40%     █████░░░░░░░░░░░░░ Ne pas utiliser
```

### Demand Index (Indice de Demande)

- **Base 100** = Moyenne historique (2024)
- **>100** = Demande au-dessus de la moyenne
- **<100** = Demande en-dessous de la moyenne

### Churn Risk Score (Score Risque Churn)

| Niveau | Score | Couleur | Action |
|--------|-------|---------|--------|
| Critique | 80-100% | 🔴 | Intervention < 24h |
| Élevé | 60-79% | 🟠 | Intervention < 72h |
| Modéré | 40-59% | 🟡 | Suivi hebdomadaire |
| Faible | 20-39% | 🟢 | Suivi mensuel |
| Minimal | 0-19% | ⚪ | Maintenance standard |

---

## 🔮 Prediction Interpretation (تفسير التنبؤات)

### Confidence Score Rules (قواعد درجة الثقة)

```
✅ UTILISER SI:
   • Score ≥ 75%
   • Données historiques suffisantes (>3 mois)
   • Pas d'événement exceptionnel récent
   • Catégorie avec historique établi

⚠️ VIGILANCE SI:
   • Score 60-74%
   • Nouvelle catégorie produit
   • Période de forte saisonnalité (Ramadan, Aïd)
   • Données récentes atypiques

❌ NE PAS UTILISER SI:
   • Score < 50%
   • Données < 1 mois disponibles
   • Modèle en cours de réentraînement
   • Alerte drift détectée
```

### Prediction Intervals (فترات التنبؤ)

| Scénario | Usage Recommandé |
|----------|------------------|
| **Optimiste (+12 à +15%)** | Présentation investisseurs, objectifs stretch |
| **Réaliste (central)** | Reporting interne, planification normale |
| **Conservateur (-12 à -15%)** | Budget, gestion trésorerie, contrats |

---

## 💰 Pricing Strategies (استراتيجيات التسعير)

### Mode Selection Matrix (مصفوفة اختيار الوضع)

| Situation | Stratégie | Volatilité Prix |
|-----------|-----------|-----------------|
| Produit exclusif, faible concurrence | Maximisation Marge | Élevée (±10%) |
| Lancement produit, concurrence forte | Part de Marché | Faible (±3%) |
| Standard, marché équilibré | Équilibre Optimal | Modérée (±5%) |
| Commodity, prix dicté par marché | Compétitif | Très faible (±2%) |

### Price Change Limits (حدود تغيير السعر)

```
CONTRAINTES SYSTÈME:
├── Variation max JOURNALIÈRE: ±5%
├── Variation max HEBDOMADAIRE: ±15%
├── Seuil minimum prix: Coût + 10%
├── Seuil maximum prix: Médiane marché × 1.5
└── Révision manuelle obligatoire si > 15%
```

### Acceptance Criteria for AI Suggestions (معايير قبول اقتراحات الذكاء الاصطناعي)

```
ACCEPTER SUGGESTION PRIX SI:
✅ Score confiance ≥ 75%
✅ Variation ≤ 10% vs prix actuel
✅ Aligné stratégie catégorie
✅ Pas de promo concurrente active
✅ Stock suffisant

REFUSER/MODIFIER SI:
✗ Score confiance < 60%
✗ Variation > 15%
✗ Événement marché imprévu
✗ Relation client à risque
✗ Contraintes contractuelles
```

---

## 🔗 Supplier Matching (مطابقة الموردين)

### Compatibility Score Breakdown (تفصيل درجة التوافق)

| Dimension | Poids | Description |
|-----------|-------|-------------|
| **Produit** | 30% | Catégorie, specs, qualité |
| **Localisation** | 20% | Wilaya, distance, zone franche |
| **Capacité** | 15% | Volume disponible, délais |
| **Certification** | 15% | ISO, agréments, conformité |
| **Prix** | 10% | Compétitivité vs marché |
| **Performance** | 10% | Avis, livraison, litiges |

### Score Interpretation (تفسير الدرجة)

```
90-100 █████████████████████ Match excellent - Priorité #1
75-89  ████████████████████░ Bon match - Fortement recommandé
60-74  █████████████████░░░░ Match acceptable - À considérer
40-59  █████████████░░░░░░░ Match faible - Alternatives meilleures
<40    █████████░░░░░░░░░░░ Match non recommandé - Éviter
```

### Auto-Matching Configuration (إعداد المطابقة التلقائية)

| Paramètre | Valeur Par Défaut | Plage |
|-----------|-------------------|-------|
| Nombre fournisseurs suggérés | 7 | 3-15 |
| Score minimum inclusion | 60 | 0-100 |
| Priorité localisation | Haute | Basse/Moyenne/Haute/Très Haute |
| Priorité certification | Moyenne-Haute | Basse à Très Haute |

---

## 📅 Algerian Seasonality Calendar (تقويم الموسمية الجزائري)

### Key Dates Impact (تواريخ رئيسية مؤثرة)

| Période | Événement | Impact Demande | Catégories Affectées |
|---------|-----------|---------------|----------------------|
| **Ramadan** (variable) | Jeûne sacré | -30% jour / +40% nuit | Alimentation, textile, électronique |
| **Aïd El-Fitr** | Fin Ramadan | +200% semaine avant | Vêtements, alimentation |
| **Aïd El-Adha** | Fête Sacrifice | +150% semaine avant | Bétail, alimentation |
| **1er Novembre** | Fête Révolution | -50% jour férié | Services B2B |
| **Juillet-Août** | Vacances | -40% B2B | Industrie, services |
| **Septembre** | Rentrée | +60% | Fournitures, équipements |

### Seasonal Coefficients Applied (المعاملات الموسمية المطبقة)

```
Mois       Coefficient    Justification
─────────────────────────────────────────
Janvier      0.85      Post-fêtes
Février      0.90      Pré-Ramadan
Mars         1.05      Construction active
Avril        1.15      Pic printemps
Mai          1.20      Pleine activité
Juin         1.10      Pré-vacances
Juillet      0.70      Vacances été
Août         0.65      Grandes vacances
Septembre    1.25      Rentrée forte
Octobre      1.15      Activité élevée
Novembre     0.95      Fête 1er Nov
Décembre     1.30      Préparation fin d'année
```

---

## ⚙️ Admin & Monitoring (الإدارة والمراقبة)

### Model Performance Targets (أهداف أداء النموذج)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Accuracy** | > 88% | 82-88% | < 82% |
| **Precision** | > 83% | 78-83% | < 78% |
| **Recall** | > 86% | 80-86% | < 80% |
| **F1-Score** | > 84% | 78-84% | < 78% |
| **Error Rate** | < 2% | 2-5% | > 5% |

### Retraining Schedule (جدول إعادة التدريب)

| Model | Frequency | Next Run | Trigger Exceptional |
|-------|-----------|----------|---------------------|
| **Demand_Forecast** | Weekly | Sunday 02:00 | Drift detected |
| **Price_Optimizer** | Monthly | 1st of month 03:00 | Market crisis |
| **Churn_Predictor** | Bi-monthly | 15th + last day | New segment added |
| **Supplier_Matcher** | Daily | 04:00 | New suppliers bulk import |
| **Category_Classifier** | Quarterly | Quarter start | New categories |

### Failure Handling (معالجة حالات الفشل)

| Error Type | Auto-Recovery | Human Action Required |
|------------|---------------|----------------------|
| **Timeout** | Retry ×3 with backoff | If persists → Check system load |
| **Missing Data** | Use heuristic fallback | Request data from user |
| **Outlier detected** | Flag for review | Validate or exclude |
| **Model unavailable** | Switch to backup model | Alert admin team |
| **Drift detected** | Flag predictions | Retrain model |

---

## 🚨 Troubleshooting (استكشاف الأخطاء وإصلاحها)

### Common Issues & Solutions (مشكلات شائحة وحلول)

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Predictions not loading** | Spinner indefinite | Refresh page, check connection |
| **Wrong confidence score** | Score seems off | Verify data freshness, check for drift alert |
| **Price suggestions extreme** | >15% change suggested | Don't auto-apply, review manually |
| **Match score inconsistent** | Same supplier different scores | Check if supplier profile updated |
| **Dashboard slow** | Loading > 10 seconds | Clear cache, reduce time range |
| **Alerts not triggering** | Expected alerts missing | Check notification settings |
| **Export fails** | Download error | Try PDF instead of Excel, reduce data |

### When to Contact Support (متى ت الاتصال بالدعم)

```
CONTACT SUPPORT IMMÉDIATEMENT SI:
⚠️ System completely down (no dashboard loads)
⚠️ Data appears corrupted or incorrect
⚠️ Security issue suspected
⚠️ Predictions affecting financial decisions are wrong
⚠️ Compliance concern related to AI recommendations

CONTACT SUPPORT NORMAL CHANNEL IF:
• Question about feature usage
• Suggestion for improvement
• Minor display issue
• Training request
```

### Support Contacts (جهات الدعم)

| Type | Contact | Response Time |
|------|---------|---------------|
| **Critical Incident** | support@algeriatrade.dz | < 1 hour |
| **AI/Data Science Questions** | ai-team@algeriatrade.dz | < 24 hours |
| **Feature Requests** | product@algeriatrade.dz | 48-72 hours |
| **Training** | training@algeriatrade.dz | Per schedule |

---

## 📝 Quick Commands Reference (مرجع أوامر سريعة)

### Dashboard Actions (إجراءات لوحة القيادة)

```
NEW VERIFICATION:        Ctrl+N → Select entity type → Enter details
EXPORT DATA:             Ctrl+E → Choose format (PDF/Excel/CSV) → Select range
SAVE VIEW:               Ctrl+S → Name view → Set as default?
SET ALERTS:              Ctrl+A → Configure threshold → Choose notification type
SHARE REPORT:            Ctrl+Shift+L → Generate link → Set expiry (max 7 days)
APPROVE SUGGESTION:      Click suggestion → [Apply] → Confirm
REJECT SUGGESTION:       Click suggestion → [Reject] → Add reason
ESCALATE ISSUE:          Ctrl+Shift+E → Select level → Add description
```

### Search Operators (عمليات البحث)

| Operator | Example | Result |
|----------|---------|--------|
| Exact match | `"Cevital SPA"` | Exact phrase |
| Exclude | `textile -soie` | Contains textile, not soie |
| Wildcard | `Cond*` | Condor, Condimat, etc. |
| Range | `price:50000-100000` | Price in range |
| Recent | `date:>2025-01-01` | After date |

---

## 🔄 Daily Checklist (قائمة يومية)

### For Operations Team (لفريق العمليات)

```
DAILY AI ANALYTICS CHECKLIST:
☐ Check dashboard loading correctly
☐ Review overnight alerts (if any)
☐ Verify no critical prediction failures
☐ Scan churn alerts requiring action
☐ Review pricing suggestions pending
☐ Check model health indicators
☐ Process any escalated items
☐ Note any anomalies for weekly review
```

### For Admin Team (لفريق الإدارة)

```
WEEKLY ADMIN CHECKLIST:
☐ Review model performance metrics
☐ Check retraining completion status
☐ Analyze failure rates and patterns
☐ Review user feedback on suggestions
☐ Audit access logs
☐ Update documentation if needed
☐ Prepare weekly compliance report
```

---

## 📊 Key Metrics at a Glance (المقاييس الرئيسية نظرة سريعة)

### This Week's AI Health (صحة الذكاء الاصطناعي هذا الأسبوع)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Predictions/Day | ~45K | Stable | ✅ |
| Avg Confidence | 87.6% | > 85% | ✅ |
| Error Rate | 0.23% | < 1% | ✅ |
| Model Uptime | 99.97% | > 99.5% | ✅ |
| Suggestions Accepted | 68% | > 60% | ✅ |
| Churn Alerts Accuracy | 89% | > 85% | ✅ |

---

**Document Version:** 9.0.0  
**Last Updated:** January 2025  
**Next Review:** April 2025  
**Owner:** AI/Analytics Team

---

*End of AI Analytics Cheatsheet*
*نهاية ورقة مراجعة تحليلات الذكاء الاصطناعي*
