// Push Notification Service - AlgeriaTrade Mobile
// Service de notifications push pour l'application mobile

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification handler
 * Configure le gestionnaire de notifications
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private listenerAttached = false;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialize push notifications
   * Initialiser les notifications push
   */
  async initialize(): Promise<string | null> {
    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[PushNotification] Permission not granted');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id',
      });

      console.log('[PushNotification] Token obtained:', tokenData.data);

      // Set up listeners
      this.attachListeners();

      return tokenData.data;
    } catch (error) {
      console.error('[PushNotification] Initialization error:', error);
      return null;
    }
  }

  /**
   * Attach notification listeners
   * Attacher les écouteurs de notifications
   */
  private attachListeners(): void {
    if (this.listenerAttached) return;

    // Foreground notification listener
    Notifications.addNotificationReceivedListener(notification => {
      console.log('[PushNotification] Received in foreground:', notification.request.content);
    });

    // Notification response listener (user tapped)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[PushNotification] User interacted:', response.notification.request.content);
      
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      this.handleNotificationTap(data);
    });

    this.listenerAttached = true;
  }

  /**
   * Handle user tapping on notification
   * Gérer le tap sur une notification
   */
  private handleNotificationTap(data: any): void {
    // Navigation will be handled by the app's navigation container
    // This just logs the action - actual navigation happens via deep links
    console.log('[PushNotification] Navigate to:', data?.screen, data?.params);

    // Emit custom event for the app to handle
    if (typeof globalThis !== 'undefined' && globalThis.EventEmitter) {
      globalThis.EventEmitter.emit('notificationTapped', data);
    }
  }

  /**
   * Send local notification (for testing or reminders)
   * Envoyer une notification locale
   */
  async sendLocalNotification({
    title,
    body,
    data = {},
    schedule = null,
  }: {
    title: string;
    body: string;
    data?: any;
    schedule?: Date | null;
  }): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: schedule ? { date: schedule } : null,
      });

      console.log('[PushNotification] Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[PushNotification] Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   * Annuler une notification programmée
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all notifications
   * Annuler toutes les notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get all scheduled notifications
   * Obtenir toutes les notifications programmées
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Create notification channels for Android
   * Créer des canaux de notification pour Android
   */
  async createChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#006633',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Orders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: '#FF9800',
      });

      await Notifications.setNotificationChannelAsync('rfq', {
        name: 'RFQ Responses',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#2196F3',
      });

      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions & Updates',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: null,
        lightColor: '#9C27B0',
      });
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

/**
 * Notification types for AlgeriaTrade
 * Types de notifications pour AlgeriaTrade
 */
export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: {
    type: 'new_message',
    channel: 'messages',
    title: 'New Message',
    titleFr: 'Nouveau Message',
    titleAr: 'رسالة جديدة',
  },
  ORDER_UPDATE: {
    type: 'order_update',
    channel: 'orders',
    title: 'Order Update',
    titleFr: "Mise à jour de commande",
    titleAr: 'تحديث الطلب',
  },
  RFQ_RESPONSE: {
    type: 'rfq_response',
    channel: 'rfq',
    title: 'New Quotation',
    titleFr: 'Nouveau devis',
    titleAr: 'عرض سعر جديد',
  },
  PROMOTION: {
    type: 'promotion',
    channel: 'promotions',
    title: 'Special Offer!',
    titleFr: 'Offre spéciale !',
    titleAr: 'عرض خاص!',
  },
} as const;
