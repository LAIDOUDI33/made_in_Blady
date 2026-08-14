/**
 * Fraud Detection Service
 * Detects suspicious patterns and potential security threats
 * For AlgeriaTrade.dz B2B Platform
 */

import { db } from '@/lib/db';

// Types for fraud detection
export interface FraudCheckResult {
  riskScore: number;        // 0-100, higher = more risky
  isBlocked: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
}

interface FailedAttemptRecord {
  count: number;
  firstAttempt: number;     // Unix timestamp
  lastAttempt: number;      // Unix timestamp
}

interface AccountCreationRecord {
  count: number;
  firstCreation: number;
  lastCreation: number;
}

// In-memory stores for tracking (in production, use Redis)
const failedLoginAttempts = new Map<string, FailedAttemptRecord>();
const accountCreations = new Map<string, AccountCreationRecord>();
const suspiciousIPs = new Set<string>();

// Configuration thresholds
const THRESHOLDS = {
  // Login attempt thresholds
  maxFailedLoginsPerWindow: 5,
  loginWindowMs: 15 * 60_1000,      // 15 minutes
  criticalFailedLogins: 10,
  
  // Account creation thresholds
  maxAccountsPerIPPerHour: 3,
  accountCreationWindowMs: 60 * 60_1000, // 1 hour
  
  // Risk score thresholds
  lowRiskThreshold: 25,
  mediumRiskThreshold: 50,
  highRiskThreshold: 75,
  criticalRiskThreshold: 90,
  
  // Auto-block thresholds
  autoBlockThreshold: 85,
  blockDurationMs: 60 * 60_1000,    // 1 hour
  
  // Cleanup interval
  cleanupIntervalMs: 5 * 60_1000,   // 5 minutes
};

// Blocked IPs with expiry
const blockedIPs = new Map<string, number>(); // IP -> expiry timestamp

/**
 * Clean up expired records
 */
function cleanup(): void {
  const now = Date.now();
  
  // Clean up failed login attempts
  for (const [ip, record] of failedLoginAttempts.entries()) {
    if (now - record.lastAttempt > THRESHOLDS.loginWindowMs) {
      failedLoginAttempts.delete(ip);
    }
  }
  
  // Clean up account creation records
  for (const [ip, record] of accountCreations.entries()) {
    if (now - record.lastCreation > THRESHOLDS.accountCreationWindowMs) {
      accountCreations.delete(ip);
    }
  }
  
  // Clean up blocked IPs
  for (const [ip, expiry] of blockedIPs.entries()) {
    if (now > expiry) {
      blockedIPs.delete(ip);
      suspiciousIPs.delete(ip);
    }
  }
}

// Start cleanup interval
if (typeof globalThis !== 'undefined') {
  setInterval(cleanup, THRESHOLDS.cleanupIntervalMs);
}

/**
 * Check login attempts from an IP address
 */
