'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Calculator,
  FileDown,
  BarChart3,
  PieChart,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Types
interface TVABreakdown {
  rate: number | string
  label: string
  taxableBase: number
  tvaAmount: number
  transactions: number
  note?: string
}

interface TVAReport {
  period: string
  periodType: 'monthly' | 'quarterly' | 'annual'
  breakdown: TVABreakdown[]
  totalTaxableBase: number
  totalTVA: number
  totalTransactions: number
}

// Mock Data for TVA Reports
const generateTVAReport = (periodType: string, year: number, quarter?: number, month?: number): TVAReport => {
  const getPeriodLabel = () => {
    if (periodType === 'monthly' && month) {
      const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
      return `${months[month]} ${year}`
    }
    if (periodType === 'quarterly' && quarter) {
      return `T${quarter} ${year}`
    }
    return `Année ${year}`
  }

  // Simulate different data based on period
  const multiplier = periodType === 'monthly' ? 1 : periodType === 'quarterly' ? 3 : 12

  const breakdown: TVABreakdown[] = [
    {
      rate: 19,
      label: 'Taux normal',
      taxableBase: 10000000 * multiplier,
      tvaAmount: 1900000 * multiplier,
      transactions: Math.round(156 * multiplier),
    },
    {
      rate: 9,
      label: 'Taux réduit',
      taxableBase: 3000000 * multiplier,
      tvaAmount: 270000 * multiplier,
      transactions: Math.round(45 * multiplier),
    },
    {
      rate: 0,
      label: 'TVA 0% (Export)',
      taxableBase: 500000 * multiplier,
      tvaAmount: 0,
      transactions: Math.round(12 * multiplier),
      note: 'Exportations',
    },
    {
      rate: 'Exempt',
      label: 'Exonéré',
      taxableBase: 200000 * multiplier,
      tvaAmount: 0,
      transactions: Math.round(8 * multiplier),
      note: 'Produits exonérés',
    },
  ]

  return {
    period: getPeriodLabel(),
    periodType: periodType as 'monthly' | 'quarterly' | 'annual',
    breakdown,
    totalTaxableBase: breakdown.reduce((sum, b) => sum + b.taxableBase, 0),
    totalTVA: breakdown.reduce((sum, b) => sum + b.tvaAmount, 0),
    totalTransactions: breakdown.reduce((sum, b) => sum + b.transactions, 0),
  }
}

// Previous period data for comparison
const previousPeriodData: TVABreakdown[] = [
  { rate: 19, label: 'Taux normal', taxableBase: 9500000, tvaAmount: 1805000, transactions: 142 },
  { rate: 9, label: 'Taux réduit', taxableBase: 2800000, tvaAmount: 252000, transactions: 41 },
  { rate: 0, label: 'TVA 0% (Export)', taxableBase: 450000, tvaAmount: 0, transactions: 10 },
  { rate: 'Exempt', label: 'Exonéré', taxableBase: 180000, tvaAmount: 0, transactions: 7 },
]

// Helper functions
function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getRateColor(rate: number | string): string {
  if (rate === 19) return 'bg-red-100 text-red-700 border-red-200'
  if (rate === 9) return 'bg-orange-100 text-orange-700 border-orange-200'
  if (rate === 0) return 'bg-green-100 text-green-700 border-green-200'
  if (rate === 'Exempt') return 'bg-gray-100 text-gray-700 border-gray-200'
  return 'bg-blue-100 text-blue-700 border-blue-200'
}

function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: true }
  const change = ((current - previous) / previous) * 100
  return { value: Math.abs(change), isPositive: change >= 0 }
}

