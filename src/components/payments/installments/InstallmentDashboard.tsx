'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CalendarDays,
  CreditCard,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  Calculator,
  FileText,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { formatDZD } from '@/lib/payments/installments/config'
import type { DPAgreementDetails, DPAInstallmentDetail } from '@/lib/payments/installments/manager'

interface InstallmentDashboardProps {
  agreements: DPAgreementDetails[]
  isLoading?: boolean
  onMakePayment?: (agreementId: string, installmentNumber?: number) => void
  onViewSchedule?: (agreementId: string) => void
  onEarlySettle?: (agreementId: string) => void
}

export function InstallmentDashboard({
  agreements,
  isLoading = false,
  onMakePayment,
  onViewSchedule,
  onEarlySettle,
}: InstallmentDashboardProps) {
  const [selectedAgreement, setSelectedAgreement] = useState<DPAgreementDetails | null>(null)
  
  // Calculate summary stats
  const activeAgreements = agreements.filter(a => 
    ['ACTIVE', 'DELINQUENT'].includes(a.status)
  )
  
  const totalRemaining = activeAgreements.reduce((sum, a) => {
    const remaining = calculateRemainingBalance(a)
    return sum + remaining
  }, 0)

  const nextPayment = getNextPayment(agreements)
  const overdueCount = agreements.filter(a => a.status === 'DELINQUENT').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Chargement de vos accords DPA...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accords Actifs</p>
                <p className="text-2xl font-bold">{activeAgreements.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reste à Payer</p>
                <p className="text-xl font-bold">{formatDZD(totalRemaining)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prochain Paiement</p>
                <p className="text-lg font-bold">
                  {nextPayment ? formatDZD(nextPayment.amount) : '-'}
                </p>
                {nextPayment && (
                  <p className="text-xs text-muted-foreground">
                    Le {new Date(nextPayment.dueDate).toLocaleDateString('fr-DZ')}
                  </p>
                )}
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <CalendarDays className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Retard</p>
                <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : ''}`}>
                  {overdueCount}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${overdueCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payment Alert */}
      {nextPayment && (
        <Card className={`
          border-l-4 ${
            isOverdue(nextPayment.dueDate) ? 'border-l-red-500 bg-red-50' :
            isDueSoon(nextPayment.dueDate) ? 'border-l-orange-500 bg-orange-50' :
            'border-l-blue-500 bg-blue-50'
          }
        `}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isOverdue(nextPayment.dueDate) ? (
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                ) : (
                  <Clock className="h-6 w-6 text-blue-500" />
                )}
                <div>
                  <p className="font-medium">
                    {isOverdue(nextPayment.dueDate) 
                      ? 'Paiement en retard' 
                      : isDueSoon(nextPayment.dueDate)
                        ? 'Paiement imminent'
                        : 'Prochain paiement'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDZD(nextPayment.amount)} - Échéance:{' '}
                    {new Date(nextPayment.dueDate).toLocaleDateString('fr-DZ')}
                  </p>
                </div>
              </div>
              
              {onMakePayment && nextPayment.agreementId && (
                <Button onClick={() => onMakePayment(nextPayment.agreementId!, nextPayment.installmentNumber)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer Maintenant
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agreements List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Accords de Paiement Différé</CardTitle>
          <CardDescription>
            Historique et statut de tous vos accords DPA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agreements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun accord DPA trouvé</p>
              <p className="text-sm mt-1">
                Vous pouvez demander un paiement différé lors de votre prochaine commande.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agreements.map((agreement) => (
                <AgreementCard
                  key={agreement.id}
                  agreement={agreement}
                  onMakePayment={onMakePayment}
                  onViewSchedule={onViewSchedule}
                  onEarlySettle={onEarlySettle}
                  onSelect={() => setSelectedAgreement(agreement)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agreement Detail Dialog */}
      <Dialog open={!!selectedAgreement} onOpenChange={() => setSelectedAgreement(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAgreement && (
            <>
              <DialogHeader>
                <DialogTitle>Détail de l&apos;Accord DPA</DialogTitle>
                <DialogDescription>
                  N° {selectedAgreement.agreementNumber}
                </DialogDescription>
              </DialogHeader>
              
              <AgreementDetailView agreement={selectedAgreement} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// Sub Components
// ============================================

interface AgreementCardProps {
  agreement: DPAgreementDetails
  onMakePayment?: (agreementId: string, installmentNumber?: number) => void
  onViewSchedule?: (agreementId: string) => void
  onEarlySettle?: (agreementId: string) => void
  onSelect: () => void
}

function AgreementCard({
  agreement,
  onMakePayment,
  onViewSchedule,
  onEarlySettle,
  onSelect,
}: AgreementCardProps) {
  const statusConfig = getStatusConfig(agreement.status)
  const progress = getProgressPercent(agreement)
  const remainingBalance = calculateRemainingBalance(agreement)
  const nextDue = getNextPaymentForAgreement(agreement)

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold">Accord #{agreement.agreementNumber.slice(-8)}</h4>
              <Badge variant="secondary" className={statusConfig.badgeClass}>
                {statusConfig.label}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Montant:</span>{' '}
                <span className="font-medium">{formatDZD(agreement.principalAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plan:</span>{' '}
                <span className="font-medium">{agreement.totalInstallments} mois</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mensualité:</span>{' '}
                <span className="font-medium">{formatDZD(agreement.installmentAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reste:</span>{' '}
                <span className="font-medium">{formatDZD(remainingBalance)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progression</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
            {nextDue && ['ACTIVE', 'DELINQUENT'].includes(agreement.status) && (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMakePayment?.(agreement.id, nextDue.installmentNumber)
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payer {formatDZD(nextDue.amount)}
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onViewSchedule?.(agreement.id)
              }}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Voir le Calendrier
            </Button>

            {['ACTIVE', 'DELINQUENT'].includes(agreement.status) && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEarlySettle?.(agreement.id)
                }}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Règlement Anticipé
              </Button>
            )}

            <Button size="sm" variant="ghost" asChild>
              <a onClick={(e) => e.stopPropagation()} href="#" className="flex items-center">
                Détails
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AgreementDetailView({ agreement }: { agreement: DPAgreementDetails }) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'payments' | 'documents'>('schedule')

  return (
    <div className="space-y-6 mt-4">
      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-muted-foreground">Principal</p>
          <p className="font-bold">{formatDZD(agreement.principalAmount)}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-muted-foreground">Intérêt Total</p>
          <p className="font-bold text-orange-600">
            +{formatDZD(agreement.totalAmount - agreement.principalAmount - agreement.adminFee - (agreement.insurancePremium ?? 0))}
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-muted-foreground">Frais Admin</p>
          <p className="font-bold">{formatDZD(agreement.adminFee)}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-bold text-primary">{formatDZD(agreement.totalAmount)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'schedule' as const, label: 'Échéancier', icon: CalendarDays },
          { id: 'payments' as const, label: 'Paiements', icon: CreditCard },
          { id: 'documents' as const, label: 'Documents', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            className={`
              px-4 py-2 flex items-center gap-2 border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'}
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Intérêt</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Retard</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agreement.installments.map(installment => (
              <TableRow key={installment.id}>
                <TableCell>{installment.installmentNumber}</TableCell>
                <TableCell>
                  {new Date(installment.dueDate).toLocaleDateString('fr-DZ')}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatDZD(installment.amount)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatDZD(installment.principalPortion)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatDZD(installment.interestPortion)}
                </TableCell>
                <TableCell>
                  <InstallmentStatusBadge status={installment.status} />
                </TableCell>
                <TableCell className="text-right font-mono">
                  {installment.lateFeeApplied > 0 ? (
                    <span className="text-red-600">+{formatDZD(installment.lateFeeApplied)}</span>
                  ) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-3">
          {agreement.documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucun document</p>
          ) : (
            agreement.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">{doc.documentType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DocumentStatusBadge status={doc.status} />
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>L&apos;historique des paiements sera disponible ici</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Helper Components & Functions
// ============================================

function InstallmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'En attente', class: 'bg-gray-100 text-gray-700' },
    PAID: { label: 'Payé', class: 'bg-green-100 text-green-700' },
    PARTIAL: { label: 'Partiel', class: 'bg-yellow-100 text-yellow-700' },
    OVERDUE: { label: 'En retard', class: 'bg-red-100 text-red-700' },
    WAIVED: { label: 'Annulé', class: 'bg-blue-100 text-blue-700' },
  }
  
  const { label, class: className } = config[status] || { label: status, class: '' }
  return <Badge variant="secondary" className={className}>{label}</Badge>
}

function DocumentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'En attente', class: 'bg-yellow-100 text-yellow-700' },
    VERIFIED: { label: 'Vérifié', class: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Rejeté', class: 'bg-red-100 text-red-700' },
  }
  
  const { label, class: className } = config[status] || { label: status, class: '' }
  return <Badge variant="secondary" className={className}>{label}</Badge>
}

