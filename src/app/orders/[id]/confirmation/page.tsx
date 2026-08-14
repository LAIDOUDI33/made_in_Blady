'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package,
  ArrowLeft,
  Download,
  Printer,
  Home,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn, formatDZD } from '@/lib/utils'
import {
  PaymentStatusTracker,
  ReceiptGenerator,
  type PaymentStatus,
} from '@/components/payments'

// Mock data - in real app would come from API based on order ID
const mockOrderData = {
  id: 'order_demo_001',
  orderNumber: 'ORD-2024-001234',
  totalAmount: 125000,
  currency: 'DZD',
  status: 'CONFIRMED',
  items: [
    { name: "Huile d'olive extra vierge - Bidon 5L", quantity: 10, unitPrice: 8500, total: 85000 },
    { name: 'Dates Deglet Nour - Carton 10kg', quantity: 2, unitPrice: 20000, total: 40000 },
  ],
  company: {
    name: 'Algeria Foods Export',
    email: 'contact@algeriafoods.dz',
    phone: '+213 555 123 456',
  },
  deliveryAddress: '123 Rue Didouche Mourad, Alger Centre',
  deliveryWilaya: 'Alger (16)',
  createdAt: new Date(),
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment') || ''
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('COMPLETED')
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading payment status
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      // In real app, fetch status from /api/payments/[paymentId]/status
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [paymentId])

  // Mock receipt data
  const receiptData = {
    orderNumber: mockOrderData.orderNumber,
    paymentReference: `PAY-${Date.now()}`,
    transactionId: `txn_${Math.random().toString(36).substring(2, 14)}`,
    amount: mockOrderData.totalAmount,
    currency: mockOrderData.currency,
    paymentMethod: 'CIB',
    status: paymentStatus,
    paidAt: new Date(),
    buyerName: 'Client Démo',
    buyerEmail: 'client@entreprise.dz',
    companyName: mockOrderData.company.name,
    items: mockOrderData.items,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Confirmation de Commande</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Status Banner */}
        <Card className={cn(
          "border-l-4",
          paymentStatus === 'COMPLETED' && "border-l-green-500",
          paymentStatus === 'PENDING' && "border-l-yellow-500",
          paymentStatus === 'FAILED' && "border-l-red-500"
        )}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-full",
                paymentStatus === 'COMPLETED' && "bg-green-100",
                paymentStatus === 'PENDING' && "bg-yellow-100",
                paymentStatus === 'FAILED' && "bg-red-100"
              )}>
                {paymentStatus === 'COMPLETED' && (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                )}
                {paymentStatus === 'PENDING' && (
                  <Clock className="h-8 w-8 text-yellow-600" />
                )}
                {paymentStatus === 'FAILED' && (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              
              <div className="flex-1">
                <h2 className={cn(
                  "text-xl font-bold",
                  paymentStatus === 'COMPLETED' && "text-green-800",
                  paymentStatus === 'PENDING' && "text-yellow-800",
                  paymentStatus === 'FAILED' && "text-red-800"
                )}>
                  {paymentStatus === 'COMPLETED' && 'Commande confirmée avec succès !'}
                  {paymentStatus === 'PENDING' && 'Votre commande est en attente'}
                  {paymentStatus === 'FAILED' && 'Le paiement a échoué'}
                </h2>
                <p className={cn(
                  "mt-1",
                  paymentStatus === 'COMPLETED' && "text-green-700",
                  paymentStatus === 'PENDING' && "text-yellow-700",
                  paymentStatus === 'FAILED' && "text-red-700"
                )}>
                  {paymentStatus === 'COMPLETED' && 'Merci pour votre achat. Vous recevrez un email de confirmation sous peu.'}
                  {paymentStatus === 'PENDING' && 'Nous traitons actuellement votre paiement. Vous serez notifié dès qu\'il sera validé.'}
                  {paymentStatus === 'FAILED' && 'Une erreur est survenue lors du traitement. Veuillez réessayer ou contacter le support.'}
                </p>
              </div>

              {paymentStatus === 'COMPLETED' && (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Payé
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-[#006233]" />
                Détails de la commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">N° Commande</p>
                  <p className="font-mono font-medium">{mockOrderData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">{new Date().toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</p>
                </div>
                <div>
                  <p className="text-gray-500">Statut</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Confirmée
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold text-[#006233]">{formatDZD(mockOrderData.totalAmount)}</p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Articles commandés</h4>
                {mockOrderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} × {formatDZD(item.unitPrice)}</p>
                    </div>
                    <p className="font-semibold text-sm">{formatDZD(item.total)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Delivery Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Livraison</h4>
                <p className="text-sm text-gray-600">{mockOrderData.deliveryAddress}</p>
                <p className="text-xs text-gray-400">{mockOrderData.deliveryWilaya}</p>
              </div>

              {/* Supplier Info */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">Fournisseur</h4>
                <p className="font-medium text-sm">{mockOrderData.company.name}</p>
                <p className="text-xs text-gray-500">{mockOrderData.company.email}</p>
                <p className="text-xs text-gray-500">{mockOrderData.company.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Receipt */}
          <div className="space-y-6">
            {/* Payment Status Tracker */}
            {!isLoading && (
              <PaymentStatusTracker
                status={paymentStatus}
                paymentMethod="CIB"
                amount={mockOrderData.totalAmount}
                referenceNumber={receiptData.paymentReference}
                transactionId={receiptData.transactionId}
                paidAt={receiptData.paidAt}
                onRetry={() => console.log('Retry payment')}
                onDownloadReceipt={() => {}}
              />
            )}

            {/* Receipt */}
            <ReceiptGenerator data={receiptData} showActions={true} />

            {/* Action Buttons */}
            <Card>
              <CardContent className="py-4 space-y-3">
                <h4 className="font-medium text-sm">Actions disponibles</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Suivre la commande
                  </Button>
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Facture proforma
                  </Button>
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer
                  </Button>
                  
                  <Button variant="outline" className="w-full" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </div>

                <Separator />

                <Button className="w-full bg-[#006233] hover:bg-[#004d28]" asChild>
                  <a href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Retour à l'accueil
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-blue-900">Besoin d'aide ?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Notre équipe support est disponible pour répondre à vos questions.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  FAQ
                </Button>
                <Button size="sm" className="bg-[#006233] hover:bg-[#004d28]">
                  Contacter le support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
