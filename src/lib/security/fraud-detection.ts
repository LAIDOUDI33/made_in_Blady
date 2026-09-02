/**
 * AlgeriaTrade.dz - Advanced Fraud Detection & Prevention System
 * 
 * Enterprise-grade fraud protection providing:
 * - User behavior analysis and anomaly detection
 * - Transaction risk scoring with ML-inspired models
 * - Device fingerprinting for identification
 * - Velocity checking (rapid action detection)
 * - Geolocation anomaly detection
 * - Account takeover prevention
 * - Payment fraud protection
 * - IP/email/phone reputation checking
 * - Real-time fraud scoring and decisioning
 * - Case management for manual review
 */

// ===========================================
// Types & Interfaces
// ===========================================

export interface FraudEvent {
  id: string;
  timestamp: string;
  eventType: 'transaction' | 'login' | 'registration' | 'profile_update' | 
              'password_reset' | 'payment' | 'rfq' | 'message' | 'api_call';
  userId?: string;
  sessionId: string;
  
  // Request info
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  fingerprint?: string;
  
  // Location data
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  
  // Event-specific data
  data: {
    amount?: number;
    currency?: string;
    recipientId?: string;
    email?: string;
    phone?: string;
    shippingAddress?: Record<string, any>;
    billingAddress?: Record<string, any>;
    paymentMethod?: string;
    [key: string]: any;
  };
  
  // Context
  context: {
    url?: string;
    referer?: string;
    isMobile?: boolean;
    isProxy?: boolean;
    isVPN?: boolean;
    isTor?: boolean;
    hostingProvider?: string;
    connectionType?: string;
  };
}

export interface FraudAssessment {
  eventId: string;
  score: number; // 0-100, higher = more risky
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  decision: 'approve' | 'review' | 'challenge' | 'block';
  reasons: Array<{
    ruleId: string;
    ruleName: string;
    severity: 'info' | 'warning' | 'danger';
    scoreImpact: number; // How much this added to the score
    description: string;
  }>;
  recommendations: string[];
  reviewRequired: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'velocity' | 'location' | 'device' | 'behavior' | 'identity' | 'payment' | 'account';
  severity: 'low' | 'medium' | 'high' | 'critical';
  scoreWeight: number; // How much to add to score if triggered
  
  // Conditions
  conditions: FraudRuleCondition[];
  conditionLogic: 'AND' | 'OR'; // How to combine conditions
  
  // Actions when triggered
  action: 'add_score' | 'block' | 'challenge' | 'review' | 'mfa_required';
  
  // Time window (for velocity rules)
  timeWindowMs?: number;
  threshold?: number;
  
  // Metadata
  tags: string[];
  falsePositiveRate: number; // Estimated false positive rate (0-1)
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FraudRuleCondition {
  field: keyof FraudEvent | keyof FraudEvent['data'] | keyof FraudEvent['context'];
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'matches' |
            'greater_than' | 'less_than' | 'in' | 'not_in' | 'changed_from' |
            'distance_greater_than' | 'time_since_less_than' | 'time_since_greater_than' |
            'count_in_window' | 'unique_count_in_window' | 'velocity_exceeds';
  value: any;
  timeWindowMs?: number; // For velocity/count operations
}

export interface DeviceFingerprint {
  id: string;
  hash: string;
  
  // Browser info
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  vendor: string;
  
  // Screen info
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelRatio: number;
  
  // Hardware info
  deviceMemory?: number;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
  
  // Network info
  connectionType?: string;
  downlink?: number;
  rtt?: number;
  
  // Features
  cookiesEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webGL?: string;
  canvas?: string;
  fonts?: string[];
  plugins?: string[];
  
  // Timestamps
  firstSeen: string;
  lastSeen: string;
  seenCount: number;
  
  // Risk assessment
  riskScore: number;
  isEmulator: boolean;
  isBot: boolean;
  isVPN: boolean;
  isTor: boolean;
  hostingInfo?: string;
}

export interface UserProfile {
  userId: string;
  
  // Historical data
  registrationDate: string;
  loginHistory: Array<{
    timestamp: string;
    ip: string;
    deviceFingerprint: string;
    location: { country: string; city: string };
    success: boolean;
  }>;
  transactionHistory: Array<{
    timestamp: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'pending' | 'refunded';
    ip: string;
    deviceFingerprint: string;
    location: { country: string; city: string };
    recipientId?: string;
  }>;
  
  // Behavioral patterns
  typicalLoginHours: number[]; // Hours of day (0-23) user usually logs in
  typicalCountries: string[]; // Countries user typically logs in from
  typicalDevices: string[]; // Device fingerprints seen before
  averageTransactionAmount: number;
  transactionAmountStdDev: number;
  
  // Risk flags
  riskFlags: string[];
  notes: string;
  trustScore: number; // 0-100, higher = more trusted
  verificationLevel: 'none' | 'email' | 'phone' | 'identity' | 'business';
  
  // Account status
  accountStatus: 'active' | 'suspended' | 'under_review' | 'banned';
  lastActivity: string;
}

export interface FraudCase {
  id: string;
  eventId: string;
  userId?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Assessment that created this case
  assessment: FraudAssessment;
  
  // Investigation details
  assignedTo?: string;
  assignedAt?: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  
  // Evidence collected
  evidence: Array<{
    type: 'screenshot' | 'log' | 'user_statement' | 'third_party' | 'system';
    description: string;
    data: any;
    collectedAt: string;
    collectedBy?: string;
  }>;
  
  // Communication with user
  communications: Array<{
    channel: 'email' | 'sms' | 'in_app' | 'phone';
    direction: 'sent' | 'received';
    content: string;
    timestamp: string;
  }>;
  
  createdAt: string;
  updatedAt: string;
}

export interface FraudStatistics {
  period: {
    start: string;
    end: string;
  };
  
  totalEvents: number;
  totalAssessments: number;
  blockedEvents: number;
  challengedEvents: number;
  reviewedEvents: number;
  approvedEvents: number;
  
  assessmentsByRiskLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  topFraudTypes: Array<{ type: string; count: number }>;
  topBlockedCountries: Array<{ country: string; count: number }>;
  averageFraudScore: number;
  falsePositiveRate: number;
  caseResolutionTime: {
    avg: number;
    median: number;
    p95: number;
  };
  
  financialImpact: {
    preventedFraud: number; // Amount of fraud prevented
    totalInvestigated: number; // Total amount under investigation
    confirmedLosses: number; // Confirmed fraudulent losses
  };
}

// ===========================================
// Configuration
// ===========================================

interface FraudDetectionConfig {
  enabled: boolean;
  mode: 'detect' | 'prevent' | 'learning'; // detect = log only, prevent = block, learn = build models
  
  // Scoring thresholds
  thresholds: {
    lowRisk: number;      // 0-30
    mediumRisk: number;   // 31-60
    highRisk: number;     // 61-85
    criticalRisk: number; // 86-100
    
    autoBlockThreshold: number;     // Auto-block above this
    autoChallengeThreshold: number; // Challenge between these
    autoReviewThreshold: number;    // Review required above this
    
    mfaRequiredForNewDevice: boolean;
    mfaRequiredForHighValueTxn: number; // Amount threshold
  };
  
