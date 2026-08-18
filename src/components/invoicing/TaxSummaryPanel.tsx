'use client'

import React, { useState } from 'react'
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/invoicing/calculator'

// Types
interface TVABreakdownEntry {
  rate: number
  taxableBase: number
  tvaAmount: number
  invoiceCount?: number
}

interface TaxSummaryData {
  period: {
    from: string
    to: string
    label: string
  }
  summary: {
    totalInvoices: number
    issuedCount: number
    paidCount: number
    partialCount: number
    overdueCount: number
    totalSubtotal: number
    totalTVA: number
    totalWithTax: number
    totalAmountPaid: number
    totalOutstanding: number
  }
  tvaBreakdown: TVABreakdownEntry[]
  comparison: {
    previousPeriodTVA: number
    changePercent: number
    changeDirection: 'increase' | 'decrease'
  }
  accountantSummary: {
    declarationReference: string
    taxableOperationsTotal: number
    tvacollectable: number
    currency: string
  }
}

interface TaxSummaryPanelProps {
  data?: TaxSummaryData
  isLoading?: boolean
  onRefresh?: () => void
  onExport?: (format: 'csv' | 'excel') => void
  onPeriodChange?: (period: { from: string; to: string }) => void
  compact?: boolean
}

export function TaxSummaryPanel({
  data,
  isLoading = false,
  onRefresh,
  onExport,
  onPeriodChange,
  compact = false,
}: TaxSummaryPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    
    if (onPeriodChange) {
      const now = new Date()
      let from: Date
      let to: Date

      switch (value) {
        case 'current-month':
          from = new Date(now.getFullYear(), now.getMonth(), 1)
          to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'last-month':
          from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          to = new Date(now.getFullYear(), now.getMonth(), 0)
          break
        case 'current-quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3
          from = new Date(now.getFullYear(), quarterStart, 1)
          to = new Date(now.getFullYear(), quarterStart + 3, 0)
          break
        case 'current-year':
          from = new Date(now.getFullYear(), 0, 1)
          to = now
          break
        default:
          from = new Date(now.getFullYear(), now.getMonth(), 1)
          to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }

      onPeriodChange({ from: from.toISOString(), to: to.toISOString() })
    }
  }

  // Default data for display when no data provided
  const displayData: TaxSummaryData = data || {
    period: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      to: new Date().toISOString(),
      label: `Mois en cours (${new Date().toLocaleDateString('fr-DZ', { month: 'long', year: 'numeric' })})`,
    },
    summary: {
      totalInvoices: 0,
      issuedCount: 0,
      paidCount: 0,
      partialCount: 0,
      overdueCount: 0,
      totalSubtotal: 0,
      totalTVA: 0,
      totalWithTax: 0,
      totalAmountPaid: 0,
      totalOutstanding: 0,
    },
    tvaBreakdown: [],
    comparison: {
      previousPeriodTVA: 0,
      changePercent: 0,
      changeDirection: 'increase',
    },
    accountantSummary: {
      declarationReference: `TVA-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      taxableOperationsTotal: 0,
      tvacollectable: 0,
      currency: 'DZD',
    },
  }

  const getTVARateLabel = (rate: number): string => {
    switch (rate) {
      case 19: return 'Taux normal (19%)'
      case 9: return 'Taux réduit (9%)'
      case 0: return 'Taux zéro (0%) - Exports'
      case -1: return 'Exonéré'
      default: return `${rate}%`
    }
  }

  const getTVARateColor = (rate: number): string => {
    switch (rate) {
      case 19: return 'bg-blue-100 text-blue-700 border-blue-200'
      case 9: return 'bg-green-100 text-green-700 border-green-200'
      case 0: return 'bg-gray-100 text-gray-700 border-gray-200'
      case -1: return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#006233]" />
              Résumé TVA
            </h3>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-xs text-blue-600">Total TVA</p>
              <p className="font-bold text-blue-700">
                {formatCurrency(displayData.summary.totalTVA, displayData.accountantSummary.currency as any)}
              </p>
            </div>
            <div className="p-2 bg-green-50 rounded">
              <p className="text-xs text-green-600">Base imposable</p>
              <p className="font-bold text-green-700">
                {formatCurrency(displayData.summary.totalSubtotal, displayData.accountantSummary.currency as any)}
              </p>
            </div>
          </div>

          {/* Mini TVA Breakdown */}
          {displayData.tvaBreakdown.length > 0 && (
            <div className="mt-3 space-y-1">
              {displayData.tvaBreakdown.map((entry) => (
                <div key={entry.rate} className="flex justify-between text-xs">
                  <span>{entry.rate === -1 ? 'Exon.' : `${entry.rate}%`}</span>
                  <span>{formatCurrency(entry.tvaAmount, displayData.accountantSummary.currency as any)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#006233]/10 rounded-lg">
            <Calculator className="h-6 w-6 text-[#006233]" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Résumé TVA</h2>
            <p className="text-sm text-gray-500">
              Analyse de la Taxe sur la Valeur Ajoutée
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Ce mois</SelectItem>
              <SelectItem value="last-month">Mois dernier</SelectItem>
              <SelectItem value="current-quarter">Ce trimestre</SelectItem>
              <SelectItem value="current-year">Cette année</SelectItem>
            </SelectContent>
          </Select>

          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          )}

          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport('excel')}>
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Total Factures</p>
            <p className="text-2xl font-bold">{displayData.summary.totalInvoices}</p>
            <p className="text-xs text-gray-400 mt-1">
              {displayData.summary.issuedCount} émises • {displayData.summary.paidCount} payées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">Chiffre d&apos;affaires HT</p>
            <p className="text-2xl font-bold">
              {formatCurrency(displayData.summary.totalSubtotal, displayData.accountantSummary.currency as any)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600 uppercase font-medium">Total TVA Collectée</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(displayData.summary.totalTVA, displayData.accountantSummary.currency as any)}
            </p>
            {displayData.comparison.changePercent !== 0 && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                displayData.comparison.changeDirection === 'increase' ? 'text-red-600' : 'text-green-600'
              }`}>
                {displayData.comparison.changeDirection === 'increase' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(displayData.comparison.changePercent)}% vs période précédente
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={displayData.summary.overdueCount > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase">En retard</p>
            <p className={`text-2xl font-bold ${displayData.summary.overdueCount > 0 ? 'text-red-600' : ''}`}>
              {displayData.summary.overdueCount}
            </p>
            {displayData.summary.totalOutstanding > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {formatCurrency(displayData.summary.totalOutstanding, displayData.accountantSummary.currency as any)} impayé
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TVA Breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            Détail TVA par taux
          </CardTitle>
          <CardDescription>
            Répartition de la TVA selon les différents taux applicables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayData.tvaBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Aucune donnée TVA pour cette période</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayData.tvaBreakdown.map((entry) => (
                  <div
                    key={entry.rate}
                    className={`p-4 rounded-lg border ${getTVARateColor(entry.rate)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold">
                        {entry.rate === -1 ? 'Exon.' : `${entry.rate}%`}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {entry.invoiceCount || 0} factures
                      </Badge>
                    </div>
                    <p className="text-xs opacity-75 mb-2">{getTVARateLabel(entry.rate)}</p>
                    <Separator className="my-2 opacity-30" />
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Base imposable:</span>
                        <span className="font-medium">
                          {formatCurrency(entry.taxableBase, displayData.accountantSummary.currency as any)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Montant TVA:</span>
                        <span>
                          {formatCurrency(entry.tvaAmount, displayData.accountantSummary.currency as any)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total TVA:</span>
                  <span className="text-xl font-bold text-[#006233]">
                    {formatCurrency(displayData.summary.totalTVA, displayData.accountantSummary.currency as any)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Accountant Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            Résumé pour déclaration fiscale
          </CardTitle>
          <CardDescription>
            Informations préparées pour votre expert-comptable ou la DGI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-600 uppercase tracking-wide">
                Informations de déclaration
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Référence:</span>
                  <code className="font-mono bg-white px-2 py-1 rounded">
                    {displayData.accountantSummary.declarationReference}
                  </code>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Période:</span>
                  <span>{displayData.period.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Devise:</span>
                  <span>{displayData.accountantSummary.currency}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-[#006233]/5 rounded-lg border border-[#006233]/20">
              <h4 className="font-medium text-sm text-[#006233] uppercase tracking-wide">
                Montants à déclarer
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Opérations imposables:</span>
                  <span className="font-semibold">
                    {formatCurrency(displayData.accountantSummary.taxableOperationsTotal, displayData.accountantSummary.currency as any)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA collectible:</span>
                  <span className="font-semibold text-[#006233]">
                    {formatCurrency(displayData.accountantSummary.tvacollectable, displayData.accountantSummary.currency as any)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <Info className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Note importante</p>
              <p>
                Ce résumé est fourni à titre indicatif. Vérifiez toujours les montants 
                avec votre comptabilité avant toute déclaration fiscale. 
                Conservez toutes les factures pendant 10 ans conformément à la réglementation algérienne.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TaxSummaryPanel
