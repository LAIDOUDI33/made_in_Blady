/**
 * Import/Export Trade Regulations - Algeria Customs (Algérie Douanes)
 * Based on:
 * - Loi 03-01 du 17 février 2003 relative au commerce extérieur
 * - Décret exécutif 05-135 du 15 mai 2005
 * - Ordonnance 66-156 du 8 juin 1966 (infractions économiques)
 * 
 * Journal Officiel References:
 * - J.O N° 12 du 18 février 2003
 * - J.O N° 34 du 17 mai 2005
 */

export interface TradeRule {
  id: string;
  code: string;
  category: 'import' | 'export' | 'transit' | 'origin' | 'licensing' | 'prohibited';
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  restrictions?: string[];
  requiredDocuments?: DocumentRequirement[];
  legalReference: string;
  joReference: string;
  penalty: TradePenalty;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
}

export interface DocumentRequirement {
  type: string;
  issuingAuthority: string;
  validityPeriod?: string;
  mandatory: boolean;
}

export interface TradePenalty {
  descriptionFr: string;
  descriptionAr: string;
  confiscationRisk: boolean;
  fineRange?: { min: number; max: number }; // DZD
  imprisonmentDays?: number;
}

// Prohibited Import Items (Liste Négative)
export const PROHIBITED_IMPORTS: ProhibitedItem[] = [
  {
    hsCode: '8703.*',
    category: 'Véhicules usagés de plus de 5 ans',
    categoryAr: 'سيارات مستعملة أكثر من 5 سنوات',
    reason: 'Protection environnementale et sécurité routière',
    reasonAr: 'حماية البيئة والسلامة الطريقية',
    exception: 'Véhicules diplomatiques et cas particuliers autorisés',
    exceptionAr: 'سيارات دبلوماسية وحالات خاصة مرخص بها',
  },
  {
    hsCode: '0401.*|0402.*',
    category: 'Produits laitiers étrangers',
    categoryAr: 'منتجات ألبان أجنبية',
    reason: 'Protection de la production locale',
    reasonAr: 'حماية الإنتاج المحلي',
    exception: 'Produits sans équivalent local (autorisation spéciale)',
    exceptionAr: 'منتجات بدون بديل محلي (تصريح خاص)',
  },
  {
    hsCode: '2401.*|2402.*',
    category: 'Tabac et cigarettes',
    categoryAr: 'تبغ وسجائر',
    reason: 'Monopole d\'État via SN TABAC',
    reasonAr: 'احتكار الدولة عبر شركة التباغ الوطنية',
    exception: 'Aucune exception',
    exceptionAr: 'لا استثناء',
  },
];

// Restricted Export Items (Licence Requise)
export const RESTRICTED_EXPORTS: RestrictedItem[] = [
  {
    hsCode: '2709.*',
    category: 'Hydrocarbures bruts',
    categoryAr: 'مركبات هيدروكربونية خام',
    licenseType: 'Autorisation Sonatrach',
    restrictionReason: 'Ressource stratégique nationale',
    restrictionReasonAr: 'موارد استراتيجية وطنية',
  },
  {
    hsCode: '1001.*|1006.*',
    category: 'Céréales (Blé, Riz)',
    categoryAr: 'حبوب (قمح، أرز)',
    licenseType: 'Certificat OAIC',
    restrictionReason: 'Sécurité alimentaire nationale',
    restrictionReasonAr: 'الأمن الغذائي الوطني',
  },
  {
    hsCode: '2601.*',
    category: 'Minerais de fer et concentrés',
    categoryAr: 'خامات الحديد ومركزاتها',
    licenseType: 'Autorisation Ministère Industrie',
    restrictionReason: 'Matières premières stratégiques',
    restrictionReasonAr: 'مواد أولية استراتيجية',
  },
];

export interface ProhibitedItem {
  hsCode: string;
  category: string;
  categoryAr: string;
  reason: string;
  reasonAr: string;
  exception: string;
  exceptionAr: string;
}

export interface RestrictedItem {
  hsCode: string;
  category: string;
  categoryAr: string;
  licenseType: string;
  restrictionReason: string;
  restrictionReasonAr: string;
}

