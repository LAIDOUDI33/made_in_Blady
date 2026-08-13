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
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Send,
  Bookmark,
  XCircle,
  MapPin,
  Calendar,
  Users,
  Eye,
  Filter
} from 'lucide-react';

// Mock RFQ data - in production this would come from API
interface RFQItem {
  id: string;
  title: string;
  description?: string;
  buyerLocation: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
  category: string;
  postedDate: string;
  expirationDate?: string;
  quotationCount: number;
  status: string;
}

const mockRFQs: RFQItem[] = [
  {
    id: 'rfq-001',
    title: 'Besoin urgent de ciment Portland CEM I 42.5',
    description: 'Recherche fournisseur pour approvisionnement régulier de ciment pour chantier à Alger',
    buyerLocation: 'Alger, Bab El Oued',
    quantity: 5000,
    unit: 'sac de 50kg',
    targetPrice: 6000,
    currency: 'DZD',
    category: 'Matériaux de Construction',
    postedDate: '2024-01-15',
    expirationDate: '2024-02-15',
    quotationCount: 3,
    status: 'PUBLISHED',
  },
  {
    id: 'rfq-002',
    title: 'Acier en barres pour construction résidentielle',
    description: 'Projet de construction de 50 logements sociaux',
    buyerLocation: 'Oran, Sidi El Houari',
    quantity: 100,
    unit: 'tonne',
    targetPrice: null,
    currency: 'DZD',
    category: 'Matériaux de Construction',
    postedDate: '2024-01-14',
    expirationDate: '2024-02-14',
    quotationCount: 7,
    status: 'PUBLISHED',
  },
  {
    id: 'rfq-003',
    title: 'Briques creuses pour murs de cloison',
    buyerLocation: 'Constantine, Ain Abdeli',
    quantity: 20000,
    unit: 'unité',
    targetPrice: 15,
    currency: 'DZD',
    category: 'Matériaux de Construction',
    postedDate: '2024-01-13',
    quotationDate: '2024-01-20',
    quotationCount: 2,
    status: 'PUBLISHED',
  },
  {
    id: 'rfq-004',
    title: 'Sable et gravier pour bétonnage',
    buyerLocation: 'Blida, Chiffa',
    quantity: 500,
    unit: 'm³',
    targetPrice: null,
    currency: 'DZD',
    category: 'Matériaux de Construction',
    postedDate: '2024-01-12',
    expirationDate: '2024-02-12',
    quotationCount: 5,
    status: 'PUBLISHED',
  },
  {
    id: 'rfq-005',
    title: 'Poutrelles précontraintes pour plancher terrasse',
    description: 'Dimension standard HP4, longueur 5m',
    buyerLocation: 'Setif, Ain Azel',
    quantity: 300,
    unit: 'unité (5m)',
    targetPrice: 9000,
    currency: 'DZD',
    category: 'Préfabriqués',
    postedDate: '2024-01-11',
    expirationDate: '2024-01-25',
    quotationCount: 1,
    status: 'PUBLISHED',
  },
  {
    id: 'rfq-006',
    title: 'Peinture façade anti-humidité',
    buyerLocation: 'Annaba, Cité 1000',
    quantity: 1000,
    unit: 'litre',
    targetPrice: 800,
    currency: 'DZD',
    category: 'Peinture & Enduit',
    postedDate: '2024-01-10',
    expirationDate: '2024-02-10',
    quotationCount: 8,
    status: 'QUOTATIONS_RECEIVED',
  },
  {
    id: 'rfq-007',
    title: 'Câbles électriques cuivre 4mm²',
    buyerLocation: 'Tizi Ouzou, Centre ville',
    quantity: 5000,
    unit: 'mètre',
    targetPrice: 250,
    currency: 'DZD',
    category: 'Électrique & Éclairage',
    postedDate: '2024-01-09',
    expirationDate: '2024-02-09',
    quotationCount: 12,
    status: 'PUBLISHED',
  },
];

