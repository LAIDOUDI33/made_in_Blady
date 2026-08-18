'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  CreditCard,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/invoicing/calculator'

// Types
interface ClientInvoice {
  id: string
  invoiceNumber: string
  invoiceType: string
  status: string
  issueDate: string
  dueDate?: string
  totalAmount: number
  amountPaid: number
  amountDue: number
  currency: string
  sellerName?: string
  notes?: string
}

interface ClientInvoicePortalProps {
  buyerId: string
  invoices?: ClientInvoice[]
  isLoading?: boolean
  onDownload?: (invoiceId: string) => void
  onPay?: (invoiceId: string, amount: number) => void
  onDispute?: (invoiceId: string, reason: string) => void
  onViewDetails?: (invoiceId: string) => void
}

export function ClientInvoicePortal({
  buyerId,
  invoices = [],
  isLoading = false,
  onDownload,
  onPay,
  onDispute,
  onViewDetails,
}: ClientInvoicePortalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'due'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  
  // Dispute dialog state
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  
  // Expanded invoice for details
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  // Status configuration
  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: <FileText className="h-3 w-3" /> },
    ISSUED: { label: 'Émise', color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" /> },
    PAID: { label: 'Payée', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
    PARTIAL: { label: 'Partielle', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
    OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3 w-3" /> },
    CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-gray-500', icon: <XCircle className="h-3 w-3" /> },
  }

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter((invoice) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          (invoice.sellerName && invoice.sellerName.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
          break
        case 'amount':
          comparison = a.totalAmount - b.totalAmount
          break
        case 'due':
          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : 0
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : 0
          comparison = aDue - bDue
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

  // Calculate summary statistics
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    pending: invoices.filter(i => ['ISSUED', 'PARTIAL'].includes(i.status)).length,
    overdue: invoices.filter(i => i.status === 'OVERDUE').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amountDue, 0),
    totalPaid: invoices.reduce((sum, i) => sum + i.amountPaid, 0),
  }

  // Handle payment
  const handlePayment = () => {
    if (!selectedInvoice || !onPay || paymentAmount <= 0) return
    onPay(selectedInvoice.id, paymentAmount)
    setShowPaymentDialog(false)
    setSelectedInvoice(null)
    setPaymentAmount(0)
  }

  // Handle dispute
  const handleDispute = () => {
    if (!selectedInvoice || !onDispute || !disputeReason.trim()) return
    onDispute(selectedInvoice.id, disputeReason)
    setShowDisputeDialog(false)
    setSelectedInvoice(null)
    setDisputeReason('')
  }

  // Open payment dialog
  const openPaymentDialog = (invoice: ClientInvoice) => {
    setSelectedInvoice(invoice)
    setPaymentAmount(invoice.amountDue)
    setShowPaymentDialog(true)
  }

  // Open dispute dialog
  const openDisputeDialog = (invoice: ClientInvoice) => {
    setSelectedInvoice(invoice)
    setShowDisputeDialog(true)
  }

  // Toggle expand invoice details
  const toggleExpand = (invoiceId: string) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId)
  }

  // Check if invoice is overdue
  const isOverdue = (invoice: ClientInvoice) => {
    return invoice.dueDate && 
           new Date(invoice.dueDate) < new Date() && 
           ['ISSUED', 'PARTIAL'].includes(invoice.status)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#006233]/10 rounded-lg">
          <FileText className="h-6 w-6 text-[#006233]" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Mes Factures</h2>
          <p className="text-sm text-gray-500">
            Gérez et suivez vos factures reçues
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-xs text-gray-500">Payées</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </CardContent>
        </Card>

        <Card className={stats.overdue > 0 ? 'border-red-200' : ''}>
          <CardContent className={`p-4 text-center ${stats.overdue > 0 ? 'bg-red-50' : ''}`}>
            <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>
              {stats.overdue}
            </p>
            <p className="text-xs text-gray-500">En retard</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-[#006233]">
              {formatCurrency(stats.totalAmount, 'DZD')}
            </p>
            <p className="text-xs text-gray-500">À payer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par N° ou vendeur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ISSUED">Émise</SelectItem>
                <SelectItem value="PAID">Payée</SelectItem>
                <SelectItem value="PARTIAL">Partielle</SelectItem>
                <SelectItem value="OVERDUE">En retard</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Montant</SelectItem>
                <SelectItem value="due">Échéance</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 animate-pulse text-gray-300" />
            <p className="text-gray-500">Chargement de vos factures...</p>
          </CardContent>
        </Card>
      ) : filteredInvoices.length > 0 ? (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const status = statusConfig[invoice.status]
            const overdue = isOverdue(invoice)
            const expanded = expandedInvoice === invoice.id

            return (
              <Card
                key={invoice.id}
                className={`overflow-hidden transition-all ${
                  overdue ? 'border-l-4 border-l-red-500' : ''
                } ${expanded ? 'shadow-md' : ''}`}
              >
                {/* Main Row - Clickable to Expand */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(invoice.id)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-[#006233] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{invoice.invoiceNumber}</span>
                          <Badge className={`${status?.color} text-xs`}>
                            {status?.icon}
                            <span className="ml-1">{status?.label}</span>
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              EN RETARD
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(invoice.issueDate).toLocaleDateString('fr-DZ')}
                          {invoice.dueDate && ` • Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-DZ')}`}
                        </p>
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">
                        {formatCurrency(invoice.totalAmount, invoice.currency as any)}
                      </p>
                      <div className="flex items-center gap-2 justify-end text-sm mt-1">
                        {invoice.amountPaid > 0 && (
                          <span className="text-green-600">
                            Payé: {formatCurrency(invoice.amountPaid, invoice.currency as any)}
                          </span>
                        )}
                        {invoice.amountDue > 0 && (
                          <span className={overdue ? 'font-medium text-red-600' : 'text-orange-600'}>
                            Reste: {formatCurrency(invoice.amountDue, invoice.currency as any)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="shrink-0">
                      {expanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <>
                    <Separator />
                    <div className="p-4 bg-gray-50 space-y-4">
                      {/* Seller Info */}
                      {invoice.sellerName && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Vendeur</p>
                          <p className="font-medium">{invoice.sellerName}</p>
                        </div>
                      )}

                      {/* Notes */}
                      {invoice.notes && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Notes</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {onViewDetails && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewDetails(invoice.id)
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        )}

                        {onDownload && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDownload(invoice.id)
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        )}

                        {invoice.amountDue > 0 && ['ISSUED', 'PARTIAL'].includes(invoice.status) && onPay && (
                          <Button
                            size="sm"
                            className="bg-[#006233] hover:bg-[#004d28]"
                            onClick={(e) => {
                              e.stopPropagation()
                              openPaymentDialog(invoice)
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Payer
                          </Button>
                        )}

                        {['ISSUED', 'PARTIAL'].includes(invoice.status) && onDispute && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDisputeDialog(invoice)
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Contester
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-900 mb-2">
              Aucune facture trouvée
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Vous n\'avez pas encore reçu de factures'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payer la facture</DialogTitle>
            <DialogDescription>
              {selectedInvoice && `Facture ${selectedInvoice.invoiceNumber}`}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Montant du paiement</label>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md pr-12"
                    min="0"
                    max={selectedInvoice.amountDue}
                    step="any"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {selectedInvoice.currency}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Solde restant: {formatCurrency(selectedInvoice.amountDue, selectedInvoice.currency as any)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(selectedInvoice.amountDue)}
                  className="flex-1"
                >
                  Total ({formatCurrency(selectedInvoice.amountDue, selectedInvoice.currency as any)})
                </Button>
                {selectedInvoice.amountDue > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(Math.ceil(selectedInvoice.amountDue / 2))}
                    className="flex-1"
                  >
                    Moitié
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!selectedInvoice || paymentAmount <= 0}
              className="bg-[#006233] hover:bg-[#004d28]"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contester une facture</DialogTitle>
            <DialogDescription>
              {selectedInvoice && `Signalez un problème avec la facture ${selectedInvoice.invoiceNumber}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison de la contestation *</label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                placeholder="Décrivez pourquoi vous contestez cette facture..."
                required
              />
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important</p>
                <p>
                  Votre contestation sera envoyée au vendeur pour examen. 
                  Cela ne suspend pas automatiquement les délais de paiement.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDispute}
              disabled={!disputeReason.trim()}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Envoyer la contestation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClientInvoicePortal
