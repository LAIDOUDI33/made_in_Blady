'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  UserPlus, 
  Building2, 
  AlertTriangle, 
  ShoppingCart,
  Star,
  MessageSquare,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActivityType = 
  | 'user_registered'
  | 'company_pending'
  | 'company_verified'
  | 'product_reported'
  | 'order_created'
  | 'review_posted'
  | 'message_flagged';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  actionUrl?: string;
}

const activityConfig: Record<ActivityType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  user_registered: {
    icon: <UserPlus className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  company_pending: {
    icon: <Building2 className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  company_verified: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  product_reported: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  order_created: {
    icon: <ShoppingCart className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  review_posted: {
    icon: <Star className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  message_flagged: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'company_pending',
    title: 'Nouvelle entreprise en attente',
    description: 'SARL Technologie Algerienne a soumis une demande de vérification',
    userName: 'Karim Meziani',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    actionUrl: '/admin/companies?status=PENDING',
  },
  {
    id: '2',
    type: 'product_reported',
    title: 'Produit signalé',
    description: '"Composants électroniques" signalé pour contenu suspect',
    userName: 'Système',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    actionUrl: '/admin/products?status=REPORTED',
  },
  {
    id: '3',
    type: 'user_registered',
    title: 'Nouvel utilisateur inscrit',
    description: 'Ahmed Benali a créé un compte acheteur',
    userName: 'Ahmed Benali',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    actionUrl: '/admin/users',
  },
  {
    id: '4',
    type: 'order_created',
    title: 'Nouvelle commande',
    description: 'Commande #12345 de 250 000 DZD créée',
    userName: 'Fatima Zahra',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    actionUrl: '/admin/orders',
  },
  {
    id: '5',
    type: 'company_verified',
    title: 'Entreprise vérifiée',
    description: 'EURL Industrie Moderne a été vérifiée avec succès',
    userName: 'Admin',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    actionUrl: '/admin/companies?status=VERIFIED',
  },
];

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${diffDays}j`;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  title?: string;
  maxItems?: number;
}

export function ActivityFeed({ 
  activities = sampleActivities, 
  title = 'Activité récente',
  maxItems = 5 
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {activities.length} événements
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {displayActivities.map((activity) => {
            const config = activityConfig[activity.type];
            
            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer",
                  activity.actionUrl && "group"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
                    config.bgColor
                  )}
                >
                  <span className={config.color}>{config.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-gray-200 text-gray-600">
                        {activity.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-400">
                      {activity.userName}
                    </span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Action indicator */}
                {activity.actionUrl && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <span className="text-xs text-green-600 font-medium">Voir →</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {activities.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">Aucune activité récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