const columns = [
  {
    key: 'title' as const,
    label: 'Appel d&apos;Offre',
    sortable: true,
    render: (_: unknown, row: RFQItem) => (
      <div className="min-w-[250px]">
        <Link 
          href={`/dashboard/seller/quotations/new/${row.id}`}
          className="font-medium text-green-700 hover:text-green-800 hover:underline line-clamp-2"
        >
          {row.title}
        </Link>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{row.description}</p>
      </div>
    ),
  },
  {
    key: 'category' as const,
    label: 'Catégorie',
    render: (value: unknown) => (
      <Badge variant="outline" className="whitespace-nowrap">
        {String(value)}
      </Badge>
    ),
  },
  {
    key: 'buyerLocation' as const,
    label: 'Localisation',
    render: (_: unknown, row: RFQItem) => (
      <div className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{row.buyerLocation}</span>
      </div>
    ),
  },
  {
    key: 'quantity' as const,
    label: 'Quantité',
    sortable: true,
    render: (_: unknown, row: RFQItem) => (
      <span className="font-medium text-gray-900 whitespace-nowrap">
        {row.quantity.toLocaleString('fr-FR')} {row.unit}
      </span>
    ),
  },
  {
    key: 'targetPrice' as const,
    label: 'Prix Cible',
    render: (_: unknown, row: RFQItem) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {row.targetPrice ? (
          `${row.targetPrice.toLocaleString('fr-DZ')} ${row.currency}`
        ) : (
          <span className="text-gray-400">Sur demande</span>
        )}
      </span>
    ),
  },
  {
    key: 'quotationCount' as const,
    label: 'Devis',
    sortable: true,
    render: (value: unknown) => (
      <div className="flex items-center gap-1">
        <Send className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-sm font-medium">{Number(value)}</span>
      </div>
    ),
  },
  {
    key: 'postedDate' as const,
    label: 'Publié le',
    sortable: true,
    render: (value: unknown) => (
      <div className="flex items-center gap-1 text-sm text-gray-500 whitespace-nowrap">
        <Calendar className="h-3.5 w-3.5" />
        <span>{new Date(String(value)).toLocaleDateString('fr-FR')}</span>
      </div>
    ),
  },
  {
    key: 'status' as const,
    label: 'Statut',
    render: (value: unknown) => <StatusBadge status={String(value)} />,
  },
];

export default function RFQsPage() {
  const [savedRFQs, setSavedRFQs] = useState<Set<string>>(new Set());
  const [ignoredRFQs, setIgnoredRFQs] = useState<Set<string>>(new Set());

  // Filter out ignored RFQs
  const filteredRFQs = mockRFQs.filter((rfq) => !ignoredRFQs.has(rfq.id));

  const handleSaveForLater = (rfqId: string) => {
    setSavedRFQs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rfqId)) {
        newSet.delete(rfqId);
      } else {
        newSet.add(rfqId);
      }
      return newSet;
    });
  };

  const handleNotInterested = (rfqId: string) => {
    setIgnoredRFQs((prev) => new Set([...prev, rfqId]));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appels d&apos;Offres</h1>
          <p className="text-gray-600 mt-1">Découvrez les demandes d&apos;achat correspondant à vos produits</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtres Avancés
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total RFQs</p>
                <p className="text-2xl font-bold text-gray-900">{filteredRFQs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nouveaux</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredRFQs.filter(r => r.status === 'PUBLISHED').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sauvegardés</p>
                <p className="text-2xl font-bold text-orange-600">{savedRFQs.size}</p>
              </div>
              <Bookmark className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expirant bientôt</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredRFQs.filter(r => {
                    if (!r.expirationDate) return false;
                    const daysUntil = Math.ceil(
                      (new Date(r.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntil <= 7 && daysUntil > 0;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFQs Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filteredRFQs}
            columns={columns}
            searchable={true}
            searchPlaceholder="Rechercher dans les appels d'offres..."
            searchKeys={['title', 'description', 'buyerLocation']}
            filterable={true}
            filters={{
              key: 'category',
              label: 'Catégorie',
              options: [
                { value: 'Matériaux de Construction', label: 'Matériaux de Construction' },
                { value: 'Préfabriqués', label: 'Préfabriqués' },
                { value: 'Peinture & Enduit', label: 'Peinture & Enduit' },
                { value: 'Électrique & Éclairage', label: 'Électrique & Éclairage' },
              ],
            }}
            actions={(row) => (
              <>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/dashboard/seller/quotations/new/${row.id}`}>
                    <Send className="mr-2 h-4 w-4" /> Envoyer un Devis
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSaveForLater(row.id)}
                >
                  <Bookmark className={`mr-2 h-4 w-4 ${savedRFQs.has(row.id) ? 'fill-current' : ''}`} /> 
                  {savedRFQs.has(row.id) ? 'Retirer des sauvegardes' : 'Sauvegarder'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => handleNotInterested(row.id)}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Pas intéressé
                </DropdownMenuItem>
              </>
            )}
            emptyMessage="Aucun appel d'offres disponible pour le moment. Revenez plus tard !"
          />
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-green-800 flex items-center gap-2">
            💡 Conseils pour répondre aux Appels d&apos;Offres
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-700 space-y-2">
          <p>• Répondez rapidement aux nouvelles demandes pour augmenter vos chances</p>
          <p>• Fournissez un prix compétitif mais réaliste</p>
          <p>• Décrivez clairement vos conditions de livraison et paiement</p>
          <p>• Joignez votre catalogue ou fiches techniques si pertinent</p>
        </CardContent>
      </Card>
    </div>
  );
}
