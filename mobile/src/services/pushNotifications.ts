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
  
  // ============================================
  // PHASE 6: NOTIFICATION TYPES
  // ============================================
  
  // Verification Notifications
  VERIFICATION_STATUS_CHANGED: {
    type: 'verification.status_changed',
    channel: 'orders',
    title: 'Verification Status Updated',
    titleFr: 'Statut de vérification mis à jour',
    titleAr: 'تم تحديث حالة التحقق',
  },
  
  // Escrow/Trade Assurance Notifications
  ESCROW_FUNDED: {
    type: 'escrow.funded',
    channel: 'orders',
    title: 'Escrow Funded',
    titleFr: 'Compte séquestre alimenté',
    titleAr: 'تم تمويل الحساب الضمان',
  },
  ESCROW_RELEASED: {
    type: 'escrow.released',
    channel: 'orders',
    title: 'Funds Released',
    titleFr: 'Fonds libérés',
    titleAr: 'تم إطلاق الأموال',
  },
  ESCROW_REFUNDED: {
    type: 'escrow.refunded',
    channel: 'orders',
    title: 'Refund Processed',
    titleFr: 'Remboursement effectué',
    titleAr: 'تم معالجة الاسترداد',
  },
  
  // Dispute Notifications
  DISPUTE_OPENED: {
    type: 'dispute.opened',
    channel: 'orders',
    title: 'Dispute Opened',
    titleFr: 'Litige ouvert',
    titleAr: 'تم فتح نزاع',
  },
  DISPUTE_RESOLVED: {
    type: 'dispute.resolved',
    channel: 'orders',
    title: 'Dispute Resolved',
    titleFr: 'Litige résolu',
    titleAr: 'تم حل النزاع',
  },
  
  // Inspection Notifications
  INSPECTION_SCHEDULED: {
    type: 'inspection.scheduled',
    channel: 'orders',
    title: 'Inspection Scheduled',
    titleFr: 'Inspection programmée',
    titleAr: 'تم جدولة الفحص',
  },
  INSPECTION_COMPLETED: {
    type: 'inspection.completed',
    channel: 'orders',
    title: 'Inspection Completed',
    titleFr: 'Inspection terminée',
    titleAr: 'اكتمل الفحص',
  },
  
  // Exhibition Notifications
  EXHIBITION_STARTING_SOON: {
    type: 'exhibition.starting_soon',
    channel: 'promotions',
    title: 'Exhibition Starting Soon!',
    titleFr: "Exposition bientôt !",
    titleAr: 'المعرض قريب البدء!',
  },
  BOOTH_CONFIRMED: {
    type: 'booth.confirmed',
    channel: 'promotions',
    title: 'Booth Confirmed',
    titleFr: 'Stand confirmé',
    titleAr: 'تم تأكيد الكشك',
  },
  
  // Shipment Notifications
  SHIPMENT_STATUS_UPDATE: {
    type: 'shipment.status_update',
    channel: 'orders',
    title: 'Shipment Update',
    titleFr: "Mise à jour d'expédition",
    titleAr: 'تحديث الشحنة',
  },
  SHIPMENT_DELIVERED: {
    type: 'shipment.delivered',
    channel: 'orders',
    title: 'Delivered!',
    titleFr: 'Livré !',
    titleAr: 'تم التسليم!',
  },
} as const;

/**
 * Phase 6 Notification Handler
 * Gestionnaire de notifications Phase 6
 */
export class Phase6NotificationHandler {
  private static instance: Phase6NotificationHandler;
  private navigation: any = null;

  static getInstance(): Phase6NotificationHandler {
    if (!Phase6NotificationHandler.instance) {
      Phase6NotificationHandler.instance = new Phase6NotificationHandler();
    }
    return Phase6NotificationHandler.instance;
  }

  /**
   * Set navigation reference for deep linking
   * Définir la référence de navigation pour le lien profond
   */
  setNavigation(navigationRef: any): void {
    this.navigation = navigationRef;
  }

  /**
   * Handle Phase 6 notification tap
   * Gérer le tap sur une notification Phase 6
   */
  async handleNotification(notificationType: string, data: any): Promise<void> {
    console.log('[Phase6Notification] Handling:', notificationType, data);

    switch (notificationType) {
      // Verification
      case NOTIFICATION_TYPES.VERIFICATION_STATUS_CHANGED.type:
        await this.handleVerificationStatusChange(data);
        break;
      
      // Escrow
      case NOTIFICATION_TYPES.ESCROW_FUNDED.type:
        await this.handleEscrowFunded(data);
        break;
      case NOTIFICATION_TYPES.ESCROW_RELEASED.type:
        await this.handleEscrowReleased(data);
        break;
      case NOTIFICATION_TYPES.ESCROW_REFUNDED.type:
        await this.handleEscrowRefunded(data);
        break;
      
      // Disputes
      case NOTIFICATION_TYPES.DISPUTE_OPENED.type:
        await this.handleDisputeOpened(data);
        break;
      case NOTIFICATION_TYPES.DISPUTE_RESOLVED.type:
        await this.handleDisputeResolved(data);
        break;
      
      // Inspections
      case NOTIFICATION_TYPES.INSPECTION_SCHEDULED.type:
        await this.handleInspectionScheduled(data);
        break;
      case NOTIFICATION_TYPES.INSPECTION_COMPLETED.type:
        await this.handleInspectionCompleted(data);
        break;
      
      // Exhibitions
      case NOTIFICATION_TYPES.EXHIBITION_STARTING_SOON.type:
        await this.handleExhibitionStartingSoon(data);
        break;
      case NOTIFICATION_TYPES.BOOTH_CONFIRMED.type:
        await this.handleBoothConfirmed(data);
        break;
      
      // Shipments
      case NOTIFICATION_TYPES.SHIPMENT_STATUS_UPDATE.type:
        await this.handleShipmentStatusUpdate(data);
        break;
      case NOTIFICATION_TYPES.SHIPMENT_DELIVERED.type:
        await this.handleShipmentDelivered(data);
        break;
      
      default:
        console.log('[Phase6Notification] Unknown type:', notificationType);
    }
  }

