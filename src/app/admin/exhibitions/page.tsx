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
import { Switch } from '@/components/ui/switch';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  Edit,
  Star,
  Users,
  Building2,
  Ticket,
  TrendingUp,
  Image as ImageIcon,
  Grid3X3,
  Pin,
  ExternalLink
} from 'lucide-react';

// Types
type ExhibitionStatus = 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
type BoothStatus = 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'PAID' | 'CANCELLED';

interface Booth {
  id: string;
  number: string;
  type: 'STANDARD' | 'PREMIUM' | 'CORNER' | 'ISLAND';
  size: string; // e.g., "3x3m"
  price: number;
  currency: string;
  status: BoothStatus;
  exhibitorName?: string;
  companyName?: string;
}

interface Exhibition {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ExhibitionStatus;
  venue: string;
  location: string;
  wilaya: string;
  startDate: string;
  endDate: string;
  registrationStart?: string;
  registrationEnd?: string;
  coverImage?: string;
  isFeatured: boolean;
  maxExhibitors: number;
  currentExhibitors: number;
  booths: Booth[];
  createdAt: string;
}

// Sample data
const sampleBooths: Booth[] = [
  { id: 'B1', number: 'A01', type: 'STANDARD', size: '3x3m', price: 50000, currency: 'DZD', status: 'CONFIRMED', exhibitorName: 'Karim Meziani', companyName: 'SARL Technologie Algerienne' },
  { id: 'B2', number: 'A02', type: 'PREMIUM', size: '4x4m', price: 80000, currency: 'DZD', status: 'RESERVED', exhibitorName: 'Fatima Zahra', companyName: 'EURL Industrie Moderne' },
  { id: 'B3', number: 'A03', type: 'CORNER', size: '4x6m', price: 120000, currency: 'DZD', status: 'AVAILABLE' },
  { id: 'B4', number: 'B01', type: 'STANDARD', size: '3x3m', price: 50000, currency: 'DZD', status: 'PAID', exhibitorName: 'Ahmed Benali', companyName: 'Sarl Agro Solutions' },
  { id: 'B5', number: 'B02', type: 'ISLAND', size: '8x8m', price: 250000, currency: 'DZD', status: 'AVAILABLE' },
  { id: 'B6', number: 'B03', type: 'STANDARD', size: '3x3m', price: 50000, currency: 'DZD', status: 'CANCELLED' },
];

