'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Flame,
} from 'lucide-react';
import { ProductRecommendationData, RecommendationResult } from '@/lib/ai/recommendations/types';

interface TrendingProductsProps {
  limit?: number;
  period?: number; // hours
  title?: string;
  className?: string;
}

export default function TrendingProducts({
  limit = 12,
  period = 24,
  title = 'Tendances du moment',
  className = '',
}: TrendingProductsProps) {
  const [trending, setTrending] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('type', 'products');
        params.set('limit', String(limit));
        params.set('period', String(period));

        const response = await fetch(`/api/ai/recommendations/trending?${params}`);
        const data = await response.json();

        if (data.success) {
          setTrending(data.data.trending);
        }
      } catch (error) {
        console.error('Error fetching trending products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, [limit, period]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <section className={`py-6 bg-gradient-to-r from-orange-50 to-red-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="min-w-[260px] h-[320px] bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (trending.length === 0) return null;

  return (
    <section className={`py-6 bg-gradient-to-r from-orange-50 to-red-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
              🔥 Populaire
            </Badge>
            <span className="text-sm text-gray-500">
              Dernières {period}h
            </span>
          </div>
          
          {/* Navigation arrows */}
          <div className="hidden md:flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="h-8 w-8 border-orange-200 hover:bg-orange-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="h-8 w-8 border-orange-200 hover:bg-orange-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Trending Products Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {trending.map((rec, index) => {
            const product = rec.item as ProductRecommendationData | undefined;
            if (!product) return null;

            const trendPercent = (rec as any).trendChangePercent;

            return (
              <Link
                key={rec.id}
                href={`/products/${product.slug}`}
                className="min-w-[260px] max-w-[260px] flex-shrink-0 snap-start group"
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-orange-200 h-full bg-white relative">
                  {/* Rank badge */}
                  <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                    #{index + 1}
                  </div>

                  {/* Fire icon for top items */}
                  {index < 3 && (
                    <div className="absolute top-3 right-3 z-10">
                      <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
                        <ShoppingCart className="h-14 w-14 text-orange-200" />
                      </div>
                    )}

                    {/* Trend badge */}
                    {trendPercent !== undefined && trendPercent > 0 && (
                      <Badge 
                        className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none shadow-md flex items-center gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        +{Math.round(trendPercent)}% cette semaine
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Product name */}
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[40px] mb-2">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-2">
                      {product.price ? (
                        <span className="font-bold text-lg text-gray-900">
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
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[140px]">{product.companyName}</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{(product.viewCount || 0).toLocaleString('fr-DZ')}</span>
                      </div>
                    </div>

                    {/* Category */}
                    <p className="text-xs text-gray-400 mt-1.5 truncate">
                      {product.category}
                    </p>
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