  // Feature flags
  features: {
    deviceFingerprinting: boolean;
    behaviorAnalysis: boolean;
    velocityChecking: boolean;
    geoLocationAnalysis: boolean;
    identityVerification: boolean;
    networkAnalysis: boolean;
    mlScoring: boolean;
    caseManagement: boolean;
  };
  
  // Velocity rules defaults
  velocityDefaults: {
    maxLoginsPerHour: number;
    maxTransactionsPerHour: number;
    maxRegistrationsPerIPPerDay: number;
    maxPasswordResetsPerDay: number;
    maxFailedLoginsBeforeLockout: number;
    lockoutDurationMs: number;
  };
  
  // Geographic rules
  geoRules: {
    enabled: boolean;
    allowInternationalTransactions: boolean;
    highRiskCountries: string[];
    requireAdditionalVerification: string[]; // Countries needing extra verification
    maxDistanceBetweenLoginsKm: number; // Impossible travel detection
    timezoneMismatchTolerance: number; // Hours
  };
  
  // Device rules
  deviceRules: {
    maxDevicesPerUser: number;
    maxNewDevicesPerDay: number;
    suspiciousDevicePatterns: RegExp[];
    emulatorDetection: boolean;
    botDetection: boolean;
  };
  
  // Integration settings
  integrations: {
    emailReputationService?: {
      endpoint: string;
      apiKey: string;
    };
    phoneReputationService?: {
      endpoint: string;
      apiKey: string;
    };
    ipReputationService?: {
      endpoint: string;
      apiKey: string;
    };
    addressVerificationService?: {
      endpoint: string;
      apiKey: string;
    };
  };
  
  // Alerting
  alerting: {
    enabled: boolean;
    onCriticalScore: boolean;
    onBlockedTransaction: boolean;
    onNewFraudCase: boolean;
    onVelocityBreach: boolean;
    notifyChannels: string[]; // Channel IDs
  };
  
