'use client'

import React, { useState, useCallback } from 'react'
import { Lock, ShieldCheck, CreditCard as CardIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn, formatDZD } from '@/lib/utils'
import { validateCardNumber, validateExpiryDate, validateCVV, detectCardType } from '@/lib/payments/utils'

interface CIBCardFormProps {
  paymentId: string
  amount: number
  onPaymentSuccess?: (result: PaymentResult) => void
  onPaymentError?: (error: string) => void
  isProcessing?: boolean
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  cardLast4?: string
  message?: string
  error?: string
}

interface FormErrors {
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
}

export function CIBCardForm({
  paymentId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  isProcessing: externalProcessing = false,
}: CIBCardFormProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [is3DSecure, setIs3DSecure] = useState(false)

  const cardType = detectCardType(cardNumber)
  
  // Format card number with spaces
  const formatCardNumber = useCallback((value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '')
    const groups = cleaned.match(/.{1,4}/g)
    return groups ? groups.join(' ') : ''
  }, [])

  // Format expiry date (MM/YY)
  const formatExpiryDate = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }, [])

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted)
      if (errors.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: undefined }))
      }
    }
  }

  // Handle expiry date input
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value)
    setExpiryDate(formatted)
    if (errors.expiryDate) {
      setErrors(prev => ({ ...prev, expiryDate: undefined }))
    }
  }

  // Handle CVV input
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvv(value)
    if (errors.cvv) {
      setErrors(prev => ({ ...prev, cvv: undefined }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!validateCardNumber(cardNumber)) {
      newErrors.cardNumber = 'Numéro de carte invalide'
    }

    if (!validateExpiryDate(expiryDate)) {
      newErrors.expiryDate = 'Date d\'expiration invalide ou expirée'
    }

    if (!validateCVV(cvv)) {
      newErrors.cvv = 'CVV invalide (3-4 chiffres)'
    }

    if (cardholderName.trim().length < 3) {
      newErrors.cardholderName = 'Nom du titulaire requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsProcessing(true)
    
    try {
      // Start 3D Secure simulation
      setIs3DSecure(true)
      
      // Simulate 3D Secure delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Process payment
      const response = await fetch('/api/payments/cib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          cardholderName,
          saveCard,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onPaymentSuccess?.({
          success: true,
          transactionId: result.payment.transactionId,
          cardLast4: result.payment.cardLast4,
          message: result.message,
        })
      } else {
        onPaymentError?.(result.error || 'Erreur lors du paiement')
      }
    } catch (error) {
      console.error('CIB Payment error:', error)
      onPaymentError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
      setIs3DSecure(false)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#006233]/10 rounded-lg">
            <CardIcon className="h-5 w-5 text-[#006233]" />
          </div>
          <div>
            <CardTitle className="text-lg">Paiement par Carte Bancaire</CardTitle>
            <CardDescription>Carte Interbancaire Algérienne (CIB)</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Amount display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Montant à payer</p>
          <p className="text-2xl font-bold text-[#006233]">{formatDZD(amount)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-sm font-medium">
              Numéro de carte
            </Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className={cn(
                  "pr-16 h-12 text-lg tracking-wider",
                  errors.cardNumber && "border-red-500 focus-visible:ring-red-500",
                  cardType === 'visa' && "border-blue-400",
                  cardType === 'mastercard' && "border-orange-400"
                )}
                disabled={isProcessing || externalProcessing}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {cardType === 'visa' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">VISA</span>
                )}
                {cardType === 'mastercard' && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">MC</span>
                )}
                {!cardNumber && (
                  <CreditCardIcon />
                )}
              </div>
            </div>
            {errors.cardNumber && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.cardNumber}
              </p>
            )}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry" className="text-sm font-medium">
                Date d'exp.
              </Label>
              <Input
                id="expiry"
                type="text"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={handleExpiryDateChange}
                maxLength={5}
                className={cn(
                  "h-12",
                  errors.expiryDate && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isProcessing || externalProcessing}
              />
              {errors.expiryDate && (
                <p className="text-xs text-red-500">{errors.expiryDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv" className="text-sm font-medium">
                CVV
              </Label>
              <div className="relative">
                <Input
                  id="cvv"
                  type="password"
                  placeholder="•••"
                  value={cvv}
                  onChange={handleCvvChange}
                  maxLength={4}
                  className={cn(
                    "h-12 pr-10",
                    errors.cvv && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={isProcessing || externalProcessing}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {errors.cvv && (
                <p className="text-xs text-red-500">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName" className="text-sm font-medium">
              Nom du titulaire
            </Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="NOM PRÉNOM"
              value={cardholderName}
              onChange={(e) => {
                setCardholderName(e.target.value.toUpperCase())
                if (errors.cardholderName) {
                  setErrors(prev => ({ ...prev, cardholderName: undefined }))
                }
              }}
              className={cn(
                "h-12 uppercase",
                errors.cardholderName && "border-red-500 focus-visible:ring-red-500"
              )}
              disabled={isProcessing || externalProcessing}
            />
            {errors.cardholderName && (
              <p className="text-xs text-red-500">{errors.cardholderName}</p>
            )}
          </div>

          {/* Save Card Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveCard"
              checked={saveCard}
              onCheckedChange={(checked) => setSaveCard(checked === true)}
              disabled={isProcessing || externalProcessing}
            />
            <Label htmlFor="saveCard" className="text-sm text-gray-600 cursor-pointer">
              Enregistrer cette carte pour mes prochains paiements
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-[#006233] hover:bg-[#004d28] text-white font-semibold text-base transition-all duration-200"
            disabled={isProcessing || externalProcessing}
          >
            {isProcessing || externalProcessing ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Traitement en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Payer {formatDZD(amount)}
              </span>
            )}
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Paiement sécurisé par cryptage SSL et 3D Secure</span>
          </div>
        </form>

        {/* 3D Secure Modal Overlay */}
        {is3DSecure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-[#006233]/10 rounded-full flex items-center justify-center animate-pulse">
                  <ShieldCheck className="h-8 w-8 text-[#006233]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Authentification 3D Secure</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Veuillez patienter pendant que nous vérifions votre identité...
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#006233] rounded-full animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                  <p className="text-xs text-gray-400">Connexion à la banque sécurisée...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper components
function CreditCardIcon() {
  return (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}

export default CIBCardForm
