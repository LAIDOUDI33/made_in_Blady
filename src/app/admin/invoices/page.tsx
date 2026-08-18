'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
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
  FileText,
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileDown,
  Receipt,
  ArrowUpDown
} from 'lucide-react'

// Types
type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'

interface Invoice {
  id: string
  invoiceNumber: string
  buyer: string
  buyerId: string
  seller: string
  sellerId: string
  amount: number
  tvaRate: number
  tvaAmount: number
  total: number
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  paidDate?: string
  currency: string
}

// Mock Data - 28 realistic Algerian invoices
const mockInvoices: Invoice[] = [
  { id: '1', invoiceNumber: 'FAC-2024-001', buyer: 'Sarl El Djazair Commerce', buyerId: 'B001', seller: 'Ets Benali Distribution', sellerId: 'S001', amount: 2500000, tvaRate: 19, tvaAmount: 475000, total: 2975000, status: 'paid', issueDate: '15/01/2024', dueDate: '14/02/2024', paidDate: '10/02/2024', currency: 'DZD' },
  { id: '2', invoiceNumber: 'FAC-2024-002', buyer: 'Groupe Industriel Constantinois', buyerId: 'B002', seller: 'Sider Algérie', sellerId: 'S002', amount: 8500000, tvaRate: 19, tvaAmount: 1615000, total: 10115000, status: 'issued', issueDate: '18/01/2024', dueDate: '17/02/2024', currency: 'DZD' },
  { id: '3', invoiceNumber: 'FAC-2024-003', buyer: 'PharmaPlus Oran', buyerId: 'B003', seller: 'Laboratoires Meditech', sellerId: 'S003', amount: 1200000, tvaRate: 9, tvaAmount: 108000, total: 1308000, status: 'paid', issueDate: '20/01/2024', dueDate: '19/02/2024', paidDate: '15/02/2024', currency: 'DZD' },
  { id: '4', invoiceNumber: 'FAC-2024-004', buyer: 'Bâtiments & Travaux SPA', buyerId: 'B004', seller: 'Ciment d\'Algérie', sellerId: 'S004', amount: 15000000, tvaRate: 19, tvaAmount: 2850000, total: 17850000, status: 'overdue', issueDate: '05/01/2024', dueDate: '04/02/2024', currency: 'DZD' },
  { id: '5', invoiceNumber: 'FAC-2024-005', buyer: 'TechnoImport Alger', buyerId: 'B005', seller: 'Informatique Plus', sellerId: 'S005', amount: 450000, tvaRate: 19, tvaAmount: 85500, total: 535500, status: 'cancelled', issueDate: '22/01/2024', dueDate: '21/02/2024', currency: 'DZD' },
  { id: '6', invoiceNumber: 'FAC-2024-006', buyer: 'Agroalimentaire Setif', buyerId: 'B006', seller: 'Céréales du Tell', sellerId: 'S006', amount: 3200000, tvaRate: 0, tvaAmount: 0, total: 3200000, status: 'issued', issueDate: '25/01/2024', dueDate: '24/02/2024', currency: 'DZD' },
  { id: '7', invoiceNumber: 'FAC-2024-007', buyer: 'Textile Moderne Blida', buyerId: 'B007', seller: 'Tissus Premium', sellerId: 'S007', amount: 780000, tvaRate: 19, tvaAmount: 148200, total: 928200, status: 'draft', issueDate: '28/01/2024', dueDate: '27/02/2024', currency: 'DZD' },
  { id: '8', invoiceNumber: 'FAC-2024-008', buyer: 'Pétrole & Gaz Services', buyerId: 'B008', seller: 'Sonatrach Fournitures', sellerId: 'S008', amount: 22000000, tvaRate: 0, tvaAmount: 0, total: 22000000, status: 'paid', issueDate: '01/02/2024', dueDate: '02/03/2024', paidDate: '25/02/2024', currency: 'DZD' },
  { id: '9', invoiceNumber: 'FAC-2024-009', buyer: 'AutoMotive Algeria', buyerId: 'B009', seller: 'Pièces Détachées SARL', sellerId: 'S009', amount: 1850000, tvaRate: 19, tvaAmount: 351500, total: 2201500, status: 'issued', issueDate: '03/02/2024', dueDate: '04/03/2024', currency: 'DZD' },
  { id: '10', invoiceNumber: 'FAC-2024-010', buyer: 'Hôtel Sahara Deluxe', buyerId: 'B010', seller: 'Équipements Hôtellerie', sellerId: 'S010', amount: 950000, tvaRate: 19, tvaAmount: 180500, total: 1130500, status: 'paid', issueDate: '05/02/2024', dueDate: '06/03/2024', paidDate: '01/03/2024', currency: 'DZD' },
  { id: '11', invoiceNumber: 'FAC-2024-011', buyer: 'Clinique Santé Plus', buyerId: 'B011', seller: 'Medical Equipment Pro', sellerId: 'S011', amount: 5500000, tvaRate: 9, tvaAmount: 495000, total: 5995000, status: 'overdue', issueDate: '10/01/2024', dueDate: '09/02/2024', currency: 'DZD' },
  { id: '12', invoiceNumber: 'FAC-2024-012', buyer: 'École Supérieure Informatique', buyerId: 'B012', seller: 'Digital Solutions EURL', sellerId: 'S012', amount: 320000, tvaRate: 19, tvaAmount: 60800, total: 380800, status: 'draft', issueDate: '08/02/2024', dueDate: '09/03/2024', currency: 'DZD' },
  { id: '13', invoiceNumber: 'FAC-2024-013', buyer: 'Transports Rapides Algérie', buyerId: 'B013', seller: 'Logistique Express', sellerId: 'S013', amount: 1400000, tvaRate: 19, tvaAmount: 266000, total: 1666000, status: 'paid', issueDate: '10/02/2024', dueDate: '11/03/2024', paidDate: '08/03/2024', currency: 'DZD' },
  { id: '14', invoiceNumber: 'FAC-2024-014', buyer: 'Immobilière du Centre', buyerId: 'B014', seller: 'Matériaux Construction+', sellerId: 'S014', amount: 6700000, tvaRate: 19, tvaAmount: 1273000, total: 7973000, status: 'issued', issueDate: '12/02/2024', dueDate: '13/03/2024', currency: 'DZD' },
  { id: '15', invoiceNumber: 'FAC-2024-015', buyer: 'Bijouterie Fine Oran', buyerId: 'B015', seller: 'Or & Diamants Import', sellerId: 'S015', amount: 4200000, tvaRate: 19, tvaAmount: 798000, total: 4998000, status: 'cancelled', issueDate: '14/02/2024', dueDate: '14/03/2024', currency: 'DZD' },
  { id: '16', invoiceNumber: 'FAC-2024-016', buyer: 'Supermarché Central', buyerId: 'B016', seller: 'Grossiste Alimentaire', sellerId: 'S016', amount: 2800000, tvaRate: 9, tvaAmount: 252000, total: 3052000, status: 'paid', issueDate: '15/02/2024', dueDate: '16/03/2024', paidDate: '12/03/2024', currency: 'DZD' },
  { id: '17', invoiceNumber: 'FAC-2024-017', buyer: 'Station Service Nord', buyerId: 'B017', seller: 'Naftal Distributeur', sellerId: 'S017', amount: 8900000, tvaRate: 0, tvaAmount: 0, total: 8900000, status: 'issued', issueDate: '18/02/2024', dueDate: '19/03/2024', currency: 'DZD' },
  { id: '18', invoiceNumber: 'FAC-2024-018', buyer: 'Cabinet Avocats Associés', buyerId: 'B018', seller: 'Services Juridiques Pro', sellerId: 'S018', amount: 350000, tvaRate: 19, tvaAmount: 66500, total: 416500, status: 'draft', issueDate: '20/02/2024', dueDate: '21/03/2024', currency: 'DZD' },
  { id: '19', invoiceNumber: 'FAC-2024-019', buyer: 'Usine Textile Annaba', buyerId: 'B019', seller: 'Machines Industrielles SA', sellerId: 'S019', amount: 12500000, tvaRate: 19, tvaAmount: 2375000, total: 14875000, status: 'overdue', issueDate: '20/01/2024', dueDate: '19/02/2024', currency: 'DZD' },
  { id: '20', invoiceNumber: 'FAC-2024-020', buyer: 'Restaurant La Casbah', buyerId: 'B020', seller: 'Frais Restaurant Supply', sellerId: 'S020', amount: 185000, tvaRate: 19, tvaAmount: 35150, total: 220150, status: 'paid', issueDate: '22/02/2024', dueDate: '23/03/2024', paidDate: '20/03/2024', currency: 'DZD' },
  { id: '21', invoiceNumber: 'FAC-2024-021', buyer: 'Salon de Beauté Prestige', buyerId: 'B021', seller: 'Cosmétiques Professionnels', sellerId: 'S021', amount: 420000, tvaRate: 19, tvaAmount: 79800, total: 499800, status: 'issued', issueDate: '25/02/2024', dueDate: '26/03/2024', currency: 'DZD' },
  { id: '22', invoiceNumber: 'FAC-2024-022', buyer: 'Librairie Universitaire', buyerId: 'B022', seller: 'Editions Nationales', sellerId: 'S022', amount: 275000, tvaRate: 9, tvaAmount: 24750, total: 299750, status: 'paid', issueDate: '26/02/2024', dueDate: '27/03/2024', paidDate: '22/03/2024', currency: 'DZD' },
  { id: '23', invoiceNumber: 'FAC-2024-023', buyer: 'Garage Automobile Modern', buyerId: 'B023', seller: 'Outillage Pro Algérie', sellerId: 'S023', amount: 650000, tvaRate: 19, tvaAmount: 123500, total: 773500, status: 'draft', issueDate: '28/02/2024', dueDate: '29/03/2024', currency: 'DZD' },
  { id: '24', invoiceNumber: 'FAC-2024-024', buyer: 'Ferme Avicole Tlemcen', buyerId: 'B024', seller: 'Aliments Bétail SARL', sellerId: 'S024', amount: 1900000, tvaRate: 0, tvaAmount: 0, total: 1900000, status: 'issued', issueDate: '01/03/2024', dueDate: '31/03/2024', currency: 'DZD' },
  { id: '25', invoiceNumber: 'FAC-2024-025', buyer: 'Agence de Voyage Sahel', buyerId: 'B025', seller: 'Tourisme & Transport', sellerId: 'S025', amount: 1100000, tvaRate: 19, tvaAmount: 209000, total: 1309000, status: 'paid', issueDate: '03/03/2024', dueDate: '02/04/2024', paidDate: '28/03/2024', currency: 'DZD' },
  { id: '26', invoiceNumber: 'FAC-2024-026', buyer: 'Piscine Municipale', buyerId: 'B026', seller: 'Équipements Sportifs Pro', sellerId: 'S026', amount: 3400000, tvaRate: 19, tvaAmount: 646000, total: 4046000, status: 'overdue', issueDate: '05/02/2024', dueDate: '06/03/2024', currency: 'DZD' },
  { id: '27', invoiceNumber: 'FAC-2024-027', buyer: 'Boulangerie Traditionnelle', buyerId: 'B027', seller: 'Farines de Qualité', sellerId: 'S027', amount: 520000, tvaRate: 0, tvaAmount: 0, total: 520000, status: 'cancelled', issueDate: '07/03/2024', dueDate: '06/04/2024', currency: 'DZD' },
  { id: '28', invoiceNumber: 'FAC-2024-028', buyer: 'Société d\'Électronique', buyerId: 'B028', seller: 'Composants Tech EURL', sellerId: 'S028', amount: 2300000, tvaRate: 19, tvaAmount: 437000, total: 2737000, status: 'draft', issueDate: '10/03/2024', dueDate: '09/04/2024', currency: 'DZD' },
]

