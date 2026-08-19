/**
 * TVA and Tax Compliance Rules - Algeria
 * Based on: Code des Impôts Directs et Taxes Assimilées (CIDTA)
 * Taxe sur la Valeur Ajoutée (TVA)
 * 
 * Legal References:
 * - Loi de Finances Annuelle (LFA)
 - Ordonnance 76-147 du 17 novembre 1976
 * - J.O N° 87 du 24 novembre 1976
 */

export interface TaxRule {
  id: string;
  code: string;
  category: 'tva' | 'irg' | 'ibc' | 'taps' | 'declaration' | 'withholding';
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  rate?: number; // TVA rates or tax percentages
  threshold?: number; // DZD thresholds
  legalReference: string;
  joReference: string;
  penalty: TaxPenalty;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'transaction';
  isActive: boolean;
}

export interface TaxPenalty {
  descriptionFr: string;
  descriptionAr: string;
  interestRate?: number; // Monthly interest for late payment
  fixedFine?: number; // Fixed amount in DZD
  percentageFine?: number; // Percentage of unpaid tax
}

export interface TVARate {
  code: string;
  rate: number;
  labelFr: string;
  labelAr: string;
  applicableTo: string[];
  examples: string[];
}

// Official Algerian TVA Rates
export const TVA_RATES: TVARate[] = [
  {
    code: 'TVA-NORMAL',
    rate: 19,
    labelFr: 'Taux Normal',
    labelAr: 'النسبة الطبيعية',
    applicableTo: ['Biens et services courants', 'Produits manufacturés', 'Prestations de services'],
    examples: [
      'Véhicules automobiles neufs',
      'Électronique grand public',
      'Services de consultation',
      'Hôtellerie et restauration haut de gamme',
    ],
  },
  {
    code: 'TVA-REDUIT',
    rate: 9,
    labelFr: 'Taux Réduit',
    labelAr: 'النسبة المخفضة',
    applicableTo: ['Biens de première nécessité', 'Énergie', 'Transports'],
    examples: [
      'Huiles alimentaires',
      'Sucre et farine',
      'Électricité domestique',
      'Transport de voyageurs',
    ],
  },
  {
    code: 'TVA-EXONERE',
    rate: 0,
    labelFr: 'Taux Zéro / Exonéré',
    labelAr: 'النسبة صفر / معفاة',
    applicableTo: ['Exportations', 'Matières premières', 'Produits pharmaceutiques'],
    examples: [
      'Exportations de biens et services',
      'Médicaments et matériel médical',
      'Livres scolaires et universitaires',
      'Produits agricoles de base',
    ],
  },
];

