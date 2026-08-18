'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock,
  User,
  Building2,
  ArrowRightLeft
} from 'lucide-react';
import type { NegotiationOffer, NegotiationRole } from '@/lib/negotiation';

interface OfferTimelineProps {
  offers: NegotiationOffer[];
  currentUserId?: string;
  onRespondToOffer?: (offerId: string) => void;
  language?: 'en' | 'ar' | 'fr';
}

const roleConfig: Record<NegotiationRole, { icon: typeof User; color: string; label: string; ar: string; fr: string }> = {
  BUYER: { 
    icon: User, 
    color: 'text-blue-600 bg-blue-100', 
    label: 'Buyer',
    ar: 'المشتري',
    fr: 'Acheteur'
  },
  SELLER: { 
    icon: Building2, 
    color: 'text-emerald-600 bg-emerald-100', 
    label: 'Seller',
    ar: 'البائع',
    fr: 'Vendeur'
  },
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-500' },
  ACCEPTED: { icon: CheckCircle2, color: 'text-green-500' },
  REJECTED: { icon: XCircle, color: 'text-red-500' },
  COUNTERED: { icon: ArrowRight, color: 'text-orange-500' },
  EXPIRED: { icon: Clock, color: 'text-gray-400' },
};

export function OfferTimeline({
  offers,
  currentUserId,
  onRespondToOffer,
  language = 'en',
}: OfferTimelineProps) {
  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  if (!offers || offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No offers yet - لا توجد عروض بعد
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          {language === 'ar' ? 'تاريخ العروض' : language === 'fr' ? 'Historique des offres' : 'Offer History'}
          <Badge variant="secondary" className="ml-auto">
            {offers.length} {language === 'ar' ? 'عرض' : language === 'fr' ? 'offres' : 'offers'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {offers.map((offer, index) => {
              const role = roleConfig[offer.fromRole];
              const status = statusConfig[offer.status] || statusConfig.PENDING;
              const RoleIcon = role.icon;
              const StatusIcon = status.icon;
              const isFromCurrentUser = offer.fromUserId === currentUserId;
              const isPending = offer.status === 'PENDING';
              
              return (
                <div key={offer.id} className="relative flex gap-4">
                  {/* Timeline node */}
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${role.color}`}>
                    <RoleIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-2 ${isFromCurrentUser ? '' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className={`font-medium text-sm ${isFromCurrentUser ? 'text-primary' : ''}`}>
                          Offer #{offer.offerNumber} • {getLabel(role.label, role.ar, role.fr)}
                          {isFromCurrentUser && ` (${getLabel('You', 'أنت', 'Vous')})`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(offer.createdAt).toLocaleDateString()} • {new Date(offer.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        <Badge variant="outline" className="text-xs capitalize">
                          {offer.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Offer Details */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 mt-2">
                      {/* Price Comparison */}
                      {(offer.originalPrice || offer.offeredPrice) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {offer.originalPrice && (
                            <span className="text-sm line-through text-muted-foreground">
                              {offer.originalPrice.toLocaleString()} د.ج
                            </span>
                          )}
                          {offer.originalPrice && offer.offeredPrice && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          {offer.offeredPrice && (
                            <span className="text-lg font-semibold text-primary">
                              {offer.offeredPrice.toLocaleString()} د.ج
                            </span>
                          )}
                        </div>
                      )}

                      {/* Other terms */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {offer.quantity && (
                          <div>
                            <span className="text-muted-foreground">Qty:</span>{' '}
                            <span className="font-medium">{offer.quantity.toLocaleString()}</span>
                          </div>
                        )}
                        {offer.deliveryDays && (
                          <div>
                            <span className="text-muted-foreground">Delivery:</span>{' '}
                            <span className="font-medium">{offer.deliveryDays} days</span>
                          </div>
                        )}
                        {offer.paymentTerms && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Payment:</span>{' '}
                            <span className="font-medium">{offer.paymentTerms}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {offer.notes && (
                        <p className="text-sm italic text-muted-foreground border-t pt-2 mt-2">
                          &ldquo;{offer.notes}&rdquo;
                        </p>
                      )}

                      {/* AI Score */}
                      {offer.aiScore !== undefined && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground">AI Score:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden bg-gray-200">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  offer.aiScore >= 70 ? 'bg-green-500' :
                                  offer.aiScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${offer.aiScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{offer.aiScore}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expiry for pending offers */}
                    {isPending && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires: {new Date(offer.validUntil).toLocaleString()}
                        </span>
                        
                        {onRespondToOffer && (
                          <button
                            onClick={() => onRespondToOffer(offer.id)}
                            className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            Respond Now
                          </button>
                        )}
                      </div>
                    )}
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

export default OfferTimeline;
