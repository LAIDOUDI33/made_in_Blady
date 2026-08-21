/**
 * Push Notification System for AlgeriaTrade.dz PWA+
 * Handles notification types, preferences, scheduling, and deep linking
 */

import type { 
  PushNotificationPayload, 
  DeviceRegistration, 
  NotificationPreferences,
  SyncQueueItem 
} from './enhancements';

// ============ Notification Types ============
export enum NotificationType {
  ORDER_UPDATE = 'order',
  NEGOTIATION_ALERT = 'negotiation',
  PAYMENT_NOTIFICATION = 'payment',
  CALL_NOTIFICATION = 'call',
  SYSTEM_ANNOUNCEMENT = 'system',
  MESSAGE_NOTIFICATION = 'message',
}

export interface NotificationTemplate {
  type: NotificationType;
  titleTemplate: string;
  bodyTemplate: string;
  icon?: string;
  requireInteraction: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// ============ Default Notification Templates ============
const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.ORDER_UPDATE]: {
    type: NotificationType.ORDER_UPDATE,
    titleTemplate: 'Order {orderNumber} Update',
    bodyTemplate: 'Your order status has been updated to: {status}',
    icon: '/icons/icon-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'view-order', title: 'View Order', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' },
    ],
  },
  [NotificationType.NEGOTIATION_ALERT]: {
    type: NotificationType.NEGOTIATION_ALERT,
    titleTemplate: 'New Offer on {productName}',
    bodyTemplate: '{supplierName} sent a new offer: {price}',
    icon: '/icons/icon-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'view-offer', title: 'View Offer', icon: '/icons/view.png' },
      { action: 'quick-reply', title: 'Quick Reply', icon: '/icons/reply.png' },
    ],
  },
  [NotificationType.PAYMENT_NOTIFICATION]: {
    type: NotificationType.PAYMENT_NOTIFICATION,
    titleTemplate: 'Payment {action}',
    bodyTemplate: 'Your payment of {amount} has been {status}',
    icon: '/icons/icon-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'view-payment', title: 'View Details', icon: '/icons/view.png' },
    ],
  },
  [NotificationType.CALL_NOTIFICATION]: {
    type: NotificationType.CALL_NOTIFICATION,
    titleTemplate: 'Incoming Call',
    bodyTemplate: '{callerName} is calling you',
    icon: '/icons/icon-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'accept-call', title: 'Accept', icon: '/icons/phone.png' },
      { action: 'decline-call', title: 'Decline', icon: '/icons/decline.png' },
    ],
  },
  [NotificationType.SYSTEM_ANNOUNCEMENT]: {
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    titleTemplate: 'AlgeriaTrade Update',
    bodyTemplate: '{message}',
    icon: '/icons/icon-192x192.png',
    requireInteraction: false,
  },
  [NotificationType.MESSAGE_NOTIFICATION]: {
    type: NotificationType.MESSAGE_NOTIFICATION,
    titleTemplate: 'New Message from {senderName}',
    bodyTemplate: '{messagePreview}',
    icon: '/icons/icon-192x192.png',
    requireInteraction: false,
    actions: [
      { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
      { action: 'mark-read', title: 'Mark Read', icon: '/icons/read.png' },
    ],
  },
};

