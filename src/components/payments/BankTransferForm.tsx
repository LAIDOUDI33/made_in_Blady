'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Landmark, Upload, FileText, Copy, CheckCircle2, AlertCircle, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatDZD } from '@/lib/utils'
import { validateRIB, ALGERIAN_BANKS, PLATFORM_BANK_DETAILS } from '@/lib/payments/utils'

interface BankTransferFormProps {
  paymentId: string
  amount: number
  onInitiateSuccess?: (result: BankInitiateResult) => void
  onUploadSuccess?: (result: PaymentResult) => void
  onError?: (error: string) => void
  isProcessing?: boolean
}

export interface BankInitiateResult {
  success: boolean
  referenceNumber?: string
  beneficiaryDetails?: {
    bankName: string
    accountName: string
    rib: string
    formattedRib: string
  }
}

export interface PaymentResult {
  success: boolean
  receiptUrl?: string
  message?: string
  error?: string
}

interface FormErrors {
  bankName?: string
  rib?: string
  accountHolderName?: string
  receiptFile?: string
}

export function BankTransferForm({
  paymentId,
  amount,
  onInitiateSuccess,
  onUploadSuccess,
  onError,
  isProcessing: externalProcessing = false,
}: BankTransferFormProps) {
  const [step, setStep] = useState<'initiate' | 'instructions' | 'upload'>('initiate')
  const [bankName, setBankName] = useState('')
  const [rib, setRib] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isProcessing, setIsProcessing] = useState(false)
  
  // State after initiation
  const [transferReference, setTransferReference] = useState('')
  const [beneficiaryDetails, setBeneficiaryDetails] = useState<BankInitiateResult['beneficiaryDetails']>()
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Format RIB input (groups of 5 digits)
  const formatRIB = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '')
    return cleaned.replace(/(.{5})/g, '$1 ').trim()
  }, [])

  // Handle RIB input
  const handleRibChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRIB(e.target.value)
    if (formatted.replace(/\s/g, '').length <= 20) {
      setRib(formatted)
      if (errors.rib) {
        setErrors(prev => ({ ...prev, rib: undefined }))
      }
    }
  }

  // Validate initiate form
  const validateInitiateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!bankName) {
      newErrors.bankName = 'Veuillez sélectionner votre banque'
    }

    if (rib && !validateRIB(rib)) {
      newErrors.rib = 'RIB invalide (20 chiffres requis)'
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
      const response = await fetch('/api/payments/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          bankName,
          rib: rib.replace(/\s/g, ''),
          accountHolderName: accountHolderName || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTransferReference(result.payment.referenceNumber || '')
        setBeneficiaryDetails(result.beneficiaryDetails)
        setStep('instructions')
        onInitiateSuccess?.(result as BankInitiateResult)
      } else {
        onError?.(result.error || 'Erreur lors de l\'initialisation du virement')
      }
    } catch (error) {
      console.error('Bank Transfer Initiate error:', error)
      onError?.('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, receiptFile: 'Type de fichier non autorisé' }))
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, receiptFile: 'Fichier trop volumineux (max 10 Mo)' }))
      return
    }

    setReceiptFile(file)
    setErrors(prev => ({ ...prev, receiptFile: undefined }))

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null)
    }
  }

  // Handle confirm with receipt upload
  const handleUpload = async () => {
    if (!receiptFile) {
      setErrors({ receiptFile: 'Veuillez sélectionner un fichier' })
      return
    }

    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('paymentId', paymentId)
      formData.append('receipt', receiptFile)

      const response = await fetch('/api/payments/bank-upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onUploadSuccess?.({
          success: true,
          receiptUrl: result.payment.receiptUrl,
          message: result.message,
        })
      } else {
        onError?.(result.error || 'Erreur lors de l\'envoi du reçu')
      }
    } catch (error) {
      console.error('Bank Upload error:', error)
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
            <Landmark className="h-5 w-5 text-[#006233]" />
          </div>
          <div>
            <CardTitle className="text-lg">Virement Bancaire</CardTitle>
            <CardDescription>Transfert bancaire direct sécurisé</CardDescription>
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
            label="Coordonnées" 
            active={step === 'instructions'} 
            completed={step === 'upload'} 
          />
          <div className={cn(
            "h-0.5 flex-1 mx-2",
            step === 'instructions' ? "bg-gray-200" : "bg-[#006233]"
          )} />
          <StepIndicator 
            step={3} 
            label="Reçu" 
            active={step === 'upload'} 
          />
        </div>

        {/* Step 1: Initiate */}
        {step === 'initiate' && (
          <form onSubmit={handleInitiate} className="space-y-5">
            {/* Bank Selection */}
            <div className="space-y-2">
              <Label htmlFor="bank" className="text-sm font-medium">
                Votre banque <span className="text-red-500">*</span>
              </Label>
              <Select value={bankName} onValueChange={(value) => {
                setBankName(value)
                if (errors.bankName) setErrors(prev => ({ ...prev, bankName: undefined }))
              }}>
                <SelectTrigger id="bank" className={cn("h-12", errors.bankName && "border-red-500")}>
                  <SelectValue placeholder="Sélectionnez votre banque" />
                </SelectTrigger>
                <SelectContent>
                  {ALGERIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      <span className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {bank.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankName && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.bankName}
                </p>
              )}
            </div>

            {/* RIB */}
            <div className="space-y-2">
              <Label htmlFor="rib" className="text-sm font-medium">
                Votre RIB <span className="text-gray-400">(optionnel)</span>
              </Label>
              <Input
                id="rib"
                type="text"
                placeholder="00000 00000 00000 00000 000"
                value={rib}
                onChange={handleRibChange}
                maxLength={24}
                className={cn("h-12 font-mono tracking-wider", errors.rib && "border-red-500")}
                disabled={isProcessing || externalProcessing}
              />
              {errors.rib && (
                <p className="text-xs text-red-500">{errors.rib}</p>
              )}
              <p className="text-xs text-gray-400">20 chiffres - Relevé d'Identité Bancaire</p>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-2">
              <Label htmlFor="holderName" className="text-sm font-medium">
                Nom du titulaire du compte <span className="text-gray-400">(optionnel)</span>
              </Label>
              <Input
                id="holderName"
                type="text"
                placeholder="Nom de l'entreprise ou personne"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
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
                'Obtenir les coordonnées bancaires'
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Instructions */}
        {step === 'instructions' && beneficiaryDetails && (
          <div className="space-y-5">
            {/* Reference Alert */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-800">Référence de virement obligatoire</p>
                  <p className="text-xl font-bold text-yellow-900 mt-1 font-mono tracking-wider">
                    {transferReference}
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Cette référence doit être incluse dans le libellé de votre virement.
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficiary Details */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Coordonnées bancaires du bénéficiaire</h4>
              </div>
              <div className="divide-y divide-gray-100">
                <CopyableRow 
                  label="Banque" 
                  value={beneficiaryDetails.bankName} 
                  field="bank"
                  copied={copiedField === 'bank'}
                  onCopy={() => copyToClipboard(beneficiaryDetails.bankName, 'bank')}
                />
                <CopyableRow 
                  label="Bénéficiaire" 
                  value={beneficiaryDetails.accountName} 
                  field="beneficiary"
                  copied={copiedField === 'beneficiary'}
                  onCopy={() => copyToClipboard(beneficiaryDetails.accountName, 'beneficiary')}
                />
                <CopyableRow 
                  label="RIB" 
                  value={beneficiaryDetails.formattedRib} 
                  field="rib"
                  copied={copiedField === 'rib'}
                  onCopy={() => copyToClipboard(beneficiaryDetails.rib.replace(/\s/g, ''), 'rib')}
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
                  value={transferReference} 
                  field="reference"
                  copied={copiedField === 'reference'}
                  onCopy={() => copyToClipboard(transferReference!, 'reference')}
                  highlight
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Instructions pour le virement
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Connectez-vous à votre banque en ligne ou rendez-vous en agence</li>
                <li>Effectuez un virement vers le compte ci-dessus</li>
                <li>Inclure la référence <strong>{transferReference}</strong> dans le libellé</li>
                <li>Gardez l'ordre de virement (bordereau)</li>
                <li>Délai de traitement: 1-3 jours ouvrables après validation</li>
              </ul>
            </div>

            {/* Supported Banks */}
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Banques algériennes supportées:</p>
              <div className="flex flex-wrap gap-2">
                {ALGERIAN_BANKS.map((bank) => (
                  <span key={bank.code} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {bank.code}
                  </span>
                ))}
              </div>
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

        {/* Step 3: Upload Receipt */}
        {step === 'upload' && (
          <div className="space-y-5">
            <div className="text-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Virement initié !</h4>
              <p className="text-sm text-gray-500 mt-1">
                Téléchargez l'ordre de virement pour finaliser le paiement.
              </p>
            </div>

            {/* File Upload Area */}
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                errors.receiptFile ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-[#006233] hover:bg-[#006233]/5",
                receiptFile && "border-green-300 bg-green-50"
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!receiptFile ? (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    <span className="text-[#006233] font-medium">Cliquez pour télécharger</span>{' '}
                    ou glissez-déposez
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP, PDF (max 10 Mo)</p>
                </>
              ) : (
                <div className="space-y-3">
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="Aperçu" className="max-h-40 mx-auto rounded" />
                  ) : (
                    <FileText className="h-10 w-10 text-green-600 mx-auto" />
                  )}
                  <p className="text-sm font-medium text-green-700">{receiptFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(receiptFile.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
              )}
            </div>
            
            {errors.receiptFile && (
              <p className="text-xs text-red-500 text-center">{errors.receiptFile}</p>
            )}

            <Button
              onClick={handleUpload}
              className="w-full h-12 bg-[#006233] hover:bg-[#004d28] text-white font-semibold"
              disabled={!receiptFile || isProcessing || externalProcessing}
            >
              {isProcessing || externalProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Envoi en cours...
                </span>
              ) : (
                'Envoyer l\'ordre de virement'
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
        "text-xs mt-1 hidden sm:block",
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
          "font-mono font-medium text-sm",
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

export default BankTransferForm
