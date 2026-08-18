'use client'

/**
 * SatimCardForm - Professional Credit Card Payment Form for SATIM/CIB
 * Features:
 * - Card number formatting with spaces every 4 digits
 * - Expiry date MM/YY format with auto-focus to CVV
 * - CVV/CVC field with toggle visibility
 * - Cardholder name field with uppercase transformation
 * - Automatic card type detection (Visa, Mastercard, CIB)
 * - 3D Secure indicator and authentication flow
 * - Loading state during processing
 * - Multi-language error messages (Arabic, French, English)
 * - Responsive design optimized for mobile devices
 * 
 * @module components/payments/SatimCardForm
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Lock,
  ShieldCheck,
  CreditCard,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn, formatDZD } from '@/lib/utils'
import { detectCardType, getCardTypeInfo } from '@/lib/payments/satim/client'
import type { CardType, SatimPaymentResult } from '@/lib/payments/satim/types'

// ============================================
// TYPES & INTERFACES
// ============================================

interface SatimCardFormProps {
  /** Unique payment identifier */
  paymentId: string
  /** Payment amount in DZD */
  amount: number
  /** Callback on successful payment */
  onPaymentSuccess?: (result: SatimPaymentResult) => void
  /** Callback on payment error */
  onPaymentError?: (error: string) => void
  /** External processing state */
  isProcessing?: boolean
  /** UI language preference */
  locale?: 'ar' | 'fr' | 'en'
}

export interface SatimPaymentResult {
  success: boolean
  transactionId?: string
  redirectUrl?: string
  cardLast4?: string
  cardType?: string
  message?: string
  error?: string
}

interface FormErrors {
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
}

type FormStatus = 'idle' | 'validating' | 'processing' | 'threeds' | 'success' | 'error'

// ============================================
// LOCALIZATION STRINGS
// ============================================

