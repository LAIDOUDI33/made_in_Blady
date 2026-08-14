'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OfflineIndicatorProps {
  className?: string;
  showDetailedStatus?: boolean;
}

interface OfflineAction {
  id: string;
  type: 'rfq' | 'message' | 'form';
  description: string;
  timestamp: Date;
}

export function OfflineIndicator({ 
  className = '', 
  showDetailedStatus = false 
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      
      // Sync pending actions when back online
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for messages from service worker about pending actions
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'pending_action_added') {
        setPendingActions(prev => [...prev, event.data.action]);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Load pending actions from IndexedDB
  useEffect(() => {
    loadPendingActions();
  }, []);

  const loadPendingActions = async () => {
    try {
      if ('indexedDB' in window) {
        const dbRequest = indexedDB.open('AlgeriaTradeDB', 1);
        
        dbRequest.onsuccess = async (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          try {
            const rfqTx = db.transaction('pending_rfqs', 'readonly');
            const rfqStore = rfqTx.objectStore('pending_rfqs');
            const rfqs = await new Promise<OfflineAction[]>((resolve, reject) => {
              const request = rfqStore.getAll();
              request.onsuccess = () => resolve(request.result.map((r: any) => ({
                ...r,
                type: 'rfq' as const,
                description: `Appel d'offres: ${r.data?.title || 'Nouveau'}`,
                timestamp: r.timestamp || new Date()
              })));
              request.onerror = () => reject(request.error);
            });

            const msgTx = db.transaction('pending_messages', 'readonly');
            const msgStore = msgTx.objectStore('pending_messages');
            const messages = await new Promise<OfflineAction[]>((resolve, reject) => {
              const request = msgStore.getAll();
              request.onsuccess = () => resolve(request.result.map((m: any) => ({
                ...m,
                type: 'message' as const,
                description: `Message: ${m.data?.content?.substring(0, 30) || 'Nouveau'}...`,
                timestamp: m.timestamp || new Date()
              })));
              request.onerror = () => reject(request.error);
            });

            setPendingActions([...rfqs, ...messages]);
          } catch (error) {
            console.log('[PWA] No pending actions or DB not ready');
          }
        };
      }
    } catch (error) {
      console.log('[PWA] IndexedDB not available');
    }
  };

  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine || syncing) return;

    setSyncing(true);

    try {
      // Register background sync with service worker
      if ('serviceWorker' in navigator && 'sync' in (window as unknown as Record<string, unknown>).ServiceWorkerRegistration?.prototype) {
        const registration = await navigator.serviceWorker.ready;
        
        if (pendingActions.some(a => a.type === 'rfq')) {
          await registration.sync.register('sync-rfq');
        }
        if (pendingActions.some(a => a.type === 'message')) {
          await registration.sync.register('sync-messages');
        }
      }

      // Clear local state after sync registration
      setTimeout(() => {
        setPendingActions([]);
        setSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('[PWA] Sync failed:', error);
      setSyncing(false);
    }
  }, [pendingActions, syncing]);

  const queueAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setPendingActions(prev => [...prev, newAction]);

    // Store in IndexedDB for persistence
    try {
      if ('indexedDB' in window) {
        const dbRequest = indexedDB.open('AlgeriaTradeDB', 1);
        
        dbRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const storeName = action.type === 'rfq' ? 'pending_rfqs' : 'pending_messages';
          
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.add({
            id: newAction.id,
            data: {},
            timestamp: newAction.timestamp
          });
        };
      }
    } catch (error) {
      console.error('[PWA] Failed to queue action:', error);
    }

    return newAction.id;
  }, []);

  // Compact status indicator (for header)
  if (!showDetailedStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Status dot */}
        <div 
          className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isOnline ? 'En ligne' : 'Hors ligne'}
        />
        
        {/* Pending actions badge */}
        {!isOnline && pendingActions.length > 0 && (
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            {pendingActions.length} en attente
          </Badge>
        )}
        
        {/* Was offline - show reconnected message */}
        {wasOffline && isOnline && (
          <span className="text-xs text-green-600 animate-fade-in">
            Reconnecté ✓
          </span>
        )}
      </div>
    );
  }

  // Full offline banner
  return (
    <>
      {/* Status bar */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isOnline ? 'translate-y-[-100%]' : 'translate-y-0'
      }`}>
        <div className="bg-red-500 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">Vous êtes hors ligne</p>
                <p className="text-xs opacity-90">Certaines fonctionnalités sont limitées</p>
              </div>
            </div>
            
            {pendingActions.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {pendingActions.length} action(s) en attente
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reconnection banner */}
      {wasOffline && isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-green-500 text-white px-4 py-3 animate-slide-down">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5" />
              <p className="font-semibold text-sm">Connexion rétablie</p>
            </div>
            
            {pendingActions.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={syncPendingActions}
                disabled={syncing}
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Synchronisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Synchroniser ({pendingActions.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Floating offline indicator for mobile */}
      {!isOnline && (
        <div className={`fixed bottom-20 left-4 z-50 ${className}`}>
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse-slow">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Hors ligne</span>
            {pendingActions.length > 0 && (
              <span className="bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {pendingActions.length}
              </span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
      `}</style>
    </>
  );
}

// Hook for using offline functionality in components
export function useOfflineActions() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueOfflineAction = useCallback(async (type: 'rfq' | 'message' | 'form', data: any) => {
    if (!isOnline) {
      try {
        const dbRequest = indexedDB.open('AlgeriaTradeDB', 1);
        
        dbRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const storeName = type === 'rfq' ? 'pending_rfqs' : type === 'message' ? 'pending_messages' : 'pending_forms';
          
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.add({
            id: `${type}_${Date.now()}`,
            data,
            timestamp: new Date()
          });
          
          setPendingCount(prev => prev + 1);
        };

        return true; // Queued successfully
      } catch (error) {
        console.error('[PWA] Failed to queue action:', error);
        return false;
      }
    }
    
    return false; // Online, no need to queue
  }, [isOnline]);

  return {
    isOnline,
    pendingCount,
    queueOfflineAction
  };
}

export default OfflineIndicator;
