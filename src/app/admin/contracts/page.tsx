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
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  PenTool,
  ShoppingCart,
  Shield,
  Wrench,
  Truck,
  Handshake,
  Lock,
  Calendar
} from 'lucide-react'

// Types
type ContractType = 'sales' | 'po' | 'nda' | 'service' | 'distribution' | 'partnership' | 'exclusivity'
type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'expired' | 'terminated'

interface Contract {
  id: string
  contractNumber: string
  type: ContractType
  title: string
  buyer: string
  buyerId: string
  seller: string
  sellerId: string
  status: ContractStatus
  validFrom: string
  validUntil: string
  value?: number
  signedAt?: string
  documentUrl?: string
}

// Mock Data - 18 contracts
const mockContracts: Contract[] = [
  { id: 'CTR-001', contractNumber: 'CT-2024-001', type: 'sales', title: 'Contrat de Vente Ciment', buyer: 'Bâtiments & Travaux SPA', buyerId: 'B004', seller: "Ciment d'Algérie", sellerId: 'S004', status: 'signed', validFrom: '01/01/2024', validUntil: '31/12/2024', value: 45000000, signedAt: '28/12/2023' },
  { id: 'CTR-002', contractNumber: 'CT-2024-002', type: 'po', title: "Commande Acier Armature Q1", buyer: 'Groupe Industriel Constantinois', buyerId: 'B002', seller: 'Sider Algérie', sellerId: 'S002', status: 'pending_signature', validFrom: '15/03/2024', validUntil: '15/06/2024', value: 12500000 },
  { id: 'CTR-003', contractNumber: 'CT-2024-003', type: 'nda', title: 'Accord de Confidentialité R&D', buyer: 'PharmaPlus Oran', buyerId: 'B003', seller: 'Laboratoires Meditech', sellerId: 'S003', status: 'signed', validFrom: '10/02/2024', validUntil: '09/02/2027', signedAt: '05/02/2024' },
  { id: 'CTR-004', contractNumber: 'CT-2024-004', type: 'service', title: 'Maintenance IT Annuelle', buyer: 'École Supérieure Informatique', buyerId: 'B012', seller: 'Digital Solutions EURL', sellerId: 'S012', status: 'draft', validFrom: '', validUntil: '', value: 850000 },
  { id: 'CTR-005', contractNumber: 'CT-2024-005', type: 'distribution', title: 'Accord Distribution Agroalimentaire', buyer: 'Supermarché Central', buyerId: 'B016', seller: 'Grossiste Alimentaire', sellerId: 'S016', status: 'signed', validFrom: '01/03/2024', validUntil: '28/02/2025', value: 28000000, signedAt: '25/02/2024' },
  { id: 'CTR-006', contractNumber: 'CT-2024-006', type: 'partnership', title: 'Partenariat Stratégique Logistique', buyer: 'Transports Rapides Algérie', buyerId: 'B013', seller: 'Logistique Express', sellerId: 'S013', status: 'pending_signature', validFrom: '20/03/2024', validUntil: '19/03/2026', value: 15000000 },
  { id: 'CTR-007', contractNumber: 'CT-2024-007', type: 'exclusivity', title: 'Droits Exclusifs Région Est', buyer: 'Textile Moderne Blida', buyerId: 'B007', seller: 'Tissus Premium', sellerId: 'S007', status: 'signed', validFrom: '15/01/2024', validUntil: '14/04/2024', value: 5500000, signedAt: '10/01/2024' },
  { id: 'CTR-008', contractNumber: 'CT-2023-015', type: 'sales', title: 'Contrat Fourniture Équipements', buyer: 'Hôtel Sahara Deluxe', buyerId: 'B010', seller: 'Équipements Hôtellerie', sellerId: 'S010', status: 'expired', validFrom: '01/06/2023', validUntil: '31/12/2023', value: 3200000 },
  { id: 'CTR-009', contractNumber: 'CT-2024-009', type: 'service', title: 'Services de Restauration', buyer: 'Restaurant La Casbah', buyerId: 'B020', seller: 'Frais Restaurant Supply', sellerId: 'S020', status: 'signed', validFrom: '01/02/2024', validUntil: '31/01/2025', value: 1200000, signedAt: '28/01/2024' },
  { id: 'CTR-010', contractNumber: 'CT-2024-010', type: 'nda', title: 'NDA Projet Immobilier', buyer: 'Immobilière du Centre', buyerId: 'B014', seller: 'Matériaux Construction+', sellerId: 'S014', status: 'pending_signature', validFrom: '', validUntil: '' },
  { id: 'CTR-011', contractNumber: 'CT-2024-011', type: 'po', title: 'Commande Matériel Agricole', buyer: 'Agroalimentaire Setif', buyerId: 'B006', seller: 'Céréales du Tell', sellerId: 'S006', status: 'draft', validFrom: '', validUntil: '', value: 6500000 },
  { id: 'CTR-012', contractNumber: 'CT-2024-012', type: 'distribution', title: 'Distribution Pharmaceutique Wilaya Oran', buyer: 'Clinique Santé Plus', buyerId: 'B011', seller: 'Medical Equipment Pro', sellerId: 'S011', status: 'signed', validFrom: '01/03/2024', validUntil: '28/02/2025', value: 18500000, signedAt: '26/02/2024' },
  { id: 'CTR-013', contractNumber: 'CT-2022-045', type: 'service', title: 'Maintenance Système Sécurité', buyer: 'Piscine Municipale', buyerId: 'B026', seller: 'Équipements Sportifs Pro', sellerId: 'S026', status: 'terminated', validFrom: '01/01/2022', validUntil: '30/06/2023', value: 950000 },
  { id: 'CTR-014', contractNumber: 'CT-2024-014', type: 'sales', title: 'Vente Lot Électronique', buyer: 'Société d\'Électronique', buyerId: 'B028', seller: 'Composants Tech EURL', sellerId: 'S028', status: 'pending_signature', validFrom: '18/03/2024', validUntil: '17/03/2025', value: 8500000 },
  { id: 'CTR-015', contractNumber: 'CT-2024-015', type: 'exclusivity', title: 'Exclusivité Produits Beauté', buyer: 'Salon de Beauté Prestige', buyerId: 'B021', seller: 'Cosmétiques Professionnels', sellerId: 'S021', status: 'draft', validFrom: '', validUntil: '' },
  { id: 'CTR-016', contractNumber: 'CT-2024-016', type: 'partnership', title: 'Alliance Commerciale Nord', buyer: 'Ferme Avicole Tlemcen', buyerId: 'B024', seller: 'Aliments Bétail SARL', sellerId: 'S024', status: 'signed', validFrom: '01/02/2024', validUntil: '31/01/2026', value: 9000000, signedAt: '27/01/2024' },
  { id: 'CTR-017', contractNumber: 'CT-2024-017', type: 'po', title: 'Commande Livres Universitaires', buyer: 'Librairie Universitaire', buyerId: 'B022', seller: 'Editions Nationales', sellerId: 'S022', status: 'signed', validFrom: '10/03/2024', validUntil: '30/06/2024', value: 1800000, signedAt: '08/03/2024' },
  { id: 'CTR-018', contractNumber: 'CT-2024-018', type: 'nda', title: 'Confidentialité Projet Tourisme', buyer: 'Agence de Voyage Sahel', buyerId: 'B025', seller: 'Tourisme & Transport', sellerId: 'S025', status: 'signed', validFrom: '05/03/2024', validUntil: '04/03/2027', signedAt: '01/03/2024' },
]

