'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Check, X, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface PushNotificationManagerProps {
  className?: string;
  compact?: boolean;
}

interface NotificationPreferences {
  rfqUpdates: boolean;
  newMessages: boolean;
  orderUpdates: boolean;
  priceAlerts: boolean;
  promotions: boolean;
}

export function PushNotificationManager({ 
  className = '', 
  compact = false 
}: PushNotificationManagerProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    rfqUpdates: true,
    newMessages: true,
    orderUpdates: true,
    priceAlerts: false,
    promotions: false
  });
  const [testResult, setTestResult] = useState<string | null>(null);

  // Check support and current status
  useEffect(() => {
    checkSupport();
    loadPreferences();
  }, []);

  const checkSupport = async () => {
    // Check if all required APIs are available
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window;
    
    setIsSupported(supported);

    if (supported) {
      setPermissionStatus(Notification.permission);
      
      // Check existing subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.log('[PWA] Could not check push subscription:', error);
      }
    }
  };

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('notification-preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.log('[PWA] Could not load notification preferences');
    }
  };

  const savePreferences = (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('notification-preferences', JSON.stringify(newPrefs));
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        return false;
      }

      // Register service worker and subscribe to push
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
          'BDd1d8gMAwGxUPjx_5cXvRJFfXRH2Rz7wK0Y0v8Q3kL6N9pP2sT5uV8wX1yZ4aB'
        )
      });

      // Send subscription to server
      await sendSubscriptionToServer(subscription);
      
      setIsSubscribed(true);
      
      // Track event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'push_notification_enabled', {
          event_category: 'PWA',
          event_label: 'notification_subscribed',
        });
      }

      return true;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        await removeSubscriptionFromServer(subscription);
      }

      setIsSubscribed(false);
      
      // Track event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'push_notification_disabled', {
          event_category: 'PWA',
          event_label: 'notification_unsubscribed',
        });
      }
    } catch (error) {
      console.error('[PWA] Unsubscribe failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          preferences
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('[PWA] Failed to send subscription to server:', error);
    }
  };

  const removeSubscriptionFromServer = async (subscription: PushSubscription) => {
    try {
      await fetch('/api/notifications/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
    } catch (error) {
      console.error('[PWA] Failed to remove subscription from server:', error);
    }
  };

  const testNotification = async () => {
    setTestResult(null);

    if (permissionStatus !== 'granted') {
      setTestResult('Permission non accordée');
      return;
    }

    try {
      // Send test notification via service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Show a local notification for testing
      const title = 'AlgeriaTrade - Test de notification';
      const options: NotificationOptions = {
        body: 'Ceci est un message de test. Les notifications fonctionnent correctement !',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification',
        data: { url: '/' },
        actions: [
          { action: 'open', title: 'Ouvrir' },
          { action: 'dismiss', title: 'Fermer' }
        ]
      };

      registration.showNotification(title, options);
      setTestResult('Notification envoyée ✓');
      
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('[PWA] Test notification failed:', error);
      setTestResult('Échec de l\'envoi');
    }
  };

  // Compact mode - just a toggle button
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-green-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">Notifications</span>
        </div>
        
        <Switch
          checked={isSubscribed}
          onCheckedChange={(checked) => checked ? requestPermission() : unsubscribe()}
          disabled={!isSupported || isLoading}
        />
        
        {!isSupported && (
          <Badge variant="secondary" className="text-xs">
            Non supporté
          </Badge>
        )}
      </div>
    );
  }

  // Full settings card
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications Push
          </CardTitle>
          
          {isSubscribed && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">
              Activées
            </Badge>
          )}
          
          {permissionStatus === 'denied' && (
            <Badge variant="destructive">
              Bloquées
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium">Recevoir les notifications</p>
            <p className="text-sm text-gray-500">
              {isSubscribed 
                ? 'Vous recevrez des alertes en temps réel'
                : !isSupported
                  ? 'Votre navigateur ne supporte pas les notifications push'
                  : 'Activez pour rester informé'
              }
            </p>
          </div>
          
          <Button
            onClick={() => isSubscribed ? unsubscribe() : requestPermission()}
            disabled={!isSupported || isLoading}
            variant={isSubscribed ? "outline" : "default"}
            className={`${
              isSubscribed 
                ? 'border-red-300 text-red-600 hover:bg-red-50' 
                : 'bg-[#006233] hover:bg-[#004d28]'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : isSubscribed ? (
              <BellOff className="w-4 h-4 mr-2" />
            ) : (
              <Bell className="w-4 h-4 mr-2" />
            )}
            {isLoading 
              ? 'Chargement...' 
              : isSubscribed 
                ? 'Désactiver' 
                : 'Activer'
            }
          </Button>
        </div>

        {/* Preferences (only shown when subscribed) */}
        {isSubscribed && (
          <>
            <div className="border-t pt-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Préférences de notification
                </span>
                <X className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
              </button>

              {showSettings && (
                <div className="mt-4 space-y-3">
                  <PreferenceToggle
                    label="Mises à jour des appels d'offres"
                    description="Nouvelles réponses à vos AO"
                    checked={preferences.rfqUpdates}
                    onChange={(checked) => savePreferences({ ...preferences, rfqUpdates: checked })}
                  />
                  <PreferenceToggle
                    label="Nouveaux messages"
                    description="Messages reçus de fournisseurs"
                    checked={preferences.newMessages}
                    onChange={(checked) => savePreferences({ ...preferences, newMessages: checked })}
                  />
                  <PreferenceToggle
                    label="Suivi des commandes"
                    description="Changements de statut de commande"
                    checked={preferences.orderUpdates}
                    onChange={(checked) => savePreferences({ ...preferences, orderUpdates: checked })}
                  />
                  <PreferenceToggle
                    label="Alertes de prix"
                    description="Baisses de prix sur vos produits suivis"
                    checked={preferences.priceAlerts}
                    onChange={(checked) => savePreferences({ ...preferences, priceAlerts: checked })}
                  />
                  <PreferenceToggle
                    label="Promotions et offres"
                    description="Offres spéciales des fournisseurs"
                    checked={preferences.promotions}
                    onChange={(checked) => savePreferences({ ...preferences, promotions: checked })}
                  />
                </div>
              )}
            </div>

            {/* Test button */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={testNotification}
                className="w-full"
              >
                Envoyer une notification de test
              </Button>
              
              {testResult && (
                <p className={`text-sm mt-2 text-center ${
                  testResult.includes('✓') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {testResult}
                </p>
              )}
            </div>
          </>
        )}

        {/* Browser instructions for denied permission */}
        {permissionStatus === 'denied' && (
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              Les notifications sont bloquées dans votre navigateur.
            </p>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Cliquez sur l'icône 🔒 dans la barre d'adresse</li>
              <li>Cherchez &quot;Notifications&quot; dans les paramètres</li>
              <li>Changez le paramètre à &quot;Autoriser&quot;</li>
              <li>Rechargez cette page</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Preference Toggle Sub-component
function PreferenceToggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer group">
      <div className="flex-1">
        <p className="text-sm font-medium group-hover:text-[#006233] transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0 mt-0.5"
      />
    </label>
  );
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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

export default PushNotificationManager;
