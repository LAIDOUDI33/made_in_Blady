'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface PriceSliderProps {
  minPrice: number;
  maxPrice: number;
  currentPrice: number;
  originalPrice?: number;
  marketPrice?: number;
  onChange: (value: number) => void;
  currency?: string;
  language?: 'en' | 'ar' | 'fr';
  showDiscount?: boolean;
}

export function PriceSlider({
  minPrice,
  maxPrice,
  currentPrice,
  originalPrice,
  marketPrice,
  onChange,
  currency = 'د.ج',
  language = 'en',
  showDiscount = true,
}: PriceSliderProps) {
  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  // Calculate percentage position for slider (0-100)
  const percentage = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;

  // Calculate discount
  const discountPercent = originalPrice 
    ? ((originalPrice - currentPrice / originalPrice) * 100).toFixed(1)
    : null;

  // Market comparison
  const marketDiff = marketPrice ? ((currentPrice - marketPrice) / marketPrice * 100).toFixed(1) : null;

  // Format price display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toFixed(0);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getLabel('Price Selector', 'محدد السعر', 'Sélecteur de prix')}
          </CardTitle>
          {showDiscount && discountPercent && (
            <Badge variant={parseFloat(discountPercent) > 0 ? 'default' : 'secondary'} className="text-xs">
              {parseFloat(discountPercent) > 0 ? '-' : '+'}{Math.abs(parseFloat(discountPercent))}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Price Display */}
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground mb-1">
            {getLabel('Your Offer', 'عرضك', 'Votre offre')}
          </p>
          <p className="text-3xl font-bold text-primary">
            {currentPrice.toLocaleString()} <span className="text-lg">{currency}</span>
          </p>
          
          {/* Original price reference */}
          {originalPrice && (
            <p className="text-sm text-muted-foreground line-through mt-1">
              {getLabel('Original', 'الأصلي', 'Original')}: {originalPrice.toLocaleString()} {currency}
            </p>
          )}

          {/* Market price reference */}
          {marketPrice && (
            <p className={`text-xs mt-1 ${marketDiff && parseFloat(marketDiff) > 5 ? 'text-red-500' : parseFloat(marketDiff) && parseFloat(marketDiff) < -5 ? 'text-green-500' : 'text-muted-foreground'}`}>
              {getLabel('Market Avg', 'متوسط السوق', 'Moyenne marché')}: {marketPrice.toLocaleString()} {currency}
              {marketDiff && ` (${parseFloat(marketDiff) > 0 ? '+' : ''}${marketDiff}%)`}
            </p>
          )}
        </div>

        {/* Slider */}
        <div className="space-y-3 px-2">
          <Slider
            value={[currentPrice]}
            min={minPrice}
            max={maxPrice}
            step={(maxPrice - minPrice) / 100}
            onValueChange={(value) => onChange(value[0])}
            className="w-full"
          />

          {/* Range labels */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(minPrice)}</span>
            <span>{formatPrice(maxPrice)}</span>
          </div>

          {/* Visual markers for key prices */}
          <div className="relative h-4">
            {originalPrice && (
              <div 
                className="absolute top-0 w-0.5 h-3 bg-gray-400"
                style={{ left: `${((originalPrice - minPrice) / (maxPrice - minPrice)) * 100}%` }}
                title={`Original: ${originalPrice}`}
              />
            )}
            {marketPrice && (
              <div 
                className="absolute top-0 w-0.5 h-3 bg-blue-400"
                style={{ left: `${((marketPrice - minPrice) / (maxPrice - minPrice)) * 100}%` }}
                title={`Market: ${marketPrice}`}
              />
            )}
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map(discount => {
            const suggestedPrice = originalPrice 
              ? originalPrice * (1 - discount / 100)
              : currentPrice;
            
            return (
              <button
                key={discount}
                type="button"
                onClick={() => onChange(suggestedPrice)}
                className={`py-1.5 px-2 text-xs rounded-md border transition-colors hover:bg-primary hover:text-primary-foreground ${
                  Math.abs(currentPrice - suggestedPrice) < (maxPrice - minPrice) * 0.02
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background'
                }`}
              >
                -{discount}%
              </button>
            );
          })}
        </div>

        {/* Price zone indicators */}
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span className="text-green-600">{getLabel('Good', 'جيد', 'Bon')}</span>
          <span className="text-yellow-600">{getLabel('Fair', 'عادل', 'Équitable')}</span>
          <span className="text-orange-600">{getLabel('High', 'مرتفع', 'Élevé')}</span>
          <span className="text-red-600">{getLabel('Very High', 'مرتفع جداً', 'Très élevé')}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default PriceSlider;
