'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusVariant = 
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'secondary';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { variant: StatusVariant; label: string }> = {
  // Product statuses
  active: { variant: 'success', label: 'Actif' },
  inactive: { variant: 'secondary', label: 'Inactif' },
  draft: { variant: 'secondary', label: 'Brouillon' },
  published: { variant: 'success', label: 'Publié' },
  archived: { variant: 'secondary', label: 'Archivé' },
  
  // Quotation statuses
  DRAFT: { variant: 'secondary', label: 'Brouillon' },
  SENT: { variant: 'info', label: 'Envoyé' },
  VIEWED: { variant: 'primary', label: 'Vu' },
  ACCEPTED: { variant: 'success', label: 'Accepté' },
  REJECTED: { variant: 'danger', label: 'Rejeté' },
  EXPIRED: { variant: 'secondary', label: 'Expiré' },
  
  // Order statuses
  PENDING: { variant: 'warning', label: 'En attente' },
  CONFIRMED: { variant: 'info', label: 'Confirmé' },
  PROCESSING: { variant: 'warning', label: 'En cours' },
  SHIPPED: { variant: 'primary', label: 'Expédié' },
  DELIVERED: { variant: 'success', label: 'Livré' },
  CANCELLED: { variant: 'danger', label: 'Annulé' },
  COMPLETED: { variant: 'success', label: 'Terminé' },
  
  // RFQ statuses
  DRAFT: { variant: 'secondary', label: 'Brouillon' },
  PUBLISHED: { variant: 'info', label: 'Publié' },
  QUOTATIONS_RECEIVED: { variant: 'primary', label: 'Devis reçus' },
  NEGOTIATION: { variant: 'warning', label: 'Négociation' },
  AWARDED: { variant: 'success', label: 'Attribué' },
  CLOSED: { variant: 'secondary', label: 'Fermé' },
  CANCELLED: { variant: 'danger', label: 'Annulé' },
  
  // Verification statuses
  PENDING: { variant: 'warning', label: 'En attente' },
  VERIFIED: { variant: 'success', label: 'Vérifié' },
  REJECTED: { variant: 'danger', label: 'Rejeté' },
  SUSPENDED: { variant: 'danger', label: 'Suspendu' },
};

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-blue-100 text-blue-700 border-blue-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  secondary: 'bg-gray-100 text-gray-600 border-gray-200',
};

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1',
};

export function StatusBadge({ 
  status, 
  variant, 
  className,
  size = 'md' 
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    variant: variant || 'default',
    label: status,
  };

  const appliedVariant = variant || config.variant;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border capitalize whitespace-nowrap',
        variantStyles[appliedVariant],
        sizeStyles[size],
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          appliedVariant === 'success' && 'bg-green-500',
          appliedVariant === 'warning' && 'bg-yellow-500',
          appliedVariant === 'danger' && 'bg-red-500',
          appliedVariant === 'info' && 'bg-cyan-500',
          appliedVariant === 'primary' && 'bg-blue-500',
          (appliedVariant === 'default' || appliedVariant === 'secondary') && 'bg-gray-400'
        )}
      />
      {config.label}
    </Badge>
  );
}

// Order status specific badge with more visual distinction
export function OrderStatusBadge({ status, className }: Omit<StatusBadgeProps, 'variant'>) {
  const orderConfig: Record<string, { color: string; bg: string; icon: string }> = {
    PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⏳' },
    CONFIRMED: { color: 'text-blue-700', bg: 'bg-blue-100', icon: '✓' },
    PROCESSING: { color: 'text-orange-700', bg: 'bg-orange-100', icon: '⚙' },
    SHIPPED: { color: 'text-purple-700', bg: 'bg-purple-100', icon: '🚚' },
    DELIVERED: { color: 'text-green-700', bg: 'bg-green-100', icon: '📦' },
    CANCELLED: { color: 'text-red-700', bg: 'bg-red-100', icon: '✕' },
    COMPLETED: { color: 'text-green-700', bg: 'bg-green-100', icon: '✓' },
  };

  const config = orderConfig[status] || { color: 'text-gray-700', bg: 'bg-gray-100', icon: '•' };
  const label = statusConfig[status]?.label || status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.bg,
        config.color,
        className
      )}
    >
      <span>{config.icon}</span>
      {label}
    </span>
  );
}
