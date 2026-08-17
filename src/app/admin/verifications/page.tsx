'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  FileText,
  User,
  Building2,
  Award,
  AlertTriangle,
  RefreshCw,
  Star,
  Image as ImageIcon
} from 'lucide-react';

// Types
type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
type VerificationType = 'IDENTITY' | 'COMPANY' | 'PROFESSIONAL' | 'PREMIUM';
type VerificationLevel = 'BASIC' | 'STANDARD' | 'ADVANCED';

interface VerificationDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  companyName?: string;
  type: VerificationType;
  level: VerificationLevel;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents: VerificationDocument[];
  notes?: string;
  rejectionReason?: string;
  badgeEarned?: string;
}

// Sample data
const sampleVerifications: VerificationRequest[] = [
  {
    id: 'V001',
    userId: 'U1',
    userName: 'Karim Meziani',
    userEmail: 'karim.meziani@example.com',
    companyName: 'SARL Technologie Algerienne',
    type: 'COMPANY',
    level: 'ADVANCED',
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    documents: [
      { id: 'D1', name: 'RC Extrait', type: 'PDF', url: '#', status: 'PENDING' },
      { id: 'D2', name: 'NIF Attestation', type: 'PDF', url: '#', status: 'PENDING' },
      { id: 'D3', name: 'Statuts Signés', type: 'PDF', url: '#', status: 'PENDING' },
    ],
  },
  {
    id: 'V002',
    userId: 'U2',
    userName: 'Fatima Zahra',
    userEmail: 'fatima.zahra@example.com',
    type: 'IDENTITY',
    level: 'BASIC',
    status: 'UNDER_REVIEW',
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Admin Ahmed',
    documents: [
      { id: 'D4', name: 'CIN Recto', type: 'IMAGE', url: '#', status: 'VERIFIED' },
      { id: 'D5', name: 'CIN Verso', type: 'IMAGE', url: '#', status: 'PENDING' },
      { id: 'D6', name: 'Selfie avec CIN', type: 'IMAGE', url: '#', status: 'PENDING' },
    ],
  },
  {
    id: 'V003',
    userId: 'U3',
    userName: 'Ahmed Benali',
    userEmail: 'ahmed.benali@example.com',
    companyName: 'EURL Industrie Moderne',
    type: 'PROFESSIONAL',
    level: 'STANDARD',
    status: 'APPROVED',
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Admin Leila',
    badgeEarned: 'Fournisseur Certifié',
    documents: [
      { id: 'D7', name: 'RC Extrait', type: 'PDF', url: '#', status: 'VERIFIED' },
      { id: 'D8', name: 'Patente Commerciale', type: 'PDF', url: '#', status: 'VERIFIED' },
      { id: 'D9', name: 'Justificatif Activité', type: 'PDF', url: '#', status: 'VERIFIED' },
    ],
  },
  {
    id: 'V004',
    userId: 'U4',
    userName: 'Samira Khelifi',
    userEmail: 'samira.khelifi@example.com',
    type: 'PREMIUM',
    level: 'ADVANCED',
    status: 'REJECTED',
    submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Admin Omar',
    rejectionReason: 'Documents illisibles - Veuillez soumettre des scans de meilleure qualité',
    documents: [
      { id: 'D10', name: 'Bilan Financier', type: 'PDF', url: '#', status: 'REJECTED' },
      { id: 'D11', name: 'Références Clients', type: 'PDF', url: '#', status: 'REJECTED' },
    ],
  },
  {
    id: 'V005',
    userId: 'U5',
    userName: 'Youssef Ammar',
    userEmail: 'youssef.ammar@example.com',
    companyName: 'Sarl Distribution Plus',
    type: 'COMPANY',
    level: 'STANDARD',
    status: 'PENDING',
    submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    documents: [
      { id: 'D12', name: 'RC Extrait', type: 'PDF', url: '#', status: 'PENDING' },
      { id: 'D13', name: 'NIS Attestation', type: 'PDF', url: '#', status: 'PENDING' },
    ],
  },
  {
    id: 'V006',
    userId: 'U6',
    userName: 'Nadia Bouazza',
    userEmail: 'nadia.bouazza@example.com',
    type: 'IDENTITY',
    level: 'BASIC',
    status: 'EXPIRED',
    submittedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    documents: [
      { id: 'D14', name: 'CIN (Expiré)', type: 'IMAGE', url: '#', status: 'PENDING' },
    ],
  },
];