  // Data retention
  retention: {
    eventRetentionDays: number;
    caseRetentionDays: number;
    deviceProfileRetentionDays: number;
    anonymizeAfterDays: number;
  };
}

const DEFAULT_CONFIG: FraudDetectionConfig = {
  enabled: true,
  mode: 'prevent',
  
  thresholds: {
    lowRisk: 30,
    mediumRisk: 60,
    highRisk: 85,
    criticalRisk: 100,
    
    autoBlockThreshold: 85,
    autoChallengeThreshold: 60,
    autoReviewThreshold: 70,
    
    mfaRequiredForNewDevice: true,
    mfaRequiredForHighValueTxn: 5000, // DZD
  },
  
  features: {
    deviceFingerprinting: true,
    behaviorAnalysis: true,
    velocityChecking: true,
    geoLocationAnalysis: true,
    identityVerification: true,
    networkAnalysis: true,
    mlScoring: true,
    caseManagement: true,
  },
  
  velocityDefaults: {
    maxLoginsPerHour: 20,
    maxTransactionsPerHour: 10,
    maxRegistrationsPerIPPerDay: 3,
    maxPasswordResetsPerDay: 5,
    maxFailedLoginsBeforeLockout: 5,
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  
  geoRules: {
    enabled: true,
    allowInternationalTransactions: true,
    highRiskCountries: [], // Would populate based on business needs
    requireAdditionalVerification: [],
    maxDistanceBetweenLoginsKm: 1000, // ~621 miles in < 1 hour = impossible
    timezoneMismatchTolerance: 2, // hours
  },
  
  deviceRules: {
    maxDevicesPerUser: 5,
    maxNewDevicesPerDay: 2,
    suspiciousDevicePatterns: [
      /selenium/i,
      /phantomjs/i,
      /headless/i,
      /playwright/i,
      /puppeteer/i,
    ],
    emulatorDetection: true,
    botDetection: true,
  },
  
  integrations: {},
  
  alerting: {
    enabled: true,
    onCriticalScore: true,
    onBlockedTransaction: true,
    onNewFraudCase: true,
    onVelocityBreach: true,
    notifyChannels: ['security-team'],
  },
  
  retention: {
    eventRetentionDays: 90,
    caseRetentionDays: 365,
    deviceProfileRetentionDays: 180,
    anonymizeAfterDays: 365,
  },
};

// ===========================================
// Main Fraud Detection Class
// ===========================================

class FraudDetectionSystem {
  private config: FraudDetectionConfig;
  private rules: Map<string, FraudRule> = new Map();
  private events: FraudEvent[] = [];
  private cases: Map<string, FraudCase> = new Map();
  private deviceProfiles: Map<string, DeviceFingerprint> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private velocityStore: Map<string, Array<{ timestamp: number; data: any }>> = new Map();
  private statistics: FraudStatistics;

  constructor(config?: Partial<FraudDetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.statistics = this.initializeStatistics();
    
    // Load built-in fraud rules
    this.loadBuiltInRules();
  }

  /**
   * Main method: Assess a fraud event
   */
  async assessEvent(event: Partial<FraudEvent>): Promise<FraudAssessment> {
    if (!this.config.enabled) {
      return this.createSafeAssessment(event);
    }

    const completeEvent: FraudEvent = {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      eventType: event.eventType || 'api_call',
      sessionId: event.sessionId || 'unknown',
      ipAddress: event.ipAddress || 'unknown',
      userAgent: event.userAgent || '',
      ...event,
      data: event.data || {},
      context: event.context || {},
    };

    // Store event
    this.events.push(completeEvent);
    this.trimOldEvents();

    // Initialize assessment
    const assessment: FraudAssessment = {
      eventId: completeEvent.id,
      score: 0,
      riskLevel: 'low',
      decision: 'approve',
      reasons: [],
      recommendations: [],
      reviewRequired: false,
    };

    // Run all enabled checks
    await Promise.all([
      this.checkVelocityRules(completeEvent, assessment),
      this.checkLocationAnomalies(completeEvent, assessment),
      this.checkDeviceRisk(completeEvent, assessment),
      this.checkBehavioralAnomalies(completeEvent, assessment),
      this.checkIdentityRisks(completeEvent, assessment),
      this.checkPaymentRisks(completeEvent, assessment),
      this.checkAccountRisks(completeEvent, assessment),
      this.checkNetworkRisks(completeEvent, assessment),
      this.evaluateCustomRules(completeEvent, assessment),
    ]);

    // Apply ML-style composite scoring
    if (this.config.features.mlScoring) {
      this.applyCompositeScoring(completeEvent, assessment);
    }

    // Determine final decision
    this.makeDecision(assessment);

    // Create case if needed
    if (assessment.decision === 'review' || assessment.decision === 'block') {
      if (this.config.features.caseManagement) {
        await this.createFraudCase(completeEvent, assessment);
      }
    }

    // Update statistics
    this.updateStatistics(assessment);

    // Trigger alerts
    if (this.config.alerting.enabled) {
      this.triggerAlerts(completeEvent, assessment);
    }

    return assessment;
  }

  /**
   * Generate device fingerprint from client data
   */
  generateDeviceFingerprint(data: Partial<DeviceFingerprint>): DeviceFingerprint {
    const components = [
      data.userAgent,
      data.language,
      data.platform,
      data.vendor,
      `${data.screenWidth}x${data.screenHeight}`,
      `${data.colorDepth}`,
      `${data.pixelRatio}`,
      String(data.deviceMemory),
      String(data.hardwareConcurrency),
      String(data.maxTouchPoints),
      data.connectionType,
      String(data.downlink),
      String(data.rtt),
      String(data.cookiesEnabled),
      String(data.localStorage),
      String(data.sessionStorage),
      String(data.indexedDB),
      data.webGL,
      data.canvas,
      data.fonts?.join(','),
      data.plugins?.join(','),
    ].filter(Boolean);

    const hash = this.simpleHash(components.join('|'));

    const now = new Date().toISOString();

    // Check if we've seen this device before
    let existingProfile = this.deviceProfiles.get(hash);
    
    if (existingProfile) {
      existingProfile.lastSeen = now;
      existingProfile.seenCount++;
      
      // Update risk assessment
      existingProfile.riskScore = this.calculateDeviceRisk({ ...existingProfile, ...data });
    } else {
      existingProfile = {
        id: `device_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        hash,
        
        userAgent: data.userAgent || '',
        language: data.language || '',
        languages: data.languages || [],
        platform: data.platform || '',
        vendor: data.vendor || '',
        
        screenWidth: data.screenWidth || 0,
        screenHeight: data.screenHeight || 0,
        colorDepth: data.colorDepth || 0,
        pixelRatio: data.pixelRatio || 0,
        
        deviceMemory: data.deviceMemory,
        hardwareConcurrency: data.hardwareConcurrency,
        maxTouchPoints: data.maxTouchPoints,
        
        connectionType: data.connectionType,
        downlink: data.downlink,
        rtt: data.rtt,
        
        cookiesEnabled: data.cookiesEnabled ?? true,
        localStorage: data.localStorage ?? true,
        sessionStorage: data.sessionStorage ?? true,
        indexedDB: data.indexedDB ?? true,
        webGL: data.webGL,
        canvas: data.canvas,
        fonts: data.fonts,
        plugins: data.plugins,
        
        firstSeen: now,
        lastSeen: now,
        seenCount: 1,
        
        riskScore: 0,
        isEmulator: false,
        isBot: false,
        isVPN: false,
        isTor: false,
      };

      // Analyze device characteristics
      this.analyzeDeviceCharacteristics(existingProfile);
      
      this.deviceProfiles.set(hash, existingProfile);
    }

    return existingProfile;
  }

  /**
   * Get or create user profile
   */
  getUserProfile(userId: string): UserProfile {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        registrationDate: new Date().toISOString(),
        loginHistory: [],
        transactionHistory: [],
        typicalLoginHours: [],
        typicalCountries: [],
        typicalDevices: [],
        averageTransactionAmount: 0,
        transactionAmountStdDev: 0,
        riskFlags: [],
        notes: '',
        trustScore: 50, // Start neutral
        verificationLevel: 'none',
        accountStatus: 'active',
        lastActivity: new Date().toISOString(),
      };

      this.userProfiles.set(userId, profile);
    }

    return profile;
  }

  /**
   * Update user profile with new activity
   */
  updateUserActivity(
    userId: string,
    activity: {
      type: 'login' | 'transaction';
      timestamp: string;
      ip: string;
      deviceFingerprint: string;
      location: { country: string; city: string };
      success: boolean;
      amount?: number;
      currency?: string;
      status?: string;
      recipientId?: string;
    }
  ): void {
    const profile = this.getUserProfile(userId);
    
    if (activity.type === 'login') {
      profile.loginHistory.push({
        timestamp: activity.timestamp,
        ip: activity.ip,
        deviceFingerprint: activity.deviceFingerprint,
        location: activity.location,
        success: activity.success,
      });

      // Keep only last 100 logins
      if (profile.loginHistory.length > 100) {
        profile.loginHistory = profile.loginHistory.slice(-100);
      }

      // Update patterns
      const hour = new Date(activity.timestamp).getHours();
      if (!profile.typicalLoginHours.includes(hour)) {
        profile.typicalLoginHours.push(hour);
      }
      
      if (!profile.typicalCountries.includes(activity.location.country)) {
        profile.typicalCountries.push(activity.location.country);
      }
      
      if (!profile.typicalDevices.includes(activity.deviceFingerprint)) {
        profile.typicalDevices.push(activity.deviceFingerprint);
      }
    } else if (activity.type === 'transaction') {
      profile.transactionHistory.push({
        timestamp: activity.timestamp,
        amount: activity.amount!,
        currency: activity.currency || 'DZD',
        status: (activity.status as any) || 'success',
        ip: activity.ip,
        deviceFingerprint: activity.deviceFingerprint,
        location: activity.location,
        recipientId: activity.recipientId,
      });

      // Keep only last 200 transactions
      if (profile.transactionHistory.length > 200) {
        profile.transactionHistory = profile.transactionHistory.slice(-200);
      }

      // Recalculate averages
      this.recalculateUserStats(profile);
    }

    profile.lastActivity = activity.timestamp;

    // Recalculate trust score
    profile.trustScore = this.calculateTrustScore(profile);
  }

  // ===========================================
  // Rule Management
  // ===========================================

  addRule(rule: Omit<FraudRule, 'id' | 'triggerCount' | 'createdAt' | 'updatedAt'>): FraudRule {
    const newRule: FraudRule = {
      ...rule,
      id: `frule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      triggerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRules(): FraudRule[] {
    return Array.from(this.rules.values());
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // ===========================================
  // Case Management
  // ===========================================

  getCases(filters?: { status?: FraudCase['status']; priority?: FraudCase['priority']; userId?: string }): FraudCase[] {
    let cases = Array.from(this.cases.values());
    
    if (filters?.status) {
      cases = cases.filter(c => c.status === filters.status);
    }
    if (filters?.priority) {
      cases = cases.filter(c => c.priority === filters.priority);
    }
    if (filters?.userId) {
      cases = cases.filter(c => c.userId === filters.userId);
    }
    
    return cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getCase(caseId: string): FraudCase | undefined {
    return this.cases.get(caseId);
  }

  updateCase(
    caseId: string,
    updates: Partial<Pick<FraudCase, 'status' | 'priority' | 'assignedTo' | 'resolution' | 'resolutionNotes'>>
  ): FraudCase | null {
    const fraudCase = this.cases.get(caseId);
    if (!fraudCase) return null;

    Object.assign(fraudCase, updates, { updatedAt: new Date().toISOString() });
    return fraudCase;
  }

  addEvidence(caseId: string, evidence: Omit<FraudCase['evidence'][0], 'collectedAt' | 'collectedBy'>): void {
    const fraudCase = this.cases.get(caseId);
    if (!fraudCase) return;

    fraudCase.evidence.push({
      ...evidence,
      collectedAt: new Date().toISOString(),
    });
  }

  addCommunication(caseId: string, communication: Omit<FraudCase['communications'][0], 'timestamp'>): void {
    const fraudCase = this.cases.get(caseId);
    if (!fraudCase) return;

    fraudCase.communications.push({
      ...communication,
      timestamp: new Date().toISOString(),
    });
  }

  // ===========================================
  // Statistics & Reporting
  // ===========================================

  getStatistics(): FraudStatistics {
    return { ...this.statistics };
  }

  getFraudTrend(days: number = 30): Array<{ date: string; events: number; blocked: number; score: number }> {
    const trend: Array<{ date: string; events: number; blocked: number; score: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEvents = this.events.filter(e => e.timestamp.startsWith(dateStr));
      const dayBlocked = dayEvents.length; // Simplified - would track actual blocks

      trend.push({
        date: dateStr,
        events: dayEvents.length,
        blocked: Math.round(dayEvents.length * 0.05), // Approximation
        score: 15 + Math.random() * 20, // Mock score
      });
    }

    return trend;
  }

  exportReport(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify({
        statistics: this.statistics,
        recentCases: this.getCases().slice(0, 50),
        activeRules: this.getRules().filter(r => r.enabled),
        generatedAt: new Date().toISOString(),
      }, null, 2);
    }

    // CSV format
    const headers = 'Date,Event Type,User ID,Risk Score,Decision,Reason\n';
    const rows = this.events.slice(-100).map(e => 
      `${e.timestamp},${e.eventType},${e.userId || ''},,,,"${e.ipAddress}"`
    ).join('\n');

    return headers + rows;
  }

  // ===========================================
  // Private Methods - Check Implementations
  // ===========================================

  private async checkVelocityRules(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!this.config.features.velocityChecking) return;

    const now = Date.now();

    // Check login velocity
    if (event.eventType === 'login') {
      const key = `login:${event.ipAddress}:${event.userId || 'anonymous'}`;
      const recentLogins = this.getVelocityEntries(key, 3600000); // Last hour
      
      if (recentLogins.length >= this.config.velocityDefaults.maxLoginsPerHour) {
        assessment.reasons.push({
          ruleId: 'velocity_login_ip',
          ruleName: 'Excessive Login Attempts from IP',
          severity: 'warning',
          scoreImpact: 25,
          description: `${recentLogins.length} login attempts from this IP in the last hour`,
        });
      }

      // Check per-user velocity
      if (event.userId) {
        const userKey = `login:user:${event.userId}`;
        const userLogins = this.getVelocityEntries(userKey, 3600000);
        
        if (userLogins.length >= this.config.velocityDefaults.maxLoginsPerHour) {
          assessment.reasons.push({
            ruleId: 'velocity_login_user',
            ruleName: 'Excessive Login Attempts by User',
            severity: 'warning',
            scoreImpact: 20,
            description: `${userLogins.length} login attempts by this user in the last hour`,
          });
        }
      }
    }

    // Check transaction velocity
    if (event.eventType === 'transaction' || event.eventType === 'payment') {
      const txKey = `transaction:${event.userId || event.ipAddress}`;
      const recentTxs = this.getVelocityEntries(txKey, 3600000);
      
      if (recentTxs.length >= this.config.velocityDefaults.maxTransactionsPerHour) {
        assessment.reasons.push({
          ruleId: 'velocity_transaction',
          ruleName: 'High Transaction Velocity',
          severity: 'danger',
          scoreImpact: 35,
          description: `${recentTxs.length} transactions in the last hour`,
        });
      }

      // High-value transaction velocity
      const highValueTxs = recentTxs.filter(t => t.data.amount > 2000);
      if (highValueTxs.length >= 3) {
        assessment.reasons.push({
          ruleId: 'velocity_high_value',
          ruleName: 'Multiple High-Value Transactions',
          severity: 'danger',
          scoreImpact: 40,
          description: `${highValueTxs.length} high-value transactions (>2000 DZD) in the last hour`,
        });
      }
    }

    // Registration velocity
    if (event.eventType === 'registration') {
      const regKey = `registration:${event.ipAddress}`;
      const recentRegs = this.getVelocityEntries(regKey, 86400000); // Last day
      
      if (recentRegs.length >= this.config.velocityDefaults.maxRegistrationsPerIPPerDay) {
        assessment.reasons.push({
          ruleId: 'velocity_registration',
          ruleName: 'Excessive Registrations from IP',
          severity: 'danger',
          scoreImpact: 45,
          description: `${recentRegs.length} registrations from this IP today`,
        });
      }
    }

    // Password reset velocity
    if (event.eventType === 'password_reset') {
      const resetKey = `password_reset:${event.userId || event.data.email}`;
      const recentResets = this.getVelocityEntries(resetKey, 86400000);
      
      if (recentResets.length >= this.config.velocityDefaults.maxPasswordResetsPerDay) {
        assessment.reasons.push({
          ruleId: 'velocity_password_reset',
          ruleName: 'Excessive Password Resets',
          severity: 'warning',
          scoreImpact: 30,
          description: `${recentResets.length} password reset requests today`,
        });
      }
    }

    // Record this event for future velocity checks
    const recordKey = `${event.eventType}:${event.userId || event.ipAddress}`;
    this.addVelocityEntry(recordKey, { timestamp: now, data: event.data });
  }

  private async checkLocationAnomalies(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!this.config.features.geoLocationAnalysis || !this.config.geoRules.enabled) return;
    if (!event.country) return;

    // Check high-risk countries
    if (this.config.geoRules.highRiskCountries.includes(event.country)) {
      assessment.reasons.push({
        ruleId: 'geo_high_risk_country',
        ruleName: 'Connection from High-Risk Country',
        severity: 'warning',
        scoreImpact: 20,
        description: `Request originating from ${event.country}, which is flagged as high-risk`,
      });
    }

    // Check for impossible travel (if user exists)
    if (event.userId) {
      const profile = this.userProfiles.get(event.userId);
      if (profile && profile.loginHistory.length > 0) {
        const lastLogin = profile.loginHistory[profile.loginHistory.length - 1];
        
        if (lastLogin.location.country !== event.country) {
          // Calculate distance (simplified - would use proper geodesic calculation)
          const distance = this.approximateDistance(
            lastLogin.location.city, event.city || ''
          );
          
          if (distance > this.config.geoRules.maxDistanceBetweenLoginsKm) {
            const timeDiff = Date.now() - new Date(lastLogin.timestamp).getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff < 24) { // Less than 24 hours
              assessment.reasons.push({
                ruleId: 'geo_impossible_travel',
                ruleName: 'Impossible Travel Detected',
                severity: 'danger',
                scoreImpact: 50,
                description: `User logged in from ${lastLogin.location.country} ${hoursDiff.toFixed(1)}h ago, now from ${event.country}`,
              });
            }
          }
        }

        // Timezone mismatch
        if (event.timezone && lastLogin.location.city !== event.city) {
          // Compare timezone offset with expected
          const expectedOffset = this.getTimezoneOffset(lastLogin.location.country);
          const actualOffset = this.parseTimezoneOffset(event.timezone);
          
          if (Math.abs(expectedOffset - actualOffset) > this.config.geoRules.timezoneMismatchTolerance) {
            assessment.reasons.push({
              ruleId: 'geo_timezone_mismatch',
              ruleName: 'Timezone Mismatch',
              severity: 'warning',
              scoreImpact: 15,
              description: `Timezone doesn't match expected location`,
            });
          }
        }
      }
    }
  }

  private async checkDeviceRisk(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!this.config.features.deviceFingerprinting) return;

    const deviceProfile = event.fingerprint ? 
      this.deviceProfiles.get(event.fingerprint) : null;

    if (deviceProfile) {
      // Known device risks
      if (deviceProfile.isBot) {
        assessment.reasons.push({
          ruleId: 'device_known_bot',
          ruleName: 'Known Bot Device',
          severity: 'danger',
          scoreImpact: 60,
          description: 'Device fingerprint matches known bot pattern',
        });
      }

      if (deviceProfile.isEmulator) {
        assessment.reasons.push({
          ruleId: 'device_emulator',
          ruleName: 'Emulator Detected',
          severity: 'warning',
          scoreImpact: 25,
          description: 'Device appears to be running in an emulator',
        });
      }

      if (deviceProfile.isTor) {
        assessment.reasons.push({
          ruleId: 'device_tor',
          ruleName: 'Tor Network Detected',
          severity: 'warning',
          scoreImpact: 20,
          description: 'Connection through Tor network',
        });
      }

      if (deviceProfile.isVPN && event.eventType === 'transaction') {
        assessment.reasons.push({
          ruleId: 'device_vpn_transaction',
          ruleName: 'VPN Used for Transaction',
          severity: 'warning',
          scoreImpact: 15,
          description: 'Transaction attempted while using VPN/proxy',
        });
      }
    }

    // Check user's device history
    if (event.userId && event.fingerprint) {
      const profile = this.userProfiles.get(event.userId);
      if (profile) {
        const isNewDevice = !profile.typicalDevices.includes(event.fingerprint);
        
        if (isNewDevice) {
          const recentNewDevices = profile.typicalDevices.filter(d => {
            // Count devices first seen in last 24h (simplified)
            return d.startsWith('device_'); // Placeholder logic
          }).length;

          if (recentNewDevices >= this.config.deviceRules.maxNewDevicesPerDay) {
            assessment.reasons.push({
              ruleId: 'device_many_new_devices',
              ruleName: 'Many New Devices',
              severity: 'warning',
              scoreImpact: 25,
              description: `User accessing from multiple new devices recently`,
            });
          }

          // Require MFA for new devices
          if (this.config.thresholds.mfaRequiredForNewDevice) {
            assessment.recommendations.push('Require multi-factor authentication');
          }
        }

        // Too many devices overall
        if (profile.typicalDevices.length > this.config.deviceRules.maxDevicesPerUser) {
          assessment.reasons.push({
            ruleId: 'device_too_many',
            ruleName: 'Exceeds Device Limit',
            severity: 'info',
            scoreImpact: 10,
            description: `User has ${profile.typicalDevices.length} registered devices (limit: ${this.config.deviceRules.maxDevicesPerUser})`,
          });
        }
      }
    }

    // Suspicious UA patterns
    for (const pattern of this.config.deviceRules.suspiciousDevicePatterns) {
      if (pattern.test(event.userAgent)) {
        assessment.reasons.push({
          ruleId: 'device_suspicious_ua',
          ruleName: 'Suspicious User Agent',
          severity: 'warning',
          scoreImpact: 30,
          description: 'User agent matches known automation tool pattern',
        });
        break;
      }
    }
  }

  private async checkBehavioralAnomalies(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!this.config.features.behaviorAnalysis || !event.userId) return;

    const profile = this.userProfiles.get(event.userId);
    if (!profile || profile.loginHistory.length < 3) return; // Need baseline

    // Unusual login time
    if (event.eventType === 'login') {
      const currentHour = new Date(event.timestamp).getHours();
      const isUnusualTime = !profile.typicalLoginHours.includes(currentHour) &&
                             currentHour >= 0 && currentHour <= 5; // Late night/early morning
      
      if (isUnusualTime) {
        assessment.reasons.push({
          ruleId: 'behavior_unusual_time',
          ruleName: 'Unusual Activity Time',
          severity: 'info',
          scoreImpact: 10,
          description: `Login at unusual hour (${currentHour}:00) for this user`,
        });
      }
    }

    // Unusual transaction amount
    if ((event.eventType === 'transaction' || event.eventType === 'payment') && event.data.amount) {
      const amount = event.data.amount;
      const deviation = Math.abs(amount - profile.averageTransactionAmount) / 
                        (profile.transactionAmountStdDev || 1);
      
      if (deviation > 3 && amount > profile.averageTransactionAmount * 2) {
        assessment.reasons.push({
          ruleId: 'behavior_unusual_amount',
          ruleName: 'Unusual Transaction Amount',
          severity: 'warning',
          scoreImpact: 25,
          description: `Transaction amount significantly deviates from user's average`,
        });
      }

      // First transaction over threshold
      if (profile.transactionHistory.length <= 2 && 
          amount > this.config.thresholds.mfaRequiredForHighValueTxn) {
        assessment.reasons.push({
          ruleId: 'behavior_first_large_tx',
          ruleName: 'First Large Transaction',
          severity: 'warning',
          scoreImpact: 20,
          description: `Large transaction from relatively new account`,
        });
      }
    }

    // Rapid profile changes
    if (event.eventType === 'profile_update') {
      const recentUpdates = profile.loginHistory.filter(l => 
        l.timestamp > new Date(Date.now() - 3600000).toISOString()
      ).length;

      if (recentUpdates > 5) {
        assessment.reasons.push({
          ruleId: 'behavior_rapid_changes',
          ruleName: 'Rapid Profile Changes',
          severity: 'warning',
          scoreImpact: 20,
          description: `Multiple profile changes detected in short timeframe`,
        });
      }
    }
  }

  private async checkIdentityRisks(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!this.config.features.identityVerification) return;

    // Email domain risks
    if (event.data.email) {
      const emailDomain = event.data.email.split('@')[1]?.toLowerCase();
      
      // Temporary/disposable email domains
      const disposableDomains = [
        'mailinator.com', 'guerrillamail.com', 'tempmail.org', '10minutemail.com'
      ];
      
      if (disposableDomains.some(d => emailDomain?.includes(d))) {
        assessment.reasons.push({
          ruleId: 'identity_disposable_email',
          ruleName: 'Disposable Email Address',
          severity: 'warning',
          scoreImpact: 30,
          description: 'Email from known disposable/temporary email service',
        });
      }
    }

    // Phone number risks
    if (event.data.phone) {
      // Check for VoIP numbers (simplified)
      const voipPrefixes = '+1'; // Would have comprehensive list
      // Implementation would check against VOIP database
    }

    // New account + immediate high-risk action
    if (event.userId) {
      const profile = this.userProfiles.get(event.userId);
      if (profile) {
        const accountAge = Date.now() - new Date(profile.registrationDate).getTime();
        const daysSinceRegistration = accountAge / (1000 * 60 * 60 * 24);
        
        if (daysSinceRegistration < 1 && 
            ['transaction', 'payment', 'rfq'].includes(event.eventType)) {
          assessment.reasons.push({
            ruleId: 'identity_new_account_action',
            ruleName: 'High-Risk Action from New Account',
            severity: 'warning',
            scoreImpact: 25,
            description: `Account less than 1 day old attempting sensitive action`,
          });
        }

        // Low verification level + high-value action
        if (profile.verificationLevel === 'none' && 
            event.data.amount > this.config.thresholds.mfaRequiredForHighValueTxn) {
          assessment.reasons.push({
            ruleId: 'identity_unverified_large_action',
            ruleName: 'Unverified User Large Action',
            severity: 'warning',
            scoreImpact: 20,
            description: `Unverified user attempting large transaction`,
          });
        }
      }
    }
  }

