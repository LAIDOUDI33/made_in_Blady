'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import NegotiationCard from './NegotiationCard';
import type { Negotiation, NegotiationStatus, NegotiationType } from '@/lib/negotiation';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';

interface NegotiationHistoryProps {
  negotiations: Negotiation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: NegotiationFilters) => void;
  onCreateNew?: () => void;
  onViewNegotiation?: (id: string) => void;
  onNegotiate?: (id: string) => void;
  onAccept?: (id: string) => void;
  currentUserId?: string;
  language?: 'en' | 'ar' | 'fr';
}

export interface NegotiationFilters {
  status?: NegotiationStatus;
  type?: NegotiationType;
  search?: string;
}

const statusOptions: { value: NegotiationStatus | 'all'; label: string; ar: string; fr: string }[] = [
  { value: 'all', label: 'All Status', ar: 'جميع الحالات', fr: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Draft', ar: 'مسودة', fr: 'Brouillon' },
  { value: 'SENT', label: 'Sent', ar: 'مرسل', fr: 'Envoyé' },
  { value: 'UNDER_REVIEW', label: 'Under Review', ar: 'قيد المراجعة', fr: 'En révision' },
  { value: 'COUNTERED', label: 'Countered', ar: 'تم الرد المضاد', fr: 'Contre-offre' },
  { value: 'ACCEPTED', label: 'Accepted', ar: 'مقبول', fr: 'Accepté' },
  { value: 'REJECTED', label: 'Rejected', ar: 'مرفوض', fr: 'Rejeté' },
  { value: 'EXPIRED', label: 'Expired', ar: 'منتهي الصلاحية', fr: 'Expiré' },
];

const typeOptions: { value: NegotiationType | 'all'; label: string; ar: string; fr: string }[] = [
  { value: 'all', label: 'All Types', ar: 'جميع الأنواع', fr: 'Tous les types' },
  { value: 'PRICE', label: 'Price', ar: 'السعر', fr: 'Prix' },
  { value: 'QUANTITY', label: 'Quantity', ar: 'الكمية', fr: 'Quantité' },
  { value: 'DELIVERY_TERMS', label: 'Delivery Terms', ar: 'شروط التسليم', fr: 'Conditions de livraison' },
  { value: 'PAYMENT_TERMS', label: 'Payment Terms', ar: 'شروط الدفع', fr: 'Conditions de paiement' },
  { value: 'COMPREHENSIVE', label: 'Comprehensive', ar: 'شامل', fr: 'Complet' },
];

export function NegotiationHistory({
  negotiations,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onFilterChange,
  onCreateNew,
  onViewNegotiation,
  onNegotiate,
  onAccept,
  currentUserId,
  language = 'en',
}: NegotiationHistoryProps) {
  const [filters, setFilters] = useState<NegotiationFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const handleFilterUpdate = (key: keyof NegotiationFilters, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {getLabel('Negotiations', 'المفاوضات', 'Négociations')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {total} {getLabel('negotiations found', 'مفاوضات موجودة', 'négociations trouvées')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            {getLabel('Filters', 'التصفية', 'Filtres')}
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {onCreateNew && (
            <Button size="sm" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-1" />
              {getLabel('New Negotiation', 'مفاوضات جديدة', 'Nouvelle négociation')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={getLabel('Search...', 'بحث...', 'Recherche...')}
                  value={filters.search || ''}
                  onChange={(e) => handleFilterUpdate('search', e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => handleFilterUpdate('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getLabel('Status', 'الحالة', 'Statut')} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {getLabel(option.label, option.ar, option.fr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select 
                value={filters.type || 'all'} 
                onValueChange={(value) => handleFilterUpdate('type', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getLabel('Type', 'النوع', 'Type')} />
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
          </CardContent>
        </Card>
      )}

      {/* Negotiations List */}
      {negotiations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {negotiations.map((negotiation) => (
              <NegotiationCard
                key={negotiation.id}
                negotiation={negotiation}
                currentUserId={currentUserId}
                language={language}
                onViewDetails={onViewNegotiation}
                onNegotiate={onNegotiate}
                onAccept={onAccept}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                {getLabel('Previous', 'السابق', 'Précédent')}
              </Button>

              <span className="text-sm text-muted-foreground">
                {getLabel('Page', 'صفحة', 'Page')} {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
              >
                {getLabel('Next', 'التالي', 'Suivant')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div>
                <h3 className="font-medium text-lg">
                  {getLabel('No negotiations found', 'لا توجد مفاوضات', 'Aucune négociation trouvée')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {getLabel(
                    'Start a new negotiation to see it here',
                    'ابدأ مفاوضات جديدة لتظهر هنا',
                    'Commencez une nouvelle négociation pour la voir ici'
                  )}
                </p>
              </div>

              {onCreateNew && (
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  {getLabel('Start Negotiation', 'بدء المفاوضات', 'Démarrer une négociation')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NegotiationHistory;