  // ============================================
  // VERIFICATION HANDLERS
  // ============================================

  private async handleVerificationStatusChange(data: any): Promise<void> {
    const { verificationId, newStatus } = data;
    
    // Navigate to verification screen
    if (this.navigation) {
      this.navigation.navigate('Verification', { verificationId });
    }
    
    // Show appropriate message based on status
    const messages: Record<string, string> = {
      approved: 'Félicitations ! Votre compte a été vérifié.',
      rejected: 'Votre demande de vérification a été rejetée.',
      pending: 'Votre demande de vérification est en cours de traitement.',
      needs_info: 'Des informations supplémentaires sont requises.',
    };
    
    console.log('[Verification] Status:', newStatus, messages[newStatus] || 'Statut mis à jour');
  }

  // ============================================
  // ESCROW HANDLERS
  // ============================================

  private async handleEscrowFunded(data: any): Promise<void> {
    const { escrowId, orderId, amount } = data;
    
    if (this.navigation) {
      this.navigation.navigate('EscrowDetail', { orderId, escrowId });
    }
    
    console.log('[Escrow] Funded:', amount, 'DZD');
  }

  private async handleEscrowReleased(data: any): Promise<void> {
    const { escrowId, orderId } = data;
    
    if (this.navigation) {
      this.navigation.navigate('EscrowDetail', { orderId, escrowId });
    }
    
    console.log('[Escrow] Funds released successfully');
  }

  private async handleEscrowRefunded(data: any): Promise<void> {
    const { escrowId, orderId, refundAmount } = data;
    
    if (this.navigation) {
      this.navigation.navigate('EscrowDetail', { orderId, escrowId });
    }
    
    console.log('[Escrow] Refunded:', refundAmount, 'DZD');
  }

  // ============================================
  // DISPUTE HANDLERS
  // ============================================

  private async handleDisputeOpened(data: any): Promise<void> {
    const { escrowId, orderId, disputeId } = data;
    
    if (this.navigation) {
      this.navigation.navigate('EscrowDetail', { orderId, escrowId });
    }
    
    console.log('[Dispute] New dispute opened:', disputeId);
  }

  private async handleDisputeResolved(data: any): Promise<void> {
    const { escrowId, orderId, resolution } = data;
    
    if (this.navigation) {
      this.navigation.navigate('EscrowDetail', { orderId, escrowId });
    }
    
    console.log('[Dispute] Resolved with:', resolution);
  }

  // ============================================
  // INSPECTION HANDLERS
  // ============================================

  private async handleInspectionScheduled(data: any): Promise<void> {
    const { bookingId, scheduledDate, inspectionType } = data;
    
    console.log('[Inspection] Scheduled:', inspectionType, 'on', scheduledDate);
    
    // Could navigate to inspection detail screen
    // this.navigation.navigate('InspectionDetail', { bookingId });
  }

  private async handleInspectionCompleted(data: any): Promise<void> {
    const { bookingId, result, passed } = data;
    
    console.log('[Inspection] Completed - Passed:', passed);
    
    // Could navigate to inspection results
    // this.navigation.navigate('InspectionResult', { bookingId });
  }

  // ============================================
  // EXHIBITION HANDLERS
  // ============================================

  private async handleExhibitionStartingSoon(data: any): Promise<void> {
    const { exhibitionId, startDate, name } = data;
    
    if (this.navigation) {
      this.navigation.navigate('Exhibition', { exhibitionId });
    }
    
    console.log('[Exhibition] Starting soon:', name);
  }

  private async handleBoothConfirmed(data: any): Promise<void> {
    const { exhibitionId, boothNumber, boothLocation } = data;
    
    if (this.navigation) {
      this.navigation.navigate('Exhibition', { exhibitionId });
    }
    
    console.log('[Exhibition] Booth confirmed:', boothNumber, 'at', boothLocation);
  }

  // ============================================
  // SHIPMENT HANDLERS
  // ============================================

  private async handleShipmentStatusUpdate(data: any): Promise<void> {
    const { shipmentId, trackingNumber, newStatus, location } = data;
    
    if (this.navigation) {
      this.navigation.navigate('ShipmentTracker', { shipmentId, trackingNumber });
    }
    
    console.log('[Shipment] Status update:', newStatus, 'at', location);
  }

  private async handleShipmentDelivered(data: any): Promise<void> {
    const { shipmentId, trackingNumber, deliveryTime } = data;
    
    if (this.navigation) {
      this.navigation.navigate('ShipmentTracker', { shipmentId, trackingNumber });
    }
    
    console.log('[Shipment] Delivered at:', deliveryTime);
    
    // Prompt user to rate delivery
    // Could show rating modal
  }
}

// Export singleton instance
export const phase6NotificationHandler = Phase6NotificationHandler.getInstance();
