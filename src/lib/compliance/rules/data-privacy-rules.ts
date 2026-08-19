/**
 * Data Privacy & Personal Data Protection Rules - Algeria
 * Based on:
 * - Loi 18-07 du 10 juin 2018 relative à la protection des personnes physiques
 *   dans le traitement des données à caractère personnel
 * - Décret exécutif 18-136 du 22 mai 2018
 * 
 * Journal Officiel References:
 * - J.O N° 44 du 13 juin 2018
 * - J.O N° 41 du 24 mai 2018
 * 
 * Note: Algeria's data protection law is modeled after GDPR but with local specifics.
 */

export interface PrivacyRule {
  id: string;
  code: string;
  category: 'consent' | 'collection' | 'processing' | 'storage' | 'transfer' | 'rights' | 'security';
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  requirements: PrivacyRequirement[];
  legalReference: string;
  joReference: string;
  penalty: PrivacyPenalty;
  dataTypesAffected: string[];
  isActive: boolean;
}

export interface PrivacyRequirement {
  id: string;
  descriptionFr: string;
  descriptionAr: string;
  implementationNotes: string;
  mandatory: boolean;
}

export interface PrivacyPenalty {
  descriptionFr: string;
  descriptionAr: string;
  fineRange?: { min: number; max: number }; // In millions DZD
  criminalSanction?: string;
}

// Data Categories Under Protection
export const PROTECTED_DATA_CATEGORIES: DataCategory[] = [
  {
    id: 'personal-basic',
    categoryFr: 'Données personnelles de base',
    categoryAr: 'البيانات الشخصية الأساسية',
    examples: ['Nom et prénom', 'Adresse postale', 'Numéro de téléphone', 'Email'],
    sensitivityLevel: 'standard',
  },
  {
    id: 'personal-id',
    categoryFr: 'Données d\'identification',
    categoryAr: 'بيانات الهوية',
    examples: ['Numéro CIN/NIN', 'Passeport', 'Permis de conduire', 'Registre de Commerce'],
    sensitivityLevel: 'high',
  },
  {
    id: 'financial',
    categoryFr: 'Données financières',
    categoryAr: 'البيانات المالية',
    examples: ['Revenus', 'Historique bancaire', 'NIF', 'Informations fiscales'],
    sensitivityLevel: 'high',
  },
  {
    id: 'health',
    categoryFr: 'Données de santé',
    categoryAr: 'البيانات الصحية',
    examples: ['Antécédents médicaux', 'Couverture maladie', 'Informations génétiques'],
    sensitivityLevel: 'sensitive',
  },
  {
    id: 'biometric',
    categoryFr: 'Données biométriques',
    categoryAr: 'البيانات البيومترية',
    examples: ['Empreintes digitales', 'Reconnaissance faciale', 'Signature vocale'],
    sensitivityLevel: 'sensitive',
  },
  {
    id: 'location',
    categoryFr: 'Données de géolocalisation',
    categoryAr: 'بيانات الموقع الجغرافي',
    examples: ['GPS temps réel', 'Historique de déplacement'],
    sensitivityLevel: 'high',
  },
];

export interface DataCategory {
  id: string;
  categoryFr: string;
  categoryAr: string;
  examples: string[];
  sensitivityLevel: 'standard' | 'high' | 'sensitive';
}

