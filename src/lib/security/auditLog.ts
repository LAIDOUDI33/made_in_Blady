/**
 * Audit Logging Service
 * Comprehensive audit trail for security and compliance
 * For AlgeriaTrade.dz B2B Platform
 */

import { db } from '@/lib/db';

// Types for audit logging
export interface AuditLogParams {
  action: string;
  userId?: string;
  userRole?: string;
  resource?: string;
  resourceId?: string;
  oldValue?: object | null;
  newValue?: object | null;
  metadata?: object;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Search in action, resource, resourceId
  page?: number;
  limit?: number;
}

export interface AuditLogResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

// Action categories with French labels
export const ACTION_CATEGORIES = {
  // Authentication actions
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REGISTER: 'auth.register',
  AUTH_PASSWORD_CHANGE: 'auth.password_change',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_EMAIL_VERIFY: 'auth.email_verify',
  
  // Security actions
  SECURITY_2FA_ENABLE: 'security.2fa_enable',
  SECURITY_2FA_DISABLE: 'security.2fa_disable',
  SECURITY_2FA_VERIFY: 'security.2fa_verify',
  SECURITY_BACKUP_CODE_USE: 'security.backup_code_use',
  SECURITY_SESSION_REVOKE: 'security.session_revoke',
  SECURITY_SESSION_REVOKE_ALL: 'security.session_revoke_all',
  
  // Product actions
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_PUBLISH: 'product.publish',
  PRODUCT_UNPUBLISH: 'product.unpublish',
  
  // Order actions
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_CANCEL: 'order.cancel',
  ORDER_STATUS_CHANGE: 'order.status_change',
  
  // RFQ actions
  RFQ_CREATE: 'rfq.create',
  RFQ_UPDATE: 'rfq.update',
  RFQ_CLOSE: 'rfq.close',
  RFQ_AWARD: 'rfq.award',
  
  // Quotation actions
  QUOTATION_CREATE: 'quotation.create',
  QUOTATION_SEND: 'quotation.send',
  QUOTATION_ACCEPT: 'quotation.accept',
  QUOTATION_REJECT: 'quotation.reject',
  
  // Company/Supplier actions
  COMPANY_UPDATE: 'company.update',
  COMPANY_VERIFY: 'company.verify',
  COMPANY_SUSPEND: 'company.suspend',
  
  // User management (admin)
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',
  USER_SUSPEND: 'user.suspend',
  USER_UNSUSPEND: 'user.unsuspend',
  
  // Review actions
  REVIEW_CREATE: 'review.create',
  REVIEW_MODERATE: 'review.moderate',
  REVIEW_DELETE: 'review.delete',
  
  // Admin actions
  ADMIN_SETTINGS_CHANGE: 'admin.settings_change',
  ADMIN_EXPORT_DATA: 'admin.export_data',
} as const;

