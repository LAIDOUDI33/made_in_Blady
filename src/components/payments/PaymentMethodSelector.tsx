'use client'

import React from 'react'
import { CreditCard, Building2, Smartphone, Landmark, Banknote, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PaymentMethodType } from '@/lib/payments/utils'

interface PaymentMethod {
  id: PaymentMethodType
  name: string
  description: string
  icon: React.ReactNode
  processingTime: string
  fee: number
  feeDescription: string
  badge?: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'CIB',
    name: 'Carte Bancaire (CIB)',
    description: 'Visa ou Mastercard via le réseau interbancaire',
    icon: <CreditCard className="h-8 w-8" />,
    processingTime: 'Immédiat',
    fee: 0,
    feeDescription: 'Gratit',
    badge: 'Recommandé',
  },
  {
    id: 'CCP',
    name: 'Chèque Postale (CCP)',
    description: 'Virement depuis votre compte postal algérien',
    icon: <Building2 className="h-8 w-8" />,
    processingTime: '1-2 jours',
    fee: 0,
    feeDescription: 'Gratit',
  },
  {
    id: 'BARIDIMOB',
    name: 'BaridiMob',
    description: 'Paiement mobile instantané via Algérie Poste',
    icon: <Smartphone className="h-8 w-8" />,
    processingTime: 'Immédiat',
    fee: 0,
    feeDescription: 'Gratit',
    badge: 'Populaire',
  },
  {
    id: 'BANK_TRANSFER',
    name: 'Virement Bancaire',
    description: 'Virement direct vers notre compte bancaire',
    icon: <Landmark className="h-8 w-8" />,
    processingTime: '1-3 jours',
    fee: 0,
    feeDescription: 'Frais bancaires possibles',
  },
  {
    id: 'COD',
    name: 'Paiement à la Livraison',
    description: 'Payez en espèces à la réception',
    icon: <Banknote className="h-8 w-8" />,
    processingTime: 'À la livraison',
    fee: 250,
    feeDescription: '+250 DZD',
  },
]

interface PaymentMethodSelectorProps {
  selectedMethod?: PaymentMethodType | null
  onSelect: (method: PaymentMethodType) => void
  disabled?: boolean
  orderAmount?: number
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  disabled = false,
  orderAmount = 0,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Méthode de Paiement
        </h3>
        <span className="text-sm text-gray-500">
          Sécurisé SSL
        </span>
      </div>
      
      {/* Security badges */}
      <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <span>Paiement 100% sécurisé</span>
        </div>
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Données protégées</span>
        </div>
      </div>

      {/* Payment method cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id
          const totalFee = method.fee
          
          return (
            <Card
              key={method.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                isSelected
                  ? "border-[#006233] shadow-lg ring-2 ring-[#006233]/20"
                  : "border-gray-200 hover:border-gray-300",
                disabled && "opacity-60 cursor-not-allowed"
              )}
              onClick={() => !disabled && onSelect(method.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-3 rounded-lg transition-colors",
                    isSelected ? "bg-[#006233] text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    {method.icon}
                  </div>
                  {isSelected && (
                    <div className="p-1 bg-[#006233] rounded-full">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                {method.badge && (
                  <span className={cn(
                    "inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-2",
                    isSelected ? "bg-[#006233]/10 text-[#006233]" : "bg-blue-50 text-blue-600"
                  )}>
                    {method.badge}
                  </span>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <CardTitle className={cn(
                  "text-base",
                  isSelected ? "text-[#006233]" : "text-gray-900"
                )}>
                  {method.name}
                </CardTitle>
                <p className="text-sm text-gray-500">{method.description}</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {method.processingTime}
                  </span>
                  <span className={cn(
                    "text-xs font-medium",
                    totalFee > 0 ? "text-orange-600" : "text-green-600"
                  )}>
                    {totalFee > 0 ? `+${totalFee.toLocaleString('fr-DZ')} DZD` : method.feeDescription}
                  </span>
                </div>

                {isSelected && totalFee > 0 && (
                  <div className="pt-2 mt-2 border-t border-[#006233]/10">
                    <p className="text-xs text-gray-500">
                      Frais de service:{' '}
                      <span className="font-semibold text-[#006233]">
                        +{totalFee.toLocaleString('fr-DZ')} DZD
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Total: {(orderAmount + totalFee).toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DZD
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Payment provider logos */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center mb-3">Moyens de paiement acceptés</p>
        <div className="flex justify-center items-center gap-6 opacity-60">
          <div className="px-3 py-1.5 bg-gray-100 rounded text-xs font-semibold text-gray-600">VISA</div>
          <div className="px-3 py-1.5 bg-gray-100 rounded text-xs font-semibold text-gray-600">MASTERCARD</div>
          <div className="px-3 py-1.5 bg-gray-100 rounded text-xs font-semibold text-gray-600">CCP</div>
          <div className="px-3 py-1.5 bg-gray-100 rounded text-xs font-semibold text-gray-600">BaridiMob</div>
          <div className="px-3 py-1.5 bg-gray-100 rounded text-xs font-semibold text-gray-600">BNA</div>
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodSelector
