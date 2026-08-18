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
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Play,
  Pause,
  Flag,
  Image as ImageIcon,
  Home,
  Film,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  User,
  Calendar
} from 'lucide-react';

// Types
type ContentStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'REMOVED';
type ContentType = 'PRODUCT_VIDEO' | 'COMPANY_TOUR' | 'PROMO_VIDEO' | 'VIRTUAL_TOUR' | 'DEMO_VIDEO';
type FlagReason = 'INAPPROPRIATE' | 'COPYRIGHT' | 'MISLEADING' | 'SPAM' | 'LOW_QUALITY' | 'OTHER';

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  authorName: string;
  authorEmail: string;
  companyName?: string;
  duration: number; // in seconds
  thumbnailUrl?: string;
  videoUrl: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  views: number;
  likes: number;
  dislikes: number;
  flagReason?: FlagReason;
  flagNotes?: string;
  rejectionReason?: string;
}

// Sample data
const sampleContent: ContentItem[] = [
  {
    id: 'VID001',
    title: 'Présentation des serveurs Dell PowerEdge',
    type: 'PRODUCT_VIDEO',
    status: 'PENDING',
    authorName: 'Karim Meziani',
    authorEmail: 'karim@example.com',
    companyName: 'SARL Technologie Algerienne',
    duration: 185,
    thumbnailUrl: '/placeholder-video.jpg',
    videoUrl: '#',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    views: 0,
    likes: 0,
    dislikes: 0,
  },
  {
    id: 'VID002',
    title: 'Visite virtuelle de nos locaux à Alger',
    type: 'COMPANY_TOUR',
    status: 'REVIEWING',
    authorName: 'Fatima Zahra',
    authorEmail: 'fatima@example.com',
    companyName: 'EURL Industrie Moderne',
    duration: 320,
    thumbnailUrl: '/placeholder-tour.jpg',
    videoUrl: '#',
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    views: 12,
    likes: 5,
    dislikes: 0,
  },
  {
    id: 'VID003',
    title: 'Demo machine CNC - Capacités complètes',
    type: 'DEMO_VIDEO',
    status: 'APPROVED',
    authorName: 'Ahmed Benali',
    authorEmail: 'ahmed@example.com',
    companyName: 'Sarl Agro Solutions',
    duration: 450,
    thumbnailUrl: '/placeholder-demo.jpg',
    videoUrl: '#',
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Admin Leila',
    views: 245,
    likes: 89,
    dislikes: 3,
  },
  {
    id: 'VID004',
    title: 'Promo soldes été 2024',
    type: 'PROMO_VIDEO',
    status: 'FLAGGED',
    authorName: 'Samira Khelifi',
    authorEmail: 'samira@example.com',
    companyName: 'SPA Distribution Plus',
    duration: 60,
    thumbnailUrl: '/placeholder-promo.jpg',
    videoUrl: '#',
    submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    views: 567,
    likes: 23,
    dislikes: 45,
    flagReason: 'MISLEADING',
    flagNotes: 'Les prix affichés ne correspondent pas aux prix réels sur le site',
  },
  {
    id: 'VID005',
    title: 'Tour 360° de l\'entrepôt logistique',
    type: 'VIRTUAL_TOUR',
    status: 'REJECTED',
    authorName: 'Youssef Ammar',
    authorEmail: 'youssef@example.com',
    companyName: 'SARL Distribution Plus',
    duration: 580,
    thumbnailUrl: '/placeholder-360.jpg',
    videoUrl: '#',
    submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 68 * 60 * 60 * 1000).toISOString(),
    reviewedBy: 'Admin Omar',
    rejectionReason: 'Qualité vidéo insuffisante - images floues et navigation difficile',
    views: 0,
    likes: 0,
    dislikes: 0,
  },
  {
    id: 'VID006',
    title: 'Nouvelle gamme de produits agricoles',
    type: 'PRODUCT_VIDEO',
    status: 'PENDING',
    authorName: 'Nadia Bouazza',
    authorEmail: 'nadia@example.com',
    companyName: 'Sarl Agro Solutions',
    duration: 240,
    videoUrl: '#',
    submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    views: 0,
    likes: 0,
    dislikes: 0,
  },
];

