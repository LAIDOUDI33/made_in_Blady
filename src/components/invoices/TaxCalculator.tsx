'use client'

import React, { useState, useMemo } from 'react'
import {
  Calculator,
  Info,
  Percent,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TVARate, InvoiceLineItem } from '@/lib/invoices'
import {
  calculateTVA,
  calculateTSS,
  calculateLineItem,
  calculateInvoiceTotals,
  ALGERIAN_TAX_RATES,
} from '@/lib/invoices'
import { formatDZD } from '@/lib/payments/utils'

interface TaxCalculatorProps {
  onApplyCalculation?: (items: InvoiceLineItem[]) => void
}

export function TaxCalculator({ onApplyCalculation }: TaxCalculatorProps) {
  const [amount, setAmount] = useState(100000)
  const [selectedRate, setSelectedRate] = useState<TVARate>(19)
  const [discount, setDiscount] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [description, setDescription] = useState('Produit / Service')
  const [isExport, setIsExport] = useState(false)
  const [hasExemption, setHasExemption] = useState(false)

  // Calculate based on current inputs
  const calculation = useMemo(() => {
    const item: InvoiceLineItem = {
      description,
      quantity,
      unitPrice: amount / quantity,
      discount,
      taxRate: isExport || hasExemption ? 0 : selectedRate,
    }

    return calculateLineItem(item)
  }, [amount, selectedRate, discount, quantity, description, isExport, hasExemption])

  // Effective rate display
  const effectiveRate = isExport || hasExemption ? 0 : selectedRate

  // TVA breakdown for different rates
  const tvaBreakdown = useMemo(() => {
    if (isExport || hasExemption) {
      return [
        { rate: 0 as TVARate, base: calculation.taxableAmount, amount: 0 },
      ]
    }

    return [
      { rate: selectedRate as TVARate, base: calculation.taxableAmount, amount: calculation.taxAmount },
    ]
  }, [selectedRate, calculation, isExport, hasExemption])

  const handleApply = () => {
    if (onApplyCalculation) {
      onApplyCalculation([{
        description,
        quantity,
        unitPrice: amount / quantity,
        discount,
        taxRate: effectiveRate as TVARate,
      }])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#006233]/10 rounded-lg">
          <Calculator className="h-6 w-6 text-[#006233]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Calculateur TVA Algérie</h3>
          <p className="text-sm text-gray-500">
            Calculez la Taxe sur la Valeur Ajoutée selon les taux algériens
          </p>
        </div>
      </div>

      {/* Main Calculator */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Paramètres de calcul</CardTitle>
          <CardDescription>Entrez le montant et sélectionnez le taux applicable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant HT (DZD)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="text-lg font-mono pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                DZD
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-32"
            />
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="discount">Remise (%)</Label>
              <span className="text-sm font-medium text-orange-600">
                -{formatDZD(calculation.discountAmount)}
              </span>
            </div>
            <Slider
              value={[discount]}
              onValueChange={(v) => setDiscount(v[0])}
              min={0}
              max={50}
              step={1}
            />
          </div>

          {/* TVA Rate Selection */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label className="font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Taux de TVA
            </Label>

            {/* Export/Exemption toggles */}
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                <input
                  type="checkbox"
                  checked={isExport}
                  onChange={(e) => setIsExport(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="font-medium text-sm">Exportation</span>
                  <p className="text-xs text-gray-500">TVA exonérée pour les exportations</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                <input
                  type="checkbox"
                  checked={hasExemption}
                  onChange={(e) => setHasExemption(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="font-medium text-sm">Exonération fiscale</span>
                  <p className="text-xs text-gray-500">Certificat d'exonération requis</p>
                </div>
              </label>
            </div>

            {!isExport && !hasExemption && (
              <RadioGroup
                value={String(selectedRate)}
                onValueChange={(v) => setSelectedRate(Number(v) as TVARate)}
              >
                <div className="grid grid-cols-3 gap-3">
                  <label
                    htmlFor="rate-19"
                    className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                      selectedRate === 19
                        ? 'border-[#006233] bg-[#006233]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="19" id="rate-19" className="sr-only" />
                    <div className="text-2xl font-bold text-[#006233]">19%</div>
                    <div className="text-xs text-gray-600 mt-1">Standard</div>
                  </label>

                  <label
                    htmlFor="rate-9"
                    className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                      selectedRate === 9
                        ? 'border-[#006233] bg-[#006233]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="9" id="rate-9" className="sr-only" />
                    <div className="text-2xl font-bold text-green-600">9%</div>
                    <div className="text-xs text-gray-600 mt-1">Réduit</div>
                  </label>

                  <label
                    htmlFor="rate-0"
                    className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                      selectedRate === 0
                        ? 'border-[#006233] bg-[#006233]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="0" id="rate-0" className="sr-only" />
                    <div className="text-2xl font-bold text-gray-500">0%</div>
                    <div className="text-xs text-gray-600 mt-1">Exonéré</div>
                  </label>
                </div>
              </RadioGroup>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-[#006233] overflow-hidden">
        <div className="bg-gradient-to-r from-[#006233] to-[#008040] px-6 py-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Résultat du calcul
          </h3>
        </div>
        <CardContent className="p-6 space-y-4">
          {/* Main Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Montant HT</p>
              <p className="text-xl font-bold">{formatDZD(calculation.subtotal)}</p>
            </div>
            
            {calculation.discountAmount > 0 && (
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Remise</p>
                <p className="text-xl font-bold text-orange-600">
                  -{formatDZD(calculation.discountAmount)}
                </p>
              </div>
            )}

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">
                TVA ({effectiveRate}%)
              </p>
              <p className="text-xl font-bold text-blue-600">
                {formatDZD(calculation.taxAmount)}
              </p>
            </div>

            <div className="text-center p-4 bg-[#006233]/10 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Total TTC</p>
              <p className="text-xl font-bold text-[#006233]">
                {formatDZD(calculation.lineTotal)}
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Détail du calcul</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant brut:</span>
                <span>{formatDZD(calculation.subtotal)}</span>
              </div>
              
              {calculation.discountAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Remise ({discount}%):</span>
                  <span>-{formatDZD(calculation.discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Base imposable:</span>
                <span>{formatDZD(calculation.taxableAmount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Taux TVA:</span>
                <Badge variant="outline">{effectiveRate}%</Badge>
              </div>
              
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>TVA:</span>
                <span className="text-blue-600">{formatDZD(calculation.taxAmount)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total TTC:</span>
                <span className="text-[#006233]">{formatDZD(calculation.lineTotal)}</span>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          {onApplyCalculation && (
            <Button
              onClick={handleApply}
              className="w-full bg-[#006233] hover:bg-[#004d28]"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Appliquer à la facture
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Information Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-2">
          <p className="font-medium">Information sur les taux TVA en Algérie</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>19% (Taux normal):</strong> Applicable à la plupart des biens et services</li>
            <li><strong>9% (Taux réduit):</strong> Produits de première nécessité, certains services</li>
            <li><strong>0% (Exonération):</strong> Exportations, produits agricoles, médicaments</li>
          </ul>
          <p className="text-xs mt-2 text-blue-600">
            Les taux sont conformes au Code des Impôts Directs et Taxes Algérien.
            Consultez un expert-comptable pour votre situation spécifique.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TaxCalculator
