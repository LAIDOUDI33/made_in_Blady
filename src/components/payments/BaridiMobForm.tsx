'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Smartphone, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn, formatDZD } from '@/lib/utils'
import { validateAlgerianPhone, normalizePhoneNumber } from '@/lib/payments/utils'

interface BaridiMobFormProps {
  paymentId: string
  amount: number
  onPaymentSuccess?: (result: PaymentResult) => void
  onPaymentError?: (error: string) => void
  isProcessing?: boolean
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  message?: string
  error?: string
}

interface FormErrors {
  phoneNumber?: string
  otp?: string
}

export function BaridiMobForm({
  paymentId,
  amount,
  onPaymentSuccess,
  onPaymentError,
  isProcessing: externalProcessing = false,
}: BaridiMobFormProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [demoOtp, setDemoOtp] = useState<string | null>(null)

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Format phone number input
  const formatPhoneNumber = useCallback((value: string) => {
    let cleaned = value.replace(/\D/g, '')
    
    // Auto-add +213 prefix if starting with 0
    if (cleaned.startsWith('0') && cleaned.length > 1) {
      cleaned = '213' + cleaned.slice(1)
    }
    
    // Format as +213 XXX XXX XX XX
    if (cleaned.startsWith('213') && cleaned.length > 3) {
      return '+213 ' + cleaned.slice(3).replace(/(\d{3})(\d{2})(\d{2})/, '$1 $2 $3')
    }
    
    if (cleaned.length <= 10) {
      if (value.startsWith('+')) {
        return '+' + cleaned
      }
      return value.startsWith('0') ? '0' + cleaned.slice(1) : cleaned
    }
    
    return value
  }, [])

  // Handle phone number change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Allow user to type freely but validate on blur
    if (value.length < 20) {
      setPhoneNumber(value)
      if (errors.phoneNumber) {
        setErrors(prev => ({ ...prev, phoneNumber: undefined }))
      }
    }
  }

  // Validate and send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAlgerianPhone(phoneNumber)) {
      setErrors({ phoneNumber: 'Numéro de téléphone algérien invalide (+213)' })
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/payments/baridimob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          phoneNumber: normalizePhoneNumber(phoneNumber),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setStep('otp')
        setCountdown(60) // Start 60 second countdown
        
        // For demo purposes - show OTP in development
        if (result._demoOtp) {
          setDemoOtp(result._demoOtp)
        }
      } else {
        onPaymentError?.(result.error || 'Erreur lors de l\'envoi du code OTP')
      }
    } catch (error) {
      console.error('BaridiMob Send OTP error:', error)
      onPaymentError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Verify OTP and complete payment
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      setErrors({ otp: 'Code OTP à 6 chiffres requis' })
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/payments/baridimob/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          otp,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setStep('success')
        onPaymentSuccess?.({
          success: true,
          transactionId: result.payment.transactionId,
          message: result.message,
        })
      } else {
        setErrors({ otp: result.error || 'Code OTP invalide' })
        onPaymentError?.(result.error || 'Erreur lors de la vérification')
      }
    } catch (error) {
      console.error('BaridiMob Verify OTP error:', error)
      onPaymentError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/payments/baridimob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          phoneNumber: normalizePhoneNumber(phoneNumber),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCountdown(60)
        setOtp('')
        setErrors({})
        
        if (result._demoOtp) {
          setDemoOtp(result._demoOtp)
        }
      } else {
        onPaymentError?.(result.error || 'Erreur lors du renvoi du code')
      }
    } catch (error) {
      console.error('BaridiMob Resend OTP error:', error)
      onPaymentError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Masked phone display
  const maskedPhone = normalizePhoneNumber(phoneNumber)?.replace(
    /(\+213)(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
    '$1 ** *** ** **'
  )

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#006233]/10 rounded-lg">
            <Smartphone className="h-5 w-5 text-[#006233]" />
          </div>
          <div>
            <CardTitle className="text-lg">Paiement BaridiMob</CardTitle>
            <CardDescription>Mobile Money par Algérie Poste</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Amount display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Montant à payer</p>
          <p className="text-2xl font-bold text-[#006233]">{formatDZD(amount)}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6 px-4">
          <StepIndicator 
            step={1} 
            label="Téléphone" 
            active={step === 'phone'} 
            completed={step !== 'phone'} 
          />
          <div className={cn(
            "h-0.5 w-16 mx-2",
            step === 'phone' ? "bg-gray-200" : "bg-[#006233]"
          )} />
          <StepIndicator 
            step={2} 
            label="Vérification" 
            active={step === 'otp'} 
            completed={step === 'success'} 
          />
          <div className={cn(
            "h-0.5 w-16 mx-2",
            step === 'otp' ? "bg-gray-200" : "bg-[#006233]"
          )} />
          <StepIndicator 
            step={3} 
            label="Confirmé" 
            active={step === 'success'}
            completed={step === 'success'}
          />
        </div>

        {/* Step 1: Phone Number */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 bg-[#006233]/10 rounded-full flex items-center justify-center mb-4">
                <Smartphone className="h-8 w-8 text-[#006233]" />
              </div>
              <h4 className="font-semibold text-gray-900">Entrez votre numéro BaridiMob</h4>
              <p className="text-sm text-gray-500 mt-1">
                Vous recevrez un code de vérification par SMS
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Numéro de téléphone
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+213 XXX XXX XX XX"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className={cn(
                  "h-12 text-lg",
                  errors.phoneNumber && "border-red-500 focus-visible:ring-red-500"
                )}
                disabled={isProcessing || externalProcessing}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phoneNumber}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Formats acceptés: +213XXXXXXXXX, 0XXXXXXXXX, 00213XXXXXXXXX
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#006233] hover:bg-[#004d28] text-white font-semibold"
              disabled={isProcessing || externalProcessing}
            >
              {isProcessing || externalProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Envoi du code...
                </span>
              ) : (
                'Recevoir le code OTP'
              )}
            </Button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Vos données sont sécurisées et cryptées</span>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Entrez le code de vérification</h4>
              <p className="text-sm text-gray-500 mt-1">
                Code envoyé au numéro: <strong>{maskedPhone}</strong>
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value)
                  if (errors.otp) setErrors({})
                }}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot key={idx} index={idx} className={cn(
                      "h-14 w-12 text-lg font-bold",
                      errors.otp && "border-red-500 text-red-500"
                    )} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {errors.otp && (
              <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.otp}
              </p>
            )}

            {/* Demo OTP Display */}
            {demoOtp && process.env.NODE_ENV === 'development' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-xs text-yellow-700">
                  <span className="font-medium">Mode Démo:</span> Code OTP ={' '}
                  <span className="font-bold tracking-wider">{demoOtp}</span>
                </p>
              </div>
            )}

            {/* Timer & Resend */}
            <div className="text-center space-y-2">
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Renvoyer le code dans{' '}
                  <span className="font-mono font-semibold text-[#006233]">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 text-sm text-[#006233] hover:text-[#004d28] font-medium"
                >
                  <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
                  Renvoyer le code
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setErrors({})
                }}
                className="block mx-auto text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Changer de numéro
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#006233] hover:bg-[#004d28] text-white font-semibold"
              disabled={otp.length !== 6 || isProcessing || externalProcessing}
            >
              {isProcessing || externalProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Vérification...
                </span>
              ) : (
                'Confirmer et payer'
              )}
            </Button>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-green-700">Paiement réussi !</h4>
              <p className="text-gray-500 mt-2">
                Votre paiement BaridiMob a été traité avec succès.
              </p>
            </div>
            
            {/* Transaction Summary */}
            <div className="bg-gray-50 rounded-lg p-4 text-left max-w-xs mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Montant payé:</span>
                <span className="font-semibold">{formatDZD(amount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Méthode:</span>
                <span className="font-medium">BaridiMob</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Statut:</span>
                <span className="font-medium text-green-600">Complété</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-components
function StepIndicator({ step, label, active, completed }: { 
  step: number; 
  label: string; 
  active?: boolean; 
  completed?: boolean 
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
        completed && "bg-green-500 text-white",
        active && !completed && "bg-[#006233] text-white ring-4 ring-[#006233]/20",
        !active && !completed && "bg-gray-200 text-gray-500"
      )}>
        {completed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : step}
      </div>
      <span className={cn(
        "text-xs mt-1 hidden sm:block",
        active ? "text-[#006233] font-medium" : "text-gray-400"
      )}>
        {label}
      </span>
    </div>
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

export default BaridiMobForm
