'use client'

import React from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { Installment, InstallmentStatus } from '@/lib/payments/installments'
import { formatDZD } from '@/lib/payments/utils'

interface InstallmentScheduleProps {
  installments: Installment[]
  planStatus: InstallmentStatus
  isLoading?: boolean
}

export function InstallmentSchedule({
  installments,
  planStatus,
  isLoading = false,
}: InstallmentScheduleProps) {
  // Calculate statistics
  const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0)
  const paidAmount = installments
    .filter((inst) => inst.status === 'PAID')
    .reduce((sum, inst) => sum + inst.amount, 0)
  const overdueAmount = installments
    .filter((inst) => inst.status === 'OVERDUE')
    .reduce((sum, inst) => sum + inst.amount + inst.lateFeeApplied, 0)
  const pendingCount = installments.filter((inst) => inst.status === 'PENDING').length
  const paidCount = installments.filter((inst) => inst.status === 'PAID').length

  // Progress percentage
  const progressPercent = installments.length > 0 
    ? Math.round((paidCount / installments.length) * 100) 
    : 0

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#006233]" />
          <span className="ml-3 text-gray-600">Chargement du calendrier...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={paidCount > 0 ? 'border-green-200 bg-green-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${paidCount > 0 ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-xs text-gray-500">Payées</p>
                <p className="text-lg font-bold">{paidCount}/{installments.length}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-green-700 mt-1">
              {formatDZD(paidAmount)}
            </p>
          </CardContent>
        </Card>

        <Card className={pendingCount > 0 ? 'border-blue-200 bg-blue-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${pendingCount > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-xs text-gray-500">En attente</p>
                <p className="text-lg font-bold">{pendingCount}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-blue-700 mt-1">
              {formatDZD(totalAmount - paidAmount - overdueAmount)}
            </p>
          </CardContent>
        </Card>

        <Card className={overdueAmount > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${overdueAmount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-xs text-gray-500">En retard</p>
                <p className="text-lg font-bold">
                  {installments.filter((i) => i.status === 'OVERDUE').length}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-red-700 mt-1">
              {overdueAmount > 0 ? formatDZD(overdueAmount) : formatDZD(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Prochaine échéance</p>
                <p className="text-sm font-bold truncate">
                  {getNextDueDate(installments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression du plan</span>
            <span className="text-sm font-bold text-[#006233]">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Début</span>
            <span>{formatDZD(paidAmount)} payé sur {formatDZD(totalAmount)}</span>
            <span>Fin</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline / Schedule Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendrier des paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Date d'échéance</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Intérêts</TableHead>
                  <TableHead className="text-right">Pénalité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment) => (
                  <TableRow key={installment.id} className={
                    installment.status === 'OVERDUE' ? 'bg-red-50' :
                    installment.status === 'PAID' ? 'bg-green-50' : ''
                  }>
                    <TableCell className="font-medium">
                      #{installment.installmentNumber}
                    </TableCell>
                    <TableCell>
                      {formatDate(installment.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatDZD(installment.amount)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatDZD(installment.principalPortion)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatDZD(installment.interestPortion)}
                    </TableCell>
                    <TableCell className="text-right">
                      {installment.lateFeeApplied > 0 ? (
                        <span className="text-red-600 font-medium">
                          +{formatDZD(installment.lateFeeApplied)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={installment.status} />
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {installment.paidAt 
                        ? formatDate(installment.paidAt)
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {installments.map((installment) => (
              <InstallmentCard key={installment.id} installment={installment} />
            ))}
          </div>

          {/* Empty State */}
          {installments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucune échéance trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Status Banner */}
      {(planStatus === 'DELINQUENT' || planStatus === 'DEFAULTED') && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                {planStatus === 'DELINQUENT' 
                  ? 'Plan en retard de paiement' 
                  : 'Plan par défaut'}
              </p>
              <p className="text-sm text-red-700 mt-1">
                {planStatus === 'DELINQUENT' 
                  ? 'Veuillez régulariser votre situation pour éviter des pénalités supplémentaires.'
                  : 'Ce plan a été déclaré en défaut. Veuillez contacter notre service client.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================
// Sub-components
// ============================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
    PENDING: { label: 'En attente', variant: 'outline', color: 'text-blue-600 border-blue-300' },
    PAID: { label: 'Payée', variant: 'default', color: 'bg-green-100 text-green-800' },
    OVERDUE: { label: 'En retard', variant: 'destructive', color: '' },
    PARTIAL: { label: 'Partielle', variant: 'secondary', color: '' },
    WAIVED: { label: 'Annulée', variant: 'outline', color: 'text-gray-600 border-gray-300' },
  }
  
  const { label, variant } = config[status] || { label: status, variant: 'outline' as const, color: '' }
  
  return <Badge variant={variant}>{label}</Badge>
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getNextDueDate(installments: Installment[]): string {
  const nextPending = installments
    .filter((i) => i.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
  
  return nextPending ? formatDate(nextPending.dueDate) : 'Complété'
}

function InstallmentCard({ installment }: { installment: Installment }) {
  const isOverdue = installment.status === 'OVERDUE'
  const isPaid = installment.status === 'PAID'

  return (
    <Card className={`${isOverdue ? 'border-red-300 bg-red-50' : isPaid ? 'border-green-200 bg-green-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="font-semibold">Échéance #{installment.installmentNumber}</span>
            <p className="text-sm text-gray-500">{formatDate(installment.dueDate)}</p>
          </div>
          <StatusBadge status={installment.status} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montant:</span>
            <span className="font-medium">{formatDZD(installment.amount)}</span>
          </div>
          
          {isPaid && installment.paidAt && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Payé le:</span>
              <span>{formatDate(installment.paidAt)}</span>
            </div>
          )}
          
          {isOverdue && installment.lateFeeApplied > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Pénalité:</span>
              <span>+{formatDZD(installment.lateFeeApplied)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default InstallmentSchedule
