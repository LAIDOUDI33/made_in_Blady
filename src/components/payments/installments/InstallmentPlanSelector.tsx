'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Calculator, 
  CheckCircle2, 
  Info, 
  Star,
  TrendingDown,
  AlertCircle
} from 'lucide-react'
import {
  getAvailablePlans,
  getRecommendedPlan,
  estimateMonthlyPayment,
  formatDZD,
  formatPercent,
  type DPAPlan
} from '@/lib/payments/installments/config'
import {
  calculateInstallmentSchedule,
  type CalculationResult
} from '@/lib/payments/installments/calculator'

interface InstallmentPlanSelectorProps {
  orderAmount: number
  buyerProfile?: {
    monthlyRevenue?: number
    creditScore?: number
  }
  onSelectPlan: (plan: DPAPlan, calculation: CalculationResult) => void
  selectedPlanId?: string
  disabled?: boolean
}

export function InstallmentPlanSelector({
  orderAmount,
  buyerProfile,
  onSelectPlan,
  selectedPlanId,
  disabled = false
}: InstallmentPlanSelectorProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  
  const availablePlans = useMemo(() => getAvailablePlans(orderAmount), [orderAmount])
  const recommendedPlan = useMemo(
    () => getRecommendedPlan(orderAmount, buyerProfile),
    [orderAmount, buyerProfile]
  )
  
  const calculations = useMemo(() => {
    const calcs = new Map<string, CalculationResult>()
    availablePlans.forEach(plan => {
      calcs.set(plan.id, calculateInstallmentSchedule(orderAmount, plan))
    })
    return calcs
  }, [orderAmount, availablePlans])

  if (availablePlans.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Aucun plan disponible</p>
              <p className="text-sm text-amber-600">
                Le montant minimum pour un paiement différé est de{' '}
                {formatDZD(500000)}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Plans de Paiement Différé
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Montant de la commande:{' '}
            <span className="font-semibold text-foreground">{formatDZD(orderAmount)}</span>
          </p>
        </div>
        {recommendedPlan && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <Star className="h-3 w-3 mr-1" />
            Recommandé
          </Badge>
        )}
      </div>

      {/* Plan Cards Grid */}
      <div className={`grid gap-4 ${availablePlans.length <= 2 ? 'md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {availablePlans.map((plan) => {
          const calculation = calculations.get(plan)!
          const isRecommended = recommendedPlan?.id === plan.id
          const isSelected = selectedPlanId === plan.id
          const isHovered = hoveredPlan === plan.id

          return (
            <Card
              key={plan.id}
              className={`
                cursor-pointer transition-all duration-200 relative overflow-hidden
                ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}
                ${isRecommended && !isSelected ? 'ring-1 ring-green-300' : ''}
                ${isHovered && !isSelected ? 'shadow-md -translate-y-0.5' : ''}
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              onClick={() => !disabled && onSelectPlan(plan, calculation)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Recommandé
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Monthly Payment */}
                <div className="text-center py-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Mensualité</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatDZD(calculation.monthlyPayment)}
                  </p>
                </div>

                {/* Key Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée</span>
                    <span className="font-medium">{plan.months} mois</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taux d&apos;intérêt</span>
                    <span className="font-medium text-orange-600">
                      {formatPercent(plan.interestRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais admin</span>
                    <span className="font-medium">{formatDZD(plan.adminFee)}</span>
                  </div>
                </div>

                {/* Total Cost */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total à payer</span>
                    <span className="font-bold text-lg">
                      {formatDZD(calculation.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <TrendingDown className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                      +{formatDZD(calculation.totalInterest + calculation.adminFee)} vs comptant
                    </span>
                  </div>
                </div>

                {/* Select Button */}
                <Button
                  className="w-full"
                  variant={isSelected ? 'default' : 'outline'}
                  disabled={disabled}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Sélectionné
                    </>
                  ) : (
                    'Choisir ce plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Comparaison Détaillée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Mensualité</TableHead>
                <TableHead className="text-right">Intérêt Total</TableHead>
                <TableHead className="text-right">Frais Admin</TableHead>
                <TableHead className="text-right">Coût Total</TableHead>
                <TableHead className="text-right">Taux Effectif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availablePlans.map((plan) => {
                const calc = calculations.get(plan)!
                const isRecommended = recommendedPlan?.id === plan.id
                
                return (
                  <TableRow
                    key={plan.id}
                    className={`
                      cursor-pointer transition-colors
                      ${selectedPlanId === plan.id ? 'bg-primary/5' : ''}
                      ${isRecommended ? 'bg-green-50' : ''}
                    `}
                    onClick={() => !disabled && onSelectPlan(plan, calc)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {isRecommended && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {selectedPlanId === plan.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatDZD(calc.monthlyPayment)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-orange-600">
                      +{formatDZD(calc.totalInterest)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatDZD(calc.adminFee)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatDZD(calc.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercent(calc.effectiveAPR)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4">
          <div className="flex gap-3 text-sm text-blue-800">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Information Importante</p>
              <ul className="space-y-1 text-blue-700 list-disc list-inside">
                <li>Tous les prix sont en Dinar Algérien (DZD)</li>
                <li>Le premier paiement est dû 30 jours après la confirmation</li>
                <li>Un délai de grâce de 5 jours est appliqué avant pénalités</li>
                <li>Une réduction est appliquée en cas de règlement anticipé</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InstallmentPlanSelector
