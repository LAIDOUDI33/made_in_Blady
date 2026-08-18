'use client'

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Printer,
  Mail,
  Eye,
  CreditCard,
  Calendar,
  Building2,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/invoicing/calculator'

// Types
interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  tvaRate: number
  tvaAmount: number
  lineTotal: number
  lineTotalWithTax: number
  productSku?: string
}

interface TVABreakdownEntry {
  rate: number
  taxableBase: number
  tvaAmount: number
}

interface InvoicePayment {
  id: string
  amount: number
  paymentMethod: string
  paymentReference?: string
  notes?: string
  paidAt: string
}

interface InvoiceData {
  id: string
  invoiceNumber: string
  invoiceType: string
  status: string
  sellerId: string
  buyerId: string
  orderId?: string
  issueDate: string
  dueDate?: string
  paidAt?: string
  cancelledAt?: string
  subtotal: number
  discountAmount: number
  discountPercent: number
  taxableBase: number
  tvaAmount: number
  totalAmount: number
  amountPaid: number
  amountDue: number
  currency: string
  paymentTerms: string
  notes?: string
  internalNotes?: string
  parentInvoiceId?: string
  items: InvoiceItem[]
  tvaBreakdown: TVABreakdownEntry[]
  payments: InvoicePayment[]
  parentInvoice?: { invoiceNumber: string }
  creditNotes?: Array<{ id: string; invoiceNumber: string; status: string }>
}

interface InvoiceViewerProps {
  invoice: InvoiceData
  onDownload?: (invoiceId: string) => void
  onPrint?: (invoiceId: string) => void
  onEmail?: (invoiceId: string) => void
  onPay?: (invoiceId: string, amount: number) => void
  onIssue?: (invoiceId: string) => void
  onCancel?: (invoiceId: string, reason: string) => void
  showActions?: boolean
  isLoading?: boolean
}