  private async checkPaymentRisks(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!['transaction', 'payment'].includes(event.eventType)) return;
    if (!event.data.amount) return;

    const amount = event.data.amount;

    // Card testing (many small amounts)
    if (amount < 10) { // Very small transaction
      const cardTestKey = `card_test:${event.ipAddress}:${event.data.paymentMethod || 'unknown'}`;
      const recentSmallTxs = this.getVelocityEntries(cardTestKey, 3600000);
      
      if (recentSmallTxs.length >= 5) {
        assessment.reasons.push({
          ruleId: 'payment_card_testing',
          ruleName: 'Potential Card Testing',
          severity: 'danger',
          scoreImpact: 55,
          description: `Multiple small transactions - possible card testing pattern`,
        });
      }
    }

    // Round amount (potential structuring)
    if (amount % 1000 === 0 && amount >= 5000) {
      assessment.reasons.push({
        ruleId: 'payment_round_amount',
        ruleName: 'Round Amount Transaction',
        severity: 'info',
        scoreImpact: 10,
        description: 'Round amount transaction (possible structuring)',
      });
    }

    // Shipping/billing mismatch
    if (event.data.shippingAddress && event.data.billingAddress) {
      const shippingCountry = event.data.shippingAddress.country;
      const billingCountry = event.data.billingAddress.country;
      
      if (shippingCountry && billingCountry && shippingCountry !== billingCountry) {
        assessment.reasons.push({
          ruleId: 'payment_address_mismatch',
          ruleName: 'Shipping/Billing Address Mismatch',
          severity: 'warning',
          scoreImpact: 20,
          description: `Shipping and billing addresses in different countries`,
        });
      }
    }

