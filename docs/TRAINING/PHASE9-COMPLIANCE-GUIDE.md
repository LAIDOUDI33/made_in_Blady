# Guide de Formation : Moteur de Conformité et Compliance
## AlgeriaTrade.dz - Phase 9 : IA Business Intelligence et Conformité
### Manuel de Formation Complet pour les Équipes Conformité

---

**Version:** 9.0.0  
**Date de Publication:** Janvier 2025  
**Classification:** Interne - Formation Conformité  
**Langue:** Français (avec termes arabes)  
**الإصدار:** ٩.٠.٠  
**تاريخ النشر:** يناير ٢٠٢٥  
**التصنيف:** داخلي - تدريب الامتثال

---

## Table des Matières (جدول المحتويات)

1. [Introduction à la Conformité Phase 9](#introduction)
2. [Module 1: Cadre Légal Algérien](#module-1)
3. [Module 2: Utilisation du Compliance Checker](#module-2)
4. [Module 3: Conformité Fiscale TVA](#module-3)
5. [Module 4: Screening des Sanctions](#module-4)
6. [Module 5: Gestion Documentaire](#module-5)
7. [Scénarios de Conformité](#scenarios)
8. [Arbres de Décision](#decision-trees)
9. [Procédures d'Escalade](#escalation)
10. [Checkliste Préparation Audit](#audit-checklist)
11. [Annexes et Références](#annexes)

---

<a id="introduction"></a>

## Introduction à la Conformité Phase 9
### مقدمة للامتثال في المرحلة ٩

### Vue d'Ensemble du Moteur de Conformية (نظرة عامة على محرك الامتثال)

Le **Moteur de Conformité** d'AlgeriaTrade.dz est un système automatisé qui vérifie en temps réel le respect des réglementations algériennes et internationales applicables aux transactions B2B sur la plateforme.

```
┌──────────────────────────────────────────────────────────────────────────┐
│              ARCHITECTURE DU MOTEUR DE CONFORMITÉ                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   MODULE     │  │   MODULE     │  │   MODULE     │  │   MODULE   │  │
│  │  COMMERCIAL  │  │    FISCAL    │  │   TRADE      │  │  PRIVACY   │  │
│  │  (Commerce)  │  │    (TVA)     │  │ (Douanes)    │  │(Données)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                │                │                │          │
│         └────────────────┼────────────────┼────────────────┘          │
│                          │                                         │    │
│                          ▼                                         │    │
│  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │                    MOTEUR DE RÈGLES CENTRAL                    │   │   │
│  │  • Validation automatique • Scoring conformité • Alertes       │   │   │
│  └───────────────────────────────────────────────────────────────┘   │   │
│                              │                                       │   │
│                              ▼                                       │   │
│  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │                 MODULE SANCTIONS SCREENING                     │   │   │
│  │  OFAC / UE / ONU / Liste Nationale DZ                         │   │   │
│  └───────────────────────────────────────────────────────────────┘   │   │
│                              │                                       │   │
│                              ▼                                       │   │
│  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │                  TABLEAU DE BORD CONFORMITÉ                      ││   │
│  │  Scores • Alertes • Rapports • Audit Trail                      ││   │
│  └─────────────────────────────────────────────────────────────────┘│   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Modules du Moteur de Conformité (وحدات محرك الامتثال)

| Module | Réglementation | Vérifications Automatisées |
|--------|---------------|---------------------------|
| **Commercial** | Code de Commerce 75-59 | Immatriculation RC, statut juridique, pouvoirs |
| **Fiscal/TVA** | Code TVA 76-147 | Taux applicables, facturation, déclarations |
| **Trade Extérieur** | Loi 03-01 | Licences import/export, certificats d'origine |
| **Protection Données** | Loi 18-07 | Consentement, droits SUJT, transferts |
| **Sanctions** | OFAC/EU/UN/DZ | Screening parties, transactions bloquantes |

### Objectifs Pédagogiques (الأهداف التعليمية)

À la fin de cette formation, vous serez capable de :

1. ✅ Identifier les exigences légales algériennes applicables aux transactions B2B
2. ✅ Utiliser le Compliance Checker pour évaluer une transaction ou un partenaire
3. ✅ Appliquer correctement les taux de TVA selon les règles algériennes
4. ✅ Effectuer un screening des sanctions et interpréter les résultats
5. ✅ Gérer le cycle de vie des documents de conformité
6. ✅ Réagir appropriément aux alertes de conformité

### Rôles et Responsabilités (الأدوار والمسؤوليات)

| Rôle | Responsabilités Principales | Accès Système |
|------|---------------------------|---------------|
| **Opérateur Conformité** | Traitement quotidien alertes, vérifications | Lecture + Validation |
| **Senior Compliance** | Cas complexes, escalades, exceptions | Validation + Approbation |
| **Compliance Manager** | Politiques, reporting autorités, audits | Administration complète |
| **DPO (Data Protection Officer)** | Protection données, privacy | Module Privacy uniquement |

---

<a id="module-1"></a>

## Module 1: Cadre Légal Algérien
### الوحدة الأولى: الإطار القانوني الجزائري

---

### 1.1 Code de Commerce (قانون التجارة)

#### 1.1.1 Ordonnance 75-59 du 26 septembre 1975 (المرسوم ٧٥-٥٩)

Le Code de Commerce algérien constitue le fondement légal des activités commerciales en Algérie.

**[CAPTURE D'ÉCRAN RÉFÉRENCE: legal-framework-overview.png]**

**Points Clés pour la Conformité B2B:**

| Exigence | Description | Vérification Platforme |
|----------|-------------|----------------------|
| **Immatriculation RC** | Registre du Commerce obligatoire | Vérification numéro RC valide |
| **Statut Juridique** | SARL, EURL, SPA, SNC, etc. | Correspondance documents/statuts |
| **Siège Social** | Adresse déclarée au RC | Cohérence avec profil plateforme |
| **Capital Social** | Montant minimum selon forme | Vérification pour certains seuils |
| **Gérant/Dirigeant** | Identité des personnes habilitées | Pouvoirs de signature |
| **Objet Social** | Activités autorisées | Alignement avec transactions proposées |

#### 1.1.2 Formes Juridiques Reconues (الأشكال القانونية المعترف بها)

| Forme | Capital Minimum | Dirigeants | Responsabilité | Notes Conformité |
|-------|-----------------|------------|----------------|------------------|
| **EURL** | 100,000 DZD | 1 associé-gérant | Limitée au capital | Vérification identité unique |
| **SARL** | 100,000 DZD | 1-25 associés | Limitée au capital | Gérance collective ou unique |
| **SPA** | 5,000,000 DZD | 7 actionnaires min. | Limitée aux actions | Conseil d'administration obligatoire |
| **SNC** | Pas de minimum | 2+ associés | Solidaire illimitée | Attention risque conformité |
| **SCS** | Pas de minimum | Commandités + commanditaires | Mixte | Vérification répartition |
| **Groupement d'Intérêt Économie (GIE)** | Pas de capital | Personnes morales/physiques | Pas de personnalité | Cas particulier |

#### 1.1.3 Documents Requis par Type d'Entité (المستندات المطلوبة حسب نوع الكيان)

```
CHECKLISTE DOCUMENTS CODE COMMERCE:

ENTREPRISE INDIVIDUELLE / EURL:
├── ☑ Copie Registre Commerce (RC) - datée < 3 mois
├── ☑ Carte Nationale d'Identité gérant
├── ☑ Attestation existence fiscal (NIF, NIS, AI)
├── ☑ Statuts (pour EURL)
└── ☑ Pouvoir signature (si signataire ≠ gérant)

SARL:
├── ☑ Copie RC - datée < 3 mois
├── ☑ Statuts mis à jour (toutes modifications)
├── ☑ PV assemblée générale désignant gérant(s)
├── ☑ CNI des gérants
├── ☑ Attestations fiscales (NIF, NIS, AI)
├── ☑ Registre des bénéficiaires effectifs
└── ☑ Pouvoirs de signature

SPA / Grande Entreprise:
├── Tous documents SARL +
├── ☑ PV Conseil d'Administration
├── ☑ Liste actionnaires (si > 25%)
├── ☑ États financiers certifiés (si requis)
└── ☑ Attestation conformité comptable
```

#### 1.1.4 Cas Pratique: Vérification RC (مثال عملي: التحقق من السجل التجاري)

**Scénario:** Nouveau fournisseur "MetalPro DZ" soumet son dossier.

```
VÉRIFICATION AUTOMATISÉE RC:

┌─────────────────────────────────────────────────────────────┐
│  VÉFICATION REGISTRE DU COMMERCE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Entité: METALPRO DZ                                        │
│  N° RC: 16B0012345 (Wilaya 16 - Alger)                     │
│                                                             │
│  RÉSULTAT VÉRFICATION:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ Numéro RC: Valide (format correct)                │   │
│  │ ✅ Existence: Confirmée (source: CNRC)               │   │
│  │ ⚠️ Date extrait: Il y a 45 jours (seuil: 30 jours)  │   │
│  │ ✅ Statut: Actif (non radié, non suspendu)           │   │
│  │ ✅ Siège social: Coordonnées cohérentes              │   │
│  │ ✅ Forme juridique: SARL (cohérent)                  │   │
│  │ ✅ Activité: Fabrication métal (aligné besoin)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ACTION REQUISE:                                            │
│  → Demander extrait RC actualisé (< 30 jours)              │
│  → Bloquer transactions > 500,000 DZD jusqu'à mise à jour  │
│                                                             │
│  SCORE CONFORMITÉ COMMERCIALE: 85/100                      │
│  (Pénalité: -15 points document périmé)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.2 Code TVA - Taxe sur la Valeur Ajoutée (ضريبة القيمة المضافة)

#### 1.2.1 Ordonnance 76-147 du 30 décembre 1976 (المرسوم ٧٦-١٤٧)

La TVA est un impôt indirect sur la consommation, applicable à la plupart des transactions commerciales en Algérie.

**Structure des Taux TVA (هيكل أسعار الضريبة):**

```
TAUX TVA EN ALGÉRIE - STRUCTURE COMPLÈTE:
═════════════════════════════════════════════════════════════════

TAUX NORMAL: 19%
├── Application: Par défaut, tous biens/services non spécifiés
├── Exemples: Électronique, textile, machines, services B2B
└── Base de calcul: Prix HT × 19% = TVA

TAUX RÉDUIT: 9%
├── Biens de première nécessité:
│   ├── Produits alimentaires de base (farine, huile, lait, sucre)
│   ├── Médicaments et produits pharmaceutiques
│   ├── Produits agricoles non transformés
│   ├── Livres et fournitures scolaires
│   └── Certains équipements agricoles
└── Services sociaux de base:
    ├── Transport public de voyageurs
    ├── Hébergement touristique simple
    └── Eau et assainissement

TAUX PARTICULIER: 0% (EXONÉRATION)
├── Exportations de biens et services
├── Livraisons intracommunautaires (si applicable futur)
├── Opérations financières bancaires spécifiques
├── Produits phytosanitaires et engrais
├── Journaux et publications périodiques
└── Opérations de livraison à soi-même (certaines)

OPÉRATIONS EXONÉRÉES SPÉCIFIQUES:
├── Transports internationaux
├── Ambassades et organisations internationales
├── Zones franches (sous conditions)
└── Réimportations après exportation
```

#### 1.2.2 Matrice des Taux par Catégorie de Produits (مصفوفة الأسعار حسب فئة المنتجات)

| Catégorie Produit | Taux TVA | Base Légale | Exemples |
|-------------------|----------|-------------|----------|
| **Alimentation luxe** | 19% | Art. Code TVA | Chocolat, confiserie, boissons sucrées |
| **Alimentation de base** | 9% | Art. Code TVA | Farine, huile table, lait, semoule |
| **Médicaments** | 9% | Art. Code TVA | Tous médicaments humains et vétérinaires |
| **Produits pharmaceutiques** | 9% | Art. Code TVA | Matières premières pharmacie |
| **Textile/Habillement** | 19% | Art. Code TVA | Tous vêtements, tissus |
| **Chaussures** | 19% | Art. Code TVA | Toutes chaussures |
| **Électroménager** | 19% | Art. Code TVA | Appareils électroménagers |
| **Électronique** | 19% | Art. Code TVA | Informatique, téléphonie |
| **Matériaux construction** | 19% | Art. Code TVA | Ciment, fer, peintures |
| **Machines industrielles** | 19% | Art. Code TVA | Équipements production |
| **Véhicules < 5 ans** | 19% | Art. Code TVA | Voitures particulières |
| **Carburants** | 19% | Art. Code TVA | Essence, gasoil |
| **Produits agricoles frais** | 9% | Art. Code TVA | Fruits, légumes frais |
| **Engrais/Pesticides** | 0% | Art. Code TVA exonéré | Intrants agriculture |
| **Livres/Fournitures scolaires** | 9% | Art. Code TVA | Papeterie scolaire |
| **Exportations** | 0% | Art. Code TVA export | Tous produits exportés |
| **Services numériques** | 19% | Interprétation DGI | SaaS, logiciels cloud |

#### 1.2.3 Calcul TVA - Exemples Pratics (أمثلة عملية على حساب الضريبة)

**Exemple 1: Transaction Standard (TVA 19%)**

```
FACTURE TYPE - TVA 19%

Désignation: Machine industrielle CNC
Quantité: 1 unité
Prix Unitaire HT: 5,000,000 DZD

CALCUL:
├── Montant HT:        5,000,000 DZD
├── TVA (19%):            950,000 DZD
└── Total TTC:          5,950,000 DZD

FORMULE: TTC = HT × 1.19
```

**Exemple 2: Produit à Taux Réduit (TVA 9%)**

```
FACTURE TYPE - TVA 9%

Désignation: Lot médicaments génériques
Quantité: 500 boîtes
Prix Unitaire HT: 800 DZD

CALCUL:
├── Montant HT:          400,000 DZD
├── TVA (9%):             36,000 DZD
└── Total TTC:           436,000 DZD

FORMULE: TTC = HT × 1.09
```

**Exemple 3: Exportation (TVA 0%)**

```
FACTURE EXPORT - TVA 0%

Désignation: Dates séchées conditionnées
Quantité: 10 tonnes
Prix Unitaire HT: 850,000 DZD/tonne

CALCUL:
├── Montant HT:        8,500,000 DZD
├── TVA (0%):                   0 DZD
└── Total TTC:          8,500,000 DZD

CONDITIONS EXPORT TVA 0%:
☑ Preuve exportation (douane)
☑ Client étranger (hors Algérie)
☑ Incoterm export (FOB, CIF, etc.)
☑ Documentation douanière complète
```

---

### 1.3 Loi 18-07: Protection des Données Personnelles (قانون حماية البيانات الشخصية)

#### 1.3.1 Cadre Législatif (الإطار التشريعي)

La Loi 18-07 du 10 juin 2018 établit le cadre de protection des données personnelles en Algérie, inspiré du RGPD européen mais adapté au contexte national.

**Principes Fondamentaux (المبادئ الأساسية):**

| Principe | Définition | Application Plateforme |
|----------|-----------|----------------------|
| **Licéité** | Collecte fondée sur base légale | Consentement utilisateur |
| **Finalité** | Données utilisées pour objectif défini | Limité aux services souscrits |
| **Minimisation** | Collecte limitée au nécessaire | Seuls champs requis collectés |
| **Exactitude** | Données exactes et à jour | Procédure correction utilisateur |
| **Limitation conservation** | Durée définie de rétention | Règles de retention par type |
| **Intégrité/Confidentialité** | Sécurité appropriée | Chiffrement, accès contrôlé |

#### 1.3.2 Droits des Personnes Concernées (حقوق الأشخاص المعنيين)

```
DROITS SUJET (DATA SUBJECT RIGHTS) - LOI 18-07:

┌─────────────────────────────────────────────────────────────┐
│  DROITS DES UTILISATEURS ALGERIATRADE.DZ                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DROIT D'ACCÈS (حق الوصول)                              │
│     → Demander copie de ses données personnelles            │
│     → Délai réponse: 30 jours maximum                       │
│                                                             │
│  2. DROIT DE RECTIFICATION (حق التصحيح)                    │
│     → Corriger données inexactes ou incomplètes             │
│     → Mise à jour dans les 15 jours de la demande          │
│                                                             │
│  3. DROIT À L'OUBLI (حق النسيان)                           │
│     → Suppression données (sous conditions)                 │
│     → Exceptions: obligations légales, contrats en cours    │
│                                                             │
│  4. DROIT D'OPPOSITION (حق الاعتراض)                       │
│     → S'opposer au traitement pour marketing                │
│     → Limiter certains traitements                          │
│                                                             │
│  5. DROIT À LA PORTABILITÉ (حق النقل)                      │
│     → Recevoir ses données en format structuré              │
│     → Transférer vers un autre prestataire                  │
│                                                             │
│  6. DROIT AU LIMITATION TRAITEMENT (حق تقييد المعالجة)      │
│     → Suspendre traitement sous certaines conditions         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 1.3.3 Obligations d'AlgeriaTrade.dz (التزامات الجزائر تريد)

| Obligation | Description | Mise en Œuvre |
|------------|-------------|--------------|
| **Registre des traitements** | Documenter tous traitements de données | Maintenu par DPO |
| **Notification ANPD** | Déclarer traitements sensibles | Avant mise en production |
| **Analyse d'impact (AIPD)** | Pour traitements à risques élevés | Avant déploiement nouveau module |
| **Sécurité** | Mesures techniques et organisationnelles | Chiffrement, authentification forte |
| **Violation données** | Notifier ANPD sous 72h | Procédure incident sécurité |
| **DPO désigné** | Officier protection données | Contact visible plateforme |

---

### 1.4 Réglementation Commerce Extérieur (Loi 03-01) (تنظيم التجارة الخارجية)

#### 1.4.1 Loi 03-02 du 26 février 2003 (القانون ٠٣-٠١)

Cette loi encadre les opérations d'importation et d'exportation en Algérie.

**Opérations Contrôlées (العمليات الخاضعة للرقابة):**

| Type d'Opération | Autorisation Requise | Organisme Compétent |
|------------------|---------------------|---------------------|
| Import biens consommation courante | Licence import (cas par cas) | Ministère Commerce |
| Import matières premières | Agrément professionnel | Secteur concerné |
| Export hydrocarbures | Licence Sonatrach | Ministère Énergie |
| Export produits agricoles | Certificat ONPPM | Ministère Agriculture |
| Import équipements industriels | Technologie validée | Ministère Industrie |
| Transit marchandises | Autorisation transit | Douanes algériennes |

#### 1.4.2 Documents Commerce Extérieur (مستندات التجارة الخارجique)

```
DOCUMENTATION IMPORT/EXPORT - CHECKLISTE:

IMPORTATION:
├── ☑ Licence d'importation (si requise)
├── ☑ Certificat d'origine (COO)
├── ☑ Facture proforma/finale
├── ☑ Connaissement maritime/Bill of lading
├── ☑ Manifeste cargo
├── ☑ Police assurance transport
├── ☑ Permis sectoriels (si applicable)
├── ☑ Attestation conformité (si produit réglementé)
└── ☑ Preuve origine (rules of origin)

EXPORTATION:
├── ☑ Déclaration export douanière
├── ☑ Certificat d'origine algérien
├── ☑ Facture commerciale export
├── ☑ Liste de colisage (packing list)
├── ☑ Preuve paiement (si advance payment)
├── ☑ Attestation qualité (si requis par client)
└── ☑ Licences export (produits stratégiques)
```

---

### 1.5 Loi Concurrence (قانون المنافسة)

#### 1.5.1 Cadre Concurrentiel (الإطار التنافسي)

| Texte | Objet | Autorité |
|-------|-------|----------|
| Loi 03-03 | Pratiques anticoncurrentielles | Conseil Concurrence |
| Ordonnance 95-06 | Prix et concurrence | Ministère Commerce |
| Réglementation sectorielle | Monopoles publics | Divers régulateurs |

**Pratiques Prohibées (الممارسات المحظورة):**
- Ententes sur prix entre concurrents
- Abus de position dominante
- Pratiques discriminatoires
- Vent liées abusives

**Application B2B Platforme:**
- Détection algorithmique des ententes potentielles
- Monitoring prix anormalement alignés
- Alertes si coordination suspecte détectée

---

### Résumé du Module 1 (ملخص الوحدة الأولى)

**Cadre Législatif Algérien - Points Clés:**

1. 📋 **Code de Commerce 75-59**: Immatriculation RC obligatoire, formes juridiques définies
2. 💰 **Code TVA 76-147**: Trois taux principaux (19%/9%/0%) selon nature bien/service
3. 🔒 **Loi 18-07**: Protection données personnelles style RGPD, droits SUJT étendus
4. 🌍 **Loi 03-01**: Contrôle import/export, documentation douanière
5. ⚖️ **Loi Concurrence**: Surveillance pratiques anticoncurrentielles

**Termes Arabes Essentiels (المصطلحات العربية الأساسية):**

| Français | Arabe | Translittération |
|----------|-------|------------------|
| Conformity | امتثال | Imtilāḥ |
| Taxe sur Valeur Ajoutée | ضريبة القيمة المضافة | Ḍarībat al-Qīma al-Muḍāfa |
| Registre du Commerce | السجل التجاري | al-Sijil at-Tijārī |
| Données Personnelles | البيانات الشخصية | al-Bayānāt ash-Shakhsiyya |
| Sanctions | عقوبات | 'Uqūbāt |
| Import/Export | استيراد/تصدير | Istīrād/Taṣdīr |
| Douane | الجمارك | al-Jumāruk |

---

<a id="module-2"></a>

## Module 2: Utilisation du Compliance Checker
### الوحدة الثانية: استخدام أداة فحص الامتثال

---

### 2.1 Interface du Compliance Checker (واجهة أداة الفحص)

#### 2.1.1 Accès et Navigation (الوصول والتنقل)

**[CAPTURE D'ÉCRAN RÉFÉRENCE: compliance-checker-main.png]**
*Emplacement: Menu Principal > Compliance > Checker*

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚖️ COMPLIANCE CHECKER - ALGERIATRADE.DZ                       [v9.0]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  ENTITÉ À VÉRIFIER                                                │  │
│  │                                                                    │  │
│  │  [Recherche par:]  (●) Nom entreprise  ( ) N° RC  ( ) NIF        │  │
│  │                                                                    │  │
│  │  ┌──────────────────────────────────┐  [🔍 Vérifier]             │  │
│  │  │ Entrez nom ou numéro...          │                             │  │
│  │  └──────────────────────────────────┘                             │  │
│  │                                                                    │  │
│  │  Recherches récentes:                                             │  │
│  │  • Cevital SPA - Vérifié il y a 2h                                │  │
│  │  • Groupe Hamoud SARL - Vérifié hier                              │  │
│  │  • Nouveau fournisseur inconnu                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────┐  ┌──────────────────────────────────────────┐  │
│  │  VÉRIFICATIONS      │  │  TABLEAU DE BORD PERSONNEL               │  │
│  │  RAPIDES            │  │                                          │  │
│  │                     │  │  Pending:  12  │  En cours:  5           │  │
│  │  ├─ Nouveau         │  │  Approuvés: 234  │  Rejetés: 18          │  │
│  │  │  fournisseur     │  │  Alertes:   3   │  Expirant: 7           │  │
│  │  ├─ Transaction     │  │                                          │  │
│  │  │  inhabituelle    │  │  [Voir tout]  [Alertes actives]          │  │
│  │  ├─ Renouvellement  │  │                                          │  │
│  │  │  documents       │  │                                          │  │
│  │  └─ Screening       │  │                                          │  │
│  │     sanctions       │  │                                          │  │
│  └─────────────────────┘  └──────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Barre d'Outils et Actions (شريط الأدوات والإجراءات)

| Action | Icône | Raccourci | Description |
|--------|-------|-----------|-------------|
| Nouvelle vérification | ➕ | `Ctrl+N` | Lancer check complet |
| Historique | 📋 | `Ctrl+H` | Voir vérifications passées |
| Export rapport | 📄 | `Ctrl+E` | PDF/Excel du rapport |
| Partager | 🔗 | `Ctrl+Shift+L` | Lien sécurisé (24h valide) |
| Escalader | ⬆️ | `Ctrl+Shift+E` | Transmettre au senior |
| Approuver | ✅ | `Ctrl+Enter` | Valider conformité |
| Rejeter | ❌ | `Ctrl+Shift+R` | Refuser avec motif |
| Mettre en attente | ⏸️ | `Ctrl+Shift+P` | Besoin informations supplémentaires |

---

### 2.2 Lecture des Scores de Conformité (قراءة درجات الامتثال)

#### 2.2.1 Échelle Globale 0-100 (المقياس العالمي ٠-١٠٠)

**[CAPTURE D'ÉCRAN RÉFÉRENCE: compliance-score-gauge.png]**

Le score de conformité global est calculé sur une échelle de 0 à 100 :

```
ÉCHELLE SCORE CONFORMITÉ GLOBAL:

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   0 ──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬── 100                    │
│       │       │       │       │       │                               │
│   CRITIQUE   FAIBLE  ACCEPTABLE   BON      EXCELLENT                   │
│    🔴        🟠       🟡          🟢        🟢                          │
│                                                                         │
│   0-39      40-59    60-74        75-89     90-100                     │
│                                                                         │
│  Signification:                                                         │
│  ─────────────                                                          │
│  0-39:   Blocage recommandé - Risque significatif                      │
│  40-59:  Attention requise - Vérifications approfondies nécessaires     │
│  60-74:  Acceptable avec réserves - Monitoring renforcé                │
│  75-89:  Bon - Procédure standard                                     │
│  90-100: Excellent - Processus allégé possible                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2.2.2 Score par Module (الدرجة حسب الوحدة)

Le score global est composé de 5 sous-scores correspondant aux modules de conformité :

```
DÉCOMPOSITION SCORE - EXEMPLE:

┌─────────────────────────────────────────────────────────────┐
│  SCORE CONFORMITÉ GLOBAL: 78/100  ████████████████████░░░░  │
│  STATUT: BON ✓                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ COMMERCIAL    │████████████████████│ 85/100  ✅      │   │
│  │ (Code Comm.)  │                    │        OK       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ FISCAL/TVA    │█████████████████░░│ 72/100  ⚠️      │   │
│  │ (Code TVA)    │                    │    VÉRIFIER    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ TRADE         │████████████████████│ 91/100  ✅      │   │
│  │ (Comm. Ext.)  │                    │        OK       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ PRIVACY       │██████████████████░░│ 82/100  ✅      │   │
│  │ (Données)     │                    │        OK       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ SANCTIONS     │████████████████████│ 95/100  ✅      │   │
│  │ (Screening)   │                    │        OK       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  POINT D'ATTENTION:                                        │
│  → Module Fiscal: TVA rate mismatch detected               │
│  → Action: Review invoice line items                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.3 Pondération des Modules (وزن الوحدات)

| Module | Pondération | Justification |
|--------|-------------|---------------|
| Commercial | 20% | Fondamental pour identité partie |
| Fiscal/TVA | 25% | Impact financier et légal direct |
| Trade | 15% | Critique seulement pour opérations extérieures |
| Privacy | 15% | Important RGPD-like, moins critique B2B |
| Sanctions | 25% | Blocage obligatoire si match positif |

---

### 2.3 Breakdown par Module (تفصيل حسب الوحدة)

#### 2.3.1 Module Commercial - Détails (تفاصيل وحدة التجارة)

**[CAPTURE D'ÉCRAN RÉFÉRENCE: commercial-module-detail.png]**

```
MODULE COMMERCIAL - ANALYSE DÉTAILLÉE:
═════════════════════════════════════════════════════════════════

Entité: Groupe SIM SARL
Score Commercial: 85/100

VÉRIFICATIONS EFFECTUÉES:

┌─────────────────────────────────────────────────────────────┐
│ ✅ REGISTRE DU COMMERCE                                    │
│    Numéro: 16A0019876 (Valide)                             │
│    Date extrait: 08/01/2025 (✓ < 30 jours)                │
│    Wilaya: 16 - Alger                                      │
│    Statut: Actif                                           │
│                                                             │
│ ✅ FORME JURIDIQUE                                         │
│    Type: SARL (Cohérent avec activité)                     │
│    Capital: 1,000,000 DZD (≥ minimum 100,000)             │
│                                                             │
│ ✅ SIÈGE SOCIAL                                            │
│    Adresse déclarée: Rue Didouche Mourad, Alger            │
│    Adresse plateforme: Cohérente ✓                         │
│    Géolocalisation: Vérifiée                               │
│                                                             │
│ ✅ DIRIGEANTS                                              │
│    Gérant: Mohamed K. (CNI vérifiée)                       │
│    Pouvoirs: Signature validée                              │
│                                                             │
│ ⚠️ OBJET SOCIAL                                            │
│    Déclaré: Commerce général                                │
│    Activité réelle: Import distribution                    │
│    Note: Compatible mais large                              │
│                                                             │
│ ✅ BÉNÉFICIAIRES EFFECTIFS                                 │
│    Associés déclarés: 3                                    │
│    Transparency: OK                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

POINTS: 85/100 (-15 objet social large, pas pénalisant)
```

#### 2.3.2 Module Fiscal/TVA - Détails (تفاصيل الوحدة الضريبية)

```
MODULE FISCAL/TVA - ANALYSE DÉTAILLÉE:
═════════════════════════════════════════════════════════════════

Score Fiscal: 72/100 ⚠️ ATTENTION REQUISE

┌─────────────────────────────────────────────────────────────┐
│ ✅ IDENTIFICATION FISCALE                                  │
│    NIF: 00161234567890 (Format valide)                     │
│    NIS: 000161234567890 (Format valide)                    │
│    AI: 1612345678 (Format valide)                          │
│    Source: Attestation DGI (validée)                       │
│                                                             │
│ ✅ RÉGIME D'IMPOSITION                                     │
│    Régime: Réel (Cohérent CA prévu)                        │
│    TVA: Assujetti                                         │
│                                                             │
│ ⚠️ TAUX TVA APPLIQUÉS HISTORIQUEMENT                       │
│    ┌──────────────┬────────┬────────┬────────┐             │
│    │ Transaction  │ Taux   │ Attendu│ Status │             │
│    ├──────────────┼────────┼────────┼────────┤             │
│    │ #12345       │ 19%    │ 19%    │ ✅     │             │
│    │ #12346       │ 9%     │ 19%    │ ❌     │             │
│    │ #12347       │ 19%    │ 19%    │ ✅     │             │
│    │ #12348       │ 0%     │ 0%     │ ✅     │             │
│    └──────────────┴────────┴────────┴────────┘             │
│                                                             │
│    ANOMALIE: Transaction #1246 - Taux 9% appliqué           │
│    sur produit normalement à 19%                           │
│    → Investigation requise                                │
│                                                             │
│ ✅ ATTESTATION FISCALE                                     │
│    Validité: 15/06/2025 (✓ En cours de validité)          │
│    Situation: À jour des obligations fiscales              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

POINTS: 72/100 (-28 anomalie taux TVA)
ACTION: Contacter comptabilité + vérifier facture #12346
```

#### 2.3.3 Module Trade Extérieur - Détails (تفاصيل وحدة التجارة الخارجية)

```
MODULE TRADE EXTÉRIEUR - ANALYSE DÉTAILLÉE:
═════════════════════════════════════════════════════════════════

Score Trade: 91/100 ✅

┌─────────────────────────────────────────────────────────────┐
│ OPÉRATIONS DE COMMERCE EXTÉRIEUR DÉTECTÉES:                │
│                                                             │
│  IMPORTATIONS (12 derniers mois):                           │
│  ├── 8 déclarations douanières                              │
│  ├── Valeur totale CIF: 12,450,000 DZD                     │
│  ├── Origines: Chine (60%), France (25%), Turquie (15%)    │
│  └── Produits: Électronique, textile, pièces mécaniques    │
│                                                             │
│  LICENCES ET AUTORISATIONS:                                 │
│  ├── ☑ Licence import générale (valide jusqu' 31/12/2025) │
│  ├── ☑ Agrément ministère secteur (si applicable)          │
│  └── ☐ Certificat conformity (non requis pour ces produits)│
│                                                             │
│  DOCUMENTATION DOUANIÈRE:                                   │
│  ├── Taux de reddition: 98% (bon)                          │
│  ├── Aucun contentieux douanier                            │
│  └── Délais moyens clearance: 3.2 jours (acceptable)       │
│                                                             │
│  PARTENAIRES ÉTRANGERS:                                     │
│  ├── 4 fournisseurs étrangers actifs                        │
│  ├── Screening OFAC/EU: Clean                              │
│  └── Pays à risque: Aucun                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

POINTS: 91/100 (-9 délais customs améliorables)
```

#### 2.3.4 Module Privacy (Données Personnelles) - Détails (تفاصيل وحدة الخصوصية)

```
MODULE PRIVACY - ANALYSE DÉTAILLÉE:
═════════════════════════════════════════════════════════════════

Score Privacy: 82/100 ✅

┌─────────────────────────────────────────────────────────────┐
│ TRAITEMENTS DONNÉES PERSONNELLES:                           │
│                                                             │
│  COLLECTE:                                                  │
│  ├── Consentement obtenu: ✅ Oui (date: 15/01/2025)        │
│  ├── Finalité déclarée: Relations commerciales B2B         │
│  ├── Base légale: Exécution contrat + consentement         │
│  └── Données sensibles: Aucune (catégorie standard)        │
│                                                             │
│  DROITS EXERCÉS:                                            │
│  ├── Demandes d'accès reçues: 2                            │
│  ├── Demandes traitées: 2 (délai moyen: 5 jours)           │
│  ├── Demandes de suppression: 0                             │
│  └── Réclamations: 0                                       │
│                                                             │
│  SÉCURITÉ:                                                  │
│  ├── Chiffrement données: AES-256 activé                   │
│  ├── Accès logs: Conservés 12 mois                          │
│  ├── Violations signalées: Aucune                          │
│  └── Formation personnel: À jour                           │
│                                                             │
│  TRANSFERTS:                                                │
│  ├── Transferts hors Algérie: Non (données locales)        │
│  ├── Sous-traitants: Aucun accès données personnelles      │
│  └── Clauses contractuelles: Présentes                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

POINTS: 82/100 (-18 formation personnel à renouveler Q2)
```

#### 2.3.5 Module Sanctions - Détails (تفصيل وحدة العقوبات)

```
MODULE SANCTIONS SCREENING - ANALYSE DÉTAILLÉE:
═════════════════════════════════════════════════════════════════

Score Sanctions: 95/100 ✅ EXCELLENT

┌─────────────────────────────────────────────────────────────┐
│ SCREENING LISTES SANCTIONS:                                 │
│                                                             │
│  LISTES VÉRIFIÉES (mise à jour: aujourd'hui):              │
│  ├── ☑ OFAC SDN List (USA) - Dernière MAJ: Aujourd'hui    │
│  ├── ☑ EU Consolidated List (UE) - Dernière MAJ: Hier     │
│  ├── ☑ UN Security Council (ONU) - Dernière MAJ: Hier     │
│  └── ☑ Liste Nationale DZ - Dernière MAJ: Semaine dernière│
│                                                             │
│  RÉSULTATS SCREENING:                                       │
│  ┌────────────────┬────────┬──────────┬──────────┐         │
│  │ Liste          │ Match  │ Score    │ Résultat │         │
│  ├────────────────┼────────┼──────────┼──────────┤         │
│  │ OFAC SDN       │ None   │ 0%       │ ✅ CLEAN │         │
│  │ EU Consolidated│ None   │ 0%       │ ✅ CLEAN │         │
│  │ UN Security    │ None   │ 0%       │ ✅ CLEAN │         │
│  │ National DZ    │ None   │ 0%       │ ✅ CLEAN │         │
│  └────────────────┴────────┴──────────┴──────────┘         │
│                                                             │
│  PEP (Politically Exposed Persons):                         │
│  ├── Screening PEP: Effectué                                │
│  ├── Match: Aucun                                          │
│  └── Risk Level: Minimal                                   │
│                                                             │
│  ADRESSES ET ENTITTES LIÉES:                                │
│  ├── Adresses vérifiées: 3                                 │
│  ├── Entités liées: 2 (filiales)                           │
│  ├── Screening étendu: Clean                               │
│  └── Media/adverse news: Aucun résultat négatif           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

POINTS: 95/100 (-5 routine, score parfait rare)
```

---

### 2.4 Niveaux de Gravité des Violations (مستويات خطورة الانتهاكات)

#### 2.4.1 Classification des Violations (تصنيف الانتهاكات)

| Niveau | Code Couleur | Score Impact | Exemple | Délai Réponse |
|--------|-------------|-------------|---------|--------------|
| **CRITIQUE** | 🔴 Rouge | -50 à -100 | Match sanction, fraude avérée | Immédiat (< 1h) |
| **MAJEUR** | 🟠 Orange | -25 à -49 | Document falsifié, TVA grave erreur | < 24 heures |
| **MODÉRÉ** | 🟡 Jaune | -10 à -24 | Document expiré, incohérence mineure | < 72 heures |
| **MINEUR** | 🔵 Bleu | -1 à -9 | Format incorrect, information manquante | < 7 jours |
| **INFO** | ⚪ Blanc | 0 | Observation, recommandation | Prochaine revue |

#### 2.4.2 Matrice de Réponse par Sévérité (مصفوفة الاستجابة حسب الخطورة)

```
MATRICE ACTION PAR NIVEAU VIOLATION:

┌─────────────────────────────────────────────────────────────┐
│  🔴 VIOLATION CRITIQUE                                     │
│  ─────────────────────────────────────────────────────────  │
│  Actions immédiates:                                        │
│  1. SUSPENDRE transaction/partie en cours                   │
│  2. Notifier Compliance Manager + Direction                 │
│  3. Documenter thoroughly (screenshots, preuves)            │
│  4. Ne PAS prendre contact avec l'entité soupçonnée        │
│  5. Escalader aux autorités si requis (CTF, ANPD, etc.)   │
│                                                             │
│  Délai max intervention: 1 HEURE                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🟠 VIOLATION MAJEURE                                       │
│  ─────────────────────────────────────────────────────────  │
│  Actions requises:                                          │
│  1. Marquer dossier "Attention élevée"                      │
│  2. Demander corrections/explications à l'entité            │
│  3. Limiter transactions pendant investigation              │
│  4. Assigner à Senior Compliance pour review                │
│  5. Planifier audit approfondi                              │
│                                                             │
│  Délai max intervention: 24 HEURES                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🟡 VIOLATION MODÉRÉE                                       │
│  ─────────────────────────────────────────────────────────  │
│  Actions requises:                                          │
│  1. Notifier entité (email automatique possible)            │
│  2. Demande de régularisation (délai 14 jours)             │
│  3. Suivi dans file active                                 │
│  4. Pas de blocage mais monitoring renforcé                 │
│                                                             │
│  Délai max intervention: 72 HEURES                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔵 VIOLATION MINEURE                                       │
│  ─────────────────────────────────────────────────────────  │
│  Actions requises:                                          │
│  1. Note interne au dossier                                 │
│  2. Notification lors prochain contact                      │
│  3. Correction à la prochaine opportunité                   │
│                                                             │
│  Délai max intervention: 7 JOURS                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.5 Workflow de Validation Documentaire (سير العمل للتحقق من المستندات)

#### 2.5.1 Processus de Validation (عملية التحقق)

**[CAPTURE D'ÉCRAN RÉFÉRENCE: document-validation-workflow.png]**

```
WORKFLOW VALIDATION DOCUMENTS CONFORMITÉ:

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ SOUMISSION│ → │  OCR &   │ → │ VERIF    │ → │ DECISION │
│ DOCUMENT │    │ EXTRACTION│   │ AUTO     │   │         │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      ↓               ↓              ↓              ↓
  Utilisateur     IA lit         Règles        Humain
  upload fichier  contenu        appliquées     confirme
                  (texte,        (dates,
                   dates,        formats,
                   montants)     cohérence)

ÉTAPES DÉTAILLÉES:

ETAPE 1: SOUMISSION
├── Formats acceptés: PDF, JPG, PNG (max 10Mo)
├── Types: RC, NIF, passeport, statutes, etc.
├── Upload: Drag & drop ou sélection fichier
└── Hash stocké pour intégrité

ETAPE 2: OCR & EXTRACTION (automatique)
├── Reconnaissance texte (arabe + français)
├── Extraction champs clés:
│   ├── Numéros (RC, NIF, dates)
│   ├── Noms (entreprise, dirigeants)
│   ├── Montants (capital)
│   └── Adresses
├── Score confiance OCR affiché
└── Si OCR faible → flag pour revue manuelle

ETAPE 3: VÉRIFICATION AUTOMATIQUE
├── Format validation (regex patterns)
├── Date checks (péremption, fraîcheur)
├── Cross-reference bases de données
├── Calcul score conformité partiel
└── Flag anomalies détectées

ETAPE 4: DÉCISION HUMAINE
├── Review résultats automatisés
├── Validation/rejet/modification
├── Ajout notes commentaires
├── Approbation finale
└── Audit trail complet conservé
```

#### 2.5.2 Checkliste Validation par Type de Document (قائمة التحقق حسب نوع المستند)

| Document | Champs à Vérifier | Erreurs Courantes | Action si Problème |
|----------|------------------|-------------------|-------------------|
| **Extrait RC** | N° RC, date, statut, adresse, gérant | Date > 30j, photocopie illisible | Demander nouveau |
| **Attestation NIF** | NIF valide, date validité, nom cohérent | NIF erroné, expiré | Vérifier DGI |
| **Statuts** | Forme juridique, capital, objet, associés | Version ancienne | Demander MAJ notariée |
| **CNI Passeport** | Numéro, date expiration, photo | Expiré, mauvais format | Nouveau document |
| **Facture** | N° facture, TVA, montant, TVA correcte | Taux erroné, sans timbre | Refuser, corriger |
| **Licence import** | N° licence, produits couverts, validité | Hors périmètre, expirée | Vérifier ministère |

---

### Résumé du Module 2 (ملخص الوحدة الثانية)

**Points Clés à Retenir:**

1. 🔍 Le Compliance Checker centralise toutes les vérifications en un outil
2. 📊 Le score 0-100 reflète la conformité globale (sous-scores par module)
3. 🚨 Les violations sont classées par sévérité (Critique → Mineure)
4. 📋 La validation documentaire combine OCR automatique + revue humaine
5. ⏱️ Les délais de réponse varient selon le niveau de gravité

**Raccourcis Clavier (اختصارات لوحة المفاتيح):**

| Action | Raccourci |
|--------|-----------|
| Nouvelle vérification | `Ctrl+N` |
| Historique | `Ctrl+H` |
| Export rapport | `Ctrl+E` |
| Approuver | `Ctrl+Enter` |
| Rejeter | `Ctrl+Shift+R` |
| Escalader | `Ctrl+Shift+E` |

---

<a id="module-3"></a>
## Module 3: Conformité Fiscale TVA
### الوحدة الثالثة: الامتثال الضريبي ضريبة القيمة المضافة

---

### 3.1 Application Correcte des Taux TVA (التطبيق الصحيح لأسعار الضريبة)

#### 3.1.1 Arbre de Décision Taux TVA (شجرة قرار سعر الضريبة)

**[CAPTURE D'ÉCRAN RÉFÉRENCE: tva-decision-tree.png]**

```
ARBRE DÉCISION - QUEL TAUX TVA APPLIQUER?

START: Quel type de produit/service?
         │
         ├─→ BIEN/SERVICE STANDARD (non listé ci-dessous)
         │     └─→ TAUX: 19% (taux normal)
         │
         ├─→ PRODUIT ALIMENTAIRE?
         │     ├─→ De base (farine, huile, lait, sucre, semoule)?
         │     │     └─→ TAUX: 9%
         │     └─→ De luxe/confiserie/chocolat/boissons sucrées?
         │           └─→ TAUX: 19%
         │
         ├─→ MÉDICAMENT OU PRODUIT PHARMACEUTIQUE?
         │     └─→ TAUX: 9%
         │
         ├─→ PRODUIT AGRICOLE?
         │     ├─→ Frais (fruits, légumes non transformés)?
         │     │     └─→ TAUX: 9%
         │     └─→ Intrant agricole (engrais, pesticides)?
         │           └─→ TAUX: 0% (exonéré)
         │
         ├─→ LIVRE OU FOURNITURE SCOLAIRE?
         │     └─→ TAUX: 9%
         │
         ├─→ EXPORTATION (client hors Algérie)?
         │     └─→ TAUX: 0% (exonéré)
         │
         ├─→ TRANSPORT INTERNATIONAL?
         │     └─→ TAUX: 0% (exonéré)
         │
         └─→ SERVICE NUMÉRIQUE (SaaS, Cloud)?
               └─→ TAUX: 19% (interprétation DGI)
```

#### 3.1.2 Cas Particiers et Exceptions (حالات خاصة واستثناءات)

| Situation | Taux TVA | Condition | Référence |
|-----------|----------|-----------|-----------|
| Vente à une ambassade | Exonéré | Accord diplomatique | Convention Vienna |
| Livraison zone franche | Exonéré | Documentation zone | Loi zones franches |
| Réimportation après export | Exonéré | Preuve export initial | Code TVA art. |
| Occasion (biens usagés) | Sur marge | Particulier→professionnel | Pratique DGI |
| Autoconsommation | TVA récupérable | Livraison à soi-même | Code TVA art. |
| Échantillons gratuits | TVA applicable | Valeur déclarée | Pratique DGI |

---

### 3.2 Checklist Validation Facture (قائمة التحقق من الفاتورة)

#### 3.2.1 Éléments Obligatoires d'une Facture (العناصر الإلزامية للفاتورة)

**Référence: Article du Code TVA + Arrêté Ministériel Facturation**

```
CHECKLISTE FACTURE CONFORME TVA - ALGÉRIE:

┌─────────────────────────────────────────────────────────────┐
│  ✅ MENTIONS OBLIGATOIRES FACTURE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IDENTIFICATION VENDEUR:                                    │
│  ├── ☑ Nom ou raison sociale complète                      │
│  ├── ☑ Numéro RC (Registre Commerce)                       │
│  ├── ☑ NIF (Numéro Identification Fiscale)                 │
│  ├── ☑ NIS (Numéro Identification Statistique)             │
│  ├── ☑ AI (Artificial Identifiant)                         │
│  ├── ☑ Adresse postale complète                            │
│  └── ☑ Coordonnées bancaires (si paiement par virement)    │
│                                                             │
│  IDENTIFICATION ACHETEUR:                                   │
│  ├── ☑ Nom ou raison sociale                                │
│  ├── ☑ NIF acheteur (obligatoire si assujetti TVA)         │
│  └── ☑ Adresse (si différente livraison)                   │
│                                                             │
│  DÉTAILS TRANSACTION:                                       │
│  ├── ☑ Numéro de facture (unique et séquentiel)            │
│  ├── ☑ Date de la facture                                  │
│  ├── ☑ Date de la livraison (si différente)                │
│  ├── ☑ Désignation détaillée produits/services             │
│  ├── ☑ Quantité par ligne                                  │
│  ├── ☑ Prix unitaire hors taxes                             │
│  ├── ☑ Taux TVA par ligne (ou mention "TVA non applicable")│
│  ├── ☑ Montant TVA par ligne                               │
│  ├── ☑ Total hors taxes (HT)                               │
│  ├── ☑ Total TVA                                          │
│  ├── ☑ Total toutes taxes comprises (TTC)                  │
│  └── ☑ Devise (si pas DZD) + taux change utilisé          │
│                                                             │
│  ÉLÉMENTS ADDITIONNELS RECOMMANDÉS:                         │
│  ├── ☑ Conditions de vente (paiement, livraison)           │
│  ├── ☑ Références bon commande/devis                       │
│  ├── ☑ Timbre fiscal (si physique)                         │
│  └── ☑ Signature/cachet (si facture papier)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Erreurs Courantes sur Factures (أخطاء شائعة في الفواتير)

| Erreur | Fréquence | Conséquence | Correction |
|--------|-----------|-------------|------------|
| Taux TVA erroné | Très fréquente | Redressement fiscal | Recalculer, facture rectificative |
| NIF manquant acheteur | Fréquente | Non-déductibilité TVA | Compléter facture |
| Sans timbre fiscal | Modérée | Amende mineure | Apposer timbre |
| Double facturation | Rare | Litige, redressement | Annuler duplicata |
| HT/TTC confondu | Fréquente | TVA impayée | Clarifier montants |
| Date future/impossible | Rare | Facture invalide | Corriger date |
| Absence numéro séquentiel | Modérée | Difficulté comptabilité | Numéroter correctement |

---

### 3.3 Régimes de Déclaration (أنظمة الإعلان)

#### 3.3.1 Régime Mensuel vs Trimestriel (النظام الشهري مقابل ربع سنوي)

| Critère | Régime Mensuel | Régime Trimestriel |
|----------|---------------|-------------------|
| **Seuil CA annuel** | > 30,000,000 DZD | ≤ 30,000,000 DZD |
| **Déclaration TVA** | Chaque mois avant le 21ème | Chaque trimestre avant le 21ème |
| **Versement** | Mensuel | Trimestriel |
| **Option possible** | Oui (volontaire) | Par défaut si seuil respecté |
| **Accomptes provisionnels** | Non requis | Peut être requis |

**Détermination du régime:**

```
COMMENT SAVOIR LE RÉGIME D'UN FOURNISSEUR?

1. Vérifier l'attestation fiscale (mentionne le régime)
2. Demander directement au fournisseur
3. Consulter portail DGI (si accès)
4. Observer les factures précédentes (périodicité TVA indiquée)

⚠️ IMPORTANT: Le régime du vendeur n'affecte pas votre déduction TVA
   en tant qu'acheteur, tant que la facture est conforme.
```

#### 3.3.2 Calendrier Déclaratif (تقويم الإعلانات)

```
CALENDRIER TVA 2025 - DATES CLÉS:

MOIS       LIMITE DÉCLARATION MENSUELLE  LIMITE DÉCLARATION TRIMESTRIELLE
───────────────────────────────────────────────────────────────────────────
Janvier    21 février 2025               -
Février    21 mars 2025                  -
Mars       21 avril 2025                 21 avril 2025 (Q1)
Avril      21 mai 2025                   -
Mai        21 juin 2025                  -
Juin       21 juillet 2025               21 juillet 2025 (Q2)
Juillet    21 août 2025                  -
Août       21 septembre 2025             -
Septembre  20 octobre 2025*              20 octobre 2025 (Q3)
Octobre    21 novembre 2025              -
Novembre   21 décembre 2025              -
Décembre   20 janvier 2026*             20 janvier 2026* (Q4)

* = Date ajustée si tombe weekend/férié
```

---

### 3.4 Retenue à la Source (الاقتطاع من المصدر)

#### 3.4.1 Taux de Retenue Applicables (أسعار الاقتطاع المطبقة)

| Situation | Taux Retenue | Base de Calcul | Référence Légale |
|-----------|-------------|---------------|------------------|
| **Prestation service local** | 24% | Montant HT | Art. IRG Code Impôts Directs |
| **Prestation service non-résident** | 24% | Montant brut | Convention fiscale |
| **Honoraires, commissions** | 24% | Montant brut | Art. IRG |
| **Cession droit bail, redevances** | 24% | Montant brut | Art. IRG |
| **Dividendes** | 10% | Montant brut | Art. IBS |
| **Intérêts bancaires | 10% | Montant intérêt | Art. IRG |
| **Importation (droits douane)** | Selon tarif douanier | Valeur douane | Code douanier |

#### 3.4.2 Mécanisme Retenue à la Source (آلية الاقتطاع من المصدر)

```
CALCUL RETENUE À LA SOURCE - EXEMPLE PRATIQUE:

SCÉNARIO: Prestation service consultant local

Facture consultant: 500,000 DZD (HT)
TVA (19%): 95,000 DZD
Total TTC: 595,000 DZD

RETENUE IRG À EFFECTUER:
├── Base retenue: 500,000 DZD (montant HT)
├── Taux: 24%
├── Montant retenu: 120,000 DZD
└── Net à payer: 475,000 DZD (+ TVA 95,000 = 570,000 DZD)

FACTURATION CORRECTE:
┌─────────────────────────────────────────────┐
│ Montant HT:        500,000 DZD             │
│ TVA (19%):           95,000 DZD             │
│ Retenue IRG (24%):  120,000 DZD            │
│ NET À PAYER:        475,000 DZD             │
│ TOTAL TTC:          570,000 DZD             │
└─────────────────────────────────────────────┘

OBLIGATIONS ACHETEUR (reteneur):
1. Déclarer la retenue (bulletin n°...)
2. Verser au Trésor dans les 30 jours
3. Remettre attestation de versement au fournisseur
```

---

### 3.5 Erreurs Courantes et Comment les Éviter (أخطاء شائعة وكيفية تجنبها)

#### 3.5. Top 10 Erreurs TVA (أعلى 10 أخطاء ضريبية)

| # | Erreur | Impact | Prévention |
|---|--------|--------|------------|
| 1 | Mauvais taux TVA appliqué | Redressement + pénalités | Utiliser tableau décisionnel |
| 2 | TVA non déduite alors que possible | Perte financière | Vérifier éligibilité |
| 3 | Facture sans mentions obligatoires | Rejet déduction | Checklist systématique |
| 4 | Confusion HT/TTC | Sous-paiement TVA | Formation comptable |
| 5 | Oubli TVA sur importation | Douane + TVA | Rappel procédure |
| 6 | TVA reversée en retard | Pénalités de retard | Calendrier rigoureux |
| 7 | Mauvais régime déclaré | Contrôle fiscal | Vérifier seuils |
| 8 | Retenue source non effectuée | Responsabilité solidaire | Automatisation paie |
| 9 | Non-respect territorialité | TVA indue | Analyse opération |
| 10 | Documentation insuffisante | Rejet en cas contrôle | Archivage complet |

#### 3.5.2 Bonnes Pratiques TVA (الممارسات الجيدة للضريبة)

```
BONNES PRATIQUES - CONFORMITÉ TVA:

QUOTIDIEN:
├── Vérifier taux TVA avant émission facture
├── Utiliser modèle facture conforme (template validé)
├── Conserver preuves de toutes transactions
└── Former nouveaux employés processus TVA

HEBDOMADAIRE:
├── Réconcilier TVA collectée vs déclarée
├── Vérifier factures fournisseurs (mentions complètes?)
├── Suivre les crédits de TVA
└── Review anomalies détectées par système

MENSUELLEMENT/TRIMESTRIELLEMENT:
├── Préparer déclaration en avance (pas last minute)
├── Faire revue croisée (deuxième personne)
├── Archiver déclaration + justificatifs
└── Analyser écarts vs période précédente

ANNUELLEMENT:
├── Audit interne conformité TVA
├── Former/mettre à jour équipe
├── Review processus suite à changements législatifs
└── Préparer documentation contrôle fiscal potentiel
```

---

### Résumé du Module 3 (ملخص الوحدة الثالثة)

**Conformité TVA - Points Clés:**

1. 💰 Trois taux principaux: 19% (normal), 9% (réduit), 0% (exonéré)
2. 📋 La facture doit contenir toutes mentions obligatoires pour être valide
3. 📅 Le régime (mensuel/trimestriel) dépend du chiffre d'affaires (>30M DZD = mensuel)
4. 💳 La retenue à la source (24%) s'applique aux prestations de services
5. ✅ La prévention des erreurs passe par des checklists et la formation

---

<a id="module-4"></a>
## Module 4: Screening des Sanctions
### الوحدة الرابعة: فحص العقوبات

---

### 4.1 Compréhension des Scores de Risque (فهم درجات المخاطر)

#### 4.1.1 Niveaux de Match (مستويات المطابقة)

Le screening des sanctions compare les entités contre plusieurs listes et attribue un niveau de correspondance :

```
NIVEAUX DE MATCH - SCREENING SANCTIONS:

┌─────────────────────────────────────────────────────────────┐
│  ÉCHELLE DE CORRESPONDANCE (MATCH LEVELS)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔴 EXACT MATCH (Correspondance Exacte)                    │
│  ─────────────────────────────────────────────────────────  │
│  Score: 100%                                               │
│  Signification: L'entité est IDENTIQUE à une liste sanction │
│  Action: BLOQUAGE IMMÉDIAT - Interdiction de traiter      │
│  Exemple: "Mohamed Ben Ali" = "Mohamed Ben Ali" même date  │
│                                                             │
│  🟠 HIGH PROBABILITY MATCH (Probabilité Élevée)            │
│  ─────────────────────────────────────────────────────────  │
│  Score: 75-99%                                              │
│  Signification: Forte probabilité qu'il s'agit de la même  │
│             personne/entity avec variations mineures       │
│  Action: BLOQUAGE + INVESTIGATION APPROFONDIE obligatoire  │
│  Exemple: "M. Ben Ali" vs "Mohamed Benali" (même DOB)      │
│                                                             │
│  🟡 MEDIUM PROBABILITY MATCH (Probabilité Moyenne)         │
│  ─────────────────────────────────────────────────────────  │
│  Score: 40-74%                                              │
│  Signification: Similarités mais ambiguïtés significatives │
│  Action: PAUSE + Revue manuelle requise                    │
│  Exemple: "M. Ali" vs "Mohamed Ben Ali" (nom commun)       │
│                                                             │
│  🟢 LOW PROBABILITY MATCH (Probabilité Faible)             │
│  ─────────────────────────────────────────────────────────  │
│  Score: 1-39%                                               │
│  Signification: Quelques similarités mais très probablement│
│             pas la même personne                           │
│  Action: Documenter + Continuer avec surveillance          │
│  Exemple: "Ahmed Ali" vs "Mohamed Ben Ali" (différent)     │
│                                                             │
│  ⚪ NO MATCH (Pas de Correspondance)                        │
│  ─────────────────────────────────────────────────────────  │
│  Score: 0%                                                  │
│  Signification: Aucune similarité significative            │
│  Action: CLEAR - Procéder normalement                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Facteurs Influençant le Score (العوامل المؤثرة على الدرجة)

| Facteur | Poids | Exemple |
|---------|-------|---------|
| **Nom exact** | 35% | "Benmouna" = "Benmouna" |
| **Variation phonétique** | 15% | "Ben Moussa" ≈ "Bin Musa" |
| **Date de naissance** | 20% | DOB identique = fort signal |
| **Nationalité** | 10% | Même pays = renforce |
| **Adresse** | 10% | Adresse similaire = indice |
| **Alias/AKA** | 10% | Nom alternatif connu |

---

### 4.2 Identification des Faux Positifs (تحديد الإيجابيات الكاذبة)

#### 4.2.1 Causes Courantes de Faux Positifs (أسباب شائعة للإيجابيات الكاذبة)

Un faux positif survient quand le système signale un match qui n'est pas réellement une sanctioned entity.

| Cause | Exemple | Fréquence | Résolution |
|-------|---------|-----------|------------|
| **Nom commun** | "Mohamed Ali" - des milliers en Algérie | Très fréquent | Documents ID supplémentaires |
| **Homonyme parfait** | Même nom, personne différente | Fréquent | Date lieu naissance |
| **Variation transcription** | "Ben" vs "Bin" vs "Ibn" | Occasionnel | Règles de matching ajustées |
| **Nom marital/famille** | Changement nom après mariage | Occasionnel | Documents justificatifs |
| **Traduction** | Nom arabe translittéré différemment | Fréquent | Multiple spellings |
| **Erreur liste** | Entrée incorrecte sur liste sanction | Rare | Signaler à l'autorité |

#### 4.2.2 Procédure de Résolution Faux Positif (إجراء حل الإيجابي الكاذب)

```
WORKFLOW RÉSOLUTION FAUX POSITIF:

┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: COLLECTE PREUVES                                  │
│  ─────────────────────────────────────────────────────────  │
│  Documents à obtenir de l'entité:                           │
│  ├── Passeport ou CNI (pages pertinentes)                  │
│  ├── Justificatif domicile (facture utils < 3 mois)        │
│  ├── Attestation travail/activité                           │
│  ├── Etat civil (si nom changé)                             │
│  └── Tout document prouvant identité distincte              │
│                                                             │
│  ÉTAPE 2: ANALYSE COMPARATIVE                               │
│  ─────────────────────────────────────────────────────────  │
│  Comparer point par point:                                  │
│  ├── Nom complet: Différences?                             │
│  ├── Date naissance: Identique ou différent?               │
│  ├── Lieu naissance: Même ville/pays?                      │
│  ├── Nationalité: Différente?                              │
│  ├── Adresse: Différente?                                  │
│  └── Profession/secteur: Contexte différent?               │
│                                                             │
│  ÉTAPE 3: DÉCISION ET DOCUMENTATION                         │
│  ─────────────────────────────────────────────────────────  │
│  Si faux positif confirmé:                                  │
│  ├── Documenter raisonnement dans dossier                   │
│  ├── Approuver transaction                                 │
│  ├── Ajouter whitelist (si approprié et approuvé)          │
│  └── Conserver preuves 5 ans (audit trail)                 │
│                                                             │
│  ÉTAPE 4: REPORTING (si requis)                             │
│  ─────────────────────────────────────────────────────────  │
│  Certaines juridictions exigent reporting des FP résolus   │
│  → Vérifier obligation locale                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.3 Workflow de Résolution (سير العمل للحل)

#### 4.3.1 Options de Décision (خيارات القرار)

Pour chaque alerte de screening, quatre décisions possibles :

```
OPTIONS DE DÉCISION - ALERT SCREENING:

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1️⃣  BLOCK (BLOQUER)                                      │
│  ─────────────────────────────────────────────────────────  │
│  Utilisation: Match exact ou high probability confirmé     │
│  Conséquence: Transaction impossible, entité blacklistée   │
│  Approbation requise: Senior Compliance ou Compliance Mgr  │
│  Reporting: Obligatoire aux autorités (selon seuils)      │
│                                                             │
│  2️⃣  APPROVE (APPROUVER - VRAIS POSITIF RÉSOLU)          │
│  ─────────────────────────────────────────────────────────  │
│  Utilisation: Faux positif documenté et prouvé             │
│  Conséquence: Transaction autorisée, dossier clos          │
│  Approbation requise: Senior Compliance                    │
│  Documentation: Complète et archivée                        │
│                                                             │
│  3️⃣  FALSE POSITIVE (FAUX POSITIF)                        │
│  ─────────────────────────────────────────────────────────  │
│  Utilisation: Match infirmé par preuves                    │
│  Conséquence: Transaction autorisée, ajout whitelist       │
│  Approbation requise: Senior Compliance                    │
│  Documentation: Preuves conservées, motif documenté         │
│                                                             │
│  4️⃣  ESCALADER (ESCALADE)                                 │
│  ─────────────────────────────────────────────────────────  │
│  Utilisation: Cas complexe, incertitude élevée             │
│  Conséquence: Transmission à niveau supérieur / expert     │
│  Délai cible: Selon urgence (max 24h pour cas standards)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Matrice d'Autorisation (مصفوفة التفويض)

| Type de Match | Opérateur | Senior | Manager | Directeur |
|---------------|-----------|--------|---------|-----------|
| No Match | ✅ Approve | - | - | - |
| Low Probability | ✅ Approve | - | - | - |
| Medium Probability | ⏸️ Pause | ✅ Approve | - | - |
| High Probability | ❌ Block | 👁️ Review | ✅ Approve | - |
| Exact Match | ❌ Block | ❌ Block | 👁️ Review | ✅ Decide |
| PEP Match | ⏸️ Pause | ⏸️ Pause | ✅ Approve | - |
| Government Official | ⏸️ Pause | ⏸️ Pause | ✅ Approve | - |

---

### 4.4 Obligations de Reporting Réglementaire (التزامات الإبلاغ التنظيمي)

#### 4.4.1 Transactions à Déclarer (المعاملات المعلنة)

Certaines transactions doivent être déclarées aux autorités algériennes et/ou internationales :

| Type de Transaction | Seuil | Autorité | Délai |
|--------------------|-------|----------|-------|
| **Suspicion blanchiment** | Quelque montant | CTIF (Cellule Traitement Info Financière) | Immédiat |
| **Transaction sanctionnée bloquée** | Tout montant | Ministère Finances / Banque d'Algérie | 24-72h |
| **Opération suspecte** | ≥ 100,000 USD équivalent | CTIF | 24h |
| **Transfert frontieres** | ≥ seuil change | Banque d'Algérie | Selon règles |
| **Match OFAC confirmé** | Tout montant | OFAC (via autorité locale) | Selon exigences |

#### 4.4.2 Formulaire de Reporting Interne (نموذج الإبلاغ الداخلي)

```
FORMULAIRE REPORTING SANCTIONS - ALGERIATRADE.DZ:

┌─────────────────────────────────────────────────────────────┐
│  RAPPORT D'INCIDENT SANCTIONS                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REFÉRENCE: SAN-2025-XXXX                                   │
│  DATE: __/__/______  HEURE: ____:____                       │
│                                                             │
│  SECTION 1: ENTITÉ CONCERNÉE                                │
│  ├── Nom: ____________________________________            │
│  ├── Type: ( ) Personne Physique ( ) Personne Morale        │
│  ├── Nationalité: _____________________________             │
│  ├── N° ID: ____________________________________           │
│  └── Adresse: ___________________________________          │
│                                                             │
│  SECTION 2: NATURE DE L'ALERTE                              │
│  ├── Liste source: ( ) OFAC ( ) EU ( ) UN ( ) National DZ   │
│  ├── Niveau match: ( ) Exact ( ) High ( ) Med ( ) Low      │
│  ├── Entrée liste: _________________________________        │
│  └── Score: _____/100                                      │
│                                                             │
│  SECTION 3: TRANSACTION CONCERNÉE                           │
│  ├── Montant: ___________________________________         │
│  ├── Devise: _________________________________              │
│  ├── Nature: ____________________________________          │
│  ├── Contrepartie: _______________________________          │
│  └── Date prévue: _________________________________         │
│                                                             │
│  SECTION 4: DÉCISION PRISE                                  │
│  ├── ( ) BLOCK - Transaction bloquée                       │
│  ├── ( ) APPROVE - Faux positif documenté                  │
│  ├── ( ) ESCALADÉ - En attente décision supérieure         │
│  └── Motif: ____________________________________           │
│                                                             │
│  SECTION 5: REPORTING EXTERNE (si applicable)               │
│  ├── ( ) Reporté à CTIF: Date: ________                    │
│  ├── ( ) Reporté Banque DZ: Date: ________                 │
│  ├── ( ) Autre autorité: ______________________________     │
│  └── Référence externe: _________________________           │
│                                                             │
│  SIGNATURES:                                                │
│  Opérateur: _________________ Date: ________               │
│  Validateur: ________________ Date: ________               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.5 Différences entre Listes (الاختلافات بين القوائم)

#### 4.5.1 Comparaison des Sources de Listes (مقارنة مصادر القوائم)

| Caractéristique | **OFAC (USA)** | **Union Européenne** | **ONU (UN)** | **Liste Nationale DZ** |
|-----------------|---------------|---------------------|--------------|----------------------|
| **Autorité émettrice** | US Treasury | Conseil UE | Secrétaire UN | Gouvernement DZ |
| **Portée** | Mondiale (juridiction US) | Territoire UE | Mondiale | Nationale |
| **Types de sanctions** | Blocage assets, interdiction commerce | Blocage, restrictions | Embargo, blocage | Variées |
| **Mise à jour** | Quotidienne | Hebdomadaire | Régulière | Variable |
| **Juridiction DZ** | Indirecte (secondary sanctions) | Via accords | Obligatoire membre ONU | Directe |
| **Priorité screening** | Haute (impact international) | Haute (partenaires UE) | Obligatoire | Obligatoire |

#### 4.5.2 Spécificités Liste Nationale Algérienne (خصائص القائمة الوطنية الجزائرية)

```
LISTE NATIONALE DES SANCTIONS - ALGÉRIE:

Base légale:
├── Décrets présidentiels (sanctions spécifiques)
├── Arrêtés ministériels (finance, commerce)
├── Instructions Banque d'Algérie
└── Résolutions ONU ratifiées (transposition)

Catégories typiquement incluses:
├── Personnes/entities soutenant terrorisme
├── Blanchiment d'argent
├── Corruption haute gravité
├── Violations embargo international
└── Menaces sécurité nationale

Particularités:
├── Moins de ressources publiques que OFAC/EU
├── Mise à jour parfois moins fréquente
├── Focus géopolitique régional (Sahel, Maghreb)
└── Coordination avec CTF (Comité Terrorisme Financement)

ACCÈS LISTE NATIONALE:
├── Via portail gouvernemental officiel
├── Demande formelle aux autorités compétentes
├── Abonnement services privés agréés
└── Intégration AlgeriaTrade.dz (automatique)
```

---

### Résumé du Module 4 (ملخص الوحدة الرابعة)

**Screening Sanctions - Points Clés:**

1. 🎯 5 niveaux de match: Exact, High, Medium, Low, No Match
2. 🔴 Un match Exact ou High exige un blocage immédiat
3. ✅ Les faux positifs doivent être documentés avec preuves
4. 📝 Certaines situations exigent un reporting aux autorités (CTIF)
5. 🌍 Plusieurs listes coexistent: OFAC, EU, ONU, Nationale DZ

---

<a id="module-5"></a>
## Module 5: Gestion Documentaire
### الوحدة الخامسة: إدارة المستندات

---

### 5.1 Documents Requis par Type d'Entity (المستندات المطلوبة حسب نوع الكيان)

#### 5.1.1 Matrice Complète des Documents (مصفوفة المستندات الكاملة)

**[CAPTURE D'ÉCRAN RÉFÉRENCE: document-matrix-by-entity.png]**

```
MATRICE DOCUMENTS PAR TYPE D'ENTITÉ:
═════════════════════════════════════════════════════════════════

                         │ ENTREPRISE │ ARTISAN │ ASSOCIATION │ ADMIN │
                         │  ALGÉRIENNE │         │    ONG     │PUBLIQUE│
─────────────────────────┼───────────┼─────────┼─────────────┼────────┤
CODE COMMERCE:            │           │         │             │        │
├─ Extrait RC             │    OBL    │    OBL  │     OBL     │   OBL  │
├─ Statuts                │    OBL    │    OPT  │     OBL     │   N/A  │
├─ PV AG/Gérance          │    OBL    │    OPT  │     OBL     │   OBL  │
├─ Registres bénéficiaires│    OBL    │    N/A  │     OBL     │   N/A  │
                         │           │         │             │        │
FISCAL:                   │           │         │             │        │
├─ Attestation NIF/NIS/AI │    OBL    │    OBL  │     OBL     │   OBL  │
├─ Attestation régularité │    OBL    │    OBL  │     OBL     │   OBL  │
├─ Bilans (si grand)      │    CND    │    N/A  │     OBL     │   OBL  │
                         │           │         │             │        │
IDENTITÉ:                 │           │         │             │        │
├─ CNI Dirigeants         │    OBL    │    OBL  │     OBL     │   OBL  │
├─ Passeport (étranger)   │    CND    │    CND  │     CND     │   N/A  │
├─ Attestation hébergement │    CND    │    CND  │     CND     │   N/A  │
                         │           │         │             │        │
ACTIVITÉ SPÉCIFIQUE:      │           │         │             │        │
├─ Licence professionnelle│    CND    │    OBL  │     N/A     │   OBL  │
├─ Agrément ministère     │    CND    │    N/A  │     CND     │   OBL  │
├─ Autorisation spéciale  │    CND    │    CND  │     CND     │   CND  │
├─ Certification ISO      │    OPT    │    OPT  │     N/A     │   OPT  │
                         │           │         │             │        │
BANCAIRE:                 │           │         │             │        │
├─ RIB                    │    OBL    │    OBL  │     OBL     │   OBL  │
├─ K-bank (si étranger)   │    CND    │    N/A  │     N/A     │   N/A  │
                         │           │         │             │        │
LÉGENDE:                  │           │         │             │        │
  OBL = Obligatoire       │           │         │             │        │
  CND = Conditionnel      │           │         │             │        │
  OPT = Optionnel/Recommandé│          │         │             │        │
  N/A = Non Applicable     │           │         │             │        │
```

#### 5.1.2 Documents par Secteur d'Activité (المستندات حسب قطاع النشاط)

| Secteur | Documents Supplémentaires | Autorité de Délivrance |
|---------|--------------------------|----------------------|
| **Pharmaceutique** | Agrément Ministry Santé, Bon Practice Distribution | Ministry Santé |
| **Alimentaire** | Certificat Hygiène, Analyse laboratoire, Halal (optionnel) | ONppa, ONAA, organisme halal |
| **Construction** | Qualification FBC (Fonds Bâtiment), Assurance RC décennale | FBC, assureur |
| **Transport** | Licence transport, Autorisation lignes, Carte conducteur | Ministry Transport |
| **Import/Export** | Licence import/export, Registre commerçant, Code douanier | Ministry Commerce, Douanes |
| **Mines/Pétrole** | Autorisation exploitation, Environnement, Sécurité | Ministry Énergie, ANPM |
| **Finance/Banque** | Licence banking, Agreement Banque DZ, Audit externe | Banque DZ, CBC |
| **Télécoms** | Licence ARPT, Homologation équipements | ARPT (autorité régulation) |
| **Education Privée** | Agrément Ministry Education, Diplomes enseignants | Ministry Education |
| **Santé Privée** | Agrément Ministry Santé, Qualification personnel médical | Ministry Santé |

---

### 5.2 Tracking d'Expiration et Renouvellement (تتبع الانتهاء والتجديد)

#### 5.2.1 Système d'Alertes Expiration (نظام تنبيهات الانتهاء)

**[CAPTURE D'ÉCRAN RÉFÉRENCE: document-expiry-tracking.png]**

```
SYSTÈME DE SUIVI EXPIRATION DOCUMENTS:

┌─────────────────────────────────────────────────────────────┐
│  📅 TABLEAU DE BORD EXPIRATIONS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RÉSUMÉ:                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Documents actifs:    1,247                           │   │
│  │ Expirant (30j):      23  ⚠️                         │   │
│  │ Expirés:              7  🔴                         │   │
│  │ En attente renouvel.: 12  ⏳                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ALERTES ACTIVES - PRIORITÉ:                               │
│                                                             │
│  🔴 EXPIRÉ (Action immédiate requise):                     │
│  ├── Attestation NIF - Groupe SIM - Exp: 05/01/2025       │
│  ├── Licence Import - MetalPro - Exp: 02/01/2025          │
│  └─ Assurance RC - Condor Oran - Exp: 10/01/2025          │
│                                                             │
│  ⚠️ EXPIRANT SOUS 15 JOURS:                                │
│  ├── Extrait RC - Naftal Constantine - Exp: 25/01/2025    │
│  ├── Attestation Fiscale - Vitam - Exp: 28/01/2025         │
│  └─ Certification ISO - PackAlg - Exp: 01/02/2025          │
│                                                             │
│  ⚠️ EXPIRANT SOUS 30 JOURS:                                │
│  ├── Agrément Ministry Santé - PharmDZ - Exp: 12/02/2025  │
│  ├── Statuts mis à jour - StartupX - Exp: 15/02/2025       │
│  └─ [17 autres documents...]                                │
│                                                             │
│  [Voir tout]  [Exporter calendrier]  [Configurer alertes]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Calendrier d'Alerte (تقويم التنبيه)

| Délai avant Expiration | Type d'Alerte | Action | Destinataire |
|-----------------------|---------------|--------|--------------|
| **90 jours** | Information | Planifier renouvellement | Entité concernée |
| **60 jours** | Rappel | Initier démarche | Entité + Account Manager |
| **30 jours** | Alerte | Urgence renouvellement | Entité + Compliance |
| **15 jours** | Alerte critique | Dernier délai | Compliance + Management |
| **0 jour (expiré)** | Blocage | Suspendre transactions | Automatique + Compliance |
| **Post-expiration** | Escalade | Procédure débloquage | Compliance Manager |

---

### 5.3 Validation OCR et Revue Manuelle (التحقق البصري والمراجعة اليدوية)

#### 5.3.1 Processus OCR (عملية التعرف البصري)

```
PROCESSUS OCR - EXTRACTION AUTOMATIQUE DONNÉES DOCUMENTS:

┌─────────────────────────────────────────────────────────────┐
│  PIPELINE OCR ALGERIATRADE.DZ                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT: Document uploadé (PDF/Image)                        │
│         ↓                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ETAPE 1: PRÉ-TRAITEMENT                               │   │
│  │ • Rotation/auto-correction orientation               │   │
│  │ • Nettoyage (bruit, ombres)                          │   │
│  │ • Enhancement contraste                              │   │
│  │ • Détection langue (FR/AR)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ETAPE 2: RECONNAISSANCE (OCR Engine)                 │   │
│  │ • Texte français: Tesseract / Azure OCR             │   │
│  │ • Texte arabe: Custom Arabic OCR model               │   │
│  │ • Chiffres/montants: Spécialized extraction          │   │
│  │ • Tableaux: Structure detection                      │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ETAPE 3: POST-TRAITEMENT & VALIDATION                │   │
│  │ • Confidence scoring per field                       │   │
│  │ • Regex validation (formats connus)                  │   │
│  │ • Cross-field consistency checks                     │   │
│  │ • Flag low-confidence for human review               │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                                                  │
│  OUTPUT: Données structurées + Score confiance            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SCORE CONFIANCE OCR INTERPRÉTATION:
├── 95-100%: Acceptation automatique possible
├── 80-94%: Vérification rapide recommandée
├── 60-79%: Revue manuelle obligatoire
└── <60%: Rescan ou saisie manuelle requise
```

#### 5.3.2 Quand la Revue Manuelle Est Requised (متى تكون المراجعة اليدوية مطلوبة)

| Situation | Action | Raison |
|-----------|--------|--------|
| Score OCR < 70% | Revue manuelle | Risque erreur extraction |
| Document abîmé/plié | Rescan + revue | Qualité image insuffisante |
| Document manuscrit | Saisie manuelle | OCR peu fiable sur manuscrit |
| Langue mixte FR/AR | Revue bilingue | Complexité linguistique |
| Format non-standard | Adaptation template | Modèle non reconnu |
| Discrepancy détectée | Investigation | Incohérence soupçonnée |
| Document sensible | Revue obligatoire | Données critiques |
| Contestation entité | Revue approfondie | Litige potentiel |

---

### 5.4 Bonnes Pratiques Génération Certificats (الممارسات الجيدة لإصدار الشهادات)

#### 5.4.1 Types de Certificats Générés (أنواع الشهادات المولدة)

| Certificat | Usage | Émetteur | Validité |
|------------|-------|----------|----------|
| **Certificat Conformité** | Preuve vérification entité | Systeme auto | 3 mois |
| **Certificat Screening** | Preuve screening sanctions clean | Systeme auto | 1 mois |
| **Attestation TVA** | Confirmation régime TVA | Systeme + data DGI | 1 an |
| **Certificat Partenaire Vérifié** | Badge confiance plateforme | Systeme auto | 6 mois |
| **Rapport Audit Conformité** | Audit complet entité | Compliance team | Ponctuel |

#### 5.4.2 Modèle Certificat Conformité (نموذج شهادة الامتثال)

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     CERTIFICAT DE CONFORMITÉ                                  ║
║     ALGERIATRADE.DZ - PLATEFORME B2B NATIONALE              ║
║                                                               ║
║     Référence: CERT-2025-XXXXXXXX                            ║
║     Date d'émission: JJ/MM/AAAA                              ║
║     Valide jusqu'à: JJ/MM/AAAA                               ║
║                                                               ║
║     ─────────────────────────────────────────                ║
║                                                               ║
║     CERTIFIONS PAR LA PRÉSENTE que l'entité:                 ║
║                                                               ║
║     RAISON SOCIALE: _________________________________        ║
║     N° RC: _______________________________________           ║
║     NIF: ________________________________________            ║
║     FORME JURIDIQUE: _____________________________           ║
║     SIÈGE: _______________________________________           ║
║                                                               ║
║     a fait l'objet d'une vérification de conformité          ║
║     dont les résultats sont les suivants:                    ║
║                                                               ║
║     ┌─────────────────────┬──────────┬──────────┐           ║
║     │ Module              │ Score    │ Status   │           ║
║     ├─────────────────────┼──────────┼──────────┤           ║
║     │ Commercial          │   XX/100 │    ✓     │           ║
║     │ Fiscal/TVA          │   XX/100 │    ✓     │           ║
║     │ Trade Extérieur      │   XX/100 │    ✓     │           ║
║     │ Protection Données   │   XX/100 │    ✓     │           ║
║     │ Sanctions Screening  │   XX/100 │    ✓     │           ║
║     ├─────────────────────┼──────────┼──────────┤           ║
║     │ SCORE GLOBAL        │   XX/100 │    ✓     │           ║
║     └─────────────────────┴──────────┴──────────┘           ║
║                                                               ║
║     Ce certificat confirme que l'entité satisfait aux        ║
║     exigences de conformité d'AlgeriaTrade.dz pour           ║
║     réaliser des transactions sur la plateforme.             ║
║                                                               ║
║     ─────────────────────────────────────────                ║
║                                                               ║
║     Émis par: Compliance Department                           ║
║     Signature: ____________________                           ║
║     Cachet: ALGERIATRADE.DZ COMPLIANCE                       ║
║                                                               ║
║     Vérifiable en ligne:                                     ║
║     https://algeriatrade.dz/verify/CERT-2025-XXXXXXXX       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### Résumé du Module 5 (ملخص الوحدة الخامسة)

**Gestion Documentaire - Points Clés:**

1. 📋 Chaque type d'entité a des documents obligatoires spécifiques
2. ⏰ Le tracking d'expiration évite les surprises (alertes 90/60/30/15 jours)
3. 🔍 L'OCR automatise l'extraction mais la revue humaine reste nécessaire
4. 📜 Les certificats de conformité prouvent la vérification auprès des tiers
5. 🔄 Le cycle de vie documentaire doit être géré de bout en bout

---

<a id="scenarios"></a>
## Scénarios de Conformité (سيناريوهات الامتثال)

### Scénario 1: Nouveau Fournisseur International (سيناريو 1)

**Contexte:**
Un nouvel inscrit "EuroTech Solutions GmbH" (Allemagne) souhaite vendre des équipements industriels sur AlgeriaTrade.dz.

**Données fournies:**
- Société allemande, Munich
- Équipements automation industrielle
- Première commande estimée: 250,000 EUR
- Aucun historique en Algérie

**Questions d'analyse:**

1. Quels modules de conformité sont prioritaires ?
2. Quels documents spécifiques demander ?
3. Quels risques particuliers identifier ?

**Réponse guidée:**

> **Modules prioritaires:**
> - **Sanctions Screening** (OBIGATOIRE premier) - Vérifier OFAC, EU list
> - **Trade Extérieur** - Licence import, certification douane
> - **Commercial** - Vérification existence légale (allemande + représentation DZ)
> - **Fiscal/TVA** - Identification fiscale (si présence en Algérie)
>
> **Documents spécifiques:**
> - Handelsregisterauszug (extrait K allemand)
> - Attestation représentation fiscale en Algérie (ou preuve absence établissement stable)
> - Certificat conformité CE pour équipements
> - Attestation non-sanction (auto-déclaration)
> - Coordonnées banque correspondante en DZ (si exists)
>
> **Risques particuliers:**
> - Sanctions secondaires US (si technologie sensible)
> - TVA à l'importation (19% + droits douane)
> - Garantie/SAV depuis l'étranger
> - Clause choix loi applicable (loi allemande vs algérienne)
> - Transfer pricing si filiale existe

---

### Scénario 2: Anomalie TVA Détectée (سيناريو 2)

**Contexte:**
Le système détecte une incohérence sur les factures du fournisseur "AgroDZ Supply":

| Facture | Produit | Montant HT | TVA Appliquée | TVA Attendue |
|---------|---------|-----------|--------------|--------------|
| #F-2401 | Riz importé | 500,000 DZD | 47,500 (9.5%) | 45,000 (9%) |
| #F-2402 | Huile table | 300,000 DZD | 57,000 (19%) | 27,000 (9%) |
| #F-2403 | Sucre blanc | 200,000 DZD | 42,000 (21%) | 18,000 (9%) |

**Analyse requise:**

1. Quelle est la nature des anomalies ?
2. Que pourrait indiquer ce pattern ?
3. Quelle action immédiate prendre ?

**Réponse guidée:**

> **Nature des anomalies:**
> - F-2401: Taux 9.5% (n'existe pas) → Erreur de calcul probable
> - F-2402: Taux 19% sur huile table (devrait être 9%) → Erreur ou surfacturation
> - F-2403: Taux 21% (n'existe pas) + sur sucre (devrait être 9%) → Double anomalie
>
> **Pattern inquiétant:**
> - Les trois factures ont des erreurs différentes
> - Deux sur trois surfacturent la TVA (au détrivent de l'acheteur)
> - Possibilité d'erreur systémique ou de manipulation volontaire
>
> **Actions immédiates:**
> 1. **Bloquer temporairement** le fournisseur (statut "under review")
> 2. **Contacter** AgroDZ Supply pour explications
> 3. **Auditer** toutes les factures des 12 derniers mois
> 4. **Notifier** les clients ayant reçu ces factures (possibilité de crédit TVA refusé)
> 5. **Escalader** au Compliance Manager si explication non satisfaisante

---

### Scénario 3: Match Sanction "Medium Probability" (سيناريو 3)

**Contexte:**
Screening d'un nouvel acheteur "Khalil Benzarti" retourne:

```
SCREENING RESULT:
Entrée vérifiée: Khalil Benzarti, DOB 15/03/1985, Tunisien
Match trouvé: "K. Benzarti", EU Consolidated List, Nationalité: TN
Score: 62% (MEDIUM PROBABILITY)
Différences: Prénom complet vs initiale, pas de DOB sur entrée liste
```

**Processus de résolution:**

1. Quelle est la première action ?
2. Quelles preuves demander ?
3. Comment trancher ?

**Réponse guidée:**

> **Première action:** PAUSER la transaction (pas bloquer, pas approuver)
> - Le score 62% = Medium Probability = revue manuelle obligatoire
> - Ne pas informer l'entité du motif précis (ne pas révéler "match sanction")
>
> **Preuves à demander:**
> - Passeport tunisien complet (page identité + visa si applicable)
> - Justificatif domicile récent
> - CV/profession (contexte)
> - Attestation employeur
> - Tout document prouvant activités récentes normales
>
> **Critères de décision:**
> - Si DOB différent → Probablement faux positif → Peut approuver avec doc
> - Si DOB identique (+/- 1 an) → Haut risque → Escalader/bloquer
> - Si entité refuse documents → Suspicious → Bloquer
> - Si documents confirment identité distincte → Approuver comme False Positive

---

### Scénario 4: Document Expiré Post-Transaction (سيناريو 4)

**Contexte:**
Une transaction de 2M DZD a été validée il y a 2 mois. Aujourd'hui, le système signale que l'attestation fiscale du fournisseur a expiré il y a 3 jours.

**Questions:**

1. La transaction passée est-elle affectée ?
2. Que faire pour les transactions futures/en cours ?
3. Comment gérer la relation fournisseur ?

**Réponse guidée:**

> **Transaction passée:**
> - Non affectée si le document était valide AU MOMENT de la transaction
> - Conserver la preuve (screenshot/copie datee) dans le dossier
> - L'expiration rétroactive ne remet pas en cause la conformité passée
>
> **Transactions futures:**
> - BLOQUER toute nouvelle transaction jusqu'à renouvellement
> - Notifier le fournisseur immédiatement
> - Délai de grâce: 7-14 jours (selon criticité fournisseur)
> - Passé ce délai: suspension compte
>
> **Relation fournisseur:**
> - Contact account manager pour accompagnement
> - Si récidive: Review statut "fournisseur vérifié"
> - Possible pénalité sur score de conformité
> - Documenter l'incident pour audit futur

---

### Scénario 5: Demande Accès Données (Sujet Droits) (سيناريو 5)

**Contexte:**
M. Rabah Boumendjel, représentant de "Boumendjel SARL", demande par email:

> *"Conformément à mes droits, je souhaite recevoir copie de toutes mes données personnelles détenues par AlgeriaTrade.dz ainsi que celles de mon entreprise."*

**Traitement requis:**

1. Quel cadre légal s'applique ?
2. Quel est le délai de réponse ?
3. Quelles données fournir (et lesquelles ne pas fournir) ?

**Réponse guidée:**

> **Cadre légal:** Loi 18-07 (protection données personnelles)
> - Droit d'accès reconnu (Article X de la loi)
> - Similaire au RGPD Article 15
>
> **Délai de réponse:** Maximum 30 jours (recommandé: 15 jours)
> - Accuser réception sous 48h
> - Fournir réponse complète dans les délais
>
> **Données à fournir:**
> - Données d'identification (nom, email, téléphone, entreprise)
> - Données de connexion (dates, IP - si pas de risque sécurité)
> - Données transactionnelles (montants, contreparties)
> - Communications avec support/service client
> - Documents uploadés par l'utilisateur
> - Résultats de vérifications conformité (son propre dossier)
>
> **Données NE PAS fournir (ou restreindre):**
> - Données d'autres utilisateurs/entreprises
> - Notes internes compliance (si investigation en cours)
> - Données de sécurité (mots de passe, tokens - même hashés)
> - Informations relevant la sûreté de l'État
> - Données soumises à secret professionnel (avocat, etc.)

---

### Scénario 6: Pression pour contourner Compliance (سيناريو 6)

**Contexte:**
Un commercial senior vous contacte urgent:

> *"Le client Groupe Nation (très gros compte, 50M DZD/an) veut passer une commande TODAY. Leur attestation fiscale expire demain et ils peuvent pas la renouveler avant 5 jours. On peut faire une exception ? C'est un client connu depuis 10 ans !"*

**Analyse éthique et procédurale:**

1. Peut-on faire une exception ?
2. Quels sont les risques ?
3. Comment répondre au commercial ?

**Réponse guidée:**

> **Peut-on exception?** NON - pas pour document expiré
> - L'expiration fiscale est un hard block réglementaire
> - Même client de 10 ans, le risque est réel
> - Une exception créerait un précédent dangereux
>
> **Risques identifiés:**
> - **Légal:** Violation procédure conformité, responsabilité
> - **Fiscal:** TVA non déductible pour le client (perte financière)
> - **Réputation:** Si problème fiscal client ultérieur, AlgeriaTrade impliquée
> - **Précédent:** Autres commerciaux demanderaient mêmes faveurs
>
> **Réponse au commercial:**
> 1. Empathiser ("je comprends l'urgence")
> 2. Expliquer le hard block (pas de flexibilité)
> 3. Proposer alternatives:
>    - Client obtient prolongation urgente (certains cas possibles)
>    - Commande partielle (si urgence absolue) avec garantie renouvellement
>    - Lettre d'engagement du client (renouvellement sous 5 jours)
> 4. Escalader au Compliance Manager si pression persiste
> 5. Documenter la demande et le refus (audit trail)

---

### Scénario 7: Suspicion Blanchiment (سيناريو 7)

**Contexte:**
Vous remarquez un pattern sur le compte "StarTrading EURL":

- Créé il y a 2 mois
- 15 transactions en 1 mois, total: 180M DZD
- Toujours même fournisseur: "GlobalSupply DMCC" (Dubaï)
- Produits: "Electronique grand public" - descriptions vagues
- Paiement toujours anticipé (avant livraison)
- Aucune question sur délais, qualité, etc.
- Livraison systématiquement à une adresse différente (Blida, puis Oran, puis Constantine)

**Signaux d'alerte:**

1. Ces signaux sont-ils suspects ? Pourquoi ?
2. Quelle est votre obligation ?
3. Quelle procédure suivre ?

**Réponse guidée:**

> **Signaux suspects - OUI, multiples indicateurs:**
> - Volume élevé pour entité récente (risque "shell company")
> - Fournisseur unique offshore (zone à risque blanchiment)
> - Descriptions vagues (possible couverture)
> - Paiement anticipé systématique (peut cacher arrangement caché)
> - Multiples adresses livraison (possible dissimulation destination finale)
> - Pas d'intérêt normal client (qualité, délais)
>
> **Obligation légale:** Déclaration CTF (Cellule Traitement Informations Financières)
> - Obligation pour tout "suspicion raisonnable" de blanchiment
> - Protection du déclarant (interdiction de représailles)
>
> **Procédure:**
> 1. **Ne pas alerter l'entité** (ne pas compromettre enquête potentielle)
> 2. **Documenter** tous les éléments suspects
> 3. **Bloquer temporairement** le compte (motif "revue interne")
> 4. **Escalader IMMÉDIATEMENT** au Compliance Manager + DPO
> 5. **Ne pas traiter** soi-même la déclaration CTF (procédure spécialisée)
> 6. **Conserver** tous les documents et preuves

---

### Scénario 8: Mise à Jour Réglementation (سيناريو 8)

**Contexte:**
Un nouveau décret est publié modifiant le Code TVA: le taux sur les produits informatiques passe de 19% à 9%, rétroactif au 1er janvier 2025.

**Actions requises:**

1. Qui doit être notifié ?
2. Que faire des transactions passées ?
3. Comment mettre à jour le système ?

**Réponse guidée:**

> **Notification:**
> - Équipe produit (mise à jour moteur règles)
> - Équipe compliance (nouvelle procédure)
> - Support client (préparer réponses)
> - Clients actifs (communication proactive)
> - Fournisseurs impactés (ajustement facturation)
>
> **Transactions passées:**
> - Si TVA sur-facturée: Client peut demander remboursement/avoir
> - Si système a appliqué 19% au lieu de 9%: Générer avoirs automatiques
> - Documenter la transition pour audit
>
> **Mise à jour système:**
> 1. Mettre à jour la table des taux TVA dans le moteur de règles
> 2. Tester avec cas de test (produits IT)
> 3. Déployer en production avec date d'effet
> 4. Monitorer les premières transactions
> 5. Préparer rapport d'impact

---

### Scénario 9: Audit Externe Imprévu (سيناريو 9)

**Contexte:**
À 9h00, vous recevez un appel de la Direction des Grandes Entreprises (DGE) de la DGI annonçant un contrôle fiscal sur 3 clients AlgeriaTrade.dz sélectionnés aléatoirement. Les inspecteurs arriveront à 14h00.

**Préparation urgente:**

1. Quels documents préparer ?
2. Qui impliquer en interne ?
3. Quelles sont vos droits et devoirs ?

**Réponse guidée:**

> **Documents à préparer:**
> - Dossiers complets conformité des 3 entreprises
> - Copies de toutes les factures émises/reçues
> - Preuves de TVA (déclarations, paiements)
> - Documents vérification identité (RC, NIF, etc.)
> - Logs des screenings sanctions
> - Correspondance avec ces clients
> - Procéd internes conformité documentées
>
> **Implication interne:**
> - Compliance Manager (lead)
> - Direction Générale (informée)
> - Juridique (conseil)
> - IT (accès sécurisés, logs)
> - Communication (si presse)
>
> **Droits et devoirs:**
> - Droit: Être assisté d'un conseil/conseiller fiscal
> - Droit: Avoir un délai raisonnable pour rassembler documents
> - Devoir: Collaborer (refus = obstruction)
> - Devoir: Fournir documents demandés (dans mesure du raisonnable)
> - Devoir: Ne pas détruire/modifier des documents (destruction preuve)

---

### Scénario 10: Cyberattaque et Conformité (سيناريو ١٠)

**Contexte:**
Le service IT vous alerte: une brèche de sécurité potentielle a exposé les données personnelles de ~5,000 utilisateurs. L'origine semble être une attaque par phishing réussie sur un employé du support.

**Actions conformité (notamment Loi 18-07):**

1. Quel est le délai de notification ?
2. Qui doit être notifié ?
3. Quels sont les risques juridiques ?

**Réponse guidée:**

> **Délai notification Loi 18-07:**
> - ANPD (Autorité Nationale Protection Données): **72 heures maximum**
> - Personnes concernées: "sans délai injustifié" (recommandé: 72h aussi)
>
> **Destinataires notification:**
> - **ANPD:** Rapport détaillé de l'incident
> - **Personnes concernées:** Nature données exposées, mesures prises, conseils
> - **Clients entreprise:** Si données business impactées
> - **Assurance cyber:** Si police existe
> - **Interne:** Direction, juridique, communication
>
> **Contenu notification ANPD:**
> - Nature de la violation
> - Catégories de données concernées
> - Nombre approximatif de personnes concernées
> - Mesures prises/à prendre pour y remédier
> - Conséquences probables
> - Contact DPO/responsable traitement
>
> **Risques juridiques:**
> - Sanction administrative ANPD (jusqu'à 2% CA mondial)
> - Actions en justice des personnes concernées
> - Perte de confiance marché
> - Impact réputation majeur
> - Possibles sanctions autres juridictions (UE si données citoyens UE)

---

<a id="decision-trees"></a>

## Arbres de Décision (أشجار القرار)

### Arbre 1: Dois-je Bloquer cette Transaction ? (شجرة القرار 1)

```
START: Nouvelle transaction détectée
         │
         ▼
   L'entité est-elle sur une liste de sanctions ?
         │
    ┌────┴────┐
    │NON      │OUI
    │         │
    ▼         ▼
 Score      Match
 conformité  Exact/
 ≥ 60 ?     High ?
    │         │
 ┌──┴──┐   ┌──┴──┐
 │NON  │OUI│NON  │OUI
 │     │   │     │
 ▼     ▼   ▼     ▼
Alert PAUSE  BLOQUER
modéré  pour   IMMÉ-
         review DIATEMENT
         manuel
              │
              ▼
         Escalader
         Senior
         Compliance
```

### Arbre 2: Quel Taux TVA Appliquer ? (شجرة القرار 2)

```
START: Déterminer taux TVA
         │
         ▼
   Client HORS Algérie (export) ?
         │
    ┌────┴────┐
    │OUI      │NON
    │         │
    ▼         ▼
   0%    Produit alimentaire
  (exonéré)   de BASE ?
                   │
              ┌────┴────┐
              │OUI      │NON
              │         │
              ▼         ▼
             9%    Médicament /
                   pharmaceutique ?
                        │
                   ┌────┴────┐
                   │OUI      │NON
                   │         │
                   ▼         ▼
                  9%       19%
               (réduit)  (normal)
```

### Arbre 3: Document Expiré - Que Faire ? (شجرة القرار 3)

```
START: Document expiré détecté
         │
         ▼
   Transaction EN COURS avec cette entité ?
         │
    ┌────┴────┐
    │OUI      │NON
    │         │
    ▼         ▼
 Bloquer  Document
 nouvelles  critique
 trans.   (RC, fiscal,
           sanctions) ?
              │
         ┌────┴────┐
         │OUI      │NON
         │         │
         ▼         ▼
    Suspendre  Notifier
    compte     renouvellemt
    jusqu'à    sous 7-15
    renouve.   jours
```

---

<a id="escalation"></a>

## Procédures d'Escalade (إجراءات التصعيد)

### Matrice d'Escalade (مصفوفة التصعيد)

| Niveau | Rôle | Types de Cas | Délai Response | Autorité |
|--------|------|-------------|----------------|----------|
| **N1** | Opérateur Compliance | Cas standard, documents simples | < 4 heures | Validation routine |
| **N2** | Senior Compliance | Cas complexes, faux positifs, anomalies | < 24 heures | Exception approval |
| **N3** | Compliance Manager | Sanctions confirmées, audit, autorités | < 4 heures | Décision stratégique |
| **N4** | Direction Générale | Crise, média, impact majeur | Immédiat | Décision executive |
| **N5** | Externe (Juriste/Expert) | Contentieux, procédures judiciaires | Selon urgence | Conseil expert |

### Contacts Escalade (جهات الاتصال للتصعيد)

```
MATRICE CONTACTS ESCALADE CONFORMITÉ:

┌─────────────────────────────────────────────────────────────┐
│  ESCALADE CONFORMITÉ - CONTACTS                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  N1 - OPÉRATEURS COMPLIANCE (Équipe)                       │
│  ├── compliance-ops@algeriatrade.dz                        │
│  ├── Slack: #compliance-ops                                │
│  └── Disponibilité: 08h00-17h00 (jours ouvrables)          │
│                                                             │
│  N2 - SENIOR COMPLIANCE                                     │
│  ├── compliance-senior@algeriatrade.dz                     │
│  ├── Tel: +213 (0) XXX XX XX XX (urgence)                  │
│  └── Disponibilité: 08h00-19h00 + astreinte week-end       │
│                                                             │
│  N3 - COMPLIANCE MANAGER                                    │
│  ├── compliance-manager@algeriatrade.dz                    │
│  ├── Tel direct: +213 (0) XXX XX XX XX                     │
│  ├── Mobile (urgence 24/7): +213 (0) XXX XX XX XX          │
│  └── Decision authority: Full                               │
│                                                             │
│  N4 - DIRECTION GÉNÉRALE                                    │
│  ├── EA (Executive Assistant) DG                            │
│  ├── Tel secrétariat: +213 (0) XXX XX XX XX                │
│  └── Activation: Crisis committee only                      │
│                                                             │
│  N5 - EXTERNES                                              │
│  ├── Cabinet juridique: Cabinet XYZ                         │
│  │   Contact: Maître ABC                                   │
│  │   Tel: +213 (0) XXX XX XX XX                            │
│  ├── Expert-comptable: Fiduciaire DEF                      │
│  │   Contact: Expert XYZ                                   │
│  └── CTF (si suspicion blanchiment):                        │
│      Canal officiel uniquement                              │
│                                                             │
│  URGENCES CRITIQUES (< 1 heure):                           │
│  ├── Hotline: +213 (0) XXX XX XX XX                        │
│  ├── SMS urgent: +213 (0) XXX XX XX XX                     │
│  └── Si pas de réponse: Appeler N3 mobile directement      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

<a id="audit-checklist"></a>

## Checkliste Préparation Audit (قائمة تحضير التدقيق)

### Préparation Audit Interne (تحضير التدقيق الداخلي)

```
CHECKLISTE PRÉPARATION AUDIT CONFORMITÉ:
═════════════════════════════════════════════════════════════════

ORGANISATION:
├── ☑ Espace de travail préparé (salle meeting réservée)
├── ☑ Accès systèmes audités configurés (read-only)
├── ☑ Équipe disponible (conformité, IT, métier concerné)
├── ☑ Boissons/rafraîchissements pour auditeurs
└── ☑ Badge/accès préparés

DOCUMENTATION GÉNÉRALE:
├── ☑ Organigramme service conformité (à jour)
├── ☑ Procédures documentées (tous modules)
├── ☑ Politiques conformité (approuvées, datées)
├── ☑ Matrice des rôles et responsabilités
├── ☑ Registre des formations conformité
├── ☑ Compte-rendu comités conformité (derniers 12 mois)
└── ☑ Plan d'action conformité (en cours + terminés)

DOCUMENTATION OPÉRATIONNELLE:
├── ☑ Échantillon dossiers conformité (10-20 variés)
├── ☑ Logs système (période auditée)
├── ☑ Rapports de screening sanctions
├── ☑ Liste des alertes et résolutions
├── ☑ Exceptions approuvées (avec justificatifs)
├── ☑ Correspondance autorités (si existante)
└── ☑ Preuves de formations effectuées

SYSTÈMES ET OUTILS:
├── ☑ Accès Compliance Checker fonctionnel
├── ☑ Base de données documents accessible
├── ☑ Logs d'audit trail disponibles
├── ☑ Backups vérifiés (intégrité)
├── ☑ Tests de fonctionnement effectués
└── ☑ Documentation technique à jour

SPÉCIFIQUE AUDIT FISCAL (SI APPLICABLE):
├── ☑ Registre TVA (collectée, déductible, reverseée)
├── ☑ Factures d'achat et vente (échantillon)
├── ☑ Déclarations TVA (12 derniers mois)
├── ☑ Preuves de paiement TVA
├── ☑ Attestations fiscales fournisseurs/clients
├── ☑ Registre des retenues à la source
└── ☑ Justificatifs exonérations (le cas échéant)

SPÉCIFIQUE AUDIT PROTECTION DONNÉES:
├── ☑ Registre des traitements (Article Loi 18-07)
├── ☑ Analyses d'impact (AIPD) réalisées
├── ☑ Demandes d'exercice de droits (access, effacement)
├── ☑ Notifications violations (si existantes)
├── ☑ Contrats sous-traitants (clauses données)
├── ☑ Preuves consentements collectés
└── ☑ Politique confidentialité publiée

POST-AUDIT:
├── ☑ Plan de gestion des recommandations
├── ☑ Template rapport d'audit (pré-rempli si possible)
├── ☑ Processus suivi des actions correctives
└── ☑ Planning revue mid-term (si audit long)
```

---

<a id="annexes"></a>

## Annexes et Références (ملاحق ومراجع)

### Annexe A: Glossaire Conformité (مسرد الامتثال)

| Terme | Définition | Équivalent Arabe |
|-------|-----------|------------------|
| **AML** | Anti-Money Laundering (Anti-blanchiment) | مكافحة غسل الأموال |
| **CDD** | Compte de Dépôt Devise | حساب الوديعة بالعملة |
| **CTF** | Counter-Terrorism Financing (Anti-terrorisme) | مكافحة تمويل الإرهاب |
| **CTIF** | Cellule de Traitement des Informations Financières | خلية معالجة المعلومات المالية |
| **DGI** | Direction Générale des Impôts | المديرية العامة للضرائب |
| **DZ** | Algérie (code pays ISO) | الجزائر |
| **KYC** | Know Your Customer (Connaissez votre client) | اعرف عميلك |
| **NIF** | Numéro d'Identification Fiscale | رقم التعريف الضريبي |
| **NIS** | Numéro d'Identification Statistique | رقم التعريف الإحصائي |
| **OFAC** | Office of Foreign Assets Control (US Treasury) | مكتب مراقبة الأصول الأجنبية |
| **PEP** | Politically Exposed Person | شخصية سياسية معرضة للمخاطر |
| **RC** | Registre du Commerce | السجل التجاري |
| **SLA** | Service Level Agreement | اتفاقية مستوى الخدمة |
| **TVA** | Taxe sur la Valeur Ajoutée | ضريبة القيمة المضافة |

### Annexe B: Textes Législatifs de Référence (النصوص التشريعية المرجعية)

| Texte | Date | Objet | Lien (si disponible) |
|-------|------|-------|---------------------|
| Ordonnance 75-59 | 26/09/1975 | Code de Commerce | Journal Officiel |
| Ordonnance 76-147 | 30/12/1976 | Code TVA | Journal Officiel |
| Loi 03-01 | 26/02/2003 | Commerce Extérieur | Journal Officiel |
| Loi 03-03 | 26/02/2003 | Concurrence | Journal Officiel |
| Loi 18-07 | 10/06/2018 | Protection Données Personnelles | Journal Officiel |
| Loi 05-04 | 20/08/2005 | Prévention et lutte contre le blanchiment | Journal Officiel |
| Loi 06-01 | 20/02/2006 | Loi de finances complémentaire | Journal Officiel |
| Loi 09-04 | 14/04/2009 | Protection consommateur | Journal Officiel |
| Décret exécutif 03-xx | Various | Application lois ci-dessus | Journal Officiel |
| Instruction Banque d'Algérie | Various | Change, devises, transactions | Site BdA |
| Instruction DGI | Various | TVA, IRG, IBS | Portail DGI |

### Annexe C: Contacts Utiles (جهات اتصال مفيدة)

| Organisation | Contact | Usage |
|-------------|---------|-------|
| **Direction Générale Impôts (DGI)** | www.mf.gov.dz | Questions fiscales, TVA |
| **Banque d'Algérie** | www.bank-of-algeria.dz | Change, devises, rapports |
| **CTF (Cellule Traitement Financier)** | Canal officiel sécurisé | Suspicion blanchiment |
| **ANPD (Autorité Prot. Données)** | À déterminer (nouvelle autorité) | Protection données |
| **Centre National de Registre du Commerce (CNRC)** | www.cnrc.org.dz | Vérification RC |
| **Organisme National Algérien de Contrôle et de Qualité (ONCQ)** | www.oncq.dz | Certification qualité |
| **Ministère Commerce** | www.mincommerce.gov.dz | Import/export, licences |
| **Chambre de Commerce d'Alger** | www.ccal.dz | Attestations commerciales |
| **Police Judiciaire ( Brigade Economique)** | Urgence 17 ou commissariat | Crimes économiques |

### Annexe D: Ressources de Formation (موارد التدريب)

| Ressource | Description | Accès |
|-----------|-------------|--------|
| **Academy AlgeriaTrade** | Cours e-learning conformité | academy.algeriatrade.dz |
| **Guide Quick Reference** | Cheatsheet conformité | Ce document (Annexe) |
| **Vidéos procédures** | Tutoriels screen recording | SharePoint / Drive |
| **Quizz mensuel** | Test connaissances | LMS interne |
| **Newsletter conformité** | Mises à jour réglementaires | Email mensuel |
| **Webinars experts** | Sessions Q&A trimestrielles | Zoom (invitations) |
| **Certification interne** | Certification opérateur conformité | Programme annuel |

### Annexe E: Historique des Versions (تاريخ الإصدارات)

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 9.0.0 | Jan 2025 | Equipe Compliance | Version initiale Phase 9 |
| 9.0.1 | À venir | - | Corrections basées feedback |
| 9.1.0 | Planifié Q2 2025 | - | Ajout cas pratiques supplémentaires |

---

## Document Final (وثيقة نهائية)

**Ce document de formation est la propriété d'AlgeriaTrade.dz.**

**Toute reproduction ou diffusion externe nécessite une autorisation écrite.**

**Les informations réglementaires sont fournies à titre indicatif. Consultez toujours un juriste pour les questions spécifiques.**

**© 2025 AlgeriaTrade.dz - Tous droits réservés.**

---

*Fin du Guide de Formation Conformité - Phase 9*
*نهاية دليل تدريب الامتثال - المرحلة ٩*
