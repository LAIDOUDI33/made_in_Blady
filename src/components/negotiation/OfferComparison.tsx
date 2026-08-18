'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  X
} from 'lucide-react';
import type { NegotiationWithOffers } from '@/lib/negotiation/engine';

interface OfferComparisonProps {
  negotiation: NegotiationWithOffers;
  language?: 'en' | 'ar' | 'fr';
}

export function OfferComparison({
  negotiation,
  language = 'en',
}: OfferComparisonProps) {
  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const originalOffer = negotiation.offers[0];
  const currentOffer = negotiation.offers[negotiation.offers.length - 1];

  if (!originalOffer || !currentOffer) {
    return null;
  }

  // Calculate differences
  const priceDiff = (currentOffer.price ?? 0) - (originalOffer.price ?? 0);
  const priceDiffPercent = originalOffer.price 
    ? ((priceDiff / originalOffer.price) * 100).toFixed(1)
    : '0';

  const quantityDiff = (currentOffer.quantity ?? 0) - (originalOffer.quantity ?? 0);
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return `${amount.toLocaleString()} د.ج`;
  };

  const renderDifference = (original: number | string | null | undefined, current: number | string | null | undefined, isPrice: boolean = false) => {
    if (original === null || original === undefined || current === null || current === undefined) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }

    const origVal = typeof original === 'number' ? original : parseFloat(original);
    const currVal = typeof current === 'number' ? current : parseFloat(current);
    const diff = currVal - origVal;

    if (Math.abs(diff) < 0.01) {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }

    const isPositive = diff > 0;
    
    // For prices, positive means worse for buyer (higher price), negative is better
    // For quantity, positive means more items
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPrice 
      ? (isPositive ? 'text-red-600' : 'text-green-600')
      : (isPositive ? 'text-green-600' : 'text-red-600');

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{isPrice ? diff.toFixed(2) : diff}
        </span>
      </div>
    );
  };

  const hasDeliveryChanged = originalOffer.deliveryDate !== currentOffer.deliveryDate;
  const hasPaymentChanged = originalOffer.paymentTerms !== currentOffer.paymentTerms;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRightLeft className="h-5 w-5" />
          {getLabel('Offer Comparison', 'مقارنة العروض', 'Comparaison des offres')}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {getLabel(
            `Compare initial offer (#1) with latest offer (#${negotiation.offers.length})`,
            `مقارنة العرض الأولي (#1) مع أحدث عرض (#${negotiation.offers.length})`
          )}
        </p>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        {/* Summary Banner */}
        <div className={`rounded-lg p-4 mb-6 flex items-center justify-between ${
          priceDiff < 0 ? 'bg-green-50 border border-green-200' :
          priceDiff > 0 ? 'bg-red-50 border border-red-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <div>
            <p className={`font-semibold ${priceDiff <= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {priceDiff < 0 
                ? getLabel('Buyer Advantage', 'ميزة المشتري', 'Avantage acheteur') 
                : priceDiff > 0 
                  ? getLabel('Seller Advantage', 'ميزة البائع', 'Avantage vendeur')
                  : getLabel('No Change', 'لا يوجد تغيير', 'Pas de changement')
              }
            </p>
            <p className={`text-sm ${priceDiff <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {getLabel('Total Difference', 'إجمالي الفرق', 'Différence totale')}: {' '}
              <span className="font-bold">
                {priceDiff !== 0 ? `${priceDiff > 0 ? '+' : ''}${formatCurrency(Math.abs(priceDiff))}` : '-'}
              </span>
              {' '}({priceDiff !== 0 ? `${priceDiff > 0 ? '+' : ''}${priceDiffPercent}%` : '0%'})
            </p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            priceDiff < 0 ? 'bg-green-100' : priceDiff > 0 ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {priceDiff < 0 
              ? <TrendingDown className="h-6 w-6 text-green-600" />
              : priceDiff > 0 
                ? <TrendingUp className="h-6 w-6 text-red-600" />
                : <Minus className="h-6 w-6 text-gray-500" />
            }
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                  {getLabel('Attribute', 'السمة', 'Attribut')}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground min-w-[150px]">
                  <Badge variant="outline">{getLabel('Original #1', 'الأصلي #1')}</Badge>
                </th>
                <th className="text-center py-3 px-4 w-[100px]">
                  {/* Empty header for difference */}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground min-w-[150px]">
                  <Badge variant="default">{getLabel(`Current #${negotiation.offers.length}`, `الحالي #${negotiation.offers.length}`)}</Badge>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Price Row */}
              <tr className="border-b hover:bg-muted/30">
                <td className="py-3 px-4 font-medium">
                  {getLabel('Price', 'السعر', 'Prix')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="font-mono">{formatCurrency(originalOffer.price)}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  {renderDifference(originalOffer.price, currentOffer.price, true)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="font-mono font-bold text-primary">{formatCurrency(currentOffer.price)}</span>
                </td>
              </tr>

              {/* Quantity Row */}
              <tr className="border-b hover:bg-muted/30">
                <td className="py-3 px-4 font-medium">
                  {getLabel('Quantity', 'الكمية', 'Quantité')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span>{originalOffer.quantity ?? '-'}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  {renderDifference(originalOffer.quantity, currentOffer.quantity)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="font-bold">{currentOffer.quantity ?? '-'}</span>
                </td>
              </tr>

              {/* Delivery Date Row */}
              <tr className="border-b hover:bg-muted/30">
                <td className="py-3 px-4 font-medium">
                  {getLabel('Delivery Date', 'تاريخ التسليم', 'Date de livraison')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span>{originalOffer.deliveryDate ? new Date(originalOffer.deliveryDate).toLocaleDateString() : '-'}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  {hasDeliveryChanged ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={hasDeliveryChanged ? 'font-bold text-blue-600' : ''}>
                    {currentOffer.deliveryDate ? new Date(currentOffer.deliveryDate).toLocaleDateString() : '-'}
                  </span>
                </td>
              </tr>

              {/* Payment Terms Row */}
              <tr className="border-b hover:bg-muted/30">
                <td className="py-3 px-4 font-medium">
                  {getLabel('Payment Terms', 'شروط الدفع', 'Conditions de paiement')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs">{originalOffer.paymentTerms?.replace('_', ' ') ?? '-'}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  {hasPaymentChanged ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs ${hasPaymentChanged ? 'font-bold text-blue-600' : ''}`}>
                    {currentOffer.paymentTerms?.replace('_', ' ') ?? '-'}
                  </span>
                </td>
              </tr>

              {/* Message Row */}
              <tr className="hover:bg-muted/30">
                <td className="py-3 px-4 font-medium align-top">
                  {getLabel('Message', 'رسالة', 'Message')}
                </td>
                <td className="py-3 px-4 text-center max-w-[200px]">
                  <p className="text-xs italic text-muted-foreground truncate" title={originalOffer.message ?? ''}>
                    {originalOffer.message || '-'}
                  </p>
                </td>
                <td className="py-3 px-4 text-center align-top">
                  {(originalOffer?.message ?? '') !== (currentOffer?.message ?? '') ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </td>
                <td className="py-3 px-4 text-center max-w-[200px]">
                  <p className="text-xs italic text-muted-foreground truncate" title={currentOffer.message ?? ''}>
                    {currentOffer.message || '-'}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span>{getLabel('Better for buyer', 'أفضل للمشتري', 'Meilleur pour l\'acheteur')}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <span>{getLabel('Better for seller', 'أفضل للبائع', 'Meilleur pour le vendeur')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Minus className="h-4 w-4" />
            <span>{getLabel('No change', 'لا تغيير', 'Pas de changement')}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>{getLabel('Modified', 'تم التعديل', 'Modifié')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OfferComparison;