const sampleExhibitions: Exhibition[] = [
  {
    id: 'EXH001',
    title: 'Salon de l\'Industrie Algérienne 2024',
    slug: 'sia-2024',
    description: 'Le plus grand événement industriel en Algérie',
    status: 'REGISTRATION_OPEN',
    venue: 'Centre des Conventions d\'Alger',
    location: 'Pins Maritimes, Alger',
    wilaya: 'Alger',
    startDate: '2024-09-15',
    endDate: '2024-09-18',
    registrationStart: '2024-06-01',
    registrationEnd: '2024-08-31',
    isFeatured: true,
    maxExhibitors: 150,
    currentExhibitors: 87,
    booths: sampleBooths,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EXH002',
    title: 'Forum du Commerce B2B Méditerranéen',
    slug: 'fcb2b-med-2024',
    description: 'Rencontrez les acteurs du commerce international',
    status: 'PUBLISHED',
    venue: 'Palais de la Culture Moufdi Zakaria',
    location: 'Rue Sidi M\'hamed, Alger',
    wilaya: 'Alger',
    startDate: '2024-11-10',
    endDate: '2024-11-12',
    registrationStart: '2024-08-15',
    registrationEnd: '2024-10-30',
    isFeatured: false,
    maxExhibitors: 80,
    currentExhibitors: 23,
    booths: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EXH003',
    title: 'Tech Expo Algeria 2024',
    slug: 'tech-expo-dz-2024',
    description: 'Innovation et technologie au cœur d\'Alger',
    status: 'COMPLETED',
    venue: 'Salle OMS, Oran',
    location: 'Route de l\'Université, Oran',
    wilaya: 'Oran',
    startDate: '2024-05-20',
    endDate: '2024-05-22',
    isFeatured: false,
    maxExhibitors: 50,
    currentExhibitors: 48,
    booths: [],
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EXH004',
    title: 'Salon de l\'Agriculture et Agroalimentaire',
    slug: 'agro-alg-2024',
    description: 'Découvrez les innovations du secteur agricole',
    status: 'DRAFT',
    venue: 'Parc des Expositions d\'Alger',
    location: 'Zone des Pins, Alger',
    wilaya: 'Alger',
    startDate: '2025-03-10',
    endDate: '2025-03-14',
    isFeatured: false,
    maxExhibitors: 100,
    currentExhibitors: 0,
    booths: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EXH005',
    title: 'Made in Algeria Expo',
    slug: 'mia-expo-2024',
    description: 'Célébrons la production nationale',
    status: 'ONGOING',
    venue: 'Centre International de Conférences',
    location: 'Chemins de Dely Ibrahim, Alger',
    wilaya: 'Alger',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isFeatured: true,
    maxExhibitors: 200,
    currentExhibitors: 185,
    booths: [],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const statusConfig: Record<ExhibitionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary', color: 'text-gray-700 bg-gray-100 border-gray-200' },
  PUBLISHED: { label: 'Publié', variant: 'default', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  REGISTRATION_OPEN: { label: 'Inscriptions ouvertes', variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
  REGISTRATION_CLOSED: { label: 'Inscriptions fermées', variant: 'secondary', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  ONGOING: { label: 'En cours', variant: 'default', color: 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse' },
  COMPLETED: { label: 'Terminé', variant: 'secondary', color: 'text-gray-700 bg-gray-100 border-gray-200' },
  CANCELLED: { label: 'Annulé', variant: 'destructive', color: '' },
};

const boothTypeConfig: Record<Booth['type'], { label: string; color: string }> = {
  STANDARD: { label: 'Standard', color: 'bg-blue-100 text-blue-800' },
  PREMIUM: { label: 'Premium', color: 'bg-purple-100 text-purple-800' },
  CORNER: { label: 'Coin', color: 'bg-orange-100 text-orange-800' },
  ISLAND: { label: 'Îlot', color: 'bg-green-100 text-green-800' },
};

const boothStatusConfig: Record<BoothStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  AVAILABLE: { label: 'Disponible', variant: 'outline', color: 'text-green-700 bg-green-50 border-green-200' },
  RESERVED: { label: 'Réservé', variant: 'secondary', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  CONFIRMED: { label: 'Confirmé', variant: 'default', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  PAID: { label: 'Payé', variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Annulé', variant: 'secondary', color: 'text-gray-700 bg-gray-100 border-gray-200' },
};

export default function ExhibitionsManagementPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(sampleExhibitions);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  
  // Booth management dialog
  const [boothDialogOpen, setBoothDialogOpen] = useState(false);

  // Filter exhibitions
  const filteredExhibitions = useMemo(() => {
    let result = [...exhibitions];
    
    if (activeTab !== 'all') {
      if (activeTab === 'featured') {
        result = result.filter(e => e.isFeatured);
      } else if (activeTab === 'upcoming') {
        result = result.filter(e => 
          ['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED'].includes(e.status)
        );
      } else {
        result = result.filter(e => e.status === activeTab.toUpperCase());
      }
    }
    
    if (statusFilter !== 'ALL') {
      result = result.filter(e => e.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query) ||
        e.location.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      // Featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Then by date
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
    
    return result;
  }, [exhibitions, activeTab, searchQuery, statusFilter]);

  // Stats
  const totalExhibitions = exhibitions.length;
  const activeExhibitions = exhibitions.filter(e => 
    ['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING'].includes(e.status)
  ).length;
  const totalRegistrations = exhibitions.reduce((sum, e) => sum + e.currentExhibitors, 0);
  const featuredCount = exhibitions.filter(e => e.isFeatured).length;

  // Handlers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const openDetailDialog = (exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    setDetailDialogOpen(true);
  };

  const toggleFeatured = async (exhibitionId: string) => {
    setExhibitions(prev => prev.map(e => 
      e.id === exhibitionId ? { ...e, isFeatured: !e.isFeatured } : e
    ));
  };

  const updateStatus = async (exhibitionId: string, newStatus: ExhibitionStatus) => {
    setExhibitions(prev => prev.map(e => 
      e.id === exhibitionId ? { ...e, status: newStatus } : e
    ));
  };

  const openBoothDialog = (exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    setBoothDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Titre', 'Statut', 'Lieu', 'Wilaya', 'Date début', 'Date fin', 'Exposants actuels', 'Max exposants', 'À la une'];
    const csvRows = filteredExhibitions.map(e => [
      e.title,
      statusConfig[e.status].label,
      e.venue,
      e.wilaya,
      formatDate(e.startDate),
      formatDate(e.endDate),
      e.currentExhibitors.toString(),
      e.maxExhibitors.toString(),
      e.isFeatured ? 'Oui' : 'Non'
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expositions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Expositions</h1>
          <p className="text-gray-500 mt-1">Créez et gérez les événements et salons</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle exposition
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total expositions"
          value={totalExhibitions}
          description="Tous statuts confondus"
          icon={Calendar}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Actives"
          value={activeExhibitions}
          description="En cours ou à venir"
          icon={TrendingUp}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Total inscriptions"
          value={totalRegistrations}
          description={`${exhibitions.reduce((sum, e) => sum + e.maxExhibitors, 0)} places disponibles`}
          icon={Users}
          iconClassName="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="À la une"
          value={featuredCount}
          description="Mises en avant"
          icon={Star}
          iconClassName="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par titre ou lieu..."
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
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="REGISTRATION_OPEN">Inscriptions ouvertes</SelectItem>
                <SelectItem value="ONGOING">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({exhibitions.length})</TabsTrigger>
          <TabsTrigger value="featured" className="gap-1">
            <Star className="h-3.5 w-3.5 hidden sm:inline" /> À la une ({featuredCount})
          </TabsTrigger>
          <TabsTrigger value="upcoming">À venir</TabsTrigger>
          <TabsTrigger value="ONGOING" className="gap-1">
            <Clock className="h-3.5 w-3.5 hidden sm:inline" /> En cours
          </TabsTrigger>
          <TabsTrigger value="COMPLETED">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredExhibitions.length > 0 ? (
              filteredExhibitions.map((exhibition) => (
                <Card key={exhibition.id} className={`overflow-hidden ${exhibition.isFeatured ? 'ring-2 ring-yellow-300' : ''}`}>
                  {/* Cover Image Placeholder */}
                  <div className="h-40 bg-gradient-to-br from-orange-400 to-red-500 relative">
                    {exhibition.isFeatured && (
                      <Badge className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                        <Pin className="h-3 w-3 mr-1" /> À la une
                      </Badge>
                    )}
                    <Badge 
                      variant={statusConfig[exhibition.status].variant}
                      className={`absolute bottom-3 right-3 ${statusConfig[exhibition.status].color}`}
                    >
                      {statusConfig[exhibition.status].label}
                    </Badge>
                  </div>

                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{exhibition.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{exhibition.venue}, {exhibition.wilaya}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(exhibition.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{exhibition.currentExhibitors}/{exhibition.maxExhibitors}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Taux de remplissage</span>
                        <span>{Math.round((exhibition.currentExhibitors / exhibition.maxExhibitors) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(exhibition.currentExhibitors / exhibition.maxExhibitors) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`featured-${exhibition.id}`} className="text-xs text-gray-500">
                          À la une
                        </Label>
                        <Switch
                          id={`featured-${exhibition.id}`}
                          checked={exhibition.isFeatured}
                          onCheckedChange={() => toggleFeatured(exhibition.id)}
                        />
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openDetailDialog(exhibition)}>
                            <Eye className="mr-2 h-4 w-4" /> Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openBoothDialog(exhibition)}>
                            <Grid3X3 className="mr-2 h-4 w-4" /> Gérer les stands
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" /> Voir sur le site
                          </DropdownMenuItem>
                          
                          {(exhibition.status === 'DRAFT' || exhibition.status === 'PUBLISHED') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => updateStatus(exhibition.id, 'REGISTRATION_OPEN')}
                                className="text-green-600 focus:text-green-600"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Ouvrir inscriptions
                              </DropdownMenuItem>
                            </>
                          )}

                          {!['COMPLETED', 'CANCELLED'].includes(exhibition.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => updateStatus(exhibition.id, 'CANCELLED')}
                                className="text-red-600 focus:text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Annuler
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucune exposition trouvée</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres ou créez une nouvelle exposition</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedExhibition?.title}
            </DialogTitle>
            <DialogDescription>
              Informations détaillées sur cette exposition
            </DialogDescription>
          </DialogHeader>

          {selectedExhibition && (
            <div className="space-y-6 py-4">
              {/* Status and Key Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Statut</p>
                    <Badge variant={statusConfig[selectedExhibition.status].variant} 
                           className={`${statusConfig[selectedExhibition.status].color} mt-1`}>
                      {statusConfig[selectedExhibition.status].label}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Dates</p>
                    <p className="font-medium mt-1">{formatDate(selectedExhibition.startDate)}</p>
                    <p className="text-xs text-gray-500">au {formatDate(selectedExhibition.endDate)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Inscriptions</p>
                    <p className="font-semibold text-lg mt-1">{selectedExhibition.currentExhibitors}</p>
                    <p className="text-xs text-gray-500">/ {selectedExhibition.maxExhibitors}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Remplissage</p>
                    <p className="font-semibold text-lg text-green-600 mt-1">
                      {Math.round((selectedExhibition.currentExhibitors / selectedExhibition.maxExhibitors) * 100)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Location */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Lieu
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Venue</p>
                      <p className="font-medium">{selectedExhibition.venue}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Adresse</p>
                      <p>{selectedExhibition.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Wilaya</p>
                      <p>{selectedExhibition.wilaya}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Period */}
              {selectedExhibition.registrationStart && selectedExhibition.registrationEnd && (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Ticket className="h-4 w-4" /> Période d&apos;inscription
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Début</p>
                        <p className="font-medium">{formatDate(selectedExhibition.registrationStart)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fin</p>
                        <p className="font-medium">{formatDate(selectedExhibition.registrationEnd)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedExhibition.description}</p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => openBoothDialog(selectedExhibition)}>
                  <Grid3X3 className="mr-2 h-4 w-4" /> Gérer les stands
                </Button>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" /> Modifier
                </Button>
                <Button>
                  <ExternalLink className="mr-2 h-4 w-4" /> Voir sur le site
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booth Management Dialog */}
      <Dialog open={boothDialogOpen} onOpenChange={setBoothDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Gestion des stands - {selectedExhibition?.title}
            </DialogTitle>
            <DialogDescription>
              Visualisez et gérez tous les stands de cette exposition
            </DialogDescription>
          </DialogHeader>

          {selectedExhibition && selectedExhibition.booths.length > 0 ? (
            <div className="space-y-4 py-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-bold">{selectedExhibition.booths.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-xs text-gray-500">Disponibles</p>
                    <p className="text-xl font-bold text-green-600">
                      {selectedExhibition.booths.filter(b => b.status === 'AVAILABLE').length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-xs text-gray-500">Réservés</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {selectedExhibition.booths.filter(b => b.status === 'RESERVED').length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-xs text-gray-500">Confirmés</p>
                    <p className="text-xl font-bold text-blue-600">
                      {selectedExhibition.booths.filter(b => b.status === 'CONFIRMED' || b.status === 'PAID').length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className="text-xs text-gray-500">Revenus</p>
                    <p className="text-lg font-bold text-green-700">
                      {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(
                        selectedExhibition.booths
                          .filter(b => b.status === 'PAID')
                          .reduce((sum, b) => sum + b.price, 0)
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Booths Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stand</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Exposant</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedExhibition.booths.map((booth) => (
                        <TableRow key={booth.id}>
                          <TableCell>
                            <code className="text-sm font-medium">{booth.number}</code>
                          </TableCell>
                          <TableCell>
                            <Badge className={boothTypeConfig[booth.type].color}>
                              {boothTypeConfig[booth.type].label}
                            </Badge>
                          </TableCell>
                          <TableCell>{booth.size}</TableCell>
                          <TableCell>
                            <span className="font-medium text-green-700">
                              {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(booth.price)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={boothStatusConfig[booth.status].variant} 
                                   className={boothStatusConfig[booth.status].color}>
                              {boothStatusConfig[booth.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {booth.exhibitorName ? (
                              <div>
                                <p className="text-sm font-medium">{booth.exhibitorName}</p>
                                {booth.companyName && (
                                  <p className="text-xs text-gray-500">{booth.companyName}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Voir détails</DropdownMenuItem>
                                {booth.status === 'RESERVED' && (
                                  <DropdownMenuItem className="text-green-600">Confirmer</DropdownMenuItem>
                                )}
                                {booth.status === 'CONFIRMED' && (
                                  <DropdownMenuItem className="text-blue-600">Marquer payé</DropdownMenuItem>
                                )}
                                {booth.status !== 'CANCELLED' && booth.status !== 'PAID' && (
                                  <DropdownMenuItem className="text-red-600">Annuler</DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Grid3X3 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucun stand configuré</h3>
              <p className="text-sm text-gray-500 mb-4">Commencez par ajouter des stands pour cette exposition</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Ajouter un stand
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