export const PRIVACY_RULES: PrivacyRule[] = [
  // Consent Requirements
  {
    id: 'privacy-001',
    code: 'CONSENT-EXP-001',
    category: 'consent',
    titleFr: 'Consentement Exprès et Éclairé',
    titleAr: 'موافقة صريحة ومستنيرة',
    descriptionFr: 'Tout traitement de données personnelles nécessite le consentement exprès et éclairé de la personne concernée.',
    descriptionAr: 'يتطلب أي معالجة للبيانات الشخصية الموافقة الصريحة والمستنيرة من الشخص المعني.',
    requirements: [
      {
        id: 'req-cons-1',
        descriptionFr: 'Formulaire de consentement distinct et accessible',
        descriptionAr: 'نموذج موافقة منفصل وقابل للوصول',
        implementationNotes: 'Ne pas utiliser de cases pré-cochées. Le consentement doit être affirmatif.',
        mandatory: true,
      },
      {
        id: 'req-cons-2',
        descriptionFr: 'Information claire sur la finalité du traitement',
        descriptionAr: 'معلومات واضحة حول الغرض من المعالجة',
        implementationNotes: 'Langage simple, éviter le jargon juridique excessif.',
        mandatory: true,
      },
      {
        id: 'req-cons-3',
        descriptionFr: 'Possibilité de retirer son consentement à tout moment',
        descriptionAr: 'إمكانية سحب الموافقة في أي وقت',
        implementationNotes: 'Fournir un mécanisme simple de désabonnement/désactivation.',
        mandatory: true,
      },
    ],
    legalReference: 'Article 5 de la Loi 18-07',
    joReference: 'J.O N° 44 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Avertissement formel puis sanction pécuniaire',
      descriptionAr: 'إنذار رسمي ثم جزاء مالي',
      fineRange: { min: 1, max: 10 }, // Millions DZD
    },
    dataTypesAffected: ['personal-basic', 'personal-id', 'financial', 'health', 'biometric', 'location'],
    isActive: true,
  },
  // Lawful Basis for Processing
  {
    id: 'privacy-002',
    code: 'BASIS-LEG-001',
    category: 'processing',
    titleFr: 'Base Juridique du Traitement',
    titleAr: 'الأساس القانوني للمعالجة',
    descriptionFr: 'Chaque traitement doit avoir une base légale: consentement, obligation légale, contrat, intérêt vital, mission d\'intérêt public.',
    descriptionAr: 'يجب أن يكون لكل معالجة أساس قانوني: موافقة، التزام قانوني، عقد، مصلحة حيوية، مهمة ذات مصلحة عامة.',
    requirements: [
      {
        id: 'req-basis-1',
        descriptionFr: 'Documenter la base légale pour chaque type de traitement',
        descriptionAr: 'توثيق الأساس القانوني لكل نوع من المعالجة',
        implementationNotes: 'Maintenir un registre des traitements mis à jour.',
        mandatory: true,
      },
      {
        id: 'req-basis-2',
        descriptionFr: 'Minimisation des données collectées',
        descriptionAr: 'تقليل البيانات المجمعة',
        implementationNotes: 'Collecter uniquement les données nécessaires à la finalité déclarée.',
        mandatory: true,
      },
    ],
    legalReference: 'Article 6 de la Loi 18-07',
    joReference: 'J.O N° 44 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Ordre de cessation + amende administrative',
      descriptionAr: 'أمر بالتوقف + غرامة إدارية',
      fineRange: { min: 2, max: 15 },
    },
    dataTypesAffected: ['all'],
    isActive: true,
  },
  // Data Subject Rights
  {
    id: 'privacy-003',
    code: 'RIGHTS-DATA-001',
    category: 'rights',
    titleFr: 'Droits des Personnes Concernées',
    titleAr: 'حقوق الأشخاص المعنيين',
    descriptionFr: 'Respect des droits: accès, rectification, effacement, limitation, portabilité, opposition.',
    descriptionAr: 'احترام الحقوق: الوصول، التصحيح، الحذف، التحديد، النقلability، الاعتراض.',
    requirements: [
      {
        id: 'req-rights-1',
        descriptionFr: 'Répondre aux demandes d\'accès dans un délai de 30 jours',
        descriptionAr: 'الرد على طلبات الوصول خلال 30 يومًا',
        implementationNotes: 'Mettre en place un processus de gestion des demandes RGPD-style.',
        mandatory: true,
      },
      {
        id: 'req-rights-2',
        descriptionFr: 'Faciliter l\'exercice du droit à l\'oubli (effacement)',
        descriptionAr: 'تسهيل ممارسة الحق في النسيان (الحذف)',
        implementationNotes: 'Prévoir suppression automatique après période de rétention définie.',
        mandatory: true,
      },
      {
        id: 'req-rights-3',
        descriptionFr: 'Portabilité des données vers un autre service',
        descriptionAr: 'قابلية نقل البيانات إلى خدمة أخرى',
        implementationNotes: 'Exporter en format structuré, couramment utilisé, lisible par machine.',
        mandatory: false,
      },
    ],
    legalReference: 'Articles 9 à 14 de la Loi 18-07',
    joReference: 'J.O N° 44 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Sanction aggravée si refus répété de répondre',
      descriptionAr: 'جزاء مشدد في حالة الرفض المتكرر للرد',
      fineRange: { min: 3, max: 20 },
    },
    dataTypesAffected: ['all'],
    isActive: true,
  },
  // Data Security Requirements
  {
    id: 'privacy-004',
    code: 'SECUR-DATA-001',
    category: 'security',
    titleFr: 'Mesures de Sécurité Techniques et Organisationnelles',
    titleAr: 'التدابير التقنية والتنظيمية للأمن',
    descriptionFr: 'Mettre en œuvre des mesures appropriées pour garantir un niveau de sécurité adapté au risque.',
    descriptionAr: 'تنفيذ تدابير مناسبة لضمان مستوى أمن يناسب المخاطر.',
    requirements: [
      {
        id: 'req-sec-1',
        descriptionFr: 'Chiffrement des données sensibles (AES-256 minimum)',
        descriptionAr: 'تشفير البيانات الحساسة (AES-256 كحد أدنى)',
        implementationNotes: 'Appliquer chiffrement at-rest et in-transit.',
        mandatory: true,
      },
      {
        id: 'req-sec-2',
        descriptionFr: 'Contrôle d\'accès basé sur les rôles (RBAC)',
        descriptionAr: 'التحكم في الوصول بناءً على الأدوار',
        implementationNotes: 'Principe du moindre privilège, audit des accès.',
        mandatory: true,
      },
      {
        id: 'req-sec-3',
        descriptionFr: 'Journalisation des accès aux données',
        descriptionAr: 'تسجيل الوصول إلى البيانات',
        implementationLogs: 'Conserver les logs minimum 1 an, protéger contre la modification.',
        mandatory: true,
      },
      {
        id: 'req-sec-4',
        descriptionFr: 'Plan de gestion des incidents de sécurité',
        descriptionAr: 'خطة إدارة حوادث الأمن السيبراني',
        implementationNotes: 'Notifier l\'APN dans les 72h en cas de violation significative.',
        mandatory: true,
      },
    ],
    legalReference: 'Article 32 de la Loi 18-07',
    joReference: 'J.O N° 44 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Sanction pouvant atteindre 2% du CA mondial en cas de négligence grave',
      descriptionAr: 'جزاء يمكن أن يصل إلى 2% من الإيرادات العالمية في حالة إهمال خطير',
      fineRange: { min: 5, max: 50 },
      criminalSanction: 'Emprisonment jusqu\'à 2 ans en cas de violation caractérisée',
    },
    dataTypesAffected: ['all'],
    isActive: true,
  },
  // Cross-Border Data Transfers
  {
    id: 'privacy-005',
    code: 'TRANSFER-XB-001',
    category: 'transfer',
    titleFr: 'Transferts vers les Pays Tiers',
    titleAr: 'النقل إلى الدول الثالثة',
    descriptionFr: 'Les transferts vers des pays n\'assurant pas un niveau de protection adéquat sont soumis à autorisation de l\'APN.',
    descriptionAr: 'النقل إلى الدول التي لا توفر مستوى حماية كافٍ خضع لموافقة الهيئة الوطنية لحماية المعطيات الشخصية.',
    requirements: [
      {
        id: 'req-trans-1',
        descriptionFr: 'Vérifier le niveau de protection du pays destinataire',
        descriptionAr: 'التحقق من مستوى حماية الدولة المستقبلة',
        implementationNotes: 'Liste des pays adéquats publiée par l\'APN.',
        mandatory: true,
      },
      {
        id: 'req-trans-2',
        descriptionFr: 'Signer des clauses contractuelles types si nécessaire',
        descriptionAr: 'توقيع بنود تعاقدية نموذجية إذا لزم الأمر',
        implementationNotes: 'Utiliser clauses types approuvées par l\'APN.',
        mandatory: true,
      },
    ],
    legalReference: 'Articles 46 à 49 de la Loi 18-07',
    joReference: 'J.O N° 44 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Interdiction de transfert + sanction pécuniaire',
      descriptionAr: 'حظر النقل + جزاء مالي',
      fineRange: { min: 5, max: 25 },
    },
    dataTypesAffected: ['personal-basic', 'personal-id', 'financial', 'health', 'biometric'],
    isActive: true,
  },
  // Data Breach Notification
  {
    id: 'privacy-006',
    code: 'BREACH-NOT-001',
    category: 'security',
    titleFr: 'Notification des Violations de Données',
    titleAr: 'إبلاغ خرقات البيانات',
    descriptionFr: 'Toute violation de données personnelles doit être notifiée à l\'APN dans les 72 heures et aux personnes concernées si risque élevé.',
    descriptionAr: 'يجب إبلاغ أي خرق للبيانات الشخصية إلى الهيئة الوطنية خلال 72 ساعة وإلى الأشخاص المعنيين إذا كان الخطر عاليًا.',
    requirements: [
      {
        id: 'req-breac-1',
        descriptionFr: 'Procédure interne de détection et d\'escalade',
        descriptionAr: 'إجراء داخلي للكشف والتصعيد',
        implementationNotes: 'Former le personnel, définir les critères de notification.',
        mandatory: true,
      },
      {
        id: 'req-breac-2',
        descriptionFr: 'Registre des violations de données',
        descriptionAr: 'سجل خرقات البيانات',
        implementationNotes: 'Documenter chaque incident, mesures correctives prises.',
        mandatory: true,
      },
    ],
    legalReference: 'Article 33 de la Loi 18-07',
    joReference: 'J.O N° 44 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Sanction automatique en cas de retard de notification',
      descriptionAr: 'جزاء تلقائي في حالة تأخر الإبلاغ',
      fineRange: { min: 2, max: 10 },
    },
    dataTypesAffected: ['all'],
    isActive: true,
  },
  // Data Retention Limits
  {
    id: 'privacy-007',
    code: 'RETEN-DATA-001',
    category: 'storage',
    titleFr: 'Durées de Conservation des Données',
    titleAr: 'مدد حفظ البيانات',
    descriptionFr: 'Les données personnelles ne peuvent être conservées au-delà de la durée nécessaire aux finalités du traitement.',
    descriptionAr: 'لا يمكن حفظ البيانات الشخصية أكثر من المدة الضرورية لأغراض المعالجة.',
    requirements: [
      {
        id: 'req-ret-1',
        descriptionFr: 'Définir politique de rétention par catégorie de données',
        descriptionAr: 'تحديد سياسة الاحتفاظ حسب فئة البيانات',
        implementationNotes: 'Max 3 ans pour marketing, 10 ans pour documents légaux, etc.',
        mandatory: true,
      },
      {
        id: 'req-ret-2',
        descriptionFr: 'Suppression automatique sécurisée après expiration',
        descriptionAr: 'حذف آمن آلي بعد انتهاء الصلاحية',
        implementationNotes: 'Implémenter jobs de purge automatisés.',
        mandatory: true,
      },
    ],
    legalReference: 'Article 5.1.e de la Loi 18-07',
    joReference: 'J.O N° 44 du 13 juin 2018',
    penalty: {
      descriptionFr: 'Ordre de suppression + amende si non-respect répété',
      descriptionAr: 'أمر بالحذف + غرامة في حالة عدم احترام متكرر',
      fineRange: { min: 1, max: 8 },
    },
    dataTypesAffected: ['all'],
    isActive: true,
  },
];

