/**
 * Commercial Activity Regulations - Code de Commerce Algérien
 * Based on: Ordonnance 75-59 du 26 septembre 1975 (Code de Commerce)
 * Modified by: Loi 18-18 du 11 juin 2018
 * 
 * Journal Officiel References:
 * - J.O N° 78 du 30 septembre 1975
 * - J.O N° 45 du 13 juin 2018
 */

export interface CommercialRule {
  id: string;
  code: string;
  category: 'registration' | 'activity' | 'accounting' | 'corporate' | 'competition';
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  legalReference: string;
  joReference: string;
  penalty: PenaltyInfo;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
}

export interface PenaltyInfo {
  descriptionFr: string;
  descriptionAr: string;
  fineAmount?: number; // in DZD
  imprisonmentDays?: number;
}

export const COMMERCIAL_RULES: CommercialRule[] = [
  // Registration Rules
  {
    id: 'comm-001',
    code: 'RC-REG-001',
    category: 'registration',
    titleFr: 'Inscription au Registre du Commerce',
    titleAr: 'التسجيل في السجل التجاري',
    descriptionFr: 'Toute personne physique ou morale exerçant une activité commerciale doit être immatriculée au Registre du Commerce (RCC) auprès du Centre National du Registre du Commerce (CNRC).',
    descriptionAr: 'يجب على كل شخص طبيعي أو معنوي يمارس نشاطًا تجاريًا أن يكون مسجلاً في السجل التجاري لدى المركز الوطني للسجل التجاري.',
    legalReference: 'Article 60 bis du Code de Commerce (Ordonnance 75-59)',
    joReference: 'J.O N° 78 du 30 septembre 1975',
    penalty: {
      descriptionFr: 'Amende de 10,000 à 100,000 DZD et fermeture de l\'établissement',
      descriptionAr: 'غرامة من 10,000 إلى 100,000 دج وإغلاق المؤسسة',
      fineAmount: 100000,
    },
    severity: 'critical',
    isActive: true,
  },
  {
    id: 'comm-002',
    code: 'NIF-REQ-001',
    category: 'registration',
    titleFr: 'Numéro d\'Identification Fiscale (NIF)',
    titleAr: 'الرقم التعريفي الضريبي',
    descriptionFr: 'L\'obtention d\'un Numéro d\'Identification Fiscale (NIF) est obligatoire pour toute entité commerciale auprès de la Direction des Impôts.',
    descriptionAr: 'الحصول على الرقم التعريفي الضريبي إلزامي لكل كيان تجاري لدى مديرية الضرائب.',
    legalReference: 'Article 6 du Code des Impôts Directs et Taxes Assimilées',
    joReference: 'J.O N° 84 du 20 décembre 1991',
    penalty: {
      descriptionFr: 'Impossibilité de facturer et pénalités de retard',
      descriptionAr: 'استحالة الفوترة وغرامات التأخير',
      fineAmount: 25000,
    },
    severity: 'critical',
    isActive: true,
  },
  {
    id: 'comm-003',
    code: 'AIS-REQ-001',
    category: 'registration',
    titleFr: 'Identifiant Statistique (AIS)',
    titleAr: 'المعرف الإحصائي',
    descriptionFr: 'Le numéro AIS (Ancien Identifiant Statistique) délivré par l\'Office National des Statistiques (ONS) est requis pour les opérations commerciales.',
    descriptionAr: 'رقم المعرف الإحصائي الصادر عن الoffice الوطني للإحصاء مطلوب للعمليات التجارية.',
    legalReference: 'Loi 84-07 du 7 juillet 1984 relative aux statistiques publiques',
    joReference: 'J.O N° 28 du 9 juillet 1984',
    penalty: {
      descriptionFr: 'Non-conformité administrative bloquant les marchés publics',
      descriptionAr: 'عدم مطابقة إدارية تعيق العقود العامة',
    },
    severity: 'high',
    isActive: true,
  },
  // Activity Rules
  {
    id: 'comm-004',
    code: 'ACT-OBJ-001',
    category: 'activity',
    titleFr: 'Conformité de l\'Objet Social',
    titleAr: 'مطابقة الغرض الاجتماعي',
    descriptionFr: 'Les activités exercées doivent être strictement conformes à l\'objet social déclaré dans les statuts déposés.',
    descriptionAr: 'يجب أن تكون الأنشطة الممارسة مطابقة تماماً للغرض الاجتماعي المعلن في النظام الأساسي المودع.',
    legalReference: 'Articles 55 à 71 du Code de Commerce',
    joReference: 'J.O N° 78 du 30 septembre 1975',
    penalty: {
      descriptionFr: 'Nullité des actes hors objet et responsabilité solidaire des gérants',
      descriptionAr: 'بطلان الأعمال خارج الغرض والمسؤولية التضامنية للمديرين',
      fineAmount: 500000,
    },
    severity: 'high',
    isActive: true,
  },
  {
    id: 'comm-005',
    code: 'ACT-LIC-001',
    category: 'activity',
    titleFr: 'Licences Sectorielles Obligatoires',
    titleAr: 'تراخيص القطاع الإلزامية',
    descriptionFr: 'Certaines activités nécessitent des autorisations spécifiques: pharmacie, produits alimentaires, produits dangereux, import/export.',
    descriptionAr: 'بعض الأنشطة تتطلب تراخيص محددة: الصيدلية، المنتجات الغذائية، المنتجات الخطرة، الاستيراد/ التصدير.',
    legalReference: 'Ordonnance 66-156 du 8 juin 1966 relative aux infractions économiques',
    joReference: 'J.O N° 48 du 16 juin 1966',
    penalty: {
      descriptionFr: 'Fermeture administrative et amende jusqu\'à 500,000 DZD',
      descriptionAr: 'إغلاق إداري وغرامة تصل إلى 500,000 دج',
      fineAmount: 500000,
      imprisonmentDays: 180,
    },
    severity: 'critical',
    isActive: true,
  },
  // Accounting Rules
  {
    id: 'comm-006',
    code: 'COMPT-CGC-001',
    category: 'accounting',
    titleFr: 'Conformité Comptable CGNC',
    titleAr: 'المطابقة المحاسبية للمحاسبة المالية',
    descriptionFr: 'Application obligatoire du Plan Comptable National (PCN) ou du Système Comptable Financier (SCF) selon la taille de l\'entreprise.',
    descriptionAr: 'تطبيق إلزامي للتخطيط المحاسبي الوطني أو النظام المحاسبي المالي حسب حجم الشركة.',
    legalReference: 'Arrêté ministériel du 26 juillet 2008 portant application du SCF',
    joReference: 'J.O N° 52 du 28 juillet 2008',
    penalty: {
      descriptionFr: 'Redressement fiscal majoré de 25% à 100%',
      descriptionAr: 'تصحيح ضريبي بنسبة 25% إلى 100%',
      fineAmount: 200000,
    },
    severity: 'high',
    isActive: true,
  },
  {
    id: 'comm-007',
    code: 'COMPT-AUDIT-001',
    category: 'accounting',
    titleFr: 'Audit des Comptes Annuels',
    titleAr: 'مراجعة الحسابات السنوية',
    descriptionFr: 'Les sociétés par actions (SPA, SAA) doivent faire certifier leurs comptes par un commissaire aux comptes agréé.',
    descriptionAr: 'يجب على شركات المساهمة اعتماد حساباتها من قبل مراقب الحسابات المعتمد.',
    legalReference: 'Article 715 bis du Code de Commerce',
    joReference: 'J.O N° 45 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Nullité de l\'assemblée générale et amende de 50,000 à 500,000 DZD',
      descriptionAr: 'بطلان الجمعية العامة وغرامة من 50,000 إلى 500,000 دج',
      fineAmount: 500000,
    },
    severity: 'medium',
    isActive: true,
  },
  // Corporate Governance
  {
    id: 'comm-008',
    code: 'CORP-AG-001',
    category: 'corporate',
    titleFr: 'Assemblées Générales Obligatoires',
    titleAr: 'الجمعيات العامة الإلزامية',
    descriptionFr: 'Convocation annuelle de l\'assemblée générale ordinaire dans les 6 mois suivant la clôture de l\'exercice.',
    descriptionAr: 'دعوة الجمعية العامة العادية سنوياً خلال الأشهر الستة التالية لإغلاق السنة المالية.',
    legalReference: 'Articles 562 à 586 du Code de Commerce',
    joReference: 'J.O N° 78 du 30 septembre 1975',
    penalty: {
      descriptionFr: 'Responsabilité personnelle des dirigeants et dissolution possible',
      descriptionAr: 'المسؤولية الشخصية للمسيرين وحل محتمل',
      fineAmount: 100000,
    },
    severity: 'medium',
    isActive: true,
  },
  // Competition Rules
  {
    id: 'comm-009',
    code: 'COMP-CONC-001',
    category: 'competition',
    titleFr: 'Interdiction des Pratiques Anticoncurrentielles',
    titleAr: 'حظر الممارسات المنافسة للمنافسة',
    descriptionFr: 'Interdiction des ententes, abus de position dominante et pratiques concertées affectant le marché algérien.',
    descriptionAr: 'حظر الاتفاقات وسوء استخدام الموقف المهيمن والممارسات المنسقة التي تؤثر على السوق الجزائري.',
    legalReference: 'Ordonnance 03-03 du 19 juillet 2003 relative à la concurrence',
    joReference: 'J.O N° 49 du 22 juillet 2003',
    penalty: {
      descriptionFr: 'Amende jusqu\'à 10% du chiffre d\'affaires',
      descriptionAr: 'غرامة تصل إلى 10% من رقم الأعمال',
      fineAmount: 0, // Percentage based
    },
    severity: 'critical',
    isActive: true,
  },
];

