/**
 * NotificationCenter Component
 * 
 * Polished notification dropdown with bell icon, badge counter,
 * notification list, and actions.
 * 
 * @module components/NotificationCenter
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Inbox, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface Notification {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string | null;
  actionText?: string | null;
  createdAt: string;
}

type NotificationCategory = 
  | 'AUTH' 
  | 'RFQ' 
  | 'ORDER' 
  | 'MESSAGE' 
  | 'SYSTEM' 
  | 'MARKETING';

interface NotificationCenterProps {
  userId?: string;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

// ============================================
// Category Configuration
// ============================================

const categoryConfig: Record<NotificationCategory, { 
  color: string; 
  bgColor: string; 
  icon: React.ReactNode;
  label: string;
}> = {
  AUTH: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: <span className="text-sm">🔐</span>,
    label: 'Authentification',
  },
  RFQ: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <span className="text-sm">📋</span>,
    label: 'Devis',
  },
  ORDER: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <span className="text-sm">📦</span>,
    label: 'Commandes',
  },
  MESSAGE: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: <span className="text-sm">💬</span>,
    label: 'Messages',
  },
  SYSTEM: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <span className="text-sm">⚙️</span>,
    label: 'Système',
  },
  MARKETING: {
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    icon: <span className="text-sm">📢</span>,
    label: 'Marketing',
  },
};

// ============================================
// Helper Functions
// ============================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

// ============================================
// Main Component
// ============================================

export function NotificationCenter({ userId, onNotificationClick, className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch on open and periodically when open
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
      
      // Poll for updates every 30 seconds while open
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userId, fetchNotifications]);

  // Mark as read handler
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read handler
  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Notification click handler
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      // Mark as read
      fetch(`/api/notifications/${notification.id}/read`, { method: 'PUT' }).catch(console.error);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    // Close popover after click
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
        >
          <Bell className={cn("h-5 w-5 transition-transform", isOpen && "scale-90")} />
          
          {/* Badge */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs font-bold transition-all",
                unreadCount > 99 ? "text-[9px]" : ""
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        align="end" 
        className={cn(
          "w-[380px] p-0",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
        )}
        ref={popoverRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              className="text-xs h-7 gap-1"
            >
              {markingAllRead ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3" />
              )}
              Tout lire
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[350px]">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href="/dashboard/buyer/notifications">
              Voir toutes les notifications
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================
// Notification Item Component
// ============================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (e: React.MouseEvent, id: string) => void;
  onClick: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  const config = categoryConfig[notification.category] || categoryConfig.SYSTEM;

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-primary/5"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
        config.bgColor
      )}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium leading-tight line-clamp-2",
          !notification.isRead ? "text-foreground" : "text-muted-foreground"
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
          
          {notification.actionText && !notification.isRead && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {notification.actionText}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      {!notification.isRead && (
        <button
          onClick={(e) => onMarkAsRead(e, notification.id)}
          className="opacity-0 group-hover:opacity-100 absolute right-2 top-3 p-1 rounded-full hover:bg-background transition-all"
          title="Marquer comme lu"
        >
          <Check className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="font-medium text-sm text-foreground mb-1">
        Aucune notification
      </h4>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
      </p>
    </div>
  );
}

// ============================================
// Export utilities
// ============================================

export { formatRelativeTime, categoryConfig };
export type { Notification, NotificationCategory };
