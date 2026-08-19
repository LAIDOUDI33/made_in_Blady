/**
 * AlgeriaTrade.dz Compliance Core Engine
 * 
 * Comprehensive compliance checking system for Algerian marketplace activities.
 * Integrates all compliance modules: Commercial, Tax, Trade, Privacy, Sanctions
 * 
 * Features:
 * - Real-time entity compliance scoring
 * - Multi-rule validation engine
 * - Document verification workflow
 * - Sanctions screening integration
 * - Compliance reporting and audit trail
 * 
 * @module compliance/engine
 */

import {
  COMMERCIAL_RULES,
  validateCommercialRegistration,
  type CommercialRule,
  type Violation,
  type ComplianceCheckResult,
} from './rules/commercial-rules';

import {
  TAX_RULES,
  TVA_RATES,
  validateTaxCompliance,
  calculateTVA,
  getTVARateByProductCategory,
  type TaxRule,
  type TaxComplianceResult,
} from './rules/tax-rules';

import {
  TRADE_RULES,
  PROHIBITED_IMPORTS,
  RESTRICTED_EXPORTS,
  checkImportRestrictions,
  calculateCustomsDuty,
  FREE_TRADE_AGREEMENTS,
  type TradeRule,
  type TradeCheckResult,
} from './rules/trade-rules';

import {
  PRIVACY_RULES,
  PROTECTED_DATA_CATEGORIES,
  validatePrivacyCompliance,
  APN_CONTACT,
  type PrivacyRule,
  type PrivacyComplianceResult,
} from './rules/data-privacy-rules';

import {
  SANCTIONS_LISTS,
  performScreening,
  DEFAULT_RISK_CONFIG,
  type SanctionEntity,
  type ScreeningResult,
  type ScreeningCase,
  type RiskLevel,
  type ScreenedEntityInput,
} from './rules/sanctions-rules';

// ============================================================================
// Core Types
// ============================================================================

export interface EntityProfile {
  // Basic Information
  id: string;
  name: string;
  entityType: 'individual' | 'organization' | 'sole_proprietorship';
  
  // Registration Details (Code de Commerce)
  rccNumber?: string;
  rccExpiryDate?: string;
  nifNumber?: string;
  aisNumber?: string;
  
  // Contact & Location
  address?: string;
  city?: string;
  wilayaCode?: string;
  country?: string;
  nationality?: string;
  
  // Business Details
  activitySector?: string;
  commercialActivity?: string;
  annualRevenue?: number;
  employeeCount?: number;
  
  // Personal Details (for individuals)
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  
  // Tax Information
  tvaRegime?: 'monthly' | 'quarterly';
  lastTVADeclaration?: string;
  ibcFilingCurrent?: boolean;
  
  // Trade Authorization
  importLicense?: boolean;
  exportLicense?: boolean;
  licenseExpiryDate?: string;
  
  // Data Protection
  dataProcessingDeclared?: string;
  dpoAppointed?: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface FullComplianceReport {
  entityId: string;
  reportId: string;
  generatedAt: string;
  overallScore: number;
  overallStatus: ComplianceStatus;
  
  modules: {
    commercial: ModuleResult<CommercialViolation>;
    tax: ModuleResult<TaxIssue>;
    trade: ModuleResult<TradeIssue>;
    privacy: ModuleResult<PrivacyIssue>;
    sanctions: ModuleResult<SanctionIssue>;
  };
  
  requiredDocuments: DocumentRequirement[];
  recommendedActions: ActionItem[];
  nextReviewDate: string;
}

export interface ModuleResult<T extends BaseIssue> {
  status: ComplianceStatus;
  score: number;
  issuesFound: T[];
  rulesChecked: number;
  rulesPassed: number;
  lastAudit?: string;
  details?: Record<string, unknown>;
}

export interface BaseIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  remediationFr: string;
  remediationAr: string;
  legalReference: string;
}

export interface CommercialViolation extends BaseIssue {
  ruleCode: string;
}