export function checkLoginAttempts(ipAddress: string): FraudCheckResult {
  const now = Date.now();
  
  // Check if IP is blocked
  const blockExpiry = blockedIPs.get(ipAddress);
  if (blockExpiry && now < blockExpiry) {
    return {
      riskScore: 100,
      isBlocked: true,
      reason: `Cette adresse IP est bloquée jusqu'à ${new Date(blockExpiry).toLocaleString('fr-FR')}`,
      severity: 'critical',
      details: { blockExpiry: new Date(blockExpiry).toISOString() },
    };
  }
  
  // Get or create record
  let record = failedLoginAttempts.get(ipAddress);
  
  if (!record || now - record.firstAttempt > THRESHOLDS.loginWindowMs) {
    // Reset window
    record = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    failedLoginAttempts.set(ipAddress, record);
    
    return {
      riskScore: 0,
      isBlocked: false,
      severity: 'low',
    };
  }
  
  // Calculate risk score based on failed attempts
  const attemptsInWindow = record.count;
  let riskScore = Math.min(100, (attemptsInWindow / THRESHOLDS.criticalFailedLogins) * 100);
  
  // Increase score for rapid successive attempts
  const timeSinceLastAttempt = now - record.lastAttempt;
  if (timeSinceLastAttempt < 5000) { // Less than 5 seconds between attempts
    riskScore += 10;
  } else if (timeSinceLastAttempt < 15000) { // Less than 15 seconds
    riskScore += 5;
  }
  
  // Determine severity
  let severity: FraudCheckResult['severity'] = 'low';
  if (riskScore >= THRESHOLDS.criticalRiskThreshold) severity = 'critical';
  else if (riskScore >= THRESHOLDS.highRiskThreshold) severity = 'high';
  else if (riskScore >= THRESHOLDS.mediumRiskThreshold) severity = 'medium';
  
  // Determine if should be blocked
  const isBlocked = riskScore >= THRESHOLDS.autoBlockThreshold;
  
  if (isBlocked) {
    blockedIPs.set(ipAddress, now + THRESHOLDS.blockDurationMs);
    suspiciousIPs.add(ipAddress);
    
    // Log security event
    logSecurityEvent('brute_force', ipAddress, {
      attempts: attemptsInWindow,
      windowStart: new Date(record.firstAttempt).toISOString(),
    });
  }
  
  return {
    riskScore: Math.round(riskScore),
    isBlocked,
    reason: isBlocked 
      ? `Trop de tentatives de connexion échouées (${attemptsInWindow} en 15 minutes)`
      : undefined,
    severity,
    details: {
      failedAttempts: attemptsInWindow,
      windowRemaining: Math.max(0, THRESHOLDS.loginWindowMs - (now - record.firstAttempt)),
    },
  };
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(ipAddress: string): void {
  const now = Date.now();
  const record = failedLoginAttempts.get(ipAddress);
  
  if (!record || now - record.firstAttempt > THRESHOLDS.loginWindowMs) {
    failedLoginAttempts.set(ipAddress, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
  } else {
    record.count++;
    record.lastAttempt = now;
  }
}

/**
 * Clear failed login attempts after successful login
 */
export function clearFailedLogins(ipAddress: string): void {
  failedLoginAttempts.delete(ipAddress);
}

/**
 * Check account creation rate from an IP
 */
export function checkAccountCreation(ipAddress: string): FraudCheckResult {
  const now = Date.now();
  
  // Check if IP is already blocked/suspicious
  if (suspiciousIPs.has(ipAddress)) {
    return {
      riskScore: 70,
      isBlocked: false,
      reason: 'Cette adresse IP a été marquée comme suspecte',
      severity: 'high',
    };
  }
  
  const record = accountCreations.get(ipAddress);
  
  if (!record || now - record.firstCreation > THRESHOLDS.accountCreationWindowMs) {
    return {
      riskScore: 0,
      isBlocked: false,
      severity: 'low',
    };
  }
  
  const accountsCreated = record.count;
  const riskScore = Math.min(100, (accountsCreated / THRESHOLDS.maxAccountsPerIPPerHour) * 80);
  
  let severity: FraudCheckResult['severity'] = 'low';
  if (riskScore >= THRESHOLDS.highRiskThreshold) severity = 'high';
  else if (riskScore >= THRESHOLDS.mediumRiskThreshold) severity = 'medium';
  
  const isBlocked = accountsCreated >= THRESHOLDS.maxAccountsPerIPPerHour;
  
  // Prepare reason message
  let blockReason: string | undefined;
  if (isBlocked) {
    blockReason = 'Limite de creation de comptes atteinte pour cette adresse IP';
    logSecurityEvent('rapid_account_creation', ipAddress, {
      accountsCreated,
      windowStart: new Date(record.firstCreation).toISOString(),
    });
  }
  
  // Calculate window remaining
  const windowRemaining = Math.max(0, THRESHOLDS.accountCreationWindowMs - (now - record.firstCreation));
  
  return {
    riskScore: Math.round(riskScore),
    isBlocked,
    reason: blockReason,
    severity,
    details: {
      accountsCreated,
      limit: THRESHOLDS.maxAccountsPerIPPerHour,
      windowRemaining,
    },
  };
}

/**
 * Record an account creation
 */
export function recordAccountCreation(ipAddress: string): void {
  const now = Date.now();
  const record = accountCreations.get(ipAddress);
  
  if (!record || now - record.firstCreation > THRESHOLDS.accountCreationWindowMs) {
    accountCreations.set(ipAddress, {
      count: 1,
      firstCreation: now,
      lastCreation: now,
    });
  } else {
    record.count++;
    record.lastCreation = now;
  }
}

/**
 * Flag suspicious activity for a user
 */
export async function flagSuspiciousActivity(
  userId: string,
  activity: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await db.securityEvent.create({
    data: {
      eventType: 'suspicious_activity',
      ipAddress,
      userId,
      details: JSON.stringify(details || {}),
      severity: 'medium',
    },
  });
  
  // Also add to audit log
  const { auditLogger } = await import('./auditLog');
  await auditLogger.logSecurity('2fa_verify' as any, userId, {
    success: false,
    errorMessage: `Activité suspecte détectée: ${activity}`,
    ipAddress,
    metadata: details,
  });
}

/**
 * Calculate overall risk score for a request
 */
export async function getRiskScore(
  ipAddress: string,
  userId?: string,
  requestContext?: {
    userAgent?: string;
    path?: string;
    method?: string;
  }
): Promise<FraudCheckResult> {
  const checks: FraudCheckResult[] = [];
  
  // Check login attempts
  checks.push(checkLoginAttempts(ipAddress));
  
  // Additional context-based checks
  if (requestContext?.userAgent) {
    // Check for known bot user agents
    const botPatterns = /bot|crawler|spider|scraper|curl|wget|python/i;
    if (botPatterns.test(requestContext.userAgent)) {
      checks.push({
        riskScore: 30,
        isBlocked: false,
        severity: 'medium',
        details: { reason: 'bot_user_agent' },
      });
    }
  }
  
  // Check if user has recent security events
  if (userId) {
    const recentSecurityEvents = await db.securityEvent.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60_1000) }, // Last 24 hours
        resolved: false,
      },
    });
    
    if (recentSecurityEvents > 0) {
      checks.push({
        riskScore: Math.min(50, recentSecurityEvents * 15),
        isBlocked: false,
        severity: recentSecurityEvents > 2 ? 'high' : 'medium',
        details: { recentSecurityEvents },
      });
    }
  }
  
  // Aggregate results
  const maxRiskScore = Math.max(...checks.map(c => c.riskScore));
  const isBlocked = checks.some(c => c.isBlocked);
  const highestSeverity = checks.reduce(
    (max, curr) => {
      const order = { low: 1, medium: 2, high: 3, critical: 4 };
      return order[curr.severity] > order[max] ? curr.severity : max;
    },
    'low' as FraudCheckResult['severity']
  );
  
  return {
    riskScore: maxRiskScore,
    isBlocked,
    severity: highestSeverity,
    details: { checksPerformed: checks.length },
  };
}

