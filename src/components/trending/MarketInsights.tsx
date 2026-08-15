'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Clock,
  BookOpen,
  TrendingUp,
  FileText,
  BarChart3,
  Lightbulb,
  Newspaper,
  ArrowRight,
  Filter,
  Calendar,
  Eye,
  Bookmark,
  Share2,
  Tag,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type InsightType = 'article' | 'report' | 'analysis' | 'news' | 'guide' | 'forecast' | 'case-study';

export interface MarketInsight {
  id: string;
  title: string;
  slug?: string;
  excerpt: string;
  content?: string;
  type: InsightType;
  category: {
    id: string;
    name: string;
    color?: string;
  };
  author: {
    name: string;
    avatar?: string;
  };
  coverImage?: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number; // in minutes
  tags?: string[];
  viewCount: number;
  isFeatured?: boolean;
  isPremium?: boolean;
  relatedInsightIds?: string[];
}

interface MarketInsightsProps {
  insights: MarketInsight[];
  categoryId?: string;
  type?: InsightType;
  onViewInsight?: (insightId: string) => void;
  onBookmark?: (insightId: string) => void;
  onShare?: (insightId: string) => void;
  className?: string;
  categories?: Array<{ id: string; name: string; color?: string }>;
  maxItems?: number;
  showSearch?: boolean;
  showFilters?: boolean;
}

