'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowUpDown,
  MoreVertical,
  CreditCard,
  Building2,
  Smartphone,
  Landmark,
  Banknote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn, formatDZD } from '@/lib/utils'
import type { PaymentStatus } from '@/components/payments/PaymentStatusTracker'

// Types
interface PaymentRecord {
  id: string
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  method: string
  status: PaymentStatus
  referenceNumber: string | null
  paidAt: Date | null
  failureReason: string | null
  createdAt: Date
  buyerName: string | null
  buyerEmail: string | null
  companyName: string | null
  needsVerification: boolean
}

interface PaymentsStats {
  total: number
  byStatus: Record<string, number>
  amounts: {
    total: number
    completed: number
  }
}

// Mock data for demo
const mockPayments: PaymentRecord[] = [
  {
    id: 'pay_1',
    orderId: 'order_1',
    orderNumber: 'ORD-2024-001234',
    amount: 125000,
    currency: 'DZD',
    method: 'CIB',
    status: 'COMPLETED',
    referenceNumber: 'CIB-20240115-A3F7K',
    paidAt: new Date('2024-01-15T10:30:00'),
    createdAt: new Date('2024-01-15T10:28:00'),
    buyerName: 'Ahmed Benali',
    buyerEmail: 'ahmed@entreprise.dz',
    companyName: 'Algeria Foods Export',
    needsVerification: false,
  },
  {
    id: 'pay_2',
    orderId: 'order_2',
    orderNumber: 'ORD-2024-001235',
    amount: 85000,
    currency: 'DZD',
    method: 'CCP',
    status: 'PENDING_VERIFICATION',
    referenceNumber: 'CCP-20240114-B8M2N',
    paidAt: null,
    createdAt: new Date('2024-01-14T14:20:00'),
    buyerName: 'Fatima Zerhouni',
    buyerEmail: 'fatima@company.dz',
    companyName: 'TechSupply Algérie',
    needsVerification: true,
  },
  {
    id: 'pay_3',
    orderId: 'order_3',
    orderNumber: 'ORD-2024-001236',
    amount: 250000,
    currency: 'DZD',
    method: 'BARIDIMOB',
    status: 'COMPLETED',
    referenceNumber: 'BM-20240114-X9P4Q',
    paidAt: new Date('2024-01-14T09:15:00'),
    createdAt: new Date('2024-01-14T09:12:00'),
    buyerName: 'Karim Hadj',
    buyerEmail: 'karim@business.dz',
    companyName: 'Industrial Parts SA',
    needsVerification: false,
  },
  {
    id: 'pay_4',
    orderId: 'order_4',
    orderNumber: 'ORD-2024-001237',
    amount: 45000,
    currency: 'DZD',
    method: 'BANK_TRANSFER',
    status: 'PENDING_VERIFICATION',
    referenceNumber: 'VB-20240113-K5L8M',
    paidAt: null,
    createdAt: new Date('2024-01-13T16:45:00'),
    buyerName: 'Sara Amrani',
    buyerEmail: 'sara@commerce.dz',
    companyName: 'Algeria Foods Export',
    needsVerification: true,
  },
  {
    id: 'pay_5',
    orderId: 'order_5',
    orderNumber: 'ORD-2024-001238',
    amount: 175000,
    currency: 'DZD',
    method: 'CIB',
    status: 'FAILED',
    referenceNumber: 'CIB-20240113-R7T2W',
    paidAt: null,
    failureReason: 'Fonds insuffisants',
    createdAt: new Date('2024-01-13T11:30:00'),
    buyerName: 'Youssef Mansouri',
    buyerEmail: 'youssef@group.dz',
    companyName: 'Bâtiment Plus',
    needsVerification: false,
  },
  {
    id: 'pay_6',
    orderId: 'order_6',
    orderNumber: 'ORD-2024-001239',
    amount: 95000,
    currency: 'DZD',
    method: 'COD',
    status: 'PROCESSING',
    referenceNumber: 'COD-20240112-P3H6J',
    paidAt: null,
    createdAt: new Date('2024-01-12T08:20:00'),
    buyerName: 'Lila Bouazza',
    buyerEmail: 'lila@retail.dz',
    companyName: 'TechSupply Algérie',
    needsVerification: false,
  },
]

