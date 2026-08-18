'use client'

import React, { useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Shield,
  TrendingUp,
  DollarSign,
  FileText,
  ChevronRight,
  Star,
  Loader2
} from 'lucide-react'
import { formatDZD } from '@/lib/payments/installments/config'
import type { DPAgreementDetails } from '@/lib/payments/installments/manager'

interface DPASellerDashboardProps {
  agreements: DPAgreementDetails[]
  isLoading?: boolean
  onApprove?: (agreementId: string) => void
  onViewDetails?: (agreementId: string) => void
  onReviewBuyer?: (buyerId: string) => void
}

export function DPASellerDashboard({
  agreements,
  isLoading = false,
  onApprove,
  onViewDetails,
  onReviewBuyer,
}: DPASellerDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedAgreement, setSelectedAgreement] = useState<DPAgreementDetails | null>(null)
  
  // Filter agreements by status
  const filteredAgreements = statusFilter === 'all' 
    ? agreements 
    : agreements.filter(a => a.status === statusFilter)
    
  // Calculate stats
  const pendingApproval = agreements.filter(a => a.status === 'PENDING_APPROVAL')
  const activeAgreements = agreements.filter(a => a.status === 'ACTIVE')
  const delinquentAgreements = agreements.filter(a => a.status === 'DELINQUENT' || a.status === 'DEFAULTED')
  const completedAgreements = agreements.filter(a => ['PAID', 'EARLY_SETTLED'].includes(a.status))
  
  const totalOutstanding = activeAgreements.reduce((sum, a) => 
    sum + calculateRemainingBalance(a), 0
  )
  
  const totalReceived = completedAgreements.reduce((sum, a) => 
    sum + a.totalAmount, 0
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Chargement des accords DPA...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Paiements Différés (DPA)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Vue vendeur - Accords avec vos acheteurs
          </p>
        </div>
        
        {pendingApproval.length > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {pendingApproval.length} en attente d&apos;approbation
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApproval.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{activeAgreements.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Problématiques</p>
                <p className="text-2xl font-bold text-red-600">{delinquentAgreements.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant Dû</p>
                <p className="text-lg font-bold">{formatDZD(totalOutstanding)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reçu Total</p>
                <p className="text-lg font-bold text-primary">{formatDZD(totalReceived)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApproval.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {pendingApproval.length} demande(s) de paiement différé nécessite(nt) votre approbation
                </span>
              </div>
              <Button 
                size="sm"
                onClick={() => setStatusFilter('PENDING_APPROVAL')}
              >
                Voir les demandes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filtrer par statut:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous ({agreements.length})</SelectItem>
            <SelectItem value="PENDING_APPROVAL">En attente ({pendingApproval.length})</SelectItem>
            <SelectItem value="ACTIVE">Actifs ({activeAgreements.length})</SelectItem>
            <SelectItem value="DELINQUENT">Délinquants ({delinquentAgreements.length})</SelectItem>
            <SelectItem value="PAID">Terminés ({completedAgreements.length})</SelectItem>
          </SelectContent>
        </Select>
        
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredAgreements.length} accord(s) affiché(s)
        </span>
      </div>

      {/* Agreements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des Accords DPA</CardTitle>
          <CardDescription>
            Tous les accords de paiement différé avec vos acheteurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAgreements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun accord trouvé pour ce filtre</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accord</TableHead>
                    <TableHead>Acheteur ID</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Risque</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                    <TableHead className="center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgreements.map(agreement => (
                    <SellerAgreementRow
                      key={agreement.id}
                      agreement={agreement}
                      onApprove={onApprove}
                      onViewDetails={(id) => {
                        setSelectedAgreement(agreements.find(a => a.id === id) ?? null)
                        onViewDetails?.(id)
                      }}
                      onReviewBuyer={onReviewBuyer}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agreement Detail Dialog */}
      <Dialog open={!!selectedAgreement} onOpenChange={() => setSelectedAgreement(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedAgreement && (
            <>
              <DialogHeader>
                <DialogTitle>Détail de l&apos;Accord DPA</DialogTitle>
                <DialogDescription>
                  Accord #{selectedAgreement.agreementNumber}
                </DialogDescription>
              </DialogHeader>
              
              <SellerAgreementDetailView 
                agreement={selectedAgreement}
                onApprove={onApprove}
              />
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

interface SellerAgreementRowProps {
  agreement: DPAgreementDetails
  onApprove?: (agreementId: string) => void
  onViewDetails: (agreementId: string) => void
  onReviewBuyer?: (buyerId: string) => void
}

function SellerAgreementRow({
  agreement,
  onApprove,
  onViewDetails,
  onReviewBuyer,
}: SellerAgreementRowProps) {
  const progress = getProgressPercent(agreement)
  const remaining = calculateRemainingBalance(agreement)
  const riskLevel = agreement.riskLevel || assessRiskFromScore(agreement.creditScore)

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium font-mono text-sm">
            #{agreement.agreementNumber.slice(-8)}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(agreement.appliedAt).toLocaleDateString('fr-DZ')}
          </p>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{agreement.buyerId.slice(0, 8)}...</span>
          {onReviewBuyer && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onReviewBuyer(agreement.buyerId)}
            >
              Voir
            </Button>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-right font-mono font-semibold">
        {formatDZD(agreement.principalAmount)}
      </TableCell>
      
      <TableCell>
        <span className="text-sm">{agreement.totalInstallments} mois</span>
        <p className="text-xs text-muted-foreground">
          {formatDZD(agreement.installmentAmount)}/mois
        </p>
      </TableCell>
      
      <TableCell className="min-w-[120px]">
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
      </TableCell>
      
      <TableCell>
        <RiskBadge level={riskLevel} score={agreement.creditScore} />
      </TableCell>
      
      <TableCell>
        <StatusBadge status={agreement.status} />
      </TableCell>
      
      <TableCell className="text-right font-mono">
        {remaining > 0 ? formatDZD(remaining) : '-'}
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onViewDetails(agreement.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {agreement.status === 'PENDING_APPROVAL' && onApprove && (
            <Button 
              size="sm"
              onClick={() => onApprove(agreement.id)}
            >
              Approuver
            </Button>
          )}
          
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
    </TableRow>
  )
}

function SellerAgreementDetailView({ 
  agreement, 
  onApprove 
}: { 
  agreement: DPAgreementDetails
  onApprove?: (agreementId: string) => void
}) {
  return (
    <div className="space-y-6 mt-4">
      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-muted-foreground">Principal</p>
          <p className="font-bold">{formatDZD(agreement.principalAmount)}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-muted-foreground">Intérêt</p>
          <p className="font-bold text-orange-600">
            +{formatDZD(agreement.principalAmount * agreement.interestRate / 100)}
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

      {/* Buyer Risk Assessment */}
      <Card className={`
        ${agreement.riskLevel === 'HIGH' || agreement.riskLevel === 'VERY_HIGH' 
          ? 'border-red-200 bg-red-50' : ''}
      `}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Évaluation du Risque Acheteur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Score de Crédit</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">
                  {agreement.creditScore ?? 'N/A'}
                </p>
                {agreement.creditScore !== undefined && (
                  <Star className={`h-5 w-5 ${
                    agreement.creditScore >= 70 ? 'fill-green-500 text-green-500' :
                    agreement.creditScore >= 50 ? 'fill-yellow-500 text-yellow-500' :
                    'fill-red-500 text-red-500'
                  }`} />
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Niveau de Risque</p>
              <RiskBadge level={agreement.riskLevel || 'MEDIUM'} score={agreement.creditScore} large />
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Garantie Bancaire</p>
              <p className="font-semibold">
                {agreement.bankPartnerId ? (
                  <span className="text-green-600">Oui ({agreement.bankPartnerId.toUpperCase()})</span>
                ) : (
                  <span className="text-muted-foreground">Non</span>
                )}
              </p>
            </div>
          </div>
          
          {(agreement.riskLevel === 'HIGH' || agreement.riskLevel === 'VERY_HIGH') && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Cet acheteur présente un risque élevé. Une attention particulière est recommandée.
                  Considérez l&apos;exigence d&apos;une garantie bancaire ou un acompte plus important.
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installment Schedule Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Résumé des Échéances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {agreement.installments.map(installment => (
              <div 
                key={installment.id}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm w-8">#{installment.installmentNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(installment.dueDate).toLocaleDateString('fr-DZ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm w-24 text-right">
                    {formatDZD(installment.amount)}
                  </span>
                  <StatusBadge status={installment.status} small />
                  
                  {installment.lateFeeApplied > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      +{formatDZD(installment.lateFeeApplied)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {agreement.status === 'PENDING_APPROVAL' && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline">Rejeter</Button>
          <Button onClick={() => onApprove?.(agreement.id)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approuver cet Accord
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Helper Components
// ============================================

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const config: Record<string, { label: string; class: string }> = {
    DRAFT: { label: 'Brouillon', class: 'bg-gray-100 text-gray-700' },
    PENDING_APPROVAL: { label: 'En attente', class: 'bg-yellow-100 text-yellow-700' },
    PENDING_DOCUMENTS: { label: 'Documents', class: 'bg-orange-100 text-orange-700' },
    UNDER_REVIEW: { label: 'En cours', class: 'bg-blue-100 text-blue-700' },
    APPROVED: { label: 'Approuvé', class: 'bg-green-100 text-green-700' },
    ACTIVE: { label: 'Actif', class: 'bg-green-100 text-green-800' },
    PAID: { label: 'Terminé', class: 'bg-green-100 text-green-900' },
    DEFAULTED: { label: 'Défaillant', class: 'bg-red-100 text-red-800' },
    CANCELLED: { label: 'Annulé', class: 'bg-gray-100 text-gray-600' },
    EARLY_SETTLED: { label: 'Réglé anticipé', class: 'bg-purple-100 text-purple-700' },
    DELINQUENT: { label: 'Délinquant', class: 'bg-red-100 text-red-700' },
  }
  
  const { label, class: className } = config[status] || { label: status, class: '' }
  
  if (small) {
    return <Badge variant="secondary" className={`${className} text-xs px-1.5 py-0`}>{label}</Badge>
  }
  
  return <Badge variant="secondary" className={className}>{label}</Badge>
}

function RiskBadge({ level, score, large }: { level: string; score?: number | null; large?: boolean }) {
  const config: Record<string, { label: string; class: string }> = {
    LOW: { label: 'Faible', class: 'bg-green-100 text-green-700' },
    MEDIUM: { label: 'Moyen', class: 'bg-yellow-100 text-yellow-700' },
    HIGH: { label: 'Élevé', class: 'bg-orange-100 text-orange-700' },
    VERY_HIGH: { label: 'Très élevé', class: 'bg-red-100 text-red-700' },
  }
  
  const { label, class: className } = config[level] || { label: level, class: '' }
  
  if (large) {
    return (
      <div className="inline-flex items-center gap-2">
        <Badge variant="secondary" className={`${className} text-base px-3 py-1`}>
          {label}
        </Badge>
        {score !== undefined && (
          <span className="text-sm text-muted-foreground">(Score: {score}/100)</span>
        )}
      </div>
    )
  }
  
  return <Badge variant="secondary" className={className}>{label}</Badge>
}

// ============================================
// Utility Functions
// ============================================

function getProgressPercent(agreement: DPAgreementDetails): number {
  const paidCount = agreement.installments.filter(i => i.status === 'PAID').length
  return Math.round((paidCount / agreement.totalInstallments) * 100)
}

function calculateRemainingBalance(agreement: DPAgreementDetails): number {
  return agreement.installments
    .filter(i => !['PAID', 'WAIVED'].includes(i.status))
    .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0)
}

function assessRiskFromScore(score: number | null | undefined): string {
  if (!score) return 'MEDIUM'
  if (score >= 80) return 'LOW'
  if (score >= 60) return 'MEDIUM'
  if (score >= 40) return 'HIGH'
  return 'VERY_HIGH'
}

export default DPASellerDashboard
