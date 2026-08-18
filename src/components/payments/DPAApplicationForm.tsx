'use client'

import React, { useState } from 'react'
import {
  FileText,
  Upload,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InstallmentPlanType, InstallmentCalculationResult } from '@/lib/payments/installments'
import { formatDZD } from '@/lib/payments/utils'

interface DPAApplicationFormProps {
  orderAmount: number
  selectedPlan: InstallmentPlanType | null
  calculation: InstallmentCalculationResult | null
  onSubmit: (data: DPAApplicationData) => void
  isSubmitting?: boolean
}

export interface DPAApplicationData {
  planType: InstallmentPlanType
  downPaymentPercent: number
  interestRate: number
  firstPaymentDate: string
  bankGuaranteeRequired: boolean
  bankGuaranteeFile?: File
  notes: string
  termsAccepted: boolean
  bankDetailsProvided: boolean
}

export function DPAApplicationForm({
  orderAmount,
  selectedPlan,
  calculation,
  onSubmit,
  isSubmitting = false,
}: DPAApplicationFormProps) {
  const [formData, setFormData] = useState<DPAApplicationData>({
    planType: selectedPlan || ('INSTALLMENT_3X' as InstallmentPlanType),
    downPaymentPercent: 30,
    interestRate: 0,
    firstPaymentDate: getDefaultFirstPaymentDate(),
    bankGuaranteeRequired: false,
    notes: '',
    termsAccepted: false,
    bankDetailsProvided: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.planType) {
      newErrors.planType = 'Veuillez sélectionner un type de plan'
    }

    if (!formData.firstPaymentDate) {
      newErrors.firstPaymentDate = 'La date de premier paiement est requise'
    } else {
      const selectedDate = new Date(formData.firstPaymentDate)
      const minDate = new Date()
      minDate.setDate(minDate.getDate() + 7)
      
      if (selectedDate < minDate) {
        newErrors.firstPaymentDate = 'La date doit être au moins dans 7 jours'
      }
    }

    if (formData.bankGuaranteeRequired && !formData.bankGuaranteeFile) {
      newErrors.bankGuaranteeFile = 'Le document de garantie bancaire est requis'
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'Vous devez accepter les conditions'
    }

    if (!formData.bankDetailsProvided && formData.downPaymentPercent > 0) {
      newErrors.bankDetailsProvided = 'Confirmez que vos coordonnées bancaires sont à jour'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      {calculation && (
        <Card className="border-[#006233] bg-gradient-to-br from-[#006233]/5 to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Résumé de la demande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Montant de la commande</p>
                <p className="font-bold">{formatDZD(orderAmount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Acompte</p>
                <p className="font-bold text-orange-600">
                  {formatDZD(calculation.downPayment)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Premier paiement</p>
                <p className="font-bold text-[#006233]">
                  {formatDZD(calculation.installmentAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total avec intérêts</p>
                <p className="font-bold">{formatDZD(calculation.totalAmountPaid)}</p>
              </div>
              <div>
                <p className="text-gray-500">Nombre d'échéances</p>
                <p className="font-bold">{calculation.installmentCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Taux effectif</p>
                <p className="font-bold">{calculation.effectiveAPR}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détails de la demande</CardTitle>
          <CardDescription>
            Complétez les informations pour votre demande de paiement différé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="firstPaymentDate">Date du premier paiement *</Label>
            <Input
              id="firstPaymentDate"
              type="date"
              value={formData.firstPaymentDate}
              onChange={(e) =>
                setFormData({ ...formData, firstPaymentDate: e.target.value })
              }
              className={errors.firstPaymentDate ? 'border-red-500' : ''}
            />
            {errors.firstPaymentDate && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.firstPaymentDate}
              </p>
            )}
          </div>

          {/* Bank Guarantee Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-[#006233] mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Garantie bancaire
                  </Label>
                  <Checkbox
                    checked={formData.bankGuaranteeRequired}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        bankGuaranteeRequired: !!checked,
                      })
                    }
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Pour les plans de plus de 90 jours ou montant supérieur à 500,000 DZD,
                  une garantie bancaire peut être exigée par le vendeur.
                </p>

                {formData.bankGuaranteeRequired && (
                  <div className="mt-3 space-y-2">
                    <Label htmlFor="bankGuaranteeFile">
                      Document de garantie *
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="bankGuaranteeFile"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankGuaranteeFile:
                              e.target.files?.[0],
                          })
                        }
                        className={
                          errors.bankGuaranteeFile ? 'border-red-500' : ''
                        }
                      />
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                    {errors.bankGuaranteeFile && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.bankGuaranteeFile}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Formats acceptés: PDF, JPG, PNG (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes additionnelles</Label>
            <Textarea
              id="notes"
              placeholder="Précisez toute information pertinente pour votre demande..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Bank Details Confirmation */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Checkbox
              id="bankDetails"
              checked={formData.bankDetailsProvided}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  bankDetailsProvided: !!checked,
                })
              }
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="bankDetails" className="cursor-pointer font-medium">
                Je confirme que mes coordonnées bancaires sont à jour
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Les prélèvements seront effectués sur le compte bancaire associé à mon profil.
              </p>
            </div>
          </div>
          {errors.bankDetailsProvided && (
            <p className="text-sm text-red-600 ml-7 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.bankDetailsProvided}
            </p>
          )}

          {/* Terms Acceptance */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, termsAccepted: !!checked })
              }
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="terms" className="cursor-pointer font-medium">
                J'accepte les conditions du plan de paiement différé *
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                En soumettant cette demande, je m'engage à respecter le calendrier de paiements convenu.
                Tout retard pourra entraîner des pénalités et affecter ma cote de crédit professionnelle.
                Le vendeur se réserve le droit d'approuver ou refuser cette demande.
              </p>
            </div>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600 ml-7 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.termsAccepted}
            </p>
          )}

          {/* Information Box */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Info className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Processus de validation</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>Votre demande sera examinée par le vendeur sous 48h</li>
                <li>Vous recevrez une notification une fois la décision prise</li>
                <li>En cas d'approbation, l'acompte (si applicable) sera prélevé</li>
                <li>Le plan deviendra actif après confirmation du premier paiement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-[#006233] hover:bg-[#004d28]"
        disabled={isSubmitting || !selectedPlan}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Soumission en cours...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Soumettre la demande DPA
          </>
        )}
      </Button>

      {!selectedPlan && (
        <p className="text-center text-sm text-orange-600">
          Veuillez d'abord sélectionner un plan de paiement ci-dessus
        </p>
      )}
    </form>
  )
}

// ============================================
// Helpers
// ============================================

function getDefaultFirstPaymentDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().split('T')[0]
}

export default DPAApplicationForm