export const TAX_RULES: TaxRule[] = [
  // TVA Declaration Rules
  {
    id: 'tax-001',
    code: 'TVA-DEC-001',
    category: 'tva',
    titleFr: 'Déclaration Mensuelle TVA',
    titleAr: 'إقرار ضريبة القيمة المضافة الشهري',
    descriptionFr: 'Les entreprises réalisant un chiffre d\'affaires supérieur à 30,000,000 DZD doivent déclarer la TVA mensuellement avant le 21 du mois suivant.',
    descriptionAr: 'يجب على الشركات التي تحقق رقم أعمال يتجاوز 30,000,000 دج أن تعلن عن ضريبة القيمة المضافة شهرياً قبل يوم 21 من الشهر التالي.',
    rate: 19,
    threshold: 30000000,
    legalReference: 'Article 36 du Code TVA (Ordonnance 76-147)',
    joReference: 'J.O N° 87 du 24 novembre 1976',
    penalty: {
      descriptionFr: 'Majoration de 5% + 0.5% par mois de retard + intérêts de retard (1%/mois)',
      descriptionAr: 'زيادة 5% + 0.5% لكل شهر تأخير + فائدة تأخير (1%/شهر)',
      percentageFine: 5,
      interestRate: 1,
    },
    frequency: 'monthly',
    isActive: true,
  },
  {
    id: 'tax-002',
    code: 'TVA-DEC-002',
    category: 'tva',
    titleFr: 'Déclaration Trimestrielle TVA',
    titleAr: 'إقرار ضريبة القيمة المضافة ربع سنوي',
    descriptionFr: 'Les entreprises avec CA inférieur à 30,000,000 DZD peuvent opter pour une déclaration trimestrielle.',
    descriptionAr: 'يمكن للشركات التي يقل رقم أعمالها عن 30,000,000 دج اختيار الإقرار ربع السنوي.',
    threshold: 30000000,
    legalReference: 'Article 37 du Code TVA',
    joReference: 'J.O N° 87 du 24 novembre 1976',
    penalty: {
      descriptionFr: 'Majorations identiques au régime mensuel',
      descriptionAr: 'زيادات مماثلة للنظام الشهري',
      percentageFine: 5,
      interestRate: 1,
    },
    frequency: 'quarterly',
    isActive: true,
  },
  // IRG (Impôt sur le Revenu Global)
  {
    id: 'tax-003',
    code: 'IRG-SAL-001',
    category: 'irg',
    titleFr: 'Retenue IRG sur Salaires',
    titleAr: 'اقتطاع الضريبة على الدخل العالمي من الرواتب',
    descriptionFr: 'L\'employeur doit effectuer la retenue à la source de l\'IRG sur les salaires selon le barème progressif.',
    descriptionAr: 'يجب على صاحب العمل إجراء الاقتطاع من المصدر للضريبة على الدخل العالمي من الرواتب وفقاً للجدول التصاعدي.',
    legalReference: 'Articles 103 à 137 du CIDTA',
    joReference: 'J.O N° 84 du 20 décembre 1991',
    penalty: {
      descriptionFr: 'Responsabilité solidaire employeur/employé + pénalité de 25%',
      descriptionAr: 'مسؤولية تضامنية صاحب عمل/موظف + جزاء 25%',
      percentageFine: 25,
    },
    frequency: 'monthly',
    isActive: true,
  },
  // IBC (Impôt sur les Bénéfices des Sociétés)
  {
    id: 'tax-004',
    code: 'IBC-ANN-001',
    category: 'ibc',
    titleFr: 'Impôt sur les Bénéfices des Sociétés',
    titleAr: 'ضريبة أرباح الشركات',
    descriptionFr: 'Taux d\'IBC variable selon le secteur: 19% général, 26% activités de distribution, exonérations pour zones franches.',
    descriptionAr: 'نسبة ضريبة أرباح الشركات متغيرة حسب القطاع: 19% عام، 26% أنشطة التوزيع، إعفاءات للمناطق الحرة.',
    rate: 19,
    legalReference: 'Articles 138 à 179 du CIDTA',
    joReference: 'J.O N° 84 du 20 décembre 1991',
    penalty: {
      descriptionFr: 'Majoration de 10% + intérêts de retard 1% mensuel',
      descriptionAr: 'زيادة 10% + فائدة تأخير 1% شهرياً',
      percentageFine: 10,
      interestRate: 1,
    },
    frequency: 'annual',
    isActive: true,
  },
  // TAPS (Taxe sur l'Activité Professionnelle)
  {
    id: 'tax-005',
    code: 'TAPS-PRO-001',
    category: 'taps',
    titleFr: 'Taxe sur l\'Activité Professionnelle',
    titleAr: 'ضريبة النشاط المهني',
    descriptionFr: 'La TAPS est due par toute personne physique ou morale exerçant une activité non salariée en Algérie.',
    descriptionAr: 'ضريبة النشاط المهني مستحقة على كل شخص طبيعي أو معنوي يمارس نشاطًا غير مأجور في الجزائر.',
    rate: 2, // Generally 2% of location value
    legalReference: 'Articles 200 à 217 du CIDTA',
    joReference: 'J.O N° 84 du 20 décembre 1991',
    penalty: {
      descriptionFr: 'Majoration de 10% + pénalité de 25% après mise en demeure',
      descriptionAr: 'زيادة 10% + جزاء 25% بعد الإنذار',
      percentageFine: 10,
    },
    frequency: 'annual',
    isActive: true,
  },
  // Withholding Tax on Payments to Non-Residents
  {
    id: 'tax-006',
    code: 'RET-NRES-001',
    category: 'withholding',
    titleFr: 'Retenue à la Source Paiements Non-Résidents',
    titleAr: 'اقتطاع من المصدر للمدفوعات لغير المقيمين',
    descriptionFr: 'Les paiements à l\'étranger pour services techniques, redevances, assistance technique sont soumis à retenue (24% ou 14%).',
    descriptionAr: 'المدفوعات للخارج مقابل خدمات تقنية ورسوم ومساعدة تقارية خاضعة للاقتطاع (24% أو 14%).',
    rate: 24,
    legalReference: 'Article 148 du CIDTA modifié par LFC 2020',
    joReference: 'J.O N° 79 du 27 décembre 2020',
    penalty: {
      descriptionFr: 'Responsabilité du verseur + majorations de retard',
      descriptionAr: 'مسؤولية الدافع + زيادات التأخير',
      percentageFine: 15,
    },
    frequency: 'transaction',
    isActive: true,
  },
  // Tax Invoice Requirements
  {
    id: 'tax-007',
    code: 'FAC-TVA-001',
    category: 'declaration',
    titleFr: 'Obligations Facturation TVA',
    titleAr: 'التزامات فوترة ضريبة القيمة المضافة',
    descriptionFr: 'Toute facture doit mentionner: NIF vendeur/acheteur, montant HT, taux TVA, montant TVA, total TTC.',
    descriptionAr: 'يجب أن تذكر كل فاتورة: الرقم التعريفي الضريبي البائع/المشتري، المبلغ بدون الضريبة، نسبة الضريبة، مبلغ الضريبة، المجموع شامل الضريبة.',
    legalReference: 'Article 14 du Code TVA et Arrêté interministériel',
    joReference: 'J.O N° 35 du 23 mai 2016',
    penalty: {
      descriptionFr: 'Rejet du droit à déduction + amende de 1,000 à 10,000 DZD par facture irrégulière',
      descriptionAr: 'رفض حق الخصم + غرامة من 1,000 إلى 10,000 دج لكل فاتورة غير منتظمة',
      fixedFine: 10000,
    },
    frequency: 'transaction',
    isActive: true,
  },
];

