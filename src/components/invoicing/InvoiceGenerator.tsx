'use client'

import React, { useState, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Calculator,
  FileText,
  AlertCircle,
  Save,
  Eye,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TVARate } from '@/lib/invoicing/config'
import {
  calculateLineItemTax,
  calculateInvoiceTotals,
  formatCurrency,
} from '@/lib/invoicing/calculator'
import { invoiceConfig } from '@/lib/invoicing/config'

interface InvoiceLineItemInput {
  id: string
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  tvaRate: number
  productSku?: string
  unitOfMeasure?: string
}

interface InvoiceGeneratorProps {
  onCreateInvoice?: (data: any) => void
  onPreview?: (data: any) => void
  defaultSellerId?: string
  defaultBuyerId?: string
  defaultOrderId?: string
}

const emptyItem = (): InvoiceLineItemInput => ({
  id: Math.random().toString(36).substr(2, 9),
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  tvaRate: 19,
})

export function InvoiceGenerator({
  onCreateInvoice,
  onPreview,
  defaultSellerId = '',
  defaultBuyerId = '',
  defaultOrderId = '',
}: InvoiceGeneratorProps) {
  const [formData, setFormData] = useState({
    invoiceType: 'STANDARD',
    orderId: defaultOrderId,
    sellerId: defaultSellerId,
    buyerId: defaultBuyerId,
    issueDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'NET30',
    currency: 'DZD',
    notes: '',
    internalNotes: '',
  })

  const [items, setItems] = useState<InvoiceLineItemInput[]>([emptyItem()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState(0)

  // Calculate totals whenever items change
  const totals = calculateInvoiceTotals(items, globalDiscount)

  // Add new item
  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem()])
  }, [])

  // Remove item
  const removeItem = useCallback((id: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [items.length])

  // Update item field
  const updateItem = useCallback((id: string, field: keyof InvoiceLineItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }, [])

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.sellerId) newErrors.sellerId = 'ID vendeur requis'
    if (!formData.buyerId) newErrors.buyerId = 'ID acheteur requis'

    items.forEach((item, index) => {
      if (!item.description?.trim()) {
        newErrors[`item_${index}_desc`] = 'Description requise'
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_qty`] = 'Quantité invalide'
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_price`] = 'Prix invalide'
      }
    })

    if (items.length === 0) {
      newErrors.items = 'Au moins un article est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tvaRate: item.tvaRate,
          productId: item.productId,
          productSku: item.productSku,
          unitOfMeasure: item.unitOfMeasure,
        })),
        discountPercent: globalDiscount,
      }

      if (onCreateInvoice) {
        await onCreateInvoice(payload)
      } else {
        // Default API call
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        
        if (response.ok) {
          const result = await response.json()
          alert(`Facture créée: ${result.data.invoiceNumber}`)
          // Reset form
          setItems([emptyItem()])
          setFormData(prev => ({
            ...prev,
            notes: '',
            internalNotes: '',
          }))
          setGlobalDiscount(0)
        } else {
          const error = await response.json()
          alert(`Erreur: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Erreur lors de la création de la facture')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle preview
  const handlePreview = () => {
    if (!validate()) return
    
    const previewData = {
      ...formData,
      items,
      totals,
    }
    
    if (onPreview) {
      onPreview(previewData)
    } else {
      setShowPreview(true)
    }
  }

  const invoiceTypeLabels: Record<string, string> = {
    STANDARD: 'Facture Standard',
    PROFORMA: 'Facture Proforma',
    CREDIT_NOTE: 'Note de Crédit (Avoir)',
    DEBIT_NOTE: 'Note de Débit',
    DOWN_PAYMENT: "Facture d'Acompte",
    INSTALLMENT: "Facture d'Échéance",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#006233]/10 rounded-lg">
          <FileText className="h-6 w-6 text-[#006233]" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Générateur de Factures</h2>
          <p className="text-sm text-gray-500">
            Créez des factures conformes à la réglementation algérienne (TVA)
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations de la facture
          </CardTitle>
          <CardDescription>Définissez le type et les informations générales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Invoice Type */}
            <div className="space-y-2">
              <Label>Type de facture</Label>
              <Select
                value={formData.invoiceType}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, invoiceType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(invoiceTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Order ID */}
            <div className="space-y-2">
              <Label htmlFor="orderId">N° Commande</Label>
              <Input
                id="orderId"
                placeholder="ORD-XXXXX"
                value={formData.orderId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, orderId: e.target.value }))
                }
              />
            </div>

            {/* Issue Date */}
            <div className="space-y-2">
              <Label htmlFor="issueDate">Date d&apos;émission</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, issueDate: e.target.value }))
                }
              />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label>Conditions de paiement</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, paymentTerms: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Paiement immédiat</SelectItem>
                  <SelectItem value="NET30">Net 30 jours</SelectItem>
                  <SelectItem value="NET60">Net 60 jours</SelectItem>
                  <SelectItem value="NET90">Net 90 jours</SelectItem>
                  <SelectItem value="EOM">Fin de mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, currency: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DZD">DZD - Dinar Algérien</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seller ID */}
            <div className="space-y-2">
              <Label htmlFor="sellerId">ID Vendeur</Label>
              <Input
                id="sellerId"
                placeholder="Vendeur ID"
                value={formData.sellerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sellerId: e.target.value }))
                }
                className={errors.sellerId ? 'border-red-500' : ''}
              />
              {errors.sellerId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.sellerId}
                </p>
              )}
            </div>

            {/* Buyer ID */}
            <div className="space-y-2">
              <Label htmlFor="buyerId">ID Acheteur</Label>
              <Input
                id="buyerId"
                placeholder="Acheteur ID"
                value={formData.buyerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, buyerId: e.target.value }))
                }
                className={errors.buyerId ? 'border-red-500' : ''}
              />
              {errors.buyerId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.buyerId}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Articles de la facture
              </CardTitle>
              <CardDescription>Ajoutez les produits ou services à facturer</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errors.items && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />{errors.items}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Description</TableHead>
                  <TableHead className="w-[8%] text-center">Qté</TableHead>
                  <TableHead className="w-[12%] text-right">P.U.</TableHead>
                  <TableHead className="w-[8%] text-center">Remise %</TableHead>
                  <TableHead className="w-[10%] text-center">TVA</TableHead>
                  <TableHead className="w-[15%] text-right font-bold">Total TTC</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const calc = calculateLineItemTax(item)

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          placeholder="Description..."
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, 'description', e.target.value)
                          }
                          className={
                            errors[`item_${index}_desc`] ? 'border-red-500' : ''
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'quantity',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`text-center w-16 ${
                            errors[`item_${index}_qty`] ? 'border-red-500' : ''
                          }`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'unitPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`text-right w-20 ${
                            errors[`item_${index}_price`] ? 'border-red-500' : ''
                          }`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'discount',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="text-center w-14"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(item.tvaRate)}
                          onValueChange={(v) =>
                            updateItem(item.id, 'tvaRate', parseInt(v))
                          }
                        >
                          <SelectTrigger className="w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="19">19%</SelectItem>
                            <SelectItem value="9">9%</SelectItem>
                            <SelectItem value="0">Exon.</SelectItem>
                            <SelectItem value="-1">Exempt</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(calc.lineTotalWithTax, formData.currency as any)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length <= 1}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Global Discount & Totals */}
          <div className="mt-6 space-y-4">
            {/* Global Discount */}
            <div className="flex justify-end">
              <div className="w-full max-w-md flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Label className="whitespace-nowrap">Remise globale (%):</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                {globalDiscount > 0 && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-700">
                    -{formatCurrency(totals.discountAmount, formData.currency as any)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2 p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span>Sous-total HT:</span>
                  <span>{formatCurrency(totals.subtotal, formData.currency as any)}</span>
                </div>
                
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise totale:</span>
                    <span>-{formatCurrency(totals.discountAmount, formData.currency as any)}</span>
                  </div>
                )}
                
                <Separator />
                
                {/* TVA Breakdown */}
                {totals.tvaBreakdown.map((entry) => (
                  <div key={entry.rate} className="flex justify-between text-sm">
                    <span>TVA ({entry.rate === -1 ? 'Exonéré' : `${entry.rate}%`}):</span>
                    <span className={entry.tvaAmount > 0 ? 'text-blue-600' : ''}>
                      {formatCurrency(entry.tvaAmount, formData.currency as any)}
                    </span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total TTC:</span>
                  <span className="text-[#006233]">
                    {formatCurrency(totals.totalWithTax, formData.currency as any)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes client (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Notes visibles par le client..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Notes internes (cachées du client)</Label>
            <Textarea
              id="internalNotes"
              placeholder="Notes internes uniquement visibles par le vendeur..."
              value={formData.internalNotes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, internalNotes: e.target.value }))
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={handlePreview}
          className="flex-1"
        >
          <Eye className="mr-2 h-4 w-4" />
          Aperçu
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-[#006233] hover:bg-[#004d28]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Créer la facture
            </>
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de la Facture</DialogTitle>
            <DialogDescription>
              Vérifiez les détails avant de créer la facture
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {/* Preview content would go here */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-center text-gray-500">
                Aperçu de la facture...
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Type:</strong> {invoiceTypeLabels[formData.invoiceType]}</p>
                <p><strong>Articles:</strong> {items.length}</p>
                <p><strong>Total TTC:</strong> {formatCurrency(totals.totalWithTax, formData.currency as any)}</p>
                <p><strong>TVA:</strong> {formatCurrency(totals.totalTVA, formData.currency as any)}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Modifier
            </Button>
            <Button onClick={() => { setShowPreview(false); handleSubmit() }}>
              Confirmer et créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvoiceGenerator
