'use client'

import React, { useState } from 'react'
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Invoice, InvoiceStatus, InvoiceType } from '@/lib/invoices'
import { formatDZD } from '@/lib/payments/utils'

interface InvoiceListProps {
  invoices: Invoice[]
  isLoading?: boolean
  total?: number
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onInvoiceClick?: (invoice: Invoice) => void
  onInvoiceDownload?: (invoiceId: string) => void
  onCreateNew?: () => void
}

export function InvoiceList({
  invoices,
  isLoading = false,
  total = invoices.length,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onInvoiceClick,
  onInvoiceDownload,
  onCreateNew,
}: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      searchQuery === '' ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.lineItems.some((item) =>
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesType = typeFilter === 'all' || invoice.invoiceType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const statusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
    DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
    ISSUED: { label: 'Émise', color: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Payée', color: 'bg-green-100 text-green-700' },
    PARTIAL: { label: 'Partielle', color: 'bg-yellow-100 text-yellow-700' },
    OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-gray-500' },
    REFUNDED: { label: 'Remboursée', color: 'bg-purple-100 text-purple-700' },
  }

  const typeConfig: Record<InvoiceType, { label: string; icon: string }> = {
    COMMERCIAL: { label: 'Commerciale', icon: '📄' },
    PROFORMA: { label: 'Proforma', icon: '📋' },
    CREDIT_NOTE: { label: 'Avoir', icon: '↩️' },
    DEBIT_NOTE: { label: 'Débit', icon: '↪️' },
    DOWN_PAYMENT: { label: 'Acompte', icon: '💰' },
    INSTALLMENT: { label: 'Échéance', icon: '📅' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Factures</h2>
          <p className="text-sm text-gray-500 mt-1">
            {total} facture{total !== 1 ? 's' : ''} au total
          </p>
        </div>
        
        {onCreateNew && (
          <Button onClick={onCreateNew} className="bg-[#006233] hover:bg-[#004d28]">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par N° ou description..."
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
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="ISSUED">Émise</SelectItem>
                <SelectItem value="PAID">Payée</SelectItem>
                <SelectItem value="PARTIAL">Partielle</SelectItem>
                <SelectItem value="OVERDUE">En retard</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="COMMERCIAL">Commerciale</SelectItem>
                <SelectItem value="PROFORMA">Proforma</SelectItem>
                <SelectItem value="CREDIT_NOTE">Avoir</SelectItem>
                <SelectItem value="DOWN_PAYMENT">Acompte</SelectItem>
                <SelectItem value="INSTALLMENT">Échéance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 animate-pulse text-gray-300" />
            <p className="text-gray-500">Chargement des factures...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Invoices List */}
          {filteredInvoices.length > 0 ? (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const status = statusConfig[invoice.status]
                const type = typeConfig[invoice.invoiceType]

                return (
                  <Card
                    key={invoice.id}
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      Number(invoice.balanceDue) > 0 && 
                      (invoice.status === 'ISSUED' || invoice.status === 'OVERDUE')
                        ? 'border-l-4 border-l-[#006233]'
                        : ''
                    }`}
                    onClick={() => onInvoiceClick?.(invoice)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Main Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="text-2xl">{type?.icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold truncate">
                                {invoice.invoiceNumber}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {type?.label}
                              </Badge>
                              <Badge className={`${status?.color} text-xs`}>
                                {status?.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate">
                              {new Date(invoice.issueDate).toLocaleDateString('fr-DZ')} -{' '}
                              {invoice.lineItems.length} article{invoice.lineItems.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Amounts */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg">
                            {formatDZD(invoice.totalAmount)}
                          </p>
                          {Number(invoice.amountPaid) > 0 && (
                            <p className="text-sm text-green-600">
                              Payé: {formatDZD(Number(invoice.amountPaid))}
                            </p>
                          )}
                          {Number(invoice.balanceDue) > 0 && (
                            <p className="text-sm font-medium text-orange-600">
                              Solde: {formatDZD(Number(invoice.balanceDue))}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onInvoiceClick?.(invoice)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onInvoiceDownload?.(invoice.id)
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
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
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Essayez de modifier vos filtres de recherche'
                    : 'Commencez par créer votre première facture'}
                </p>
                {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setTypeFilter('all')
                    }}
                  >
                    Effacer les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages} ({filteredInvoices.length} résultats)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange?.(pageNum)}
                      className="w-9 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default InvoiceList
