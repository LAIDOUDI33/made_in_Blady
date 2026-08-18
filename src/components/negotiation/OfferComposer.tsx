'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Calculator } from 'lucide-react';
import type { NegotiationType, NegotiationRole } from '@/lib/negotiation';

interface OfferComposerProps {
  negotiationId: string;
  currentRole: NegotiationRole;
  lastOffer?: {
    originalPrice?: number;
    offeredPrice?: number;
    quantity?: number;
    deliveryDays?: number;
    paymentTerms?: string;
  };
  aiSuggestion?: {
    suggestedPrice: number;
    confidence: number;
    reasoning: string;
  };
  onSubmit: (offerData: OfferData) => void;
  onAISuggest?: () => void;
  isSubmitting?: boolean;
  language?: 'en' | 'ar' | 'fr';
}

export interface OfferData {
  type: NegotiationType;
  originalPrice?: number;
  offeredPrice?: number;
  quantity?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  notes?: string;
}

const negotiationTypes: { value: NegotiationType; label: string; ar: string; fr: string }[] = [
  { value: 'PRICE', label: 'Price', ar: 'السعر', fr: 'Prix' },
  { value: 'QUANTITY', label: 'Quantity', ar: 'الكمية', fr: 'Quantité' },
  { value: 'DELIVERY_TERMS', label: 'Delivery Terms', ar: 'شروط التسليم', fr: 'Conditions de livraison' },
  { value: 'PAYMENT_TERMS', label: 'Payment Terms', ar: 'شروط الدفع', fr: 'Conditions de paiement' },
  { value: 'SPECIFICATIONS', label: 'Specifications', ar: 'المواصفات', fr: 'Spécifications' },
  { value: 'BUNDLE', label: 'Bundle Deal', ar: 'صفقة مجمعة', fr: 'Forfait' },
];

const paymentOptions = [
  { value: 'Net 30', label: 'Net 30 days' },
  { value: 'Net 60', label: 'Net 60 days' },
  { value: 'Net 90', label: 'Net 90 days' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'Advance 50%', label: '50% Advance' },
  { value: 'LC', label: 'Letter of Credit' },
];

