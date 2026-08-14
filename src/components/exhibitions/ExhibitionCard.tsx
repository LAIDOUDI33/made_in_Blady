'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CalendarDays,
  MapPin,
  Users,
  Globe,
  MonitorPlay,
  Building2,
  Factory,
  Package,
  ChevronRight,
  ExternalLink,
  Clock,
  Video,
  Ticket,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type ExhibitionType =
  | 'virtual-trade-show'
  | 'industry-event'
  | 'trade-fair'
  | 'conference'
  | 'product-launch'
  | 'networking'
  | 'b2b-meeting'
  | 'workshop';

export type ExhibitionStatus = 'upcoming' | 'live' | 'ended' | 'cancelled' | 'postponed';

export interface ExhibitionData {
  id: string;
  title: string;
  slug?: string;
  description: string;
  coverImage?: string;
  type: ExhibitionType;
  status: ExhibitionStatus;
  startDate: string;
  endDate: string;
  location?: string; // Physical location
  virtualUrl?: string; // For virtual events
  city?: string;
  wilayaCode?: string;
  organizer: string;
  organizerLogo?: string;
  registeredCount: number;
  maxCapacity?: number;
  categories?: string[];
  featured?: boolean;
  isFree?: boolean;
  price?: number;
  currency?: string;
  websiteUrl?: string;
}

