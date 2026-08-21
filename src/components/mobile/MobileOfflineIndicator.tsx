'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { OfflineSyncManager } from '@/lib/pwa/enhancements';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertTriangle,
  X,
  ChevronDown,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ============ Types ============
interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: Date | null;
  failedItems: Array<{ id: string; type: string; retryCount: number }>;
}

interface MobileOfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
  onStatusChange?: (status: SyncStatus) => void;
  className?: string;
}

// ============ Main Offline Indicator Component ============
export function MobileOfflineIndicator({
  position = 'top',
  showDetails = false,
  onStatusChange,
  className,
}: MobileOfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingItems: 0,
    lastSyncTime: null,
    failedItems: [],
  });
  const [showBanner, setShowBanner] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const syncManagerRef = React.useRef<OfflineSyncManager | null>(null);

  // Initialize sync manager
  useEffect(() => {
    if (typeof window !== 'undefined') {
      syncManagerRef.current = OfflineSyncManager.getInstance();
      
      const unsubscribe = syncManagerRef.current.onStatusChange((status) => {
        setSyncStatus(status);
        setIsOnline(status.isOnline);
        onStatusChange?.(status);
        
        // Show banner when going offline
        if (!status.isOnline && !showBanner) {
          setShowBanner(true);
        }
      });

      // Get initial status
      setSyncStatus(syncManagerRef.current.getStatus());
      setIsOnline(navigator.onLine);

      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      
      // Auto-hide online indicator after 3 seconds
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = useCallback(async () => {
    if (syncManagerRef.current) {
      await syncManagerRef.current.syncPendingItems();
    }
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
  };

  // Don't render anything if online and no pending items (unless details shown)
  if (isOnline && !showDetails && syncStatus.pendingItems === 0) {
    return null;
  }

  return (
    <>
      {/* Status Bar - Always visible when there's info to show */}
      <div
        className={cn(
          "fixed left-0 right-0 z-[60]",
          "transition-all duration-300 ease-out",
          position === 'top' ? 'top-0' : 'bottom-20 md:bottom-24',
          "md:hidden",
          className
        )}
      >
        {/* Connection Status Bar */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-2",
            "bg-white/95 backdrop-blur-md border-b border-gray-200",
            "shadow-sm",
            isOnline ? "border-emerald-200" : "border-orange-200"
          )}
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isOnline ? "text-emerald-700" : "text-orange-700"
            )}>
              {isOnline ? 'Connected' : 'Offline'}
            </span>
            
            {syncStatus.isSyncing && (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Pending Items Indicator */}
          {(syncStatus.pendingItems > 0 || syncStatus.failedItems.length > 0) && (
            <button
              onClick={() => setShowSyncPanel(!showSyncPanel)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 min-h-[36px]"
              aria-label="View sync details"
            >
              {syncStatus.pendingItems > 0 && (
                <Badge variant="secondary" className="text-xs h-5">
                  <Clock className="w-3 h-3 mr-1" />
                  {syncStatus.pendingItems} pending
                </Badge>
              )}
              {syncStatus.failedItems.length > 0 && (
                <Badge variant="destructive" className="text-xs h-5">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {syncStatus.failedItems.length} failed
                </Badge>
              )}
              <ChevronDown className={cn(
                "w-4 h-4 text-gray-500 transition-transform",
                showSyncPanel && "rotate-180"
              )} />
            </button>
          )}

          {/* Dismiss button for offline banner */}
          {!isOnline && (
            <button
              onClick={dismissBanner}
              className="p-1 rounded-full hover:bg-gray-100 min-w-[32px] min-h-[32px]"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Expandable Sync Panel */}
        {showSyncPanel && (
          <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Sync Status</h3>
            
            {/* Last Sync Time */}
            {syncStatus.lastSyncTime && (
              <p className="text-xs text-gray-500 mb-3">
                Last synced: {syncStatus.lastSyncTime.toLocaleTimeString()}
              </p>
            )}

            {/* Progress Bar */}
            {syncStatus.isSyncing && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Syncing...</span>
                  <span>{syncStatus.pendingItems} remaining</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, 100 - syncStatus.pendingItems * 10)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Failed Items */}
            {syncStatus.failedItems.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Failed Items</span>
                </div>
                <ul className="space-y-1">
                  {syncStatus.failedItems.slice(0, 3).map((item) => (
                    <li key={item.id} className="text-xs text-red-600 flex items-center gap-2">
                      <span className="truncate">{item.type}</span>
                      <span className="text-red-400">({item.retryCount} retries)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleManualSync}
                disabled={!isOnline || syncStatus.isSyncing}
                className="flex-1 min-h-[40px]"
              >
                {syncStatus.isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
              
              {syncStatus.failedItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[40px]"
                >
                  Retry All
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Offline Banner */}
      {showBanner && !isOnline && (
        <div 
          className={cn(
            "fixed left-0 right-0 z-[70]",
            "bg-gradient-to-r from-orange-500 to-amber-500",
            "px-4 py-3",
            "md:hidden",
            position === 'top' ? 'top-10' : 'bottom-20'
          )}
        >
          <div className="flex items-center gap-3">
            <CloudOff className="w-6 h-6 text-white shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">You're offline</p>
              <p className="text-white/80 text-xs">
                Changes will sync when you reconnect
              </p>
            </div>
            <button
              onClick={dismissBanner}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 min-w-[36px] min-h-[36px]"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Spacer for top positioning */}
      {position === 'top' && (showBanner || showDetails || syncStatus.pendingItems > 0) && (
        <div className="h-10 md:hidden" />
      )}
    </>
  );
}

// ============ Connection Quality Indicator ============
interface ConnectionQualityProps {
  className?: string;
}

export function ConnectionQuality({ className }: ConnectionQualityProps) {
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'unknown'>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('');

  useEffect(() => {
    const connection = (navigator as unknown as { 
      connection?: { 
        effectiveType?: string; 
        downlink?: number; 
        rtt?: number;
      } 
    }).connection;

    if (connection) {
      const updateQuality = () => {
        const downlink = connection.downlink || 0;
        const rtt = connection.rtt || 100;

        if (downlink >= 10 && rtt < 100) {
          setQuality('excellent');
        } else if (downlink >= 5 && rtt < 200) {
          setQuality('good');
        } else if (downlink >= 1.5 && rtt < 300) {
          setQuality('fair');
        } else if (downlink > 0) {
          setQuality('poor');
        }

        setEffectiveType(connection.effectiveType || '');
      };

      updateQuality();

      connection.addEventListener('change', updateQuality);
      return () => connection.removeEventListener('change', updateQuality);
    }
  }, []);

  const qualityConfig = {
    excellent: { color: 'text-emerald-500', bgColor: 'bg-emerald-100', label: 'Excellent' },
    good: { color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Good' },
    fair: { color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: 'Fair' },
    poor: { color: 'text-orange-500', bgColor: 'bg-orange-100', label: 'Poor' },
    unknown: { color: 'text-gray-400', bgColor: 'bg-gray-100', label: 'Unknown' },
  };

  const config = qualityConfig[quality];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        quality === 'excellent' && "bg-emerald-500 animate-pulse",
        quality === 'good' && "bg-blue-500",
        quality === 'fair' && "bg-yellow-500",
        quality === 'poor' && "bg-orange-500 animate-pulse",
        quality === 'unknown' && "bg-gray-300"
      )} />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </span>
      {effectiveType && (
        <span className="text-xs text-gray-400 capitalize">{effectiveType}</span>
      )}
    </div>
  );
}

// ============ Pending Actions Counter ============
interface PendingActionsCounterProps {
  onClick?: () => void;
  className?: string;
}

export function PendingActionsCounter({ onClick, className }: PendingActionsCounterProps) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const manager = OfflineSyncManager.getInstance();
      
      const unsubscribe = manager.onStatusChange((status) => {
        setPendingCount(status.pendingItems);
        setIsSyncing(status.isSyncing);
      });

      setPendingCount(manager.getStatus().pendingItems);

      return () => unsubscribe();
    }
  }, []);

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-amber-50 border border-amber-200",
        "hover:bg-amber-100 transition-colors",
        "min-h-[36px]",
        className
      )}
      aria-label={`${pendingCount} pending actions`}
    >
      {isSyncing ? (
        <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
      ) : (
        <Send className="w-4 h-4 text-amber-600" />
      )}
      <span className="text-sm font-medium text-amber-700">
        {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
      </span>
      
      {pendingCount > 9 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          !
        </span>
      )}
    </button>
  );
}

// ============ Offline Mode Banner Component ============
interface OfflineModeBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
  pendingActions?: number;
  className?: string;
}

export function OfflineModeBanner({
  isVisible,
  onDismiss,
  pendingActions = 0,
  className,
}: OfflineModeBannerProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-20 z-50",
        "bg-slate-900 text-white",
        "px-4 py-3",
        "animate-slide-up",
        "md:hidden",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 max-w-screen-sm mx-auto">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <CloudOff className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Offline Mode</p>
          <p className="text-white/70 text-xs">
            {pendingActions > 0 
              ? `${pendingActions} action${pendingActions > 1 ? 's' : ''} queued`
              : 'Your changes will sync automatically'
            }
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="p-2 rounded-full hover:bg-white/10 shrink-0 min-w-[36px] min-h-[36px]"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============ Sync Progress Component ============
interface SyncProgressProps {
  total: number;
  completed: number;
  currentItem?: string;
  className?: string;
}

export function SyncProgress({ total, completed, currentItem, className }: SyncProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("p-4 bg-white rounded-xl border border-gray-200", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Syncing Data</span>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>
      
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{completed} of {total} items</span>
        {currentItem && (
          <span className="truncate ml-4 max-w-[150px]" title={currentItem}>
            {currentItem}
          </span>
        )}
      </div>
    </div>
  );
}

export default MobileOfflineIndicator;
