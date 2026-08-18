'use client'

import React, { useState, useMemo } from 'react'
import {
  Calendar,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  CreditCard,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  calculateInstallmentPlan,
  isPlanTypeEligible,
  PLAN_TYPE_CONFIG,
  type InstallmentPlanType,
  type InstallmentCalculationResult,
} from '@/lib/payments/installments'
import { formatDZD } from '@/lib/payments/utils'

interface InstallmentPlanSelectorProps {
  orderAmount: number
  selectedPlan?: InstallmentPlanType | null
  onSelect: (plan: InstallmentPlanType, calculation: InstallmentCalculationResult) => void
  disabled?: boolean
}

export function InstallmentPlanSelector({
  orderAmount,
  selectedPlan,
  onSelect,
  disabled = false,
}: InstallmentPlanSelectorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(30)
  const [interestRate, setInterestRate] = useState(0)
  const [hoveredPlan, setHoveredPlan] = useState<InstallmentPlanType | null>(null)

  // Calculate for each plan type
  const planCalculations = useMemo(() => {
    const calculations: Record<InstallmentPlanType, InstallmentCalculationResult | null> = {} as any
    
    const planTypes: InstallmentPlanType[] = [
      'DPA_30_DAYS',
      'DPA_60_DAYS',
      'DPA_90_DAYS',
      'INSTALLMENT_3X',
      'INSTALLMENT_6X',
      'INSTALLMENT_12X',
    ]

    for (const type of planTypes) {
      const eligible = isPlanTypeEligible(type, orderAmount)
      if (eligible.eligible) {
        try {
          calculations[type] = calculateInstallmentPlan(orderAmount, type, interestRate, {
            downPaymentPercent: type.startsWith('DPA_') ? 0 : downPaymentPercent,
          })
        } catch {
          calculations[type] = null
        }
      } else {
        calculations[type] = null
      }
    }

    return calculations
  }, [orderAmount, downPaymentPercent, interestRate])

  const handleSelectPlan = (type: InstallmentPlanType) => {
    if (disabled) return
    
    const calculation = planCalculations[type]
    if (calculation) {
      onSelect(type, calculation)
    }
  }

  const getSelectedCalculation = (): InstallmentCalculationResult | null => {
    if (!selectedPlan) return null
    return planCalculations[selectedPlan]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Plan de Paiement Différé (DPA)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Choisissez un plan adapté à votre commande de {formatDZD(orderAmount)}
          </p>
        </div>
        <Badge variant={selectedPlan ? "default" : "secondary"} className="text-sm">
          {selectedPlan ? 'Plan sélectionné' : 'Aucun plan'}
        </Badge>
      </div>

      {/* Options Panel */}
      {!selectedPlan && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Options de calcul
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Down Payment Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Acompte initial</Label>
                <span className="text-sm font-bold text-[#006233]">{downPaymentPercent}%</span>
              </div>
              <Slider
                value={[downPaymentPercent]}
                onValueChange={(value) => setDownPaymentPercent(value[0])}
                min={0}
                max={50}
                step={5}
                disabled={disabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Acompte: {formatDZD((orderAmount * downPaymentPercent) / 100)}
              </p>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Taux d'intérêt annuel (%)</Label>
              <Select value={String(interestRate)} onValueChange={(v) => setInterestRate(Number(v))} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Sans intérêts)</SelectItem>
                  <SelectItem value="3">3% annuel</SelectItem>
                  <SelectItem value="5">5% annuel</SelectItem>
                  <SelectItem value="8">8% annuel</SelectItem>
                  <SelectItem value="10">10% annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Type Cards Grid */}
      <RadioGroup
        value={selectedPlan ?? ''}
        onValueChange={(v) => handleSelectPlan(v as InstallmentPlanType)}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {(Object.keys(PLAN_TYPE_CONFIG) as InstallmentPlanType[])
          .filter((type) => type !== 'CUSTOM')
          .map((type) => {
            const config = PLAN_TYPE_CONFIG[type]
            const calculation = planCalculations[type]
            const eligibility = isPlanTypeEligible(type, orderAmount)
            const isSelected = selectedPlan === type
            const isHovered = hoveredPlan === type

            return (
              <div key={type}>
                <Label
                  htmlFor={`plan-${type}`}
                  className={`cursor-pointer block ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onMouseEnter={() => setHoveredPlan(type)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  <Card
                    className={`h-full transition-all duration-200 border-2 ${
                      isSelected
                        ? 'border-[#006233] shadow-lg ring-2 ring-[#006233]/20'
                        : isHovered && !disabled
                        ? 'border-gray-300 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            id={`plan-${type}`}
                            value={type}
                            disabled={disabled || !eligibility.eligible}
                          />
                          <div>
                            <CardTitle className="text-base">{config.label}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {config.labelAr}
                            </CardDescription>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-[#006233]" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Description */}
                      <p className="text-xs text-gray-600">{config.description}</p>

                      {/* Eligibility Status */}
                      {!eligibility.eligible ? (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-600">{eligibility.reason}</span>
                        </div>
                      ) : calculation ? (
                        <>
                          {/* Calculation Summary */}
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {calculation.downPayment > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Acompte:</span>
                                <span className="font-medium">{formatDZD(calculation.downPayment)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">
                                {type.startsWith('DPA_') ? 'Paiement différé:' : 'Mensualité:'}
                              </span>
                              <span className="font-bold text-[#006233]">
                                {formatDZD(calculation.installmentAmount)}
                              </span>
                            </div>
                            {calculation.totalInterest > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Intérêts totaux:</span>
                                <span className="font-medium text-orange-600">
                                  +{formatDZD(calculation.totalInterest)}
                                </span>
                              </div>
                            )}
                            <div className="border-t pt-2 flex justify-between text-sm">
                              <span className="font-medium">Total:</span>
                              <span className="font-bold">{formatDZD(calculation.totalAmountPaid)}</span>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1">
                            {config.requiresBankGuarantee && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Shield className="h-3 w-3" />
                                Garantie bancaire
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs gap-1">
                              <Clock className="h-3 w-3" />
                              {config.defaultInstallments === 1 
                                ? `${type.split('_')[1]} jours`
                                : `${config.defaultInstallments} mois`
                              }
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center py-4 text-gray-400">
                          <Calculator className="h-8 w-8" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Label>
              </div>
            )
          })}
      </RadioGroup>

      {/* Selected Plan Details */}
      {selectedPlan && getSelectedCalculation() && (
        <Card className="border-[#006233] bg-[#006233]/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Résumé du plan: {PLAN_TYPE_CONFIG[selectedPlan].label}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect('' as any, {} as any)}
                disabled={disabled}
              >
                Changer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SelectedPlanSummary
              type={selectedPlan}
              calculation={getSelectedCalculation()!}
              orderAmount={orderAmount}
            />
          </CardContent>
        </Card>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Information sur le DPA</p>
          <p className="text-blue-700">
            Le Différé de Paiement est une pratique courante en Algérie pour les commandes B2B.
            Les plans avec garantie bancaire offrent des conditions plus favorables.
            L'approbation du vendeur est requise avant l'activation du plan.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

interface SelectedPlanSummaryProps {
  type: InstallmentPlanType
  calculation: InstallmentCalculationResult
  orderAmount: number
}

function SelectedPlanSummary({ type, calculation, orderAmount }: SelectedPlanSummaryProps) {
  const config = PLAN_TYPE_CONFIG[type]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 bg-white rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Montant total</p>
        <p className="font-bold text-lg">{formatDZD(orderAmount)}</p>
      </div>
      
      {calculation.downPayment > 0 && (
        <div className="text-center p-3 bg-white rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Acompte ({config.defaultDownPayment}%)</p>
          <p className="font-bold text-lg text-orange-600">{formatDZD(calculation.downPayment)}</p>
        </div>
      )}
      
      <div className="text-center p-3 bg-white rounded-lg">
        <p className="text-xs text-gray-500 mb-1">
          {type.startsWith('DPA') ? 'Paiement dû' : 'Par mensualité'}
        </p>
        <p className="font-bold text-lg text-[#006233]">{formatDZD(calculation.installmentAmount)}</p>
      </div>
      
      <div className="text-center p-3 bg-white rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Total à payer</p>
        <p className="font-bold text-lg">{formatDZD(calculation.totalAmountPaid)}</p>
      </div>

      {calculation.totalInterest > 0 && (
        <div className="col-span-full text-center p-2 bg-orange-50 rounded-lg mt-2">
          <p className="text-sm text-orange-700">
            Intérêts inclus: <strong>+{formatDZD(calculation.totalInterest)}</strong> (Taux effectif: {calculation.effectiveAPR}%)
          </p>
        </div>
      )}
    </div>
  )
}

export default InstallmentPlanSelector
