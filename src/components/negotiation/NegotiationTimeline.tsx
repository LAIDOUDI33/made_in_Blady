'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRightLeft,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import type { NegotiationOfferRecord } from '@/lib/negotiation/engine';

interface NegotiationTimelineProps {
  offers: NegotiationOfferRecord[];
  currentUserId?: string;
  language?: 'en' | 'ar' | 'fr';
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string; labelAr: string; labelFr: string }> = {
  PENDING: { 
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
    icon: <Clock className="h-4 w-4" />,
    label: 'Pending', 
    labelAr: 'معلق', 
    labelFr: 'En attente' 
  },
  ACCEPTED: { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Accepted', 
    labelAr: 'مقبول', 
    labelFr: 'Accepté' 
  },
  REJECTED: { 
    color: 'bg-red-100 text-red-700 border-red-200', 
    icon: <XCircle className="h-4 w-4" />,
    label: 'Rejected', 
    labelAr: 'مرفوض', 
    labelFr: 'Rejeté' 
  },
  COUNTERED: { 
    color: 'bg-orange-100 text-orange-700 border-orange-200', 
    icon: <ArrowRightLeft className="h-4 w-4" />,
    label: 'Countered', 
    labelAr: 'تم الرد المضاد', 
    labelFr: 'Contre-offre' 
  },
  WITHDRAWN: { 
    color: 'bg-gray-100 text-gray-600 border-gray-200', 
    icon: <XCircle className="h-4 w-4" />,
    label: 'Withdrawn', 
    labelAr: 'مسحوب', 
    labelFr: 'Retiré' 
  },
  EXPIRED: { 
    color: 'bg-slate-100 text-slate-500 border-slate-200', 
    icon: <Clock className="h-4 w-4" />,
    label: 'Expired', 
    labelAr: 'منتهي الصلاحية', 
    labelFr: 'Expiré' 
  },
};

export function NegotiationTimeline({
  offers,
  currentUserId,
  language = 'en',
}: NegotiationTimelineProps) {
  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!offers || offers.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            {getLabel('Negotiation History', 'تاريخ المفاوضات', 'Historique des négociations')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{getLabel('No offers yet', 'لا توجد عروض بعد', 'Pas encore d\'offres')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            {getLabel('Negotiation Timeline', 'الجدول الزمني للمفاوضات', 'Chronologie des négociations')}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {offers.length} {getLabel('offers', 'عرض', 'offres')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Offers */}
          <div className="space-y-6">
            {offers.map((offer, index) => {
              const status = statusConfig[offer.status] || statusConfig.PENDING;
              const isFromCurrentUser = offer.fromUserId === currentUserId;

              return (
                <div key={offer.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${status.color}`}>
                    {status.icon}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-2 ${index < offers.length - 1 ? '' : ''}`}>
                    <div className={`rounded-lg p-4 border ${
                      isFromCurrentUser 
                        ? 'bg-primary/5 border-primary/20 ml-0 mr-8' 
                        : 'bg-muted/50 border-border ml-0 mr-8'
                    }`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className={`h-4 w-4 ${isFromCurrentUser ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`font-medium text-sm ${isFromCurrentUser ? 'text-primary' : ''}`}>
                            {isFromCurrentUser 
                              ? getLabel('Your Offer', 'عرضك', 'Votre offre')
                              : getLabel('Their Offer', 'عرضهم', 'Leur offre')
                            }
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{index + 1}
                          </span>
                        </div>
                        <Badge className={`${status.color} text-xs`}>
                          {getLabel(status.label, status.labelAr, status.labelFr)}
                        </Badge>
                      </div>

                      {/* Price */}
                      {offer.price !== null && offer.price !== undefined && (
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-foreground">
                            {offer.price.toLocaleString()} د.ج
                          </span>
                        </div>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        {offer.quantity !== null && offer.quantity !== undefined && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">{getLabel('Qty', 'الكمية', 'Qté')}:</span>{' '}
                            <span className="font-medium">{offer.quantity}</span>
                          </div>
                        )}
                        {offer.deliveryDate && (
                          <div className="text-xs flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{getLabel('Delivery', 'التسليم', 'Livraison')}:</span>{' '}
                            <span className="font-medium">{new Date(offer.deliveryDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {offer.paymentTerms && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">{getLabel('Payment', 'الدفع', 'Paiement')}:</span>{' '}
                            <span className="font-medium">{offer.paymentTerms.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Message */}
                      {offer.message && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-xs italic text-muted-foreground">
                          &ldquo;{offer.message}&rdquo;
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-3 pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(new Date(offer.createdAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NegotiationTimeline;
