'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Upload,
  FileText,
  User,
  Building2,
  Landmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react'
import type { DPAPlan, CalculationResult } from '@/lib/payments/installments/config'
import type { DPADocumentType } from '@/lib/payments/installments/calculator'

interface InstallmentApplicationFormProps {
  plan: DPAPlan
  calculation: CalculationResult
  orderAmount: number
  onSubmit: (data: ApplicationData) => Promise<void>
  isSubmitting?: boolean
}

export interface ApplicationData {
  // Step 1: Personal/Business Info
  legalName: string
  legalForm: string
  rcNumber: string
  nifNumber: string
  nisNumber: string
  contactPhone: string
  businessAddress: string
  wilaya: string
  
  // Step 2: Financial Info
  annualRevenue: string
  monthlyRevenue: string
  yearsInBusiness: string
  employeeCount: string
  hasExistingLoans: boolean
  existingLoanAmount: string
  
  // Step 3: Bank Account
  bankName: string
  accountNumber: string
  accountHolder: string
  rib: string // Relevé d'Identité Bancaire
  authorizeAutoDebit: boolean
  
  // Step 4: Documents
  documents: DocumentUpload[]
  
  // Step 5: Terms
  termsAccepted: boolean
  privacyAccepted: boolean
  additionalNotes?: string
}

interface DocumentUpload {
  type: DPADocumentType
  file: File | null
  uploaded: boolean
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
}

const STEPS = [
  { id: 1, title: 'Informations', icon: User },
  { id: 2, title: 'Financier', icon: Building2 },
  { id: 3, title: 'Banque', icon: Landmark },
  { id: 4, title: 'Documents', icon: Upload },
  { id: 5, title: 'Confirmation', icon: CheckCircle2 },
]

const DOCUMENT_TYPES: { type: DPADocumentType; label: string; required: boolean }[] = [
  { type: 'ID_CARD', label: 'Carte d\'Identité Nationale', required: true },
  { type: 'BUSINESS_REG', label: 'Registre de Commerce (RC)', required: true },
  { type: 'BANK_STATEMENT', label: 'Relevé Bancaire (3 derniers mois)', required: true },
  { type: 'NIF_CERTIFICATE', label: 'Certificat NIF', required: false },
  { type: 'FINANCIAL_STATEMENT', label: 'Bilans Financiers', required: false },
  { type: 'BANK_GUARANTEE', label: 'Garantie Bancaire (optionnel)', required: false },
]

const WILAYAS = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Béjaïa',
  'Tlemcen', 'Biskra', 'Tébessa', 'El Oued', 'Skikda', 'Jijel', 'Tizi Ouzou',
  'M\'sila', 'Mascara', 'Tiaret', 'Saïda', 'Médéa', 'Mostaganem', 'M\'sila',
  // ... abbreviated for brevity - full list would include all 58 wilayas
]