// Type configuration
const insightTypeConfig: Record<InsightType, { label: string; icon: React.ReactNode; color: string }> = {
  article: { label: 'Article', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  report: { label: 'Rapport', icon: <BarChart3 className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  analysis: { label: 'Analyse', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-green-100 text-green-700 border-green-200' },
  news: { label: 'Actualité', icon: <Newspaper className="h-4 w-4" />, color: 'bg-red-100 text-red-700 border-red-200' },
  guide: { label: 'Guide', icon: <BookOpen className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  forecast: { label: 'Prévision', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'case-study': { label: 'Étude de cas', icon: <FileText className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

// Format date
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-DZ', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateString;
  }
}

// Format reading time
function formatReadingTime(minutes: number): string {
  if (minutes <= 1) return '1 min lecture';
  if (minutes < 60) return `${minutes} min lecture`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${hours}h lecture`;
  return `${hours}h ${remainingMins}min`;
}

// Get related insights
function getRelatedInsights(
  currentInsight: MarketInsight,
  allInsights: MarketInsight[],
  limit: number = 3
): MarketInsight[] {
  // Find insights in same category or with similar tags
  let related = allInsights.filter(
    (i) =>
      i.id !== currentInsight.id &&
      (i.category.id === currentInsight.category.id ||
        i.tags?.some((tag) => currentInsight.tags?.includes(tag)))
  );

  // If not enough related by category/tags, add random ones
  if (related.length < limit) {
    const others = allInsights.filter(
      (i) => i.id !== currentInsight.id && !related.includes(i)
    );
    related = [...related, ...others.slice(0, limit - related.length)];
  }

  return related.slice(0, limit);
}

// Insight card component
function InsightCard({
  insight,
  variant = 'default',
  onViewInsight,
  onBookmark,
  onShare,
}: {
  insight: MarketInsight;
  variant?: 'default' | 'compact' | 'featured';
  onViewInsight?: (insightId: string) => void;
  onBookmark?: (insightId: string) => void;
  onShare?: (insightId: string) => void;
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const typeConfig = insightTypeConfig[insight.type];

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.(insight.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(insight.id);
  };

  // Compact variant - for sidebar or list views
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group',
          insight.isFeatured && 'bg-primary/5'
        )}
        onClick={() => onViewInsight?.(insight.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewInsight?.(insight.id);
          }
        }}
        aria-label={`Lire: ${insight.title}`}
      >
        {/* Mini thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
          {insight.coverImage ? (
            <img
              src={insight.coverImage}
              alt={insight.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              {typeConfig.icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn('text-xs py-0 px-1.5', typeConfig.color)}>
              {typeConfig.icon}
              {typeConfig.label}
            </Badge>
            {insight.isPremium && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs py-0 px-1.5">
                Premium
              </Badge>
            )}
          </div>
          
          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {insight.title}
          </h4>
          
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatReadingTime(insight.readingTime)}
            </span>
            <span>{formatDate(insight.publishedAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Featured variant - large card for hero section
  if (variant === 'featured') {
    return (
      <Card
        className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
        onClick={() => onViewInsight?.(insight.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewInsight?.(insight.id);
          }
        }}
      >
        {/* Large image banner */}
        <div className="relative aspect-[21/9] overflow-hidden">
          {insight.coverImage ? (
            <img
              src={insight.coverImage}
              alt={insight.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileText className="h-24 w-24 text-primary/30" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={cn('gap-1 bg-white/20 backdrop-blur-sm text-white border-white/30')}>
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
              {insight.isFeatured && (
                <Badge className="bg-amber-500/80 text-white border-none gap-1">
                  <StarIcon />
                  En vedette
                </Badge>
              )}
              {insight.isPremium && (
                <Badge className="bg-purple-500/80 text-white border-none">Premium</Badge>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
              {insight.title}
            </h2>

            <p className="text-white/80 line-clamp-2 mb-3 max-w-2xl">
              {insight.excerpt}
            </p>

            <div className="flex items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatReadingTime(insight.readingTime)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {insight.viewCount.toLocaleString('fr-DZ')} vues
              </span>
              <span>{formatDate(insight.publishedAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Default variant - standard card
  return (
    <Card
      className={cn(
        'overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300',
        insight.isFeatured && 'ring-2 ring-primary/20'
      )}
      onClick={() => onViewInsight?.(insight.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewInsight?.(insight.id);
        }
      }}
      aria-label={`Lire: ${insight.title}`}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {insight.coverImage ? (
          <img
            src={insight.coverImage}
            alt={insight.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className={cn('p-4 rounded-xl', typeConfig.color)}>
              {React.cloneElement(typeConfig.icon as React.ReactElement, {
                className: 'h-8 w-8',
              })}
            </div>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 bg-black/60 backdrop-blur-sm text-white border-none hover:bg-black/60">
            {typeConfig.icon}
            {typeConfig.label}
          </Badge>
          {insight.isFeatured && (
            <Badge className="bg-amber-500 text-white border-none gap-1">
              <StarIcon />
            </Badge>
          )}
        </div>

        {/* Premium badge */}
        {insight.isPremium && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-purple-500 text-white border-none">Premium</Badge>
          </div>
        )}
      </div>

      <CardContent className="pt-4 pb-4">
        {/* Category */}
        <Badge
          variant="outline"
          className="mb-2 text-xs"
          style={{
            backgroundColor: insight.category.color ?? undefined,
            borderColor: insight.category.color ?? undefined,
          }}
        >
          {insight.category.name}
        </Badge>

        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[48px]">
          {insight.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {insight.excerpt}
        </p>

        {/* Tags */}
        {insight.tags && insight.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {insight.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5">
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatReadingTime(insight.readingTime)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {insight.viewCount.toLocaleString('fr-DZ')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>{formatDate(insight.publishedAt)}</span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleBookmark}
                  aria-label={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Bookmark
                    className={cn(
                      'h-3.5 w-3.5',
                      isBookmarked && 'fill-current text-primary'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enregistrer</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleShare}
                  aria-label="Partager"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Partager</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Star icon helper
function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function MarketInsights({
  insights,
  categoryId,
  type,
  onViewInsight,
  onBookmark,
  onShare,
  className,
  categories = [],
  maxItems,
  showSearch = true,
  showFilters = true,
}: MarketInsightsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId ?? 'all');
  const [selectedType, setSelectedType] = useState<string>(type ?? 'all');
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  // Filter insights
  const filteredInsights = useMemo(() => {
    let filtered = [...insights];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.excerpt.toLowerCase().includes(query) ||
          i.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((i) => i.category.id === selectedCategory);
    }

    // Type filter
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter((i) => i.type === selectedType);
    }

    // Sort: featured first, then by date
    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Limit results
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [insights, searchQuery, selectedCategory, selectedType, maxItems]);

  // Get featured insight
  const featuredInsight = useMemo(() => {
    return insights.find((i) => i.isFeatured) ?? insights[0];
  }, [insights]);

  // Get other insights (non-featured)
  const regularInsights = useMemo(() => {
    return filteredInsights.filter((i) => i.id !== featuredInsight?.id);
  }, [filteredInsights, featuredInsight]);

  // Get related insights for expanded item
  const relatedInsights = useMemo(() => {
    if (!expandedInsightId) return [];
    const insight = insights.find((i) => i.id === expandedInsightId);
    if (!insight) return [];
    return getRelatedInsight(insight, insights);
  }, [expandedInsightId, insights]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('space-y-6', className)}>
        {/* Header with search and filters */}
        {(showSearch || showFilters) && (
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search input */}
                {showSearch && (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des articles, analyses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      aria-label="Rechercher des insights"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                        onClick={() => setSearchQuery('')}
                        aria-label="Effacer la recherche"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Filters */}
                {showFilters && (
                  <div className="flex gap-3">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-[150px]" aria-label="Filtrer par type">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(insightTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {categories.length > 0 && (
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[160px]" aria-label="Filtrer par catégorie">
                          <Tag className="h-4 w-4 mr-2" />
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
                )}
              </div>

              {/* Active filters display */}
              {(selectedCategory !== 'all' || selectedType !== 'all' || searchQuery) && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                  
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-1 hover:text-destructive"
                        aria-label="Supprimer le filtre de recherche"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {selectedType !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {insightTypeConfig[selectedType as InsightType]?.label}
                      <button
                        onClick={() => setSelectedType('all')}
                        className="ml-1 hover:text-destructive"
                        aria-label="Supprimer le filtre de type"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {categories.find((c) => c.id === selectedCategory)?.name}
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="ml-1 hover:text-destructive"
                        aria-label="Supprimer le filtre de catégorie"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs ml-auto"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedType('all');
                    }}
                  >
                    Tout effacer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredInsights.length} résultat{filteredInsights.length > 1 ? 's' : ''}
            {searchQuery && ` pour "${searchQuery}"`}
          </p>
        </div>

        {/* Featured insight (if exists and no active filters that hide it) */}
        {featuredInsight &&
          !searchQuery &&
          selectedCategory === 'all' &&
          selectedType === 'all' && (
            <InsightCard
              insight={featuredInsight}
              variant="featured"
              onViewInsight={(id) => {
                setExpandedInsightId(id);
                onViewInsight?.(id);
              }}
              onBookmark={onBookmark}
              onShare={onShare}
            />
          )}

        {/* Regular insights grid */}
        {regularInsights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onViewInsight={(id) => {
                  setExpandedInsightId(id);
                  onViewInsight?.(id);
                }}
                onBookmark={onBookmark}
                onShare={onShare}
              />
            ))}
          </div>
        ) : filteredInsights.length === 0 ? (
          /* No results */
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucun résultat trouvé</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Related insights when one is expanded */}
        {expandedInsightId && relatedInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-5 w-5" />
                Articles similaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatedInsights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    variant="compact"
                    onViewInsight={onViewInsight}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

// Export types
export type { MarketInsightsProps };
