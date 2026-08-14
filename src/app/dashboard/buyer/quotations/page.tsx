'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  Inbox,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Award,
  Archive,
  Star,
  Building2,
  ArrowUpDown,
  Download
} from 'lucide-react';

// Mock quotations data - in production this would come from API
const mockQuotations = [
  {
    id: 'qt-001',
    rfqId: 'rfq-001',
    rfqTitle: 'Fourniture de Ciment Portland CEM I 42.5',
    companyName: 'Cimenterie d\'Algérie - SCUM',
    isVerified: true,
    rating: 4.8,
    totalPrice: 62500000,
    currency: 'DZD',
    validUntil: '2024-02-28',
    notes: 'Prix négociable pour commande récurrente.',
    status: 'SENT' as const,
    submittedAt: '2024-01-12T10:30:00',
    isRead: false,
  },
  {
    id: 'qt-002',
    rfqId: 'rfq-001',
    rfqTitle: 'Fourniture de Ciment Portland CEM I 42.5',
    companyName: 'EREX - Usine d\'El Hamdania',
    isVerified: true,
    rating: 4.6,
    totalPrice: 61000000,
    currency: 'DZD',
    validUntil: '2024-02-25',
    notes: 'Qualité premium. Possibilité de visite usine.',
    status: 'SENT' as const,
    submittedAt: '2024-01-13T09:15:00',
    isRead: false,
  },
  {
    id: 'qt-003',
    rfqId: 'rfq-001',
    rfqTitle: 'Fourniture de Ciment Portland CEM I 42.5',
    companyName: 'Villa Import SARL',
    isVerified: false,
    rating: 4.2,
    totalPrice: 58500000,
    currency: 'DZD',
    validUntil: '2024-02-20',
    notes: 'Import Espagne. Délai 45 jours.',
    status: 'VIEWED' as const,
    submittedAt: '2024-01-11T14:45:00',
    isRead: true,
  },
  {
    id: 'qt-004',
    rfqId: 'rfq-002',
    rfqTitle: 'Acier à Haute Adhérence Fe E400',
    companyName: 'AcierPro SARL',
    isVerified: true,
    rating: 4.9,
    totalPrice: 9250000,
    currency: 'DZD',
    validUntil: '2024-02-20',
    notes: 'Stock disponible immédiatement.',
    status: 'SENT' as const,
    submittedAt: '2024-01-14T08:20:00',
    isRead: false,
  },
  {
    id: 'qt-005',
    rfqId: 'rfq-002',
    rfqTitle: 'Acier à Haute Adhérence Fe E400',
    companyName: 'MétalAlgérie',
    isVerified: true,
    rating: 4.7,
    totalPrice: 8950000,
    currency: 'DZD',
    validUntil: '2024-02-18',
    notes: 'Fabrication sur mesure possible.',
    status: 'ACCEPTED' as const,
    submittedAt: '2024-01-13T16:30:00',
    isRead: true,
  },
  {
    id: 'qt-006',
    rfqId: 'rfq-003',
    rfqTitle: 'Briques Creuses 12 Trous',
    companyName: 'Briqueterie Moderne',
    isVerified: true,
    rating: 4.5,
    totalPrice: 750000,
    currency: 'DZD',
    validUntil: '2024-01-25',
    notes: 'Production locale, livraison rapide.',
    status: 'REJECTED' as const,
    submittedAt: '2024-01-10T11:00:00',
    isRead: true,
  },
  {
    id: 'qt-007',
    rfqId: 'rfq-003',
    rfqTitle: 'Briques Creuses 12 Trous',
    companyName: 'MatBrique Constantine',
    isVerified: false,
    rating: 4.0,
    totalPrice: 700000,
    currency: 'DZD',
    validUntil: '2024-01-28',
    notes: 'Prix compétitif, qualité standard.',
    status: 'SENT' as const,
    submittedAt: '2024-01-12T13:45:00',
    isRead: false,
  },
];

