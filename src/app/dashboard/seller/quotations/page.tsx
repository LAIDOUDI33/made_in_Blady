'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Eye,
  Pencil,
  Copy,
  RotateCcw,
  FileText,
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';

// Mock quotation data - in production this would come from API
interface Quotation {
  id: string;
  rfqTitle: string;
  rfqId: string;
  buyerName: string;
  totalAmount: number;
  currency: string;
  status: string;
  sentDate?: string;
  validUntil?: string;
  viewedDate?: string;
  itemsCount: number;
}

const mockQuotations: Quotation[] = [
  {
    id: 'QT-2024-001',
    rfqTitle: 'Besoin urgent de ciment Portland CEM I 42.5',
    rfqId: 'rfq-001',
    buyerName: 'Sarl Bâtiment Plus',
    totalAmount: 30000000,
    currency: 'DZD',
    status: 'SENT',
    sentDate: '2024-01-15',
    validUntil: '2024-02-15',
    itemsCount: 1,
  },
  {
    id: 'QT-2024-002',
    rfqTitle: 'Acier en barres pour construction résidentielle',
    rfqId: 'rfq-002',
    buyerName: 'Groupe Immobilier Oranais',
    totalAmount: 28500000,
    currency: 'DZD',
    status: 'VIEWED',
    sentDate: '2024-01-14',
    validUntil: '2024-02-14',
    viewedDate: '2024-01-15',
    itemsCount: 2,
  },
  {
    id: 'QT-2024-003',
    rfqTitle: 'Briques creuses pour murs de cloison',
    rfqId: 'rfq-003',
    buyerName: 'Ets. Nouara Construction',
    totalAmount: 280000,
    currency: 'DZD',
    status: 'ACCEPTED',
    sentDate: '2024-01-12',
    validUntil: '2024-02-12',
    itemsCount: 1,
  },
  {
    id: 'QT-2024-004',
    rfqTitle: 'Sable et gravier pour bétonnage',
    rfqId: 'rfq-004',
    buyerName: 'Matières Premières SARL',
    totalAmount: 2250000,
    currency: 'DZD',
    status: 'REJECTED',
    sentDate: '2024-01-10',
    validUntil: '2024-02-10',
    itemsCount: 2,
  },
  {
    id: 'QT-2024-005',
    rfqTitle: 'Poutrelles précontraintes pour plancher terrasse',
    rfqId: 'rfq-005',
    buyerName: 'Construction Moderne',
    totalAmount: 2700000,
    currency: 'DZD',
    status: 'EXPIRED',
    sentDate: '2024-01-05',
    validUntil: '2024-01-20',
    itemsCount: 1,
  },
  {
    id: 'QT-2024-006',
    rfqTitle: 'Peinture façade anti-humidité',
    rfqId: 'rfq-006',
    buyerName: 'Rénovation Express',
    totalAmount: 800000,
    currency: 'DZD',
    status: 'DRAFT',
    itemsCount: 2,
  },
  {
    id: 'QT-2024-007',
    rfqTitle: 'Câbles électriques cuivre 4mm²',
    rfqId: 'rfq-007',
    buyerName: 'Électricité Pro Algérie',
    totalAmount: 1250000,
    currency: 'DZD',
    status: 'SENT',
    sentDate: '2024-01-16',
    validUntil: '2024-02-16',
    itemsCount: 1,
  },
];

const columns = [
  {
    key: 'id' as const,
    label: 'N° Devis',
    sortable: true,
    render: (value: unknown) => (
      <span className="font-medium text-green-700">{String(value)}</span>
    ),
  },
  {
    key: 'rfqTitle' as const,
    label: 'Appel d&apos;Offre',
    render: (_: unknown, row: Quotation) => (
      <div className="min-w-[200px]">
        <p className="font-medium text-gray-900 line-clamp-1">{row.rfqTitle}</p>
        <p className="text-xs text-gray-500">Client: {row.buyerName}</p>
      </div>
    ),
  },
  {
    key: 'itemsCount' as const,
    label: 'Articles',
    render: (value: unknown) => (
      <Badge variant="secondary">{value} article(s)</Badge>
    ),
  },
  {
    key: 'totalAmount' as const,
    label: 'Montant Total',
    sortable: true,
    render: (_: unknown, row: Quotation) => (
      <span className="font-semibold text-gray-900 whitespace-nowrap">
        {row.totalAmount.toLocaleString('fr-DZ')} {row.currency}
      </span>
    ),
  },
  {
    key: 'status' as const,
    label: 'Statut',
    render: (value: unknown) => <StatusBadge status={String(value)} />,
  },
  {
    key: 'sentDate' as const,
    label: 'Date Envoi',
    sortable: true,
    render: (value: unknown) => value ? (
      <span className="text-sm text-gray-500">
        {new Date(String(value)).toLocaleDateString('fr-FR')}
      </span>
    ) : '-',
  },
  {
    key: 'validUntil' as const,
    label: 'Valide jusqu\'au',
    render: (value: unknown) => {
      if (!value) return '-';
      const isValid = new Date(String(value)) > new Date();
      return (
        <span className={`text-sm ${isValid ? 'text-gray-600' : 'text-red-600 font-medium'}`}>
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      );
    },
  },
];

export default function QuotationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter quotations by status
  const filteredQuotations = statusFilter === 'all'
    ? mockQuotations
    : mockQuotations.filter((q) => q.status === statusFilter);

  // Calculate stats
  const stats = {
    total: mockQuotations.length,
    draft: mockQuotations.filter((q) => q.status === 'DRAFT').length,
    sent: mockQuotations.filter((q) => q.status === 'SENT' || q.status === 'VIEWED').length,
    accepted: mockQuotations.filter((q) => q.status === 'ACCEPTED').length,
    conversionRate: Math.round((mockQuotations.filter((q) => q.status === 'ACCEPTED').length / Math.max(1, mockQuotations.filter((q) => q.status !== 'DRAFT').length)) * 100),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Devis</h1>
          <p className="text-gray-600 mt-1">Gérez vos devis envoyés aux acheteurs</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/dashboard/seller/rfqs">
            <Send className="h-4 w-4 mr-2" />
            Nouveau Devis
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Devis</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Envoyés/Vus</p>
                <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
              </div>
              <Send className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Acceptés</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de Conversion</p>
                <p className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Tous', count: stats.total },
          { value: 'DRAFT', label: 'Brouillons', count: stats.draft },
          { value: 'SENT', label: 'Envoyés', count: mockQuotations.filter(q => q.status === 'SENT').length },
          { value: 'VIEWED', label: 'Vus', count: mockQuotations.filter(q => q.status === 'VIEWED').length },
          { value: 'ACCEPTED', label: 'Acceptés', count: stats.accepted },
          { value: 'REJECTED', label: 'Rejetés', count: mockQuotations.filter(q => q.status === 'REJECTED').length },
          { value: 'EXPIRED', label: 'Expirés', count: mockQuotations.filter(q => q.status === 'EXPIRED').length },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
            className={statusFilter === tab.value ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {tab.label}
            <Badge 
              variant={statusFilter === tab.value ? 'secondary' : 'outline'} 
              className="ml-2"
            >
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Quotations Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filteredQuotations}
            columns={columns}
            searchable={true}
            searchPlaceholder="Rechercher un devis..."
            searchKeys={['id', 'rfqTitle', 'buyerName']}
            actions={(row) => (
              <>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/dashboard/seller/quotations/${row.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Voir Détails
                  </Link>
                </DropdownMenuItem>
                {row.status === 'DRAFT' && (
                  <>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href={`/dashboard/seller/quotations/new/${row.rfqId}`}>
                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Copy className="mr-2 h-4 w-4" /> Dupliquer
                    </DropdownMenuItem>
                  </>
                )}
                {(row.status === 'SENT' || row.status === 'VIEWED') && (
                  <DropdownMenuItem className="cursor-pointer text-orange-600 focus:text-orange-600">
                    <RotateCcw className="mr-2 h-4 w-4" /> Retirer
                  </DropdownMenuItem>
                )}
              </>
            )}
            emptyMessage="Aucun devis trouvé. Répondez à des appels d'offres pour créer des devis !"
          />
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-blue-800 flex items-center gap-2">
            💡 Optimiser vos Devis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>• Les devis avec description détaillée ont 40% plus de chances d&apos;être acceptés</p>
          <p>• Répondez dans les 24h suivant la publication pour plus de visibilité</p>
          <p>• Proposez une durée de validité d&apos;au moins 30 jours</p>
          <p>• Suivez les devis non lus et relancez si nécessaire</p>
        </CardContent>
      </Card>
    </div>
  );
}
