'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  Printer
} from 'lucide-react'
import { formatDZD } from '@/lib/payments/installments/config'
import type { DPAgreementDetails, DPAInstallmentDetail } from '@/lib/payments/installments/manager'

interface InstallmentScheduleViewProps {
  agreement: DPAgreementDetails
  onMakePayment?: (installmentNumber: number) => void
  printable?: boolean
}

export function InstallmentScheduleView({
  agreement,
  onMakePayment,
  printable = false,
}: InstallmentScheduleViewProps) {
  const [selectedInstallment, setSelectedInstallment] = useState<DPAInstallmentDetail | null>(null)
  
  const paidCount = agreement.installments.filter(i => i.status === 'PAID').length
  const overdueCount = agreement.installments.filter(i => i.status === 'OVERDUE').length
  const pendingCount = agreement.installments.filter(i => i.status === 'PENDING').length
  const progressPercent = Math.round((paidCount / agreement.totalInstallments) * 100)
  
  // Group installments by status for timeline view
  const pastInstallments = agreement.installments.filter(
    i => ['PAID', 'WAIVED', 'PARTIAL'].includes(i.status)
  )
  const currentAndFuture = agreement.installments.filter(
    i => !['PAID', 'WAIVED', 'PARTIAL'].includes(i.status)
  )

  return (
    <div className={`space-y-6 ${printable ? 'print:p-0' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Échéancier de Paiement
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Accord #{agreement.agreementNumber} • Plan: {agreement.totalInstallments} mois
          </p>
        </div>
        
        {!printable && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs text-muted-foreground">Payés</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">À venir</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">En retard</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{progressPercent}%</p>
            <p className="text-xs text-muted-foreground">Progression</p>
            <Progress value={progressPercent} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vue Timeline</CardTitle>
          <CardDescription>Visualisation chronologique des paiements</CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineView 
            installments={agreement.installments}
            onSelectInstallment={setSelectedInstallment}
            onMakePayment={onMakePayment}
          />
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail des Échéances</CardTitle>
          <CardDescription>Cliquez sur une échéance pour voir les détails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium">N°</th>
                  <th className="text-left p-3 font-medium">Date d&apos;échéance</th>
                  <th className="text-right p-3 font-medium">Montant</th>
                  <th className="text-right p-3 font-medium">Principal</th>
                  <th className="text-right p-3 font-medium">Intérêt</th>
                  <th className="text-center p-3 font-medium">Statut</th>
                  <th className="text-right p-3 font-medium">Pénalité</th>
                  <th className="text-center p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {agreement.installments.map((installment) => (
                  <tr 
                    key={installment.id}
                    className={`
                      border-b transition-colors cursor-pointer hover:bg-slate-50
                      ${selectedInstallment?.id === installment.id ? 'bg-primary/5' : ''}
                    `}
                    onClick={() => setSelectedInstallment(installment)}
                  >
                    <td className="p-3 font-mono">{installment.installmentNumber}</td>
                    <td className="p-3">
                      {new Date(installment.dueDate).toLocaleDateString('fr-DZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {formatDZD(installment.amount)}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {formatDZD(installment.principalPortion)}
                    </td>
                    <td className="p-3 text-right font-mono text-orange-600">
                      {formatDZD(installment.interestPortion)}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={installment.status} />
                    </td>
                    <td className="p-3 text-right font-mono">
                      {installment.lateFeeApplied > 0 ? (
                        <span className="text-red-600 font-semibold">
                          +{formatDZD(installment.lateFeeApplied)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {(installment.status === 'PENDING' || installment.status === 'OVERDUE') && onMakePayment ? (
                        <Button 
                          size="sm" 
                          variant={installment.status === 'OVERDUE' ? 'destructive' : 'default'}
                          onClick={(e) => {
                            e.stopPropagation()
                            onMakePayment(installment.installmentNumber)
                          }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Payer
                        </Button>
                      ) : installment.status === 'PAID' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
              
              {/* Totals Row */}
              <tfoot className="bg-slate-100 font-semibold">
                <tr>
                  <td colSpan={2} className="p-3">TOTAL</td>
                  <td className="p-3 text-right font-mono">
                    {formatDZD(agreement.installments.reduce((sum, i) => sum + i.amount, 0))}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {formatDZD(agreement.installments.reduce((sum, i) => sum + i.principalPortion, 0))}
                  </td>
                  <td className="p-3 text-right font-mono text-orange-600">
                    +{formatDZD(agreement.installments.reduce((sum, i) => sum + i.interestPortion, 0))}
                  </td>
                  <td colSpan={2}></td>
                  <td className="p-3 text-right font-mono text-red-600">
                    +{formatDZD(agreement.installments.reduce((sum, i) => sum + i.lateFeeApplied, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Selected Installment Detail */}
      {selectedInstallment && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Détails de l&apos;Échéance #{selectedInstallment.installmentNumber}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedInstallment(null)}
              >
                Fermer
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InstallmentDetail installment={selectedInstallment} />
          </CardContent>
        </Card>
      )}

      {/* Payment Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Payé</p>
              <p className="text-xl font-bold text-green-600">
                {formatDZD(calculateTotalPaid(agreement))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reste à Payer</p>
              <p className="text-xl font-bold text-primary">
                {formatDZD(calculateRemainingBalance(agreement))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prochaine Échéance</p>
              <p className="text-xl font-bold">
                {getNextDueDate(agreement)?.toLocaleDateString('fr-DZ') || '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// Timeline Component
// ============================================

interface TimelineViewProps {
  installments: DPAInstallmentDetail[]
  onSelectInstallment: (inst: DPAInstallmentDetail) => void
  onMakePayment?: (num: number) => void
}

function TimelineView({ installments, onSelectInstallment, onMakePayment }: TimelineViewProps) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
      
      <div className="space-y-4">
        {installments.map((installment, index) => {
          const isPaid = installment.status === 'PAID'
          const isOverdue = installment.status === 'OVERDUE'
          const isPending = installment.status === 'PENDING'
          
          return (
            <div 
              key={installment.id} 
              className="relative flex items-start gap-4 pl-0 sm:pl-0"
            >
              {/* Timeline Node */}
              <div className={`
                relative z-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0
                ${isPaid ? 'bg-green-100 border-2 border-green-500' :
                  isOverdue ? 'bg-red-100 border-2 border-red-500' :
                  isPending ? 'bg-blue-100 border-2 border-blue-300' :
                  'bg-gray-100 border-2 border-gray-300'}
              `}>
                {isPaid ? (
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                ) : isOverdue ? (
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                ) : (
                  <Clock className={`h-7 w-7 ${isPending ? 'text-blue-500' : 'text-gray-400'}`} />
                )}
                
                <span className="absolute -bottom-1 text-xs font-bold text-muted-foreground">
                  #{installment.installmentNumber}
                </span>
              </div>

              {/* Content */}
              <div 
                className={`
                  flex-1 p-4 rounded-lg border cursor-pointer transition-all
                  ${isPaid ? 'bg-green-50 border-green-200' :
                    isOverdue ? 'bg-red-50 border-red-200' :
                    isPending ? 'bg-blue-50 border-blue-200 hover:border-blue-400' :
                    'bg-gray-50 border-gray-200'}
                `}
                onClick={() => onSelectInstallment(installment)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {new Date(installment.dueDate).toLocaleDateString('fr-DZ', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Principal: {formatDZD(installment.principalPortion)} + 
                      Intérêt: {formatDZD(installment.interestPortion)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold">{formatDZD(installment.amount)}</p>
                    
                    <StatusBadge status={installment.status} />
                    
                    {(isPending || isOverdue) && onMakePayment && (
                      <Button 
                        size="sm"
                        variant={isOverdue ? 'destructive' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation()
                          onMakePayment(installment.installmentNumber)
                        }}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Payer
                      </Button>
                    )}
                  </div>
                </div>
                
                {installment.lateFeeApplied > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <p className="text-sm text-red-600">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Pénalité de retard: +{formatDZD(installment.lateFeeApplied)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// Helper Components
// ============================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'En attente', class: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Payé', class: 'bg-green-100 text-green-700' },
    PARTIAL: { label: 'Partiel', class: 'bg-yellow-100 text-yellow-700' },
    OVERDUE: { label: 'En retard', class: 'bg-red-100 text-red-700' },
    WAIVED: { label: 'Annulé', class: 'bg-gray-100 text-gray-600' },
  }
  
  const { label, class: className } = config[status] || { label: status, class: '' }
  return <Badge variant="secondary" className={className}>{label}</Badge>
}

function InstallmentDetail({ installment }: { installment: DPAInstallmentDetail }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Numéro</p>
        <p className="font-semibold">Échéance #{installment.installmentNumber}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Date d&apos;échéance</p>
        <p className="font-semibold">
          {new Date(installment.dueDate).toLocaleDateString('fr-DZ')}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Montant Total</p>
        <p className="font-bold text-lg">{formatDZD(installment.amount)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Statut</p>
        <StatusBadge status={installment.status} />
      </div>
      
      <div>
        <p className="text-xs text-muted-foreground">Part Principal</p>
        <p className="font-semibold">{formatDZD(installment.principalPortion)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Part Intérêt</p>
        <p className="font-semibold text-orange-600">{formatDZD(installment.interestPortion)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Déjà Payé</p>
        <p className="font-semibold">{formatDZD(installment.paidAmount)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Pénalités</p>
        <p className={`font-semibold ${installment.lateFeeApplied > 0 ? 'text-red-600' : ''}`}>
          {installment.lateFeeApplied > 0 ? formatDZD(installment.lateFeeApplied) : 'Aucune'}
        </p>
      </div>
      
      {installment.paidAt && (
        <div className="col-span-2 md:col-span-4 pt-2 border-t mt-2">
          <p className="text-xs text-muted-foreground">
            Payé le {new Date(installment.paidAt).toLocaleDateString('fr-DZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Utility Functions
// ============================================

function calculateTotalPaid(agreement: DPAgreementDetails): number {
  return agreement.installments
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.paidAmount, 0)
}

function calculateRemainingBalance(agreement: DPAgreementDetails): number {
  return agreement.installments
    .filter(i => !['PAID', 'WAIVED'].includes(i.status))
    .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0)
}

function getNextDueDate(agreement: DPAgreementDetails): Date | null {
  const pending = agreement.installments.find(i => 
    ['PENDING', 'OVERDUE'].includes(i.status)
  )
  return pending ? new Date(pending.dueDate) : null
}

export default InstallmentScheduleView
