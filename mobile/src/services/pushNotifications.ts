// Push Notification Service for AlgeriaTrade
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationData {
  title: string;
  body: string;
  type?: 'rfq' | 'message' | 'order' | 'promotion' | 'system';
  data?: Record<string, string>;
}

export interface NotificationSubscription {
  topic: string;
  subscribedAt: number;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private token: string | null = null;
  private messageHandler: ((message: FirebaseMessagingTypes.RemoteMessage) => void) | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Request permission
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
          await AsyncStorage.setItem('notification_permission', 'granted');
        }
        return enabled;
      }

      // Android 13+ requires runtime permission
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        
        if (isGranted) {
          await AsyncStorage.setItem('notification_permission', 'granted');
        }
        return isGranted;
      }

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // Check if permission is granted
  async checkPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch {
      return false;
    }
  }

  // Get FCM token
  async getToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      // Check cached token first
      if (!forceRefresh && this.token) {
        return this.token;
      }

      const cachedToken = await AsyncStorage.getItem('fcm_token');
      if (!forceRefresh && cachedToken) {
        this.token = cachedToken;
        return cachedToken;
      }

      // Check if user has authorized
      const enabled = await this.checkPermission();
      if (!enabled) {
        const granted = await this.requestPermission();
        if (!granted) {
          console.log('Notification permission not granted');
          return null;
        }
      }

      // Get new token
      const token = await messaging().getToken();
      
      if (token) {
        this.token = token;
        await AsyncStorage.setItem('fcm_token', token);
        
        // Send token to server
        await this.sendTokenToServer(token);
      }
      
      return token;
    } catch (error) {
      console.error('FCM token error:', error);
      return null;
    }
  }

  // Listen for foreground messages
  onMessage(callback: (message: NotificationData) => void): () => void {
    this.messageHandler = callback;
    
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const notification: NotificationData = {
        title: remoteMessage.notification?.title || 'Nouvelle notification',
        body: remoteMessage.notification?.body || '',
        type: (remoteMessage.data?.type as NotificationData['type']) || 'system',
        data: remoteMessage.data,
      };
      
      callback(notification);
    });

    return unsubscribe;
  }

  // Handle background/quit state messages
  setBackgroundMessageHandler(): void {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message handled:', remoteMessage.notification?.title);
      // Handle background message - update local storage, etc.
    });
  }

  // Handle notification when app is opened from quit state
  getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    return messaging().getInitialNotification();
  }

  // Subscribe to topic
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      
      // Save subscription locally
      const subscriptions = await this.getSubscriptions();
      subscriptions.push({ topic, subscribedAt: Date.now() });
      await AsyncStorage.setItem('notification_subscriptions', JSON.stringify(subscriptions));
      
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Subscribe to topic error:', error);
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      
      // Remove subscription locally
      let subscriptions = await this.getSubscriptions();
      subscriptions = subscriptions.filter(s => s.topic !== topic);
      await AsyncStorage.setItem('notification_subscriptions', JSON.stringify(subscriptions));
      
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Unsubscribe from topic error:', error);
    }
  }

  // Get all subscriptions
  async getSubscriptions(): Promise<NotificationSubscription[]> {
    try {
      const subs = await AsyncStorage.getItem('notification_subscriptions');
      return subs ? JSON.parse(subs) : [];
    } catch {
      return [];
    }
  }

  // Subscribe to AlgeriaTrade default topics
  async subscribeToDefaultTopics(userId?: string): Promise<void> {
    const defaultTopics = ['all_users', 'promotions', 'updates'];
    
    for (const topic of defaultTopics) {
      await this.subscribeToTopic(topic);
    }

    // User-specific topics
    if (userId) {
      await this.subscribeToTopic(`user_${userId}`);
    }
  }

  // Unsubscribe from all topics
  async unsubscribeFromAllTopics(): Promise<void> {
    const subscriptions = await this.getSubscriptions();
    
    for (const { topic } of subscriptions) {
      try {
        await messaging().unsubscribeFromTopic(topic);
      } catch (error) {
        console.error(`Error unsubscribing from ${topic}:`, error);
      }
    }
    
    await AsyncStorage.removeItem('notification_subscriptions');
  }

  // Send token to backend server
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // TODO: Implement actual API call
      // Example:
      // const apiService = ApiService.getInstance();
      // await apiService.post('/notifications/register', { 
      //   fcmToken: token,
      //   platform: Platform.OS,
      // });
      console.log('FCM Token registered:', token.substring(0, 10) + '...');
      await AsyncStorage.setItem('fcm_token_registered', 'true');
    } catch (error) {
      console.error('Token registration failed:', error);
      await AsyncStorage.setItem('fcm_token_registered', 'false');
    }
  }

  // Delete token (on logout)
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      this.token = null;
      await AsyncStorage.removeItem('fcm_token');
      await AsyncStorage.removeItem('fcm_token_registered');
      
      // Unsubscribe from user-specific topics
      await this.unsubscribeFromAllTopics();
    } catch (error) {
      console.error('Delete token error:', error);
    }
  }

  // Get token registration status
  async isTokenRegistered(): Promise<boolean> {
    const registered = await AsyncStorage.getItem('fcm_token_registered');
    return registered === 'true';
  }

  // Create notification channel (Android)
  async createChannel(
    channelId: string,
    name: string,
    description: string,
    importance: 'high' | 'default' | 'low' | 'min' = 'high'
  ): Promise<void> {
    if (Platform.OS === 'android') {
      await messaging().createNotificationChannel({
        id: channelId,
        name,
        description,
        importance: importance === 'high' ? messaging.Android.Importance.HIGH :
                     importance === 'default' ? messaging.Android.Importance.DEFAULT :
                     importance === 'low' ? messaging.Android.Importance.LOW :
                     messaging.Android.Importance.MIN,
      });
    }
  }

  // Create default channels for AlgeriaTrade
  async createDefaultChannels(): Promise<void> {
    await this.createChannel(
      'rfq_alerts',
      'Alertes AO',
      'Notifications pour les nouvelles demandes de devis'
    );
    
    await this.createChannel(
      'messages',
      'Messages',
      'Notifications pour les nouveaux messages'
    );
    
    await this.createChannel(
      'orders',
      'Commandes',
      'Notifications pour les mises à jour des commandes'
    );
    
    await this.createChannel(
      'promotions',
      'Promotions',
      'Offres spéciales et promotions'
    );
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

// React hook for notifications
import { useEffect, useRef, useCallback } from 'react';

export function usePushNotifications(onNotification?: (data: NotificationData) => void) {
  const serviceRef = useRef(pushNotificationService);
  const [isInitialized, setIsInitialized] = useState(false);

  const initialize = useCallback(async () => {
    const service = serviceRef.current;
    
    // Request permission
    const hasPermission = await service.requestPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      setIsInitialized(true);
      return;
    }

    // Get token
    await service.getToken();

    // Set up background handler
    service.setBackgroundMessageHandler();

    // Create default channels
    await service.createDefaultChannels();

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    initialize();

    let unsubscribe: (() => void) | undefined;

    if (onNotification) {
      unsubscribe = serviceRef.current.onMessage(onNotification);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialize, onNotification]);

  return {
    isInitialized,
    subscribeToTopic: serviceRef.current.subscribeToTopic.bind(serviceRef.current),
    unsubscribeFromTopic: serviceRef.current.unsubscribeFromTopic.bind(serviceRef.current),
  };
}

// Need to add useState import
import { useState } from 'react';