function getStatusConfig(status: string): { label: string; badgeClass: string } {
  const configs: Record<string, { label: string; badgeClass: string }> = {
    DRAFT: { label: 'Brouillon', badgeClass: 'bg-gray-100 text-gray-700' },
    PENDING_APPROVAL: { label: 'En attente', badgeClass: 'bg-yellow-100 text-yellow-700' },
    PENDING_DOCUMENTS: { label: 'Documents requis', badgeClass: 'bg-orange-100 text-orange-700' },
    UNDER_REVIEW: { label: 'En cours', badgeClass: 'bg-blue-100 text-blue-700' },
    APPROVED: { label: 'Approuvé', badgeClass: 'bg-green-100 text-green-700' },
    ACTIVE: { label: 'Actif', badgeClass: 'bg-green-100 text-green-800' },
    PAID: { label: 'Terminé', badgeClass: 'bg-green-100 text-green-900' },
    DEFAULTED: { label: 'Défaillant', badgeClass: 'bg-red-100 text-red-800' },
    CANCELLED: { label: 'Annulé', badgeClass: 'bg-gray-100 text-gray-600' },
    EARLY_SETTLED: { label: 'Réglé anticipé', badgeClass: 'bg-purple-100 text-purple-700' },
    DELINQUENT: { label: 'Délinquant', badgeClass: 'bg-red-100 text-red-700' },
  }
  
  return configs[status] || { label: status, badgeClass: '' }
}

