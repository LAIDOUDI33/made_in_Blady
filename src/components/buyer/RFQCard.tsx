'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  FileText,
  Eye,
  Edit3,
  Copy,
  XCircle,
  MoreVertical,
  MapPin,
  Calendar,
  Package
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RFQCardData {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit?: string;
  category?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'QUOTATIONS_RECEIVED' | 'NEGOTIATION' | 'AWARDED' | 'CLOSED' | 'CANCELLED';
  deliveryLocation?: string;
  requiredDeliveryDate?: string;
  expirationDate?: string;
  quotationsCount: number;
  createdAt: string;
}

interface RFQCardProps {
  rfq: RFQCardData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onClose?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function RFQCard({
  rfq,
  onView,
  onEdit,
  onDuplicate,
  onClose,
  onDelete,
  showActions = true,
}: RFQCardProps) {
  const isEditable = rfq.status === 'DRAFT' || rfq.status === 'PUBLISHED';
  const isClosable = ['PUBLISHED', 'QUOTATIONS_RECEIVED', 'NEGOTIATION'].includes(rfq.status);

  return (
    <Card className={cn(
      'hover:shadow-md transition-all duration-200',
      rfq.status === 'CANCELLED' && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link 
                    href={`/dashboard/buyer/rfqs/${rfq.id}`}
                    className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-1"
                  >
                    {rfq.title}
                  </Link>
                  <StatusBadge status={rfq.status} size="sm" />
                </div>
                
                {rfq.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {rfq.description}
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-gray-400" />
                <span>{rfq.quantity.toLocaleString('fr-DZ')} {rfq.unit || 'unités'}</span>
              </div>
              
              {rfq.deliveryLocation && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{rfq.deliveryLocation}</span>
                </div>
              )}
              
              {rfq.requiredDeliveryDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Livraison: {new Date(rfq.requiredDeliveryDate).toLocaleDateString('fr-FR')}</span>
                </div>
              )}

              {rfq.category && (
                <Badge variant="outline" className="text-xs">
                  {rfq.category}
                </Badge>
              )}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{rfq.quotationsCount > 0 ? `${rfq.quotationsCount} devis reçus` : 'Aucun devis'}</span>
                <span>Créé le {new Date(rfq.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>

              {showActions && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onView?.(rfq.id)}
                    asChild
                  >
                    <Link href={`/dashboard/buyer/rfqs/${rfq.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isEditable && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit?.(rfq.id)} className="cursor-pointer">
                            <Edit3 className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate?.(rfq.id)} className="cursor-pointer">
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {isClosable && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onClose?.(rfq.id)}
                            className="cursor-pointer text-orange-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Fermer l&apos;AO
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {(rfq.status === 'DRAFT' || rfq.status === 'CANCELLED') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete?.(rfq.id)}
                            className="cursor-pointer text-red-600"
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// RFQ List Card for the list view (more compact)
export function RFQListCard({ rfq, ...props }: RFQCardProps) {
  return <RFQCard {...props} rfq={rfq} />;
}