export function OfferComposer({
  negotiationId,
  currentRole,
  lastOffer,
  aiSuggestion,
  onSubmit,
  onAISuggest,
  isSubmitting = false,
  language = 'en',
}: OfferComposerProps) {
  const [offerData, setOfferData] = useState<OfferData>({
    type: 'PRICE',
    originalPrice: lastOffer?.offeredPrice || lastOffer?.originalPrice,
    quantity: lastOffer?.quantity,
    deliveryDays: lastOffer?.deliveryDays,
    paymentTerms: lastOffer?.paymentTerms,
  });

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const handlePriceFromAI = useCallback(() => {
    if (aiSuggestion) {
      setOfferData(prev => ({
        ...prev,
        offeredPrice: aiSuggestion.suggestedPrice,
      }));
    }
  }, [aiSuggestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerData.offeredPrice && !offerData.originalPrice) return;
    onSubmit(offerData);
  };

  // Calculate discount percentage
  const discountPercent = offerData.originalPrice && offerData.offeredPrice
    ? ((offerData.originalPrice - offerData.offeredPrice) / offerData.originalPrice * 100).toFixed(1)
    : null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5" />
          {currentRole === 'BUYER' 
            ? (language === 'ar' ? 'تقديم عرضك' : language === 'fr' ? 'Soumettre votre offre' : 'Submit Your Offer')
            : (language === 'ar' ? 'تقديم عرض الرد' : language === 'fr' ? 'Soumettre une réponse' : 'Submit Your Response')
          }
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Negotiation Type */}
          <div className="space-y-2">
            <Label>{getLabel('Offer Type', 'نوع العرض', "Type d'offre")}</Label>
            <Select 
              value={offerData.type} 
              onValueChange={(value) => setOfferData(prev => ({ ...prev, type: value as NegotiationType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {negotiationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {getLabel(type.label, type.ar, type.fr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Section */}
          {(offerData.type === 'PRICE' || offerData.type === 'COMPREHENSIVE' || offerData.type === 'BUNDLE') && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {getLabel('Pricing', 'التسعير', 'Tarification')}
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {getLabel('Original Price (DZD)', 'السعر الأصلي (د.ج)', 'Prix original (DZD)')}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={offerData.originalPrice ?? ''}
                    onChange={(e) => setOfferData(prev => ({ 
                      ...prev, 
                      originalPrice: parseFloat(e.target.value) || undefined 
                    }))}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    {getLabel('Your Offer (DZD)', 'عرضك (د.ج)', 'Votre offre (DZD)')}
                    {aiSuggestion && (
                      <button
                        type="button"
                        onClick={handlePriceFromAI}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Suggest
                      </button>
                    )}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={offerData.offeredPrice ?? ''}
                    onChange={(e) => setOfferData(prev => ({ 
                      ...prev, 
                      offeredPrice: parseFloat(e.target.value) || undefined 
                    }))}
                    required
                  />
                </div>
              </div>

              {/* Discount indicator */}
              {discountPercent && (
                <Badge variant={parseFloat(discountPercent) > 20 ? 'destructive' : 'secondary'} className="text-xs">
                  {parseFloat(discountPercent) > 0 
                    ? `${discountPercent}% discount`
                    : `${Math.abs(parseFloat(discountPercent))}% increase`
                  }
                </Badge>
              )}

              {/* AI Suggestion Display */}
              {aiSuggestion && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
                  <p className="font-medium text-blue-800 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Suggestion ({aiSuggestion.confidence}% confidence)
                  </p>
                  <p className="text-blue-700">{aiSuggestion.reasoning}</p>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          {(offerData.type === 'QUANTITY' || offerData.type === 'COMPREHENSIVE' || offerData.type === 'BUNDLE') && (
            <div className="space-y-2">
              <Label>{getLabel('Quantity', 'الكمية', 'Quantité')}</Label>
              <Input
                type="number"
                placeholder="0"
                value={offerData.quantity ?? ''}
                onChange={(e) => setOfferData(prev => ({ 
                  ...prev, 
                  quantity: parseFloat(e.target.value) || undefined 
                }))}
                min="1"
              />
            </div>
          )}

          {/* Delivery Days */}
          {(offerData.type === 'DELIVERY_TERMS' || offerData.type === 'COMPREHENSIVE') && (
            <div className="space-y-2">
              <Label>{getLabel('Delivery Days', 'أيام التسليم', 'Délai de livraison (jours)')}</Label>
              <Input
                type="number"
                placeholder="7"
                value={offerData.deliveryDays ?? ''}
                onChange={(e) => setOfferData(prev => ({ 
                  ...prev, 
                  deliveryDays: parseInt(e.target.value) || undefined 
                }))}
                min="1"
              />
            </div>
          )}

          {/* Payment Terms */}
          {(offerData.type === 'PAYMENT_TERMS' || offerData.type === 'COMPREHENSIVE') && (
            <div className="space-y-2">
              <Label>{getLabel('Payment Terms', 'شروط الدفع', 'Conditions de paiement')}</Label>
              <Select 
                value={offerData.paymentTerms || ''} 
                onValueChange={(value) => setOfferData(prev => ({ ...prev, paymentTerms: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getLabel('Select terms', 'اختر الشروط', 'Sélectionner les conditions')} />
                </SelectTrigger>
                <SelectContent>
                  {paymentOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>{getLabel('Notes (Optional)', 'ملاحظات (اختياري)', 'Notes (facultatif)')}</Label>
            <Textarea
              placeholder={getLabel(
                'Add any additional notes or conditions for this offer...',
                'أضف أي ملاحظات أو شروط إضافية لهذا العرض...',
                'Ajoutez des notes ou conditions supplémentaires pour cette offre...'
              )}
              value={offerData.notes || ''}
              onChange={(e) => setOfferData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {onAISuggest && (
              <Button
                type="button"
                variant="outline"
                onClick={onAISuggest}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {getLabel('Get AI Suggestion', 'احصل على اقتراح الذكاء الاصطناعي', 'Obtenir suggestion IA')}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting || (!offerData.offeredPrice && !offerData.originalPrice)}
              className="flex items-center gap-2 ml-auto"
            >
              <Send className="h-4 w-4" />
              {isSubmitting 
                ? (getLabel('Submitting...', 'جارٍ الإرسال...', 'Envoi en cours...'))
                : (currentRole === 'BUYER'
                  ? (getLabel('Submit Offer', 'تقديم العرض', 'Soumettre l\'offre'))
                  : (getLabel('Submit Response', 'تقديم الرد', 'Soumettre la réponse'))
                )
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default OfferComposer;
