'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Package, 
  CreditCard,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn, formatDZD } from '@/lib/utils'
import {
  PaymentMethodSelector,
  CIBCardForm,
  CCPPaymentForm,
  BaridiMobForm,
  BankTransferForm,
  PaymentStatusTracker,
  ReceiptGenerator,
  type PaymentMethodType,
} from '@/components/payments'

// Mock order data (in real app, this would come from API/params)
const mockOrder = {
  id: 'order_demo_001',
  orderNumber: 'ORD-2024-001234',
  totalAmount: 125000,
  currency: 'DZD',
  status: 'PENDING',
  items: [
    { id: '1', name: "Huile d'olive extra vierge - Bidon 5L", quantity: 10, unitPrice: 8500, total: 85000 },
    { id: '2', name: 'Dates Deglet Nour - Carton 10kg', quantity: 2, unitPrice: 20000, total: 40000 },
  ],
  company: {
    name: 'Algeria Foods Export',
    wilaya: 'Alger',
  },
  deliveryAddress: '123 Rue Didouche Mourad, Alger',
}

type CheckoutStep = 'review' | 'method' | 'payment' | 'confirmation'

export default function CheckoutPage() {
  const router = useRouter()
  
  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null)
  const [paymentId, setPaymentId] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)

  // Create payment when method is selected
  const handleMethodSelect = async (method: PaymentMethodType) => {
    setSelectedMethod(method)
    setErrorMessage('')

    try {
      const response = await fetch('/api/payments/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: mockOrder.id,
          method,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setPaymentId(result.payment.id)
      } else {
        setErrorMessage(result.error || 'Erreur lors de la création du paiement')
      }
    } catch (error) {
      console.error('Create payment error:', error)
      setErrorMessage('Erreur de connexion. Veuillez réessayer.')
    }
  }

  // Handle payment success
  const handlePaymentSuccess = useCallback((result: any) => {
    console.log('Payment success:', result)
    setPaymentStatus('success')
    
    // Generate receipt data
    setReceiptData({
      orderNumber: mockOrder.orderNumber,
      paymentReference: `PAY-${Date.now()}`,
      transactionId: result.transactionId,
      amount: mockOrder.totalAmount,
      currency: mockOrder.currency,
      paymentMethod: selectedMethod || '',
      status: 'COMPLETED',
      paidAt: new Date(),
      buyerName: 'Client Démo',
      companyName: mockOrder.company.name,
      items: mockOrder.items,
    })
    
    setTimeout(() => setCurrentStep('confirmation'), 1500)
  }, [mockOrder, selectedMethod])

  // Handle payment error
  const handlePaymentError = useCallback((error: string) => {
    console.error('Payment error:', error)
    setPaymentStatus('error')
    setErrorMessage(error)
  }, [])

  // Navigate between steps
  const goToNextStep = () => {
    if (currentStep === 'review' && acceptTerms) {
      setCurrentStep('method')
    } else if (currentStep === 'method' && selectedMethod) {
      setCurrentStep('payment')
    }
  }

  const goToPrevStep = () => {
    if (currentStep === 'method') {
      setCurrentStep('review')
    } else if (currentStep === 'payment') {
      setCurrentStep('method')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('review')
    }
  }

  // Calculate COD fee if applicable
  const codFee = selectedMethod === 'COD' ? 250 : 0
  const totalWithFee = mockOrder.totalAmount + codFee

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={goToPrevStep}
              className="flex items-center gap-2 text-gray-600 hover:text-[#006233] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Retour</span>
            </button>
            
            <h1 className="text-lg font-semibold text-gray-900">
              Paiement de Commande
            </h1>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Paiement sécurisé</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-4 flex items-center justify-center">
            <ProgressSteps currentStep={currentStep} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Order Review */}
            {currentStep === 'review' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#006233]" />
                    Récapitulatif de la commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Items */}
                  <div className="space-y-4">
                    {mockOrder.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between py-3 border-b last:border-b-0">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Quantité: {item.quantity} × {formatDZD(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatDZD(item.total)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Adresse de livraison</h4>
                    <p className="text-sm text-gray-600">{mockOrder.deliveryAddress}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Fournisseur: {mockOrder.company.name}
                    </p>
                  </div>

                  {/* Terms Acceptance */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-gray-600">
                        J&apos;ai lu et j&apos;accepte les{' '}
                        <a href="#" className="text-[#006233] underline">conditions générales de vente</a>{' '}
                        et la{' '}
                        <a href="#" className="text-[#006233] underline">politique de retour</a>.{' '}
                        Je confirme que je suis autorisé à effectuer cet achat au nom de mon entreprise.
                      </span>
                    </label>
                    
                    {!acceptTerms && (
                      <p className="text-xs text-red-500 flex items-center gap-1 ml-7">
                        <AlertCircle className="h-3 w-3" />
                        Vous devez accepter les conditions pour continuer
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={goToNextStep}
                    disabled={!acceptTerms}
                    className="w-full h-12 bg-[#006233] hover:bg-[#004d28]"
                    size="lg"
                  >
                    Continuer vers le paiement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Select Payment Method */}
            {currentStep === 'method' && (
              <div className="space-y-6">
                <PaymentMethodSelector
                  selectedMethod={selectedMethod}
                  onSelect={handleMethodSelect}
                  orderAmount={mockOrder.totalAmount}
                />

                {selectedMethod && paymentId && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCurrentStep('payment')}
                      className="bg-[#006233] hover:bg-[#004d28]"
                      size="lg"
                    >
                      Continuer avec cette méthode
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment Form */}
            {currentStep === 'payment' && paymentId && (
              <div className="space-y-6">
                {/* Method indicator */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CreditCard className="h-4 w-4" />
                  <span>Paiement par: {getMethodName(selectedMethod!)}</span>
                  <button
                    onClick={() => setCurrentStep('method')}
                    className="ml-auto text-[#006233] hover:underline"
                  >
                    Changer
                  </button>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Erreur</p>
                        <p className="text-sm text-red-700">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Forms */}
                {selectedMethod === 'CIB' && (
                  <CIBCardForm
                    paymentId={paymentId}
                    amount={totalWithFee}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    isProcessing={paymentStatus === 'processing'}
                  />
                )}

                {selectedMethod === 'CCP' && (
                  <CCPPaymentForm
                    paymentId={paymentId}
                    amount={totalWithFee}
                    onInitiateSuccess={(result) => console.log('CCP initiated:', result)}
                    onConfirmSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                )}

                {selectedMethod === 'BARIDIMOB' && (
                  <BaridiMobForm
                    paymentId={paymentId}
                    amount={totalWithFee}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                )}

                {selectedMethod === 'BANK_TRANSFER' && (
                  <BankTransferForm
                    paymentId={paymentId}
                    amount={totalWithFee}
                    onInitiateSuccess={(result) => console.log('Bank transfer initiated:', result)}
                    onUploadSuccess={(result) => {
                      console.log('Receipt uploaded:', result)
                      setPaymentStatus('success')
                      setReceiptData({
                        orderNumber: mockOrder.orderNumber,
                        paymentReference: result.receiptUrl || '',
                        amount: mockOrder.totalAmount,
                        currency: mockOrder.currency,
                        paymentMethod: 'BANK_TRANSFER',
                        status: 'PENDING_VERIFICATION',
                        buyerName: 'Client Démo',
                        companyName: mockOrder.company.name,
                        items: mockOrder.items,
                      })
                      setTimeout(() => setCurrentStep('confirmation'), 1000)
                    }}
                    onError={handlePaymentError}
                  />
                )}

                {selectedMethod === 'COD' && (
                  <Card className="max-w-lg mx-auto">
                    <CardContent className="py-8 text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-semibold">Paiement à la Livraison</h3>
                      <p className="text-gray-500">
                        Vous paierez en espèces lorsque vous recevrez votre commande.
                      </p>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg text-left">
                        <p className="text-sm font-medium text-yellow-800">Frais de service:</p>
                        <p className="text-lg font-bold text-yellow-900">+{formatDZD(codFee)}</p>
                      </div>

                      <Button
                        onClick={() => {
                          setPaymentStatus('success')
                          setReceiptData({
                            orderNumber: mockOrder.orderNumber,
                            paymentReference: `COD-${Date.now()}`,
                            amount: totalWithFee,
                            currency: mockOrder.currency,
                            paymentMethod: 'COD',
                            status: 'PENDING',
                            buyerName: 'Client Démo',
                            companyName: mockOrder.company.name,
                          })
                          setTimeout(() => setCurrentStep('confirmation'), 1000)
                        }}
                        className="w-full bg-[#006233] hover:bg-[#004d28]"
                        size="lg"
                      >
                        Confirmer la commande
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 'confirmation' && (
              <div className="space-y-6">
                {/* Success Animation */}
                <div className="text-center py-8">
                  <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-700">
                    {paymentStatus === 'success' ? 'Paiement réussi !' : 'Commande confirmée !'}
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Votre commande a été enregistrée avec succès.
                  </p>
                </div>

                {/* Receipt */}
                {receiptData && (
                  <ReceiptGenerator data={receiptData} showActions={true} />
                )}

                {/* Next Actions */}
                <Card>
                  <CardContent className="py-6 space-y-4">
                    <h3 className="font-semibold">Prochaines étapes</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Confirmation envoyée</p>
                          <p className="text-sm text-gray-500">
                            Un email de confirmation a été envoyé à votre adresse.
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Préparation de la commande</p>
                          <p className="text-sm text-gray-500">
                            Le fournisseur va préparer vos articles pour l&apos;expédition.
                          </p>
                        </div>
                      </li>
                    </ul>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/buyer/orders')}
                        className="flex-1"
                      >
                        Mes commandes
                      </Button>
                      <Button
                        onClick={() => router.push('/')}
                        className="flex-1 bg-[#006233] hover:bg-[#004d28]"
                      >
                        Continuer mes achats
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Résumé de la commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Commande</span>
                    <span className="font-mono font-medium">{mockOrder.orderNumber}</span>
                  </div>
                  
                  <Separator />

                  <div className="space-y-2">
                    {mockOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate mr-2">
                          {item.name.slice(0, 30)}...
                          <span className="text-gray-400">×{item.quantity}</span>
                        </span>
                        <span className="shrink-0">{formatDZD(item.total)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sous-total</span>
                      <span>{formatDZD(mockOrder.totalAmount)}</span>
                    </div>
                    
                    {codFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Frais COD</span>
                        <span className="text-orange-600">+{formatDZD(codFee)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Livraison</span>
                      <span className="text-green-600">Gratuite</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#006233]">{formatDZD(totalWithFee)}</span>
                  </div>

                  {selectedMethod && (
                    <div className="pt-2 text-xs text-gray-400 text-center">
                      Méthode: {getMethodName(selectedMethod)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3">
                <TrustBadge icon={<ShieldCheck className="h-5 w-5" />} label="Paiement sécurisé" />
                <TrustBadge icon={<LockIcon />} label="Données protégées" />
                <TrustBadge icon={<RefreshIcon />} label="Remboursement garanti" />
                <TrustBadge icon={<SupportIcon />} label="Support 24/7" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

// Sub-components
function ProgressSteps({ currentStep }: { currentStep: CheckoutStep }) {
  const steps = [
    { id: 'review', label: 'Récapitulatif' },
    { id: 'method', label: 'Méthode' },
    { id: 'payment', label: 'Paiement' },
    { id: 'confirmation', label: 'Confirmation' },
  ]

  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-2 shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
              index < currentIndex && "bg-green-500 text-white",
              index === currentIndex && "bg-[#006233] text-white ring-4 ring-[#006233]/20",
              index > currentIndex && "bg-gray-200 text-gray-500"
            )}>
              {index < currentIndex ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : index + 1}
            </div>
            <span className={cn(
              "hidden md:inline text-xs font-medium",
              index <= currentIndex ? "text-[#006233]" : "text-gray-400"
            )}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "hidden sm:block h-0.5 w-8",
              index < currentIndex ? "bg-green-500" : "bg-gray-200"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
      <span className="text-[#006233]">{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function SupportIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function getMethodName(method: PaymentMethodType): string {
  const names: Record<PaymentMethodType, string> = {
    CIB: 'Carte Bancaire (CIB)',
    CCP: 'Chèque Postale (CCP)',
    BARIDIMOB: 'BaridiMob',
    BANK_TRANSFER: 'Virement Bancaire',
    COD: 'Paiement à la Livraison',
  }
  return names[method]
}
