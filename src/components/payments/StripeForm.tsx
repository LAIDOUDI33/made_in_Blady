'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  Lock, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe2,
  Save,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { cn, formatDZD } from '@/lib/utils'
import { SUPPORTED_CURRENCIES, formatStripeAmount, convertFromDZD } from '@/lib/payments/stripe'

// ============================================
// TYPES
// ============================================

interface StripeFormProps {
  orderId: string
  orderNumber: string
  amountDZD: number // Amount in DZD (will be converted)
  customerEmail?: string
  customerName?: string
  onPaymentSuccess?: (result: StripePaymentResult) => void
  onPaymentError?: (error: string) => void
  isProcessing?: boolean
}

export interface StripePaymentResult {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  message?: string
  error?: string
}

interface FormErrors {
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
  email?: string
  name?: string
  addressLine1?: string
  city?: string
  country?: string
  postalCode?: string
}

type FormStep = 'details' | 'payment' | 'processing' | 'success' | 'error'

interface CurrencyOption {
  code: string
  name: string
  symbol: string
  flag: string
}

// ============================================
// COMPONENT
// ============================================

export function StripeForm({
  orderId,
  orderNumber,
  amountDZD,
  customerEmail: initialEmail = '',
  customerName: initialName = '',
  onPaymentSuccess,
  onPaymentError,
  isProcessing: externalProcessing = false,
}: StripeFormProps) {
  // Form state
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(SUPPORTED_CURRENCIES[0])
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
  
  // Customer info
  const [email, setEmail] = useState(initialEmail)
  const [name, setName] = useState(initialName)
  
  // Card details
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  
  // Address (for international orders)
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('US')
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<FormStep>('details')
  const [paymentResult, setPaymentResult] = useState<StripePaymentResult | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // Calculate converted amount
  const convertedAmount = convertFromDZD(amountDZD, selectedCurrency.code)

  // Format card number with spaces
  const formatCardNumber = useCallback((value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '')
    const groups = cleaned.match(/.{1,4}/g)
    return groups ? groups.join(' ') : ''
  }, [])

  // Format expiry date
  const formatExpiryDate = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }, [])

  // Detect card type
  const detectCardType = (number: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
    const cleaned = number.replace(/\s/g, '')
    
    if (/^4/.test(cleaned)) return 'visa'
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard'
    if (/^3[47]/.test(cleaned)) return 'amex'
    
    return 'unknown'
  }

  const cardType = detectCardType(cardNumber)

  // Validate step 1: Details
  const validateDetails = (): boolean => {
    const newErrors: FormErrors = {}

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Adresse email invalide'
    }

    if (!name || name.trim().length < 3) {
      newErrors.name = 'Nom requis (minimum 3 caractères)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate step 2: Payment
  const validatePayment = (): boolean => {
    const newErrors: FormErrors = {}

    // Card number validation (basic Luhn check would go here)
    const cleanedCard = cardNumber.replace(/\s/g, '')
    if (!cleanedCard || cleanedCard.length < 13 || cleanedCard.length > 19) {
      newErrors.cardNumber = 'Numéro de carte invalide'
    }

    // Expiry validation
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = 'Date invalide (MM/YY)'
    } else {
      const [month, year] = expiryDate.split('/').map(Number)
      if (month < 1 || month > 12) {
        newErrors.expiryDate = 'Mois invalide'
      } else {
        const expDate = new Date(2000 + year, month - 1)
        if (expDate < new Date()) {
          newErrors.expiryDate = 'Carte expirée'
        }
      }
    }

    // CVV validation
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = 'CVV invalide (3-4 chiffres)'
    }

    // Name validation
    if (!cardholderName || cardholderName.trim().length < 3) {
      newErrors.cardholderName = 'Nom du titulaire requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle continue to payment step
  const handleContinueToPayment = async () => {
    if (!validateDetails()) return
    
    setCurrentStep('payment')
  }

  // Handle back to details
  const handleBackToDetails = () => {
    setCurrentStep('details')
  }

  // Create Payment Intent and process payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePayment()) return

    setIsProcessing(true)
    setCurrentStep('processing')

    try {
      // Step 1: Create Payment Intent
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: convertedAmount.toString(),
          currency: selectedCurrency.code,
          customerEmail: email,
          customerName: name,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create payment')
      }

      setClientSecret(result.payment.clientSecret)

      // Step 2: In a real implementation, you'd use Stripe.js Elements here
      // For this demo, we'll simulate successful confirmation after creating intent
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Confirm the payment intent
      const confirmResponse = await fetch(`/api/payments/stripe/${result.payment.paymentIntentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const confirmResult = await confirmResponse.json()

      if (confirmResult.success && confirmResult.stripeStatus === 'succeeded') {
        setCurrentStep('success')
        setPaymentResult({
          success: true,
          paymentIntentId: result.payment.paymentIntentId,
          clientSecret: result.payment.clientSecret,
          message: 'Paiement réussi!',
        })
        
        onPaymentSuccess?.({
          success: true,
          paymentIntentId: result.payment.paymentIntentId,
          message: 'Paiement confirmé avec succès',
        })
      } else {
        throw new Error(confirmResult.error || 'Payment confirmation failed')
      }
    } catch (error) {
      console.error('Stripe Payment error:', error)
      setCurrentStep('error')
      setPaymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de paiement',
      })
      onPaymentError?.(error instanceof Error ? error.message : 'Erreur de paiement')
    } finally {
      setIsProcessing(false)
    }
  }

  // Currency selector handler
  const handleCurrencySelect = (currency: CurrencyOption) => {
    setSelectedCurrency(currency)
    setShowCurrencyDropdown(false)
  }

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Globe2 className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Paiement International</CardTitle>
            <CardDescription className="text-white/80 text-sm">
              Cartes Visa, Mastercard via Stripe
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Amount Display with Currency Selector */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Montant à payer</p>
              <p className="text-xs text-gray-400 mt-1">
                Commande: {orderNumber} • {formatDZD(amountDZD)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-indigo-600">
                {formatStripeAmount(convertedAmount, selectedCurrency.code)}
              </p>
              
              {/* Currency Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50"
                  disabled={isProcessing || currentStep !== 'details'}
                >
                  <span>{selectedCurrency.flag}</span>
                  <span>{selectedCurrency.code}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                
                {showCurrencyDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <button
                        key={currency.code}
                        type="button"
                        onClick={() => handleCurrencySelect(currency)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-indigo-50",
                          selectedCurrency.code === currency.code && "bg-indigo-50 text-indigo-700"
                        )}
                      >
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                        <span className="text-xs text-gray-400">{currency.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Exchange rate note */}
          <p className="text-xs text-gray-400 mt-2">
            Taux approximatif: 1 DZD ≈ {(convertFromDZD(1, selectedCurrency.code)).toFixed(4)} {selectedCurrency.code}
          </p>
        </div>

        {/* Step 1: Customer Details */}
        {currentStep === 'details' && (
          <form onSubmit={(e) => { e.preventDefault(); handleContinueToPayment(); }} className="space-y-5">
            <h3 className="font-semibold text-lg">Informations de contact</h3>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="stripe-email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="stripe-email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
                }}
                className={cn("h-12", errors.email && "border-red-500")}
                disabled={isProcessing || externalProcessing}
              />
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="stripe-name" className="text-sm font-medium">
                Nom complet *
              </Label>
              <Input
                id="stripe-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                }}
                className={cn("h-12", errors.name && "border-red-500")}
                disabled={isProcessing || externalProcessing}
              />
              {errors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Continue button */}
            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              disabled={isProcessing || externalProcessing}
            >
              Continuer vers le paiement
              <ChevronDown className="ml-2 h-4 w-4 rotate-90" />
            </Button>
          </form>
        )}

        {/* Step 2: Card Payment */}
        {currentStep === 'payment' && (
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Back button */}
            <button
              type="button"
              onClick={handleBackToDetails}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              ← Modifier les informations
            </button>

            <h3 className="font-semibold text-lg">Informations de carte</h3>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="card-number" className="text-sm font-medium">
                Numéro de carte *
              </Label>
              <div className="relative">
                <Input
                  id="card-number"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value)
                    if (formatted.replace(/\s/g, '').length <= 19) {
                      setCardNumber(formatted)
                      if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: undefined }))
                    }
                  }}
                  className={cn(
                    "h-12 text-lg tracking-wider pr-16",
                    errors.cardNumber && "border-red-500",
                    cardType === 'visa' && "border-blue-400",
                    cardType === 'mastercard' && "border-orange-400",
                    cardType === 'amex' && "border-blue-300"
                  )}
                  disabled={isProcessing || externalProcessing}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cardType === 'visa' && <VisaLogo />}
                  {cardType === 'mastercard' && <MastercardLogo />}
                  {cardType === 'amex' && <AmexLogo />}
                  {!cardNumber && <CreditCardIcon />}
                </div>
              </div>
              {errors.cardNumber && (
                <p className="text-xs text-red-500">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-sm font-medium">
                  Expiration *
                </Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => {
                    setExpiryDate(formatExpiryDate(e.target.value))
                    if (errors.expiryDate) setErrors(prev => ({ ...prev, expiryDate: undefined }))
                  }}
                  maxLength={5}
                  className={cn("h-12", errors.expiryDate && "border-red-500")}
                  disabled={isProcessing || externalProcessing}
                />
                {errors.expiryDate && (
                  <p className="text-xs text-red-500">{errors.expiryDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-sm font-medium">
                  CVV *
                </Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setCvv(val)
                      if (errors.cvv) setErrors(prev => ({ ...prev, cvv: undefined }))
                    }}
                    className={cn("h-12 pr-10", errors.cvv && "border-red-500")}
                    disabled={isProcessing || externalProcessing}
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.cvv && (
                  <p className="text-xs text-red-500">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholder-name" className="text-sm font-medium">
                Nom du titulaire *
              </Label>
              <Input
                id="cardholder-name"
                type="text"
                placeholder="NOM sur la carte"
                value={cardholderName}
                onChange={(e) => {
                  setCardholderName(e.target.value.toUpperCase())
                  if (errors.cardholderName) setErrors(prev => ({ ...prev, cardholderName: undefined }))
                }}
                className={cn("h-12 uppercase", errors.cardholderName && "border-red-500")}
                disabled={isProcessing || externalProcessing}
              />
              {errors.cardholderName && (
                <p className="text-xs text-red-500">{errors.cardholderName}</p>
              )}
            </div>

            {/* Save Card Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-card-stripe"
                checked={saveCard}
                onCheckedChange={(checked) => setSaveCard(checked === true)}
                disabled={isProcessing || externalProcessing}
              />
              <Label htmlFor="save-card-stripe" className="text-sm text-gray-600 cursor-pointer">
                Enregistrer cette carte pour mes prochains paiements
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition-all duration-200"
              disabled={isProcessing || externalProcessing}
            >
              {isProcessing || externalProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Traitement en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5" />
                  Payer {formatStripeAmount(convertedAmount, selectedCurrency.code)}
                </span>
              )}
            </Button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Paiement sécurisé par Stripe avec authentification 3D Secure</span>
            </div>
          </form>
        )}

        {/* Processing State */}
        {currentStep === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-indigo-700">
                Traitement du paiement...
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Veuillez ne pas fermer cette page pendant le traitement.
              </p>
            </div>
            
            {/* Progress steps */}
            <div className="max-w-xs mx-auto space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Création du paiement</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                <span>Authentification bancaire</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="h-4 w-4 rounded-full border border-gray-300" />
                <span>Confirmation finale</span>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {currentStep === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-green-700">
                Paiement réussi !
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Votre paiement a été traité avec succès.
              </p>
              {paymentResult?.paymentIntentId && (
                <p className="text-xs text-gray-400 mt-2">
                  Transaction: {paymentResult.paymentIntentId}
                </p>
              )}
            </div>
            <Button
              onClick={() => onPaymentSuccess?.(paymentResult!)}
              className="bg-green-600 hover:bg-green-700"
            >
              Continuer
            </Button>
          </div>
        )}

        {/* Error State */}
        {currentStep === 'error' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-red-700">
                Erreur de paiement
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {paymentResult?.error || 'Une erreur est survenue lors du traitement.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('payment')}
              >
                Réessayer
              </Button>
              <Button
                variant="ghost"
                onClick={() => onPaymentError?.('Payment cancelled')}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      {(currentStep === 'details' || currentStep === 'payment') && (
        <CardFooter className="bg-gray-50 px-6 py-4 border-t">
          <div className="w-full flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              <span>Sécurisé par Stripe</span>
            </div>
            <a 
              href="https://stripe.com/security" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-indigo-600"
            >
              Sécurité →
            </a>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================
// SUB-COMPONENTS: Card Logos
// ============================================

function VisaLogo() {
  return (
    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">VISA</span>
  )
}

function MastercardLogo() {
  return (
    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">MC</span>
  )
}

function AmexLogo() {
  return (
    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">AMEX</span>
  )
}

function CreditCardIcon() {
  return (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

export default StripeForm
