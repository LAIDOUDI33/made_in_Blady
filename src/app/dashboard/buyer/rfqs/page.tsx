'use client';

import React, { useState } from 'react';
import { RFQCard, RFQCardData } from '@/components/buyer/RFQCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  PlusCircle,
  Filter,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

// Mock data for RFQs - in production this would come from API
const mockRFQs: RFQCardData[] = [
  {
    id: 'rfq-001',
    title: 'Fourniture de Ciment Portland CEM I 42.5',
    description: 'Besoin de 500 tonnes de ciment Portland pour projet de construction à Alger. Livraison échelonnée sur 3 mois.',
    quantity: 500,
    unit: 'tonnes',
    category: 'Matériaux Construction',
    status: 'QUOTATIONS_RECEIVED',
    deliveryLocation: 'Alger (16)',
    requiredDeliveryDate: '2024-03-15',
    expirationDate: '2024-02-15',
    quotationsCount: 8,
    createdAt: '2024-01-10',
  },
  {
    id: 'rfq-002',
    title: 'Acier à Haute Adhérence Fe E400',
    description: 'Acier HA pour ferraillage, différentes diamètres: 8, 10, 12, 14, 16, 20mm',
    quantity: 50,
    unit: 'tonnes',
    category: 'Fer & Acier',
    status: 'PUBLISHED',
    deliveryLocation: 'Oran (31)',
    requiredDeliveryDate: '2024-04-01',
    expirationDate: '2024-02-20',
    quotationsCount: 5,
    createdAt: '2024-01-12',
  },
  {
    id: 'rfq-003',
    title: 'Briques Creuses 12 Trous',
    description: 'Briques creuses pour murs de cloison et façades, dimensions standards 30x20x10cm',
    quantity: 50000,
    unit: 'unités',
    category: 'Matériaux Construction',
    status: 'NEGOTIATION',
    deliveryLocation: 'Constantine (25)',
    requiredDeliveryDate: '2024-02-28',
    expirationDate: '2024-01-25',
    quotationsCount: 3,
    createdAt: '2024-01-05',
  },
  {
    id: 'rfq-004',
    title: 'Gravier Concassé et Sable de Carrière',
    description: 'Granulats pour béton: gravier 3/8, 8/15, 15/25 et sable 0/4 lavé',
    quantity: 200,
    unit: 'm³',
    category: 'Agrégats',
    status: 'AWARDED',
    deliveryLocation: 'Sétif (28)',
    requiredDeliveryDate: '2024-02-20',
    quotationsCount: 6,
    createdAt: '2024-01-01',
  },
  {
    id: 'rfq-005',
    title: 'Peinture Bâtiment Extérieure',
    description: 'Peinture plastique haute qualité pour façades, couleurs RAL 9010 et RAL 7015',
    quantity: 1000,
    unit: 'litres',
    category: 'Peintures & Enduits',
    status: 'DRAFT',
    deliveryLocation: '',
    requiredDeliveryDate: '',
    quotationsCount: 0,
    createdAt: '2024-01-14',
  },
  {
    id: 'rfq-006',
    title: 'Tuyaux PVC Pression PN16',
    description: 'Tuyaux PVC pour réseau d\'irrigation, diamètres 63, 90, 110mm en barres 6m',
    quantity: 200,
    unit: 'unités',
    category: 'Plomberie & Sanitaire',
    status: 'CLOSED',
    deliveryLocation: 'Blida (09)',
    requiredDeliveryDate: '2024-01-30',
    quotationsCount: 4,
    createdAt: '2023-12-20',
  },
  {
    id: 'rfq-007',
    title: 'Câbles Électriques Cuivre',
    description: 'Câbles unipolaires H07V-U sections 1.5, 2.5, 4, 6, 10mm² selon normes algériennes',
    quantity: 10000,
    unit: 'mètres',
    category: 'Électricité',
    status: 'CANCELLED',
    deliveryLocation: 'Alger (16)',
    requiredDeliveryDate: '2024-01-20',
    quotationsCount: 2,
    createdAt: '2023-12-15',
  },
];

type StatusFilter = 'all' | RFQCardData['status'];

export default function BuyerRFQsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter RFQs based on search and status
  const filteredRFQs = mockRFQs.filter((rfq) => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalPublished = mockRFQs.filter(r => r.status === 'PUBLISHED' || r.status === 'QUOTATIONS_RECEIVED').length;
  const totalQuotations = mockRFQs.reduce((sum, r) => sum + r.quotationsCount, 0);
  const awardedCount = mockRFQs.filter(r => r.status === 'AWARDED').length;
  const awardRate = mockRFQs.filter(r => ['PUBLISHED', 'QUOTATIONS_RECEIVED', 'NEGOTIATION', 'AWARDED', 'CLOSED'].includes(r.status)).length > 0 
    ? Math.round((awardedCount / mockRFQs.filter(r => ['PUBLISHED', 'QUOTATIONS_RECEIVED', 'NEGOTIATION', 'AWARDED', 'CLOSED'].includes(r.status)).length) * 100)
    : 0;

  // Handle actions
  const handleView = (id: string) => {
    console.log('View RFQ:', id);
  };

  const handleEdit = (id: string) => {
    console.log('Edit RFQ:', id);
  };

  const handleDuplicate = (id: string) => {
    console.log('Duplicate RFQ:', id);
  };

  const handleClose = (id: string) => {
    console.log('Close RFQ:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Delete RFQ:', id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Appels d&apos;Offre</h1>
          <p className="text-gray-600 mt-1">Gérez vos demandes de devis</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/dashboard/buyer/rfqs/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvel Appel d&apos;Offre
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">AO Publiés</p>
              <p className="text-2xl font-bold text-gray-900">{totalPublished}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Devis Reçus</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuotations}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">AO Attribués</p>
              <p className="text-2xl font-bold text-gray-900">{awardedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux d&apos;Attribution</p>
              <p className="text-2xl font-bold text-gray-900">{awardRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher dans les AO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="QUOTATIONS_RECEIVED">Devis reçus</SelectItem>
                <SelectItem value="NEGOTIATION">Négociation</SelectItem>
                <SelectItem value="AWARDED">Attribué</SelectItem>
                <SelectItem value="CLOSED">Fermé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RFQ List */}
      <div className="space-y-4">
        {filteredRFQs.length > 0 ? (
          filteredRFQs.map((rfq) => (
            <RFQCard
              key={rfq.id}
              rfq={rfq}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onClose={handleClose}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun appel d&apos;offre trouvé</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Commencez par publier votre premier appel d\'offre'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/dashboard/buyer/rfqs/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer un AO
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
