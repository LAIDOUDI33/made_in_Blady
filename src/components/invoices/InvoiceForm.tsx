'use client'

import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  Calculator,
  FileText,
  AlertCircle,
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
import type { InvoiceLineItem, TVARate, InvoiceType } from '@/lib/invoices'
import { calculateLineItem, calculateInvoiceTotals, formatDZD } from '@/lib/invoices'

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void
  isSubmitting?: boolean
  defaultSellerId?: string
  defaultBuyerId?: string
  defaultOrderId?: string
}

export interface InvoiceFormData {
  invoiceType: InvoiceType
  orderId: string
  sellerId: string
  buyerId: string
  issueDate: string
  paymentTerms: string
  notes: string
  termsConditions: string
  items: InvoiceLineItemInput[]
}

interface InvoiceLineItemInput {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: TVARate
}

const emptyItem = (): InvoiceLineItemInput => ({
  id: Math.random().toString(36).substr(2, 9),
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  taxRate: 19,
})

export function InvoiceForm({
  onSubmit,
  isSubmitting = false,
  defaultOrderId = '',
  defaultSellerId = '',
  defaultBuyerId = '',
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceType: 'COMMERCIAL',
    orderId: defaultOrderId,
    sellerId: defaultSellerId,
    buyerId: defaultBuyerId,
    issueDate: new Date().toISOString().split('T')[0],
    paymentTerms: 'Net 30',
    notes: '',
    termsConditions: '',
    items: [emptyItem()],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate totals whenever items change
  const totals = calculateInvoiceTotals(formData.items)

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, emptyItem()],
    })
  }

  const removeItem = (id: string) => {
    if (formData.items.length <= 1) return
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== id),
    })
  }

  const updateItem = (id: string, field: keyof InvoiceLineItemInput, value: any) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.orderId) newErrors.orderId = 'ID de commande requis'
    if (!formData.sellerId) newErrors.sellerId = 'ID vendeur requis'
    if (!formData.buyerId) newErrors.buyerId = 'ID acheteur requis'

    formData.items.forEach((item, index) => {
      if (!item.description) {
        newErrors[`item_${index}_desc`] = 'Description requise'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_qty`] = 'Quantité invalide'
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_price`] = 'Prix invalide'
      }
    })

    if (formData.items.length === 0) {
      newErrors.items = 'Au moins un article est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
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
              <Label htmlFor="invoiceType">Type de facture *</Label>
              <Select
                value={formData.invoiceType}
                onValueChange={(v) =>
                  setFormData({ ...formData, invoiceType: v as InvoiceType })
                }
              >
                <SelectTrigger id="invoiceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMERCIAL">Facture Commerciale</SelectItem>
                  <SelectItem value="PROFORMA">Facture Proforma</SelectItem>
                  <SelectItem value="DOWN_PAYMENT">Facture d'Acompte</SelectItem>
                  <SelectItem value="INSTALLMENT">Facture d'Échéance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order ID */}
            <div className="space-y-2">
              <Label htmlFor="orderId">N° Commande *</Label>
              <Input
                id="orderId"
                placeholder="ORD-XXXXX"
                value={formData.orderId}
                onChange={(e) =>
                  setFormData({ ...formData, orderId: e.target.value })
                }
                className={errors.orderId ? 'border-red-500' : ''}
              />
              {errors.orderId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.orderId}
                </p>
              )}
            </div>

            {/* Issue Date */}
            <div className="space-y-2">
              <Label htmlFor="issueDate">Date d'émission *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
              />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Conditions de paiement</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(v) =>
                  setFormData({ ...formData, paymentTerms: v })
                }
              >
                <SelectTrigger id="paymentTerms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 15">Net 15 jours</SelectItem>
                  <SelectItem value="Net 30">Net 30 jours</SelectItem>
                  <SelectItem value="Net 60">Net 60 jours</SelectItem>
                  <SelectItem value="Net 90">Net 90 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seller ID */}
            <div className="space-y-2">
              <Label htmlFor="sellerId">ID Vendeur *</Label>
              <Input
                id="sellerId"
                placeholder="Vendeur ID"
                value={formData.sellerId}
                onChange={(e) =>
                  setFormData({ ...formData, sellerId: e.target.value })
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
              <Label htmlFor="buyerId">ID Acheteur *</Label>
              <Input
                id="buyerId"
                placeholder="Acheteur ID"
                value={formData.buyerId}
                onChange={(e) =>
                  setFormData({ ...formData, buyerId: e.target.value })
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Articles de la facture
              </CardTitle>
              <CardDescription>Ajoutez les produits ou services à facturer</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errors.items && (
            <p className="text-sm text-red-600 mb-4 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />{errors.items}
            </p>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="w-[10%] text-center">Qté</TableHead>
                  <TableHead className="w-[15%] text-right">P.U.</TableHead>
                  <TableHead className="w-[10%] text-center">Remise %</TableHead>
                  <TableHead className="w-[12%] text-center">TVA</TableHead>
                  <TableHead className="w-[13%] text-right font-bold">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => {
                  const calc = calculateLineItem(item as any)
                  
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
                          className={`text-center w-20 ${
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
                          className={`text-right w-24 ${
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
                          className="text-center w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(item.taxRate)}
                          onValueChange={(v) =>
                            updateItem(item.id, 'taxRate', parseInt(v))
                          }
                        >
                          <SelectTrigger className="w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="19">19%</SelectItem>
                            <SelectItem value="9">9%</SelectItem>
                            <SelectItem value="0">Exon.</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatDZD(calc.lineTotal)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={formData.items.length <= 1}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

          {/* Totals Summary */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Sous-total HT:</span>
                <span>{formatDZD(totals.subtotal)}</span>
              </div>
              {totals.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise totale:</span>
                  <span>-{formatDZD(totals.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2">
                <span>TVA ({totals.totalTVA > 0 ? 'variable' : '0%'}):</span>
                <span>{formatDZD(totals.totalTVA)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total TTC:</span>
                <span className="text-[#006233]">{formatDZD(totals.totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Notes additionnelles pour cette facture..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="termsConditions">Conditions générales (optionnel)</Label>
            <Textarea
              id="termsConditions"
              placeholder="Conditions spécifiques à cette facture..."
              value={formData.termsConditions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  termsConditions: e.target.value,
                })
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-[#006233] hover:bg-[#004d28]"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Création en cours...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-5 w-5" />
            Créer la facture
          </>
        )}
      </Button>
    </form>
  )
}

export default InvoiceForm
