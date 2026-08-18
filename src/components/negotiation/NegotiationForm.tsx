'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Calculator, 
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { negotiationConfig, type NegotiationType, type PaymentTerm } from '@/lib/negotiation/config';

interface NegotiationFormProps {
  mode: 'create' | 'counter';
  initialData?: {
    originalPrice?: number;
    proposedPrice?: number;
    quantity?: number;
    deliveryDate?: string;
    paymentTerms?: string;
  };
  onSubmit: (data: OfferFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  language?: 'en' | 'ar' | 'fr';
}

export interface OfferFormData {
  type: NegotiationType;
  originalPrice: number;
  proposedPrice: number;
  quantity?: number;
  deliveryDate?: string;
  paymentTerms?: PaymentTerm;
  message?: string;
}

const typeOptions = [
  { value: 'PRICE', label: 'Price', ar: 'السعر', fr: 'Prix' },
  { value: 'QUANTITY', label: 'Quantity', ar: 'الكمية', fr: 'Quantité' },
  { value: 'DELIVERY_DATE', label: 'Delivery Date', ar: 'تاريخ التسليم', fr: 'Date de livraison' },
  { value: 'PAYMENT_TERMS', label: 'Payment Terms', ar: 'شروط الدفع', fr: 'Conditions de paiement' },
  { value: 'BUNDLE', label: 'Bundle Deal', ar: 'صفقة مجمعة', fr: 'Forfait' },
];

export function NegotiationForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  language = 'en',
}: NegotiationFormProps) {
  const [formData, setFormData] = useState<OfferFormData>({
    type: initialData?.type || 'PRICE',
    originalPrice: initialData?.originalPrice || 0,
    proposedPrice: initialData?.proposedPrice || 0,
    quantity: initialData?.quantity,
    deliveryDate: initialData?.deliveryDate,
    paymentTerms: (initialData?.paymentTerms as PaymentTerm) || undefined,
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.originalPrice || formData.originalPrice <= 0) {
      newErrors.originalPrice = language === 'ar' ? 'أدخل السعر الأصلي' : language === 'fr' ? 'Entrez le prix original' : 'Enter original price';
    }

    if (!formData.proposedPrice || formData.proposedPrice <= 0) {
      newErrors.proposedPrice = language === 'ar' ? 'أدخل السعر المقترح' : language === 'fr' ? 'Entrez le prix proposé' : 'Enter proposed price';
    }

    // Check price change limits
    if (formData.originalPrice && formData.proposedPrice) {
      const changePercent = ((formData.originalPrice - formData.proposedPrice) / formData.originalPrice) * 100;
      
      if (changePercent > 0 && changePercent < negotiationConfig.minPriceDropPercent) {
        newErrors.proposedPrice = `Minimum ${negotiationConfig.minPriceDropPercent}% change required`;
      }
      
      if (changePercent > negotiationConfig.maxPriceDropPercent) {
        newErrors.proposedPrice = `Maximum discount is ${negotiationConfig.maxPriceDropPercent}%`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Calculate savings
  const savingsAmount = formData.originalPrice - formData.proposedPrice;
  const savingsPercent = formData.originalPrice > 0 
    ? (savingsAmount / formData.originalPrice * 100).toFixed(1)
    : 0;

  const isDiscount = savingsAmount > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              {mode === 'create' ? (
                <>
                  <Send className="h-5 w-5" />
                  {getLabel('Create New Offer', 'إنشاء عرض جديد', 'Créer une nouvelle offre')}
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-5 w-5" />
                  {getLabel('Submit Counter-Offer', 'تقديم عرض مضاد', 'Soumettre une contre-offre')}
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {mode === 'create'
                ? getLabel(
                    'Make an offer to start negotiating',
                    'قدم عرضاً لبدء التفاوض',
                    'Faites une offre pour commencer les négociations'
                  )
                : getLabel(
                    'Respond to the current offer with your terms',
                    'رد على العرض الحالي بشروطك',
                    'Répondez à l\'offre actuelle avec vos conditions'
                  )}
            </CardDescription>
          </div>
          {mode === 'counter' && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              {getLabel('Counter Mode', 'وضع الرد المضاد', 'Mode contre-offre')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Negotiation Type */}
          <div className="space-y-2">
            <Label>{getLabel('Negotiation Type', 'نوع المفاوضات', 'Type de négociation')}</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as NegotiationType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {getLabel(option.label, option.ar, option.fr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Section */}
          {(formData.type === 'PRICE' || formData.type === 'BUNDLE') && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <Label className="flex items-center gap-2 font-semibold">
                <Calculator className="h-4 w-4" />
                {getLabel('Pricing Details', 'تفاصيل التسعير', 'Détails du prix')}
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Price */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {getLabel('Original Price (DZD)', 'السعر الأصلي (د.ج)', 'Prix original (DZD)')}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.originalPrice || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      originalPrice: parseFloat(e.target.value) || 0,
                    }))}
                    className={errors.originalPrice ? 'border-red-500' : ''}
                  />
                  {errors.originalPrice && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.originalPrice}
                    </p>
                  )}
                </div>

                {/* Proposed Price */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    {getLabel('Your Offer (DZD)', 'عرضك (د.ج)', 'Votre offre (DZD)')}
                    <Sparkles className="h-3 w-3 text-primary" />
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.proposedPrice || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      proposedPrice: parseFloat(e.target.value) || 0,
                    }))}
                    className={errors.proposedPrice ? 'border-red-500' : ''}
                  />
                  {errors.proposedPrice && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.proposedPrice}
                    </p>
                  )}
                </div>
              </div>

              {/* Savings Indicator */}
              {formData.originalPrice > 0 && formData.proposedPrice > 0 && (
                <div className={`flex items-center justify-between p-3 rounded-md ${
                  isDiscount ? 'bg-green-50 text-green-700 border border-green-200' : 
                  savingsAmount < 0 ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  <span className="text-sm font-medium">
                    {isDiscount 
                      ? getLabel('Your Savings', 'وفوراتك', 'Vos économies')
                      : getLabel('Price Difference', 'فرق السعر', 'Différence de prix')
                    }
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {Math.abs(savingsAmount).toLocaleString()} د.ج
                    </span>
                    <Badge variant={isDiscount ? 'default' : 'destructive'} className="text-xs">
                      {isDiscount ? '-' : '+'}{Math.abs(parseFloat(savingsPercent))}%
                    </Badge>
                  </div>
                </div>
              )}

              {/* Auto-Accept Indicator */}
              {Math.abs(parseFloat(savingsPercent)) <= negotiationConfig.autoAcceptThreshold && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md text-blue-700 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {getLabel(
                    `Within auto-accept range (${negotiationConfig.autoAcceptThreshold}%)- سيتم قبوله تلقائياً`,
                    `Dans la plage d'acceptation automatique (${negotiationConfig.autoAcceptThreshold}%)`,
                    `Within auto-accept range (${negotiationConfig.autoAcceptThreshold}%)`
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          {(formData.type === 'QUANTITY' || formData.type === 'BUNDLE') && (
            <div className="space-y-2">
              <Label>{getLabel('Quantity', 'الكمية', 'Quantité')}</Label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={formData.quantity || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  quantity: parseInt(e.target.value) || undefined,
                }))}
                min="1"
              />
            </div>
          )}

          {/* Delivery Date */}
          {(formData.type === 'DELIVERY_DATE' || formData.type === 'BUNDLE') && (
            <div className="space-y-2">
              <Label>{getLabel('Delivery Date', 'تاريخ التسليم', 'Date de livraison')}</Label>
              <Input
                type="date"
                value={formData.deliveryDate || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  deliveryDate: e.target.value || undefined,
                }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Payment Terms */}
          {(formData.type === 'PAYMENT_TERMS' || formData.type === 'BUNDLE') && (
            <div className="space-y-2">
              <Label>{getLabel('Payment Terms', 'شروط الدفع', 'Conditions de paiement')}</Label>
              <Select
                value={formData.paymentTerms || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value as PaymentTerm }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getLabel('Select terms', 'اختر الشروط', 'Sélectionner')} />
                </SelectTrigger>
                <SelectContent>
                  {negotiationConfig.paymentTerms.map(term => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label>{getLabel('Message (Optional)', 'رسالة (اختياري)', 'Message (facultatif)')}</Label>
            <Textarea
              placeholder={getLabel(
                'Add a message to explain your offer...',
                'أضف رسالة لشرح عرضك...',
                'Ajoutez un message pour expliquer votre offre...'
              )}
              value={formData.message || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {getLabel('Cancel', 'إلغاء', 'Annuler')}
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="ml-auto flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {getLabel('Submitting...', 'جارٍ الإرسال...', 'Envoi en cours...')}
                </>
              ) : mode === 'create' ? (
                <>
                  <Send className="h-4 w-4" />
                  {getLabel('Submit Offer', 'تقديم العرض', 'Soumettre l\'offre')}
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4" />
                  {getLabel('Send Counter-Offer', 'إرسال العرض المضاد', 'Envoyer la contre-offre')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default NegotiationForm;
