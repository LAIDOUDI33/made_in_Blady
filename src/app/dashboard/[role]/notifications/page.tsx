/**
 * Notifications Page
 * 
 * Full notification history page with filters, bulk actions,
 * and notification settings quick-access.
 * 
 * @module app/dashboard/[role]/notifications
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  Filter,
  CheckCheck,
  Trash2,
  ExternalLink,
  Inbox,
  Search,
  Loader2,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

type NotificationCategory = 
  | 'AUTH' 
  | 'RFQ' 
  | 'ORDER' 
  | 'MESSAGE' 
  | 'SYSTEM' 
  | 'MARKETING';

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

// ============================================
// Category Configuration
// ============================================

const categoryConfig: Record<NotificationCategory, { 
  color: string; 
  bgColor: string; 
  icon: string;
  label: string;
}> = {
  AUTH: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '🔐',
    label: 'Authentification',
  },
  RFQ: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '📋',
    label: 'Devis',
  },
  ORDER: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '📦',
    label: 'Commandes',
  },
  MESSAGE: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '💬',
    label: 'Messages',
  },
  SYSTEM: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '⚙️',
    label: 'Système',
  },
  MARKETING: {
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    icon: '📢',
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
  if (diffDays === 1) return "hier à " + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Main Page Component
// ============================================

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(filterRead !== 'all' && { isRead: filterRead }),
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotal(data.pagination?.total || 0);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [status, currentPage, filterCategory, filterRead, limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = notifications.map(n => n.id);
    setSelectedIds(new Set(visibleIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Mark as read handlers
  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read?action=read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      for (const id of selectedIds) {
        await fetch(`/api/notifications/${id}/read?action=read`, { method: 'PUT' });
      }
      setNotifications(prev =>
        prev.map(n => selectedIds.has(n.id) ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - selectedIds.size));
      clearSelection();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications?action=read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete handlers
  const handleDeleteSelected = async () => {
    try {
      const ids = Array.from(selectedIds).join(',');
      await fetch(`/api/notifications?action=read&ids=${ids}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setTotal(prev => prev - selectedIds.size);
      clearSelection();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await fetch('/api/notifications?action=all-read', { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => !n.isRead));
      // Recalculate total
      setTotal(notifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error deleting all read:', error);
    }
  };

  // Notification click handler
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Filtered notifications (client-side search)
  const filteredNotifications = searchQuery
    ? notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notifications;

  // Pagination
  const totalPages = Math.ceil(total / limit);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Bell className="h-7 w-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications sont lues'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/settings/notifications">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </a>
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Read Status Filter */}
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="false">Non lues</SelectItem>
                <SelectItem value="true">Lues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleMarkSelectedAsRead}>
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Marquer lu
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer {selectedIds.size} notification{selectedIds.size > 1 ? 's' : ''} ?
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {loading ? 'Chargement...' : `${filteredNotifications.length} notification${filteredNotifications.length > 1 ? 's' : ''}`}
            </CardTitle>
            
            {notifications.some(n => n.isRead) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer les lues
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer toutes les notifications lues ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera définitivement toutes vos notifications lues. 
                      Les notifications non lues seront conservées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllRead}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState hasFilters={filterCategory !== 'all' || filterRead !== 'all' || searchQuery !== ''} />
          ) : (
            <div className="divide-y">
              {/* Select All Header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/50">
                <Checkbox
                  checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onCheckedChange={(checked) => checked ? selectAllVisible() : clearSelection()}
                />
                <span className="text-xs text-muted-foreground">Tout sélectionner</span>
              </div>

              {filteredNotifications.map((notification) => {
                const config = categoryConfig[notification.category] || categoryConfig.SYSTEM;
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group flex items-start gap-4 px-4 py-4 cursor-pointer transition-colors hover:bg-muted/30",
                      !notification.isRead && "bg-primary/5",
                      selectedIds.has(notification.id) && "bg-primary/10"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedIds.has(notification.id)}
                      onCheckedChange={() => toggleSelection(notification.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />

                    {/* Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      config.bgColor
                    )}>
                      <span className="text-lg">{config.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "font-medium line-clamp-1",
                          !notification.isRead ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <Badge variant="default" className="text-[10px] px-1.5 h-4">
                              Nouveau
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        
                        {notification.actionText && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            {notification.actionText}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-background transition-all"
                        title="Marquer comme lu"
                      >
                        <CheckCheck className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Affichage {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, total)} sur {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground mb-2">Aucune notification trouvée</h3>
        <p className="text-sm text-muted-foreground max-w-[300px]">
          Aucune ne correspond à vos critères de recherche actuels.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Inbox className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">Aucune notification</h3>
      <p className="text-sm text-muted-foreground max-w-[300px] mb-4">
        Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
      </p>
      <Button variant="outline" size="sm" asChild>
        <a href="/dashboard">Retour au tableau de bord</a>
      </Button>
    </div>
  );
}