// Action labels in French
export const ACTION_LABELS: Record<string, string> = {
  [ACTION_CATEGORIES.AUTH_LOGIN]: 'Connexion',
  [ACTION_CATEGORIES.AUTH_LOGOUT]: 'Déconnexion',
  [ACTION_CATEGORIES.AUTH_REGISTER]: "Inscription",
  [ACTION_CATEGORIES.AUTH_PASSWORD_CHANGE]: 'Changement de mot de passe',
  [ACTION_CATEGORIES.AUTH_PASSWORD_RESET]: 'Réinitialisation du mot de passe',
  [ACTION_CATEGORIES.AUTH_EMAIL_VERIFY]: 'Vérification d\'email',
  [ACTION_CATEGORIES.SECURITY_2FA_ENABLE]: 'Activation de la 2FA',
  [ACTION_CATEGORIES.SECURITY_2FA_DISABLE]: 'Désactivation de la 2FA',
  [ACTION_CATEGORIES.SECURITY_2FA_VERIFY]: 'Vérification 2FA',
  [ACTION_CATEGORIES.SECURITY_BACKUP_CODE_USE]: 'Utilisation d\'un code de secours',
  [ACTION_CATEGORIES.SECURITY_SESSION_REVOKE]: 'Révocation de session',
  [ACTION_CATEGORIES.SECURITY_SESSION_REVOKE_ALL]: 'Révocation de toutes les sessions',
  [ACTION_CATEGORIES.PRODUCT_CREATE]: 'Création de produit',
  [ACTION_CATEGORIES.PRODUCT_UPDATE]: 'Modification de produit',
  [ACTION_CATEGORIES.PRODUCT_DELETE]: 'Suppression de produit',
  [ACTION_CATEGORIES.PRODUCT_PUBLISH]: 'Publication de produit',
  [ACTION_CATEGORIES.PRODUCT_UNPUBLISH]: 'Dépublication de produit',
  [ACTION_CATEGORIES.ORDER_CREATE]: 'Création de commande',
  [ACTION_CATEGORIES.ORDER_UPDATE]: 'Modification de commande',
  [ACTION_CATEGORIES.ORDER_CANCEL]: 'Annulation de commande',
  [ACTION_CATEGORIES.ORDER_STATUS_CHANGE]: 'Changement de statut de commande',
  [ACTION_CATEGORIES.RFQ_CREATE]: 'Création de demande de devis',
  [ACTION_CATEGORIES.RFQ_UPDATE]: 'Modification de demande de devis',
  [ACTION_CATEGORIES.RFQ_CLOSE]: 'Clôture de demande de devis',
  [ACTION_CATEGORIES.RFQ_AWARD]: 'Attribution de demande de devis',
  [ACTION_CATEGORIES.QUOTATION_CREATE]: 'Création de devis',
  [ACTION_CATEGORIES.QUOTATION_SEND]: 'Envoi de devis',
  [ACTION_CATEGORIES.QUOTATION_ACCEPT]: 'Acceptation de devis',
  [ACTION_CATEGORIES.QUOTATION_REJECT]: 'Rejet de devis',
  [ACTION_CATEGORIES.COMPANY_UPDATE]: 'Modification d\'entreprise',
  [ACTION_CATEGORIES.COMPANY_VERIFY]: 'Vérification d\'entreprise',
  [ACTION_CATEGORIES.COMPANY_SUSPEND]: 'Suspension d\'entreprise',
  [ACTION_CATEGORIES.USER_CREATE]: 'Création d\'utilisateur',
  [ACTION_CATEGORIES.USER_UPDATE]: 'Modification d\'utilisateur',
  [ACTION_CATEGORIES.USER_DELETE]: 'Suppression d\'utilisateur',
  [ACTION_CATEGORIES.USER_ROLE_CHANGE]: 'Changement de rôle',
  [ACTION_CATEGORIES.USER_SUSPEND]: 'Suspension d\'utilisateur',
  [ACTION_CATEGORIES.USER_UNSUSPEND]: 'Réactivation d\'utilisateur',
  [ACTION_CATEGORIES.REVIEW_CREATE]: 'Création d\'avis',
  [ACTION_CATEGORIES.REVIEW_MODERATION]: 'Modération d\'avis',
  [ACTION_CATEGORIES.REVIEW_DELETE]: 'Suppression d\'avis',
  [ACTION_CATEGORIES.ADMIN_SETTINGS_CHANGE]: 'Modification des paramètres',
  [ACTION_CATEGORIES.ADMIN_EXPORT_DATA]: 'Export de données',
};

/**
 * Main audit logger class
 */