// IRG Brackets (Barème IRG)
export const IRG_BRACKETS = [
  { min: 0, max: 120000, rate: 0, abatement: 0 },        // Exonéré
  { min: 120001, max: 360000, rate: 20, abatement: 24000 },
  { min: 360001, max: 1440000, rate: 30, abatement: 60000 },
  { min: 1440001, max: Infinity, rate: 35, abatement: 132000 },
];

// Helper functions for tax calculations
export function calculateTVA(amountHT: number, rate: number): number {
  return Math.round(amountHT * (rate / 100) * 100) / 100;
}

export function calculateIRG(annualIncome: number): number {
  let irg = 0;
  for (const bracket of IRG_BRACKETS) {
    if (annualIncome > bracket.min) {
      const taxableInBracket = Math.min(annualIncome, bracket.max) - bracket.min + 1;
      irg += (taxableInBracket * bracket.rate) / 100;
    }
  }
  return Math.round(irg - findAbatement(annualIncome));
}

function findAbatement(income: number): number {
  for (const bracket of IRG_BRACKETS) {
    if (income >= bracket.min && income <= bracket.max) {
      return bracket.abatement;
    }
  }
  return IRG_BRACKETS[IRG_BRACKETS.length - 1].abatement;
}

export function validateTaxCompliance(entity: {
  nif?: string;
  annualRevenue?: number;
  tvaDeclarationsCurrent?: boolean;
  ibcDeclarationsCurrent?: boolean;
  lastDeclarationDate?: string;
}): TaxComplianceResult {
  const issues: TaxIssue[] = [];
  
  if (!entity.nif) {
    issues.push({
      ruleId: 'tax-nif',
      severity: 'critical',
      messageFr: 'Numéro d\'Identification Fiscale manquant',
      messageAr: 'الرقم التعريفي الضريبي مفقود',
      remediation: 'Obtenir un NIF auprès de la Direction des Impôts compétente',
    });
  }
  
  if (!entity.tvaDeclarationsCurrent) {
    issues.push({
      ruleId: 'tax-001',
      severity: 'high',
      messageFr: 'Déclarations TVA non à jour',
      messageAr: 'إقرارات ضريبة القيمة المضافة غير محدثة',
      remediation: 'Régulariser les déclarations TVA en retard avec les pénalités applicables',
    });
  }
  
  return {
    isCompliant: issues.length === 0,
    score: Math.max(0, 100 - issues.length * 20),
    issues,
  };
}

export interface TaxIssue {
  ruleId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  messageFr: string;
  messageAr: string;
  remediation: string;
}

export interface TaxComplianceResult {
  isCompliant: boolean;
  score: number;
  issues: TaxIssue[];
}

export function getTVARateByProductCategory(category: string): number {
  // Simplified mapping - in production, use comprehensive product database
  const reducedCategories = ['food', 'energy', 'transport', 'agriculture'];
  const exemptCategories = ['pharmaceutical', 'education', 'exports', 'books'];
  
  if (exemptCategories.some(c => category.toLowerCase().includes(c))) return 0;
  if (reducedCategories.some(c => category.toLowerCase().includes(c))) return 9;
  return 19;
}

export function getTaxRulesByCategory(category: TaxRule['category']): TaxRule[] {
  return TAX_RULES.filter(rule => rule.category === category && rule.isActive);
}
