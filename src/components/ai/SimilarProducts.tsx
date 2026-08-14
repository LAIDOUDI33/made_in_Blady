'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles,
  Eye,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import { ProductRecommendationData, RecommendationResult } from '@/lib/ai/recommendations/types';

interface SimilarProductsProps {
  productId: string;
  userId?: string;
  limit?: number;
  title?: string;
  className?: string;
}

export default function SimilarProducts({
  productId,
  userId,
  limit = 6,
  title = 'Produits similaires',
  className = '',
}: SimilarProductsProps) {
  const [products, setProducts] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);
        params.set('context', 'product_detail');
        params.set('limit', String(limit));
        params.set('itemId', productId);

        const response = await fetch(`/api/ai/recommendations/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.recommendations);
        }
      } catch (error) {
        console.error('Error fetching similar products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSimilar();
  }, [productId, userId, limit]);

  if (loading) {
    return (
      <section className={`py-8 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-[#006233]" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="min-h-[280px] bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#006233]" />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Badge variant="secondary" className="bg-green-50 text-[#006233] border-green-200">
              IA
            </Badge>
          </div>

          <Link
            href="/search"
            className="text-sm text-[#006233] hover:underline flex items-center gap-1"
          >
            Voir plus
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.slice(0, limit).map((rec) => {
            const product = rec.item as ProductRecommendationData | undefined;
            if (!product) return null;

            return (
              <Link key={rec.id} href={`/products/${product.slug}`} className="group">
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
                        <ShoppingCart className="h-10 w-10 text-green-200" />
                      </div>
                    )}

                    {/* Verified badge */}
                    {product.isVerified && (
                      <Badge className="absolute top-2 left-2 bg-[#006233] text-white text-xs px-1.5 py-0.5">
                        ✓
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-3">
                    {/* Reason label */}
                    <p className="text-xs text-[#006233] mb-1 line-clamp-1 truncate">
                      {rec.reason}
                    </p>

                    {/* Product name */}
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[36px] mb-2">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-2">
                      {product.price ? (
                        <span className="font-bold text-sm text-[#006233]">
                          {new Intl.NumberFormat('fr-DZ').format(product.price)} {product.currency}
                        </span>
                      ) : product.priceRangeMin && product.priceRangeMax ? (
                        <span className="text-xs text-gray-600">
                          {new Intl.NumberFormat('fr-DZ').format(product.priceRangeMin)}+
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sur demande</span>
                      )}
                    </div>

                    {/* Supplier & views */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[100px]">{product.companyName}</span>
                      <div className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        <span>{(product.viewCount || 0).toLocaleString('fr-DZ')}</span>
                      </div>
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