export function InvoiceViewer({
  invoice,
  onDownload,
  onPrint,
  onEmail,
  onPay,
  onIssue,
  onCancel,
  showActions = true,
  isLoading = false,
}: InvoiceViewerProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(invoice.amountDue)
  const [isProcessing, setIsProcessing] = useState(false)

  // Status configuration
  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: <FileText className="h-3 w-3" /> },
    ISSUED: { label: 'Émise', color: 'bg-blue-100 text-blue-700', icon: <Eye className="h-3 w-3" /> },
    PAID: { label: 'Payée', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
    PARTIAL: { label: 'Partielle', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
    OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="h-3 w-3" /> },
    CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-gray-500', icon: <XCircle className="h-3 w-3" /> },
  }

  // Type labels
  const typeLabels: Record<string, string> = {
    STANDARD: 'Facture Standard',
    PROFORMA: 'Facture Proforma',
    CREDIT_NOTE: "Note de Crédit (Avoir)",
    DEBIT_NOTE: 'Note de Débit',
    DOWN_PAYMENT: "Facture d'Acompte",
    INSTALLMENT: "Facture d'Échéance",
  }

  // Payment term labels
  const paymentTermLabels: Record<string, string> = {
    IMMEDIATE: 'Paiement immédiat',
    NET30: 'Net 30 jours',
    NET60: 'Net 60 jours',
    NET90: 'Net 90 jours',
    EOM: 'Fin de mois',
  }

  const status = statusConfig[invoice.status] || { label: invoice.status, color: 'bg-gray-100', icon: null }
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && 
                   ['ISSUED', 'PARTIAL'].includes(invoice.status)

  // Handle issue action
  const handleIssue = async () => {
    if (!onIssue) return
    setIsProcessing(true)
    try {
      await onIssue(invoice.id)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle cancel action
  const handleCancel = async () => {
    if (!onCancel || !cancelReason.trim()) return
    setIsProcessing(true)
    try {
      await onCancel(invoice.id, cancelReason)
      setShowCancelDialog(false)
      setCancelReason('')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle payment
  const handlePayment = async () => {
    if (!onPay || paymentAmount <= 0) return
    setIsProcessing(true)
    try {
      await onPay(invoice.id, paymentAmount)
      setShowPaymentDialog(false)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#006233]" />
        <span className="ml-2 text-gray-600">Chargement de la facture...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#006233]" />
            <div>
              <h2 className="text-xl font-bold">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-gray-500">{typeLabels[invoice.invoiceType] || invoice.invoiceType}</p>
            </div>
          </div>
          {invoice.parentInvoice && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Lié à: {invoice.parentInvoice.invoiceNumber}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`${status.color} text-xs`}>
            {status.icon}
            <span className="ml-1">{status.label}</span>
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              EN RETARD
            </Badge>
          )}
          
          {showActions && (
            <div className="flex gap-2 mt-2 sm:mt-0">
              {onDownload && (
                <Button variant="outline" size="sm" onClick={() => onDownload(invoice.id)}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              )}
              {onPrint && (
                <Button variant="outline" size="sm" onClick={() => onPrint(invoice.id)}>
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimer
                </Button>
              )}
              {onEmail && (
                <Button variant="outline" size="sm" onClick={() => onEmail(invoice.id)}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="overflow-hidden">
        {/* Document Header */}
        <div className="bg-gradient-to-r from-[#006233] to-[#008040] p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-wide">FACTURE</h1>
              <p className="text-white/80 mt-1" dir="rtl">فاتورة</p>
            </div>
            <div className="text-right bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider opacity-80">N° Facture</p>
              <p className="text-lg font-mono font-bold">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Parties */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Seller */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#006233] font-semibold mb-2">
                <Building2 className="h-4 w-4" />
                Émetteur / البائع
              </div>
              <div className="text-sm space-y-1 pl-6 border-l-2 border-[#006233]/30">
                <p className="font-medium">AlgeriaTrade.dz SARL</p>
                <p className="text-gray-600">123 Rue Didouche Mourad, Alger, 16000</p>
                <p className="text-gray-500 text-xs">NIF: 000000000000000</p>
                <p className="text-gray-500 text-xs">RC: 16A/AAAA/BBBB</p>
                <p className="text-gray-500 text-xs">AI: 0000000</p>
              </div>
            </div>

            {/* Buyer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#D52B1E] font-semibold mb-2">
                <User className="h-4 w-4" />
                Client / المشتري
              </div>
              <div className="text-sm space-y-1 pl-6 border-l-2 border-[#D52B1E]/30">
                <p className="font-medium">Client ID: {invoice.buyerId.slice(0, 12)}...</p>
                <p className="text-gray-600">Algérie</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase">Date d&apos;émission</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(invoice.issueDate).toLocaleDateString('fr-DZ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date d&apos;échéance</p>
              <p className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="h-3 w-3" />
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-DZ') : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Conditions</p>
              <p className="font-semibold">{paymentTermLabels[invoice.paymentTerms] || invoice.paymentTerms}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Devise</p>
              <p className="font-semibold">{invoice.currency}</p>
            </div>
          </div>

          {/* Items Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead className="text-right">P.U.</TableHead>
                <TableHead className="text-center">Remise</TableHead>
                <TableHead className="text-center">TVA</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.description}
                    {item.productSku && (
                      <span className="block text-xs text-gray-400">SKU: {item.productSku}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantity.toLocaleString('fr-DZ')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice, invoice.currency as any)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.discount > 0 ? `${item.discount}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={item.tvaRate === 0 || item.tvaRate === -1 ? 'secondary' : 'outline'} 
                      className="text-xs"
                    >
                      {item.tvaRate === -1 ? 'Exon.' : item.tvaRate === 0 ? '0%' : `${item.tvaRate}%`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.lineTotalWithTax, invoice.currency as any)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Sous-total HT</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency as any)}</span>
              </div>
              
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm py-1 text-green-600">
                  <span>Remise totale</span>
                  <span>-{formatCurrency(invoice.discountAmount, invoice.currency as any)}</span>
                </div>
              )}
              
              {/* TVA Breakdown Summary */}
              {invoice.tvaBreakdown.map((entry) => (
                <div key={entry.rate} className="flex justify-between text-sm py-1 text-blue-600">
                  <span>TVA ({entry.rate === -1 ? 'Exonéré' : `${entry.rate}%`})</span>
                  <span>{formatCurrency(entry.tvaAmount, invoice.currency as any)}</span>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg py-2">
                <span>Total TTC</span>
                <span className="text-[#006233]">
                  {formatCurrency(invoice.totalAmount, invoice.currency as any)}
                </span>
              </div>

              {invoice.amountPaid > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm py-1 text-green-600">
                    <span>Montant payé</span>
                    <span>+{formatCurrency(invoice.amountPaid, invoice.currency as any)}</span>
                  </div>
                  <div className="flex justify-between font-semibold py-1">
                    <span>Solde dû</span>
                    <span className={invoice.amountDue > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(Math.max(0, invoice.amountDue), invoice.currency as any)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Actions */}
          {(invoice.status === 'ISSUED' || invoice.status === 'PARTIAL') && 
           invoice.amountDue > 0 &&
           showActions && onPay && (
            <div className="p-4 bg-gradient-to-r from-[#006233]/10 to-transparent rounded-lg border border-[#006233]/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#006233]">
                    Solde à payer: {formatCurrency(invoice.amountDue, invoice.currency as any)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Effectuez le paiement pour finaliser cette facture
                  </p>
                </div>
                <Button 
                  onClick={() => setShowPaymentDialog(true)} 
                  className="bg-[#006233] hover:bg-[#004d28]"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer maintenant
                </Button>
              </div>
            </div>
          )}

          {/* Issue Action for Drafts */}
          {invoice.status === 'DRAFT' && showActions && onIssue && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-blue-800">
                    Cette facture est un brouillon
                  </p>
                  <p className="text-sm text-blue-600">
                    Émettez-la pour la rendre officielle et la envoyer au client
                  </p>
                </div>
                <Button 
                  onClick={handleIssue} 
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Émettre la facture
                </Button>
              </div>
            </div>
          )}

          {/* Cancel Action */}
          {(invoice.status === 'DRAFT' || invoice.status === 'ISSUED') && 
           showActions && onCancel && (
            <div className="mt-4">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler cette facture
              </Button>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            Document généré par AlgeriaTrade.dz - Conforme à la réglementation fiscale algérienne
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Généré le {new Date().toLocaleString('fr-DZ')} | Page 1/1
          </p>
        </div>
      </Card>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Historique des paiements ({invoice.payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paidAt).toLocaleDateString('fr-DZ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {payment.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +{formatCurrency(payment.amount, invoice.currency as any)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {payment.paymentReference || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Related Credit Notes */}
      {invoice.creditNotes && invoice.creditNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Notes de crédit associées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.creditNotes.map((cn) => (
                <div key={cn.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">{cn.invoiceNumber}</p>
                      <p className="text-xs text-gray-500">Note de crédit</p>
                    </div>
                  </div>
                  <Badge className={cn.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {cn.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Entrez les détails du paiement pour la facture {invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
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
                  max={invoice.amountDue}
                  step="any"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {invoice.currency}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Solde restant: {formatCurrency(invoice.amountDue, invoice.currency as any)}
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Après ce paiement, le nouveau solde sera:{' '}
                <strong>
                  {formatCurrency(Math.max(0, invoice.amountDue - paymentAmount), invoice.currency as any)}
                </strong>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing || paymentAmount <= 0 || paymentAmount > invoice.amountDue}
              className="bg-[#006233] hover:bg-[#004d28]"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la facture</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d&apos;annuler la facture {invoice.invoiceNumber}. 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison de l&apos;annulation *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Expliquez pourquoi vous annulez cette facture..."
                required
              />
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Attention</p>
                <p>Une fois annulée, cette facture ne pourra plus être modifiée ou payée.</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Retour
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel} 
              disabled={isProcessing || !cancelReason.trim()}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer l&apos;annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvoiceViewer
