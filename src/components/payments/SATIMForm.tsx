'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  Lock, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { cn, formatDZD } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface SATIMFormProps {
  orderId: string
  orderNumber: string
  amount: number
  currency?: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  onPaymentSuccess?: (result: SATIMPaymentResult) => void
  onPaymentError?: (error: string) => void
  onPaymentCancel?: () => void
  isProcessing?: boolean
}

export interface SATIMPaymentResult {
  success: boolean
  transactionId?: string
  redirectUrl?: string
  message?: string
  error?: string
}

interface FormErrors {
  customerEmail?: string
  customerName?: string
}

type FormStep = 'details' | 'redirecting' | 'processing' | 'success' | 'error'

// ============================================
// COMPONENT
// ============================================

export function SATIMForm({
  orderId,
  orderNumber,
  amount,
  currency = 'DZD',
  customerEmail: initialEmail = '',
  customerName: initialName = '',
  customerPhone: initialPhone = '',
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  isProcessing: externalProcessing = false,
}: SATIMFormProps) {
  const [customerEmail, setCustomerEmail] = useState(initialEmail)
  const [customerName, setCustomerName] = useState(initialName)
  const [customerPhone, setCustomerPhone] = useState(initialPhone)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<FormStep>('details')
  const [paymentResult, setPaymentResult] = useState<SATIMPaymentResult | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      newErrors.customerEmail = 'Adresse email invalide'
    }

    // Name validation
    if (!customerName || customerName.trim().length < 3) {
      newErrors.customerName = 'Nom requis (minimum 3 caractères)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Create SATIM payment session
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsProcessing(true)
    setCurrentStep('processing')

    try {
      const response = await fetch('/api/payments/satim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerEmail,
          customerName,
          customerPhone: customerPhone || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTransactionId(result.payment.transactionId)
        setPaymentResult(result)
        
        // Move to redirecting step
        setCurrentStep('redirecting')
        
        // Auto-redirect after a short delay to show user what's happening
        setTimeout(() => {
          if (result.payment?.redirectUrl) {
            window.location.href = result.payment.redirectUrl
          }
        }, 2000)
      } else {
        setCurrentStep('error')
        setPaymentResult({
          success: false,
          error: result.error || 'Erreur lors de la création du paiement',
        })
        onPaymentError?.(result.error || 'Erreur lors de la création du paiement')
      }
    } catch (error) {
      console.error('SATIM Payment error:', error)
      setCurrentStep('error')
      setPaymentResult({
        success: false,
        error: 'Erreur de connexion. Veuillez réessayer.',
      })
      onPaymentError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Poll for payment status after return from SATIM
  useEffect(() => {
    if (currentStep !== 'success' || !transactionId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/satim/${transactionId}/status`)
        const result = await response.json()
        
        setPollCount(prev => prev + 1)

        if (result.success && result.transaction?.status === 'COMPLETED') {
          clearInterval(pollInterval)
          setCurrentStep('success')
          onPaymentSuccess?.({
            success: true,
            transactionId: transactionId,
            message: 'Paiement confirmé avec succès',
          })
        }

        // Stop polling after 30 attempts (1 minute)
        if (pollCount >= 30) {
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Status poll error:', error)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [currentStep, transactionId, pollCount, onPaymentSuccess])

  // Handle cancel
  const handleCancel = () => {
    if (currentStep === 'redirecting') {
      // User cancelled before redirect
      setCurrentStep('details')
    } else {
      onPaymentCancel?.()
    }
  }

  // Format amount display
  const formatAmount = () => {
    if (currency === 'DZD') {
      return formatDZD(amount)
    }
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount) + ` ${currency}`
  }

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      {/* Header with CIB/SATIM branding */}
      <CardHeader className="bg-gradient-to-r from-[#006233] to-[#004d28] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Paiement Sécurisé SATIM</CardTitle>
              <CardDescription className="text-white/80 text-sm">
                Carte Interbancaire Algérienne (CIB)
              </CardDescription>
            </div>
          </div>
          
          {/* Accepted cards badges */}
          <div className="hidden sm:flex items-center gap-2">
            <VisaLogo />
            <MastercardLogo />
            <CIBBadge />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Amount Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Montant à payer</p>
              <p className="text-xs text-gray-400 mt-1">Commande: {orderNumber}</p>
            </div>
            <p className="text-2xl font-bold text-[#006233]">{formatAmount()}</p>
          </div>
        </div>

        {/* Mobile card logos */}
        <div className="sm:hidden flex items-center justify-center gap-3 mb-6">
          <VisaLogo />
          <MastercardLogo />
          <CIBBadge />
        </div>

        {/* Step: Enter Details */}
        {currentStep === 'details' && (
          <form onSubmit={handleCreatePayment} className="space-y-5">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="satim-name" className="text-sm font-medium">
                Nom complet *
              </Label>
              <Input
                id="satim-name"
                type="text"
                placeholder="NOM PRÉNOM"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value)
                  if (errors.customerName) {
                    setErrors(prev => ({ ...prev, customerName: undefined }))
                  }
                }}
                className={cn(
                  "h-12",
                  errors.customerName && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isProcessing || externalProcessing}
              />
              {errors.customerName && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.customerName}
                </p>
              )}
            </div>

            {/* Customer Email */}
            <div className="space-y-2">
              <Label htmlFor="satim-email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="satim-email"
                type="email"
                placeholder="votre@email.com"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value)
                  if (errors.customerEmail) {
                    setErrors(prev => ({ ...prev, customerEmail: undefined }))
                  }
                }}
                className={cn(
                  "h-12",
                  errors.customerEmail && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isProcessing || externalProcessing}
              />
              {errors.customerEmail && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.customerEmail}
                </p>
              )}
            </div>

            {/* Customer Phone (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="satim-phone" className="text-sm font-medium">
                Téléphone (optionnel)
              </Label>
              <Input
                id="satim-phone"
                type="tel"
                placeholder="+213 XXX XXX XXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-12"
                disabled={isProcessing || externalProcessing}
              />
              <p className="text-xs text-gray-400">
                Utilisé pour les notifications de paiement
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 bg-[#006233] hover:bg-[#004d28] text-white font-semibold text-base transition-all duration-200"
              disabled={isProcessing || externalProcessing}
            >
              {isProcessing || externalProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création du paiement...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5" />
                  Payer avec SATIM/CIB
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Paiement sécurisé par cryptage SSL et authentification 3D Secure</span>
            </div>
          </form>
        )}

        {/* Step: Redirecting to SATIM */}
        {currentStep === 'redirecting' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#006233]/10 rounded-full flex items-center justify-center animate-pulse">
              <ExternalLink className="h-8 w-8 text-[#006233]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#006233]">
                Redirection vers SATIM...
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Vous allez être redirigé vers le portail de paiement sécurisé SATIM.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Si vous n'êtes pas redirigé automatiquement,{' '}
                <button 
                  onClick={() => paymentResult?.redirectUrl && window.open(paymentResult.redirectUrl, '_self')}
                  className="text-[#006233] underline hover:text-[#004d28]"
                >
                  cliquez ici
                </button>
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#006233] rounded-full transition-all duration-1000"
                  style={{ width: '70%' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {currentStep === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Création du paiement...</h3>
              <p className="text-sm text-gray-500 mt-2">
                Veuillez patienter pendant que nous préparons votre paiement sécurisé.
              </p>
            </div>
          </div>
        )}

        {/* Step: Success */}
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
              {transactionId && (
                <p className="text-xs text-gray-400 mt-2">
                  Transaction: {transactionId}
                </p>
              )}
            </div>
            <Button
              onClick={() => onPaymentSuccess?.({
                success: true,
                transactionId: transactionId || undefined,
                message: 'Paiement confirmé',
              })}
              className="bg-green-600 hover:bg-green-700"
            >
              Continuer
            </Button>
          </div>
        )}

        {/* Step: Error */}
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
                {paymentResult?.error || 'Une erreur est survenue lors du traitement de votre paiement.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('details')}
              >
                Réessayer
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancel}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      {(currentStep === 'details' || currentStep === 'error') && (
        <CardFooter className="bg-gray-50 px-6 py-4 border-t">
          <div className="w-full flex items-center justify-between text-xs text-gray-400">
            <span>Propulsé par SATIM - CIB Algérie</span>
            <a 
              href="https://www.cib.dz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[#006233]"
            >
              En savoir plus →
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
    <div className="px-2 py-1 bg-white rounded border border-gray-200 shadow-sm">
      <svg height="20" viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.83 15.13L20.72 0.67H23.57L21.68 15.13H18.83Z" fill="#1434CB"/>
        <path d="M34.45 0.93C33.78 0.66 32.73 0.36 31.42 0.36C28.61 0.36 26.62 1.84 26.61 3.95C26.59 5.51 28.02 6.39 29.1 6.92C30.21 7.46 30.59 7.81 30.59 8.3C30.58 9.05 29.69 9.39 28.86 9.39C27.71 9.39 27.09 9.21 26.14 8.79L25.75 8.61L25.33 11.19C26.17 11.57 27.58 11.91 29.04 11.93C32.03 11.93 43.98 10.53 44 8.22C44.01 6.71 42.63 5.86 41.47 5.29C40.36 4.74 39.97 4.41 39.97 3.91C39.96 3.35 40.61 2.75 41.52 2.75C42.49 2.73 43.2 2.94 43.76 3.2L44.04 3.34L44.45 0.88Z" fill="#1434CB"/>
        <path d="M50.08 0.67H47.87C47.17 0.67 46.64 0.87 46.35 1.61L42.07 15.13H45.06L45.67 13.24H49.38L49.75 15.13H52.38L50.08 0.67ZM46.54 10.89L47.79 7.01L48.55 4.05L48.85 7.01L49.56 10.89H46.54Z" fill="#1434CB"/>
        <path d="M14.77 0.67L11.92 10.43L11.58 8.73C10.98 6.81 9.19 4.73 7.18 3.68L9.78 15.12H12.79L17.79 0.67H14.77Z" fill="#1434CB"/>
        <path d="M9.37 0.67H4.82L4.77 0.91C8.28 1.79 10.59 3.94 11.58 6.73L10.65 1.64C10.5 0.92 9.98 0.69 9.37 0.67Z" fill="#1434CB"/>
      </svg>
    </div>
  )
}

function MastercardLogo() {
  return (
    <div className="px-2 py-1 bg-white rounded border border-gray-200 shadow-sm">
      <svg height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="10" r="8" fill="#EB001B"/>
        <circle cx="20" cy="10" r="8" fill="#F79E1B"/>
        <path d="M16 16.5C18.03 14.99 19.3 12.65 19.3 10C19.3 7.35 18.03 5.01 16 3.5C13.97 5.01 12.7 7.35 12.7 10C12.7 12.65 13.97 14.99 16 16.5Z" fill="#FF5F00"/>
      </svg>
    </div>
  )
}

function CIBBadge() {
  return (
    <div className="px-2 py-1 bg-[#006233] rounded text-white text-xs font-bold shadow-sm">
      CIB
    </div>
  )
}

export default SATIMForm