// Helper functions
function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' د.ج'
}

function getStatusConfig(status: InvoiceStatus) {
  switch (status) {
    case 'draft':
      return { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText }
    case 'issued':
      return { label: 'Émise', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock }
    case 'paid':
      return { label: 'Payée', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
    case 'overdue':
      return { label: 'En retard', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle }
    case 'cancelled':
      return { label: 'Annulée', color: 'bg-gray-100 text-gray-400 border-gray-200 line-through', icon: XCircle }
  }
}

export default function InvoiceListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState('')
  const itemsPerPage = 10

  // Filter and search invoices
  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter(invoice => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.buyer.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
      
      // Currency filter
      const matchesCurrency = currencyFilter === 'all' || invoice.currency === currencyFilter
      
      // Amount range filter
      const matchesMinAmount = minAmount === '' || invoice.amount >= parseFloat(minAmount)
      const matchesMaxAmount = maxAmount === '' || invoice.amount <= parseFloat(maxAmount)
      
      return matchesSearch && matchesStatus && matchesCurrency && matchesMinAmount && matchesMaxAmount
    })
  }, [searchQuery, statusFilter, currencyFilter, minAmount, maxAmount])

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Summary calculations
  const summary = useMemo(() => {
    const visibleInvoices = paginatedInvoices
    return {
      count: visibleInvoices.length,
      subtotal: visibleInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      tvaTotal: visibleInvoices.reduce((sum, inv) => sum + inv.tvaAmount, 0),
      grandTotal: visibleInvoices.reduce((sum, inv) => sum + inv.total, 0),
    }
  }, [paginatedInvoices])

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(paginatedInvoices.map(inv => inv.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Bulk action handler
  const handleBulkAction = () => {
    console.log(`Executing ${bulkAction} on invoices:`, selectedInvoices)
    setShowBulkDialog(false)
    setSelectedInvoices([])
    setBulkAction('')
  }

  // Export CSV
  const exportCSV = () => {
    const headers = ['N° Facture', 'Acheteur', 'Vendeur', 'Montant', 'TVA %', 'Montant TVA', 'Total', 'Statut', 'Date Émission', 'Date Échéance']
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.buyer,
      inv.seller,
      inv.amount.toString(),
      `${inv.tvaRate}%`,
      inv.tvaAmount.toString(),
      inv.total.toString(),
      inv.status,
      inv.issueDate,
      inv.dueDate
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `factures_algeriatrade_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestion des Factures</h1>
                <p className="text-xs text-gray-500">AlgeriaTrade.dz - Administration des factures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exporter CSV
              </Button>
              <Button size="sm">
                <Receipt className="mr-2 h-4 w-4" />
                Nouvelle Facture
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{mockInvoices.length}</p>
                  <p className="text-xs text-gray-500">Total Factures</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-xl font-bold">{mockInvoices.filter(i => i.status === 'issued').length}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{mockInvoices.filter(i => i.status === 'paid').length}</p>
                  <p className="text-xs text-gray-500">Payées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={mockInvoices.filter(i => i.status === 'overdue').length > 0 ? 'border-red-300 bg-red-50/30' : ''}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${mockInvoices.filter(i => i.status === 'overdue').length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                <div>
                  <p className="text-xl font-bold">{mockInvoices.filter(i => i.status === 'overdue').length}</p>
                  <p className="text-xs text-gray-500">En retard</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold">{formatDZD(mockInvoices.reduce((sum, i) => sum + i.total, 0))}</p>
                  <p className="text-xs text-gray-500">Total TTC</p>
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
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par N° facture ou acheteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="issued">Émise</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Currency Filter */}
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes devises</SelectItem>
                  <SelectItem value="DZD">DZD - Dinar Algérien</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Amount Range */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min (د.ج)"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max (د.ج)"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedInvoices.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedInvoices.length} facture(s) sélectionnée(s)
                </span>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions groupées
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { setBulkAction('export'); setShowBulkDialog(true) }}>
                        <Download className="mr-2 h-4 w-4" />
                        Exporter CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setBulkAction('mark_issued'); setShowBulkDialog(true) }}>
                        <Clock className="mr-2 h-4 w-4" />
                        Marquer comme émise
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setBulkAction('credit_note'); setShowBulkDialog(true) }}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Générer avoirs
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedInvoices([])}>
                    Effacer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Acheteur</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead className="text-right">Montant HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date Émission</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <TableRow key={invoice.id} className={`${invoice.status === 'cancelled' ? 'opacity-60' : ''} ${invoice.status === 'overdue' ? 'bg-red-50/50' : ''}`}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedInvoices.includes(invoice.id)}
                            onCheckedChange={() => toggleSelectOne(invoice.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          <span className="max-w-[150px] truncate block" title={invoice.buyer}>{invoice.buyer}</span>
                        </TableCell>
                        <TableCell>
                          <span className="max-w-[150px] truncate block" title={invoice.seller}>{invoice.seller}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatDZD(invoice.amount)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{invoice.tvaRate}%</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{formatDZD(invoice.total)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{invoice.issueDate}</TableCell>
                        <TableCell className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-semibold' : ''}`}>{invoice.dueDate}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Télécharger PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {paginatedInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">Aucune facture trouvée</p>
                        <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres de recherche</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Summary Footer */}
            <div className="border-t bg-gray-50 px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-6 text-sm">
                  <span><strong>{summary.count}</strong> factures</span>
                  <span>HT: <strong>{formatDZD(summary.subtotal)}</strong></span>
                  <span>TVA: <strong>{formatDZD(summary.tvaTotal)}</strong></span>
                  <span className="font-semibold text-emerald-700">Total TTC: {formatDZD(summary.grandTotal)}</span>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} sur {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l&apos;action groupée</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d&apos;effectuer l&apos;action &quot;{bulkAction}&quot; sur {selectedInvoices.length} facture(s).
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkAction}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