export function InstallmentApplicationForm({
  plan,
  calculation,
  orderAmount,
  onSubmit,
  isSubmitting = false
}: InstallmentApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ApplicationData>({
    legalName: '',
    legalForm: '',
    rcNumber: '',
    nifNumber: '',
    nisNumber: '',
    contactPhone: '',
    businessAddress: '',
    wilaya: '',
    annualRevenue: '',
    monthlyRevenue: '',
    yearsInBusiness: '',
    employeeCount: '',
    hasExistingLoans: false,
    existingLoanAmount: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    rib: '',
    authorizeAutoDebit: false,
    documents: DOCUMENT_TYPES.map(doc => ({
      type: doc.type,
      file: null,
      uploaded: false,
      status: 'pending' as const,
    })),
    termsAccepted: false,
    privacyAccepted: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showTermsDialog, setShowTermsDialog] = useState(false)

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!formData.legalName.trim()) newErrors.legalName = 'Requis'
        if (!formData.legalForm) newErrors.legalForm = 'Requis'
        if (!formData.rcNumber.trim()) newErrors.rcNumber = 'Requis'
        if (!formData.nifNumber.trim()) newErrors.nifNumber = 'Requis'
        if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Requis'
        if (!formData.wilaya) newErrors.wilaya = 'Requis'
        break
        
      case 2:
        if (!formData.annualRevenue.trim()) newErrors.annualRevenue = 'Requis'
        if (!formData.monthlyRevenue.trim()) newErrors.monthlyRevenue = 'Requis'
        if (!formData.yearsInBusiness.trim()) newErrors.yearsInBusiness = 'Requis'
        if (formData.hasExistingLoans && !formData.existingLoanAmount.trim()) {
          newErrors.existingLoanAmount = 'Requis si vous avez des prêts existants'
        }
        break
        
      case 3:
        if (!formData.bankName.trim()) newErrors.bankName = 'Requis'
        if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Requis'
        if (!formData.accountHolder.trim()) newErrors.accountHolder = 'Requis'
        if (!formData.rib.trim()) newErrors.rib = 'Requis'
        break
        
      case 4:
        const requiredDocs = formData.documents.filter(d => 
          DOCUMENT_TYPES.find(dt => dt.type === d.type)?.required
        )
        const missingDocs = requiredDocs.filter(d => !d.file)
        if (missingDocs.length > 0) {
          newErrors.documents = `${missingDocs.length} document(s) requis manquant(s)`
        }
        break
        
      case 5:
        if (!formData.termsAccepted) newErrors.terms = 'Vous devez accepter les conditions'
        if (!formData.privacyAccepted) newErrors.privacy = 'Vous devez accepter la politique de confidentialité'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (validateStep(5)) {
      await onSubmit(formData)
    }
  }

  const handleFileUpload = (docType: DPADocumentType, file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(d =>
        d.type === docType ? { ...d, file, status: 'uploaded' as const } : d
      ),
    }))
  }

  const updateField = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Informations Entreprise</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalName">Raison Sociale *</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => updateField('legalName', e.target.value)}
                  placeholder="Ex: SARL AlgeriaTrade"
                  className={errors.legalName ? 'border-red-500' : ''}
                />
                {errors.legalName && (
                  <p className="text-sm text-red-500">{errors.legalName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalForm">Forme Juridique *</Label>
                <Select value={formData.legalForm} onValueChange={(v) => updateField('legalForm', v)}>
                  <SelectTrigger className={errors.legalForm ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EURL">EURL</SelectItem>
                    <SelectItem value="SARL">SARL</SelectItem>
                    <SelectItem value="SPA">SPA</SelectItem>
                    <SelectItem value="SNC">SNC</SelectItem>
                    <SelectItem value="SCS">SCS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.legalForm && (
                  <p className="text-sm text-red-500">{errors.legalForm}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rcNumber">N° Registre de Commerce *</Label>
                <Input
                  id="rcNumber"
                  value={formData.rcNumber}
                  onChange={(e) => updateField('rcNumber', e.target.value)}
                  placeholder="Ex: 16A/00001"
                  className={errors.rcNumber ? 'border-red-500' : ''}
                />
                {errors.rcNumber && (
                  <p className="text-sm text-red-500">{errors.rcNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nifNumber">N° Identification Fiscale *</Label>
                <Input
                  id="nifNumber"
                  value={formData.nifNumber}
                  onChange={(e) => updateField('nifNumber', e.target.value)}
                  placeholder="Ex: 000016000000000"
                  className={errors.nifNumber ? 'border-red-500' : ''}
                />
                {errors.nifNumber && (
                  <p className="text-sm text-red-500">{errors.nifNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nisNumber">N° Statistique (NIS)</Label>
                <Input
                  id="nisNumber"
                  value={formData.nisNumber}
                  onChange={(e) => updateField('nisNumber', e.target.value)}
                  placeholder="Optionnel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Téléphone *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="+213 XXX XXX XXX"
                  className={errors.contactPhone ? 'border-red-500' : ''}
                />
                {errors.contactPhone && (
                  <p className="text-sm text-red-500">{errors.contactPhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Adresse</Label>
              <Textarea
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => updateField('businessAddress', e.target.value)}
                placeholder="Adresse complète de l'entreprise"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Wilaya *</Label>
              <Select value={formData.wilaya} onValueChange={(v) => updateField('wilaya', v)}>
                <SelectTrigger className={errors.wilaya ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner la wilaya" />
                </SelectTrigger>
                <SelectContent>
                  {WILAYAS.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.wilaya && (
                <p className="text-sm text-red-500">{errors.wilaya}</p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Informations Financières</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualRevenue">Chiffre d&apos;Affaires Annuel (DZD) *</Label>
                <Input
                  id="annualRevenue"
                  type="number"
                  value={formData.annualRevenue}
                  onChange={(e) => updateField('annualRevenue', e.target.value)}
                  placeholder="Ex: 10000000"
                  className={errors.annualRevenue ? 'border-red-500' : ''}
                />
                {errors.annualRevenue && (
                  <p className="text-sm text-red-500">{errors.annualRevenue}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyRevenue">Revenu Mensuel (DZD) *</Label>
                <Input
                  id="monthlyRevenue"
                  type="number"
                  value={formData.monthlyRevenue}
                  onChange={(e) => updateField('monthlyRevenue', e.target.value)}
                  placeholder="Ex: 800000"
                  className={errors.monthlyRevenue ? 'border-red-500' : ''}
                />
                {errors.monthlyRevenue && (
                  <p className="text-sm text-red-500">{errors.monthlyRevenue}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsInBusiness">Ancienneté (années) *</Label>
                <Input
                  id="yearsInBusiness"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsInBusiness}
                  onChange={(e) => updateField('yearsInBusiness', e.target.value)}
                  placeholder="Ex: 5"
                  className={errors.yearsInBusiness ? 'border-red-500' : ''}
                />
                {errors.yearsInBusiness && (
                  <p className="text-sm text-red-500">{errors.yearsInBusiness}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">Nombre d&apos;Employés</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min="1"
                  value={formData.employeeCount}
                  onChange={(e) => updateField('employeeCount', e.target.value)}
                  placeholder="Ex: 15"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasExistingLoans"
                  checked={formData.hasExistingLoans}
                  onCheckedChange={(checked) => updateField('hasExistingLoans', checked)}
                />
                <Label htmlFor="hasExistingLoans">
                  J&apos;ai des prêts/financements en cours
                </Label>
              </div>

              {formData.hasExistingLoans && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="existingLoanAmount">Montant Total des Prêts (DZD)</Label>
                  <Input
                    id="existingLoanAmount"
                    type="number"
                    value={formData.existingLoanAmount}
                    onChange={(e) => updateField('existingLoanAmount', e.target.value)}
                    placeholder="Montant restant à rembourser"
                    className={errors.existingLoanAmount ? 'border-red-500' : ''}
                  />
                  {errors.existingLoanAmount && (
                    <p className="text-sm text-red-500">{errors.existingLoanAmount}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Coordonnées Bancaires</h4>
            
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3 text-sm text-amber-800">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>
                    Ces informations sont nécessaires pour le prélèvement automatique 
                    des mensualités. Vos données sont sécurisées et cryptées.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Banque *</Label>
                <Select value={formData.bankName} onValueChange={(v) => updateField('bankName', v)}>
                  <SelectTrigger className={errors.bankName ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionner votre banque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bna">Banque Nationale d&apos;Algérie (BNA)</SelectItem>
                    <SelectItem value="bea">Banque Extérieure d&apos;Algérie (BEA)</SelectItem>
                    <SelectItem value="bdl">Banque de Développement Local (BDL)</SelectItem>
                    <SelectItem value="cpa">Crédit Populaire d&apos;Algérie (CPA)</SelectItem>
                    <SelectItem value="bdl">Banque de l&apos;Agriculture et du Développement Rural (BADR)</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bankName && (
                  <p className="text-sm text-red-500">{errors.bankName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolder">Titulaire du Compte *</Label>
                <Input
                  id="accountHolder"
                  value={formData.accountHolder}
                  onChange={(e) => updateField('accountHolder', e.target.value)}
                  placeholder="Nom exact sur le compte bancaire"
                  className={errors.accountHolder ? 'border-red-500' : ''}
                />
                {errors.accountHolder && (
                  <p className="text-sm text-red-500">{errors.accountHolder}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Numéro de Compte *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                  placeholder="Votre numéro de compte"
                  className={errors.accountNumber ? 'border-red-500' : ''}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-500">{errors.accountNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rib">RIB (20 chiffres) *</Label>
                <Input
                  id="rib"
                  value={formData.rib}
                  onChange={(e) => updateField('rib', e.target.value.replace(/\D/g, '').slice(0, 20))}
                  placeholder="20 chiffres sans espaces"
                  maxLength={20}
                  className={`font-mono ${errors.rib ? 'border-red-500' : ''}`}
                />
                {errors.rib && (
                  <p className="text-sm text-red-500">{errors.rib}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="authorizeAutoDebit"
                checked={formData.authorizeAutoDebit}
                onCheckedChange={(checked) => updateField('authorizeAutoDebit', checked)}
              />
              <Label htmlFor="authorizeAutoDebit" className="text-sm">
                J&apos;autorise le prélèvement automatique des mensualités
              </Label>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h4 className="font-medium">Documents Requis</h4>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3 text-sm text-blue-800">
                  <FileText className="h-5 w-5 shrink-0" />
                  <p>
                    Veuillez télécharger les documents ci-dessous pour compléter 
                    votre demande. Les fichiers marqués d&apos;un * sont obligatoires.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {DOCUMENT_TYPES.map((docType) => {
                const doc = formData.documents.find(d => d.type === docType.type)!
                
                return (
                  <div
                    key={docType.type}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      errors.documents && docType.required && !doc.file
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{docType.label}</p>
                        {docType.required && (
                          <Badge variant="destructive" className="text-xs mt-0.5">Obligatoire</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {doc.file ? (
                        <>
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            {doc.file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileUpload(docType.type, null as any)}
                          >
                            Changer
                          </Button>
                        </>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(docType.type, file)
                            }}
                          />
                          <Button variant="outline" size="sm" asChild>
                            <span>Télécharger</span>
                          </Button>
                        </label>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {errors.documents && (
                <p className="text-sm text-red-500">{errors.documents}</p>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h4 className="font-medium">Résumé & Confirmation</h4>
            
            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Résumé du Plan DPA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plan sélectionné</p>
                    <p className="font-semibold">{plan.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Montant commande</p>
                    <p className="font-semibold">{formatDZD(orderAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mensualité</p>
                    <p className="font-semibold">{formatDZD(calculation.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Durée</p>
                    <p className="font-semibold">{plan.months} mois</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Intérêt total</p>
                    <p className="font-semibold text-orange-600">+{formatDZD(calculation.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frais admin</p>
                    <p className="font-semibold">{formatDZD(calculation.adminFee)}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total à payer</span>
                    <span className="text-xl font-bold text-primary">
                      {formatDZD(calculation.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informations Entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Raison Sociale</dt>
                  <dd>{formData.legalName || '-'}</dd>
                  <dt className="text-muted-foreground">Forme Juridique</dt>
                  <dd>{formData.legalForm || '-'}</dd>
                  <dt className="text-muted-foreground">RC</dt>
                  <dd>{formData.rcNumber || '-'}</dd>
                  <dt className="text-muted-foreground">Wilaya</dt>
                  <dd>{formData.wilaya || '-'}</dd>
                </dl>
              </CardContent>
            </Card>

            {/* Documents Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DOCUMENT_TYPES.map(docType => {
                    const doc = formData.documents.find(d => d.type === docType.type)
                    return (
                      <div key={docType.type} className="flex items-center justify-between text-sm">
                        <span>{docType.label}</span>
                        {doc?.file ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">Non fourni</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Terms Acceptance */}
            <Card className={errors.terms || errors.privacy ? 'border-red-300' : ''}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => updateField('termsAccepted', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="termsAccepted" className="text-sm cursor-pointer">
                    J&apos;ai lu et j&apos;accepte les{' '}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowTermsDialog(true)
                      }}
                    >
                      conditions générales du paiement différé
                    </button>
                    {' '}*
                  </Label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-red-500 ml-6">{errors.terms}</p>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacyAccepted"
                    checked={formData.privacyAccepted}
                    onCheckedChange={(checked) => updateField('privacyAccepted', checked)}
                    className="mt-1"
                  />
                  <Label htmlFor="privacyAccepted" className="text-sm cursor-pointer">
                    J&apos;accepte la politique de traitement des données personnelles *
                  </Label>
                </div>
                {errors.privacy && (
                  <p className="text-sm text-red-500 ml-6">{errors.privacy}</p>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Notes Supplémentaires (optionnel)</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => updateField('additionalNotes', e.target.value)}
                placeholder="Toute information supplémentaire pertinente..."
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Étape {currentStep} sur {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complété
          </span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            
            return (
              <div
                key={step.id}
                className={`
                  flex flex-col items-center gap-1
                  ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-100'}
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Soumettre la Demande
              </>
            )}
          </Button>
        )}
      </div>

      {/* Terms Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conditions Générales - Paiement Différé (DPA)</DialogTitle>
            <DialogDescription>
              AlgeriaTrade.dz - Conditions d&apos;utilisation du service de paiement différé
            </DialogDescription>
          </DialogHeader>
          
          <div className="prose prose-sm max-w-none mt-4 space-y-4 text-sm">
            <section>
              <h4 className="font-semibold">1. Objet</h4>
              <p>
                Les présentes conditions régissent l&apos;utilisation du service de Paiement Différé 
                (DPA - Deferred Payment Agreement) proposé par AlgeriaTrade.dz permettant aux acheteurs 
                éligibles de payer leurs commandes en plusieurs fois.
              </p>
            </section>

            <section>
              <h4 className="font-semibold">2. Éligibilité</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Commande minimum: 500,000 DZD</li>
                <li>Inscription sur la plateforme depuis au moins 21 jours</li>
                <li>Avoir complété au moins 5 commandes précédentes</li>
                <li>Note minimale de 4.0/5 étoiles</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold">3. Conditions Financières</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Des intérêts s&apos;appliquent selon le plan choisi (2.5% à 16%)</li>
                <li>Frais administratifs fixes par plan</li>
                <li>Premier paiement dû 30 jours après activation</li>
                <li>Délai de grâce de 5 jours avant pénalités</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold">4. Retard de Paiement</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Pénalité de retard: 2% mensuel</li>
                <li>Frais minimum: 5,000 DZD</li>
                <li>Plafonnement à 10% du montant de l&apos;échéance</li>
                <li>En cas de défaut: procédure de recouvrement engagée</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold">5. Règlement Anticipé</h4>
              <p>
                Un règlement anticipé donne droit à une réduction calculée proportionnellement 
                aux intérêts non courus et aux frais administratifs.
              </p>
            </section>

            <section>
              <h4 className="font-semibold">6. Protection des Données</h4>
              <p>
                Les informations financières fournies sont traitées conformément à la législation 
                algérienne en matière de protection des données personnelles.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function for formatting
function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' د.ج'
}

export default InstallmentApplicationForm