// ============ Push Notification Manager ============
export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';
  private currentSubscription: PushSubscription | null = null;
  private messageListeners: Set<(event: MessageEvent) => void> = new Set();
  private clickListeners: Set<(payload: Record<string, unknown>) => void> = new Set();

  private constructor() {
    this.checkSupport();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  private checkSupport(): void {
    this.isSupported = !!(typeof window !== 'undefined' && 
      ('serviceWorker' in navigator) && 
      ('PushManager' in window) && 
      ('Notification' in window));
    
    if (this.isSupported && typeof window !== 'undefined') {
      this.permission = Notification.permission;
    }
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      
      // Setup message listener for push events
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.messageListeners.forEach((listener) => listener(event));
      });

      // Setup notification click handler
      if (this.registration) {
        const existingSub = await this.registration.pushSubscription;
        if (existingSub) {
          this.currentSubscription = existingSub;
        }
      }

      console.log('Push notification manager initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === 'granted') {
        // Subscribe to push
        await this.subscribeToPush();
      }

      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  private async subscribeToPush(): Promise<void> {
    if (!this.registration) return;

    try {
      // Use VAPID public key - in production, get from server
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      this.currentSubscription = subscription;

      // Send subscription to server
      await this.registerDevice(subscription);

    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  }

  async registerDevice(subscription: PushSubscription): Promise<boolean> {
    try {
      const response = await fetch('/api/pwa/notifications/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          p256dh: subscription.toJSON()?.keys?.p256dh,
          auth: subscription.toJSON()?.keys?.auth,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to register device:', error);
      return false;
    }
  }

  async unregisterDevice(): Promise<boolean> {
    if (!this.currentSubscription) return true;

    try {
      await this.currentSubscription.unsubscribe();
      this.currentSubscription = null;

      // Notify server
      await fetch('/api/pwa/notifications/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: this.currentSubscription?.endpoint }),
      });

      return true;
    } catch (error) {
      console.error('Failed to unregister device:', error);
      return false;
    }
  }

  // ============ Local Notifications ============
  async showLocalNotification(payload: PushNotificationPayload): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        image: payload.image,
        badge: '/icons/icon-72x72.png',
        tag: payload.tag,
        requireInteraction: payload.requireInteraction ?? false,
        data: payload.data || {},
        actions: payload.actions?.map((a) => a.title) || [],
      });

      // Handle notification click
      notification.onclick = () => {
        notification.close();
        this.handleClick(payload.data || {});
        window.focus();
        
        // Deep link navigation
        if (payload.data?.deepLink) {
          window.location.href = payload.data.deepLink as string;
        }
      };

      return notification;
    } catch (error) {
      console.error('Failed to show local notification:', error);
      return null;
    }
  }

  // ============ Template-based Notifications ============
  async showNotification(
    type: NotificationType,
    variables: Record<string, string>,
    additionalData?: Record<string, unknown>
  ): Promise<Notification | null> {
    const template = NOTIFICATION_TEMPLATES[type];
    
    let title = template.titleTemplate;
    let body = template.bodyTemplate;

    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      title = title.replace(`{${key}}`, value);
      body = body.replace(`{${key}}`, value);
    });

    return this.showLocalNotification({
      type,
      title,
      body,
      icon: template.icon,
      requireInteraction: template.requireInteraction,
      actions: template.actions,
      tag: `${type}-${Date.now()}`,
      data: additionalData,
    });
  }

  // ============ Preference Management ============
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const response = await fetch('/api/user/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }

  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const response = await fetch('/api/user/notifications/preferences');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return null;
    }
  }

  // ============ Digest Mode (Scheduled Notifications) ============
  async scheduleDigest(type: 'hourly' | 'daily' | 'weekly'): Promise<boolean> {
    try {
      const response = await fetch('/api/pwa/notifications/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: type }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to schedule digest:', error);
      return false;
    }
  }

  // ============ Event Listeners ============
  onMessage(listener: (event: MessageEvent) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onClick(listener: (payload: Record<string, unknown>) => void): () => void {
    this.clickListeners.add(listener);
    return () => this.clickListeners.delete(listener);
  }

  private handleClick(payload: Record<string, unknown>): void {
    this.clickListeners.forEach((listener) => listener(payload));
  }

  // ============ Utility Methods ============
  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  isPermissionDenied(): boolean {
    return this.permission === 'denied';
  }

  isSupportedCheck(): boolean {
    return this.isSupported;
  }

  getSubscription(): PushSubscription | null {
    return this.currentSubscription;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

// ============ Deep Link Handler ============
export class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private routes: Map<string, (params: Record<string, string>) => void> = new Map();

  private constructor() {
    this.setupDeepLinks();
  }

  static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  private setupDeepLinks(): void {
    // Register deep link patterns
    this.routes.set('/orders/:id', (params) => {
      console.log('Navigate to order:', params.id);
      window.location.href = `/orders/${params.id}`;
    });

    this.routes.set('/rfqs/:id', (params) => {
      console.log('Navigate to RFQ:', params.id);
      window.location.href = `/dashboard/buyer/rfqs/${params.id}`;
    });

    this.routes.set('/negotiations/:id', (params) => {
      console.log('Navigate to negotiation:', params.id);
      window.location.href = `/negotiations/${params.id}`;
    });

    this.routes.set('/messages/:conversationId', (params) => {
      console.log('Navigate to conversation:', params.conversationId);
      window.location.href = `/dashboard/seller/messages?conversation=${params.conversationId}`;
    });

    this.routes.set('/products/:slug', (params) => {
      console.log('Navigate to product:', params.slug);
      window.location.href = `/products/${params.slug}`;
    });

    this.routes.set('/companies/:slug', (params) => {
      console.log('Navigate to company:', params.slug);
      window.location.href = `/companies/${params.slug}`;
    });

    this.routes.set('/calls/:callId', (params) => {
      console.log('Join call:', params.callId);
      // Trigger call join logic
    });
  }

  handleDeepLink(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      
      for (const [pattern, handler] of this.routes.entries()) {
        const match = this.matchRoute(pattern, pathname);
        if (match) {
          handler(match);
          return true;
        }
      }

      // Fallback: navigate directly
      window.location.href = url;
      return true;
    } catch (error) {
      console.error('Invalid deep link:', url);
      return false;
    }
  }

  private matchRoute(
    pattern: string,
    pathname: string
  ): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  registerRoute(pattern: string, handler: (params: Record<string, string>) => void): void {
    this.routes.set(pattern, handler);
  }
}

// ============ Export Singletons ============
export const pushNotifications = typeof window !== 'undefined' ? PushNotificationManager.getInstance() : null;
export const deepLinkHandler = typeof window !== 'undefined' ? DeepLinkHandler.getInstance() : null;

// ============ Quick Access Functions ============
export async function sendOrderUpdateNotification(
  orderNumber: string,
  status: string,
  orderId: string
): Promise<void> {
  await pushNotifications?.showNotification(NotificationType.ORDER_UPDATE, {
    orderNumber,
    status,
  }, { deepLink: `/orders/${orderId}`, orderId });
}

export async function sendNegotiationAlert(
  productName: string,
  supplierName: string,
  price: string,
  negotiationId: string
): Promise<void> {
  await pushNotifications?.showNotification(NotificationType.NEGOTIATION_ALERT, {
    productName,
    supplierName,
    price,
  }, { deepLink: `/negotiations/${negotiationId}`, negotiationId });
}

export async function sendPaymentNotification(
  action: string,
  amount: string,
  status: string,
  paymentId: string
): Promise<void> {
  await pushNotifications?.showNotification(NotificationType.PAYMENT_NOTIFICATION, {
    action,
    amount,
    status,
  }, { deepLink: `/payments/${paymentId}`, paymentId });
}

export async function sendCallNotification(
  callerName: string,
  callId: string
): Promise<void> {
  await pushNotifications?.showNotification(NotificationType.CALL_NOTIFICATION, {
    callerName,
  }, { deepLink: `/calls/${callId}`, callId });
}

export async function sendMessageNotification(
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<void> {
  await pushNotifications?.showNotification(NotificationType.MESSAGE_NOTIFICATION, {
    senderName,
    messagePreview,
  }, { deepLink: `/messages/${conversationId}`, conversationId });
}