// Helper functions for commercial rule validation
export function validateCommercialRegistration(entity: {
  hasRcc: boolean;
  rccNumber?: string;
  rccExpiryDate?: string;
}): ComplianceCheckResult {
  const violations: Violation[] = [];
  
  if (!entity.hasRcc || !entity.rccNumber) {
    violations.push({
      ruleId: 'comm-001',
      ruleCode: 'RC-REG-001',
      severity: 'critical',
      messageFr: 'Absence d\'immatriculation au Registre du Commerce',
      messageAr: 'غياب التسجيل في السجل التجاري',
      remediationFr: 'Déposer un dossier d\'inscription au CNRC avec les documents requis',
      remediationAr: 'قدم ملف التسجيل في المركز الوطني للسجل التجاري مع المستندات المطلوبة',
    });
  } else if (entity.rccExpiryDate && new Date(entity.rccExpiryDate) < new Date()) {
    violations.push({
      ruleId: 'comm-001',
      ruleCode: 'RC-REG-001',
      severity: 'high',
      messageFr: 'Registre du Commerce expiré',
      messageAr: 'انتهاء صلاحية السجل التجاري',
      remediationFr: 'Renouveler l\'inscription au CNRC avant toute activité commerciale',
      remediationAr: 'تجديد التسجيل في المركز الوطني للسجل التجاري قبل أي نشاط تجاري',
    });
  }
  
  return { isValid: violations.length === 0, violations };
}

export interface Violation {
  ruleId: string;
  ruleCode: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  messageFr: string;
  messageAr: string;
  remediationFr: string;
  remediationAr: string;
}

export interface ComplianceCheckResult {
  isValid: boolean;
  violations: Violation[];
  score?: number;
}

export function getCommercialRulesByCategory(category: CommercialRule['category']): CommercialRule[] {
  return COMMERCIAL_RULES.filter(rule => rule.category === category && rule.isActive);
}

export function getCommercialRuleById(id: string): CommercialRule | undefined {
  return COMMERCIAL_RULES.find(rule => rule.id === id);
}
