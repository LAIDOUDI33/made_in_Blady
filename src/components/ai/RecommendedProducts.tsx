'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  ShoppingCart,
} from 'lucide-react';
import { ProductRecommendationData, RecommendationResult } from '@/lib/ai/recommendations/types';

interface RecommendedProductsProps {
  userId?: string;
  context?: 'homepage' | 'product_detail' | 'category' | 'search' | 'cart' | 'checkout';
  itemId?: string;
  categoryId?: string;
  limit?: number;
  title?: string;
  className?: string;
}

export default function RecommendedProducts({
  userId,
  context = 'homepage',
  itemId,
  categoryId,
  limit = 10,
  title = 'Recommandé pour vous',
  className = '',
}: RecommendedProductsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      params.set('context', context);
      params.set('limit', String(limit));
      if (itemId) params.set('itemId', itemId);
      if (categoryId) params.set('categoryId', categoryId);

      const response = await fetch(`/api/ai/recommendations/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, context, limit, itemId, categoryId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleDismiss = async (recId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDismissed(prev => new Set([...prev, recId]));
    
    // Track dismissal
    try {
      await fetch(`/api/ai/recommendations/${recId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismissed', userId }),
      });
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  const handleClick = async (rec: RecommendationResult) => {
    try {
      await fetch(`/api/ai/recommendations/${rec.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clicked', userId }),
      });
      
      // Track interaction
      await fetch('/api/ai/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'click',
          productId: rec.itemId,
          source: 'recommendation',
          userId,
        }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const visibleRecommendations = recommendations.filter(r => !dismissed.has(r.id));

  if (loading) {
    return (
      <section className={`py-6 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#006233]" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[240px] h-[300px] bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (visibleRecommendations.length === 0) return null;

  return (
    <section className={`py-6 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#006233]" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Badge variant="secondary" className="bg-green-50 text-[#006233] border-green-200">
              IA
            </Badge>
          </div>
          
          {/* Navigation arrows */}
          <div className="hidden md:flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleRecommendations.map((rec) => {
            const product = rec.item as ProductRecommendationData | undefined;
            if (!product) return null;

            return (
              <Link
                key={rec.id}
                href={`/products/${product.slug}`}
                className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start group"
                onClick={() => handleClick(rec)}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 h-full">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                        <ShoppingCart className="h-12 w-12 text-green-200" />
                      </div>
                    )}
                    
                    {/* Dismiss button */}
                    <button
                      onClick={(e) => handleDismiss(rec.id, e)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-gray-100"
                      aria-label="Je ne suis pas intéressé"
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </button>

                    {/* Verified badge */}
                    {product.isVerified && (
                      <Badge className="absolute top-2 left-2 bg-[#006233] text-white text-xs px-2 py-0.5">
                        Vérifié
                      </Badge>
                    )}

                    {/* Trending indicator */}
                    {(rec as any).trendChangePercent > 20 && (
                      <Badge className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs flex items-center gap-1">
                        🔥 +{(rec as any).trendChangePercent.toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-3">
                    {/* Reason label */}
                    <p className="text-xs text-[#006233] mb-1 line-clamp-1">
                      {rec.reason}
                    </p>

                    {/* Product name */}
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[40px] mb-2">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-2">
                      {product.price ? (
                        <span className="font-bold text-[#006233]">
                          {new Intl.NumberFormat('fr-DZ').format(product.price)} {product.currency}
                        </span>
                      ) : product.priceRangeMin && product.priceRangeMax ? (
                        <span className="text-sm text-gray-600">
                          {new Intl.NumberFormat('fr-DZ').format(product.priceRangeMin)} - {' '}
                          {new Intl.NumberFormat('fr-DZ').format(product.priceRangeMax)} {product.currency}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Sur demande</span>
                      )}
                    </div>

                    {/* Supplier info */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="truncate">{product.companyName}</span>
                      {product.isVerified && (
                        <span className="text-green-500">✓</span>
                      )}
                    </div>

                    {/* View count */}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                      <Eye className="h-3 w-3" />
                      <span>{(product.viewCount || 0).toLocaleString('fr-DZ')} vues</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