interface ExhibitionCardProps {
  exhibition: ExhibitionData;
  onRegister?: (exhibitionId: string) => void;
  onView?: (exhibitionId: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

// Exhibition type configuration
const exhibitionTypeConfig: Record<ExhibitionType, { label: string; icon: React.ReactNode; color: string }> = {
  'virtual-trade-show': {
    label: 'Salon Virtuel',
    icon: <MonitorPlay className="h-3.5 w-3.5" />,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  'industry-event': {
    label: 'Événement Industriel',
    icon: <Factory className="h-3.5 w-3.5" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  'trade-fair': {
    label: 'Foire Commerciale',
    icon: <Building2 className="h-3.5 w-3.5" />,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  conference: {
    label: 'Conférence',
    icon: <Users className="h-3.5 w-3.5" />,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  'product-launch': {
    label: 'Lancement Produit',
    icon: <Package className="h-3.5 w-3.5" />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  networking: {
    label: 'Networking',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    color: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  'b2b-meeting': {
    label: 'Réunion B2B',
    icon: <Users className="h-3.5 w-3.5" />,
    color: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  workshop: {
    label: 'Atelier',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
};

// Status configuration
const statusConfig: Record<ExhibitionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; pulse?: boolean }> = {
  upcoming: { label: 'À venir', variant: 'secondary', pulse: false },
  live: { label: 'En direct', variant: 'default', pulse: true },
  ended: { label: 'Terminé', variant: 'outline', pulse: false },
  cancelled: { label: 'Annulé', variant: 'destructive', pulse: false },
  postponed: { label: 'Reporté', variant: 'outline', pulse: false },
};

// Format date range
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (date: Date) =>
    date.toLocaleDateString('fr-DZ', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });

  if (start.toDateString() === end.toDateString()) {
    return `Le ${formatDate(start)}`;
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

// Calculate days until event
function getDaysUntilEvent(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Calculate capacity percentage
function getCapacityPercentage(registered: number, maxCapacity?: number): number | null {
  if (!maxCapacity) return null;
  return Math.round((registered / maxCapacity) * 100);
}

// Format currency
function formatPrice(price: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency === 'DZD' ? 'DZD' : currency,
    minimumFractionDigits: 0,
  })
    .format(price)
    .replace('DZD', 'DA')
    .trim();
}

export default function ExhibitionCard({
  exhibition,
  onRegister,
  onView,
  className,
  variant = 'default',
}: ExhibitionCardProps) {
  const typeConfig = exhibitionTypeConfig[exhibition.type];
  const currentStatus = statusConfig[exhibition.status];
  const daysUntil = getDaysUntilEvent(exhibition.startDate);
  const capacityPercent = getCapacityPercentage(exhibition.registeredCount, exhibition.maxCapacity);
  const isVirtual = exhibition.type === 'virtual-trade-show' || !!exhibition.virtualUrl;

  // Compact variant - for lists/grids
  if (variant === 'compact') {
    return (
      <TooltipProvider delayDuration={200}>
        <Card
          className={cn(
            'overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group',
            exhibition.featured && 'ring-2 ring-primary/30',
            className
          )}
          onClick={() => onView?.(exhibition.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onView?.(exhibition.id);
            }
          }}
          aria-label={`Exhibition: ${exhibition.title}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Mini cover image */}
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                {exhibition.coverImage ? (
                  <img
                    src={exhibition.coverImage}
                    alt={exhibition.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    {isVirtual ? (
                      <Video className="h-6 w-6 text-gray-400" />
                    ) : (
                      <CalendarDays className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {exhibition.title}
                  </h3>
                  <Badge
                    variant={currentStatus.variant}
                    className={cn(
                      'shrink-0 text-xs px-1.5 py-0',
                      currentStatus.pulse && 'animate-pulse'
                    )}
                  >
                    {currentStatus.label}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {formatDateRange(exhibition.startDate, exhibition.endDate)}
                  {exhibition.city && ` • ${exhibition.city}`}
                </p>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', typeConfig.color)}>
                    {typeConfig.icon}
                    {typeConfig.label}
                  </Badge>
                  
                  {capacityPercent !== null && (
                    <span className="text-xs text-muted-foreground">
                      {exhibition.registeredCount}/{exhibition.maxCapacity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Featured variant - larger card with more details
  if (variant === 'featured') {
    return (
      <TooltipProvider delayDuration={200}>
        <Card
          className={cn(
            'overflow-hidden hover:shadow-xl transition-all duration-300 group',
            exhibition.featured && 'ring-2 ring-primary/50 shadow-lg',
            className
          )}
        >
          {/* Cover Image */}
          <div className="relative aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {exhibition.coverImage ? (
              <img
                src={exhibition.coverImage}
                alt={exhibition.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isVirtual ? (
                  <Globe className="h-16 w-16 text-gray-300" />
                ) : (
                  <Building2 className="h-16 w-16 text-gray-300" />
                )}
              </div>
            )}

            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge
                variant={currentStatus.variant}
                className={cn(
                  'gap-1 shadow-md',
                  currentStatus.pulse && 'animate-pulse'
                )}
              >
                {exhibition.status === 'live' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
                {currentStatus.label}
              </Badge>
              
              {exhibition.featured && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100 gap-1">
                  <Sparkles className="h-3 w-3" />
                  En vedette
                </Badge>
              )}
            </div>

            {/* Type badge */}
            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className={cn('gap-1 bg-white/90 backdrop-blur-sm', typeConfig.color)}>
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
            </div>

            {/* Price badge */}
            {(exhibition.price !== undefined || exhibition.isFree) && (
              <div className="absolute bottom-3 right-3">
                <Badge
                  variant={exhibition.isFree ? 'default' : 'secondary'}
                  className={cn('gap-1 bg-white/90 backdrop-blur-sm')}
                >
                  {exhibition.isFree ? (
                    <>
                      <Ticket className="h-3 w-3" />
                      Gratuit
                    </>
                  ) : (
                    formatPrice(exhibition.price!, exhibition.currency)
                  )}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="pt-5 pb-5">
            {/* Title and Description */}
            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {exhibition.title}
            </h3>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {exhibition.description}
            </p>

            {/* Meta info grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>{formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                {isVirtual ? (
                  <Globe className="h-4 w-4 shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">
                  {isVirtual ? 'En ligne' : exhibition.location ?? exhibition.city}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  {exhibition.registeredCount.toLocaleString('fr-DZ')} inscrits
                  {exhibition.maxCapacity && ` / ${exhibition.maxCapacity.toLocaleString('fr-DZ')}`}
                </span>
              </div>

              {daysUntil > 0 && exhibition.status === 'upcoming' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className={cn(daysUntil <= 7 && 'text-orange-600 font-medium')}>
                    Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Capacity bar */}
            {exhibition.maxCapacity && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Places disponibles</span>
                  <span>{capacityPercent}% complet</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      capacityPercent >= 90
                        ? 'bg-red-500'
                        : capacityPercent >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    )}
                    style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Categories */}
            {exhibition.categories && exhibition.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {exhibition.categories.slice(0, 3).map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
                {exhibition.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{exhibition.categories.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                className="flex-1 gap-2"
                disabled={exhibition.status === 'ended' || exhibition.status === 'cancelled'}
                onClick={(e) => {
                  e.stopPropagation();
                  onRegister?.(exhibition.id);
                }}
              >
                {exhibition.status === 'live' ? (
                  <>
                    <Video className="h-4 w-4" />
                    Rejoindre maintenant
                  </>
                ) : exhibition.status === 'upcoming' ? (
                  <>
                    <Ticket className="h-4 w-4" />
                    S&apos;inscrire
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Voir détails
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(exhibition.id);
                }}
                aria-label={`Voir les détails de ${exhibition.title}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Default variant
  return (
    <TooltipProvider delayDuration={200}>
      <Card
        className={cn(
          'overflow-hidden hover:shadow-lg transition-all duration-300 group',
          exhibition.featured && 'ring-2 ring-primary/30',
          className
        )}
      >
        {/* Cover Image */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {exhibition.coverImage ? (
            <img
              src={exhibition.coverImage}
              alt={exhibition.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isVirtual ? (
                <Globe className="h-12 w-12 text-gray-300" />
              ) : (
                <Building2 className="h-12 w-12 text-gray-300" />
              )}
            </div>
          )}

          {/* Top overlay */}
          <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between">
              <Badge
                variant={currentStatus.variant}
                className={cn(
                  'gap-1',
                  currentStatus.pulse && 'animate-pulse'
                )}
              >
                {exhibition.status === 'live' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
                {currentStatus.label}
              </Badge>

              {exhibition.type === 'virtual-trade-show' && (
                <Badge className="bg-purple-500/80 text-white border-none gap-1">
                  <MonitorPlay className="h-3 w-3" />
                  Virtuel
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="pt-4">
          {/* Type badge */}
          <Badge variant="outline" className={cn('mb-2', typeConfig.color)}>
            {typeConfig.icon}
            {typeConfig.label}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
            onClick={() => onView?.(exhibition.id)}
          >
            {exhibition.title}
          </h3>

          {/* Date & Location */}
          <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isVirtual ? (
                <Globe className="h-4 w-4 shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {isVirtual ? 'En ligne' : (exhibition.location ?? exhibition.city)}
              </span>
            </div>
          </div>

          {/* Capacity indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{exhibition.registeredCount.toLocaleString('fr-DZ')} inscrits</span>
            </div>
            
            {exhibition.maxCapacity && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      capacityPercent! >= 90
                        ? 'bg-red-500'
                        : capacityPercent! >= 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    )}
                    style={{ width: `${Math.min(capacityPercent!, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{capacityPercent}%</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-1.5"
              size="sm"
              disabled={exhibition.status === 'ended' || exhibition.status === 'cancelled'}
              onClick={() => onRegister?.(exhibition.id)}
            >
              {exhibition.status === 'live' ? (
                <>
                  <Video className="h-4 w-4" />
                  Entrer
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4" />
                  S&apos;inscrire
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(exhibition.id)}
              aria-label={`Voir ${exhibition.title}`}
            >
              Détails
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Export types
export type { ExhibitionCardProps };
