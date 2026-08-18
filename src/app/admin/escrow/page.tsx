'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  MessageSquare,
  Calendar,
  User,
  Building2,
  Gavel,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';

// Types
type EscrowStatus = 'ACTIVE' | 'PENDING_RELEASE' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'EXPIRED';
type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type DisputeStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';

interface EscrowAccount {
  id: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  createdAt: string;
  releaseDate?: string;
  disputeId?: string;
  description: string;
}

interface DisputeEvent {
  id: string;
  type: 'MESSAGE' | 'EVIDENCE' | 'DECISION' | 'ESCALATION' | 'NOTE';
  author: string;
  authorRole: 'BUYER' | 'SELLER' | 'ADMIN' | 'SYSTEM';
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface Dispute {
  id: string;
  escrowId: string;
  escrowAmount: number;
  priority: DisputePriority;
  status: DisputeStatus;
  reason: string;
  openedBy: string;
  openedAt: string;
  assignedTo?: string;
  timeline: DisputeEvent[];
}

// Sample data
const sampleEscrows: EscrowAccount[] = [
  {
    id: 'ESC001',
    orderId: 'ORD-2024-001',
    buyerName: 'Karim Meziani',
    buyerEmail: 'karim@example.com',
    sellerName: 'SARL Technologie Algerienne',
    sellerEmail: 'contact@technologie-dz.dz',
    amount: 150000,
    currency: 'DZD',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Commande de matériel informatique'
  },
  {
    id: 'ESC002',
    orderId: 'ORD-2024-002',
    buyerName: 'Fatima Zahra',
    buyerEmail: 'fatima@example.com',
    sellerName: 'EURL Industrie Moderne',
    sellerEmail: 'info@industrie-dz.dz',
    amount: 275000,
    currency: 'DZD',
    status: 'DISPUTED',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    disputeId: 'DIS001',
    description: 'Machine industrielle CNC'
  },
  {
    id: 'ESC003',
    orderId: 'ORD-2024-003',
    buyerName: 'Ahmed Benali',
    buyerEmail: 'ahmed@example.com',
    sellerName: 'Sarl Agro Solutions',
    sellerEmail: 'agro@solutions-dz.dz',
    amount: 89000,
    currency: 'DZD',
    status: 'PENDING_RELEASE',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Équipement agricole'
  },
  {
    id: 'ESC004',
    orderId: 'ORD-2024-004',
    buyerName: 'Samira Khelifi',
    buyerEmail: 'samira@example.com',
    sellerName: 'SPA Distribution Plus',
    sellerEmail: 'contact@distribution-dz.dz',
    amount: 45000,
    currency: 'DZD',
    status: 'RELEASED',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    releaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Fournitures de bureau'
  },
  {
    id: 'ESC005',
    orderId: 'ORD-2024-005',
    buyerName: 'Youssef Ammar',
    buyerEmail: 'youssef@example.com',
    sellerName: 'SARL Technologie Algerienne',
    sellerEmail: 'contact@technologie-dz.dz',
    amount: 320000,
    currency: 'DZD',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Serveurs et équipement réseau'
  },
];

const sampleDisputes: Dispute[] = [
  {
    id: 'DIS001',
    escrowId: 'ESC002',
    escrowAmount: 275000,
    priority: 'HIGH',
    status: 'INVESTIGATING',
    reason: 'Produit non conforme à la description',
    openedBy: 'Fatima Zahra (Acheteuse)',
    openedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Admin Leila',
    timeline: [
      {
        id: 'E1',
        type: 'NOTE',
        author: 'Systeme',
        authorRole: 'SYSTEM',
        content: 'Litige ouvert par l\'acheteuse',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'E2',
        type: 'MESSAGE',
        author: 'Fatima Zahra',
        authorRole: 'BUYER',
        content: 'La machine reçue ne correspond pas aux spécifications commandées. Les dimensions sont incorrectes.',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: ['photo1.jpg', 'photo2.jpg']
      },
      {
        id: 'E3',
        type: 'MESSAGE',
        author: 'SARL Technologie',
        authorRole: 'SELLER',
        content: 'Nous confirmons que la machine envoyée correspond bien au bon de commande. Nous pouvons fournir les preuves d\'expédition.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'E4',
        type: 'EVIDENCE',
        author: 'Fatima Zahra',
        authorRole: 'BUYER',
        content: 'Photos du produit reçu vs photos du catalogue',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: ['comparaison.pdf']
      },
      {
        id: 'E5',
        type: 'DECISION',
        author: 'Admin Leila',
        authorRole: 'ADMIN',
        content: 'Litige pris en charge. En attente des preuves complémentaires du vendeur.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

const statusConfig: Record<EscrowStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  ACTIVE: { label: 'Actif', variant: 'outline', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  PENDING_RELEASE: { label: 'En attente de libération', variant: 'secondary', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  DISPUTED: { label: 'Litigieux', variant: 'destructive', color: '' },
  RELEASED: { label: 'Libéré', variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
  REFUNDED: { label: 'Remboursé', variant: 'secondary', color: 'text-gray-700 bg-gray-100 border-gray-200' },
  EXPIRED: { label: 'Expiré', variant: 'secondary', color: 'text-orange-700 bg-orange-50 border-orange-200' },
};

const priorityConfig: Record<DisputePriority, { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary'; color: string; icon: React.ReactNode }> = {
  LOW: { label: 'Basse', variant: 'outline', color: 'text-gray-600 bg-gray-100', icon: null },
  MEDIUM: { label: 'Moyenne', variant: 'secondary', color: 'text-blue-600 bg-blue-100', icon: null },
  HIGH: { label: 'Haute', variant: 'default', color: 'text-white bg-orange-500', icon: <AlertTriangle className="h-3 w-3" /> },
  CRITICAL: { label: 'Critique', variant: 'destructive', color: '', icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function EscrowManagementPage() {
  const [escrows, setEscrows] = useState<EscrowAccount[]>(sampleEscrows);
  const [disputes] = useState<Dispute[]>(sampleDisputes);
  const [activeTab, setActiveTab] = useState('escrows');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Detail dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowAccount | null>(null);
  
  // Action dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'release' | 'refund'>('release');
  const [actionReason, setActionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dispute detail dialog
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Filter escrows
  const filteredEscrows = useMemo(() => {
    let result = [...escrows];
    
    if (statusFilter !== 'ALL') {
      result = result.filter(e => e.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.id.toLowerCase().includes(query) ||
        e.orderId.toLowerCase().includes(query) ||
        e.buyerName.toLowerCase().includes(query) ||
        e.sellerName.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      if (a.status === 'DISPUTED') return -1;
      if (b.status === 'DISPUTED') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return result;
  }, [escrows, searchQuery, statusFilter]);

  // Stats
  const totalInEscrow = escrows
    .filter(e => e.status === 'ACTIVE' || e.status === 'PENDING_RELEASE' || e.status === 'DISPUTED')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const pendingReleases = escrows.filter(e => e.status === 'PENDING_RELEASE').length;
  const activeDisputes = disputes.filter(d => d.status === 'OPEN' || d.status === 'INVESTIGATING').length;
  const totalReleasedThisMonth = escrows
    .filter(e => e.status === 'RELEASED' && e.releaseDate && 
      new Date(e.releaseDate).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);

  // Handlers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const openDetailDialog = (escrow: EscrowAccount) => {
    setSelectedEscrow(escrow);
    setDetailDialogOpen(true);
  };

  const openActionDialog = (escrow: EscrowAccount, action: 'release' | 'refund') => {
    setSelectedEscrow(escrow);
    setActionType(action);
    setActionReason('');
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedEscrow) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setEscrows(prev => prev.map(e => 
      e.id === selectedEscrow.id 
        ? { 
            ...e, 
            status: actionType === 'release' ? 'RELEASED' as const : 'REFUNDED' as const,
            releaseDate: new Date().toISOString(),
          }
        : e
    ));
    
    setIsLoading(false);
    setActionDialogOpen(false);
    setDetailDialogOpen(false);
  };

  const openDisputeDialog = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDisputeDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Commande', 'Acheteur', 'Vendeur', 'Montant', 'Statut', 'Date création'];
    const csvRows = filteredEscrows.map(e => [
      e.id,
      e.orderId,
      e.buyerName,
      e.sellerName,
      formatCurrency(e.amount),
      statusConfig[e.status].label,
      formatDate(e.createdAt)
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `escrows_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Comptes Escrow</h1>
          <p className="text-gray-500 mt-1">Surveillez les transactions sécurisées et gérez les litiges</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total en escrow"
          value={formatCurrency(totalInEscrow)}
          description={`${escrows.filter(e => e.status === 'ACTIVE' || e.status === 'PENDING_RELEASE' || e.status === 'DISPUTED').length} comptes actifs`}
          icon={Lock}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Libérations en attente"
          value={pendingReleases}
          description="À traiter"
          icon={Clock}
          iconClassName={pendingReleases > 0 ? "bg-yellow-100 text-yellow-600 animate-pulse" : "bg-gray-100 text-gray-600"}
        />
        <StatsCard
          title="Litiges actifs"
          value={activeDisputes}
          description={`${disputes.length} total ce mois`}
          icon={Gavel}
          iconClassName={activeDisputes > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}
        />
        <StatsCard
          title="Libéré ce mois"
          value={formatCurrency(totalReleasedThisMonth)}
          description="Volume total"
          icon={TrendingUp}
          iconClassName="bg-green-100 text-green-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="escrows" className="gap-1">
            <ShieldCheck className="h-4 w-4" /> Comptes Escrow ({escrows.length})
          </TabsTrigger>
          <TabsTrigger value="disputes" className="gap-1">
            <Gavel className="h-4 w-4" /> Litiges ({disputes.length})
            {activeDisputes > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {activeDisputes}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Escrows Tab */}
        <TabsContent value="escrows" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par ID, commande ou nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="ACTIVE">Actif</SelectItem>
                    <SelectItem value="PENDING_RELEASE">En attente libération</SelectItem>
                    <SelectItem value="DISPUTED">Litigieux</SelectItem>
                    <SelectItem value="RELEASED">Libéré</SelectItem>
                    <SelectItem value="REFUNDED">Remboursé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Escrows Table */}
          <Card>
            <CardContent className="p-0">
              {filteredEscrows.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead>ID</TableHead>
                        <TableHead>Commande</TableHead>
                        <TableHead>Acheteur</TableHead>
                        <TableHead className="hidden lg:table-cell">Vendeur</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden md:table-cell">Créé le</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEscrows.map((escrow) => {
                        const status = statusConfig[escrow.status];
                        
                        return (
                          <TableRow 
                            key={escrow.id}
                            className={
                              escrow.status === 'DISPUTED' 
                                ? 'bg-red-50/30 hover:bg-red-50/50' 
                                : escrow.status === 'PENDING_RELEASE'
                                  ? 'bg-yellow-50/30 hover:bg-yellow-50/50'
                                  : ''
                            }
                          >
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{escrow.id}</code>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{escrow.orderId}</span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{escrow.buyerName}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px]">{escrow.buyerEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div>
                                <div className="text-sm">{escrow.sellerName}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px]">{escrow.sellerEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-green-700">
                                {formatCurrency(escrow.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className={status.color}>
                                {status.label}
                              </Badge>
                              {escrow.disputeId && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  Litige
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm text-gray-600">
                                {formatDate(escrow.createdAt)}
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
                                  <DropdownMenuItem onClick={() => openDetailDialog(escrow)}>
                                    <Eye className="mr-2 h-4 w-4" /> Voir détails
                                  </DropdownMenuItem>
                                  
                                  {(escrow.status === 'PENDING_RELEASE' || escrow.status === 'ACTIVE') && !escrow.disputeId && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => openActionDialog(escrow, 'release')}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <ArrowDownCircle className="mr-2 h-4 w-4" /> Libérer les fonds
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => openActionDialog(escrow, 'refund')}
                                        className="text-orange-600 focus:text-orange-600"
                                      >
                                        <ArrowUpCircle className="mr-2 h-4 w-4" /> Rembourser
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {escrow.disputeId && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          const dispute = disputes.find(d => d.id === escrow.disputeId);
                                          if (dispute) openDisputeDialog(dispute);
                                        }}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Gavel className="mr-2 h-4 w-4" /> Voir le litige
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
                  <h3 className="font-medium text-gray-900 mb-1">Aucun compte trouvé</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="mt-4">
          <div className="space-y-4">
            {disputes.length > 0 ? (
              disputes.map((dispute) => {
                const priority = priorityConfig[dispute.priority];
                
                return (
                  <Card key={dispute.id} className={dispute.status === 'OPEN' ? 'border-red-200' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">Litige #{dispute.id}</CardTitle>
                            <Badge variant={priority.variant} className={priority.color}>
                              {priority.icon}
                              Priorité {priority.label}
                            </Badge>
                            <Badge 
                              variant={dispute.status === 'OPEN' ? 'destructive' : 'secondary'}
                            >
                              {dispute.status === 'OPEN' ? 'Ouvert' :
                               dispute.status === 'INVESTIGATING' ? 'En cours' :
                               dispute.status === 'RESOLVED' ? 'Résolu' :
                               dispute.status === 'ESCALATED' ? 'Escaladé' : 'Fermé'}
                            </Badge>
                          </div>
                          <CardDescription>{dispute.reason}</CardDescription>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-lg text-red-600">
                            {formatCurrency(dispute.escrowAmount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ouvert le {formatDate(dispute.openedAt)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Ouvert par: <strong>{dispute.openedBy}</strong></span>
                          {dispute.assignedTo && (
                            <span>Assigné à: <strong>{dispute.assignedTo}</strong></span>
                          )}
                          <span>{dispute.timeline.length} événements</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDisputeDialog(dispute)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Voir le litige
                        </Button>
                      </div>

                      {/* Timeline Preview */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {dispute.timeline.slice(-3).map((event) => (
                            <div key={event.id} className="flex gap-3 text-sm">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                event.type === 'MESSAGE' ? 'bg-blue-400' :
                                event.type === 'EVIDENCE' ? 'bg-purple-400' :
                                event.type === 'DECISION' ? 'bg-green-400' :
                                event.type === 'ESCALATION' ? 'bg-red-400' :
                                'bg-gray-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{event.author}</span>
                                <span className="text-gray-500 ml-2">
                                  {new Date(event.timestamp).toLocaleDateString('fr-FR')}
                                </span>
                                <p className="text-gray-600 truncate">{event.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gavel className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucun litige actif</h3>
                  <p className="text-sm text-gray-500">Tous les litiges ont été résolus</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Escrow Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Détails du compte {selectedEscrow?.id}
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur cette transaction escrow
            </DialogDescription>
          </DialogHeader>

          {selectedEscrow && (
            <div className="space-y-6 py-4">
              {/* Amount Highlight */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Montant en séquestre</p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(selectedEscrow.amount)}</p>
                <Badge variant="outline" className="mt-2 bg-white">
                  {statusConfig[selectedEscrow.status].label}
                </Badge>
              </div>

              {/* Parties Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Acheteur
                    </h4>
                    <p className="font-medium">{selectedEscrow.buyerName}</p>
                    <p className="text-sm text-gray-500">{selectedEscrow.buyerEmail}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Vendeur
                    </h4>
                    <p className="font-medium">{selectedEscrow.sellerName}</p>
                    <p className="text-sm text-gray-500">{selectedEscrow.sellerEmail}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">ID Commande:</span>
                  <code className="bg-gray-100 px-2 py-0.5 rounded">{selectedEscrow.orderId}</code>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Description:</span>
                  <span>{selectedEscrow.description}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Date de création:</span>
                  <span>{formatDate(selectedEscrow.createdAt)}</span>
                </div>
                {selectedEscrow.releaseDate && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Date de libération:</span>
                    <span>{formatDate(selectedEscrow.releaseDate)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {(selectedEscrow.status === 'PENDING_RELEASE' || selectedEscrow.status === 'ACTIVE') && !selectedEscrow.disputeId && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      openActionDialog(selectedEscrow, 'refund');
                    }}
                  >
                    <ArrowUpCircle className="mr-2 h-4 w-4" /> Rembourser
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      openActionDialog(selectedEscrow, 'release');
                    }}
                  >
                    <ArrowDownCircle className="mr-2 h-4 w-4" /> Libérer les fonds
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'release' ? (
                <Unlock className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowUpCircle className="h-5 w-5 text-orange-600" />
              )}
              {actionType === 'release' ? 'Confirmer la libération' : 'Confirmer le remboursement'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'release' 
                ? `Les fonds de ${formatCurrency(selectedEscrow?.amount || 0)} seront transférés au vendeur`
                : `Les fonds de ${formatCurrency(selectedEscrow?.amount || 0)} seront remboursés à l'acheteur`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="reason">Raison / Notes *</Label>
              <Textarea
                id="reason"
                placeholder={`Raison de ${actionType === 'release' ? 'la libération' : 'du remboursement'}...`}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
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
              variant={actionType === 'refund' ? 'outline' : 'default'}
              className={actionType === 'release' ? 'bg-green-600 hover:bg-green-700' : 'border-orange-500 text-orange-600 hover:bg-orange-50'}
              onClick={handleAction}
              disabled={isLoading || !actionReason.trim()}
            >
              {isLoading ? 'Traitement...' : actionType === 'release' ? 'Confirmer la libération' : 'Confirmer le remboursement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Detail Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-red-600" />
              Détail du litige #{selectedDispute?.id}
            </DialogTitle>
            <DialogDescription>
              Historique complet et gestion du litige
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6 py-4">
              {/* Dispute Summary */}
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Montant concerné</p>
                      <p className="font-bold text-lg text-red-600">{formatCurrency(selectedDispute.escrowAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Priorité</p>
                      <Badge variant={priorityConfig[selectedDispute.priority].variant} 
                             className={priorityConfig[selectedDispute.priority].color}>
                        {priorityConfig[selectedDispute.priority].label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Statut</p>
                      <Badge variant={selectedDispute.status === 'OPEN' ? 'destructive' : 'secondary'}>
                        {selectedDispute.status === 'OPEN' ? 'Ouvert' : selectedDispute.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assigné à</p>
                      <p className="text-sm font-medium">{selectedDispute.assignedTo || 'Non assigné'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chronologie du litige
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedDispute.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.authorRole === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
                            event.authorRole === 'BUYER' ? 'bg-blue-100 text-blue-600' :
                            event.authorRole === 'SELLER' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {event.authorRole === 'ADMIN' ? <Gavel className="h-5 w-5" /> :
                             event.authorRole === 'BUYER' ? <User className="h-5 w-5" /> :
                             event.authorRole === 'SELLER' ? <Building2 className="h-5 w-5" /> :
                             <Clock className="h-5 w-5" />}
                          </div>
                          {index < selectedDispute.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.author}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.type === 'MESSAGE' ? 'Message' :
                               event.type === 'EVIDENCE' ? 'Preuve' :
                               event.type === 'DECISION' ? 'Décision' :
                               event.type === 'ESCALATION' ? 'Escalade' : 'Note'}
                            </Badge>
                            <span className="text-xs text-gray-500 ml-auto">
                              {new Date(event.timestamp).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{event.content}</p>
                          {event.attachments && event.attachments.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {event.attachments.map((file, i) => (
                                <Badge key={i} variant="secondary" className="text-xs cursor-pointer">
                                  📎 {file}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions for admin */}
              {(selectedDispute.status === 'OPEN' || selectedDispute.status === 'INVESTIGATING') && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
                  <Button variant="outline">
                    Demander plus d'infos
                  </Button>
                  <Button variant="destructive">
                    Remboursement total
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Libérer au vendeur
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
