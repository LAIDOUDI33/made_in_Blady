'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Scale,
  Search,
  Filter,
  Eye,
  Handshake,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Timer,
  TrendingUp,
  Users,
  Target,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

// Types
type NegotiationStatus = 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired'

interface Negotiation {
  id: string
  productId: string
  productName: string
  category: string
  buyer: string
  buyerId: string
  seller: string
  sellerId: string
  originalPrice: number
  currentOffer: number
  savingsPercent: number
  status: NegotiationStatus
  createdAt: string
  expiresAt: string
  lastActivity: string
  offerCount: number
}

// Mock Data - 22 negotiations at various stages
const mockNegotiations: Negotiation[] = [
  { id: 'NEG-001', productId: 'P001', productName: 'Ciment Portland CEM I 42.5', category: 'Matériaux Construction', buyer: 'Bâtiments & Travaux SPA', buyerId: 'B004', seller: 'Ciment d\'Algérie', sellerId: 'S004', originalPrice: 18500, currentOffer: 16200, savingsPercent: 12.4, status: 'countered', createdAt: '10/03/2024', expiresAt: '20/03/2024', lastActivity: '15/03/2024 14:30', offerCount: 4 },
  { id: 'NEG-002', productId: 'P002', productName: 'Acier Armature HA FeE400 Ø12', category: 'Matériaux Construction', buyer: 'Groupe Industriel Constantinois', buyerId: 'B002', seller: 'Sider Algérie', sellerId: 'S002', originalPrice: 95000, currentOffer: 88500, savingsPercent: 6.8, status: 'pending', createdAt: '12/03/2024', expiresAt: '22/03/2024', lastActivity: '12/03/2024 09:15', offerCount: 1 },
  { id: 'NEG-003', productId: 'P003', productName: 'Paracétamol 500mg x1000', category: 'Pharmaceutique', buyer: 'PharmaPlus Oran', buyerId: 'B003', seller: 'Laboratoires Meditech', sellerId: 'S003', originalPrice: 4500, currentOffer: 3900, savingsPercent: 13.3, status: 'accepted', createdAt: '05/03/2024', expiresAt: '15/03/2024', lastActivity: '14/03/2024 11:45', offerCount: 5 },
  { id: 'NEG-004', productId: 'P004', productName: 'Ordinateur Portable Dell Latitude 5540', category: 'Informatique', buyer: 'École Supérieure Informatique', buyerId: 'B012', seller: 'Digital Solutions EURL', sellerId: 'S012', originalPrice: 125000, currentOffer: 118000, savingsPercent: 5.6, status: 'pending', createdAt: '14/03/2024', expiresAt: '24/03/2024', lastActivity: '14/03/2024 16:20', offerCount: 1 },
  { id: 'NEG-005', productId: 'P005', productName: 'Huile de Olive Extra Vierge 5L', category: 'Agroalimentaire', buyer: 'Supermarché Central', buyerId: 'B016', seller: 'Grossiste Alimentaire', sellerId: 'S016', originalPrice: 8500, currentOffer: 7800, savingsPercent: 8.2, status: 'countered', createdAt: '11/03/2024', expiresAt: '18/03/2024', lastActivity: '16/03/2024 08:30', offerCount: 3 },
  { id: 'NEG-006', productId: 'P006', productName: 'Tissu Polyester Coton 150cm x 50m', category: 'Textile', buyer: 'Textile Moderne Blida', buyerId: 'B007', seller: 'Tissus Premium', sellerId: 'S007', originalPrice: 22000, currentOffer: 19500, savingsPercent: 11.4, status: 'pending', createdAt: '15/03/2024', expiresAt: '25/03/2024', lastActivity: '15/03/2024 10:00', offerCount: 1 },
  { id: 'NEG-007', productId: 'P007', productName: 'Moteur Diesel Cummins QSB6.7', category: 'Industriel', buyer: 'Usine Textile Annaba', buyerId: 'B019', seller: 'Machines Industrielles SA', sellerId: 'S019', originalPrice: 2850000, currentOffer: 2620000, savingsPercent: 8.1, status: 'rejected', createdAt: '01/03/2024', expiresAt: '10/03/2024', lastActivity: '09/03/2024 17:45', offerCount: 2 },
  { id: 'NEG-008', productId: 'P008', productName: 'Camion Mercedes Actros 2645', category: 'Transport', buyer: 'Transports Rapides Algérie', buyerId: 'B013', seller: 'Logistique Express', sellerId: 'S013', originalPrice: 18500000, currentOffer: 17200000, savingsPercent: 7.0, status: 'countered', createdAt: '08/03/2024', expiresAt: '17/03/2024', lastActivity: '16/03/2024 13:15', offerCount: 4 },
  { id: 'NEG-009', productId: 'P009', productName: 'Système CCTV 16 Caméras Hikvision', category: 'Sécurité', buyer: 'Hôtel Sahara Deluxe', buyerId: 'B010', seller: 'Équipements Hôtellerie', sellerId: 'S010', originalPrice: 450000, currentOffer: 398000, savingsPercent: 11.6, status: 'pending', createdAt: '13/03/2024', expiresAt: '23/03/2024', lastActivity: '13/03/2024 14:50', offerCount: 1 },
  { id: 'NEG-010', productId: 'P010', productName: 'Machine à Café Professionnelle', category: 'Restauration', buyer: 'Restaurant La Casbah', buyerId: 'B020', seller: 'Frais Restaurant Supply', sellerId: 'S020', originalPrice: 380000, currentOffer: 350000, savingsPercent: 7.9, status: 'accepted', createdAt: '06/03/2024', expiresAt: '16/03/2024', lastActivity: '15/03/2024 09:00', offerCount: 3 },
  { id: 'NEG-011', productId: 'P011', productName: 'Fournitures Bureau Complet (Lot)', category: 'Fournitures', buyer: 'Cabinet Avocats Associés', buyerId: 'B018', seller: 'Services Juridiques Pro', sellerId: 'S018', originalPrice: 45000, currentOffer: 42000, savingsPercent: 6.7, status: 'expired', createdAt: '20/02/2024', expiresAt: '01/03/2024', lastActivity: '28/02/2024 16:30', offerCount: 2 },
  { id: 'NEG-012', productId: 'P012', productName: 'Aliment Volaille Premium 25kg', category: 'Agroalimentaire', buyer: 'Ferme Avicole Tlemcen', buyerId: 'B024', seller: 'Aliments Bétail SARL', sellerId: 'S024', originalPrice: 6500, currentOffer: 5850, savingsPercent: 10.0, status: 'pending', createdAt: '16/03/2024', expiresAt: '26/03/2024', lastActivity: '16/03/2024 07:45', offerCount: 1 },
  { id: 'NEG-013', productId: 'P013', productName: 'Peinture Facade Anti-UV 20L', category: 'Bâtiment', buyer: 'Immobilière du Centre', buyerId: 'B014', seller: 'Matériaux Construction+', sellerId: 'S014', originalPrice: 12000, currentOffer: 10500, savingsPercent: 12.5, status: 'countered', createdAt: '09/03/2024', expiresAt: '19/03/2024', lastActivity: '16/03/2024 15:20', offerCount: 3 },
  { id: 'NEG-014', productId: 'P014', productName: 'Pompe Submersible Grundfos SQFlex', category: 'Agriculture', buyer: 'Agroalimentaire Setif', buyerId: 'B006', seller: 'Céréales du Tell', sellerId: 'S006', originalPrice: 285000, currentOffer: 262000, savingsPercent: 8.1, status: 'pending', createdAt: '14/03/2024', expiresAt: '24/03/2024', lastActivity: '14/03/2024 11:30', offerCount: 1 },
  { id: 'NEG-015', productId: 'P015', productName: 'Kit Solaire Photovoltaïque 5kW', category: 'Énergie', buyer: 'Piscine Municipale', buyerId: 'B026', seller: 'Équipements Sportifs Pro', sellerId: 'S026', originalPrice: 1200000, currentOffer: 1085000, savingsPercent: 9.6, status: 'pending', createdAt: '15/03/2024', expiresAt: '25/03/2024', lastActivity: '15/03/2024 09:15', offerCount: 1 },
  { id: 'NEG-016', productId: 'P016', productName: 'Logiciel ERP Comptabilité', category: 'Logiciel', buyer: 'Société d\'Électronique', buyerId: 'B028', seller: 'Composants Tech EURL', sellerId: 'S028', originalPrice: 850000, currentOffer: 765000, savingsPercent: 10.0, status: 'countered', createdAt: '10/03/2024', expiresAt: '17/03/2024', lastActivity: '16/03/2024 16:45', offerCount: 4 },
  { id: 'NEG-017', productId: 'P017', productName: 'Vêtements Travail Lot 50 unités', category: 'Textile', buyer: 'Garage Automobile Modern', buyerId: 'B023', seller: 'Outillage Pro Algérie', sellerId: 'S023', originalPrice: 175000, currentOffer: 158000, savingsPercent: 9.7, status: 'accepted', createdAt: '04/03/2024', expiresAt: '14/03/2024', lastActivity: '13/03/2024 10:30', offerCount: 3 },
  { id: 'NEG-018', productId: 'P018', productName: 'Cosmétiques Professionnels Kit', category: 'Beauté', buyer: 'Salon de Beauté Prestige', buyerId: 'B021', seller: 'Cosmétiques Professionnels', sellerId: 'S021', originalPrice: 95000, currentOffer: 85500, savingsPercent: 10.0, status: 'pending', createdAt: '16/03/2024', expiresAt: '26/03/2024', lastActivity: '16/03/2024 08:00', offerCount: 1 },
  { id: 'NEG-019', productId: 'P019', productName: 'Pièces Détachées Moteur (Lot)', category: 'Automobile', buyer: 'AutoMotive Algeria', buyerId: 'B009', seller: 'Pièces Détachées SARL', sellerId: 'S009', originalPrice: 320000, currentOffer: 294000, savingsPercent: 8.1, status: 'rejected', createdAt: '02/03/2024', expiresAt: '12/03/2024', lastActivity: '11/03/2024 14:20', offerCount: 2 },
  { id: 'NEG-020', productId: 'P020', productName: 'Livres Universitaires (Lot 200)', category: 'Éducation', buyer: 'Librairie Universitaire', buyerId: 'B022', seller: 'Editions Nationales', sellerId: 'S022', originalPrice: 180000, currentOffer: 165000, savingsPercent: 8.3, status: 'accepted', createdAt: '07/03/2024', expiresAt: '17/03/2024', lastActivity: '16/03/2024 11:00', offerCount: 2 },
  { id: 'NEG-021', productId: 'P021', packageName: 'Voyage Organisé Groupe 30 pers.', category: 'Tourisme', buyer: 'Agence de Voyage Sahel', buyerId: 'B025', seller: 'Tourisme & Transport', sellerId: 'S025', originalPrice: 2750000, currentOffer: 2500000, savingsPercent: 9.1, status: 'pending', createdAt: '15/03/2024', expiresAt: '22/03/2024', lastActivity: '15/03/2024 13:45', offerCount: 1 },
  { id: 'NEG-022', productId: 'P022', productName: 'Équipement Fitness Complet', category: 'Sport', buyer: 'Clinique Santé Plus', buyerId: 'B011', seller: 'Medical Equipment Pro', sellerId: 'S011', originalPrice: 1450000, currentOffer: 1320000, savingsPercent: 9.0, status: 'countered', createdAt: '12/03/2024', expiresAt: '19/03/2024', lastActivity: '16/03/2024 14:55', offerCount: 3 },
]

