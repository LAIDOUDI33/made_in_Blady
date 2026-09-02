/**
 * Notification Center Module - AlgeriaTrade.dz
 * Système de notifications multi-canal pour la plateforme B2B
 * Multi-channel notification system (in-app, email, SMS, push)
 */

export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'push' | 'websocket';
export type NotificationCategory = 
  | 'order' 
  | 'message' 
  | 'payment' 
  | 'system' 
  | 'promotion' 
  | 'rfq' 
  | 'contract'
  | 'shipping'
  | 'verification';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  readAt?: Date;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  imageUrl?: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  categories: {
    order: boolean;
    message: boolean;
    payment: boolean;
    system: boolean;
    promotion: boolean;
    rfq: boolean;
    contract: boolean;
    shipping: boolean;
    verification: boolean;
  };
  quietHours: {
    enabled: boolean;
    startHour: number; // 0-23
    endHour: number;   // 0-23
    timezone: string;  // e.g., 'Africa/Algiers'
  };
  digestMode: 'immediate' | 'hourly' | 'daily' | 'never';
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  key: string;
  category: NotificationCategory;
  defaultTitle: string;
  defaultMessage: string;
  variables: string[]; // Template variables like {{order_id}}
  channels: NotificationChannel[];
  priority: NotificationPriority;
}

// Default notification templates for AlgeriaTrade
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // Order Notifications
  {
    id: 'order-created',
    key: 'order.created',
    category: 'order',
    defaultTitle: 'Nouvelle commande reçue',
    defaultMessage: 'Vous avez reçu une nouvelle commande #{{order_id}} de {{buyer_name}} pour un montant de {{amount}} DZD.',
    variables: ['order_id', 'buyer_name', 'amount'],
    channels: ['in-app', 'email', 'push'],
    priority: 'high'
  },
  {
    id: 'order-status-updated',
    key: 'order.status_updated',
    category: 'order',
    defaultTitle: 'Mise à jour de commande',
    defaultMessage: 'Votre commande #{{order_id}} est maintenant : {{status}}.',
    variables: ['order_id', 'status'],
    channels: ['in-app', 'email', 'push', 'sms'],
    priority: 'high'
  },
  {
    id: 'order-delivered',
    key: 'order.delivered',
    category: 'order',
    defaultTitle: 'Commande livrée',
    defaultMessage: 'Votre commande #{{order_id}} a été livrée avec succès. Veuillez confirmer la réception.',
    variables: ['order_id'],
    channels: ['in-app', 'email', 'sms'],
    priority: 'medium'
  },
  
  // Message Notifications
  {
    id: 'message-received',
    key: 'message.received',
    category: 'message',
    defaultTitle: 'Nouveau message',
    defaultMessage: '{{sender_name}} vous a envoyé un message : "{{preview}}"',
    variables: ['sender_name', 'preview'],
    channels: ['in-app', 'push', 'email'],
    priority: 'medium'
  },
  
  // Payment Notifications
  {
    id: 'payment-received',
    key: 'payment.received',
    category: 'payment',
    defaultTitle: 'Paiement reçu',
    defaultMessage: 'Un paiement de {{amount}} DZD a été reçu pour la commande #{{order_id}}.',
    variables: ['amount', 'order_id'],
    channels: ['in-app', 'email'],
    priority: 'high'
  },
  {
    id: 'payment-failed',
    key: 'payment.failed',
    category: 'payment',
    defaultTitle: 'Échec du paiement',
    defaultMessage: 'Le paiement de {{amount}} DZD pour la commande #{{order_id}} a échoué. Veuillez réessayer.',
    variables: ['amount', 'order_id'],
    channels: ['in-app', 'email', 'sms'],
    priority: 'urgent'
  },
  
  // RFQ Notifications
  {
    id: 'rfq-received',
    key: 'rfq.received',
    category: 'rfq',
    defaultTitle: 'Nouvelle demande de devis',
    defaultMessage: '{{company_name}} a soumis une demande de devis pour {{product_name}}.',
    variables: ['company_name', 'product_name'],
    channels: ['in-app', 'email', 'push'],
    priority: 'high'
  },
  {
    id: 'quotation-received',
    key: 'rfq.quotation_received',
    category: 'rfq',
    defaultTitle: 'Nouveau devis reçu',
    defaultMessage: '{{supplier_name}} a répondu à votre demande de devis avec une offre de {{amount}} DZD.',
    variables: ['supplier_name', 'amount'],
    channels: ['in-app', 'email'],
    priority: 'high'
  },
  
  // System Notifications
  {
    id: 'system-maintenance',
    key: 'system.maintenance',
    category: 'system',
    defaultTitle: 'Maintenance planifiée',
    defaultMessage: 'La plateforme sera en maintenance le {{date}} de {{start_time}} à {{end_time}} (heure d\'Alger).',
    variables: ['date', 'start_time', 'end_time'],
    channels: ['in-app', 'email'],
    priority: 'low'
  },
  {
    id: 'security-alert',
    key: 'system.security_alert',
    category: 'system',
    defaultTitle: 'Alerte de sécurité',
    defaultMessage: 'Une connexion inhabituelle a été détectée depuis {{location}}. Si ce n\'est pas vous, changez votre mot de passe.',
    variables: ['location', 'ip_address', 'device'],
    channels: ['in-app', 'email', 'sms'],
    priority: 'urgent'
  },
  
  // Verification Notifications
  {
    id: 'verification-approved',
    key: 'verification.approved',
    category: 'verification',
    defaultTitle: 'Compte vérifié',
    defaultMessage: 'Félicitations ! Votre compte entreprise a été vérifié. Vous bénéficiez désormais du badge "Vérifié".',
    variables: [],
    channels: ['in-app', 'email'],
    priority: 'high'
  },
  {
    id: 'verification-rejected',
    key: 'verification.rejected',
    category: 'verification',
    defaultTitle: 'Vérification refusée',
    defaultMessage: 'Votre demande de vérification a été refusée. Motif : {{reason}}. Vous pouvez soumettre une nouvelle demande.',
    variables: ['reason'],
    channels: ['in-app', 'email'],
    priority: 'high'
  }
];