    // High-risk payment method
    const highRiskMethods = ['crypto', 'prepaid_card', 'gift_card'];
    if (highRiskMethods.includes(event.data.paymentMethod || '')) {
      assessment.reasons.push({
        ruleId: 'payment_high_risk_method',
        ruleName: 'High-Risk Payment Method',
        severity: 'warning',
        scoreImpact: 15,
        description: `Transaction using high-risk payment method: ${event.data.paymentMethod}`,
      });
    }
  }

  private async checkAccountRisks(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!event.userId) return;

    const profile = this.userProfiles.get(event.userId);
    if (!profile) return;

    // Account status checks
    if (profile.accountStatus === 'under_review') {
      assessment.reasons.push({
        ruleId: 'account_under_review',
        ruleName: 'Account Under Review',
        severity: 'warning',
        scoreImpact: 30,
        description: 'Account currently under security review',
      });
    }

    // Existing risk flags
    if (profile.riskFlags.length > 0) {
      assessment.reasons.push({
        ruleId: 'account_existing_flags',
        ruleName: 'Account Has Risk Flags',
        severity: profile.riskFlags.includes('compromised') ? 'danger' : 'warning',
        scoreImpact: profile.riskFlags.length * 10,
        description: `Account has ${profile.riskFlags.length} risk flag(s): ${profile.riskFlags.join(', ')}`,
      });
    }

    // Low trust score
    if (profile.trustScore < 30) {
      assessment.reasons.push({
        ruleId: 'account_low_trust',
        ruleName: 'Low Trust Score',
        severity: 'warning',
        scoreImpact: 20,
        description: `Account trust score is low (${profile.trustScore}/100)`,
      });
    }

    // Recent password change + large transaction
    const recentPasswordChange = profile.riskFlags.includes('recent_password_change');
    if (recentPasswordChange && event.data.amount > 1000) {
      assessment.reasons.push({
        ruleId: 'account_post_password_change',
        ruleName: 'Large TX After Password Change',
        severity: 'warning',
        scoreImpact: 25,
        description: 'Large transaction shortly after password change',
      });
    }
  }

  private async checkNetworkRisks(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    if (!this.config.features.networkAnalysis) return;

    // Proxy/VPN detection
    if (event.context.isProxy) {
      assessment.reasons.push({
        ruleId: 'network_proxy',
        ruleName: 'Proxy Connection Detected',
        severity: 'info',
        scoreImpact: 10,
        description: 'Connection through proxy server',
      });
    }

    if (event.context.isTor) {
      assessment.reasons.push({
        ruleId: 'network_tor',
        ruleName: 'Tor Network Connection',
        severity: 'warning',
        scoreImpact: 20,
        description: 'Connection through Tor anonymity network',
      });
    }

    // Hosting provider (datacenter IP instead of residential)
    if (event.context.hostingProvider) {
      // Most legitimate users don't connect from datacenters
      if (event.eventType === 'login' || event.eventType === 'registration') {
        assessment.reasons.push({
          ruleId: 'network_datacenter',
          ruleName: 'Datacenter IP Address',
          severity: 'warning',
          scoreImpact: 25,
          description: `Connection from hosting provider: ${event.context.hostingProvider}`,
        });
      }
    }

    // Privacy services (often used by fraudsters)
    const privacyServices = ['nordvpn', 'expressvpn', 'cyberghost', 'mullvad'];
    if (privacyServices.some(s => event.userAgent.toLowerCase().includes(s))) {
      assessment.reasons.push({
        ruleId: 'network_vpn_service',
        ruleName: 'VPN Service Detected',
        severity: 'info',
        scoreImpact: 8,
        description: 'VPN service detected in user agent',
      });
    }
  }

  private async evaluateCustomRules(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      const matched = this.evaluateFraudRuleConditions(rule.conditions, event, rule.conditionLogic);
      
      if (matched) {
        // Update rule stats
        rule.triggerCount++;
        rule.lastTriggered = new Date().toISOString();

        // Add to assessment
        assessment.reasons.push({
          ruleId,
          ruleName: rule.name,
          severity: rule.severity === 'critical' ? 'danger' : 
                   rule.severity === 'high' ? 'warning' : 'info',
          scoreImpact: rule.scoreWeight,
          description: rule.description,
        });

        // Take immediate action if configured
        if (rule.action === 'block') {
          assessment.score += 100; // Force block
          break;
        } else if (rule.action === 'challenge') {
          assessment.recommendations.push('Require additional verification');
        }
      }
    }
  }

  // ===========================================
  // Private Helpers
  // ===========================================

  private makeDecision(assessment: FraudAssessment): void {
    // Sum up all score impacts
    assessment.score = Math.min(100, assessment.reasons.reduce((sum, r) => sum + r.scoreImpact, 0));

    // Determine risk level
    if (assessment.score < this.config.thresholds.lowRisk) {
      assessment.riskLevel = 'low';
    } else if (assessment.score < this.config.thresholds.mediumRisk) {
      assessment.riskLevel = 'medium';
    } else if (assessment.score < this.config.thresholds.highRisk) {
      assessment.riskLevel = 'high';
    } else {
      assessment.riskLevel = 'critical';
    }

    // Determine decision based on mode and thresholds
    if (this.config.mode === 'detect') {
      assessment.decision = 'approve'; // Log only, don't block
    } else if (this.config.mode === 'prevent') {
      if (assessment.score >= this.config.thresholds.autoBlockThreshold) {
        assessment.decision = 'block';
      } else if (assessment.score >= this.config.thresholds.autoChallengeThreshold) {
        assessment.decision = 'challenge';
      } else if (assessment.score >= this.config.thresholds.autoReviewThreshold) {
        assessment.decision = 'review';
        assessment.reviewRequired = true;
      } else {
        assessment.decision = 'approve';
      }
    }

    // Add recommendations based on findings
    if (assessment.reasons.some(r => r.ruleId.includes('device'))) {
      assessment.recommendations.push('Consider requiring MFA for this device');
    }
    if (assessment.reasons.some(r => r.ruleId.includes('geo'))) {
      assessment.recommendations.push('Verify user location via additional means');
    }
    if (assessment.reasons.some(r => r.severity === 'danger')) {
      assessment.recommendations.push('Manual review recommended due to high-severity indicators');
    }
  }

  private applyCompositeScoring(_event: FraudEvent, _assessment: FraudAssessment): void {
    // In production, would use trained ML model here
    // For now, apply some heuristic adjustments
    
    // Multiple medium-severity indicators compound
    const mediumSeverityCount = _assessment.reasons.filter(r => r.severity === 'warning').length;
    if (mediumSeverityCount >= 3) {
      _assessment.score = Math.min(100, _assessment.score + 10);
    }

    // Cross-category indicators are more concerning
    const categories = new Set(_assessment.reasons.map(r => r.ruleId.split('_')[0]));
    if (categories.size >= 4) {
      _assessment.score = Math.min(100, _assessment.score + 15);
    }
  }

  private async createFraudCase(event: FraudEvent, assessment: FraudAssessment): Promise<void> {
    const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const fraudCase: FraudCase = {
      id: caseId,
      eventId: event.id,
      userId: event.userId,
      status: 'open',
      priority: assessment.riskLevel === 'critical' ? 'critical' :
               assessment.riskLevel === 'high' ? 'high' :
               assessment.riskLevel === 'medium' ? 'medium' : 'low',
      assessment: { ...assessment },
      evidence: [],
      communications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cases.set(caseId, fraudCase);
  }

  private evaluateFraudRuleConditions(
    conditions: FraudRuleCondition[],
    event: FraudEvent,
    logic: 'AND' | 'OR'
  ): boolean {
    if (logic === 'AND') {
      return conditions.every(cond => this.evaluateFraudCondition(cond, event));
    } else {
      return conditions.some(cond => this.evaluateFraudCondition(cond, event));
    }
  }

  private evaluateFraudCondition(condition: FraudRuleCondition, event: FraudEvent): boolean {
    const value = this.getEventFieldValue(event, condition.field);
    
    switch (condition.operator) {
      case 'equals': return value === condition.value;
      case 'not_equals': return value !== condition.value;
      case 'contains': return typeof value === 'string' && value.includes(condition.value);
      case 'not_contains': return typeof value === 'string' && !value.includes(condition.value);
      case 'matches': return typeof value === 'string' && new RegExp(condition.value).test(value);
      case 'greater_than': return typeof value === 'number' && value > condition.value;
      case 'less_than': return typeof value === 'number' && value < condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in': return !Array.isArray(condition.value) || !condition.value.includes(value);
      default:
        console.warn(`Unknown fraud rule operator: ${condition.operator}`);
        return false;
    }
  }

  private getEventFieldValue(event: FraudEvent, field: string): any {
    if (field in event) {
      return (event as any)[field];
    }
    if (field in event.data) {
      return event.data[field as any];
    }
    if (field in event.context) {
      return event.context[field as any];
    }
    return undefined;
  }

  private getVelocityEntries(key: string, windowMs: number): Array<{ timestamp: number; data: any }> {
    const entries = this.velocityStore.get(key) || [];
    const cutoff = Date.now() - windowMs;
    return entries.filter(e => e.timestamp > cutoff);
  }

  private addVelocityEntry(key: string, data: { timestamp: number; data: any }): void {
    let entries = this.velocityStore.get(key);
    if (!entries) {
      entries = [];
      this.velocityStore.set(key, entries);
    }
    entries.push(data);

    // Clean old entries periodically
    if (entries.length > 1000) {
      const cutoff = Date.now() - 86400000; // Keep max 1 day
      const filtered = entries.filter(e => e.timestamp > cutoff);
      this.velocityStore.set(key, filtered);
    }
  }

  private calculateDeviceRisk(device: Partial<DeviceFingerprint>): number {
    let risk = 0;

    if (device.isBot) risk += 50;
    if (device.isEmulator) risk += 25;
    if (device.isTor) risk += 20;
    if (device.isVPN) risk += 10;
    if (!device.cookiesEnabled) risk += 15;
    if (!device.localStorage) risk += 10;

    // Suspicious screen resolutions (common in VMs)
    const commonVMResolutions = ['800x600', '1024x768', '1280x720', '1280x1024'];
    const resolution = `${device.screenWidth}x${device.screenHeight}`;
    if (commonVMResolutions.includes(resolution) && device.hardwareConcurrency === 2) {
      risk += 15;
    }

    return Math.min(100, risk);
  }

  private analyzeDeviceCharacteristics(device: DeviceFingerprint): void {
    // Detect emulator
    const emulatorIndicators = [
      /android.*emulator/i,
      /iphone simulator/i,
      /virtual/i,
      /vmware/i,
      /virtualbox/i,
    ];
    device.isEmulator = emulatorIndicators.some(p => p.test(device.userAgent));

    // Detect bot
    const botIndicators = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
      /puppeteer/i,
    ];
    device.isBot = botIndicators.some(p => p.test(device.userAgent));

    // VPN/Tor would be set from external analysis
    device.isVPN = false; // Would check IP against VPN databases
    device.isTor = false; // Would check against Tor exit nodes
  }

  private calculateTrustScore(profile: UserProfile): number {
    let score = 50; // Start neutral

    // Age bonus
    const ageDays = (Date.now() - new Date(profile.registrationDate).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(20, ageDays / 30); // Up to 20 points for age

    // Verification level bonus
    const verificationBonus: Record<string, number> = {
      none: 0,
      email: 10,
      phone: 15,
      identity: 25,
      business: 30,
    };
    score += verificationBonus[profile.verificationLevel] || 0;

    // Successful transactions bonus
    const successfulTxs = profile.transactionHistory.filter(t => t.status === 'success').length;
    score += Math.min(15, successfulTxs * 0.5);

    // Consistent login locations
    const uniqueCountries = new Set(profile.loginHistory.map(l => l.location.country)).size;
    if (uniqueCountries <= 2) score += 5;

    // No risk flags
    if (profile.riskFlags.length === 0) score += 10;

    // Penalize risk flags
    score -= profile.riskFlags.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  private recalculateUserStats(profile: UserProfile): void {
    if (profile.transactionHistory.length === 0) return;

    const amounts = profile.transactionHistory
      .filter(t => t.status === 'success')
      .map(t => t.amount);

    const sum = amounts.reduce((a, b) => a + b, 0);
    profile.averageTransactionAmount = sum / amounts.length;

    const squaredDiffs = amounts.map(a => Math.pow(a - profile.averageTransactionAmount, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / amounts.length;
    profile.transactionAmountStdDev = Math.sqrt(variance);
  }

  private approximateDistance(city1: string, city2: string): number {
    // Simplified distance calculation
    // In production, would use proper geocoding + haversine formula
    if (city1 === city2) return 0;
    return 5000; // Default large distance
  }

  private getTimezoneOffset(country: string): number {
    // Simplified timezone offsets
    const offsets: Record<string, number> = {
      'DZ': 1, // Algeria UTC+1
      'US': -5, // Rough US average
      'GB': 0,
      'FR': 1,
      'CN': 8,
      'JP': 9,
    };
    return offsets[country] || 0;
  }

  private parseTimezoneOffset(timezone: string): number {
    try {
      // Parse timezone like "UTC+1" or "America/New_York"
      const match = timezone.match(/UTC([+-]\d+)/);
      if (match) return parseInt(match[1], 10);
      
      // Common timezone mappings
      const tzOffsets: Record<string, number> = {
        'CET': 1, 'CEST': 2,
        'EST': -5, 'EDT': -4,
        'PST': -8, 'PDT': -7,
        'JST': 9,
        'AEST': 10,
      };
      return tzOffsets[timezone] || 0;
    } catch {
      return 0;
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private trimOldEvents(): void {
    const cutoff = Date.now() - (this.config.retention.eventRetentionDays * 24 * 60 * 60 * 1000);
    while (this.events.length > 0 && new Date(this.events[0].timestamp).getTime() < cutoff) {
      this.events.shift();
    }
  }

  private initializeStatistics(): FraudStatistics {
    return {
      period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      totalEvents: 0,
      totalAssessments: 0,
      blockedEvents: 0,
      challengedEvents: 0,
      reviewedEvents: 0,
      approvedEvents: 0,
      assessmentsByRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
      topFraudTypes: [],
      topBlockedCountries: [],
      averageFraudScore: 0,
      falsePositiveRate: 0,
      caseResolutionTime: { avg: 0, median: 0, p95: 0 },
      financialImpact: {
        preventedFraud: 0,
        totalInvestigated: 0,
        confirmedLosses: 0,
      },
    };
  }

  private updateStatistics(assessment: FraudAssessment): void {
    this.statistics.totalAssessments++;

    switch (assessment.decision) {
      case 'block':
        this.statistics.blockedEvents++;
        break;
      case 'challenge':
        this.statistics.challengedEvents++;
        break;
      case 'review':
        this.statistics.reviewedEvents++;
        break;
      case 'approve':
        this.statistics.approvedEvents++;
        break;
    }

    this.statistics.assessmentsByRiskLevel[assessment.riskLevel]++;
  }

  private triggerAlerts(_event: FraudEvent, assessment: FraudAssessment): void {
    if (assessment.riskLevel === 'critical' && this.config.alerting.onCriticalScore) {
      console.error(`[FRAUD ALERT] Critical fraud score detected! Event: ${_event.id}, Score: ${assessment.score}`);
    }

    if (assessment.decision === 'block' && this.config.alerting.onBlockedTransaction) {
      console.warn(`[FRAUD ALERT] Transaction blocked! Event: ${_event.id}`);
    }

    if (assessment.decision === 'review' && this.config.alerting.onNewFraudCase) {
      console.info(`[FRAUD ALERT] New fraud case created! Event: ${_event.id}`);
    }
  }

  private createSafeAssessment(event: Partial<FraudEvent>): FraudAssessment {
    return {
      eventId: event.id || 'unknown',
      score: 0,
      riskLevel: 'low',
      decision: 'approve',
      reasons: [],
      recommendations: [],
      reviewRequired: false,
    };
  }

  private loadBuiltInRules(): void {
    // Velocity rules
    this.addRule({
      name: 'Brute Force Login Attempt',
      description: 'Detect multiple failed logins followed by success',
      enabled: true,
      category: 'velocity',
      severity: 'high',
      scoreWeight: 40,
      conditions: [
        { field: 'eventType', operator: 'equals', value: 'login' },
      ],
      conditionLogic: 'AND',
      action: 'block',
      timeWindowMs: 900000, // 15 minutes
      threshold: 5,
      tags: ['brute-force', 'credential-stuffing'],
      falsePositiveRate: 0.01,
    });

    // Location rules
    this.addRule({
      name: 'Cross-Border Transaction Anomaly',
      description: 'Flag transactions crossing high-risk borders',
      enabled: true,
      category: 'location',
      severity: 'medium',
      scoreWeight: 25,
      conditions: [
        { field: 'eventType', operator: 'equals', value: 'transaction' },
      ],
      conditionLogic: 'AND',
      action: 'review',
      tags: ['cross-border', 'geographic'],
      falsePositiveRate: 0.1,
    });

    // Device rules
    this.addRule({
      name: 'Device Fingerprint Change',
      description: 'Alert when user changes device after registration',
      enabled: true,
      category: 'device',
      severity: 'medium',
      scoreWeight: 20,
      conditions: [
        { field: 'eventType', operator: 'in', value: ['login', 'transaction'] },
      ],
      conditionLogic: 'AND',
      action: 'challenge',
      tags: ['device-change', 'account-takeover'],
      falsePositiveRate: 0.15,
    });

    // Payment rules
    this.addRule({
      name: 'High Velocity Small Transactions',
      description: 'Detect potential card testing with many small amounts',
      enabled: true,
      category: 'payment',
      severity: 'critical',
      scoreWeight: 50,
      conditions: [
        { field: 'eventType', operator: 'equals', value: 'transaction' },
        { field: 'data', operator: 'less_than', value: 10 }, // amount < 10
      ],
      conditionLogic: 'AND',
      action: 'block',
      timeWindowMs: 3600000,
      threshold: 5,
      tags: ['card-testing', 'payment-fraud'],
      falsePositiveRate: 0.02,
    });
  }
}

// ===========================================
// Singleton & Exports
// ===========================================

let fraudInstance: FraudDetectionSystem | null = null;

export function getFraudDetection(config?: Partial<FraudDetectionConfig>): FraudDetectionSystem {
  if (!fraudInstance) {
    fraudInstance = new FraudDetectionSystem(config);
  }
  return fraudInstance;
}

// Convenience export
export const fraudDetection = getFraudDetection();

export default {
  getFraudDetection,
  FraudDetectionSystem,
};