// Helper functions
function getContractTypeConfig(type: ContractType) {
  switch (type) {
    case 'sales':
      return { label: 'Vente', icon: ShoppingCart, color: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'po':
      return { label: 'Commande', icon: PenTool, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case 'nda':
      return { label: 'NDA', icon: Shield, color: 'bg-purple-100 text-purple-700 border-purple-200' }
    case 'service':
      return { label: 'Service', icon: Wrench, color: 'bg-orange-100 text-orange-700 border-orange-200' }
    case 'distribution':
      return { label: 'Distribution', icon: Truck, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
    case 'partnership':
      return { label: 'Partenariat', icon: Handshake, color: 'bg-pink-100 text-pink-700 border-pink-200' }
    case 'exclusivity':
      return { label: 'Exclusivité', icon: Lock, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
  }
}

function getStatusConfig(status: ContractStatus) {
  switch (status) {
    case 'draft':
      return { label: 'Brouillon', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: FileText }
    case 'pending_signature':
      return { label: 'En attente signature', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock }
    case 'signed':
      return { label: 'Signé', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
    case 'expired':
      return { label: 'Expiré', color: 'bg-red-100 text-red-600 border-red-200', icon: XCircle }
    case 'terminated':
      return { label: 'Résilié', color: 'bg-gray-100 text-gray-500 border-gray-300 line-through', icon: XCircle }
  }
}

function isExpiringSoon(validUntil: string): boolean {
  if (!validUntil) return false
  const [day, month, year] = validUntil.split('/').map(Number)
  const expiryDate = new Date(year, month - 1, day)
  const now = new Date()
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= 30
}

export default function ContractsListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [partyFilter, setPartyFilter] = useState('')

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return mockContracts.filter(contract => {
      const matchesSearch = searchQuery === '' || 
        contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.seller.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
      const matchesType = typeFilter === 'all' || contract.type === typeFilter
      
      const matchesParty = partyFilter === '' || 
        contract.buyer.toLowerCase().includes(partyFilter.toLowerCase()) ||
        contract.seller.toLowerCase().includes(partyFilter.toLowerCase())
      
      return matchesSearch && matchesStatus && matchesType && matchesParty
    })
  }, [searchQuery, statusFilter, typeFilter, partyFilter])

  // Calculate stats
  const stats = useMemo(() => ({
    total: mockContracts.length,
    signed: mockContracts.filter(c => c.status === 'signed').length,
    pending: mockContracts.filter(c => c.status === 'pending_signature').length,
    expiringSoon: mockContracts.filter(c => isExpiringSoon(c.validUntil)).length,
    totalValue: mockContracts.reduce((sum, c) => sum + (c.value || 0), 0),
  }), [])

  // Download PDF handler
  const downloadPDF = (contract: Contract) => {
    console.log('Downloading PDF for:', contract.contractNumber)
    alert(`Téléchargement du PDF pour ${contract.contractNumber}\n\nFichier: ${contract.contractNumber}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestion des Contrats</h1>
                <p className="text-xs text-gray-500">AlgeriaTrade.dz - Administration des contrats</p>
              </div>
            </div>
            
            <Button>
              <PenTool className="mr-2 h-4 w-4" />
              Nouveau Contrat
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total contrats</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{stats.signed}</p>
                  <p className="text-xs text-gray-500">Signés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.expiringSoon > 0 ? 'border-orange-300 bg-orange-50/30' : ''}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${stats.expiringSoon > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                <div>
                  <p className="text-xl font-bold">{stats.expiringSoon}</p>
                  <p className="text-xs text-gray-500">Expire bientôt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">د.ج</span>
                <div>
                  <p className="text-sm font-bold truncate max-w-[80px]">
                    {(stats.totalValue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-500">Valeur totale</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par N°, titre ou partie..."
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
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending_signature">En attente signature</SelectItem>
                  <SelectItem value="signed">Signé</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="terminated">Résilié</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="sales">Vente</SelectItem>
                  <SelectItem value="po">Commande</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="distribution">Distribution</SelectItem>
                  <SelectItem value="partnership">Partenariat</SelectItem>
                  <SelectItem value="exclusivity">Exclusivité</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Filtrer par partie (acheteur/vendeur)"
                value={partyFilter}
                onChange={(e) => setPartyFilter(e.target.value)}
                className="lg:col-span-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Contrat</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Acheteur</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const typeConfig = getContractTypeConfig(contract.type)
                    const TypeIcon = typeConfig.icon
                    const statusConfig = getStatusConfig(contract.status)
                    const StatusIcon = statusConfig.icon
                    const expiringSoon = isExpiringSoon(contract.validUntil)

                    return (
                      <TableRow key={contract.id} className={`${expiringSoon ? 'bg-orange-50/50' : ''}`}>
                        <TableCell className="font-mono font-medium text-sm">{contract.contractNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={typeConfig.color}>
                            <TypeIcon className="mr-1 h-3 w-3" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[150px] truncate block font-medium" title={contract.title}>{contract.title}</span>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[130px] truncate block" title={contract.buyer}>{contract.buyer}</span>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[130px] truncate block" title={contract.seller}>{contract.seller}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.color} ${expiringSoon ? 'ring-2 ring-orange-400' : ''}`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                          {expiringSoon && (
                            <div className="flex items-center mt-1 text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span className="text-xs">&lt;30j</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{contract.validFrom || '-'}</TableCell>
                        <TableCell className={`text-sm ${expiringSoon ? 'text-orange-600 font-semibold' : ''}`}>{contract.validUntil || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{contract.value ? `${(contract.value / 1000000).toFixed(1)}M د.ج` : '-'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />Voir détails</DropdownMenuItem>
                              <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
                              {contract.status === 'signed' && (
                                <DropdownMenuItem onClick={() => downloadPDF(contract)}>
                                  <Download className="mr-2 h-4 w-4" />Télécharger PDF signé
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {filteredContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">Aucun contrat trouvé</p>
                        <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres de recherche</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Footer Summary */}
            <div className="border-t bg-gray-50 px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-sm text-gray-600">
                  <strong>{filteredContracts.length}</strong> contrat(s) affiché(s)
                </span>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-200"></div>
                    <span>Expire dans &lt;30 jours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-200"></div>
                    <span>Actif</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