// Default user preferences
export const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'updatedAt'> = {
  channels: {
    inApp: true,
    email: true,
    sms: false,
    push: true
  },
  categories: {
    order: true,
    message: true,
    payment: true,
    system: true,
    promotion: false,
    rfq: true,
    contract: true,
    shipping: true,
    verification: true
  },
  quietHours: {
    enabled: false,
    startHour: 22,  // 10 PM
    endHour: 8,     // 8 AM
    timezone: 'Africa/Algiers'
  },
  digestMode: 'immediate'
};

/**
 * Create a new notification from template
 */
export function createNotificationFromTemplate(
  templateKey: string,
  userId: string,
  variables: Record<string, string> = {},
  overrides: Partial<Notification> = {}
): Notification | null {
  const template = NOTIFICATION_TEMPLATES.find(t => t.key === templateKey);
  if (!template) return null;
  
  let title = template.defaultTitle;
  let message = template.defaultMessage;
  
  // Replace template variables
  for (const [key, value] of Object.entries(variables)) {
    title = title.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    title,
    message,
    category: template.category,
    priority: template.priority,
    channels: template.channels,
    data: variables,
    createdAt: new Date(),
    ...overrides
  };
}

/**
 * Check if notification should be sent based on user preferences
 */
export function shouldSendNotification(
  notification: Notification,
  preferences: NotificationPreferences,
  channel: NotificationChannel
): boolean {
  // Check if channel is enabled
  switch (channel) {
    case 'in-app':
      if (!preferences.channels.inApp) return false;
      break;
    case 'email':
      if (!preferences.channels.email) return false;
      break;
    case 'sms':
      if (!preferences.channels.sms) return false;
      break;
    case 'push':
    case 'websocket':
      if (!preferences.channels.push) return false;
      break;
  }
  
  // Check if category is enabled
  const categoryEnabled = preferences.categories[notification.category];
  if (categoryEnabled === false) return false;
  
  // Check quiet hours (except for urgent notifications)
  if (preferences.quietHours.enabled && notification.priority !== 'urgent') {
    const now = new Date();
    const algiersTime = new Date(now.toLocaleString('en-US', { 
      timeZone: preferences.quietHours.timezone 
    }));
    const currentHour = algiersTime.getHours();
    
    if (preferences.quietHours.startHour > preferences.quietHours.endHour) {
      // Overnight quiet hours (e.g., 22:00 - 08:00)
      if (currentHour >= preferences.quietHours.startHour || currentHour < preferences.quietHours.endHour) {
        // Only allow in-app during quiet hours
        if (channel !== 'in-app') return false;
      }
    } else {
      // Same day quiet hours
      if (currentHour >= preferences.quietHours.startHour && currentHour < preferences.quietHours.endHour) {
        if (channel !== 'in-app') return false;
      }
    }
  }
  
  return true;
}

