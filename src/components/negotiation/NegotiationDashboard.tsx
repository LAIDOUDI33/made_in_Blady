'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Eye,
  MoreVertical
} from 'lucide-react';
import type { NegotiationWithOffers } from '@/lib/negotiation/engine';
import type { NegotiationStatus, NegotiationType } from '@/lib/negotiation/config';

interface NegotiationDashboardProps {
  negotiations: NegotiationWithOffers[];
  currentUserId?: string;
  onCreateNew?: () => void;
  onViewDetails?: (id: string) => void;
  onNegotiate?: (id: string) => void;
  onAccept?: (id: string) => void;
  isLoading?: boolean;
  language?: 'en' | 'ar' | 'fr';
}

const statusConfig: Record<NegotiationStatus, { color: string; icon: React.ReactNode; label: string; labelAr: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-4 w-4" />, label: 'Pending', labelAr: 'معلق' },
  COUNTERED: { color: 'bg-orange-100 text-orange-700', icon: <ArrowRightLeft className="h-4 w-4" />, label: 'Countered', labelAr: 'تم الرد المضاد' },
  ACCEPTED: { color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-4 w-4" />, label: 'Accepted', labelAr: 'مقبول' },
  REJECTED: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-4 w-4" />, label: 'Rejected', labelAr: 'مرفوض' },
  EXPIRED: { color: 'bg-gray-100 text-gray-500', icon: <Clock className="h-4 w-4" />, label: 'Expired', labelAr: 'منتهي الصلاحية' },
  WITHDRAWN: { color: 'bg-purple-100 text-purple-700', icon: <XCircle className="h-4 w-4" />, label: 'Withdrawn', labelAr: 'مسحوب' },
  ORDER_CREATED: { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle2 className="h-4 w-4" />, label: 'Order Created', labelAr: 'تم إنشاء الطلب' },
};

const typeLabels: Record<NegotiationType, { label: string; ar: string }> = {
  PRICE: { label: 'Price', ar: 'السعر' },
  QUANTITY: { label: 'Quantity', ar: 'الكمية' },
  DELIVERY_DATE: { label: 'Delivery Date', ar: 'تاريخ التسليم' },
  PAYMENT_TERMS: { label: 'Payment Terms', ar: 'شروط الدفع' },
  BUNDLE: { label: 'Bundle Deal', ar: 'صفقة مجمعة' },
};

export function NegotiationDashboard({
  negotiations,
  currentUserId,
  onCreateNew,
  onViewDetails,
  onNegotiate,
  onAccept,
  isLoading = false,
  language = 'en',
}: NegotiationDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getLabel = (en: string, ar: string) => {
    return language === 'ar' ? ar : en;
  };

  // Filter negotiations
  const filteredNegotiations = useMemo(() => {
    return negotiations.filter(neg => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          neg.negotiationNumber.toLowerCase().includes(query) ||
          neg.type.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && neg.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && neg.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [negotiations, searchQuery, statusFilter, typeFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = negotiations.length;
    const active = negotiations.filter(n => n.status === 'PENDING' || n.status === 'COUNTERED').length;
    const accepted = negotiations.filter(n => n.status === 'ACCEPTED').length;
    const totalSavings = negotiations
      .filter(n => n.status === 'ACCEPTED')
      .reduce((sum, n) => sum + (n.originalPrice - n.currentPrice), 0);

    return { total, active, accepted, totalSavings };
  }, [negotiations]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + ' د.ج';
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = new Date(expiresAt).getTime() - now.getTime();
    
    if (diff <= 0) return { text: 'Expired', urgent: false };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return { text: `${days}d remaining`, urgent: days <= 1 };
    return { text: `${hours}h remaining`, urgent: hours <= 6 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{getLabel('Negotiations', 'المفاوضات')}</h2>
          <p className="text-muted-foreground mt-1">
            {getLabel('Manage your offer and counter-offer workflow', 'إدارة سير العمل للعروض والعروض المضادة')}
          </p>
        </div>
        
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {getLabel('New Offer', 'عرض جديد')}
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{getLabel('Total', 'الإجمالي')}</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{getLabel('Active', 'نشط')}</p>
                <p className="text-3xl font-bold text-orange-600">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{getLabel('Accepted', 'مقبول')}</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{getLabel('Total Savings', 'إجمالي الوفورات')}</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(stats.totalSavings)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={getLabel('Search negotiations...', 'البحث في المفاوضات...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={getLabel('Status', 'الحالة')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getLabel('All Statuses', 'جميع الحالات')}</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COUNTERED">Countered</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={getLabel('Type', 'النوع')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getLabel('All Types', 'جميع الأنواع')}</SelectItem>
                <SelectItem value="PRICE">{getLabel('Price', 'السعر')}</SelectItem>
                <SelectItem value="QUANTITY">{getLabel('Quantity', 'الكمية')}</SelectItem>
                <SelectItem value="DELIVERY_DATE">{getLabel('Delivery', 'التسليم')}</SelectItem>
                <SelectItem value="PAYMENT_TERMS">{getLabel('Payment', 'الدفع')}</SelectItem>
                <SelectItem value="BUNDLE">{getLabel('Bundle', 'مجمعة')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Negotiations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {getLabel('All Negotiations', 'جميع المفاوضات')}
            <Badge variant="outline" className="ml-2">{filteredNegotiations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-3" />
              <p>{getLabel('Loading...', 'جارٍ التحميل...')}</p>
            </div>
          ) : filteredNegotiations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{getLabel('No negotiations found', 'لا توجد مفاوضات')}</p>
              <p className="text-sm mt-1">
                {getLabel(
                  'Try adjusting your filters or create a new offer',
                  'حاول تعديل الفلاتر أو إنشاء عرض جديد'
                )}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNegotiations.map((negotiation) => {
                const status = statusConfig[negotiation.status];
                const typeInfo = typeLabels[negotiation.type];
                const timeInfo = getTimeRemaining(negotiation.expiresAt);
                const isActive = negotiation.status === 'PENDING' || negotiation.status === 'COUNTERED';
                const savingsPercent = ((negotiation.originalPrice - negotiation.currentPrice) / negotiation.originalPrice * 100).toFixed(1);

                return (
                  <div key={negotiation.id} className={`p-4 hover:bg-muted/30 transition-colors ${timeInfo.urgent && isActive ? 'border-l-4 border-l-orange-400' : ''}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-lg truncate">{negotiation.negotiationNumber}</span>
                          <Badge className={status.color}>
                            {status.icon}
                            <span className="ml-1">{getLabel(status.label, status.labelAr)}</span>
                          </Badge>
                          <Badge variant="outline">{getLabel(typeInfo.label, typeInfo.ar)}</Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {getLabel('Original', 'الأصلي')}: <strong className="text-foreground">{formatCurrency(negotiation.originalPrice)}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            {getLabel('Current', 'الحالي')}: <strong className="text-primary">{formatCurrency(negotiation.currentPrice)}</strong>
                          </span>
                          <span className={`flex items-center gap-1 font-medium ${parseFloat(savingsPercent) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(savingsPercent) > 0 ? '-' : '+'}{Math.abs(parseFloat(savingsPercent))}%
                          </span>
                          {isActive && (
                            <span className={`flex items-center gap-1 ${timeInfo.urgent ? 'text-orange-600 font-medium' : ''}`}>
                              <Clock className="h-3 w-3" />
                              {timeInfo.text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 lg:flex-shrink-0">
                        {onViewDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails(negotiation.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {getLabel('View', 'عرض')}
                          </Button>
                        )}

                        {isActive && onNegotiate && (
                          <Button
                            size="sm"
                            onClick={() => onNegotiate(negotiation.id)}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            {getLabel('Negotiate', 'تفاوض')}
                          </Button>
                        )}

                        {isActive && onAccept && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onAccept(negotiation.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {getLabel('Accept', 'قبول')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default NegotiationDashboard;