const statusConfig: Record<ContentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'outline', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  REVIEWING: { label: 'En cours', variant: 'secondary', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  APPROVED: { label: 'Approuvé', variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
  REJECTED: { label: 'Rejeté', variant: 'destructive', color: '' },
  FLAGGED: { label: 'Signalé', variant: 'destructive', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  REMOVED: { label: 'Supprimé', variant: 'secondary', color: 'text-gray-700 bg-gray-100 border-gray-200' },
};

const typeConfig: Record<ContentType, { label: string; icon: React.ReactNode }> = {
  PRODUCT_VIDEO: { label: 'Vidéo produit', icon: <Video className="h-4 w-4" /> },
  COMPANY_TOUR: { label: 'Visite entreprise', icon: <Home className="h-4 w-4" /> },
  PROMO_VIDEO: { label: 'Vidéo promo', icon: <Film className="h-4 w-4" /> },
  VIRTUAL_TOUR: { label: 'Tour virtuel', icon: <ImageIcon className="h-4 w-4" /> },
  DEMO_VIDEO: { label: 'Démo produit', icon: <Play className="h-4 w-4" /> },
};

const flagReasonConfig: Record<FlagReason, { label: string; description: string }> = {
  INAPPROPRIATE: { label: 'Inapproprié', description: 'Contenu inapproprié' },
  COPYRIGHT: { label: 'Droit d\'auteur', description: 'Violation de copyright' },
  MISLEADING: { label: 'Trompeur', description: 'Informations mensongères' },
  SPAM: { label: 'Spam', description: 'Contenu spam' },
  LOW_QUALITY: { label: 'Basse qualité', description: 'Qualité insuffisante' },
  OTHER: { label: 'Autre', description: 'Autre raison' },
};

export default function ContentModerationPage() {
  const [content, setContent] = useState<ContentItem[]>(sampleContent);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  
  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  
  // Action dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter content
  const filteredContent = useMemo(() => {
    let result = [...content];
    
    if (activeTab !== 'all') {
      if (activeTab === 'flagged') {
        result = result.filter(c => c.status === 'FLAGGED');
      } else {
        result = result.filter(c => c.status === activeTab.toUpperCase());
      }
    }
    
    if (typeFilter !== 'ALL') {
      result = result.filter(c => c.type === typeFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.authorName.toLowerCase().includes(query) ||
        c.companyName?.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      if (a.status === 'FLAGGED') return -1;
      if (b.status === 'FLAGGED') return 1;
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    return result;
  }, [content, activeTab, searchQuery, typeFilter]);

  // Stats
  const pendingCount = content.filter(c => c.status === 'PENDING').length;
  const flaggedCount = content.filter(c => c.status === 'FLAGGED').length;
  const approvedToday = content.filter(c => 
    c.status === 'APPROVED' && 
    c.reviewedAt && 
    new Date(c.reviewedAt).toDateString() === new Date().toDateString()
  ).length;
  const totalViews = content.reduce((sum, c) => sum + c.views, 0);

  // Handlers
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const openPreviewDialog = (item: ContentItem) => {
    setSelectedContent(item);
    setPreviewDialogOpen(true);
  };

  const openActionDialog = (item: ContentItem, action: 'approve' | 'reject') => {
    setSelectedContent(item);
    setActionType(action);
    setActionReason('');
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedContent) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setContent(prev => prev.map(c => 
      c.id === selectedContent.id 
        ? { 
            ...c, 
            status: actionType === 'approve' ? 'APPROVED' as const : 'REJECTED' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Admin Current',
            rejectionReason: actionType === 'reject' ? actionReason : undefined,
          }
        : c
    ));
    
    setIsLoading(false);
    setActionDialogOpen(false);
    setPreviewDialogOpen(false);
  };

  const handleClearFlag = async (itemId: string) => {
    setContent(prev => prev.map(c => 
      c.id === itemId ? { ...c, status: 'APPROVED' as const, flagReason: undefined, flagNotes: undefined } : c
    ));
  };

  const handleRemoveContent = async (itemId: string) => {
    setContent(prev => prev.map(c => 
      c.id === itemId ? { ...c, status: 'REMOVED' as const } : c
    ));
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Titre', 'Type', 'Auteur', 'Entreprise', 'Durée', 'Statut', 'Vues', 'Date soumission'];
    const csvRows = filteredContent.map(c => [
      c.id,
      c.title,
      typeConfig[c.type].label,
      c.authorName,
      c.companyName || '',
      formatDuration(c.duration),
      statusConfig[c.status].label,
      c.views.toString(),
      formatDate(c.submittedAt)
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contenu_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modération de Contenu</h1>
          <p className="text-gray-500 mt-1">Gérez les vidéos, visites virtuelles et contenus multimédia</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="En attente"
          value={pendingCount}
          description="À modérer"
          icon={Clock}
          iconClassName={pendingCount > 0 ? "bg-yellow-100 text-yellow-600 animate-pulse" : "bg-gray-100 text-gray-600"}
        />
        <StatsCard
          title="Signalés"
          value={flaggedCount}
          description="Nécessitent attention"
          icon={Flag}
          iconClassName={flaggedCount > 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-600"}
        />
        <StatsCard
          title="Approuvés aujourd'hui"
          value={approvedToday}
          description="Contenu validé"
          icon={CheckCircle2}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Total vues"
          value={totalViews.toLocaleString()}
          description="Toutes vidéos"
          icon={Play}
          iconClassName="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par titre ou auteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                <SelectItem value="PRODUCT_VIDEO">Vidéo produit</SelectItem>
                <SelectItem value="COMPANY_TOUR">Visite entreprise</SelectItem>
                <SelectItem value="PROMO_VIDEO">Vidéo promo</SelectItem>
                <SelectItem value="VIRTUAL_TOUR">Tour virtuel</SelectItem>
                <SelectItem value="DEMO_VIDEO">Démo produit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            <Clock className="h-3.5 w-3.5 hidden sm:inline" /> En attente ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="gap-1">
            <Flag className="h-3.5 w-3.5 hidden sm:inline" /> Signalés ({flaggedCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 hidden sm:inline" /> Approuvés
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1">
            <XCircle className="h-3.5 w-3.5 hidden sm:inline" /> Rejetés
          </TabsTrigger>
          <TabsTrigger value="all">Tout</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredContent.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead>Aperçu</TableHead>
                        <TableHead>Contenu</TableHead>
                        <TableHead className="hidden md:table-cell">Auteur</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden lg:table-cell">Stats</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((item) => {
                        const status = statusConfig[item.status];
                        const type = typeConfig[item.type];
                        
                        return (
                          <TableRow 
                            key={item.id}
                            className={
                              item.status === 'FLAGGED' 
                                ? 'bg-orange-50/30 hover:bg-orange-50/50' 
                                : item.status === 'PENDING'
                                  ? 'bg-yellow-50/30 hover:bg-yellow-50/50'
                                  : ''
                            }
                          >
                            <TableCell>
                              <div className="w-16 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                                {item.thumbnailUrl ? (
                                  <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Video className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p className="font-medium truncate">{item.title}</p>
                                {item.companyName && (
                                  <p className="text-xs text-gray-500 truncate">{item.companyName}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div>
                                <p className="text-sm">{item.authorName}</p>
                                <p className="text-xs text-gray-500">{item.authorEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                {type.icon}
                                <span className="hidden sm:inline">{type.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono">{formatDuration(item.duration)}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className={status.color}>
                                {status.label}
                              </Badge>
                              {item.flagReason && (
                                <Badge variant="outline" className="ml-1 text-xs text-orange-600 border-orange-300">
                                  {flagReasonConfig[item.flagReason].label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5" />{item.views}
                                </span>
                                <span className="flex items-center gap-1 text-green-600">
                                  <ThumbsUp className="h-3.5 w-3.5" />{item.likes}
                                </span>
                                {item.dislikes > 0 && (
                                  <span className="flex items-center gap-1 text-red-500">
                                    <ThumbsDown className="h-3.5 w-3.5" />{item.dislikes}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm text-gray-600">
                                {formatDate(item.submittedAt)}
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
                                  <DropdownMenuItem onClick={() => openPreviewDialog(item)}>
                                    <Play className="mr-2 h-4 w-4" /> Prévisualiser
                                  </DropdownMenuItem>
                                  
                                  {(item.status === 'PENDING' || item.status === 'REVIEWING') && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => openActionDialog(item, 'approve')}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Approuver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => openActionDialog(item, 'reject')}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" /> Rejeter
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {item.status === 'FLAGGED' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleClearFlag(item.id)}
                                        className="text-blue-600 focus:text-blue-600"
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Lever le signalement
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleRemoveContent(item.id)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" /> Supprimer
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
                  <Video className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucun contenu trouvé</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {selectedContent?.title}
            </DialogTitle>
            <DialogDescription>
              Prévisualisation du contenu et informations détaillées
            </DialogDescription>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-6 py-4">
              {/* Video Player Placeholder */}
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-16 w-16 text-white/50 mx-auto mb-2" />
                  <p className="text-white/70">Lecteur vidéo</p>
                  <p className="text-white/50 text-sm">Durée: {formatDuration(selectedContent.duration)}</p>
                </div>
              </div>

              {/* Content Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="font-medium text-gray-900">Informations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <div className="flex items-center gap-1">
                          {typeConfig[selectedContent.type].icon}
                          {typeConfig[selectedContent.type].label}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Durée:</span>
                        <span>{formatDuration(selectedContent.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Statut:</span>
                        <Badge variant={statusConfig[selectedContent.status].variant} 
                               className={statusConfig[selectedContent.status].color}>
                          {statusConfig[selectedContent.status].label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Soumis le:</span>
                        <span>{formatDate(selectedContent.submittedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="font-medium text-gray-900">Auteur & Statistiques</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{selectedContent.authorName}</span>
                      </div>
                      {selectedContent.companyName && (
                        <div className="text-gray-600 ml-6">{selectedContent.companyName}</div>
                      )}
                      <div className="border-t pt-2 mt-2 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="font-semibold">{selectedContent.views}</p>
                          <p className="text-xs text-gray-500">Vues</p>
                        </div>
                        <div>
                          <p className="font-semibold text-green-600">{selectedContent.likes}</p>
                          <p className="text-xs text-gray-500">J'aime</p>
                        </div>
                        <div>
                          <p className="font-semibold text-red-500">{selectedContent.dislikes}</p>
                          <p className="text-xs text-gray-500">N'aime pas</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Flag Info */}
              {selectedContent.flagReason && (
                <Card className="border-orange-200 bg-orange-50/30">
                  <CardContent className="pt-4">
                    <h4 className="font-medium text-orange-800 flex items-center gap-2 mb-2">
                      <Flag className="h-4 w-4" />
                      Raison du signalement
                    </h4>
                    <Badge variant="outline" className="mb-2 border-orange-300 text-orange-700">
                      {flagReasonConfig[selectedContent.flagReason].label}
                    </Badge>
                    {selectedContent.flagNotes && (
                      <p className="text-sm text-orange-700 mt-2">{selectedContent.flagNotes}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Rejection Info */}
              {selectedContent.rejectionReason && (
                <Card className="border-red-200 bg-red-50/30">
                  <CardContent className="pt-4">
                    <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4" />
                      Motif du rejet
                    </h4>
                    <p className="text-sm text-red-700">{selectedContent.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {(selectedContent.status === 'PENDING' || selectedContent.status === 'REVIEWING') && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setPreviewDialogOpen(false);
                      openActionDialog(selectedContent, 'reject');
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Rejeter
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setPreviewDialogOpen(false);
                      openActionDialog(selectedContent, 'approve');
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {actionType === 'approve' ? 'Approuver le contenu' : 'Rejeter le contenu'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'Ce contenu sera visible publiquement après approbation'
                : 'Le contenu sera masqué et l\'auteur sera notifié'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'reject' ? (
              <div className="space-y-3">
                <Label htmlFor="reason">Motif du rejet *</Label>
                <Textarea
                  id="reason"
                  placeholder="Expliquez pourquoi ce contenu est rejeté..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Ce contenu sera immédiatement disponible pour tous les utilisateurs.
                </p>
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