export const TRADE_RULES: TradeRule[] = [
  // Import Licensing
  {
    id: 'trade-001',
    code: 'IMP-LIC-001',
    category: 'licensing',
    titleFr: 'Licence d\'Importation Obligatoire',
    titleAr: 'ترخيص الاستيراد الإلزامي',
    descriptionFr: 'Toute opération d\'importation nécessite une licence d\'importation délivrée par Algemex (Centre de Gestion des Opérations Commerciales).',
    descriptionAr: 'كل عملية استيراد تتطلب ترخيص استيراد تصدره شركة الجيمكس (مركز إدارة العمليات التجارية).',
    requiredDocuments: [
      { type: 'Licence d\'Importation Algemex', issuingAuthority: 'Algemex/CNAC', mandatory: true },
      { type: 'Certificat d\'Origine', issuingAuthority: 'Chambre de Commerce/Pays exportateur', mandatory: true },
      { type: 'Certificat de Conformité', issuingAuthority: 'Organisme accrédité (QAI)', mandatory: true },
    ],
    legalReference: 'Article 5 de la Loi 03-01 du 17 février 2003',
    joReference: 'J.O N° 12 du 18 février 2003',
    penalty: {
      descriptionFr: 'Confiscation des marchandises + amende équivalente à la valeur + frais de destruction',
      descriptionAr: 'مصادرة البضائع + غرامة معادلة للقيمة + مصاريف التدمير',
      confiscationRisk: true,
      fineRange: { min: 0, max: 0 }, // Value-based
    },
    riskLevel: 'critical',
    isActive: true,
  },
  {
    id: 'trade-002',
    code: 'IMP-PAY-001',
    category: 'import',
    titleFr: 'Règlement des Importations (CRM)',
    titleAr: 'تسوية الاستيرادات (شهادة نقل الأموال)',
    descriptionFr: 'Tout importateur doit justifier du règlement des importations via le Certificat de Rapatriement des Devises (CRM).',
    descriptionAr: 'يجب على كل مستورد إثبات تسوية الاستيرادات عبر شهادة تحويل العملات.',
    requiredDocuments: [
      { type: 'Attestation CRM', issuingAuthority: 'Banque Algérienne', validityPeriod: 'Validité liée au dédouanement', mandatory: true },
      { type: 'Document C110/C121', issuingAuthority: 'Douanes Algériennes', mandatory: true },
    ],
    legalReference: 'Instruction Banque d\'Algérie N°04-2000',
    joReference: 'Bulletin Officiel BA N° 29',
    penalty: {
      descriptionFr: 'Suspension des droits à l\'import + radiation du registre des importateurs',
      descriptionAr: 'تعليق حقوق الاستيراد + شطب من سجل المستوردين',
      confiscationRisk: false,
    },
    riskLevel: 'high',
    isActive: true,
  },
  // Certificate of Conformity
  {
    id: 'trade-003',
    code: 'IMP-QC-001',
    category: 'import',
    titleFr: 'Contrôle Qualité Importations',
    titleAr: 'مراقبة جودة الاستيرادات',
    descriptionFr: 'Les produits importés doivent être conformes aux normes algériennes (IAI) et disposer d\'un certificat QAI (Qualité Algérie Import).',
    descriptionAr: 'يجب أن تكون المنتجات المستوردة مطابقة للمعايير الجزائرية ولديها شهادة الجودة الجزائرية للاستيراد.',
    requiredDocuments: [
      { type: 'Certificat de Conformité QAI', issuingAuthority: 'QAI (Qualité Algérie Import)', mandatory: true },
      { type: 'Rapport d\'Essai Laboratoire', issuingAuthority: 'Laboratoire accrédité', mandatory: false },
    ],
    legalReference: 'Décret exécutif 05-135 du 15 mai 2005',
    joReference: 'J.O N° 34 du 17 mai 2005',
    penalty: {
      descriptionFr: 'Rejet à la frontière + renvoi aux frais de l\'importateur',
      descriptionAr: 'رفض عند الحدود + إعادة على حساب المستورد',
      confiscationRisk: false,
      fineRange: { min: 500000, max: 5000000 },
    },
    riskLevel: 'high',
    isActive: true,
  },
  // Origin Rules
  {
    id: 'trade-004',
    code: 'ORIG-RUL-001',
    category: 'origin',
    titleFr: 'Règles d\'Origine Préférentielle',
    titleAr: 'قواعد المنشأ التفضيلي',
    descriptionFr: 'Pour bénéficier des accords préférentiels (Zone Arabe, UMA, ALE), les produits doivent satisfaire les règles d\'origine.',
    descriptionAr: 'للاستفادة من الاتفاقيات التفضيلية (المنطقة العربية، اتحاد المغرب العربي، منطقة التجارة الحرة العربية)، يجب أن تلبي المنتجات قواعد المنشأ.',
    legalReference: 'Accords d\'Association et Préférences Commerciales',
    joReference: 'J.O divers selon accord',
    penalty: {
      descriptionFr: 'Perte des avantages tarifaires + redressement douanier',
      descriptionAr: 'فقدان المزايا الجمركية + تصحيح جمركي',
      confiscationRisk: false,
    },
    riskLevel: 'medium',
    isActive: true,
  },
  // Transit Operations
  {
    id: 'trade-005',
    code: 'TRANSIT-OP-001',
    category: 'transit',
    titleFr: 'Opérations de Transit Douanier',
    titleAr: 'عمليات العبور الجمركي',
    descriptionFr: 'Le transit douanier est soumis à caution et accompagnement agréé. Délai maximum: 30 jours renouvelables.',
    descriptionAr: 'العبر الجمركي خاضع لكفالة ومرافقة معتمدة. المدة القصوى: 30 يوم قابلة للتجديد.',
    requiredDocuments: [
      { type: 'Carnet TIR', issuingAuthority: 'Union Internationale Routière', mandatory: false },
      { type: 'Cautionnement bancaire', issuingAuthority: 'Banque agréée', mandatory: true },
    ],
    legalReference: 'Convention TIR et Code des Douanes Algérien',
    joReference: 'J.O N° 48 du 16 juin 1966',
    penalty: {
      descriptionFr: 'Confiscation de la caution + poursuites pénales pour fraude',
      descriptionAr: 'مصادرة الكفالة + ملاحقات جزائية لغش',
      confiscationRisk: true,
      imprisonmentDays: 365,
    },
    riskLevel: 'high',
    isActive: true,
  },
  // Strategic Products
  {
    id: 'trade-006',
    code: 'STRAT-PROD-001',
    category: 'prohibited',
    titleFr: 'Produits Stratégiques Contrôlés',
    titleAr: 'منتجات استراتيجية خاضعة للرقابة',
    descriptionFr: 'Les hydrocarbures, armes, munitions, technologies dual-use sont sous contrôle strict de l\'État.',
    descriptionAr: 'المركبات الهيدروكربونية والأسلحة والذخيرة والتكنولوجيا المزدودة الاستخدام تحت رقابة صارمة من الدولة.',
    legalReference: 'Loi 91-11 du 27 avril 1991 (hydrocarbures) + Réglementation défense',
    joReference: 'J.O N° 28 du 1er mai 1991',
    penalty: {
      descriptionFr: 'Crimes relevant de la Cour Suprême + peines criminelles',
      descriptionAr: 'جرائم تدخل في اختصاص المحكمة العليا + عقوبات جنائية',
      confiscationRisk: true,
      imprisonmentDays: 1825, // Up to 5 years
    },
    riskLevel: 'critical',
    isActive: true,
  },
];

