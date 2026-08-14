'use client'

import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react'
import { Printer, Download, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatDZD } from '@/lib/utils'

export interface ReceiptData {
  orderNumber: string
  paymentReference: string
  transactionId?: string
  amount: number
  currency?: string
  paymentMethod: string
  status: string
  paidAt?: Date | string
  buyerName?: string
  buyerEmail?: string
  companyName?: string
  items?: Array<{
    name: string
    quantity: number
    unitPrice: number
    total: number
  }>
}

interface ReceiptGeneratorProps {
  data: ReceiptData
  showActions?: boolean
}

export interface ReceiptGeneratorHandle {
  print: () => void
  download: () => void
}

// Helper function to get method display name (defined outside component)
const getMethodName = (method: string): string => {
  const names: Record<string, string> = {
    CIB: 'Carte Bancaire (CIB)',
    CCP: 'Chèque Postale (CCP)',
    BARIDIMOB: 'BaridiMob',
    BANK_TRANSFER: 'Virement Bancaire',
    COD: 'Paiement à la Livraison',
  }
  return names[method] || method
}

export const ReceiptGenerator = forwardRef<ReceiptGeneratorHandle, ReceiptGeneratorProps>(
  ({ data, showActions = true }, ref) => {
    const receiptRef = useRef<HTMLDivElement>(null)

    // Print receipt function - defined before useImperativeHandle
    const handlePrint = useCallback(() => {
      if (!receiptRef.current) return
      
      const printContent = receiptRef.current.innerHTML
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Reçu de Paiement - ${data.orderNumber}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 40px;
                  background: white;
                  color: #1a1a1a;
                }
                .receipt-container {
                  max-width: 600px;
                  margin: 0 auto;
                  border: 1px solid #e5e5e5;
                  border-radius: 8px;
                  overflow: hidden;
                }
                .receipt-header {
                  background: linear-gradient(135deg, #006233 0%, #004d28 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                }
                .receipt-header h1 { font-size: 24px; margin-bottom: 5px; }
                .receipt-header p { opacity: 0.9; font-size: 14px; }
                .receipt-body { padding: 30px; }
                .status-badge {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  padding: 6px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  text-transform: uppercase;
                }
                .status-completed { background: #dcfce7; color: #166534; }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 16px;
                  margin: 24px 0;
                }
                .info-item label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
                .info-item value { font-weight: 600; font-size: 15px; }
                .amount-display {
                  text-align: center;
                  padding: 20px;
                  background: #f9fafb;
                  border-radius: 8px;
                  margin: 24px 0;
                }
                .amount-label { font-size: 14px; color: #666; }
                .amount-value { font-size: 32px; font-weight: 700; color: #006233; }
                .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                .items-table th {
                  text-align: left;
                  padding: 10px;
                  background: #f9fafb;
                  border-bottom: 2px solid #e5e5e5;
                  font-size: 12px;
                  color: #666;
                }
                .items-table td {
                  padding: 10px;
                  border-bottom: 1px solid #f0f0f0;
                  font-size: 14px;
                }
                .receipt-footer {
                  text-align: center;
                  padding: 20px;
                  background: #f9fafb;
                  font-size: 12px;
                  color: #999;
                }
                @media print {
                  body { padding: 0; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="receipt-container">
                ${printContent}
              </div>
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }, [data.orderNumber])

    // Download as PDF (simplified - opens print dialog)
    const handleDownload = useCallback(() => {
      handlePrint()
    }, [handlePrint])

    // Expose methods to parent component (after functions are defined)
    useImperativeHandle(ref, () => ({
      print: handlePrint,
      download: handleDownload,
    }), [handlePrint, handleDownload])

    return (
      <div className="space-y-4">
        {/* Action Buttons */}
        {showActions && (
          <div className="flex justify-end gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="gap-2 bg-[#006233] hover:bg-[#004d28]"
            >
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </div>
        )}

        {/* Receipt Content */}
        <div ref={receiptRef}>
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#006233] to-[#004d28] text-white p-6 md:p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FileText className="h-8 w-8" />
              <h1 className="text-2xl md:text-3xl font-bold">Reçu de Paiement</h1>
            </div>
            <p className="text-white/80 text-sm">AlgeriaTrade.dz - Plateforme B2B Algérie</p>
          </div>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Status Badge */}
            <div className="text-center">
              <span className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
                data.status === 'COMPLETED' && "bg-green-100 text-green-700",
                data.status === 'PENDING' && "bg-yellow-100 text-yellow-700",
                data.status === 'FAILED' && "bg-red-100 text-red-700",
              )}>
                <CheckCircle2 className="h-4 w-4" />
                {data.status === 'COMPLETED' ? 'Paiement Confirmé' :
                 data.status === 'PENDING' ? 'En Attente' : data.status}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem label="N° de Commande" value={data.orderNumber} />
              <InfoItem label="Référence Paiement" value={data.paymentReference} mono />
              {data.transactionId && (
                <InfoItem label="Transaction ID" value={data.transactionId.slice(0, 18) + '...'} mono />
              )}
              <InfoItem label="Méthode de Paiement" value={getMethodName(data.paymentMethod)} />
              {data.buyerName && (
                <InfoItem label="Acheteur" value={data.buyerName} />
              )}
              {data.companyName && (
                <InfoItem label="Fournisseur" value={data.companyName} />
              )}
            </div>

            {/* Amount Display */}
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Montant Total Payé</p>
              <p className="text-3xl md:text-4xl font-bold text-[#006233]">
                {formatDZD(data.amount)}
              </p>
              {data.paidAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Le {new Date(data.paidAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>

            {/* Items Table (if provided) */}
            {data.items && data.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Article</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Qté</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Prix Unit.</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">{formatDZD(item.unitPrice)}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatDZD(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t text-center text-xs text-gray-400 space-y-1">
              <p>Ce reçu est généré automatiquement et constitue une preuve de paiement.</p>
              <p>Pour toute question, contactez notre service client à support@algeriatrade.dz</p>
              <p className="mt-2">Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }
)

ReceiptGenerator.displayName = 'ReceiptGenerator'

// Sub-component for info items
function InfoItem({ 
  label, 
  value, 
  mono = false 
}: { 
  label: string
  value: string
  mono?: boolean 
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <p className={cn(
        "font-semibold text-gray-900",
        mono && "font-mono text-sm"
      )}>
        {value}
      </p>
    </div>
  )
}

export default ReceiptGenerator
