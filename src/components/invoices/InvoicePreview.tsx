'use client'

import React from 'react'
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
import type { Invoice } from '@/lib/invoices'
import { formatDZD } from '@/lib/payments/utils'

interface InvoicePreviewProps {
  invoice: Invoice
  onDownload?: () => void
  onPrint?: () => void
  onEmail?: () => void
  onPay?: () => void
  showActions?: boolean
}

export function InvoicePreview({
  invoice,
  onDownload,
  onPrint,
  onEmail,
  onPay,
  showActions = true,
}: InvoicePreviewProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
    ISSUED: { label: 'Émise', color: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Payée', color: 'bg-green-100 text-green-700' },
    PARTIAL: { label: 'Partielle', color: 'bg-yellow-100 text-yellow-700' },
    OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-gray-500' },
    REFUNDED: { label: 'Remboursée', color: 'bg-purple-100 text-purple-700' },
  }

  const typeLabels: Record<string, string> = {
    COMMERCIAL: 'Facture Commerciale',
    PROFORMA: 'Facture Proforma',
    CREDIT_NOTE: "Note de Crédit (Avoir)",
    DEBIT_NOTE: 'Note de Débit',
    DOWN_PAYMENT: "Facture d'Acompte",
    INSTALLMENT: "Facture d'Échéance",
  }

  const status = statusConfig[invoice.status] || { label: invoice.status, color: 'bg-gray-100' }
  const typeLabel = typeLabels[invoice.invoiceType] || invoice.invoiceType

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-[#006233]" />
            <div>
              <h2 className="text-xl font-bold">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-gray-500">{typeLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={status.color}>{status.label}</Badge>
          {showActions && (
            <div className="flex gap-2">
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              )}
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimer
                </Button>
              )}
              {onEmail && (
                <Button variant="outline" size="sm" onClick={onEmail}>
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
                <p className="text-gray-600">Alger, Algérie</p>
                <p className="text-gray-500 text-xs">NIF: 001012345678901</p>
                <p className="text-gray-500 text-xs">NRC: 16B0012345</p>
              </div>
            </div>

            {/* Buyer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#D52B1E] font-semibold mb-2">
                <User className="h-4 w-4" />
                Client / المشتري
              </div>
              <div className="text-sm space-y-1 pl-6 border-l-2 border-[#D52B1E]/30">
                <p className="font-medium">Client Entreprise</p>
                <p className="text-gray-600">Wilaya, Algérie</p>
                <p className="text-gray-500 text-xs">NIF: ***************</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase">Date d'émission</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(invoice.issueDate).toLocaleDateString('fr-DZ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date d'échéance</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(invoice.dueDate).toLocaleDateString('fr-DZ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Conditions</p>
              <p className="font-semibold">{invoice.paymentTerms}</p>
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
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="text-center">
                    {item.quantity.toLocaleString('fr-DZ')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDZD(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.discount > 0 ? `${item.discount}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.taxRate === 0 ? 'secondary' : 'outline'} className="text-xs">
                      {item.taxRate > 0 ? `${item.taxRate}%` : 'Exon.'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatDZD(item.lineTotal)}
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
                <span>{formatDZD(invoice.subtotal)}</span>
              </div>
              
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-sm py-1 text-green-600">
                  <span>Remise totale</span>
                  <span>-{formatDZD(invoice.discountTotal)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">TVA (19%)</span>
                <span>{formatDZD(invoice.tvaAmount)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg py-2">
                <span>Total TTC</span>
                <span className="text-[#006233]">{formatDZD(invoice.totalAmount)}</span>
              </div>

              {Number(invoice.amountPaid) > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm py-1 text-green-600">
                    <span>Montant payé</span>
                    <span>{formatDZD(Number(invoice.amountPaid))}</span>
                  </div>
                  <div className="flex justify-between font-semibold py-1">
                    <span>Solde dû</span>
                    <span className={Number(invoice.balanceDue) > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatDZD(Number(invoice.balanceDue))}
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
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Status & Actions */}
          {(invoice.status === 'ISSUED' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE') && 
            Number(invoice.balanceDue) > 0 &&
            onPay && (
              <div className="p-4 bg-gradient-to-r from-[#006233]/10 to-transparent rounded-lg border border-[#006233]/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#006233]">
                      Solde à payer: {formatDZD(Number(invoice.balanceDue))}
                    </p>
                    <p className="text-sm text-gray-600">
                      Effectuez le paiement pour finaliser cette facture
                    </p>
                  </div>
                  <Button onClick={onPay} className="bg-[#006233] hover:bg-[#004d28]">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payer maintenant
                  </Button>
                </div>
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
                      +{formatDZD(payment.amount)}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {payment.referenceNumber || payment.transactionId || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default InvoicePreview