// Helper functions
function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' د.ج'
}

function getStatusConfig(status: NegotiationStatus) {
  switch (status) {
    case 'pending':
      return { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock }
    case 'countered':
      return { label: 'Contre-offre', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Scale }
    case 'accepted':
      return { label: 'Acceptée', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
    case 'rejected':
      return { label: 'Rejetée', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    case 'expired':
      return { label: 'Expirée', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Timer }
  }
}

function getTimeLeft(expiresAt: string): { hours: number; isExpiringSoon: boolean; display: string } {
  const [day, month, year] = expiresAt.split('/').map(Number)
  const expiryDate = new Date(year, month - 1, day)
  const now = new Date()
  const diffMs = expiryDate.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 0) return { hours: 0, isExpiringSoon: false, display: 'Expiré' }
  if (diffHours < 24) return { hours: diffHours, isExpiringSoon: true, display: `${diffHours}h` }
  if (diffDays === 1) return { hours: diffHours, isExpiringSoon: false, display: 'Demain' }
  return { hours: diffHours, isExpiringSoon: false, display: `${diffDays}j` }
}

export default function NegotiationsListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [showMediateDialog, setShowMediateDialog] = useState(false)
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null)

  // Filter negotiations
  const filteredNegotiations = useMemo(() => {
    return mockNegotiations.filter(neg => {
      const matchesSearch = searchQuery === '' || 
        neg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        neg.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        neg.buyer.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || neg.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || neg.category === categoryFilter
      
      const matchesMin = minValue === '' || neg.originalPrice >= parseFloat(minValue)
      const matchesMax = maxValue === '' || neg.originalPrice <= parseFloat(maxValue)
      
      return matchesSearch && matchesStatus && matchesCategory && matchesMin && matchesMax
    })
  }, [searchQuery, statusFilter, categoryFilter, minValue, maxValue])

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = mockNegotiations.length
    const accepted = mockNegotiations.filter(n => n.status === 'accepted').length
    const avgSavings = mockNegotiations.reduce((sum, n) => sum + n.savingsPercent, 0) / total
    const expiringSoon = mockNegotiations.filter(n => {
      const timeLeft = getTimeLeft(n.expiresAt)
      return timeLeft.isExpiringSoon && !['accepted', 'rejected', 'expired'].includes(n.status)
    }).length
    
    return {
      total,
      accepted,
      successRate: ((accepted / total) * 100).toFixed(1),
      avgSavings: avgSavings.toFixed(1),
      expiringSoon,
    }
  }, [])

  // Get unique categories
  const categories = [...new Set(mockNegotiations.map(n => n.category))].sort()

  const handleMediate = (negotiation: Negotiation) => {
    setSelectedNegotiation(negotiation)
    setShowMediateDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Négociations</h1>
                <p className="text-xs text-gray-500">AlgeriaTrade.dz - Administration des négociations</p>
              </div>
            </div>
            
            <Button>
              <Handshake className="mr-2 h-4 w-4" />
              Nouvelle Négociation
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{metrics.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={parseInt(metrics.expiringSoon as string) > 0 ? 'border-red-300 bg-red-50/30' : ''}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${metrics.expiringSoon > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                <div>
                  <p className="text-xl font-bold">{metrics.expiringSoon}</p>
                  <p className="text-xs text-gray-500">Expire bientôt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{metrics.accepted}</p>
                  <p className="text-xs text-gray-500">Acceptées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-xl font-bold">{metrics.successRate}%</p>
                  <p className="text-xs text-gray-500">Taux réussite</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xl font-bold">{metrics.avgSavings}%</p>
                  <p className="text-xs text-gray-500">Économie moy.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              Filtres et Recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par ID, produit ou acheteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="countered">Contre-offre</SelectItem>
                  <SelectItem value="accepted">Acceptée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                  <SelectItem value="expired">Expirée</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min (د.ج)"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max (د.ج)"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Negotiations Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Acheteur</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead className="text-right">Prix Initial</TableHead>
                    <TableHead className="text-right">Offre Actuelle</TableHead>
                    <TableHead className="text-right">Économie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Temps restant</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNegotiations.map((negotiation) => {
                    const statusConfig = getStatusConfig(negotiation.status)
                    const StatusIcon = statusConfig.icon
                    const timeLeft = getTimeLeft(negotiation.expiresAt)
                    
                    return (
                      <TableRow 
                        key={negotiation.id} 
                        className={`${timeLeft.isExpiringSoon ? 'bg-red-50/50 animate-pulse' : ''}`}
                      >
                        <TableCell className="font-mono font-medium text-sm">{negotiation.id}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium block max-w-[180px] truncate" title={negotiation.productName}>
                              {negotiation.productName}
                            </span>
                            <Badge variant="outline" className="text-xs mt-1 bg-gray-50">
                              {negotiation.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[140px] truncate block" title={negotiation.buyer}>{negotiation.buyer}</span>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[140px] truncate block" title={negotiation.seller}>{negotiation.seller}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatDZD(negotiation.originalPrice)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatDZD(negotiation.currentOffer)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            -{negotiation.savingsPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${timeLeft.isExpiringSoon ? 'text-red-600 font-semibold' : ''}`}>
                            {timeLeft.isExpiringSoon && (
                              <AlertTriangle className="h-3 w-3 animate-pulse" />
                            )}
                            <Timer className="h-3 w-3" />
                            <span className="text-sm">{timeLeft.display}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/negotiations/${negotiation.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir détails
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMediate(negotiation)}>
                                <Scale className="mr-2 h-4 w-4" />
                                Médier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Clock className="mr-2 h-4 w-4" />
                                Prolonger délai
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {filteredNegotiations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <Scale className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">Aucune négociation trouvée</p>
                        <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres de recherche</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Footer */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-6 text-sm">
                <span><strong>{filteredNegotiations.length}</strong> négociations affichées</span>
                <span className="text-emerald-700">
                  Économie totale potentielle: <strong>{formatDZD(filteredNegotiations.reduce((sum, n) => sum + (n.originalPrice - n.currentOffer), 0))}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span>Les négociations en rouge expirent dans moins de 24h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Mediate Dialog */}
      <Dialog open={showMediateDialog} onOpenChange={setShowMediateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Médier la négociation</DialogTitle>
            <DialogDescription>
              Vous allez intervenir comme médiateur dans cette négociation.
            </DialogDescription>
          </DialogHeader>
          
          {selectedNegotiation && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{selectedNegotiation.productName}</p>
                <p className="text-sm text-gray-600 mt-1">ID: {selectedNegotiation.id}</p>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Prix initial:</span>
                    <p className="font-medium">{formatDZD(selectedNegotiation.originalPrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Offre actuelle:</span>
                    <p className="font-medium text-blue-600">{formatDZD(selectedNegotiation.currentOffer)}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Proposer un prix de compromis:</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Entrez un prix entre l'offre et le prix initial"
                  defaultValue={Math.round((selectedNegotiation.originalPrice + selectedNegotiation.currentOffer) / 2)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message aux parties:</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md h-24"
                  placeholder="Expliquez votre proposition de médiation..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMediateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowMediateDialog(false)}>
              Envoyer la proposition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