/**
 * Format notification for specific channel
 */
export function formatForChannel(
  notification: Notification,
  channel: NotificationChannel
): { subject?: string; body: string; metadata?: Record<string, any> } {
  switch (channel) {
    case 'email':
      return {
        subject: `[AlgeriaTrade] ${notification.title}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `
              <a href="${notification.actionUrl}" style="
                display: inline-block;
                background-color: #16a34a;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 16px;
              ">${notification.actionLabel || 'Voir les détails'}</a>
            ` : ''}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">
              Cet email vous a été envoyé par AlgeriaTrade.dz - La plateforme B2B de l'Algérie<br/>
              Ne répondez pas à cet email. Pour contacter le support, utilisez le formulaire sur notre site.
            </p>
          </div>
        `.trim(),
        metadata: {
          html: true,
          priority: notification.priority
        }
      };
      
    case 'sms':
      return {
        body: `[AlgeriaTrade] ${notification.title}\n${notification.message.slice(0, 100)}${notification.message.length > 100 ? '...' : ''}${notification.actionUrl ? `\n${notification.actionUrl}` : ''}`
      };
      
    case 'push':
      return {
        body: notification.message,
        metadata: {
          title: notification.title,
          icon: notification.icon,
          image: notification.imageUrl,
          clickAction: notification.actionUrl,
          badge: '/icons/badge.png',
          data: notification.data
        }
      };
      
    case 'websocket':
      return {
        body: JSON.stringify({
          type: 'notification',
          id: notification.id,
          title: notification.title,
          message: notification.message,
          category: notification.category,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          timestamp: notification.createdAt.toISOString()
        })
      };
      
    case 'in-app':
    default:
      return {
        body: notification.message
      };
  }
}

/**
 * Group notifications for digest mode
 */
export function groupForDigest(
  notifications: Notification[]
): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();
  
  for (const notif of notifications) {
    const key = `${notif.category}_${new Date(notif.createdAt).toDateString()}`;
    const existing = groups.get(key) || [];
    existing.push(notif);
    groups.set(key, existing);
  }
  
  return groups;
}

/**
 * Generate digest summary
 */
export function generateDigestSummary(
  groupedNotifications: Map<string, Notification[]>
): Array<{ category: NotificationCategory; date: string; count: number; latest: Notification }> {
  const summaries: Array<{ category: NotificationCategory; date: string; count: number; latest: Notification }> = [];
  
  for (const [key, notifs] of groupedNotifications.entries()) {
    const [category, date] = key.split('_');
    const sorted = notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    summaries.push({
      category: category as NotificationCategory,
      date,
      count: notifs.length,
      latest: sorted[0]
    });
  }
  
  return summaries;
}

/**
 * Calculate unread count
 */
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.readAt).length;
}

/**
 * Mark notification as read
 */
export function markAsRead(notification: Notification): Notification {
  return { ...notification, readAt: new Date() };
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(notifications: Notification[]): Notification[] {
  return notifications.map(n => ({ ...n, readAt: new Date() }));
}