// Free Trade Agreements Applicable to Algeria
export const FREE_TRADE_AGREEMENTS: TradeAgreement[] = [
  {
    name: 'Accord d\'Association UE-Algérie',
    nameAr: 'اتفاق الشراكة بين الجزائر والاتحاد الأوروبي',
    effectiveDate: '2005-09-01',
    status: 'active',
    preferences: 'Droits réduits progressivement pour produits industriels',
    preferencesAr: 'رسوم مخفضة تدريجياً للمنتجات الصناعية',
  },
  {
    name: 'Zone Arabe Libre Échange (ZALE)',
    nameAr: 'منطقة التجارة الحرة العربية',
    effectiveDate: '1998-01-01',
    status: 'active',
    preferences: 'Exonération droits de douane entre pays arabes',
    preferencesAr: 'إعفاء من رسوم الجمارك بين الدول العربية',
  },
  {
    name: 'Union du Maghreb Arabe (UMA)',
    nameAr: 'اتحاد المغرب العربي',
    effectiveDate: '1989-02-17',
    status: 'partial',
    preferences: 'Accords bilatéraux en cours de négociation',
    preferencesAr: 'اتفاقات ثنائية قيد التفاوض',
  },
  {
    name: 'Accord de libre-échange Turquie',
    nameAr: 'اتفاق التجارة الحرة مع تركيا',
    effectiveDate: '2007-01-01',
    status: 'suspended',
    preferences: 'Suspendu depuis 2017',
    preferencesAr: 'معلق منذ 2017',
  },
];

export interface TradeAgreement {
  name: string;
  nameAr: string;
  effectiveDate: string;
  status: 'active' | 'partial' | 'suspended' | 'negotiating';
  preferences: string;
  preferencesAr: string;
}

// Helper functions for trade validation
export function checkImportRestrictions(product: {
  hsCode: string;
  description: string;
  countryOfOrigin: string;
}): TradeCheckResult {
  const warnings: TradeWarning[] = [];
  const blocks: TradeBlock[] = [];

  // Check prohibited items
  for (const item of PROHIBITED_IMPORTS) {
    if (matchHSCode(product.hsCode, item.hsCode)) {
      blocks.push({
        type: 'PROHIBITED',
        messageFr: `Import interdit: ${item.category}`,
        messageAr: `استيراد ممنوع: ${item.categoryAr}`,
        reason: item.reason,
        reasonAr: item.reasonAr,
        exception: item.exception,
        exceptionAr: item.exceptionAr,
      });
    }
  }

  // Check restricted items
  for (const item of RESTRICTED_EXPORTS) {
    if (matchHSCode(product.hsCode, item.hsCode)) {
      warnings.push({
        type: 'RESTRICTED',
        messageFr: `Import restreint: ${item.category} - ${item.licenseType} requise`,
        messageAr: `استيراد مقيد: ${item.categoryAr} - ${item.licenseType} مطلوبة`,
        actionRequired: `Obtenir ${item.licenseType} avant importation`,
      });
    }
  }

  return {
    canProceed: blocks.length === 0,
    warnings,
    blocks,
  };
}

export function matchHSCode(code: string, pattern: string): boolean {
  // Simple wildcard matching for HS codes
  const regexPattern = pattern.replace(/\./g, '.').replace(/\*/g, '.*');
  return new RegExp(`^${regexPattern}$`).test(code);
}

export interface TradeWarning {
  type: 'RESTRICTED' | 'LICENSE_REQUIRED' | 'QUOTA' | 'DOCUMENT_MISSING';
  messageFr: string;
  messageAr: string;
  actionRequired: string;
}

export interface TradeBlock {
  type: 'PROHIBITED' | 'SANCTIONED' | 'EMBARGO';
  messageFr: string;
  messageAr: string;
  reason: string;
  reasonAr: string;
  exception?: string;
  exceptionAr?: string;
}

export interface TradeCheckResult {
  canProceed: boolean;
  warnings: TradeWarning[];
  blocks: TradeBlock[];
}

export function getTradeRulesByCategory(category: TradeRule['category']): TradeRule[] {
  return TRADE_RULES.filter(rule => rule.category === category && rule.isActive);
}

export function calculateCustomsDuty(value: number, hsCode: string, originCountry: string): CustomsCalculation {
  // Simplified calculation - actual rates depend on detailed tariff schedules
  let dutyRate = 30; // Default MFN rate for Algeria (generally 5-30%)
  
  // Apply preferential rates if applicable
  const euCountries = ['FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'GR', 'AT', 'FI', 'SE', 'IE', 'DK', 'LU', 'CY', 'MT', 'SI', 'SK', 'EE', 'LV', 'LT', 'PL', 'CZ', 'HU', 'HR', 'BG', 'RO'];
  const arabCountries = ['TN', 'MA', 'LY', 'MR', 'EG', 'JO', 'SY', 'LB', 'IQ', 'KW', 'SA', 'AE', 'QA', 'BH', 'OM', 'YE', 'SD', 'DJ', 'SO', 'KM', 'PS'];
  
  if (euCountries.includes(originCountry)) {
    dutyRate = Math.max(0, dutyRate - 5); // Association agreement reduction
  }
  if (arabCountries.includes(originCountry)) {
    dutyRate = 0; // Arab Free Trade Zone
  }

  const customsDuty = value * (dutyRate / 100);
  const tvaBase = value + customsDuty;
  const tva = tvaBase * 0.19; // Standard TVA on imports

  return {
    cifValue: value,
    customsDutyRate: dutyRate,
    customsDuty,
    tvaBase,
    tva,
    totalDutiesPayable: customsDuty + tva,
  };
}

export interface CustomsCalculation {
  cifValue: number;
  customsDutyRate: number;
  customsDuty: number;
  tvaBase: number;
  tva: number;
  totalDutiesPayable: number;
}