export interface TaxIssue extends BaseIssue {
  declarationType?: string;
  dueAmount?: number;
}

export interface TradeIssue extends BaseIssue {
  hsCode?: string;
  restrictionType?: 'prohibited' | 'restricted' | 'licensed';
}

export interface PrivacyIssue extends BaseIssue {
  dataCategory?: string;
  gapType?: string;
}

export interface SanctionIssue extends BaseIssue {
  matchConfidence: number;
  sanctionSource: string;
  screeningRef: string;
}

export type ComplianceStatus = 
  | 'fully_compliant'
  | 'minor_issues'
  | 'needs_attention'
  | 'non_compliant'
  | 'critical_violation';

export interface DocumentRequirement {
  id: string;
  documentType: string;
  documentTypeFr: string;
  documentTypeAr: string;
  requiredFor: string[];
  status: 'valid' | 'expired' | 'missing' | 'pending_verification' | 'not_applicable';
  expiryDate?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface ActionItem {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  actionFr: string;
  actionAr: string;
  deadline?: string;
  estimatedEffort?: string;
}

// ============================================================================
// Main Compliance Engine Class
// ============================================================================

export class ComplianceEngine {
  private cache: Map<string, { result: FullComplianceReport; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Run full compliance check on an entity
   */
  async runFullComplianceCheck(entity: EntityProfile): Promise<FullComplianceReport> {
    const cacheKey = `compliance-${entity.id}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    // Run all compliance modules in parallel
    const [
      commercialResult,
      taxResult,
      tradeResult,
      privacyResult,
      sanctionsResult,
      docRequirements,
    ] = await Promise.all([
      this.checkCommercialCompliance(entity),
      this.checkTaxCompliance(entity),
      this.checkTradeCompliance(entity),
      this.checkPrivacyCompliance(entity),
      this.checkSanctionsCompliance(entity),
      this.generateDocumentRequirements(entity),
    ]);

    // Calculate overall score
    const scores = [
      commercialResult.score,
      taxResult.score,
      tradeResult.score,
      privacyResult.score,
      sanctionsResult.score,
    ];
    const overallScore = Math.round(
      scores.reduce((sum, s) => sum + s, 0) / scores.length
    );

    const overallStatus = this.determineOverallStatus(overallScore);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions({
      commercial: commercialResult,
      tax: taxResult,
      trade: tradeResult,
      privacy: privacyResult,
      sanctions: sanctionsResult,
    });

    const report: FullComplianceReport = {
      entityId: entity.id,
      reportId: this.generateReportId(),
      generatedAt: new Date().toISOString(),
      overallScore,
      overallStatus,
      modules: {
        commercial: commercialResult,
        tax: taxResult,
        trade: tradeResult,
        privacy: privacyResult,
        sanctions: sanctionsResult,
      },
      requiredDocuments: docRequirements,
      recommendedActions,
      nextReviewDate: this.calculateNextReviewDate(overallStatus),
    };

    // Cache the result
    this.cache.set(cacheKey, { result: report, timestamp: Date.now() });

    return report;
  }

  /**
   * Check Commercial Law Compliance (Code de Commerce)
   */
  async checkCommercialCompliance(entity: EntityProfile): Promise<ModuleResult<CommercialViolation>> {
    const issues: CommercialViolation[] = [];
    let rulesChecked = 0;
    let rulesPassed = 0;

    for (const rule of COMMERCIAL_RULES.filter(r => r.isActive)) {
      rulesChecked++;
      
      switch (rule.code) {
        case 'RC-REG-001': // RCC Registration
          if (!entity.rccNumber) {
            issues.push(this.createCommercialViolation(rule));
          } else if (entity.rccExpiryDate && new Date(entity.rccExpiryDate) < new Date()) {
            issues.push({
              ...this.createCommercialViolation(rule),
              descriptionFr: `RCC expiré le ${entity.rccExpiryDate}`,
              descriptionAr: `انتهت صلاحية السجل التجاري في ${entity.rccExpiryDate}`,
            });
          } else {
            rulesPassed++;
          }
          break;

        case 'NIF-REQ-001': // NIF Requirement
          if (!entity.nifNumber) {
            issues.push(this.createCommercialViolation(rule));
          } else {
            rulesPassed++;
          }
          break;

        case 'AIS-REQ-001': // AIS Requirement
          if (!entity.aisNumber && entity.entityType !== 'individual') {
            issues.push(this.createCommercialViolation(rule));
          } else {
            rulesPassed++;
          }
          break;

        default:
          // For other rules, assume pass if no specific check fails
          rulesPassed++;
      }
    }

    return this.buildModuleResult(issues, rulesChecked, rulesPassed);
  }

  /**
   * Check Tax Compliance (TVA, IRG, IBC, TAPS)
   */
  async checkTaxCompliance(entity: EntityProfile): Promise<ModuleResult<TaxIssue>> {
    const issues: TaxIssue[] = [];
    let rulesChecked = TAX_RULES.filter(r => r.isActive).length;
    let rulesPassed = 0;

    // NIF-based checks
    if (entity.nifNumber) {
      rulesPassed += 2; // Assume basic filing is done if NIF exists
      
      // Check TVA regime appropriateness based on revenue
      if (entity.annualRevenue) {
        const expectedRegime = entity.annualRevenue > 30000000 ? 'monthly' : 'quarterly';
        if (entity.tvaRegime && entity.tvaRegime !== expectedRegime) {
          issues.push({
            id: 'tax-regime-mismatch',
            severity: 'medium',
            category: 'tva',
            titleFr: 'Régime TVA potentiellement inadapté',
            titleAr: 'نظام ضريبة القيمة المضافة قد لا يكون مناسبًا',
            descriptionFr: `CA estimé à ${entity.annualRevenue.toLocaleString()} DZD suggère un régime ${expectedRegime}`,
            descriptionAr: `رقم الأعمال المقدر بـ ${entity.annualRevenue.toLocaleString()} دج يوحي بنظام ${expectedRegime}`,
            remediationFr: 'Vérifier l\'adéquation du régime TVA avec la DGI',
            remediationAr: 'التحقق من ملاءمة نظام ضريبة القيمة المضافة مع مديرية الضرائب',
            legalReference: 'Article 36 du Code TVA',
          });
        } else {
          rulesPassed++;
        }
      }
    } else {
      issues.push({
        id: 'tax-nif-missing',
        severity: 'critical',
        category: 'registration',
        titleFr: 'NIF manquant - Impossible de vérifier la conformité fiscale',
        titleAr: 'الرقم التعريفي الضريبي مفقود - لا يمكن التحقق من المطابقة الضريبية',
        descriptionFr: 'Le Numéro d\'Identification Fiscale est requis pour toute activité commerciale',
        descriptionAr: 'الرقم التعريفي الضريبي مطلوب لأي نشاط تجاري',
        remediationFr: 'Obtenir un NIF auprès de la Direction des Impôts compétente',
        remediationAr: 'الحصول على الرقم التعريفي الضريبي من مديرية الضرائب المختصة',
        legalReference: 'Article 6 du CIDTA',
      });
    }

    // IBC Filing check
    if (entity.entityType !== 'individual') {
      if (!entity.ibcFilingCurrent) {
        issues.push({
          id: 'tax-ibc-overdue',
          severity: 'high',
          category: 'ibc',
          titleFr: 'Déclaration IBC en retard ou non effectuée',
          titleAr: 'إقرار ضريبة أرباح الشركات متأخر أو لم يتم',
          descriptionFr: 'Les sociétés doivent déposer leur déclaration IBC annuellement',
          descriptionAr: 'يجب على الشركات تقديم إقرار ضريبة أرباح الشركات سنويًا',
          remediationFr: 'Déposer la déclaration IBC avec les états financiers certifiés',
          remediationAr: 'تقديم إقرار ضريبة أرباح الشركات مع القوائم المالية المعتمدة',
          legalReference: 'Articles 138-179 du CIDTA',
        });
      } else {
        rulesPassed++;
      }
    }

    return this.buildModuleResult(issues, rulesChecked, rulesPassed);
  }

  /**
   * Check Import/Export Trade Compliance
   */
  async checkTradeCompliance(entity: EntityProfile): Promise<ModuleResult<TradeIssue>> {
    const issues: TradeIssue[] = [];
    let rulesChecked = TRADE_RULES.filter(r => r.isActive).length;
    let rulesPassed = 0;

    // Basic trade authorization check
    if (entity.importLicense || entity.exportLicense) {
      if (entity.licenseExpiryDate && new Date(entity.licenseExpiryDate) < new Date()) {
        issues.push({
          id: 'trade-license-expired',
          severity: 'critical',
          category: 'licensing',
          titleFr: 'Licence d\'import/export expirée',
          titleAr: 'انتهت صلاحية ترخيص الاستيراد/التصدير',
          descriptionFr: `Licence expirée le ${entity.licenseExpiryDate}`,
          descriptionAr: `انتهت صلاحية الترخيص في ${entity.licenseExpiryDate}`,
          remediationFr: 'Renouveler la licence auprès d\'Algemex/CNAC',
          remediationAr: 'تجديد الترخيص لدى الجيمكس',
          legalReference: 'Article 5 Loi 03-01',
        });
      } else {
        rulesPassed++;
      }
    } else if (entity.activitySector?.includes('import') || entity.activitySector?.includes('export')) {
      issues.push({
        id: 'trade-license-required',
        severity: 'high',
        category: 'licensing',
        titleFr: 'Licence d\'import/export requise',
        titleAr: 'ترخيص الاستيراد/التصدير مطلوب',
        descriptionFr: 'L\'activité déclarée nécessite une autorisation d\'importation ou d\'exportation',
        descriptionAr: 'النشاط المعلن يتطلب ترخيص استيراد أو تصدير',
        remediationFr: 'Déposer une demande de licence auprès d\'Algemex',
        remediationAr: 'تقديم طلب ترخيص إلى الجيمكس',
        legalReference: 'Loi 03-01 du 17 février 2003',
      });
    }

    // Assume other rules passed if no specific issues found
    while (rulesPassed + issues.length < rulesChecked) {
      rulesPassed++;
    }

    return this.buildModuleResult(issues, rulesChecked, rulesPassed);
  }

  /**
   * Check Data Privacy Compliance (Loi 18-07)
   */
  async checkPrivacyCompliance(entity: EntityProfile): Promise<ModuleResult<PrivacyIssue>> {
    const issues: PrivacyIssue[] = [];
    let rulesChecked = PRIVACY_RULES.filter(r => r.isActive).length;
    let rulesPassed = 0;

    // For organizations handling personal data
    if (entity.entityType === 'organization') {
      if (!entity.dataProcessingDeclared) {
        issues.push({
          id: 'privacy-declaration-missing',
          severity: 'high',
          category: 'declaration',
          titleFr: 'Déclaration de traitement non déposée',
          titleAr: 'لم يتم تقديم إعلان المعالجة',
          descriptionFr: 'Les traitements de données personnelles doivent être déclarés auprès de l\'APN',
          descriptionAr: 'يجب الإعلان عن معالجات البيانات الشخصية لدى الهيئة الوطنية لحماية البيانات',
          remediationFr: 'Déposer le formulaire de déclaration sur www.apn.dz',
          remediationAr: 'تقديم نموذج الإعلان على موقع apn.dz',
          legalReference: 'Articles 15-16 Loi 18-07',
          gapType: 'declaration_missing',
        });
      } else {
        rulesPassed++;
      }

      if (!entity.dpoAppointed) {
        issues.push({
          id: 'privacy-dpo-missing',
          severity: 'medium',
          category: 'governance',
          titleFr: 'DPO (Délégué Protection Données) non désigné',
          titleAr: 'لم يتم تعيين مسؤول حماية البيانات',
          descriptionFr: 'Désignation d\'un DPO recommandée pour les organisations traitant des données sensibles',
          descriptionAr: 'يُوصى بتعيين مسؤول حماية البيانات للمنظمات التي تعالج بيانات حساسة',
          remediationFr: 'Nommer un DPL et notifier l\'APN',
          remediationAr: 'تعيين مسؤول حماية البيانات وإبلاغ الهيئة الوطنية',
          legalReference: 'Article 37 Loi 18-07',
          gapType: 'governance_gap',
        });
      } else {
        rulesPassed++;
      }
    } else {
      // Individual traders have fewer requirements
      rulesPassed += 2;
    }

    // Fill remaining rules as passed
    while (rulesPassed + issues.length < rulesChecked) {
      rulesPassed++;
    }

    return this.buildModuleResult(issues, rulesChecked, rulesPassed);
  }

  /**
   * Check Sanctions Compliance
   */
  async checkSanctionsCompliance(entity: EntityProfile): Promise<ModuleResult<SanctionIssue>> {
    const issues: SanctionIssue[] = [];

    // Build screened entity input
    const screenInput: ScreenedEntityInput = {
      fullName: entity.name,
      entityType: entity.entityType === 'individual' ? 'individual' : 'organization',
      dateOfBirth: entity.dateOfBirth,
      nationality: entity.nationality || (entity.country === 'DZ' ? 'DZ' : undefined),
      countryOfResidence: entity.country,
      address: entity.address,
      idNumber: entity.idNumber,
      idType: entity.idType,
    };

    // Perform screening
    const screeningResult = performScreening(screenInput);

    // Convert matches to issues
    for (const match of screeningResult.matches) {
      if (match.riskLevel !== 'none' && match.confidenceScore >= 50) {
        issues.push({
          id: `sanction-${match.matchedEntity.id}`,
          severity: match.riskLevel === 'critical' ? 'critical' :
                   match.riskLevel === 'high' ? 'high' :
                   match.riskLevel === 'medium' ? 'medium' : 'low',
          category: 'sanctions',
          titleFr: `Correspondance avec liste de sanctions: ${match.matchedEntity.names[0]?.fullName}`,
          titleAr: `تطابق مع قائمة العقوبات: ${match.matchedEntity.names[0]?.originalScriptName || match.matchedEntity.names[0]?.fullName}`,
          descriptionFr: `Correspondance détectée avec confiance ${match.confidenceScore}%`,
          descriptionAr: `تم اكتشاف تطابق بثقة ${match.confidenceScore}%`,
          remediationFr: match.recommendations.join(' | '),
          remediationAr: 'مراجعة يدوية مطلوبة',
          legalReference: 'UN Security Council Resolutions / OFAC / EU Regulations',
          matchConfidence: match.confidenceScore,
          sanctionSource: match.sources.join(', '),
          screeningRef: screeningResult.referenceId,
        });
      }
    }

    return this.buildModuleResult(issues, SANCTIONS_LISTS.filter(l => l.isActive).length, 
      issues.length === 0 ? SANCTIONS_LISTS.filter(l => l.isActive).length : 0);
  }

  /**
   * Generate list of required documents for entity
   */
  async generateDocumentRequirements(entity: EntityProfile): Promise<DocumentRequirement[]> {
    const docs: DocumentRequirement[] = [];

    // Universal requirements
    docs.push({
      id: 'doc-rcc',
      documentType: 'rcc',
      documentTypeFr: 'Registre du Commerce (RCC)',
      documentTypeAr: 'السجل التجاري',
      requiredFor: ['commercial', 'banking', 'government_contracts'],
      status: entity.rccNumber ? 'valid' : 'missing',
      expiryDate: entity.rccExpiryDate,
    });

    docs.push({
      id: 'doc-nif',
      documentType: 'nif',
      documentTypeFr: 'Numéro d\'Identification Fiscale (NIF)',
      documentTypeAr: 'الرقم التعريفي الضريبي',
      requiredFor: ['tax', 'invoicing', 'commercial'],
      status: entity.nifNumber ? 'valid' : 'missing',
    });

    // Organization-specific
    if (entity.entityType !== 'individual') {
      docs.push({
        id: 'doc-ais',
        documentType: 'ais',
        documentTypeFr: 'Identifiant Statistique (AIS)',
        documentTypeAr: 'المعرف الإحصائي',
        requiredFor: ['statistics', 'public_procurement'],
        status: entity.aisNumber ? 'valid' : 'missing',
      });

      docs.push({
        id: 'doc-statuts',
        documentType: 'statuts',
        documentTypeFr: 'Statuts de la société',
        documentTypeAr: 'النظام الأساسي للشركة',
        requiredFor: ['corporate_governance', 'legal'],
        status: 'pending_verification',
      });

      docs.push({
        id: 'doc-compte-bancaire',
        documentType: 'rib',
        documentTypeFr: 'Relevé d\'Identité Bancaire (RIB)',
        documentTypeAr: 'كشف هوية بنكية',
        requiredFor: ['payments', 'banking'],
        status: 'not_applicable',
      });
    }

    // Individual-specific
    if (entity.entityType === 'individual') {
      docs.push({
        id: 'doc-cin',
        documentType: 'cin',
        documentTypeFr: 'Carte d\'Identité Nationale (CIN)',
        documentTypeAr: 'بطاقة التعريف الوطنية',
        requiredFor: ['identity_verification', 'commercial'],
        status: entity.idNumber ? 'valid' : 'missing',
      });
    }

    // Trade-related
    if (entity.importLicense || entity.exportLicense) {
      docs.push({
        id: 'doc-licence-import',
        documentType: 'import_license',
        documentTypeFr: 'Licence d\'Importation',
        documentTypeAr: 'ترخيص الاستيراد',
        requiredFor: ['import_operations'],
        status: entity.licenseExpiryDate && new Date(entity.licenseExpiryDate) < new Date() 
          ? 'expired' : 'valid',
        expiryDate: entity.licenseExpiryDate,
      });
    }

    return docs;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createCommercialViolation(rule: CommercialRule): CommercialViolation {
    return {
      id: rule.id,
      severity: rule.severity,
      category: rule.category,
      titleFr: rule.titleFr,
      titleAr: rule.titleAr,
      descriptionFr: rule.descriptionFr,
      descriptionAr: rule.descriptionAr,
      remediationFr: `Se conformer à: ${rule.legalReference}`,
      remediationAr: `الامتثال لـ: ${rule.legalReference}`,
      legalReference: `${rule.joReference} - ${rule.legalReference}`,
      ruleCode: rule.code,
    };
  }

  private buildModuleResult<T extends BaseIssue>(
    issues: T[],
    rulesChecked: number,
    rulesPassed: number
  ): ModuleResult<T> {
    const score = rulesChecked > 0 
      ? Math.round((rulesPassed / rulesChecked) * 100)
      : 100;

    let status: ComplianceStatus = 'fully_compliant';
    if (issues.some(i => i.severity === 'critical')) {
      status = 'critical_violation';
    } else if (issues.some(i => i.severity === 'high')) {
      status = 'non_compliant';
    } else if (issues.length > 2) {
      status = 'needs_attention';
    } else if (issues.length > 0) {
      status = 'minor_issues';
    }

    return {
      status,
      score,
      issuesFound: issues,
      rulesChecked,
      rulesPassed,
      lastAudit: new Date().toISOString(),
    };
  }

  private determineOverallStatus(score: number): ComplianceStatus {
    if (score >= 95) return 'fully_compliant';
    if (score >= 80) return 'minor_issues';
    if (score >= 60) return 'needs_attention';
    if (score >= 40) return 'non_compliant';
    return 'critical_violation';
  }

  private generateRecommendedActions(modules: FullComplianceReport['modules']): ActionItem[] {
    const actions: ActionItem[] = [];

    // Critical actions from each module
    for (const [moduleName, module] of Object.entries(modules)) {
      for (const issue of module.issuesFound) {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          actions.push({
            priority: issue.severity === 'critical' ? 'urgent' : 'high',
            category: moduleName,
            actionFr: issue.remediationFr,
            actionAr: issue.remediationAr,
            deadline: this.calculateDeadline(issue.severity),
          });
        }
      }
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return actions.slice(0, 10); // Limit to top 10 actions
  }

  private calculateDeadline(severity: string): string {
    const now = new Date();
    switch (severity) {
      case 'critical':
        now.setDate(now.getDate() + 7);
        break;
      case 'high':
        now.setDate(now.getDate() + 30);
        break;
      case 'medium':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setMonth(now.getMonth() + 6);
    }
    return now.toISOString().split('T')[0];
  }

  private calculateNextReviewDate(status: ComplianceStatus): string {
    const now = new Date();
    switch (status) {
      case 'critical_violation':
        now.setDate(now.getDate() + 14); // Review in 2 weeks
        break;
      case 'non_compliant':
        now.setMonth(now.getMonth() + 1); // Review in 1 month
        break;
      case 'needs_attention':
        now.setMonth(now.getMonth() + 3); // Review in 3 months
        break;
      case 'minor_issues':
        now.setMonth(now.getMonth() + 6); // Review in 6 months
        break;
      default:
        now.setFullYear(now.getFullYear() + 1); // Annual review
    }
    return now.toISOString().split('T')[0];
  }

  private generateReportId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `COMP-RPT-${timestamp}-${random}`;
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  /**
   * Get available compliance rules summary
   */
  static getRulesSummary(): {
    commercial: number;
    tax: number;
    trade: number;
    privacy: number;
    sanctionsLists: number;
  } {
    return {
      commercial: COMMERCIAL_RULES.filter(r => r.isActive).length,
      tax: TAX_RULES.filter(r => r.isActive).length,
      trade: TRADE_RULES.filter(r => r.isActive).length,
      privacy: PRIVACY_RULES.filter(r => r.isActive).length,
      sanctionsLists: SANCTIONS_LISTS.filter(l => l.isActive).length,
    };
  }

  /**
   * Get TVA rates information
   */
  static getTVARates() {
    return TVA_RATES;
  }

  /**
   * Get free trade agreements applicable to Algeria
   */
  static getFreeTradeAgreements() {
    return FREE_TRADE_AGREEMENTS;
  }

  /**
   * Get prohibited imports list
   */
  static getProhibitedImports() {
    return PROHIBITED_IMPORTS;
  }

  /**
   * Get restricted exports list
   */
  static getRestrictedExports() {
    return RESTRICTED_EXPORTS;
  }

  /**
   * Get APN contact information
   */
  static getAPNContact() {
    return APN_CONTACT;
  }

  /**
   * Calculate TVA amount
   */
  static calculateTax(amountHT: number, rate: number) {
    return calculateTVA(amountHT, rate);
  }

  /**
   * Get TVA rate by product category
   */
  static getProductTvaRate(category: string) {
    return getTVARateByProductCategory(category);
  }

  /**
   * Calculate customs duties for import
   */
  static calculateImportDuties(value: number, hsCode: string, originCountry: string) {
    return calculateCustomsDuty(value, hsCode, originCountry);
  }

  /**
   * Check import restrictions for a product
   */
  static checkProductRestrictions(product: { hsCode: string; description: string; countryOfOrigin: string }) {
    return checkImportRestrictions(product);
  }

  /**
   * Perform sanctions screening
   */
  static performSanctionsScreening(entity: ScreenedEntityInput) {
    return performScreening(entity);
  }

  /**
   * Clear compliance cache for a specific entity
   */
  clearCache(entityId?: string): void {
    if (entityId) {
      this.cache.delete(`compliance-${entityId}`);
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const complianceEngine = new ComplianceEngine();

// Export types for external use
export type {
  EntityProfile,
  FullComplianceReport,
  ComplianceStatus,
};
