'use client'

import React from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Download,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDZD } from '@/lib/utils'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PENDING_VERIFICATION' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'

interface StatusStep {
  id: string
  label: string
  description: string
  status: 'pending' | 'current' | 'completed' | 'error'
}

interface PaymentStatusTrackerProps {
  status: PaymentStatus
  paymentMethod?: string
  amount?: number
  referenceNumber?: string
  transactionId?: string
  paidAt?: Date | string
  failureReason?: string
  onRetry?: () => void
  onDownloadReceipt?: () => void
  showActions?: boolean
}

const statusConfig: Record<PaymentStatus, {
  color: string
  bgColor: string
  icon: React.ReactNode
  label: string
  description: string
}> = {
  PENDING: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <Clock className="h-6 w-6" />,
    label: 'En attente',
    description: 'Votre paiement est en attente de traitement',
  },
  PROCESSING: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <Loader2 className="h-6 w-6 animate-spin" />,
    label: 'En cours de traitement',
    description: 'Votre paiement est en cours de validation',
  },
  PENDING_VERIFICATION: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: <Clock className="h-6 w-6" />,
    label: 'En attente de vérification',
    description: 'Votre preuve a été reçue et est en cours de vérification par notre équipe',
  },
  COMPLETED: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className="h-6 w-6" />,
    label: 'Paiement réussi',
    description: 'Votre paiement a été traité avec succès',
  },
  FAILED: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: <XCircle className="h-6 w-6" />,
    label: 'Échec du paiement',
    description: 'Le paiement n\'a pas pu être traité',
  },
  REFUNDED: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: <RefreshCw className="h-6 w-6" />,
    label: 'Remboursé',
    description: 'Votre paiement a été remboursé',
  },
  CANCELLED: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: <XCircle className="h-6 w-6" />,
    label: 'Annulé',
    description: 'Ce paiement a été annulé',
  },
}

export function PaymentStatusTracker({
  status,
  paymentMethod = '',
  amount = 0,
  referenceNumber = '',
  transactionId = '',
  paidAt,
  failureReason,
  onRetry,
  onDownloadReceipt,
  showActions = true,
}: PaymentStatusTrackerProps) {
  const config = statusConfig[status]
  
  // Generate status steps based on payment method and current status
  const getStatusSteps = (): StatusStep[] => {
    const baseSteps: StatusStep[] = [
      {
        id: 'created',
        label: 'Créé',
        description: 'Paiement initialisé',
        status: ['PROCESSING', 'PENDING_VERIFICATION', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'].includes(status) ? 'completed' : 'current',
      },
      {
        id: 'processing',
        label: 'Traitement',
        description: 'Validation en cours',
        status: 'PENDING' ? 'pending' :
               ['PENDING_VERIFICATION', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status) ? 'completed' :
               status === 'PROCESSING' ? 'current' : 'pending',
      },
    ]

    // Add verification step for CCP/Bank Transfer
    if (['CCP', 'BANK_TRANSFER'].includes(paymentMethod)) {
      baseSteps.push({
        id: 'verification',
        label: 'Vérification',
        description: 'Preuve en cours de validation',
        status: ['COMPLETED', 'FAILED', 'REFUNDED'].includes(status) ? 'completed' :
               status === 'PENDING_VERIFICATION' ? 'current' : 'pending',
      })
    }

    // Final status
    if (status === 'COMPLETED') {
      baseSteps.push({
        id: 'completed',
        label: 'Complété',
        description: 'Paiement confirmé',
        status: 'completed',
      })
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      baseSteps.push({
        id: 'failed',
        label: status === 'FAILED' ? 'Échec' : 'Annulé',
        description: failureReason || 'Transaction échouée',
        status: 'error',
      })
    }

    return baseSteps
  }

  const steps = getStatusSteps()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>Statut du Paiement</span>
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            config.color.replace('text-', 'bg-').replace('-600', '-100'),
            config.color
          )}>
            {config.label}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Status Display */}
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-lg",
          config.bgColor
        )}>
          <div className={cn("p-3 rounded-full", config.bgColor)}>
            <span className={config.color}>{config.icon}</span>
          </div>
          <div className="flex-1">
            <p className={cn("font-semibold", config.color)}>{config.label}</p>
            <p className="text-sm text-gray-600 mt-0.5">{config.description}</p>
          </div>
        </div>

        {/* Failure Reason */}
        {(status === 'FAILED' || status === 'CANCELLED') && failureReason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-800">Raison:</p>
                <p className="text-sm text-red-700">{failureReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Historique</h4>
          
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
            
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4 relative">
                  {/* Step indicator */}
                  <div className={cn(
                    "relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2",
                    step.status === 'completed' && "bg-green-500 border-green-500 text-white",
                    step.status === 'current' && "bg-white border-blue-500 text-blue-500",
                    step.status === 'pending' && "bg-white border-gray-300 text-gray-400",
                    step.status === 'error' && "bg-red-500 border-red-500 text-white"
                  )}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : step.status === 'current' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : step.status === 'error' ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <span className="h-2 w-2 bg-gray-300 rounded-full" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="pt-0.5">
                    <p className={cn(
                      "font-medium",
                      step.status === 'completed' && "text-green-700",
                      step.status === 'current' && "text-blue-700",
                      step.status === 'pending' && "text-gray-400",
                      step.status === 'error' && "text-red-700"
                    )}>
                      {step.label}
                    </p>
                    <p className={cn(
                      "text-sm",
                      step.status === 'pending' ? "text-gray-400" : "text-gray-600"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Détails du paiement</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Méthode</p>
              <p className="font-medium">{getMethodName(paymentMethod)}</p>
            </div>
            <div>
              <p className="text-gray-500">Montant</p>
              <p className="font-semibold">{formatDZD(amount)}</p>
            </div>
            {referenceNumber && (
              <div>
                <p className="text-gray-500">Référence</p>
                <p className="font-mono font-medium text-xs">{referenceNumber}</p>
              </div>
            )}
            {transactionId && (
              <div>
                <p className="text-gray-500">Transaction ID</p>
                <p className="font-mono font-medium text-xs">{transactionId.slice(0, 16)}...</p>
              </div>
            )}
            {paidAt && status === 'COMPLETED' && (
              <div>
                <p className="text-gray-500">Payé le</p>
                <p className="font-medium">{new Date(paidAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {status === 'FAILED' && onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
            )}

            {status === 'COMPLETED' && onDownloadReceipt && (
              <Button
                onClick={onDownloadReceipt}
                className="gap-2 bg-[#006233] hover:bg-[#004d28]"
              >
                <Download className="h-4 w-4" />
                Télécharger le reçu
              </Button>
            )}

            {['PENDING_VERIFICATION', 'PROCESSING'].includes(status) && (
              <div className="flex items-center gap-2 text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Veuillez patienter pendant que nous traitons votre demande...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to get method display name
function getMethodName(method: string): string {
  const names: Record<string, string> = {
    CIB: 'Carte Bancaire (CIB)',
    CCP: 'Chèque Postale (CCP)',
    BARIDIMOB: 'BaridiMob',
    BANK_TRANSFER: 'Virement Bancaire',
    COD: 'Paiement à la Livraison',
  }
  return names[method] || method
}

export default PaymentStatusTracker
