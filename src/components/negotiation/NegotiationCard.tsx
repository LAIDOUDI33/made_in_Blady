'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  MessageSquare, 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  TrendingUp,
  Eye
} from 'lucide-react';
import type { Negotiation, NegotiationStatus } from '@/lib/negotiation';

// Status configuration with colors and translations
const statusConfig: Record<NegotiationStatus, { color: string; label: string; labelAr: string; labelFr: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-700', label: 'Draft', labelAr: 'مسودة', labelFr: 'Brouillon' },
  SENT: { color: 'bg-blue-100 text-blue-700', label: 'Sent', labelAr: 'مرسل', labelFr: 'Envoyé' },
  UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-700', label: 'Under Review', labelAr: 'قيد المراجعة', labelFr: 'En révision' },
  COUNTERED: { color: 'bg-orange-100 text-orange-700', label: 'Countered', labelAr: 'تم الرد المضاد', labelFr: 'Contre-offre' },
  ACCEPTED: { color: 'bg-green-100 text-green-700', label: 'Accepted', labelAr: 'مقبول', labelFr: 'Accepté' },
  REJECTED: { color: 'bg-red-100 text-red-700', label: 'Rejected', labelAr: 'مرفوض', labelFr: 'Rejeté' },
  EXPIRED: { color: 'bg-gray-100 text-gray-500', label: 'Expired', labelAr: 'منتهي الصلاحية', labelFr: 'Expiré' },
  WITHDRAWN: { color: 'bg-purple-100 text-purple-700', label: 'Withdrawn', labelAr: 'مسحوب', labelFr: 'Retiré' },
  ARCHIVED: { color: 'bg-slate-100 text-slate-600', label: 'Archived', labelAr: 'مؤرشف', labelFr: 'Archivé' },
};

const typeLabels: Record<string, { label: string; ar: string; fr: string }> = {
  PRICE: { label: 'Price', ar: 'السعر', fr: 'Prix' },
  QUANTITY: { label: 'Quantity', ar: 'الكمية', fr: 'Quantité' },
  DELIVERY_TERMS: { label: 'Delivery Terms', ar: 'شروط التسليم', fr: 'Conditions de livraison' },
  PAYMENT_TERMS: { label: 'Payment Terms', ar: 'شروط الدفع', fr: 'Conditions de paiement' },
  SPECIFICATIONS: { label: 'Specifications', ar: 'المواصفات', fr: 'Spécifications' },
  BUNDLE: { label: 'Bundle Deal', ar: 'صفقة مجمعة', fr: 'Forfait' },
  COMPREHENSIVE: { label: 'Comprehensive', ar: 'شامل', fr: 'Complet' },
};

interface NegotiationCardProps {
  negotiation: Negotiation;
  onViewDetails?: (id: string) => void;
  onNegotiate?: (id: string) => void;
  onAccept?: (id: string) => void;
  currentUserId?: string;
  language?: 'en' | 'ar' | 'fr';
}

export function NegotiationCard({
  negotiation,
  onViewDetails,
  onNegotiate,
  onAccept,
  currentUserId,
  language = 'en',
}: NegotiationCardProps) {
  const status = statusConfig[negotiation.status];
  const typeInfo = typeLabels[negotiation.type] || typeLabels.PRICE;
  
  const isCurrentUserBuyer = negotiation.buyerId === currentUserId;
  const isMyTurn = negotiation.currentRole === (isCurrentUserBuyer ? 'BUYER' : 'SELLER');
  const isActive = !['ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'ARCHIVED'].includes(negotiation.status);
  
  // Calculate time remaining for active offers
  const lastOffer = negotiation.offers[0];
  const timeRemaining = lastOffer ? getTimeRemaining(new Date(lastOffer.validUntil)) : null;

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {negotiation.negotiationNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {getLabel(typeInfo.label, typeInfo.ar, typeInfo.fr)}
            </p>
          </div>
          <Badge className={status.color} variant="secondary">
            {getLabel(status.label, status.labelAr, status.labelFr)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price Summary */}
        {lastOffer?.offeredPrice && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Current Offer</span>
            <span className="text-xl font-bold text-primary">
              {lastOffer.offeredPrice.toLocaleString()} د.ج
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{negotiation.totalOffers} offers</span>
          </div>
          <div className="flex items-center gap-1">
            <ArrowLeftRight className="h-4 w-4" />
            <span>{negotiation.counterOffers} counters</span>
          </div>
          {timeRemaining && (
            <div className={`flex items-center gap-1 ${timeRemaining.hours < 24 ? 'text-orange-600' : ''}`}>
              <Clock className="h-4 w-4" />
              <span>{timeRemaining.text}</span>
            </div>
          )}
        </div>

        {/* Turn Indicator */}
        {isActive && (
          <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
            isMyTurn ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600'
          }`}>
            {isMyTurn ? (
              <>
                <TrendingUp className="h-4 w-4" />
                <span>Your turn to respond - دورك للرد</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Waiting for response - في انتظار الرد</span>
              </>
            )}
          </div>
        )}

        {/* AI Score */}
        {lastOffer?.aiScore && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Fairness Score</span>
            <div className="flex items-center gap-1">
              <div className={`w-16 h-2 rounded-full overflow-hidden bg-gray-200`}>
                <div 
                  className={`h-full rounded-full ${
                    lastOffer.aiScore >= 70 ? 'bg-green-500' :
                    lastOffer.aiScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${lastOffer.aiScore}%` }}
                />
              </div>
              <span className="font-medium">{lastOffer.aiScore}/100</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(negotiation.id)}
              className="flex-1"
            >
              View Details
            </Button>
          )}
          
          {isActive && isMyTurn && onNegotiate && (
            <Button 
              size="sm"
              onClick={() => onNegotiate(negotiation.id)}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Negotiate
            </Button>
          )}

          {isActive && isMyTurn && lastOffer && onAccept && (
            <Button 
              size="sm"
              variant="default"
              onClick={() => onAccept(negotiation.id)}
              className="text-green-600 hover:text-white hover:bg-green-600"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Accept
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate time remaining
function getTimeRemaining(validUntil: Date): { hours: number; text: string } | null {
  const now = new Date();
  const diff = validUntil.getTime() - now.getTime();
  
  if (diff <= 0) {
    return null;
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return { hours, text: `${days}d ${hours % 24}h left` };
  }
  
  return { hours, text: `${hours}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m left` };
}

export default NegotiationCard;
