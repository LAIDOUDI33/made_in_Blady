/**
 * AlgeriaTrade.dz - GDPR & Data Privacy Compliance System
 * 
 * Comprehensive privacy compliance providing:
 * - GDPR Article compliance tools
 * - Data Subject Rights implementation (Access, Rectification, Erasure, Portability)
 * - Consent management and tracking
 * - Data processing records
 * - Privacy policy generator
 * - Cookie consent system
 * - Data breach notification procedures
 * - DPO (Data Protection Officer) tools
 * - Data mapping and classification
 * - Retention policy enforcement
 * - Third-party data sharing controls
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface DataSubject {
  id: string;
  type: 'user' | 'visitor' | 'contact' | 'supplier' | 'buyer';
  
  // Personal identifiers
  email?: string;
  phone?: string;
  userId?: string;
  
  // Profile data
  profileData: {
    firstName?: string;
    lastName?: string;
    company?: string;
    address?: Record<string, any>;
    dateOfBirth?: string;
    nationality?: string;
    idNumber?: string; // National ID, passport, etc.
    [key: string]: any;
  };
  
  // Account data
  accountData: {
    username?: string;
    createdDate?: string;
    lastLoginDate?: string;
    loginHistory?: Array<{ ip: string; timestamp: string; device: string }>;
    preferences?: Record<string, any>;
    [key: string]: any;
  };
  
  // Transaction data
  transactionData: {
    orderCount?: number;
    totalSpent?: number;
    lastOrderDate?: string;
    paymentMethods?: string[];
    [key: string]: any;
  };
  
  // Communications data
  communicationsData: {
    marketingConsent: boolean;
    newsletterSubscribed: boolean;
    smsConsent: boolean;
    callConsent: boolean;
    lastMarketingOptIn?: string;
    lastMarketingOptOut?: string;
    [key: string]: any;
  };
  
  // Technical data
  technicalData: {
    ipAddress?: string;
    deviceId?: string;
    browserFingerprint?: string;
    cookies?: Array<{ name: string; domain: string; expiry: string }>;
    sessionData?: Record<string, any>;
    [key: string]: any;
  };
  
  // Metadata
  metadata: {
    dataCollectedAt: string;
    dataSources: string[];
    retentionCategory: 'short' | 'medium' | 'long' | 'permanent';
    legalBasis: string;
    consentRecords: ConsentRecord[];
    dataProcessingActivities: ProcessingActivity[];
    thirdPartySharing: ThirdPartyShare[];
  };
  
  // Status
  status: 'active' | 'erasure_requested' | 'erased' | 'restricted' | 'exported';
  erasureRequestDate?: string;
  erasureCompletionDate?: string;
}

export interface ConsentRecord {
  id: string;
  version: number;
  type: 'marketing' | 'analytics' | 'functional' | 'third_party' | 'cookies' | 'email' | 'sms' | 'location' | 'biometric';
  given: boolean;
  givenAt: string;
  withdrawnAt?: string;
  method: 'checkbox' | 'toggle' | 'scroll' | 'implied' | 'verbal' | 'written';
  source: string; // Page URL or form name
  ipAddress?: string;
  userAgent?: string;
  validUntil?: string; // For time-limited consents
  details: string; // What was agreed to
  gdprArticle: string; // Relevant GDPR article (e.g., Art. 6(1)(a))
}

export interface ProcessingActivity {
  id: string;
  purpose: string;
  lawfulBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: string[]; // e.g., ['email', 'name', 'ip_address']
  processor: string; // Internal system or third party
  retentionPeriod: string; // e.g., '30 days', '2 years', 'until_account_deletion'
  automatedDecisionMaking: boolean;
  internationalTransfer: boolean;
  destinationCountry?: string;
  securityMeasures: string[];
  dpiaCompleted: boolean; // Data Protection Impact Assessment
  lastUpdated: string;
}

export interface ThirdPartyShare {
  id: string;
  recipientName: string;
  recipientCountry: string;
  purpose: string;
  dataCategoriesShared: string[]; 
  basisForTransfer: 'adequacy_decision' | 'appropriate_safeguards' | 'binding_corporate_rules' | 'consent' | 'contract';
  frequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'on_demand';
  startedAt: string;
  lastSharedAt?: string;
  recordCount?: number;
  dpaSigned?: boolean; // Data Processing Agreement
}

export interface DataErasureRequest {
  id: string;
  dataSubjectId: string;
  requestedAt: string;
  requestedVia: 'portal' | 'email' | 'api' | 'dpo';
  identityVerified: boolean;
  verificationMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'denied' | 'withdrawn';
  
  // Scope of erasure
  scope: {
    profileData: boolean;
    accountData: boolean;
    transactionData: boolean;
    communicationsData: boolean;
    technicalData: boolean;
    customExclusions?: string[]; // Data that cannot be deleted (legal requirements)
  };
  
  // Processing log
  processingLog: Array<{
    step: string;
    timestamp: string;
    performedBy: string;
    result: string;
    details?: string;
  }>;
  
  // Results
  completedAt?: string;
  systemsProcessed: string[];
  dataDeleted: Record<string, { records: number; size: string }>;
  dataRetained: Record<string, { reason: string; records: number }>; // Legal holds
  
  // Communication
  confirmationSent: boolean;
  confirmationSentAt?: string;
  notes?: string;
}

export interface DataPortabilityExport {
  id: string;
  dataSubjectId: string;
  requestedAt: string;
  format: 'json' | 'csv' | 'xml' | 'pdf';
  status: 'pending' | 'preparing' | 'ready' | 'downloaded' | 'expired';
  
  // Export contents
  includes: {
    personalData: boolean;
    accountData: boolean;
    transactionData: boolean;
    consentHistory: boolean;
    loginHistory: boolean;
    activityLog: boolean;
  };
  
  // File info
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  
  createdAt: string;
  preparedBy?: string;
}

export interface DataBreachRecord {
  id: string;
  detectedAt: string;
  reportedToDPO: boolean;
  reportedToAuthority: boolean;
  authorityReportDeadline: string;
  
  // Breach details
  type: 'confidentiality' | 'integrity' | 'availability' | 'combination';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDataSubjects: number;
  dataCategoriesAffected: string[];
  likelyConsequences: string[];
  
  // Root cause
  cause: string;
  vulnerabilityExploited?: string;
  attackerType?: 'external' | 'internal' | 'unknown';
  
  // Containment measures
  containmentActions: string[];
  mitigationStatus: 'contained' | 'mitigating' | 'resolved';
  
  // Notification
  subjectsNotified: boolean;
  subjectsNotificationMethod: 'email' | 'sms' | 'in_app' | 'postal' | 'none';
  authorityNotificationReference?: string;
  
  // Outcome
  resolution: string;
  lessonsLearned: string[];
  preventiveMeasures: string[];
  
  // Documentation
  evidencePreserved: boolean;
  reportGenerated: boolean;
  reportFileId?: string;
}

export interface PrivacyPolicy {
  id: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  language: string;
  jurisdiction: string;
  
  sections: PrivacyPolicySection[];
  
  // Configuration
  cookieSettings: CookieSettings;
  dataRetentionPeriods: Record<string, string>;
  userRights: string[];
  contactInfo: {
    dpoName: string;
    dpoEmail: string;
    dpoPhone?: string;
    companyAddress: string;
  };
  
  // Status
  published: boolean;
  publishedAt?: string;
  url?: string;
  acceptanceRequired: boolean;
  acceptanceVersion: string;
}

export interface PrivacyPolicySection {
  id: string;
  title: string;
  content: string;
  required: boolean; // Must be included for GDPR compliance
  gdprArticles: string[];
  order: number;
}

export interface CookieSettings {
  necessaryCookies: CookieDefinition[];
  analyticsCookies: CookieDefinition[];
  marketingCookies: CookieDefinition[];
  preferenceCookies: CookieDefinition[];
  
  defaultConsent: 'all' | 'necessary_only' | 'none';
  consentBannerEnabled: boolean;
  granularControl: boolean; // Allow users to choose individual categories
  expiryDays: number;
}

export interface CookieDefinition {
  name: string;
  domain: string;
  purpose: string;
  duration: string;
  category: 'necessary' | 'analytics' | 'marketing' | 'preference';
  provider: 'first_party' | 'third_party';
  thirdPartyName?: string;
  required: boolean;
}

export interface DPIARecord { // Data Protection Impact Assessment
  id: string;
  projectName: string;
  projectDescription: string;
  dataController: string;
  dataProtectionOfficer: string;
  
  // Assessment
  necessity: 'required' | 'optional' | 'unnecessary';
  proportionality: 'proportionate' | 'disproportionate';
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  
  // Data involved
  personalDataCategories: string[];
  dataSubjectsAffected: string[];
  volumeEstimate: string; // e.g., '~10,000 users'
  
  // Measures
  existingSafeguards: string[];
  additionalMeasuresRecommended: string[];
  residualRisk: string;
  
  // Approval
  status: 'draft' | 'under_review' | 'approved' | 'rejected' | 'implemented';
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}

// ===========================================
// Configuration
// ===========================================

interface PrivacyConfig {
  enabled: boolean;
  jurisdiction: 'GDPR' | 'CCPA' | 'LGPD' | 'PDPA' | 'custom'; // Primary regulation
  additionalJurisdictions: string[]; // Other applicable regulations
  
  // Organization info
  organization: {
    name: string;
    registrationNumber: string;
    address: string;
    country: string;
    dpoName: string;
    dpoEmail: string;
    dpoPhone?: string;
    website: string;
  };
  
  // Data retention defaults (in days)
  defaultRetentionPeriods: {
    accountData: number;       // After account closure
    transactionData: number;   // For accounting purposes
    marketingData: number;     // After consent withdrawal
    analyticsData: number;     // Anonymized after this
    supportData: number;       // Ticket resolution + retention
    securityLogs: number;      // Security incident retention
    legalHoldData: number;     // While under legal hold
  };
  
  // Rights configuration
  rights: {
    access: {
      enabled: true;
      responseDeadlineDays: number; // GDPR: 30 days
      identityVerification: 'none' | 'email' | 'sms' | 'mfa' | 'id_document';
      formatOptions: ('json' | 'csv')[];
      feeAllowed: boolean;
      maxRequestsPerPeriod: number;
    };
    rectification: {
      enabled: true;
      responseDeadlineDays: number;
      requiresIdentityVerification: boolean;
      fieldsThatCanBeRectified: string[];
    };
    erasure: {
      enabled: true;
      responseDeadlineDays: number;
      exceptions: string[]; // Legal/Regulatory reasons to deny
      anonymizationOption: boolean; // Offer instead of full deletion
      backupRetentionDays: number; // Before permanent deletion
    };
    portability: {
      enabled: true;
      responseDeadlineDays: number;
      formats: ('json' | 'csv' | 'xml')[];
      machineReadable: boolean;
    };
    objection: {
      enabled: true;
      responseDeadlineDays: number;
      automatedDecisionObjection: true;
      profilingObjection: true;
      directMarketingObjection: true;
    };
  };
  
  // Consent configuration
  consent: {
    granularity: 'bundle' | 'category' | 'individual';
    recordingMethod: 'opt_in' | 'opt_out' | 'double_opt_in';
    withdrawalMethod: 'easy' | 'moderate' | 'formal';
    refreshIntervalDays: number; // Re-confirm consent every X days
    ageVerificationRequired: boolean;
    minimumAge: number;
    parentalConsentUpToAge: number;
  };
  
  // Breach notification
  breachNotification: {
    authorityNotificationHours: number; // GDPR: 72 hours
    subjectNotificationHours: number;
    notifyWithoutUnnecessaryDelay: boolean;
    templateIds: {
      authority: string;
      subject: string;
      internal: string;
    };
  };
  
  // Data mapping
  dataMapping: {
    autoDiscovery: boolean;
    classificationLevels: ('public' | 'internal' | 'confidential' | 'restricted')[];
    sensitivityLabels: boolean;
    dataFlowTracking: boolean;
    thirdPartyInventory: boolean;
  };
  
  // Integration endpoints
  integrations: {
    crmSystem?: { endpoint: string; apiKey: string };
    emailService?: { endpoint: string; apiKey: string };
    analyticsPlatform?: { endpoint: string; apiKey: string };
    storageProvider?: { endpoint: string; bucket: string; credentials: string };
  };
}

const DEFAULT_CONFIG: PrivacyConfig = {
  enabled: true,
  jurisdiction: 'GDPR',
  additionalJurisdictions: ['CCPA', 'LGPD'], // Common combinations
  
  organization: {
    name: 'AlgeriaTrade.dz',
    registrationNumber: '',
    address: '',
    country: 'DZ',
    dpoName: 'Data Protection Officer',
    dpoName: 'privacy@algeriatrade.dz',
    website: 'https://algeriatrade.dz',
  },
  
  defaultRetentionPeriods: {
    accountData: 90,           // 3 months after closure
    transactionData: 2555,     // 7 years for accounting
    marketingData: 366,        // 1 year after opt-out
    analyticsData: 730,        // 2 years, then aggregate
    supportData: 1095,         // 3 years
    securityLogs: 1825,        // 5 years
    legalHoldData: 0,          // Indefinite while on hold
  },
  
  rights: {
    access: {
      enabled: true,
      responseDeadlineDays: 30,
      identityVerification: 'email',
      formatOptions: ['json', 'csv'],
      feeAllowed: false,
      maxRequestsPerPeriod: 12, // Max per month
    },
    rectification: {
      enabled: true,
      responseDeadlineDays: 30,
      requiresIdentityVerification: true,
      fieldsThatCanBeRectified: [
        'firstName', 'lastName', 'email', 'phone', 
        'company', 'address', 'preferences'
      ],
    },
    erasure: {
      enabled: true,
      responseDeadlineDays: 30,
      exceptions: [
        'Legal requirement to retain transaction records',
        'Ongoing legal proceedings',
        'Regulatory compliance obligations',
        'Exercise of freedom of expression',
      ],
      anonymizationOption: true,
      backupRetentionDays: 30,
    },
    portability: {
      enabled: true,
      responseDeadlineDays: 30,
      formats: ['json', 'csv', 'xml'],
      machineReadable: true,
    },
    objection: {
      enabled: true,
      responseDeadlineDays: 30,
      automatedDecisionObjection: true,
      profilingObjection: true,
      directMarketingObjection: true,
    },
  },
  
  consent: {
    granularity: 'category',
    recordingMethod: 'opt_in',
    withdrawalMethod: 'easy',
    refreshIntervalDays: 365, // Re-confirm annually
    ageVerificationRequired: false,
    minimumAge: 16,
    parentalConsentUpToAge: 18,
  },
  
  breachNotification: {
    authorityNotificationHours: 72,
    subjectNotificationHours: 72,
    notifyWithoutUnnecessaryDelay: true,
    templateIds: {
      authority: '',
      subject: '',
      internal: '',
    },
  },
  
  dataMapping: {
    autoDiscovery: true,
    classificationLevels: ['public', 'internal', 'confidential', 'restricted'],
    sensitivityLabels: true,
    dataFlowTracking: true,
    thirdPartyInventory: true,
  },
  
  integrations: {},
};

// ===========================================
// Main Privacy Compliance Class
// ===========================================

class PrivacyComplianceSystem {
  private config: PrivacyConfig;
  private dataSubjects: Map<string, DataSubject> = new Map();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private erasureRequests: Map<string, DataErasureRequest> = new Map();
  private portabilityExports: Map<string, DataPortabilityExport> = new Map();
  private breachRecords: Map<string, DataBreachRecord> = new Map();
  private dpiaRecords: Map<string, DPIARecord> = new Map();
  private privacyPolicies: Map<string, PrivacyPolicy> = new Map();

  constructor(config?: Partial<PrivacyConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Load built-in privacy policy template
    this.loadDefaultPrivacyPolicy();
  }

  // ===========================================
  // Data Subject Operations
  // ===========================================

  /**
   * Register a new data subject or update existing
   */
  registerDataSubject(subject: Partial<DataSubject>): DataSubject {
    const id = subject.id || subject.userId || subject.email || `subject_${Date.now()}`;
    
    const now = new Date().toISOString();
    
    const dataSubject: DataSubject = {
      id,
      type: subject.type || 'visitor',
      profileData: subject.profileData || {},
      accountData: subject.accountData || {},
      transactionData: subject.transactionData || {},
      communicationsData: {
        marketingConsent: false,
        newsletterSubscribed: false,
        smsConsent: false,
        callConsent: false,
        ...subject.communicationsData,
      },
      technicalData: subject.technicalData || {},
      metadata: {
        dataCollectedAt: now,
        dataSources: [],
        retentionCategory: 'medium',
        legalBasis: '',
        consentRecords: [],
        dataProcessingActivities: [],
        thirdPartySharing: [],
      },
      status: 'active',
      ...subject,
    };

    this.dataSubjects.set(id, dataSubject);
    return dataSubject;
  }

  /**
   * Get data subject by ID
   */
  getDataSubject(id: string): DataSubject | undefined {
    return this.dataSubjects.get(id);
  }

  /**
   * Find data subject by various identifiers
   */
  findDataSubject(identifiers: { userId?: string; email?: string; phone?: string }): DataSubject | undefined {
    for (const subject of this.dataSubjects.values()) {
      if (identifiers.userId && subject.userId === identifiers.userId) return subject;
      if (identifiers.email && subject.email === identifiers.email) return subject;
      if (identifiers.phone && (subject as any).phone === identifiers.phone) return subject;
    }
    return undefined;
  }

  /**
   * GDPR Article 15: Right of Access
   * Provide copy of all personal data held
   */
  async fulfillAccessRequest(
    subjectId: string,
    requestFormat: 'json' | 'csv' = 'json',
    identityVerified: boolean = false
  ): Promise<{ success: boolean; data?: any; format: string; expiresAt: string }> {
    const subject = this.dataSubjects.get(subjectId);
    if (!subject) {
      return { success: false, format: requestFormat, expiresAt: '' };
    }

    if (!identityVerified && this.config.rights.access.identityVerification !== 'none') {
      return { success: false, error: 'Identity verification required', format: requestFormat, expiresAt: '' };
    }

    // Prepare data export (excluding sensitive operational data)
    const accessibleData = {
      profileData: subject.profileData,
      accountData: {
        username: subject.accountData.username,
        createdDate: subject.accountData.createdDate,
        lastLoginDate: subject.accountData.lastLoginDate,
        preferences: subject.accountData.preferences,
      },
      transactionData: {
        orderCount: subject.transactionData.orderCount,
        totalSpent: subject.transactionData.totalSpent,
        lastOrderDate: subject.transactionData.lastOrderDate,
        paymentMethods: subject.transactionData.paymentMethods?.map(m => '****' + m.slice(-4)),
      },
      communicationsData: {
        marketingConsent: subject.communicationsData.marketingConsent,
        newsletterSubscribed: subject.communicationsData.newsletterSubscribed,
        smsConsent: subject.communicationsData.smsConsent,
        callConsent: subject.communicationsData.callConsent,
        lastMarketingOptIn: subject.communicationsData.lastMarketingOptIn,
        lastMarketingOptOut: subject.communicationsData.lastMarketingOptOut,
      },
      consentHistory: subject.metadata.consentRecords.map(cr => ({
        type: cr.type,
        given: cr.given,
        givenAt: cr.givenAt,
        withdrawnAt: cr.withdrawnAt,
        source: cr.source,
        details: cr.details,
      })),
      dataProcessingActivities: subject.metadata.dataProcessingActivities.map(pa => ({
        purpose: pa.purpose,
        lawfulBasis: pa.lawfulBasis,
        dataCategories: pa.dataCategories,
        processor: pa.processor,
        retentionPeriod: pa.retentionPeriod,
      })),
      thirdPartySharing: subject.metadata.thirdPartySharing.map(tps => ({
        recipientName: tps.recipientName,
        purpose: tps.purpose,
        dataCategoriesShared: tps.dataCategoriesShared,
        basisForTransfer: tps.basisForTransfer,
      })),
      metadata: {
        dataCollectedAt: subject.metadata.dataCollectedAt,
        dataSources: subject.metadata.dataSources,
        retentionCategory: subject.metadata.retentionCategory,
      },
    };

    // Set expiration (data should be available for reasonable period)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    return {
      success: true,
      data: requestFormat === 'json' ? accessibleData : this.convertToCSV(accessibleData),
      format: requestFormat,
      expiresAt,
    };
  }

  /**
   * GDPR Article 16: Right to Rectification
   * Correct inaccurate personal data
   */
  async fulfillRectificationRequest(
    subjectId: string,
    corrections: Record<string, any>,
    identityVerified: boolean = false
  ): Promise<{ success: boolean; correctedFields: string[]; rejectionReason?: string }> {
    const subject = this.dataSubjects.get(subjectId);
    if (!subject) {
      return { success: false, correctedFields: [], rejectionReason: 'Subject not found' };
    }

    if (!identityVerified && this.config.rights.rectification.requiresIdentityVerification) {
      return { success: false, correctedFields: [], rejectionReason: 'Identity verification required' };
    }

    const correctedFields: string[] = [];
    const allowedFields = this.config.rights.rectification.fieldsThatCanBeRectified;

    for (const [field, value] of Object.entries(corrections)) {
      if (!allowedFields.includes(field)) {
        continue; // Skip fields that cannot be rectified
      }

      // Apply correction
      if (field in subject.profileData) {
        subject.profileData[field] = value;
        correctedFields.push(`profileData.${field}`);
      } else if (field in subject.accountData) {
        subject.accountData[field] = value;
        correctedFields.push(`accountData.${field}`);
      }
    }

    // Log the rectification
    this.addProcessingActivity(subjectId, {
      purpose: 'Data rectification per GDPR Art. 16',
      lawfulBasis: 'contract',
      dataCategories: Object.keys(corrections),
      processor: 'privacy-system',
      retentionPeriod: 'per account lifetime',
    });

    return { success: true, correctedFields };
  }

  /**
   * GDPR Article 17: Right to Erasure ("Right to be Forgotten")
   * Delete personal data with legal exceptions
   */
  async initiateErasureRequest(
    subjectId: string,
    scope?: Partial<DataErasureRequest['scope']>,
    reason?: string
  ): Promise<DataErasureRequest> {
    const subject = this.dataSubjects.get(subjectId);
    if (!subject) {
      throw new Error('Data subject not found');
    }

    const requestId = `erasure_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const request: DataErasureRequest = {
      id: requestId,
      dataSubjectId: subjectId,
      requestedAt: now,
      requestedVia: 'portal',
      identityVerified: false,
      verificationMethod: 'pending',
      status: 'pending',
      scope: {
        profileData: true,
        accountData: true,
        transactionData: false, // Keep for legal requirements
        communicationsData: true,
        technicalData: true,
        ...scope,
      },
      processingLog: [{
        step: 'Request received',
        timestamp: now,
        performedBy: 'system',
        result: reason || 'Standard erasure request',
      }],
      systemsProcessed: [],
      dataDeleted: {},
      dataRetained: {},
      confirmationSent: false,
    };

    // Check for legal holds
    const legalHolds = this.checkLegalHolds(subjectId);
    if (legalHolds.hasHold) {
      request.scope.customExclusions = legalHolds.reasons;
      request.processingLog.push({
        step: 'Legal hold check',
        timestamp: now,
        performedBy: 'system',
        result: `Legal hold in effect: ${legalHolds.description}`,
        details: JSON.stringify(legalHolds),
      });
    }

    this.erasureRequests.set(requestId, request);

    // Update subject status
    subject.status = 'erasure_requested';
    subject.erasureRequestDate = now;

    return request;
  }

  /**
   * Process an erasure request (actually delete data)
   */
  async processErasureRequest(requestId: string): Promise<void> {
    const request = this.erasureRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Invalid or already processed request');
    }

    request.status = 'processing';
    request.processingLog.push({
      step: 'Processing started',
      timestamp: new Date().toISOString(),
      performedBy: 'system',
      result: 'Beginning data deletion process',
    });

    const subject = this.dataSubjects.get(request.dataSubjectId);
    if (!subject) return;

    const systemsToDeleteFrom: string[] = [];
    const deletedData: Record<string, { records: number; size: string }> = {};
    const retainedData: Record<string, { reason: string; records: number }> = {};

    // Delete profile data
    if (request.scope.profileData) {
      const keysBefore = Object.keys(subject.profileData).length;
      subject.profileData = {};
      deletedData['profileData'] = { records: keysBefore, size: '~small' };
      systemsToDeleteFrom.push('profile_database');
    }

    // Delete account data (but keep ID for reference)
    if (request.scope.accountData) {
      const sensitiveFields = ['username', 'passwordHash', 'sessionTokens'];
      const deletedFields: string[] = [];
      
      for (const field of Object.keys(subject.accountData)) {
        if (!sensitiveFields.includes(field)) {
          delete subject.accountData[field];
          deletedFields.push(field);
        }
      }
      
      deletedData['accountData'] = { records: deletedFields.length, size: '~medium' };
      systemsToDeleteFrom.push('auth_system');
    }

    // Delete communications preferences
    if (request.scope.communicationsData) {
      subject.communicationsData = {
        marketingConsent: false,
        newsletterSubscribed: false,
        smsConsent: false,
        callConsent: false,
      };
      deletedData['communicationsData'] = { records: 4, size: '~tiny' };
      systemsToDeleteFrom.push('crm_system');
    }

    // Delete/anonymize technical data
    if (request.scope.technicalData) {
      if (subject.technicalData.ipAddress) {
        subject.technicalData.ipAddress = this.anonymizeIP(subject.technicalData.ipAddress);
      }
      if (subject.technicalData.deviceId) {
        subject.technicalData.deviceId = this.anonymizeValue(subject.technicalData.deviceId);
      }
      deletedData['technicalData'] = { records: 2, size: '~tiny' };
      systemsToDeleteFrom.push('analytics_platform');
    }

    // Handle transaction data (usually retained for legal reasons)
    if (request.scope.transactionData) {
      retainedData['transactionData'] = {
        reason: 'Legal requirement to retain financial records',
        records: subject.transactionData.orderCount || 0,
      };
      request.processingLog.push({
        step: 'Transaction data retention',
        timestamp: new Date().toISOString(),
        performedBy: 'system',
        result: 'Retained due to legal requirements',
      });
    }

    // Handle custom exclusions
    if (request.scope.customExclusions?.length) {
      for (const exclusion of request.scope.customExclusions) {
        retainedData[exclusion] = {
          reason: 'Custom exclusion during erasure',
          records: 1,
        };
      }
    }

    // Update request
    request.systemsProcessed = systemsToDeleteFrom;
    request.dataDeleted = deletedData;
    request.dataRetained = retainedData;
    request.status = 'completed';
    request.completedAt = new Date().toISOString();

    // Update subject
    subject.status = 'erased';
    subject.erasureCompletionDate = request.completedAt;

    // Schedule final deletion after backup period
    setTimeout(() => {
      this.permanentlyDeleteSubject(request.dataSubjectId);
    }, this.config.rights.erasure.backupRetentionDays * 24 * 60 * 60 * 1000);
  }

  /**
   * GDPR Article 20: Right to Data Portability
   * Export data in machine-readable format
   */
  async createPortabilityExport(
    subjectId: string,
    format: 'json' | 'csv' | 'xml' = 'json',
    options?: Partial<DataPortabilityExport['includes']>
  ): Promise<DataPortabilityExport> {
    const subject = this.dataSubjects.get(subjectId);
    if (!subject) {
      throw new Error('Data subject not found');
    }

    const exportId = `portability_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const exportRecord: DataPortabilityExport = {
      id: exportId,
      dataSubjectId: subjectId,
      requestedAt: now,
      format,
      status: 'pending',
      includes: {
        personalData: true,
        accountData: true,
        transactionData: true,
        consentHistory: true,
        loginHistory: true,
        activityLog: false, // Usually excluded
        ...options,
      },
      downloadCount: 0,
      createdAt: now,
    };

    this.portabilityExports.set(exportId, exportRecord);

    // Generate export file (async operation)
    setImmediate(async () => {
      try {
        exportRecord.status = 'preparing';
        
        const exportData = await this.fulfillAccessRequest(subjectId, format === 'csv' ? 'json' : format);
        
        if (format === 'csv') {
          exportRecord.fileId = await this.storeExportFile(exportId, exportData.data!, 'csv');
          exportRecord.fileName = `algeriatrade_data_export_${subjectId}.csv`;
        } else {
          exportRecord.fileId = await this.storeExportFile(exportId, exportData.data!, 'json');
          exportRecord.fileName = `algeriatrade_data_export_${subjectId}.json`;
        }
        
        exportRecord.fileSize = JSON.stringify(exportData.data!).length;
        exportRecord.downloadUrl = `/api/privacy/export/${exportId}/download`;
        exportRecord.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        exportRecord.status = 'ready';
        exportRecord.preparedBy = 'privacy-system';
      } catch (error) {
        console.error('[Privacy] Failed to generate portability export:', error);
        exportRecord.status = 'expired';
      }
    });

    return exportRecord;
  }

  // ===========================================
  // Consent Management
  // ===========================================

  /**
   * Record consent from data subject
   */
  recordConsent(
    subjectId: string,
    consent: Omit<ConsentRecord, 'id' | 'givenAt'>
  ): ConsentRecord {
    const record: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      givenAt: new Date().toISOString(),
      ...consent,
    };

    let subjectConsents = this.consentRecords.get(subjectId);
    if (!subjectConsents) {
      subjectConsents = [];
      this.consentRecords.set(subjectId, subjectConsents);
    }

    subjectConsents.push(record);

    // Update subject's communication preferences
    const subject = this.dataSubjects.get(subjectId);
    if (subject) {
      switch (consent.type) {
        case 'marketing':
        case 'email':
          subject.communicationsData.marketingConsent = consent.given;
          if (consent.given) {
            subject.communicationsData.lastMarketingOptIn = record.givenAt;
          } else {
            subject.communicationsData.lastMarketingOptOut = record.givenAt;
          }
          break;
        case 'newsletter':
          subject.communicationsData.newsletterSubscribed = consent.given;
          break;
        case 'sms':
          subject.communicationsData.smsConsent = consent.given;
          break;
      }

      subject.metadata.consentRecords.push(record);
    }

    return record;
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(subjectId: string, consentType: string): void {
    const subjectConsents = this.consentRecords.get(subjectId);
    if (!subjectConsents) return;

    const activeConsent = subjectConsents
      .filter(c => c.type === consentType && c.given && !c.withdrawnAt)
      .sort((a, b) => new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime())[0];

    if (activeConsent) {
      activeConsent.withdrawnAt = new Date().toISOString();
      activeConsent.given = false;

      // Update subject preferences
      const subject = this.dataSubjects.get(subjectId);
      if (subject) {
        switch (consentType) {
          case 'marketing':
          case 'email':
            subject.communicationsData.marketingConsent = false;
            subject.communicationsData.lastMarketingOptOut = new Date().toISOString();
            break;
          case 'newsletter':
            subject.communicationsData.newsletterSubscribed = false;
            break;
          case 'sms':
            subject.communicationsData.smsConsent = false;
            break;
        }
      }
    }
  }

  /**
   * Get current consent status for subject
   */
  getConsentStatus(subjectId: string): Record<string, boolean> {
    const subjectConsents = this.consentRecords.get(subjectId) || [];
    const status: Record<string, boolean> = {};

    const activeConsents = subjectConsents.filter(c => c.given && !c.withdrawnAt);
    
    for (const consent of activeConsents) {
      status[consent.type] = true;
    }

    // Ensure all known types have an entry
    const knownTypes = ['marketing', 'analytics', 'functional', 'third_party', 'cookies', 'email', 'sms', 'location'];
    for (const type of knownTypes) {
      if (!(type in status)) {
        status[type] = false;
      }
    }

    return status;
  }

  /**
   * Check if valid consent exists for specific purpose
   */
  hasValidConsent(subjectId: string, purpose: string): boolean {
    const status = this.getConsentStatus(subjectId);
    return status[purpose] === true;
  }

  // ===========================================
  // Privacy Policy Management
  // ===========================================

  /**
   * Get or generate privacy policy
   */
  getPrivacyPolicy(language: string = 'en'): PrivacyPolicy {
    let policy = this.privacyPolicies.get(language);
    
    if (!policy) {
      policy = this.generatePrivacyPolicy(language);
      this.privacyPolicies.set(language, policy);
    }

    return policy;
  }

  /**
   * Generate comprehensive GDPR-compliant privacy policy
   */
  // Privacy policy section content strings
  private static readonly COOKIES_CONTENT_EN = 'We use cookies and similar technologies to:\n\n* **Necessary Cookies:** Essential for website functionality (authentication, security)\n* **Analytics Cookies:** Help us understand how visitors use our site\n* **Marketing Cookies:** Used to deliver relevant advertisements\n\nYou can manage your cookie preferences through your Cookie Settings panel.';
  private static readonly DATA_SHARING_CONTENT_EN = 'We may share your data with:\n\n**Service Providers:** Hosting, payment processing, email delivery (with appropriate safeguards)\n**Business Partners:** To facilitate B2B transactions on our platform\n**Legal Authorities:** When required by law or to protect our rights\n**International Transfers:** Only to countries with adequate data protection or with appropriate safeguards';
  private static readonly DATA_SECURITY_CONTENT_EN = 'We implement appropriate technical and organizational security measures including:\n\nEncryption (TLS/SSL) for data in transit\nEncryption at rest for sensitive data\nnAccess controls and authentication\nRegular security testing and audits\nStaff training on data protection\nIncident response procedures';
  private static readonly RETENTION_CONTENT_EN = 'We retain your personal data only for as long as necessary:\n\n**Active Account:** Duration of account plus legal retention period\n**Transaction Records:** 7 years (accounting/tax requirements)\n**Marketing Data:** Until consent withdrawal plus 12 months\n**Analytics Data:** 26 months (aggregated/anonymized thereafter)\n**Security Logs:** 5 years';
  private static readonly BREACH_CONTENT_EN = "In the event of a personal data breach likely to result in a risk to your rights and freedoms, we will notify you:\n\nWithout undue delay (within 72 hours of becoming aware)\nOf the nature of the breach and categories of data affected\nOf the likely consequences and measures taken\nOf our Data Protection Officer's contact details";

  private generatePrivacyPolicy(language: string): PrivacyPolicy {
    const isEnglish = language === 'en';
    
    const policy: PrivacyPolicy = {
      id: `policy_${language}_${Date.now()}`,
      version: '2.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      language,
      jurisdiction: 'DZ',
      sections: [
        {
          id: 'intro',
          title: isEnglish ? 'Introduction' : 'Introduction',
          content: isEnglish 
            ? `At ${this.config.organization.name} ("we", "us", or "our"), we are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website ${this.config.organization.website} and use our B2B marketplace services.`
            : `Chez ${this.config.organization.name}, nous nous engageons à protéger votre vie privée...`,
          required: true,
          gdprArticles: ['Art. 13', 'Art. 14'],
          order: 1,
        },
        {
          id: 'controller',
          title: isEnglish ? 'Data Controller Information' : 'Informations sur le Contrôleur des Données',
          content: isEnglish
            ? `**Data Controller:** ${this.config.organization.name}\n**Registration Number:** ${this.config.organization.registrationNumber}\n**Address:** ${this.config.organization.address}\n**Contact:** ${this.config.organization.dpoEmail}\n**Data Protection Officer:** ${this.config.organization.dpoName}`
            : `**Contrôleur des données:** ${this.config.organization.name}...`,
          required: true,
          gdprArticles: ['Art. 13(1)(a)', 'Art. 13(1)(b)'],
          order: 2,
        },
        {
          id: 'data_collected',
          title: isEnglish ? 'Data We Collect' : 'Données que Nous Collectons',
          content: isEnglish
            ? `We collect the following types of personal data:\n\n**Account Data:** Name, email address, password (hashed), company information, billing/shipping addresses\n**Transaction Data:** Order history, payment information, shipping details\n**Communications Data:** Marketing preferences, newsletter subscriptions\n**Technical Data:** IP address, browser type, device information, cookies, usage data\n**Identity Data:** Government-issued ID (for verification purposes only)`
            : `Nous collectons les types de données personnelles suivants...`,
          required: true,
          gdprArticles: ['Art. 13(2)(a)-(e)'],
          order: 3,
        },
        {
          id: 'lawful_basis',
          title: isEnglish ? 'Lawful Basis for Processing' : 'Base Légale du Traitement',
          content: isEnglish
            ? `We process your personal data based on the following lawful bases under GDPR:\n\n• **Consent (Art. 6(1)(a)):** When you explicitly agree to specific processing\n• **Contract (Art. 6(1)(b)):** Necessary to fulfill our B2B marketplace services\n• **Legal Obligation (Art. 6(1)(c)):** To comply with Algerian and international laws\n• **Legitimate Interests (Art. 6(1)(f)):** Fraud prevention, network security, service improvement\n• **Your Consent:** For marketing communications and non-essential cookies`
            : `Nous traitons vos données personnelles sur la base légale suivante...`,
          required: true,
          gdprArticles: ['Art. 6', 'Art. 7'],
          order: 4,
        },
        {
          id: 'rights',
          title: isEnglish ? 'Your Rights' : 'Vos Droits',
          content: isEnglish
            ? `Under GDPR, you have the following rights:\n\n**1. Right of Access (Art. 15):** Request a copy of your personal data\n**2. Right to Rectification (Art. 16):** Correct inaccurate data\n**3. Right to Erasure (Art. 17):** Request deletion ("Right to be Forgotten")\n**4. Right to Restrict Processing (Art. 18):** Limit how we use your data\n**5. Right to Data Portability (Art. 20):** Receive your data in machine-readable format\n**6. Right to Object (Art. 21):** Object to profiling or automated decisions\n**7. Right to Withdraw Consent (Art. 7(3)):** Change your mind at any time`
            : `En vertu du RGPD, vous avez les droits suivants...`,
          required: true,
          gdprArticles: ['Art. 15-22'],
          order: 5,
        },
      ],
      cookieSettings: {
        necessaryCookies: [
          { name: 'session_id', domain: '.algeriatrade.dz', purpose: 'Authentication session', duration: '24h', category: 'necessary', provider: 'first_party', required: true },
          { name: 'csrf_token', domain: '.algeriatrade.dz', purpose: 'CSRF protection', duration: '24h', category: 'necessary', provider: 'first_party', required: true },
        ],
        analyticsCookies: [
          { name: '_ga', domain: '.algeriatrade.dz', purpose: 'Google Analytics', duration: '2 years', category: 'analytics', provider: 'third_party', thirdPartyName: 'Google', required: false },
        ],
        marketingCookies: [
          { name: '_fbp', domain: '.algeriatrade.dz', purpose: 'Facebook Pixel', duration: '3 months', category: 'marketing', provider: 'third_party', thirdPartyName: 'Meta', required: false },
        ],
        preferenceCookies: [
          { name: 'preferences', domain: '.algeriatrade.dz', purpose: 'User preferences', duration: '1 year', category: 'preference', provider: 'first_party', required: false },
        ],
        defaultConsent: 'necessary_only',
        consentBannerEnabled: true,
        granularControl: true,
        expiryDays: 365,
      },
      dataRetentionPeriods: {
        'Account data': `${this.config.defaultRetentionPeriods.accountData} days`,
        'Transaction data': `${this.config.defaultRetentionPeriods.transactionData} days`,
        'Marketing data': `${this.config.defaultRetentionPeriods.marketingData} days`,
        'Analytics data': `${this.config.defaultRetentionPeriods.analyticsData} days`,
      },
      userRights: [
        'Right of Access',
        'Right to Rectification',
        'Right to Erasure',
        'Right to Restrict Processing',
        'Right to Data Portability',
        'Right to Object',
        'Right to Withdraw Consent',
      ],
      contactInfo: {
        dpoName: this.config.organization.dpoName,
        dpoEmail: this.config.organization.dpoEmail,
        dpoPhone: this.config.organization.dpoPhone,
        companyAddress: this.config.organization.address,
      },
      published: false,
      acceptanceRequired: true,
      acceptanceVersion: '2.0',
    };

    return policy;
  }

  // ===========================================
  // Data Breach Management
  // ===========================================

  /**
   * Report a data breach
   */
  reportBreach(breach: Omit<DataBreachRecord, 'id' | 'detectedAt'>): DataBreachRecord {
    const record: DataBreachRecord = {
      id: `breach_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      detectedAt: new Date().toISOString(),
      reportedToDPO: false,
      reportedToAuthority: false,
      authorityReportDeadline: new Date(Date.now() + (this.config.breachNotification.authorityNotificationHours * 60 * 60 * 1000)).toISOString(),
      subjectsNotified: false,
      subjectsNotificationMethod: 'none',
      evidencePreserved: false,
      reportGenerated: false,
      containmentActions: [],
      lessonsLearned: [],
      preventiveMeasures: [],
      ...breach,
    };

    this.breachRecords.set(record.id, record);

    // Auto-trigger critical alerts
    if (record.severity === 'critical') {
      this.triggerBreachAlert(record);
    }

    return record;
  }

  /**
   * Notify authorities about breach
   */
  async notifyAuthorities(breachId: string): Promise<void> {
    const breach = this.breachRecords.get(breachId);
    if (!breach) throw new Error('Breach record not found');

    breach.reportedToAuthority = true;
    
    // In production, would integrate with CNIL (Algerian DPA) or other authority API
    console.log(`[PRIVACY] Notifying authority about breach ${breachId}`);
  }

  /**
   * Notify affected data subjects
   */
  async notifyAffectedSubjects(breachId: string): Promise<void> {
    const breach = this.breachRecords.get(breachId);
    if (!breach) throw new Error('Breach record not found');

    breach.subjectsNotified = true;
    
    // In production, would send emails to all affected users
    console.log(`[PRIVACY] Notifying ${breach.affectedDataSubjects} subjects about breach ${breachId}`);
  }

  // ===========================================
  // DPIA Management
  // ===========================================

  /**
   * Create DPIA for high-risk processing
   */
  createDPIA(dpia: Omit<DPIARecord, 'id' | 'createdAt' | 'updatedAt'>): DPIARecord {
    const record: DPIARecord = {
      id: `dpia_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      ...dpia,
    };

    this.dpiaRecords.set(record.id, record);
    return record;
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  private addProcessingActivity(subjectId: string, activity: ProcessingActivity): void {
    const subject = this.dataSubjects.get(subjectId);
    if (subject) {
      subject.metadata.dataProcessingActivities.push({
        id: `activity_${Date.now()}`,
        ...activity,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private checkLegalHolds(subjectId: string): { hasHold: boolean; description: string; reasons: string[] } {
    // In production, would check against legal hold database
    // For now, return no hold
    return { hasHold: false, description: '', reasons: [] };
  }

  private permanentlyDeleteSubject(subjectId: string): void {
    this.dataSubjects.delete(subjectId);
    this.consentRecords.delete(subjectId);
  }

  private anonymizeIP(ip: string): string {
    if (!ip || ip === 'unknown') return ip;
    // Keep first two octets, mask rest
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.*`;
    }
    return '***.***.***.***';
  }

  private anonymizeValue(value: string): string {
    if (!value) return value;
    return `${value.substring(0, 2)}${'*'.repeat(Math.min(value.length - 2, 8))}`;
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const flattenObject = (obj: any, prefix = ''): any[] => {
      const rows: any[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          rows.push(...flattenObject(value, newKey));
        } else {
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
          rows.push({ key: newKey, value: stringValue.replace(/"/g, '""').replace(/\n/g, ' ') });
        }
      }
      
      return rows;
    };

    const flatData = flattenObject(data);
    if (flatData.length === 0) return '';

    const headers = Object.keys(flatData[0]);
    const values = flatData.map(row => headers.map(h => row[h] || ''));

    return [headers.join(','), ...values.map(v => v.join(','))].join('\n');
  }

  private async storeExportFile(exportId: string, data: any, format: string): Promise<string> {
    // In production, would upload to secure storage (S3, GCS, etc.)
    const filename = `exports/${exportId}.${format}`;
    console.log(`[PRIVACY] Storing export file: ${filename}`);
    return filename;
  }

  private triggerBreachAlert(breach: DataBreachRecord): void {
    console.error(`[PRIVACY CRITICAL ALERT] Data breach detected! Severity: ${breach.severity}, Affected: ${breach.affectedDataSubjects} subjects`);
    // Would integrate with alerting system
  }

  private loadDefaultPrivacyPolicy(): void {
    // Policy is generated dynamically in getPrivacyPolicy()
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let privacyInstance: PrivacyComplianceSystem | null = null;

export function getPrivacySystem(config?: Partial<PrivacyConfig>): PrivacyComplianceSystem {
  if (!privacyInstance) {
    privacyInstance = new PrivacyComplianceSystem(config);
  }
  return privacyInstance;
}

// Convenience export
export const privacySystem = getPrivacySystem();

export default {
  getPrivacySystem,
  PrivacyComplianceSystem,
};
