'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Flame,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Medal,
  Crown,
  Award,
  Filter,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type TrendPeriod = 'daily' | 'weekly' | 'monthly';

export type RankMovement = 'up' | 'down' | 'same' | 'new';

export interface TrendingProduct {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  price?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  currency?: string;
  companyName: string;
  companyId: string;
  companyLogo?: string;
  category: string;
  categoryId: string;
  rank: number;
  previousRank?: number; // undefined means new entry
  score: number; // Trending score
  viewCount: number;
  inquiryCount: number;
  trendChangePercent?: number; // Percentage change in interest
}

interface TrendingProductsProps {
  products: TrendingProduct[];
  period?: TrendPeriod;
  category?: string;
  onViewProduct?: (productId: string) => void;
  onCategoryChange?: (categoryId: string | null) => void;
  onPeriodChange?: (period: TrendPeriod) => void;
  className?: string;
  categories?: Array<{ id: string; name: string }>;
  showCarousel?: boolean;
}

// Period configuration
const periodConfig: Record<TrendPeriod, { label: string; shortLabel: string }> = {
  daily: { label: 'Aujourd\'hui', shortLabel: '24h' },
  weekly: { label: 'Cette semaine', shortLabel: '7j' },
  monthly: { label: 'Ce mois', shortLabel: '30j' },
};

// Get rank movement type
function getRankMovement(current: number, previous?: number): RankMovement {
  if (previous === undefined) return 'new';
  if (current < previous) return 'up';
  if (current > previous) return 'down';
  return 'same';
}

// Get rank change value
function getRankChange(current: number, previous?: number): number {
  if (previous === undefined) return 0;
  return previous - current;
}

// Format currency
function formatCurrency(amount: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency === 'DZD' ? 'DZD' : currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('DZD', 'DA')
    .trim();
}

// Rank badge component
function RankBadge({
  rank,
  movement,
}: {
  rank: number;
  movement: RankMovement;
}) {
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-200';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-200';
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4" />;
      case 2:
        return <Medal className="h-4 w-4" />;
      case 3:
        return <Award className="h-4 w-4" />;
      default:
        return <span className="text-sm font-bold">#{rank}</span>;
    }
  };

  const getMovementIcon = () => {
    switch (movement) {
      case 'up':
        return (
          <ArrowUpRight className="h-3 w-3 text-green-500" />
        );
      case 'down':
        return (
          <ArrowDownRight className="h-3 w-3 text-red-500" />
        );
      case 'new':
        return (
          <Sparkles className="h-3 w-3 text-blue-500" />
        );
      case 'same':
        return (
          <Minus className="h-3 w-3 text-gray-400" />
        );
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
          getRankStyle()
        )}
      >
        {getRankIcon()}
      </div>
      <div className="ml-0.5">{getMovementIcon()}</div>
    </div>
  );
}