type Quotation = typeof mockQuotations[0];
type SortField = 'price' | 'date' | 'rating' | 'supplier';
type SortOrder = 'asc' | 'desc';

export default function BuyerQuotationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);

  // Get unique suppliers for filter
  const uniqueSuppliers = [...new Set(mockQuotations.map(q => q.companyName))];

  // Filter and sort quotations
  const filteredQuotations = mockQuotations
    .filter((quotation) => {
      const matchesSearch = 
        quotation.rfqTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quotation.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
      const matchesSupplier = supplierFilter === 'all' || quotation.companyName === supplierFilter;
      return matchesSearch && matchesStatus && matchesSupplier;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'price':
          comparison = a.totalPrice - b.totalPrice;
          break;
        case 'date':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'supplier':
          comparison = a.companyName.localeCompare(b.companyName);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle selection
  const toggleSelectAll = () => {
    if (selectedQuotations.length === filteredQuotations.length) {
      setSelectedQuotations([]);
    } else {
      setSelectedQuotations(filteredQuotations.map(q => q.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedQuotations(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleMarkAsRead = () => {
    console.log('Mark as read:', selectedQuotations);
    setSelectedQuotations([]);
  };

  const handleArchive = () => {
    console.log('Archive:', selectedQuotations);
    setSelectedQuotations([]);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Stats
  const unreadCount = mockQuotations.filter(q => !q.isRead).length;
  const totalCount = mockQuotations.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Devis Reçus</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 text-orange-600">
                <Inbox className="h-4 w-4" />
                {unreadCount} devis non lus
              </span>
            )}
            {' • '}Total: {totalCount} devis
          </p>
        </div>
        <div className="flex gap-3">
          {selectedQuotations.length > 0 && (
            <>
              <Button variant="outline" onClick={handleMarkAsRead}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marquer comme lu ({selectedQuotations.length})
              </Button>
              <Button variant="outline" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archiver
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par AO ou fournisseur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="SENT">Nouveau</SelectItem>
                <SelectItem value="VIEWED">Lu</SelectItem>
                <SelectItem value="ACCEPTED">Accepté</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
                <SelectItem value="EXPIRED">Expiré</SelectItem>
              </SelectContent>
            </Select>

            {/* Supplier Filter */}
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {uniqueSuppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardContent className="p-0">
          {filteredQuotations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedQuotations.length === filteredQuotations.length && filteredQuotations.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Appel d&apos;Offre</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      Prix
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center gap-1">
                      Note
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow 
                    key={quotation.id}
                    className={!quotation.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedQuotations.includes(quotation.id)}
                        onCheckedChange={() => toggleSelectOne(quotation.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link 
                        href={`/dashboard/buyer/rfqs/${quotation.rfqId}`}
                        className={`font-medium hover:text-green-600 ${!quotation.isRead ? 'font-semibold' : ''}`}
                      >
                        {quotation.rfqTitle}
                        {!quotation.isRead && (
                          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                          {quotation.companyName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className={`text-sm ${!quotation.isRead ? 'font-medium' : ''}`}>
                            {quotation.companyName}
                          </p>
                          {quotation.isVerified && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 h-5">
                              ✓ Vérifié
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {(quotation.totalPrice / 1000).toLocaleString('fr-DZ')} K DZD
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span>{quotation.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={quotation.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(quotation.submittedAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/dashboard/buyer/rfqs/${quotation.rfqId}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le détail
                            </Link>
                          </DropdownMenuItem>
                          {(quotation.status === 'SENT' || quotation.status === 'VIEWED') && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => console.log('Accept', quotation.id)} 
                                className="cursor-pointer text-green-600"
                              >
                                <Award className="mr-2 h-4 w-4" />
                                Accepter
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => console.log('Negotiate', quotation.id)} 
                                className="cursor-pointer"
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Négocier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => console.log('Reject', quotation.id)} 
                                className="cursor-pointer text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devis trouvé</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' || supplierFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Vous n\'avez pas encore reçu de devis'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
