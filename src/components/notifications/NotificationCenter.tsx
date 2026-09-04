'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Settings,
  Package,
  MessageSquare,
  CreditCard,
  AlertCircle,
  Tag,
  FileText,
  Truck,
  Shield,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Notification, 
  NotificationCategory, 
  getUnreadCount, 
  markAsRead,
  markAllAsRead 
} from '@/lib/notifications/notification-center';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onSettingsClick?: () => void;
  className?: string;
}

// Category icons mapping
const CATEGORY_ICONS: Record<NotificationCategory, React.ReactNode> = {
  order: <Package className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  system: <AlertCircle className="h-4 w-4" />,
  promotion: <Tag className="h-4 w-4" />,
  rfq: <FileText className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  shipping: <Truck className="h-4 w-4" />,
  verification: <Shield className="h-4 w-4" />
};

// Category labels in French
const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  order: 'Commande',
  message: 'Message',
  payment: 'Paiement',
  system: 'Système',
  promotion: 'Promotion',
  rfq: 'Demande de devis',
  contract: 'Contrat',
  shipping: 'Livraison',
  verification: 'Vérification'
};

// Priority colors
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onSettingsClick,
  className = ''
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);
  const unreadCount = getUnreadCount(localNotifications);

  // Sync external notifications with local state
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    setLocalNotifications(prev => 
      prev.map(n => n.id === notificationId ? markAsRead(n) : n)
    );
    onMarkAsRead?.(notificationId);
  }, [onMarkAsRead]);

  const handleMarkAllAsRead = useCallback(() => {
    setLocalNotifications(markAllAsRead(localNotifications));
    onMarkAllAsRead?.();
  }, [localNotifications, onMarkAllAsRead]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.readAt) {
      handleMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  }, [handleMarkAsRead, onNotificationClick]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Sort notifications: unread first, then by date
  const sortedNotifications = [...localNotifications].sort((a, b) => {
    if (a.readAt && !b.readAt) return 1;
    if (!a.readAt && b.readAt) return -1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Render notification item
  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.id}
      className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
        !notification.readAt ? 'bg-primary/5' : ''
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          !notification.readAt ? 'bg-primary/10' : 'bg-muted'
        }`}>
          <div className={`${
            !notification.readAt ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {CATEGORY_ICONS[notification.category]}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium line-clamp-2 ${
              !notification.readAt ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {notification.title}
            </p>
            {!notification.readAt && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(notification.createdAt)}
            </span>
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {PRIORITY_COLORS[notification.priority]}
              {' '}
              {CATEGORY_LABELS[notification.category]}
            </Badge>
          </div>
          {notification.actionUrl && (
            <div className="mt-2">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                {notification.actionLabel || 'Voir les détails'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {!notification.readAt && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkAsRead(notification.id);
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  // Render notification content (shared between desktop and mobile)
  const renderContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout lire
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {sortedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">Aucune notification</p>
            <p className="text-xs mt-1">Vous serez notifié ici des nouvelles activités</p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedNotifications.map(renderNotificationItem)}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button variant="outline" className="w-full">
          Voir toutes les notifications
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Dropdown */}
      <div className={`hidden md:block ${className}`}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0">
            {renderContent()}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: Sheet */}
      <div className={`md:hidden ${className}`}>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            {renderContent()}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

// Export sub-components
export { CATEGORY_ICONS, CATEGORY_LABELS, PRIORITY_COLORS };
export type { Notification, NotificationCategory };