class AuditLoggerClass {
  /**
   * Log any action to the audit log
   */
  async log(params: AuditLogParams): Promise<AuditLogEntry> {
    const entry = await db.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId || null,
        userRole: params.userRole || null,
        resource: params.resource || null,
        resourceId: params.resourceId || null,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        success: params.success !== undefined ? params.success : true,
        errorMessage: params.errorMessage || null,
      },
    });
    
    return this.formatEntry(entry);
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'login' | 'logout' | 'register' | 'password_change' | 'password_reset' | 'email_verify',
    userId: string,
    options?: {
      success?: boolean;
      errorMessage?: string;
      ipAddress?: string;
      userAgent?: string;
      userRole?: string;
    }
  ): Promise<AuditLogEntry> {
    const actionMap = {
      login: ACTION_CATEGORIES.AUTH_LOGIN,
      logout: ACTION_CATEGORIES.AUTH_LOGOUT,
      register: ACTION_CATEGORIES.AUTH_REGISTER,
      password_change: ACTION_CATEGORIES.AUTH_PASSWORD_CHANGE,
      password_reset: ACTION_CATEGORIES.AUTH_PASSWORD_RESET,
      email_verify: ACTION_CATEGORIES.AUTH_EMAIL_VERIFY,
    };

    return this.log({
      action: actionMap[action],
      userId,
      userRole: options?.userRole,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: options?.success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log product-related events
   */
  async logProduct(
    action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish',
    productId: string,
    userId: string,
    options?: {
      oldValue?: object;
      newValue?: object;
      success?: boolean;
      errorMessage?: string;
      ipAddress?: string;
      userRole?: string;
    }
  ): Promise<AuditLogEntry> {
    const actionMap = {
      create: ACTION_CATEGORIES.PRODUCT_CREATE,
      update: ACTION_CATEGORIES.PRODUCT_UPDATE,
      delete: ACTION_CATEGORIES.PRODUCT_DELETE,
      publish: ACTION_CATEGORIES.PRODUCT_PUBLISH,
      unpublish: ACTION_CATEGORIES.PRODUCT_UNPUBLISH,
    };

    return this.log({
      action: actionMap[action],
      userId,
      resource: 'product',
      resourceId: productId,
      oldValue: options?.oldValue,
      newValue: options?.newValue,
      ipAddress: options?.ipAddress,
      userRole: options?.userRole,
      success: options?.success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log order-related events
   */
  async logOrder(
    action: 'create' | 'update' | 'cancel' | 'status_change',
    orderId: string,
    userId: string,
    options?: {
      oldValue?: object;
      newValue?: object;
      success?: boolean;
      errorMessage?: string;
      ipAddress?: string;
      userRole?: string;
    }
  ): Promise<AuditLogEntry> {
    const actionMap = {
      create: ACTION_CATEGORIES.ORDER_CREATE,
      update: ACTION_CATEGORIES.ORDER_UPDATE,
      cancel: ACTION_CATEGORIES.ORDER_CANCEL,
      status_change: ACTION_CATEGORIES.ORDER_STATUS_CHANGE,
    };

    return this.log({
      action: actionMap[action],
      userId,
      resource: 'order',
      resourceId: orderId,
      oldValue: options?.oldValue,
      newValue: options?.newValue,
      ipAddress: options?.ipAddress,
      userRole: options?.userRole,
      success: options?.success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log RFQ-related events
   */
  async logRFQ(
    action: 'create' | 'update' | 'close' | 'award',
    rfqId: string,
    userId: string,
    options?: {
      oldValue?: object;
      newValue?: object;
      success?: boolean;
      errorMessage?: string;
      ipAddress?: string;
      userRole?: string;
    }
  ): Promise<AuditLogEntry> {
    const actionMap = {
      create: ACTION_CATEGORIES.RFQ_CREATE,
      update: ACTION_CATEGORIES.RFQ_UPDATE,
      close: ACTION_CATEGORIES.RFQ_CLOSE,
      award: ACTION_CATEGORIES.RFQ_AWARD,
    };

    return this.log({
      action: actionMap[action],
      userId,
      resource: 'rfq',
      resourceId: rfqId,
      oldValue: options?.oldValue,
      newValue: options?.newValue,
      ipAddress: options?.ipAddress,
      userRole: options?.userRole,
      success: options?.success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log admin actions
   */
  async logAdmin(
    action: string,
    adminId: string,
    targetUserId?: string,
    options?: {
      oldValue?: object;
      newValue?: object;
      success?: boolean;
      errorMessage?: string;
      ipAddress?: string;
      metadata?: object;
    }
  ): Promise<AuditLogEntry> {
    return this.log({
      action: `admin.${action}`,
      userId: adminId,
      userRole: 'ADMIN',
      resource: targetUserId ? 'user' : undefined,
      resourceId: targetUserId,
      oldValue: options?.oldValue,
      newValue: options?.newValue,
      ipAddress: options?.ipAddress,
      metadata: options?.metadata,
      success: options?.success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    action: '2fa_enable' | '2fa_disable' | '2fa_verify' | 'backup_code_use' | 'session_revoke' | 'session_revoke_all',
    userId: string,
    options?: {
      success?: boolean;
      errorMessage?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: object;
    }
  ): Promise<AuditLogEntry> {
    const actionMap = {
      '2fa_enable': ACTION_CATEGORIES.SECURITY_2FA_ENABLE,
      '2fa_disable': ACTION_CATEGORIES.SECURITY_2FA_DISABLE,
      '2fa_verify': ACTION_CATEGORIES.SECURITY_2FA_VERIFY,
      'backup_code_use': ACTION_CATEGORIES.SECURITY_BACKUP_CODE_USE,
      'session_revoke': ACTION_CATEGORIES.SECURITY_SESSION_REVOKE,
      'session_revoke_all': ACTION_CATEGORIES.SECURITY_SESSION_REVOKE_ALL,
    };

    return this.log({
      action: actionMap[action],
      userId,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      metadata: options?.metadata,
      success: options?.success,
      errorMessage: options?.errorMessage,
    });
  }

  /**
   * Query audit logs with filters
   */
  async getLogs(filters: AuditLogFilters): Promise<AuditLogResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.resource) where.resource = filters.resource;
    if (filters.success !== undefined) where.success = filters.success;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
      if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
    }

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search } },
        { resource: { contains: filters.search } },
        { resourceId: { contains: filters.search } },
        { errorMessage: { contains: filters.search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => this.formatEntry(log)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get statistics about audit logs
   */
  async getStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalEvents: number;
    failedEvents: number;
    successRate: number;
    actionBreakdown: Array<{ action: string; count: string }>;
    mostActiveUsers: Array<{ userId: string; count: string }>;
    recentFailedAttempts: AuditLogEntry[];
  }> {
    const where: Record<string, unknown> = {};
    
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) (where.createdAt as Record<string, unknown>).gte = options.startDate;
      if (options?.endDate) (where.createdAt as Record<string, unknown>).lte = options.endDate;
    }

    const [
      totalEvents,
      failedEvents,
      actionBreakdown,
      mostActiveUsers,
      recentFailedAttempts,
    ] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.count({ where: { ...where, success: false } }),
      db.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        where,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      db.auditLog.groupBy({
        by: ['userId'],
        _count: { userId: true },
        where: { ...where, userId: { not: null } },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      db.auditLog.findMany({
        where: { ...where, success: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      failedEvents,
      successRate: totalEvents > 0 ? ((totalEvents - failedEvents) / totalEvents) * 100 : 100,
      actionBreakdown: actionBreakdown.map((item) => ({
        action: item.action,
        count: item._count.action.toString(),
      })),
      mostActiveUsers: mostActiveUsers.map((item) => ({
        userId: item.userId!,
        count: item._count.userId.toString(),
      })),
      recentFailedAttempts: recentFailedAttempts.map((log) => this.formatEntry(log)),
    };
  }

  /**
   * Format a database entry to API format
   */
  private formatEntry(entry: {
    id: string;
    userId: string | null;
    userRole: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    action: string;
    resource: string | null;
    resourceId: string | null;
    oldValue: string | null;
    newValue: string | null;
    metadata: string | null;
    success: boolean;
    errorMessage: string | null;
    createdAt: Date;
  }): AuditLogEntry {
    return {
      ...entry,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      metadata: entry.metadata,
    };
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggerClass();

// Convenience export for direct usage
export default auditLogger;