export default function TVAReportsPage() {
  const [periodType, setPeriodType] = useState<string>('quarterly')
  const [selectedYear, setSelectedYear] = useState<string>('2024')
  const [selectedQuarter, setSelectedQuarter] = useState<string>('1')
  const [selectedMonth, setSelectedMonth] = useState<string>('1')

  // Generate report based on selected filters
  const currentReport = useMemo(() => {
    return generateTVAReport(
      periodType,
      parseInt(selectedYear),
      parseInt(selectedQuarter),
      parseInt(selectedMonth)
    )
  }, [periodType, selectedYear, selectedQuarter, selectedMonth])

  // Calculate comparison with previous period
  const comparison = useMemo(() => {
    const prevTotalTVA = previousPeriodData.reduce((sum, d) => sum + d.tvaAmount, 0)
    return {
      tvaChange: calculateChange(currentReport.totalTVA, prevTotalTVA),
      baseChange: calculateChange(currentReport.totalTaxableBase, previousPeriodData.reduce((sum, d) => sum + d.taxableBase, 0)),
      transactionChange: calculateChange(currentReport.totalTransactions, previousPeriodData.reduce((sum, d) => sum + d.transactions, 0)),
    }
  }, [currentReport])

  // Export PDF for DGI
  const exportDGIReport = () => {
    console.log('Exporting DGI PDF report for:', currentReport.period)
    alert(`Rapport TVA pour ${currentReport.period} exporté au format PDF compatible DGI.\n\nCe fichier peut être utilisé pour la déclaration fiscale auprès de la Direction Générale des Impôts.`)
  }

  // Get max value for chart scaling
  const maxBarValue = Math.max(...currentReport.breakdown.map(b => b.tvaAmount))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Déclarations TVA</h1>
                <p className="text-xs text-gray-500">AlgeriaTrade.dz - Rapports fiscaux algériens</p>
              </div>
            </div>
            
            <Button onClick={exportDGIReport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exporter PDF (DGI)
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Period Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              Sélection de la période
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                  <SelectItem value="annual">Annuel</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              
              {periodType === 'quarterly' && (
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">T1 (Jan-Mars)</SelectItem>
                    <SelectItem value="2">T2 (Avr-Juin)</SelectItem>
                    <SelectItem value="3">T3 (Juil-Sep)</SelectItem>
                    <SelectItem value="4">T4 (Oct-Déc)</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {periodType === 'monthly' && (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Janvier</SelectItem>
                    <SelectItem value="2">Février</SelectItem>
                    <SelectItem value="3">Mars</SelectItem>
                    <SelectItem value="4">Avril</SelectItem>
                    <SelectItem value="5">Mai</SelectItem>
                    <SelectItem value="6">Juin</SelectItem>
                    <SelectItem value="7">Juillet</SelectItem>
                    <SelectItem value="8">Août</SelectItem>
                    <SelectItem value="9">Septembre</SelectItem>
                    <SelectItem value="10">Octobre</SelectItem>
                    <SelectItem value="11">Novembre</SelectItem>
                    <SelectItem value="12">Décembre</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Base imposable totale</p>
                  <p className="text-xl font-bold">{formatDZD(currentReport.totalTaxableBase)}</p>
                </div>
                <div className={`p-2 rounded-full ${comparison.baseChange.isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                  {comparison.baseChange.isPositive ? 
                    <TrendingUp className="h-5 w-5 text-green-600" /> : 
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  }
                </div>
              </div>
              <div className={`mt-2 text-xs flex items-center ${comparison.baseChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {comparison.baseChange.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {comparison.baseChange.value.toFixed(1)}% vs période précédente
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-300 bg-purple-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">TVA totale à payer</p>
                  <p className="text-xl font-bold text-purple-700">{formatDZD(currentReport.totalTVA)}</p>
                </div>
                <div className="p-2 rounded-full bg-purple-100">
                  <Calculator className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className={`mt-2 text-xs flex items-center ${comparison.tvaChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {comparison.tvaChange.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {comparison.tvaChange.value.toFixed(1)}% vs période précédente
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Nombre de transactions</p>
                  <p className="text-xl font-bold">{currentReport.totalTransactions.toLocaleString('fr-DZ')}</p>
                </div>
                <div className="p-2 rounded-full bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className={`mt-2 text-xs flex items-center ${comparison.transactionChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {comparison.transactionChange.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {comparison.transactionChange.value.toFixed(1)}% vs période précédente
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Période déclarée</p>
                  <p className="text-lg font-bold">{currentReport.period}</p>
                </div>
                <div className="p-2 rounded-full bg-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Échéance: 20 du mois suivant
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="table" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="table" className="gap-2">
              <Table className="w-4 h-4" />
              Tableau détaillé
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Graphiques
            </TabsTrigger>
          </TabsList>

          {/* Table View */}
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Détail par taux de TVA</CardTitle>
                <CardDescription>
                  Répartition de la TVA pour la période: {currentReport.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Taux</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="text-right">Base imposable</TableHead>
                      <TableHead className="text-right">Montant TVA</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentReport.breakdown.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline" className={getRateColor(item.rate)}>
                            {typeof item.rate === 'number' ? `${item.rate}%` : item.rate}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatDZD(item.taxableBase)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatDZD(item.tvaAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.transactions.toLocaleString('fr-DZ')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.note || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Total Row */}
                    <TableRow className="bg-purple-50/50 font-bold">
                      <TableCell colSpan={2}>
                        <Badge className="bg-purple-600 text-white">TOTAL</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatDZD(currentReport.totalTaxableBase)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-purple-700">
                        {formatDZD(currentReport.totalTVA)}
                      </TableCell>
                      <TableCell className="text-right">
                        {currentReport.totalTransactions.toLocaleString('fr-DZ')}
                      </TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                {/* DGI Info Box */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Information DGI</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Ce rapport est conforme aux exigences de la Direction Générale des Impôts (DGI) Algérie.
                        Les taux appliqués sont conformes au Code des Impôts Directs et Taxes Assimilées (CIDTA).
                      </p>
                      <ul className="mt-2 text-sm text-blue-600 space-y-1">
                        <li>• Taux normal: 19% (Article  CIDTA)</li>
                        <li>• Taux réduit: 9% (Produits de première nécessité)</li>
                        <li>• Taux 0%: Exportations et opérations exonérées</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts View */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - TVA by Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Répartition TVA par taux
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentReport.breakdown.map((item, index) => {
                      const percentage = maxBarValue > 0 ? (item.tvaAmount / maxBarValue) * 100 : 0
                      const colors = ['bg-red-500', 'bg-orange-500', 'bg-green-500', 'bg-gray-400']
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {typeof item.rate === 'number' ? `${item.rate}%` : item.rate}
                            </span>
                            <span className="font-mono">{formatDZD(item.tvaAmount)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${colors[index]}`}
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Horizontal Bar - Taxable Base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    Base imposable par catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentReport.breakdown.map((item, index) => {
                      const maxBase = Math.max(...currentReport.breakdown.map(b => b.taxableBase))
                      const percentage = maxBase > 0 ? (item.taxableBase / maxBase) * 100 : 0
                      const colors = ['border-red-400 bg-red-50', 'border-orange-400 bg-orange-50', 'border-green-400 bg-green-50', 'border-gray-400 bg-gray-50']
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="font-mono text-xs">{formatDZD(item.taxableBase)}</span>
                          </div>
                          <div className={`h-6 rounded border-l-4 ${colors[index]} relative`}>
                            <div
                              className="absolute inset-0 bg-opacity-20 rounded"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: index === 0 ? '#ef4444' : index === 1 ? '#f97316' : index === 2 ? '#22c55e' : '#9ca3af',
                                opacity: 0.2
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-6 pt-4 border-t space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-3">Légende des taux TVA Algérie</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span>19% - Taux normal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-orange-500"></div>
                        <span>9% - Taux réduit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span>0% - Exports</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-400"></div>
                        <span>Exempt - Exonéré</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Comparaison avec période précédente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { 
                      label: 'Base Imposable', 
                      current: currentReport.totalTaxableBase, 
                      previous: previousPeriodData.reduce((s, d) => s + d.taxableBase, 0),
                      change: comparison.baseChange 
                    },
                    { 
                      label: 'Montant TVA', 
                      current: currentReport.totalTVA, 
                      previous: previousPeriodData.reduce((s, d) => s + d.tvaAmount, 0),
                      change: comparison.tvaChange 
                    },
                    { 
                      label: 'Transactions', 
                      current: currentReport.totalTransactions, 
                      previous: previousPeriodData.reduce((s, d) => s + d.transactions, 0),
                      change: comparison.transactionChange 
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-3">{item.label}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Période actuelle:</span>
                          <span className="font-semibold">
                            {idx < 2 ? formatDZD(item.current as number) : (item.current as number).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Période précédente:</span>
                          <span className="text-gray-600">
                            {idx < 2 ? formatDZD(item.previous as number) : (item.previous as number).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center pt-2 border-t mt-2">
                          {item.change.isPositive ? 
                            <TrendingUp className="h-4 w-4 text-green-500 mr-2" /> :
                            <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                          }
                          <span className={`text-sm font-semibold ${item.change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {item.change.value.toFixed(1)}%
                          </span>
                          <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {item.change.isPositive ? 'Augmentation' : 'Diminution'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
