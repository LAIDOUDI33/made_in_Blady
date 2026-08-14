'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'COMPLETED';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  isActive: boolean;
  date?: string;
  trackingNumber?: string;
}

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  orderDate?: string;
  trackingNumber?: string;
  shippedDate?: string;
  deliveredDate?: string;
  completedDate?: string;
  className?: string;
}

const statusOrder: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED'
];

const statusConfig: Record<OrderStatus, { label: string; description: string; icon: string }> = {
  PENDING: {
    label: 'Commande créée',
    description: 'Votre commande a été enregistrée',
    icon: '📝'
  },
  CONFIRMED: {
    label: 'Confirmée par le fournisseur',
    description: 'Le fournisseur a accepté votre commande',
    icon: '✓'
  },
  PROCESSING: {
    label: 'En préparation',
    description: 'Votre commande est en cours de préparation',
    icon: '⚙️'
  },
  SHIPPED: {
    label: 'Expédiée',
    description: 'Votre commande a été expédiée',
    icon: '🚚'
  },
  DELIVERED: {
    label: 'Livrée',
    description: 'Votre commande a été livrée',
    icon: '📦'
  },
  COMPLETED: {
    label: 'Terminée',
    description: 'La commande est complétée avec succès',
    icon: '✅'
  },
  CANCELLED: {
    label: 'Annulée',
    description: 'La commande a été annulée',
    icon: '✕'
  }
};

export function OrderTimeline({
  currentStatus,
  orderDate,
  trackingNumber,
  shippedDate,
  deliveredDate,
  completedDate,
  className
}: OrderTimelineProps) {
  // If cancelled, show special state
  if (currentStatus === 'CANCELLED') {
    return (
      <Card className={cn('border-red-200 bg-red-50/50', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-red-800 flex items-center gap-2">
            <span>✕</span>
            Commande Annulée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            Cette commande a été annulée.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build timeline steps
  const steps: TimelineStep[] = statusOrder.map((status) => {
    const config = statusConfig[status];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(status);
    
    return {
      status,
      ...config,
      isCompleted: stepIndex < currentIndex,
      isActive: stepIndex === currentIndex,
      date: getStatusDate(status, orderDate, shippedDate, deliveredDate, completedDate),
      trackingNumber: status === 'SHIPPED' ? trackingNumber : undefined
    };
  });

  // Only show up to current status + 1 for future steps
  const visibleSteps = steps.filter((_, index) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    return index <= currentIndex + 1;
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Suivi de la Commande</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-200" />
          
          <div className="space-y-0">
            {visibleSteps.map((step, index) => (
              <div key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Circle indicator */}
                <div
                  className={cn(
                    'relative z-10 h-10 w-10 rounded-full flex items-center justify-center text-lg border-2 flex-shrink-0 transition-all',
                    step.isCompleted && 'bg-green-500 border-green-500 text-white',
                    step.isActive && 'bg-white border-green-500 text-green-500 scale-110 shadow-md',
                    !step.isCompleted && !step.isActive && 'bg-gray-100 border-gray-300 text-gray-400'
                  )}
                >
                  {step.isCompleted ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn(
                        'font-medium',
                        step.isActive ? 'text-green-600' : step.isCompleted ? 'text-gray-900' : 'text-gray-500'
                      )}>
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                      
                      {step.trackingNumber && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
                          <span className="text-blue-600 font-medium">Numéro de suivi: </span>
                          <span className="font-mono text-blue-800">{step.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                    
                    {step.date && (
                      <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
                        {new Date(step.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  
                  {step.isActive && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      En cours...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get date for each status
function getStatusDate(
  status: OrderStatus,
  orderDate?: string,
  shippedDate?: string,
  deliveredDate?: string,
  completedDate?: string
): string | undefined {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':
      return orderDate;
    case 'PROCESSING':
      return orderDate; // Would be different in real app
    case 'SHIPPED':
      return shippedDate || orderDate;
    case 'DELIVERED':
      return deliveredDate || shippedDate;
    case 'COMPLETED':
      return completedDate || deliveredDate;
    default:
      return undefined;
  }
}

// Compact version for use in tables/cards
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  
  if (!config) return null;

  const colorClasses: Record<OrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
    PROCESSING: 'bg-orange-100 text-orange-700 border-orange-200',
    SHIPPED: 'bg-purple-100 text-purple-700 border-purple-200',
    DELIVERED: 'bg-green-100 text-green-700 border-green-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      colorClasses[status]
    )}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