const statusConfig: Record<VerificationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; icon: React.ReactNode }> = {
  PENDING: { 
    label: 'En attente', 
    variant: 'outline', 
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    icon: <Clock className="h-3 w-3" />
  },
  UNDER_REVIEW: { 
    label: 'En cours', 
    variant: 'secondary', 
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: <Eye className="h-3 w-3" />
  },
  APPROVED: { 
    label: 'Approuvé', 
    variant: 'default', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  REJECTED: { 
    label: 'Rejeté', 
    variant: 'destructive', 
    color: '',
    icon: <XCircle className="h-3 w-3" />
  },
  EXPIRED: { 
    label: 'Expiré', 
    variant: 'secondary', 
    color: 'text-gray-700 bg-gray-100 border-gray-200',
    icon: <AlertTriangle className="h-3 w-3" />
  },
};

const typeConfig: Record<VerificationType, { label: string; icon: React.ReactNode }> = {
  IDENTITY: { label: 'Identité', icon: <User className="h-4 w-4" /> },
  COMPANY: { label: 'Entreprise', icon: <Building2 className="h-4 w-4" /> },
  PROFESSIONAL: { label: 'Professionnel', icon: <Award className="h-4 w-4" /> },
  PREMIUM: { label: 'Premium', icon: <Star className="h-4 w-4" /> },
};

export default function VerificationsManagementPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>(sampleVerifications);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  
  // Detail dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  
  // Action dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter verifications
  const filteredVerifications = useMemo(() => {
    let result = [...verifications];
    
    if (activeTab !== 'all') {
      result = result.filter(v => v.status === activeTab.toUpperCase());
    }
    
    if (statusFilter !== 'ALL') {
      result = result.filter(v => v.status === statusFilter);
    }
    
    if (typeFilter !== 'ALL') {
      result = result.filter(v => v.type === typeFilter);
    }
    
    if (levelFilter !== 'ALL') {
      result = result.filter(v => v.level === levelFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.userName.toLowerCase().includes(query) ||
        v.userEmail.toLowerCase().includes(query) ||
        v.companyName?.toLowerCase().includes(query) ||
        v.id.toLowerCase().includes(query)
      );
    }
    
    // Sort: pending first, then by date
    result.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    return result;
  }, [verifications, activeTab, searchQuery, statusFilter, typeFilter, levelFilter]);

  // Stats
  const pendingCount = verifications.filter(v => v.status === 'PENDING').length;
  const approvedToday = verifications.filter(v => 
    v.status === 'APPROVED' && 
    v.reviewedAt && 
    new Date(v.reviewedAt).toDateString() === new Date().toDateString()
  ).length;
  const totalApproved = verifications.filter(v => v.status === 'APPROVED').length;
  const rejectionRate = verifications.length > 0 
    ? Math.round((verifications.filter(v => v.status === 'REJECTED').length / verifications.length) * 100) 
    : 0;

  // Handlers
  const openDetailDialog = (verification: VerificationRequest) => {
    setSelectedVerification(verification);
    setDetailDialogOpen(true);
  };

  const openActionDialog = (verification: VerificationRequest, action: 'approve' | 'reject') => {
    setSelectedVerification(verification);
    setActionType(action);
    setActionDialogOpen(true);
    setActionReason('');
    setActionNotes('');
  };

  const handleAction = async () => {
    if (!selectedVerification) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setVerifications(prev => prev.map(v => 
      v.id === selectedVerification.id 
        ? { 
            ...v, 
            status: actionType === 'approve' ? 'APPROVED' as const : 'REJECTED' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Admin Current',
            rejectionReason: actionType === 'reject' ? actionReason : undefined,
            notes: actionType === 'approve' ? actionNotes : undefined,
            badgeEarned: actionType === 'approve' ? getBadgeForType(v.type, v.level) : undefined,
          }
        : v
    ));
    
    setIsLoading(false);
    setActionDialogOpen(false);
    setDetailDialogOpen(false);
  };

  const getBadgeForType = (type: VerificationType, level: VerificationLevel): string => {
    if (type === 'IDENTITY') return 'Identité Vérifiée';
    if (type === 'COMPANY' && level === 'ADVANCED') return 'Entreprise Certifiée Gold';
    if (type === 'COMPANY') return 'Entreprise Vérifiée';
    if (type === 'PROFESSIONNEL') return 'Pro Certifié';
    return 'Membre Premium';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Utilisateur', 'Email', 'Entreprise', 'Type', 'Niveau', 'Statut', 'Date soumission', 'Date revue'];
    const csvRows = filteredVerifications.map(v => [
      v.id,
      v.userName,
      v.userEmail,
      v.companyName || '',
      typeConfig[v.type].label,
      v.level,
      statusConfig[v.status].label,
      formatDate(v.submittedAt),
      v.reviewedAt ? formatDate(v.reviewedAt) : ''
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `verifications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Vérifications</h1>
          <p className="text-gray-500 mt-1">Traitez les demandes de vérification et gérez les badges</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="En attente"
          value={pendingCount}
          description="Demandes à traiter"
          icon={Clock}
          iconClassName={pendingCount > 0 ? "bg-yellow-100 text-yellow-600 animate-pulse" : "bg-gray-100 text-gray-600"}
          trend={{ value: 12, isPositive: false }}
        />
        <StatsCard
          title="Approuvés aujourd'hui"
          value={approvedToday}
          description={`${totalApproved} total approuvés`}
          icon={CheckCircle2}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Taux de rejet"
          value={`${rejectionRate}%`}
          description="Sur le dernier mois"
          icon={XCircle}
          iconClassName="bg-red-100 text-red-600"
          trend={{ value: rejectionRate > 15 ? 5 : -3, isPositive: rejectionRate <= 15 }}
        />
        <StatsCard
          title="Badges attribués"
          value={totalApproved}
          description="Ce mois-ci"
          icon={Award}
          iconClassName="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Label htmlFor="search" className="sr-only">Rechercher</Label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Rechercher par nom, email ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="UNDER_REVIEW">En cours</SelectItem>
                  <SelectItem value="APPROVED">Approuvé</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                  <SelectItem value="EXPIRED">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="IDENTITY">Identité</SelectItem>
                  <SelectItem value="COMPANY">Entreprise</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professionnel</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Niveau</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="ADVANCED">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({verifications.length})</TabsTrigger>
          <TabsTrigger value="PENDING" className="gap-1">
            <Clock className="h-3.5 w-3.5 hidden sm:inline" /> En attente ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 hidden sm:inline" /> Approuvés
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="gap-1">
            <XCircle className="h-3.5 w-3.5 hidden sm:inline" /> Rejetés
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredVerifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead>Demande</TableHead>
                        <TableHead className="hidden md:table-cell">Utilisateur</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden lg:table-cell">Niveau</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden xl:table-cell">Documents</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVerifications.map((verification) => {
                        const status = statusConfig[verification.status];
                        const type = typeConfig[verification.type];
                        
                        return (
                          <TableRow 
                            key={verification.id}
                            className={
                              verification.status === 'PENDING' 
                                ? 'bg-yellow-50/30 hover:bg-yellow-50/50' 
                                : ''
                            }
                          >
                            <TableCell>
                              <div className="font-medium">{verification.id}</div>
                              {verification.companyName && (
                                <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                  {verification.companyName}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div>
                                <div className="font-medium text-sm">{verification.userName}</div>
                                <div className="text-xs text-gray-500">{verification.userEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {type.icon}
                                <span className="text-sm">{type.label}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline" className="text-xs">
                                {verification.level}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={status.variant}
                                className={`gap-1 ${status.color}`}
                              >
                                {status.icon}
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <div className="flex items-center gap-1 text-sm">
                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                {verification.documents.length} doc(s)
                                <span className="text-gray-400">
                                  ({verification.documents.filter(d => d.status === 'PENDING').length} en attente)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {formatDate(verification.submittedAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => openDetailDialog(verification)}>
                                    <Eye className="mr-2 h-4 w-4" /> Voir détails
                                  </DropdownMenuItem>
                                  
                                  {(verification.status === 'PENDING' || verification.status === 'UNDER_REVIEW') && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => openActionDialog(verification, 'approve')}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approuver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => openActionDialog(verification, 'reject')}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" /> Rejeter
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {verification.status === 'APPROVED' && verification.badgeEarned && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Award className="mr-2 h-4 w-4" /> Gérer badge
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ShieldCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucune demande trouvée</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détail de la demande {selectedVerification?.id}
            </DialogTitle>
            <DialogDescription>
              Consultez les documents soumis et prenez une décision
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Informations utilisateur</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedVerification.userName}</p>
                          <p className="text-sm text-gray-500">{selectedVerification.userEmail}</p>
                        </div>
                      </div>
                      {selectedVerification.companyName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <Building2 className="h-4 w-4" />
                          {selectedVerification.companyName}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Détails de la demande</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type:</span>
                        <div className="flex items-center gap-1">
                          {typeConfig[selectedVerification.type].icon}
                          {typeConfig[selectedVerification.type].label}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Niveau:</span>
                        <Badge variant="outline">{selectedVerification.level}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Statut:</span>
                        <Badge 
                          variant={statusConfig[selectedVerification.status].variant}
                          className={statusConfig[selectedVerification.status].color}
                        >
                          {statusConfig[selectedVerification.status].label}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Soumise le:</span>
                        <span>{formatDate(selectedVerification.submittedAt)}</span>
                      </div>
                      {selectedVerification.badgeEarned && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Badge:</span>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            <Award className="h-3 w-3 mr-1" />
                            {selectedVerification.badgeEarned}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Documents soumis ({selectedVerification.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedVerification.documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50"
                      >
                        <div className={`p-2 rounded ${
                          doc.status === 'VERIFIED' ? 'bg-green-100 text-green-600' :
                          doc.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type}</p>
                        </div>
                        <Badge 
                          variant={
                            doc.status === 'VERIFIED' ? 'default' :
                            doc.status === 'REJECTED' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {doc.status === 'VERIFIED' ? 'Vérifié' : 
                           doc.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {(selectedVerification.status === 'PENDING' || selectedVerification.status === 'UNDER_REVIEW') && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      openActionDialog(selectedVerification, 'reject');
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Rejeter
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      openActionDialog(selectedVerification, 'approve');
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approuver
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {actionType === 'approve' ? 'Approuver la vérification' : 'Rejeter la vérification'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `Confirmez l'approbation pour ${selectedVerification?.userName}`
                : `Indiquez le motif du rejet pour ${selectedVerification?.userName}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'approve' ? (
              <div className="space-y-3">
                <Label htmlFor="notes">Notes d'approbation (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des notes sur cette approbation..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Badge qui sera attribué:</strong> {getBadgeForType(
                      selectedVerification?.type || 'IDENTITY', 
                      selectedVerification?.level || 'BASIC'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label htmlFor="reason">Motif du rejet *</Label>
                <Textarea
                  id="reason"
                  placeholder="Expliquez pourquoi cette demande est rejetée..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={handleAction}
              disabled={isLoading || (actionType === 'reject' && !actionReason.trim())}
            >
              {isLoading ? 'Traitement...' : actionType === 'approve' ? 'Confirmer' : 'Confirmer le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