function calculateRemainingBalance(agreement: DPAgreementDetails): number {
  const unpaidInstallments = agreement.installments.filter(
    i => !['PAID', 'WAIVED'].includes(i.status)
  )
  
  return unpaidInstallments.reduce(
    (sum, i) => sum + (i.amount - i.paidAmount),
    0
  )
}

function getProgressPercent(agreement: DPAgreementDetails): number {
  const paidCount = agreement.installments.filter(i => i.status === 'PAID').length
  return Math.round((paidCount / agreement.totalInstallments) * 100)
}

function getNextPayment(agreements: DPAgreementDetails[]): DPAInstallmentDetail | null {
  let next: DPAInstallmentDetail | null = null
  
  for (const agreement of agreements) {
    const pending = agreement.installments.find(i => 
      ['PENDING', 'OVERDUE'].includes(i.status)
    )
    
    if (pending) {
      // Add agreement ID for reference
      const enhanced = { ...pending, agreementId: agreement.id }
      
      if (!next || new Date(pending.dueDate) < new Date(next.dueDate)) {
        next = enhanced as any
      }
    }
  }
  
  return next
}

function getNextPaymentForAgreement(agreement: DPAgreementDetails): DPAInstallmentDetail | null {
  return agreement.installments.find(i => 
    ['PENDING', 'OVERDUE'].includes(i.status)
  ) ?? null
}

function isOverdue(dueDate: Date | string): boolean {
  return new Date(dueDate) < new Date()
}

function isDueSoon(dueDate: Date | string): boolean {
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 7
}

export default InstallmentDashboard
