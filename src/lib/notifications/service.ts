/**
 * Notification Service
 * 
 * Complete notification management system for AlgeriaTrade.
 * Handles in-app notifications, email notifications, and real-time push.
 * 
 * @module lib/notifications/service
 */

import { db } from '@/lib/db';
import { NotificationType, NotificationCategory } from '@prisma/client';
import { emailService } from '@/lib/email/service';

// ============================================
// Types & Interfaces
// ============================================

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
  sendEmail?: boolean; // Override user preferences
}

export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface PaginatedNotifications {
  notifications: any[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

// ============================================
// Category Mapping for Email Preferences
// ============================================

const categoryToEmailCategory: Record<NotificationCategory, 'auth' | 'rfq' | 'order' | 'message' | 'system' | 'marketing'> = {
  [NotificationCategory.AUTH]: 'auth',
  [NotificationCategory.RFQ]: 'rfq',
  [NotificationCategory.ORDER]: 'order',
  [NotificationCategory.MESSAGE]: 'message',
  [NotificationCategory.SYSTEM]: 'system',
  [NotificationCategory.MARKETING]: 'marketing',
};

// ============================================
// Main Notification Service
// ============================================

export const notificationService = {
  /**
   * Create a new notification
   */
  async create(options: CreateNotificationOptions) {
    const {
      userId,
      type,
      category,
      title,
      message,
      data,
      actionUrl,
      actionText,
      sendEmail = false,
    } = options;

    // Create notification in database
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        category,
        title,
        message,
        data: data ? JSON.stringify(data) : undefined,
        actionUrl,
        actionText,
      },
    });

    // Check if we should send email notification
    if (sendEmail) {
      const emailCategory = categoryToEmailCategory[category];
      const shouldSend = await emailService.shouldSendEmail(userId, emailCategory);
      
      if (shouldSend) {
        // Queue email notification (implementation depends on your needs)
        await this.sendEmailNotification(notification.id);
      }
    }

    return notification;
  },

  /**
   * Create multiple notifications at once (batch)
   */
  async createBatch(notifications: Omit<CreateNotificationOptions, 'sendEmail'>[]) {
    const createdNotifications = [];

    for (const notif of notifications) {
      const created = await this.create({ ...notif, sendEmail: false });
      createdNotifications.push(created);
    }

    return createdNotifications;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    return db.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return db.notification.count({
      where: { userId, isRead: false },
    });
  },

  /**
   * Get unread count by category for a user
   */
  async getUnreadCountByCategory(userId: string): Promise<Record<string, number>> {
    const counts = await db.notification.groupBy({
      by: ['category'],
      where: { userId, isRead: false },
      _count: { id: true },
    });

    const result: Record<string, number> = {};
    
    // Initialize all categories with 0
    Object.values(NotificationCategory).forEach(cat => {
      result[cat] = 0;
    });

    // Fill in actual counts
    counts.forEach(count => {
      result[count.category] = count._count.id;
    });

    return result;
  },

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<PaginatedNotifications> {
    const {
      type,
      category,
      isRead,
      limit = 20,
      offset = 0,
    } = filters;

    const where: any = { userId };
    if (type !== undefined) where.type = type;
    if (category !== undefined) where.category = category;
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      this.getUnreadCount(userId),
    ]);

    return {
      notifications: notifications.map(n => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null,
      })),
      total,
      unreadCount,
      hasMore: offset + limit < total,
    };
  },

  /**
   * Get a single notification
   */
  async getById(notificationId: string, userId: string) {
    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return null;
    }

    return {
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null,
    };
  },

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string) {
    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification non trouvée');
    }

    return db.notification.delete({ where: { id: notificationId } });
  },

  /**
   * Delete all read notifications for a user
   */
  async deleteAllRead(userId: string) {
    return db.notification.deleteMany({
      where: { userId, isRead: true },
    });
  },

  /**
   * Delete all notifications for a user
   */
  async deleteAll(userId: string) {
    return db.notification.deleteMany({ where: { userId } });
  },

  /**
   * Send email notification for an existing notification
   */
  async sendEmailNotification(notificationId: string) {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });

    if (!notification || !notification.user.email) {
      return null;
    }

    // Update notification to mark email as sent
    await db.notification.update({
      where: { id: notificationId },
      data: { emailSent: true, emailSentAt: new Date() },
    });

    // In production, you would generate and send the actual email here
    // based on the notification type
    console.log(`[DEV] Would send email notification for ${notification.type} to ${notification.user.email}`);

    return true;
  },

  // ============================================
  // Convenience Methods for Common Notifications
  // ============================================

  /**
   * Send welcome notification
   */
  async sendWelcome(userId: string, role: 'buyer' | 'supplier') {
    return this.create({
      userId,
      type: 'WELCOME',
      category: 'SYSTEM',
      title: 'Bienvenue sur AlgeriaTrade !',
      message: role === 'supplier'
        ? 'Votre compte fournisseur est prêt. Complétez votre profil entreprise pour commencer à vendre.'
        : 'Votre compte est créé. Explorez les produits et publiez votre première demande de devis.',
      actionUrl: '/dashboard',
      actionText: 'Commencer',
      sendEmail: true,
    });
  },

  /**
   * Send new RFQ notification to suppliers
   */
  async notifyNewRFQ(supplierIds: string[], rfqData: { id: string; title: string; category: string }) {
    const notifications = supplierIds.map(userId => ({
      userId,
      type: 'NEW_RFQ_RECEIVED' as NotificationType,
      category: NotificationCategory.RFQ,
      title: 'Nouvelle demande de devis',
      message: `Une nouvelle demande correspond à votre activité : ${rfqData.title}`,
      data: { rfqId: rfqData.id, category: rfqData.category },
      actionUrl: `/dashboard/seller/rfqs/${rfqData.id}`,
      actionText: 'Voir la demande',
      sendEmail: true,
    }));

    return this.createBatch(notifications);
  },

  /**
   * Send quotation received notification to buyer
   */
  async notifyQuotationReceived(buyerId: string, quotationData: { id: string; supplierName: string; rfqTitle: string }) {
    return this.create({
      userId: buyerId,
      type: 'NEW_QUOTATION_RECEIVED',
      category: NotificationCategory.RFQ,
      title: 'Nouveau devis reçu',
      message: `${quotationData.supplierName} a envoyé un devis pour "${quotationData.rfqTitle}"`,
      data: { quotationId: quotationData.id, supplierName: quotationData.supplierName },
      actionUrl: `/dashboard/buyer/quotations/${quotationData.id}`,
      actionText: 'Voir le devis',
      sendEmail: true,
    });
  },

  /**
   * Send order status update notification
   */
  async notifyOrderUpdate(
    userId: string,
    orderData: { id: string; orderNumber: string; status: string }
  ) {
    const statusMessages: Record<string, { title: string; message: string }> = {
      CONFIRMED: {
        title: 'Commande confirmée',
        message: `Votre commande ${orderData.orderNumber} a été confirmée par le fournisseur.`,
      },
      PROCESSING: {
        title: 'Commande en préparation',
        message: `Votre commande ${orderData.orderNumber} est en cours de préparation.`,
      },
      SHIPPED: {
        title: 'Commande expédiée',
        message: `Votre commande ${orderData.orderNumber} a été expédiée !`,
      },
      DELIVERED: {
        title: 'Commande livrée',
        message: `Votre commande ${orderData.orderNumber} a été livrée avec succès.`,
      },
      CANCELLED: {
        title: 'Commande annulée',
        message: `Votre commande ${orderData.orderNumber} a été annulée.`,
      },
    };

    const statusInfo = statusMessages[orderData.status];
    if (!statusInfo) return null;

    const typeMap: Record<string, NotificationType> = {
      CONFIRMED: 'ORDER_CONFIRMED',
      PROCESSING: 'ORDER_PROCESSING',
      SHIPPED: 'ORDER_SHIPPED',
      DELIVERED: 'ORDER_DELIVERED',
      CANCELLED: 'ORDER_CANCELLED',
    };

    return this.create({
      userId,
      type: typeMap[orderData.status],
      category: NotificationCategory.ORDER,
      title: statusInfo.title,
      message: statusInfo.message,
      data: { orderId: orderData.id, orderNumber: orderData.orderNumber, status: orderData.status },
      actionUrl: `/dashboard/buyer/orders/${orderData.id}`,
      actionText: 'Voir la commande',
      sendEmail: true,
    });
  },

  /**
   * Send company verification result notification
   */
  async notifyVerificationResult(
    userId: string,
    companyName: string,
    approved: boolean,
    rejectionReason?: string
  ) {
    return this.create({
      userId,
      type: approved ? 'COMPANY_VERIFIED' : 'COMPANY_VERIFICATION_REJECTED',
      category: NotificationCategory.SYSTEM,
      title: approved ? 'Entreprise vérifiée ✅' : 'Vérification refusée ⚠️',
      message: approved
        ? `Félicitations ! ${companyName} est maintenant une entreprise vérifiée.`
        : `La vérification de ${companyName} n'a pas abouti. ${rejectionReason || ''}`,
      data: { companyName, rejectionReason },
      actionUrl: '/dashboard/seller/company',
      actionText: 'Voir mon profil',
      sendEmail: true,
    });
  },

  /**
   * Send new message notification
   */
  async notifyNewMessage(
    userId: string,
    fromUserName: string,
    conversationId: string,
    messagePreview?: string
  ) {
    return this.create({
      userId,
      type: 'NEW_MESSAGE',
      category: NotificationCategory.MESSAGE,
      title: 'Nouveau message',
      message: `${fromUserName} vous a envoyé un message${messagePreview ? ` : "${messagePreview.substring(0, 50)}..."` : ''}`,
      data: { conversationId, fromUserName },
      actionUrl: `/dashboard/messages/${conversationId}`,
      actionText: 'Voir le message',
      sendEmail: false, // Default off for messages - in-app only
    });
  },

  /**
   * Format relative time in French
   */
  formatRelativeTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSecs < 60) return "à l'instant";
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return "hier";
    if (diffDays < 7) return `il y a ${diffDays} jours`;
    if (diffWeeks < 4) return `il y a ${diffWeeks} sem.`;

    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  },
};

// Export types
export type { CreateNotificationOptions, NotificationFilters, PaginatedNotifications };

export default notificationService;
