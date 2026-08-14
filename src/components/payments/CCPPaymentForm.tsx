'use client'

import React, { useState, useCallback } from 'react'
import { Building2, Upload, FileText, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn, formatDZD } from '@/lib/utils'
import { validateCCPAccount, PLATFORM_BANK_DETAILS } from '@/lib/payments/utils'

interface CCPPaymentFormProps {
  paymentId: string
  amount: number
  onInitiateSuccess?: (result: CCPInitiateResult) => void
  onConfirmSuccess?: (result: PaymentResult) => void
  onError?: (error: string) => void
  isProcessing?: boolean
}

export interface CCPInitiateResult {
  success: boolean
  ccpReference?: string
  paymentInstructions?: {
    beneficiaryName: string
    ccpAccount: string
    ccpKey: string
    amount: number
    currency: string
    reference: string
    notes: string
  }
}

export interface PaymentResult {
  success: boolean
  receiptUrl?: string
  message?: string
  error?: string
}

interface FormErrors {
  ccpAccount?: string
  holderName?: string
  proofFile?: string
}

export function CCPPaymentForm({
  paymentId,
  amount,
  onInitiateSuccess,
  onConfirmSuccess,
  onError,
  isProcessing: externalProcessing = false,
}: CCPPaymentFormProps) {
  const [step, setStep] = useState<'initiate' | 'instructions' | 'upload'>('initiate')
  const [ccpAccount, setCcpAccount] = useState('')
  const [holderName, setHolderName] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isProcessing, setIsProcessing] = useState(false)
  
  // State after initiation
  const [ccpReference, setCcpReference] = useState('')
  const [paymentInstructions, setPaymentInstructions] = useState<CCPInitiateResult['paymentInstructions']>()
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Format CCP account (XXXXXXXXXX-XX)
  const formatCCPAccount = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 10) {
      return cleaned.slice(0, 10) + '-' + cleaned.slice(10, 12)
    }
    return cleaned
  }, [])

  // Handle CCP account input
  const handleCcpAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCCPAccount(e.target.value)
    if (formatted.replace(/-/g, '').length <= 12) {
      setCcpAccount(formatted)
      if (errors.ccpAccount) {
        setErrors(prev => ({ ...prev, ccpAccount: undefined }))
      }
    }
  }

  // Validate initiate form
  const validateInitiateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (ccpAccount && !validateCCPAccount(ccpAccount)) {
      newErrors.ccpAccount = 'Format de compte CCP invalide (XXXXXXXXXX-XX)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle initiate step
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateInitiateForm()) return

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/payments/ccp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          ccpAccount: ccpAccount || undefined,
          holderName: holderName || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCcpReference(result.payment.ccpReference || '')
        setPaymentInstructions(result.paymentInstructions)
        setStep('instructions')
        onInitiateSuccess?.(result as CCPInitiateResult)
      } else {
        onError?.(result.error || 'Erreur lors de l\'initialisation du paiement CCP')
      }
    } catch (error) {
      console.error('CCP Initiate error:', error)
      onError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, proofFile: 'Type de fichier non autorisé' }))
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, proofFile: 'Fichier trop volumineux (max 5 Mo)' }))
      return
    }

    setProofFile(file)
    setErrors(prev => ({ ...prev, proofFile: undefined }))

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setProofPreview(null)
    }
  }

  // Handle confirm with proof upload
  const handleConfirm = async () => {
    if (!proofFile) {
      setErrors({ proofFile: 'Veuillez sélectionner un fichier' })
      return
    }

    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('paymentId', paymentId)
      formData.append('proof', proofFile)

      const response = await fetch('/api/payments/ccp/confirm', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onConfirmSuccess?.({
          success: true,
          receiptUrl: result.payment.receiptUrl,
          message: result.message,
        })
      } else {
        onError?.(result.error || 'Erreur lors de l\'envoi de la preuve')
      }
    } catch (error) {
      console.error('CCP Confirm error:', error)
      onError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#006233]/10 rounded-lg">
            <Building2 className="h-5 w-5 text-[#006233]" />
          </div>
          <div>
            <CardTitle className="text-lg">Paiement par Chèque Postale</CardTitle>
            <CardDescription>Compte CCP - Algérie Poste</CardDescription>
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
        <div className="flex items-center justify-between mb-6 px-4">
          <StepIndicator 
            step={1} 
            label="Informations" 
            active={step === 'initiate'} 
            completed={step !== 'initiate'} 
          />
          <div className={cn(
            "h-0.5 flex-1 mx-2",
            step === 'initiate' ? "bg-gray-200" : "bg-[#006233]"
          )} />
          <StepIndicator 
            step={2} 
            label="Instructions" 
            active={step === 'instructions'} 
            completed={step === 'upload'} 
          />
          <div className={cn(
            "h-0.5 flex-1 mx-2",
            step === 'instructions' ? "bg-gray-200" : "bg-[#006233]"
          )} />
          <StepIndicator 
            step={3} 
            label="Preuve" 
            active={step === 'upload'} 
          />
        </div>

        {/* Step 1: Initiate */}
        {step === 'initiate' && (
          <form onSubmit={handleInitiate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ccpAccount" className="text-sm font-medium">
                Votre compte CCP <span className="text-gray-400">(optionnel)</span>
              </Label>
              <Input
                id="ccpAccount"
                type="text"
                placeholder="XXXXXXXXXX-XX"
                value={ccpAccount}
                onChange={handleCcpAccountChange}
                maxLength={13}
                className={cn("h-12", errors.ccpAccount && "border-red-500")}
                disabled={isProcessing || externalProcessing}
              />
              {errors.ccpAccount && (
                <p className="text-xs text-red-500">{errors.ccpAccount}</p>
              )}
              <p className="text-xs text-gray-400">Format: 10 chiffres suivis de 2 chiffres de clé</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="holderName" className="text-sm font-medium">
                Nom du titulaire <span className="text-gray-400">(optionnel)</span>
              </Label>
              <Input
                id="holderName"
                type="text"
                placeholder="Nom sur le compte CCP"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="h-12"
                disabled={isProcessing || externalProcessing}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#006233] hover:bg-[#004d28] text-white font-semibold"
              disabled={isProcessing || externalProcessing}
            >
              {isProcessing || externalProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Initialisation...
                </span>
              ) : (
                'Obtenir les instructions de paiement'
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Instructions */}
        {step === 'instructions' && paymentInstructions && (
          <div className="space-y-5">
            {/* Reference Alert */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">Référence de paiement importante</p>
                  <p className="text-xl font-bold text-yellow-900 mt-1 font-mono tracking-wider">
                    {ccpReference}
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Incluez cette référence dans votre virement pour accélérer le traitement.
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Coordonnées de virement</h4>
              </div>
              <div className="divide-y divide-gray-100">
                <CopyableRow 
                  label="Bénéficiaire" 
                  value={paymentInstructions.beneficiaryName} 
                  field="beneficiary"
                  copied={copiedField === 'beneficiary'}
                  onCopy={() => copyToClipboard(paymentInstructions.beneficiaryName, 'beneficiary')}
                />
                <CopyableRow 
                  label="Compte CCP" 
                  value={`${paymentInstructions.ccpAccount}-${paymentInstructions.ccpKey}`} 
                  field="account"
                  copied={copiedField === 'account'}
                  onCopy={() => copyToClipboard(`${paymentInstructions.ccpAccount}-${paymentInstructions.ccpKey}`, 'account')}
                />
                <CopyableRow 
                  label="Montant" 
                  value={`${amount.toLocaleString('fr-DZ')} DZD`} 
                  field="amount"
                  copied={copiedField === 'amount'}
                  onCopy={() => copyToClipboard(amount.toString(), 'amount')}
                />
                <CopyableRow 
                  label="Référence" 
                  value={ccpReference} 
                  field="reference"
                  copied={copiedField === 'reference'}
                  onCopy={() => copyToClipboard(ccpReference!, 'reference')}
                  highlight
                />
              </div>
            </div>

            {/* Notes */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Instructions importantes
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Effectuez le virement depuis votre compte CCP</li>
                <li>Inclure la référence <strong>{ccpReference}</strong></li>
                <li>Gardez le reçu de virement</li>
                <li>Délai de traitement: 1-2 jours ouvrables après validation</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('initiate')}
                className="flex-1 h-11"
                disabled={isProcessing || externalProcessing}
              >
                Retour
              </Button>
              <Button
                onClick={() => setStep('upload')}
                className="flex-1 h-11 bg-[#006233] hover:bg-[#004d28] text-white font-semibold"
              >
                J'ai effectué le virement →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Proof */}
        {step === 'upload' && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Virement effectué !</h4>
              <p className="text-sm text-gray-500 mt-1">
                Téléchargez la preuve de votre virement pour finaliser le paiement.
              </p>
            </div>

            {/* File Upload Area */}
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                errors.proofFile ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-[#006233] hover:bg-[#006233]/5",
                proofFile && "border-green-300 bg-green-50"
              )}
              onClick={() => document.getElementById('proof-upload')?.click()}
            >
              <input
                id="proof-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!proofFile ? (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    <span className="text-[#006233] font-medium">Cliquez pour télécharger</span>{' '}
                    ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, PDF (max 5 Mo)</p>
                </>
              ) : (
                <div className="space-y-3">
                  {proofPreview ? (
                    <img src={proofPreview} alt="Aperçu" className="max-h-40 mx-auto rounded" />
                  ) : (
                    <FileText className="h-10 w-10 text-green-600 mx-auto" />
                  )}
                  <p className="text-sm font-medium text-green-700">{proofFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(proofFile.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
              )}
            </div>
            
            {errors.proofFile && (
              <p className="text-xs text-red-500 text-center">{errors.proofFile}</p>
            )}

            <Button
              onClick={handleConfirm}
              className="w-full h-12 bg-[#006233] hover:bg-[#004d28] text-white font-semibold"
              disabled={!proofFile || isProcessing || externalProcessing}
            >
              {isProcessing || externalProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Envoi en cours...
                </span>
              ) : (
                'Envoyer la preuve de paiement'
              )}
            </Button>
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
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
        completed && "bg-[#006233] text-white",
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
        "text-xs mt-1",
        active ? "text-[#006233] font-medium" : "text-gray-400"
      )}>
        {label}
      </span>
    </div>
  )
}

function CopyableRow({ 
  label, 
  value, 
  field, 
  copied, 
  onCopy,
  highlight = false 
}: { 
  label: string; 
  value: string; 
  field: string; 
  copied: boolean; 
  onCopy: () => void;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "px-4 py-3 flex items-center justify-between",
      highlight && "bg-yellow-50"
    )}>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={cn(
          "font-mono font-medium",
          highlight ? "text-yellow-800" : "text-gray-900"
        )}>{value}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onCopy(); }}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
      >
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-gray-400" />
        )}
      </button>
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

export default CCPPaymentForm
