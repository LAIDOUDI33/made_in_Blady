'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';

interface AlsoViewedProduct {
  id: string;
  name: string;
  slug: string;
  price?: number | null;
  currency: string;
  image?: string | null;
  companyName: string;
  companySlug: string;
  isVerified: boolean;
}

interface AlsoViewedCarouselProps {
  productId: string;
  limit?: number;
  title?: string;
  className?: string;
}

export default function AlsoViewedCarousel({
  productId,
  limit = 10,
  title = "Les acheteurs ont également consulté",
  className = '',
}: AlsoViewedCarouselProps) {
  const [products, setProducts] = useState<AlsoViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAlsoViewed() {
      try {
        setLoading(true);
        const response = await fetch(`/api/ai/interactions/also-viewed?productId=${productId}&limit=${limit}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
        }
      } catch (error) {
        console.error('Error fetching also viewed products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlsoViewed();
  }, [productId, limit]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <section className={`py-6 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[#006233]" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[220px] h-[270px] bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className={`py-6 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#006233]" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              Preuve sociale
            </Badge>
          </div>

          {/* Navigation arrows */}
          {products.length > 4 && (
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
          )}
        </div>

        {/* Products Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="min-w-[220px] max-w-[220px] flex-shrink-0 snap-start group"
            >
              <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-gray-200 bg-white h-full">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                      <ShoppingCart className="h-10 w-10 text-blue-200" />
                    </div>
                  )}

                  {/* Verified badge */}
                  {product.isVerified && (
                    <CheckCircle2 className="absolute top-2 left-2 h-5 w-5 text-green-500 bg-white rounded-full p-0.5" />
                  )}
                </div>

                <CardContent className="p-3">
                  {/* Product name */}
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[36px] mb-2">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-2">
                    {product.price ? (
                      <span className="font-semibold text-sm text-gray-900">
                        {new Intl.NumberFormat('fr-DZ').format(product.price)} {product.currency}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Sur demande</span>
                    )}
                  </div>

                  {/* Supplier info */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-3 w-3 text-gray-400" />
                    </div>
                    <span className="truncate">{product.companyName}</span>
                  </div>

                  {/* View count indicator */}
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                    <Eye className="h-3 w-3" />
                    <span>Consulté par d'autres acheteurs</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