// APN (Autorité de Protection des Données) Contact Info
export const APN_CONTACT = {
  name: 'Autorité de Protection des Données à Caractère Personnel (APN)',
  nameAr: 'الهيئة الوطنية لحماية المعطيات الشخصية',
  address: 'Rue des Frères Bouadou, Ben Aknoun, Alger',
  phone: '+213 (0) 21 98 08 62',
  email: 'contact@apn.dz',
  website: 'www.apn.dz',
  notificationEmail: 'notification-violation@apn.dz',
};

// Helper functions for privacy compliance validation
export function validatePrivacyCompliance(processing: {
  purpose: string;
  dataCategories: string[];
  hasConsent: boolean;
  consentDate?: string;
  dataStoredInAlgeria: boolean;
  transferCountries?: string[];
  encryptionEnabled: boolean;
  retentionPolicyDefined: boolean;
}): PrivacyComplianceResult {
  const gaps: PrivacyGap[] = [];

  // Check consent
  if (!processing.hasConsent && !processing.purpose.includes('legal')) {
    gaps.push({
      ruleId: 'privacy-001',
      severity: 'critical',
      messageFr: 'Consentement manquant pour ce traitement',
      messageAr: 'غياب الموافقة لهذه المعالجة',
      recommendation: 'Implémenter un formulaire de consentement conforme avant la collecte',
    });
  }

  // Check encryption
  if (!processing.encryptionEnabled) {
    gaps.push({
      ruleId: 'privacy-004',
      severity: 'high',
      messageFr: 'Chiffrement des données non activé',
      messageAr: 'تشفير البيانات غير مفعل',
      recommendation: 'Activer le chiffrement AES-256 pour toutes les données sensibles',
    });
  }

  // Check data localization
  if (!processing.dataStoredInAlgeria) {
    gaps.push({
      ruleId: 'privacy-005',
      severity: 'high',
      messageFr: 'Données stockées hors d\'Algérie sans autorisation',
      messageAr: 'بيانات مخزنة خارج الجزائر بدون تصريح',
      recommendation: 'Obtenir l\'autorisation de l\'APN ou rapatrier les données',
    });
  }

  // Check retention policy
  if (!processing.retentionPolicyDefined) {
    gaps.push({
      ruleId: 'privacy-007',
      severity: 'medium',
      messageFr: 'Politique de rétention non définie',
      messageAr: 'سياسة الاحتفاظ غير محددة',
      recommendation: 'Documenter les durées de conservation par catégorie de données',
    });
  }

  return {
    isCompliant: gaps.length === 0,
    score: Math.max(0, 100 - gaps.reduce((sum, gap) => {
      switch (gap.severity) {
        case 'critical': return sum + 30;
        case 'high': return sum + 20;
        case 'medium': return sum + 10;
        default: return sum + 5;
      }
    }, 0)),
    gaps,
  };
}

export interface PrivacyGap {
  ruleId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  messageFr: string;
  messageAr: string;
  recommendation: string;
}

export interface PrivacyComplianceResult {
  isCompliant: boolean;
  score: number;
  gaps: PrivacyGap[];
}

export function getDataRetentionLimits(): Record<string, number> {
  return {
    'marketing': 3 * 365, // 3 years
    'customer-data': 5 * 365, // 5 years after end of relationship
    'legal-documents': 10 * 365, // 10 years
    'accounting': 10 * 365, // 10 years per commercial law
    'hr-data': 5 * 365, // 5 years after employment ends
    'logs-security': 365, // 1 year minimum
  };
}

export function getPrivacyRulesByCategory(category: PrivacyRule['category']): PrivacyRule[] {
  return PRIVACY_RULES.filter(rule => rule.category === category && rule.isActive);
}