/**
 * Log a security event to database
 */
async function logSecurityEvent(
  eventType: string,
  ipAddress: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    await db.securityEvent.create({
      data: {
        eventType,
        ipAddress,
        details: JSON.stringify(details),
        severity: 'high',
      },
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Get list of currently blocked IPs
 */
export function getBlockedIPs(): Array<{ ip: string; expiresAt: Date }> {
  const result: Array<{ ip: string; expiresAt: Date }> = [];
  
  for (const [ip, expiry] of blockedIPs.entries()) {
    result.push({ ip, expiresAt: new Date(expiry) });
  }
  
  return result.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
}

/**
 * Manually block an IP address (admin use)
 */
export function blockIP(
  ipAddress: string,
  durationMs: number = THRESHOLDS.blockDurationMs
): void {
  blockedIPs.set(ipAddress, Date.now() + durationMs);
  suspiciousIPs.add(ipAddress);
}

/**
 * Manually unblock an IP address (admin use)
 */
export function unblockIP(ipAddress: string): boolean {
  return blockedIPs.delete(ipAddress);
}

/**
 * Get statistics about fraud detection
 */
export function getFraudStats(): {
  trackedIPs: number;
  blockedIPsCount: number;
  suspiciousIPsCount: number;
  totalFailedAttempts: number;
} {
  let totalFailedAttempts = 0;
  
  for (const record of failedLoginAttempts.values()) {
    totalFailedAttempts += record.count;
  }
  
  return {
    trackedIPs: failedLoginAttempts.size + accountCreations.size,
    blockedIPsCount: blockedIPs.size,
    suspiciousIPsCount: suspiciousIPs.size,
    totalFailedAttempts,
  };
}