export default function AdminPaymentsPage() {
  // State
  const [payments, setPayments] = useState<PaymentRecord[]>(mockPayments)
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>(mockPayments)
  const [stats, setStats] = useState<PaymentsStats>({
    total: mockPayments.length,
    byStatus: {
      PENDING: 0,
      PROCESSING: 1,
      COMPLETED: 2,
      FAILED: 1,
      PENDING_VERIFICATION: 2,
    },
    amounts: {
      total: 775000,
      completed: 375000,
    },
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  
  // Dialog state
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<'verify' | 'reject' | 'refund' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [notes, setNotes] = useState('')

  // Filter payments
  useEffect(() => {
    let filtered = [...payments]

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(p => p.method === methodFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.orderNumber.toLowerCase().includes(query) ||
        p.referenceNumber?.toLowerCase().includes(query) ||
        p.buyerName?.toLowerCase().includes(query) ||
        p.companyName?.toLowerCase().includes(query)
      )
    }

    setFilteredPayments(filtered)
  }, [payments, statusFilter, methodFilter, searchQuery])

  // Handle action dialog open
  const handleOpenActionDialog = (payment: PaymentRecord, action: 'verify' | 'reject' | 'refund') => {
    setSelectedPayment(payment)
    setDialogAction(action)
    setRejectionReason('')
    setNotes('')
    setDialogOpen(true)
  }

  // Handle action submit
  const handleSubmitAction = async () => {
    if (!selectedPayment || !dialogAction) return

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update local state
      const updatedPayments = payments.map(p => {
        if (p.id === selectedPayment.id) {
          switch (dialogAction) {
            case 'verify':
              return { ...p, status: 'COMPLETED' as PaymentStatus, paidAt: new Date(), needsVerification: false }
            case 'reject':
              return { ...p, status: 'FAILED' as PaymentStatus, failureReason: rejectionReason || 'Rejeté par l\'administrateur', needsVerification: false }
            case 'refund':
              return { ...p, status: 'REFUNDED' as PaymentStatus }
            default:
              return p
          }
        }
        return p
      })

      setPayments(updatedPayments)
      setDialogOpen(false)
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get method icon
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CIB': return <CreditCard className="h-4 w-4" />
      case 'CCP': return <Building2 className="h-4 w-4" />
      case 'BARIDIMOB': return <Smartphone className="h-4 w-4" />
      case 'BANK_TRANSFER': return <Landmark className="h-4 w-4" />
      case 'COD': return <Banknote className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  // Get method name
  const getMethodName = (method: string): string => {
    const names: Record<string, string> = {
      CIB: 'Carte Bancaire',
      CCP: 'Chèque Postale',
      BARIDIMOB: 'BaridiMob',
      BANK_TRANSFER: 'Virement Bancaire',
      COD: 'Paiement à la Livraison',
    }
    return names[method] || method
  }

  // Status badge config
  const getStatusBadge = (status: PaymentStatus) => {
    const configs: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      PENDING: { label: 'En attente', variant: 'outline', className: 'bg-gray-100 text-gray-700 border-gray-300' },
      PROCESSING: { label: 'En cours', variant: 'secondary', className: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Complété', variant: 'default', className: 'bg-green-100 text-green-700 border-green-200' },
      FAILED: { label: 'Échoué', variant: 'destructive', className: 'bg-red-100 text-red-700' },
      REFUNDED: { label: 'Remboursé', variant: 'outline', className: 'bg-purple-100 text-purple-700' },
      PENDING_VERIFICATION: { label: 'À vérifier', variant: 'secondary', className: 'bg-yellow-100 text-yellow-700' },
      CANCELLED: { label: 'Annulé', variant: 'outline', className: 'bg-gray-100 text-gray-500' },
    }
    
    const config = configs[status]
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", config.className)}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h1>
              <p className="text-sm text-gray-500 mt-1">Gérez et vérifiez les transactions de paiement</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                size="sm" 
                onClick={() => window.location.reload()}
                className="bg-[#006233] hover:bg-[#004d28]"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Total" 
            value={stats.total.toString()} 
            subtitle={`${formatDZD(stats.amounts.total)}`}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard 
            title="Complétés" 
            value={stats.byStatus.COMPLETED?.toString() || '0'} 
            subtitle={`${formatDZD(stats.amounts.completed)}`}
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            color="green"
          />
          <StatCard 
            title="En attente" 
            value={(stats.byStatus.PENDING + stats.byStatus.PROCESSING).toString()} 
            subtitle="Traitement"
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
            color="yellow"
          />
          <StatCard 
            title="À vérifier" 
            value={stats.byStatus.PENDING_VERIFICATION?.toString() || '0'} 
            subtitle="Preuves reçues"
            icon={<Eye className="h-5 w-5 text-blue-600" />}
            color="blue"
          />
          <StatCard 
            title="Échoués" 
            value={stats.byStatus.FAILED?.toString() || '0'} 
            subtitle="À traiter"
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            color="red"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par N° commande, référence, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="PROCESSING">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Complété</SelectItem>
                  <SelectItem value="FAILED">Échoué</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">À vérifier</SelectItem>
                  <SelectItem value="REFUNDED">Remboursé</SelectItem>
                </SelectContent>
              </Select>

              {/* Method Filter */}
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les méthodes</SelectItem>
                  <SelectItem value="CIB">Carte Bancaire</SelectItem>
                  <SelectItem value="CCP">Chèque Postale</SelectItem>
                  <SelectItem value="BARIDIMOB">BaridiMob</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Virement</SelectItem>
                  <SelectItem value="COD">Paiement à la livraison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Transactions ({filteredPayments.length})
              </CardTitle>
              <Button variant="ghost" size="sm">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Trier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className={payment.needsVerification ? "bg-yellow-50" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-mono font-medium text-sm">{payment.orderNumber}</p>
                          {payment.referenceNumber && (
                            <p className="text-xs text-gray-500">{payment.referenceNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{payment.buyerName || '-'}</p>
                          <p className="text-xs text-gray-500">{payment.companyName || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.method)}
                          <span className="text-sm">{getMethodName(payment.method)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">{formatDZD(payment.amount)}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                        {payment.failureReason && (
                          <p className="text-xs text-red-500 mt-1 max-w-32 truncate">
                            {payment.failureReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => console.log('View details:', payment.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            
                            {payment.needsVerification && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleOpenActionDialog(payment, 'verify')}
                                  className="text-green-600"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approuver
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleOpenActionDialog(payment, 'reject')}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeter
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {payment.status === 'COMPLETED' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleOpenActionDialog(payment, 'refund')}
                                  className="text-purple-600"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Rembourser
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="text-gray-400">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Aucun paiement trouvé</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'verify' && 'Approuver le paiement'}
              {dialogAction === 'reject' && 'Rejeter le paiement'}
              {dialogAction === 'refund' && 'Rembourser le paiement'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-4">
              {/* Payment Info */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Commande:</span>
                  <span className="font-mono font-medium">{selectedPayment.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Montant:</span>
                  <span className="font-semibold">{formatDZD(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Client:</span>
                  <span>{selectedPayment.buyerName}</span>
                </div>
              </div>

              {/* Rejection Reason (only for reject) */}
              {dialogAction === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Motif du rejet *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Expliquez pourquoi ce paiement est rejeté..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes internes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des notes pour référence interne..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={isLoading || (dialogAction === 'reject' && !rejectionReason)}
              className={cn(
                dialogAction === 'verify' && "bg-green-600 hover:bg-green-700",
                dialogAction === 'reject' && "bg-red-600 hover:bg-red-700",
                dialogAction === 'refund' && "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {isLoading ? 'Traitement...' : 
               dialogAction === 'verify' ? 'Approuver' :
               dialogAction === 'reject' ? 'Rejeter' : 'Rembourser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Sub-components
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'gray' 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ReactNode;
  color?: 'gray' | 'green' | 'yellow' | 'blue' | 'red';
}) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
  }

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            color === 'green' && "bg-green-100",
            color === 'yellow' && "bg-yellow-100",
            color === 'blue' && "bg-blue-100",
            color === 'red' && "bg-red-100",
            color === 'gray' && "bg-gray-100"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