// Score bar component
function ScoreBar({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  const getColor = () => {
    if (percentage >= 80) return 'bg-gradient-to-r from-red-500 to-orange-500';
    if (percentage >= 60) return 'bg-gradient-to-r from-orange-500 to-yellow-500';
    if (percentage >= 40) return 'bg-gradient-to-r from-yellow-500 to-green-500';
    return 'bg-gradient-to-r from-green-500 to-emerald-500';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getColor())}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Score de tendance: {score.toFixed(0)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Product card for trending list
function TrendingProductCard({
  product,
  onViewProduct,
}: {
  product: TrendingProduct;
  onViewProduct?: (productId: string) => void;
}) {
  const movement = getRankMovement(product.rank, product.previousRank);
  const rankChange = getRankChange(product.rank, product.previousRank);

  return (
    <Card
      className={cn(
        'overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300',
        product.rank <= 3 && 'ring-2 ring-primary/20'
      )}
      onClick={() => onViewProduct?.(product.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewProduct?.(product.id);
        }
      }}
      aria-label={`Produit tendance #${product.rank}: ${product.name}`}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-gray-200" />
          </div>
        )}

        {/* Rank badge */}
        <div className="absolute top-3 left-3 z-10">
          <RankBadge rank={product.rank} movement={movement} />
        </div>

        {/* Fire icon for top 3 */}
        {product.rank <= 3 && (
          <div className="absolute top-3 right-3 z-10">
            <Flame
              className={cn(
                'h-6 w-6',
                product.rank === 1
                  ? 'text-yellow-500 animate-pulse'
                  : product.rank === 2
                  ? 'text-gray-400'
                  : 'text-orange-500'
              )}
            />
          </div>
        )}

        {/* Trend indicator */}
        {product.trendChangePercent !== undefined && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge
              variant="secondary"
              className={cn(
                'gap-1 bg-black/60 backdrop-blur-sm text-white border-none hover:bg-black/60'
              )}
            >
              {product.trendChangePercent > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3" />
                  +{Math.round(product.trendChangePercent)}%
                </>
              ) : product.trendChangePercent < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3" />
                  {Math.round(product.trendChangePercent)}%
                </>
              ) : (
                <>
                  <Minus className="h-3 w-3" />
                  0%
                </>
              )}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="pt-4 pb-4">
        {/* Product info */}
        <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[40px]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mb-2">
          {product.price !== undefined ? (
            <span className="font-bold text-base text-gray-900">
              {formatCurrency(product.price, product.currency)}
            </span>
          ) : product.priceRangeMin && product.priceRangeMax ? (
            <span className="text-sm text-gray-600">
              {formatCurrency(product.priceRangeMin, product.currency)} -{' '}
              {formatCurrency(product.priceRangeMax, product.currency)}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Sur demande</span>
          )}
        </div>

        {/* Company */}
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-2">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {product.companyName}
        </p>

        {/* Category */}
        <Badge variant="outline" className="text-xs w-fit mb-3">
          {product.category}
        </Badge>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{product.viewCount.toLocaleString('fr-DZ')}</span>
          </div>

          {/* Movement detail */}
          <div className="flex items-center gap-1">
            {movement === 'new' ? (
              <Badge variant="secondary" className="text-xs py-0 px-1.5 gap-0.5">
                <Sparkles className="h-3 w-3" />
                Nouveau
              </Badge>
            ) : movement === 'up' ? (
              <span className="text-green-600 font-medium flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                +{rankChange}
              </span>
            ) : movement === 'down' ? (
              <span className="text-red-600 font-medium flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" />
                {rankChange}
              </span>
            ) : (
              <span className="text-gray-400 flex items-center gap-0.5">
                <Minus className="h-3 w-3" />
                -
              </span>
            )}
          </div>
        </div>

        {/* Score visualization */}
        <div className="mt-2">
          <ScoreBar score={product.score} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrendingProducts({
  products,
  period = 'weekly',
  category,
  onViewProduct,
  onCategoryChange,
  onPeriodChange,
  className,
  categories = [],
  showCarousel = true,
}: TrendingProductsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>(period);
  const [selectedCategory, setSelectedCategory] = useState<string>(category ?? 'all');

  // Filter products by category
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Sort by rank
    return filtered.sort((a, b) => a.rank - b.rank);
  }, [products, selectedCategory]);

  // Handle period change
  const handlePeriodChange = (value: string) => {
    const newPeriod = value as TrendPeriod;
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryChange?.(value === 'all' ? null : value);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-6 w-6 text-orange-500" />
              Produits Tendance
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                {filteredProducts.length}
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Period selector */}
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[120px]" aria-label="Sélectionner la période">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(periodConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category filter */}
              {categories.length > 0 && (
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[150px]" aria-label="Filtrer par catégorie">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun produit tendance pour cette sélection</p>
            </div>
          ) : showCarousel && filteredProducts.length > 4 ? (
            /* Carousel mode for many products */
            <Carousel
              opts={{
                align: 'start',
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {filteredProducts.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <TrendingProductCard
                      product={product}
                      onViewProduct={onViewProduct}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Navigation */}
              <div className="flex justify-end gap-2 mt-4">
                <CarouselPrevious className="static h-9 w-9 border-gray-200 hover:bg-gray-100" />
                <CarouselNext className="static h-9 w-9 border-gray-200 hover:bg-gray-100" />
              </div>
            </Carousel>
          ) : (
            /* Grid mode for fewer products */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <TrendingProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={onViewProduct}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Export types
export type { TrendingProductsProps };