const localizationStrings = {
  fr: {
    title: 'Paiement par Carte Bancaire',
    subtitle: 'Carte Interbancaire Algérienne via SATIM',
    amountLabel: 'Montant à payer',
    cardNumberLabel: 'Numéro de carte',
    cardNumberPlaceholder: '0000 0000 0000 0000',
    expiryLabel: "Date d'exp.",
    expiryPlaceholder: 'MM/AA',
    cvvLabel: 'CVV',
    cvvPlaceholder: '•••',
    cardholderLabel: 'Nom du titulaire',
    cardholderPlaceholder: 'NOM PRÉNOM',
    payButton: 'Payer',
    processing: 'Traitement en cours...',
    secureNote: 'Paiement sécurisé par cryptage SSL et authentification 3D Secure',
    threeDsTitle: 'Authentification 3D Secure',
    threeDsMessage: 'Veuillez patienter pendant que nous vérifions votre identité...',
    threeDsConnecting: 'Connexion à la banque sécurisée...',
    successTitle: 'Paiement réussi !',
    successMessage: 'Votre paiement a été traité avec succès.',
    errorTitle: 'Erreur de paiement',
    retryButton: 'Réessayer',
    cancelButton: 'Annuler',
    saveCardLabel: 'Enregistrer cette carte pour mes prochains paiements',
    errors: {
      cardNumber: 'Numéro de carte invalide',
      expiryDate: "Date d'expiration invalide ou expirée",
      cvv: 'CVV invalide (3-4 chiffres)',
      cardholderName: 'Nom du titulaire requis',
      generic: 'Veuillez corriger les erreurs dans le formulaire',
    },
  },
  ar: {
    title: 'الدفع بالبطاقة البنكية',
    subtitle: 'البطاقة البنكية الجزائرية عبر ساتيم',
    amountLabel: 'المبلغ المطلوب دفعه',
    cardNumberLabel: 'رقم البطاقة',
    cardNumberPlaceholder: '0000 0000 0000 0000',
    expiryLabel: 'تاريخ الانتهاء',
    expiryPlaceholder: 'ش/سنة',
    cvvLabel: 'رمز الأمان',
    cvvPlaceholder: '•••',
    cardholderLabel: 'اسم حامل البطاقة',
    cardholderPlaceholder: 'الاسم الكامل',
    payButton: 'ادفع الآن',
    processing: 'جارٍ المعالجة...',
    secureNote: 'دفع آمن بتشفير SSL ومصادقة ثلاثية الأبعاد',
    threeDsTitle: 'المصادقة ثلاثية الأبعاد',
    threeDsMessage: 'يرجى الانتظار أثناء التحقق من هويتك...',
    threeDsConnecting: 'الاتصال بالبنك الآمن...',
    successTitle: 'تم الدفع بنجاح!',
    successMessage: 'تمت معالجة الدفع الخاص بك بنجاح.',
    errorTitle: 'خطأ في الدفع',
    retryButton: 'إعادة المحاولة',
    cancelButton: 'إلغاء',
    saveCardLabel: 'حفظ هذه البطاقة للمدفوعات المستقبلية',
    errors: {
      cardNumber: 'رقم البطاقة غير صالح',
      expiryDate: 'تاريخ انتهاء غير صالح أو منتهي الصلاحية',
      cvv: 'رمز الأمان غير صالح (3-4 أرقام)',
      cardholderName: 'اسم حامل البطاقة مطلوب',
      generic: 'يرجى تصحيح الأخطاء في النموذج',
    },
  },
  en: {
    title: 'Credit Card Payment',
    subtitle: 'Algerian Interbank Card via SATIM',
    amountLabel: 'Amount to pay',
    cardNumberLabel: 'Card number',
    cardNumberPlaceholder: '0000 0000 0000 0000',
    expiryLabel: 'Expiry date',
    expiryPlaceholder: 'MM/YY',
    cvvLabel: 'CVV',
    cvvPlaceholder: '•••',
    cardholderLabel: 'Cardholder name',
    cardholderPlaceholder: 'FULL NAME',
    payButton: 'Pay Now',
    processing: 'Processing...',
    secureNote: 'Secure payment with SSL encryption and 3D Secure authentication',
    threeDsTitle: '3D Secure Authentication',
    threeDsMessage: 'Please wait while we verify your identity...',
    threeDsConnecting: 'Connecting to secure bank...',
    successTitle: 'Payment successful!',
    successMessage: 'Your payment has been processed successfully.',
    errorTitle: 'Payment error',
    retryButton: 'Try again',
    cancelButton: 'Cancel',
    saveCardLabel: 'Save this card for future payments',
    errors: {
      cardNumber: 'Invalid card number',
      expiryDate: 'Invalid or expired expiry date',
      cvv: 'Invalid CVV (3-4 digits)',
      cardholderName: 'Cardholder name is required',
      generic: 'Please correct the errors in the form',
    },
  },
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate card number using Luhn algorithm
 */
function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '')
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false
  }

  let sum = 0
  let isEven = false
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Validate expiry date in MM/YY format
 */
function validateExpiryDate(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false
  
  const month = parseInt(match[1], 10)
  const year = parseInt('20' + match[2], 10)
  
  if (month < 1 || month > 12) return false
  
  const now = new Date()
  const expDate = new Date(year, month)
  
  return expDate > now
}

/**
 * Validate CVV code
 */
function validateCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv)
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SatimCardForm({
  paymentId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  isProcessing: externalProcessing = false,
  locale = 'fr',
}: SatimCardFormProps) {
  // State management
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  
  // Refs for auto-focus
  const expiryRef = useRef<HTMLInputElement>(null)
  const cvvRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  // Get localized strings
  const t = localizationStrings[locale] || localizationStrings.fr
  
  // Detect card type
  const cardType: CardType = detectCardType(cardNumber)
  const cardInfo = getCardTypeInfo(cardType)

  // Format card number with spaces every 4 digits
  const formatCardNumber = useCallback((value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/\D/g, '')
    const groups = cleaned.match(/.{1,4}/g)
    return groups ? groups.join(' ') : ''
  }, [])

  // Format expiry date as MM/YY
  const formatExpiryDate = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
    }
    return cleaned
  }, [])

  // Handle card number input change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardNumber(formatted)
      clearError('cardNumber')
      
      // Auto-focus expiry when card number is complete (16 digits)
      if (formatted.replace(/\s/g, '').length >= 16 && expiryRef.current) {
        setTimeout(() => expiryRef.current?.focus(), 100)
      }
    }
  }

  // Handle expiry date input change
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value)
    setExpiryDate(formatted)
    clearError('expiryDate')
    
    // Auto-focus CVV when expiry is complete
    if (formatted.length === 5 && cvvRef.current) {
      setTimeout(() => cvvRef.current?.focus(), 100)
    }
  }

  // Handle CVV input change
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvv(value)
    clearError('cvv')
  }

  // Clear specific error
  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!validateCardNumber(cardNumber)) {
      newErrors.cardNumber = t.errors.cardNumber
    }

    if (!validateExpiryDate(expiryDate)) {
      newErrors.expiryDate = t.errors.expiryDate
    }

    if (!validateCVV(cvv)) {
      newErrors.cvv = t.errors.cvv
    }

    if (cardholderName.trim().length < 3) {
      newErrors.cardholderName = t.errors.cardholderName
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsProcessing(true)
    setFormStatus('processing')

    try {
      // Start 3D Secure flow simulation
      setFormStatus('threeds')
      
      // Simulate 3D Secure delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Process payment via API
      const response = await fetch('/api/payments/satim/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          cardholderName,
          saveCard,
          cardType,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setFormStatus('success')
        onPaymentSuccess?.({
          success: true,
          transactionId: result.payment?.transactionId,
          redirectUrl: result.payment?.redirectUrl,
          cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
          cardType,
          message: result.message || t.successMessage,
        })
      } else {
        setFormStatus('error')
        onPaymentError?.(result.error || t.errorTitle)
      }
    } catch (error) {
      console.error('[SatimCardForm] Payment error:', error)
      setFormStatus('error')
      onPaymentError?.(
        locale === 'ar' ? 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.' :
        locale === 'en' ? 'Connection error. Please try again.' :
        'Erreur de connexion. Veuillez réessayer.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Determine if form is disabled
  const isDisabled = isProcessing || externalProcessing

  // RTL class for Arabic
  const rtlClass = locale === 'ar' ? 'rtl' : ''

  return (
    <Card className={cn("w-full max-w-lg mx-auto overflow-hidden", rtlClass)}>
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-[#006233] to-[#004d28] text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className={cn("flex-1", locale === 'ar' && 'text-right')}>
            <CardTitle className="text-xl font-bold">{t.title}</CardTitle>
            <CardDescription className="text-white/80 text-sm mt-1">
              {t.subtitle}
            </CardDescription>
          </div>
          
          {/* Card type badge */}
          {cardType !== 'UNKNOWN' && (
            <span
              className="px-2 py-1 text-xs font-bold rounded"
              style={{
                backgroundColor: cardInfo.bgColor,
                color: cardInfo.color,
              }}
            >
              {cardInfo.name}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Amount Display */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center">
            <div className={cn(locale === 'ar' && 'text-right')}>
              <p className="text-sm text-gray-500">{t.amountLabel}</p>
            </div>
            <p className="text-2xl font-bold text-[#006233]">{formatDZD(amount)}</p>
          </div>
        </div>

        {/* Success State */}
        {formStatus === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-green-700">{t.successTitle}</h3>
              <p className="text-sm text-gray-500 mt-1">{t.successMessage}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {formStatus === 'error' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-red-700">{t.errorTitle}</h3>
              <p className="text-sm text-gray-500 mt-1">{t.errors.generic}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setFormStatus('idle')}
                disabled={isDisabled}
              >
                {t.retryButton}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onPaymentError?.('cancelled')}
                disabled={isDisabled}
              >
                {t.cancelButton}
              </Button>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {(formStatus === 'idle' || formStatus === 'processing') && (
          <form onSubmit={handleSubmit} className="space-y-5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Card Number Input */}
            <div className="space-y-2">
              <Label htmlFor="satim-card-number" className="text-sm font-medium">
                {t.cardNumberLabel}
              </Label>
              <div className="relative">
                <Input
                  id="satim-card-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder={t.cardNumberPlaceholder}
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className={cn(
                    "pr-20 h-12 text-lg tracking-wider font-mono",
                    errors.cardNumber && "border-red-500 focus-visible:ring-red-500",
                    cardType !== 'UNKNOWN' && !errors.cardNumber && "border-l-4",
                    cardType === 'VISA' && "border-blue-500",
                    cardType === 'MASTERCARD' && "border-orange-500",
                    cardType === 'CIB' && "border-green-600"
                  )}
                  disabled={isDisabled}
                />
                
                {/* Card type indicator or icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {cardType !== 'UNKNOWN' ? (
                    <span
                      className="px-2 py-0.5 text-xs font-bold rounded"
                      style={{
                        backgroundColor: cardInfo.bgColor,
                        color: cardInfo.color,
                      }}
                    >
                      {cardInfo.name}
                    </span>
                  ) : (
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {errors.cardNumber && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.cardNumber}
                </p>
              )}
            </div>

            {/* Expiry Date and CVV Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="satim-expiry" className="text-sm font-medium">
                  {t.expiryLabel}
                </Label>
                <Input
                  ref={expiryRef}
                  id="satim-expiry"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder={t.expiryPlaceholder}
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  maxLength={5}
                  className={cn(
                    "h-12 font-mono",
                    errors.expiryDate && "border-red-500 focus-visible:ring-red-500"
                  )}
                  disabled={isDisabled}
                />
                {errors.expiryDate && (
                  <p className="text-xs text-red-500">{errors.expiryDate}</p>
                )}
              </div>

              {/* CVV */}
              <div className="space-y-2">
                <Label htmlFor="satim-cvv" className="text-sm font-medium">
                  {t.cvvLabel}
                </Label>
                <div className="relative">
                  <Input
                    ref={cvvRef}
                    id="satim-cvv"
                    type={showCvv ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder={t.cvvPlaceholder}
                    value={cvv}
                    onChange={handleCvvChange}
                    maxLength={4}
                    className={cn(
                      "h-12 pr-10 font-mono",
                      errors.cvv && "border-red-500 focus-visible:ring-red-500"
                    )}
                    disabled={isDisabled}
                  />
                  
                  {/* Toggle CVV visibility */}
                  <button
                    type="button"
                    onClick={() => setShowCvv(!showCvv)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showCvv ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.cvv && (
                  <p className="text-xs text-red-500">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="satim-cardholder" className="text-sm font-medium">
                {t.cardholderLabel}
              </Label>
              <Input
                id="satim-cardholder"
                type="text"
                autoComplete="cc-name"
                placeholder={t.cardholderPlaceholder}
                value={cardholderName}
                onChange={(e) => {
                  setCardholderName(e.target.value.toUpperCase())
                  clearError('cardholderName')
                }}
                className={cn(
                  "h-12 uppercase",
                  errors.cardholderName && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isDisabled}
              />
              {errors.cardholderName && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.cardholderName}
                </p>
              )}
            </div>

            {/* Save Card Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="satim-save-card"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                disabled={isDisabled}
                className="h-4 w-4 rounded border-gray-300 text-[#006233] focus:ring-[#006233]"
              />
              <Label
                htmlFor="satim-save-card"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                {t.saveCardLabel}
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              ref={submitRef}
              type="submit"
              className={cn(
                "w-full h-14 bg-[#006233] hover:bg-[#004d28] text-white font-semibold text-base transition-all duration-200",
                "focus:ring-2 focus:ring-offset-2 focus:ring-[#006233]",
                isDisabled && "opacity-70 cursor-not-allowed"
              )}
              disabled={isDisabled}
            >
              {isDisabled ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.processing}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5" />
                  {t.payButton} {formatDZD(amount)}
                </span>
              )}
            </Button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <Smartphone className="h-3 w-3 flex-shrink-0 sm:hidden" />
              <span>{t.secureNote}</span>
            </div>
          </form>
        )}

        {/* 3D Secure Overlay */}
        {formStatus === 'threeds' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-[#006233]/10 rounded-full flex items-center justify-center animate-pulse">
                  <ShieldCheck className="h-8 w-8 text-[#006233]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t.threeDsTitle}</h3>
                  <p className="text-sm text-gray-500 mt-2">{t.threeDsMessage}</p>
                </div>
                
                {/* Progress bar */}
                <div className="space-y-2 pt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#006233] to-[#00a651] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 animate-pulse">
                    {t.threeDsConnecting}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Default export
export default SatimCardForm
