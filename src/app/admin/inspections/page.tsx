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
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Calendar,
  MapPin,
  User,
  Building2,
  FileText,
  DollarSign,
  Users,
  Plus,
  Edit,
  RefreshCw,
  Camera,
  Star,
  TrendingUp
} from 'lucide-react';

// Types
type InspectionStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
type InspectionType = 'QUALITY' | 'PRE_SHIPMENT' | 'FACTORY_AUDIT' | 'SAMPLE_CHECK' | 'LOADING_SUPERVISION';

interface Inspector {
  id: string;
  name: string;
  email: string;
  phone: string;
  specializations: InspectionType[];
  rating: number;
  completedInspections: number;
  isAvailable: boolean;
}

interface ServicePricing {
  id: string;
  type: InspectionType;
  basePrice: number;
  currency: string;
  duration: number; // in hours
  description: string;
  isActive: boolean;
}

interface InspectionBooking {
  id: string;
  bookingRef: string;
  type: InspectionType;
  status: InspectionStatus;
  clientName: string;
  clientEmail: string;
  companyName?: string;
  inspectorId?: string;
  inspectorName?: string;
  location: string;
  wilaya: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completedAt?: string;
  price: number;
  currency: string;
  notes?: string;
  reportUrl?: string;
  createdAt: string;
}

// Sample data
const sampleInspectors: Inspector[] = [
  {
    id: 'INS001',
    name: 'Mohamed Belkacem',
    email: 'm.belkacem@inspect-dz.dz',
    phone: '+213 555 111 222',
    specializations: ['QUALITY', 'PRE_SHIPMENT'],
    rating: 4.8,
    completedInspections: 156,
    isAvailable: true,
  },
  {
    id: 'INS002',
    name: 'Amina Hadj',
    email: 'a.hadj@inspect-dz.dz',
    phone: '+213 661 333 444',
    specializations: ['FACTORY_AUDIT', 'SAMPLE_CHECK'],
    rating: 4.9,
    completedInspections: 203,
    isAvailable: true,
  },
  {
    id: 'INS003',
    name: 'Rachid Talem',
    email: 'r.talem@inspect-dz.dz',
    phone: '+213 777 555 666',
    specializations: ['LOADING_SUPERVISION', 'PRE_SHIPMENT'],
    rating: 4.6,
    completedInspections: 89,
    isAvailable: false,
  },
];

const samplePricing: ServicePricing[] = [
  {
    id: 'PRC001',
    type: 'QUALITY',
    basePrice: 15000,
    currency: 'DZD',
    duration: 3,
    description: 'Contrôle qualité standard',
    isActive: true,
  },
  {
    id: 'PRC002',
    type: 'PRE_SHIPMENT',
    basePrice: 25000,
    currency: 'DZD',
    duration: 5,
    description: 'Inspection pré-expédition complète',
    isActive: true,
  },
  {
    id: 'PRC003',
    type: 'FACTORY_AUDIT',
    basePrice: 45000,
    currency: 'DZD',
    duration: 8,
    description: 'Audit d\'usine complet',
    isActive: true,
  },
  {
    id: 'PRC004',
    type: 'SAMPLE_CHECK',
    basePrice: 10000,
    currency: 'DZD',
    duration: 2,
    description: 'Vérification d\'échantillons',
    isActive: true,
  },
  {
    id: 'PRC005',
    type: 'LOADING_SUPERVISION',
    basePrice: 20000,
    currency: 'DZD',
    duration: 4,
    description: 'Supervision de chargement',
    isActive: true,
  },
];

const sampleBookings: InspectionBooking[] = [
  {
    id: 'B001',
    bookingRef: 'INSP-2024-0001',
    type: 'PRE_SHIPMENT',
    status: 'PENDING',
    clientName: 'Karim Meziani',
    clientEmail: 'karim@example.com',
    companyName: 'SARL Technologie Algerienne',
    location: 'Zone Industrielle Oued Smar',
    wilaya: 'Alger',
    price: 25000,
    currency: 'DZD',
    notes: 'Inspection de serveurs avant expédition vers Oran',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'B002',
    bookingRef: 'INSP-2024-0002',
    type: 'QUALITY',
    status: 'SCHEDULED',
    clientName: 'Fatima Zahra',
    clientEmail: 'fatima@example.com',
    companyName: 'EURL Industrie Moderne',
    inspectorId: 'INS001',
    inspectorName: 'Mohamed Belkacem',
    location: 'Parc Industriel Hassi Messaoud',
    wilaya: 'Ouargla',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledTime: '09:00',
    price: 15000,
    currency: 'DZD',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'B003',
    bookingRef: 'INSP-2024-0003',
    type: 'FACTORY_AUDIT',
    status: 'IN_PROGRESS',
    clientName: 'Ahmed Benali',
    clientEmail: 'ahmed@example.com',
    companyName: 'Sarl Agro Solutions',
    inspectorId: 'INS002',
    inspectorName: 'Amina Hadj',
    location: 'Zone Industrielle Ain Mlila',
    wilaya: 'Milan',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '08:30',
    price: 45000,
    currency: 'DZD',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'B004',
    bookingRef: 'INSP-2024-0004',
    type: 'SAMPLE_CHECK',
    status: 'COMPLETED',
    clientName: 'Samira Khelifi',
    clientEmail: 'samira@example.com',
    companyName: 'SPA Distribution Plus',
    inspectorId: 'INS001',
    inspectorName: 'Mohamed Belkacem',
    location: 'Port d\'Alger',
    wilaya: 'Alger',
    scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    price: 10000,
    currency: 'DZD',
    reportUrl: '#',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'B005',
    bookingRef: 'INSP-2024-0005',
    type: 'LOADING_SUPERVISION',
    status: 'CANCELLED',
    clientName: 'Youssef Ammar',
    clientEmail: 'youssef@example.com',
    location: 'Zone Portuaire Skikda',
    wilaya: 'Skikda',
    price: 20000,
    currency: 'DZD',
    notes: 'Annulation par le client - expédition retardée',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const statusConfig: Record<InspectionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'outline', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  SCHEDULED: { label: 'Planifiée', variant: 'secondary', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'En cours', variant: 'default', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  COMPLETED: { label: 'Terminée', variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Annulée', variant: 'secondary', color: 'text-gray-700 bg-gray-100 border-gray-200' },
  DISPUTED: { label: 'Litigieuse', variant: 'destructive', color: '' },
};

const typeConfig: Record<InspectionType, { label: string; icon: React.ReactNode }> = {
  QUALITY: { label: 'Contrôle qualité', icon: <ClipboardCheck className="h-4 w-4" /> },
  PRE_SHIPMENT: { label: 'Pré-expédition', icon: <FileText className="h-4 w-4" /> },
  FACTORY_AUDIT: { label: 'Audit usine', icon: <Building2 className="h-4 w-4" /> },
  SAMPLE_CHECK: { label: 'Vérif. échantillon', icon: <Camera className="h-4 w-4" /> },
  LOADING_SUPERVISION: { label: 'Super. chargement', icon: <Users className="h-4 w-4" /> },
};

export default function InspectionsManagementPage() {
  const [bookings] = useState<InspectionBooking[]>(sampleBookings);
  const [inspectors] = useState<Inspector[]>(sampleInspectors);
  const [pricing, setPricing] = useState<ServicePricing[]>(samplePricing);
  const [activeTab, setActiveTab] = useState('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<InspectionBooking | null>(null);
  
  // Assignment dialog states
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState<string>('');
  
  // Pricing dialog states
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<ServicePricing | null>(null);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    
    if (statusFilter !== 'ALL') {
      result = result.filter(b => b.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.bookingRef.toLowerCase().includes(query) ||
        b.clientName.toLowerCase().includes(query) ||
        b.companyName?.toLowerCase().includes(query) ||
        b.location.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
      if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return result;
  }, [bookings, searchQuery, statusFilter]);

  // Stats
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const todayBookings = bookings.filter(b => 
    b.scheduledDate === new Date().toISOString().split('T')[0]
  ).length;
  const completedThisMonth = bookings.filter(b => 
    b.status === 'COMPLETED' && 
    b.completedAt &&
    new Date(b.completedAt).getMonth() === new Date().getMonth()
  ).length;
  const totalRevenue = bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.price, 0);

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

  const openDetailDialog = (booking: InspectionBooking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const openAssignmentDialog = (booking: InspectionBooking) => {
    setSelectedBooking(booking);
    setSelectedInspector(booking.inspectorId || '');
    setAssignmentDialogOpen(true);
  };

  const handleAssignInspector = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Assigning inspector ${selectedInspector} to booking ${selectedBooking?.id}`);
    setAssignmentDialogOpen(false);
  };

  const openPricingDialog = (price?: ServicePricing) => {
    setEditingPricing(price || {
      id: '',
      type: 'QUALITY',
      basePrice: 0,
      currency: 'DZD',
      duration: 1,
      description: '',
      isActive: true,
    });
    setPricingDialogOpen(true);
  };

  const handleSavePricing = async () => {
    if (!editingPricing) return;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingPricing.id) {
      setPricing(prev => prev.map(p => p.id === editingPricing.id ? editingPricing : p));
    } else {
      setPricing(prev => [...prev, { ...editingPricing, id: `PRC${Date.now()}` }]);
    }
    setPricingDialogOpen(false);
  };

  const exportToCSV = () => {
    const headers = ['Réf', 'Type', 'Client', 'Entreprise', 'Localisation', 'Wilaya', 'Statut', 'Prix', 'Date création'];
    const csvRows = filteredBookings.map(b => [
      b.bookingRef,
      typeConfig[b.type].label,
      b.clientName,
      b.companyName || '',
      b.location,
      b.wilaya,
      statusConfig[b.status].label,
      formatCurrency(b.price),
      formatDate(b.createdAt)
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inspections_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Inspections</h1>
          <p className="text-gray-500 mt-1">Planifiez et suivez les inspections qualité</p>
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
          description="À assigner"
          icon={Clock}
          iconClassName={pendingCount > 0 ? "bg-yellow-100 text-yellow-600 animate-pulse" : "bg-gray-100 text-gray-600"}
        />
        <StatsCard
          title="Aujourd'hui"
          value={todayBookings}
          description="Inspections planifiées"
          icon={Calendar}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Ce mois"
          value={completedThisMonth}
          description="Terminées"
          icon={CheckCircle2}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Revenus"
          value={formatCurrency(totalRevenue)}
          description="Inspections complétées"
          icon={DollarSign}
          iconClassName="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bookings" className="gap-1">
            <ClipboardCheck className="h-4 w-4" /> Réservations ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="inspectors" className="gap-1">
            <Users className="h-4 w-4" /> Inspecteurs ({inspectors.length})
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1">
            <DollarSign className="h-4 w-4" /> Tarifs ({pricing.length})
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par référence, client ou localisation..."
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
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="SCHEDULED">Planifiée</SelectItem>
                    <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                    <SelectItem value="COMPLETED">Terminée</SelectItem>
                    <SelectItem value="CANCELLED">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          <Card>
            <CardContent className="p-0">
              {filteredBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead>Référence</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="hidden lg:table-cell">Localisation</TableHead>
                        <TableHead>Inspecteur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden md:table-cell">Prix</TableHead>
                        <TableHead className="hidden lg:table-cell">Date</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => {
                        const status = statusConfig[booking.status];
                        const type = typeConfig[booking.type];
                        
                        return (
                          <TableRow 
                            key={booking.id}
                            className={
                              booking.status === 'PENDING' 
                                ? 'bg-yellow-50/30 hover:bg-yellow-50/50' 
                                : booking.status === 'IN_PROGRESS'
                                  ? 'bg-purple-50/30 hover:bg-purple-50/50'
                                  : ''
                            }
                          >
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{booking.bookingRef}</code>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm">
                                {type.icon}
                                <span className="hidden sm:inline">{type.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{booking.clientName}</p>
                                {booking.companyName && (
                                  <p className="text-xs text-gray-500">{booking.companyName}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-start gap-1 text-sm max-w-[150px]">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="truncate">{booking.location}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {booking.inspectorName ? (
                                <span className="text-sm">{booking.inspectorName}</span>
                              ) : (
                                <Badge variant="outline" className="text-xs text-orange-600">
                                  Non assigné
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className={status.color}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="font-medium text-green-700">{formatCurrency(booking.price)}</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-sm text-gray-600">
                                {booking.scheduledDate ? formatDate(booking.scheduledDate) : formatDate(booking.createdAt)}
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
                                  <DropdownMenuItem onClick={() => openDetailDialog(booking)}>
                                    <Eye className="mr-2 h-4 w-4" /> Voir détails
                                  </DropdownMenuItem>
                                  
                                  {!booking.inspectorId && booking.status === 'PENDING' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => openAssignmentDialog(booking)}
                                        className="text-blue-600 focus:text-blue-600"
                                      >
                                        <User className="mr-2 h-4 w-4" /> Assigner inspecteur
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {booking.status === 'COMPLETED' && booking.reportUrl && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <FileText className="mr-2 h-4 w-4" /> Télécharger rapport
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
                  <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucune réservation trouvée</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspectors Tab */}
        <TabsContent value="inspectors" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspectors.map((inspector) => (
              <Card key={inspector.id} className={!inspector.isAvailable ? 'opacity-70' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        inspector.isAvailable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{inspector.name}</h3>
                        <Badge variant={inspector.isAvailable ? 'default' : 'secondary'} 
                               className={inspector.isAvailable ? 'bg-green-100 text-green-800' : ''}>
                          {inspector.isAvailable ? 'Disponible' : 'Indisponible'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{inspector.rating}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-16 text-gray-500">Email:</span>
                      <span className="truncate">{inspector.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-16 text-gray-500">Téléphone:</span>
                      <span>{inspector.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-16 text-gray-500">Inspections:</span>
                      <span>{inspector.completedInspections} réalisées</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Spécialisations:</p>
                    <div className="flex flex-wrap gap-1">
                      {inspector.specializations.map(spec => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {typeConfig[spec]?.label || spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Tarifs des services d&apos;inspection</CardTitle>
                <CardDescription>Gérez les prix pour chaque type d&apos;inspection</CardDescription>
              </div>
              <Button onClick={() => openPricingDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter un tarif
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Prix de base</TableHead>
                      <TableHead>Durée estimée</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricing.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeConfig[price.type]?.icon}
                            <span className="font-medium">{typeConfig[price.type]?.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{price.description}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-700">{formatCurrency(price.basePrice)}</span>
                        </TableCell>
                        <TableCell>{price.duration}h</TableCell>
                        <TableCell>
                          <Badge variant={price.isActive ? 'default' : 'secondary'}>
                            {price.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openPricingDialog(price)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Détail de la réservation {selectedBooking?.bookingRef}
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur cette inspection
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Status and Type */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Type</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {typeConfig[selectedBooking.type].icon}
                      <span className="text-sm font-medium">{typeConfig[selectedBooking.type].label}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Statut</p>
                    <Badge variant={statusConfig[selectedBooking.status].variant} 
                           className={`${statusConfig[selectedBooking.status].color} mt-1`}>
                      {statusConfig[selectedBooking.status].label}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Prix</p>
                    <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(selectedBooking.price)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Localisation</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedBooking.wilaya}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Client Info */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Client</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nom</p>
                      <p className="font-medium">{selectedBooking.clientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p>{selectedBooking.clientEmail}</p>
                    </div>
                    {selectedBooking.companyName && (
                      <div>
                        <p className="text-sm text-gray-500">Entreprise</p>
                        <p className="font-medium">{selectedBooking.companyName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Adresse d&apos;inspection</p>
                      <p>{selectedBooking.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Info */}
              {(selectedBooking.scheduledDate || selectedBooking.completedAt) && (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Planning
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedBooking.scheduledDate && (
                        <div>
                          <p className="text-gray-500">Date planifiée</p>
                          <p className="font-medium">
                            {formatDate(selectedBooking.scheduledDate)}
                            {selectedBooking.scheduledTime && ` à ${selectedBooking.scheduledTime}`}
                          </p>
                        </div>
                      )}
                      {selectedBooking.completedAt && (
                        <div>
                          <p className="text-gray-500">Date de réalisation</p>
                          <p className="font-medium">{formatDate(selectedBooking.completedAt)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Inspector Info */}
              {selectedBooking.inspectorName && (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4" /> Inspecteur assigné
                    </h4>
                    <p className="font-medium">{selectedBooking.inspectorName}</p>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Report Download */}
              {selectedBooking.reportUrl && (
                <Button className="w-full" variant="outline">
                  <FileText className="mr-2 h-4 w-4" /> Télécharger le rapport d&apos;inspection
                </Button>
              )}

              {/* Actions for pending bookings */}
              {selectedBooking.status === 'PENDING' && !selectedBooking.inspectorId && (
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      openAssignmentDialog(selectedBooking);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" /> Assigner un inspecteur
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigner un inspecteur
            </DialogTitle>
            <DialogDescription>
              Sélectionnez un inspecteur disponible pour la réservation {selectedBooking?.bookingRef}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Label htmlFor="inspector">Inspecteur *</Label>
            <Select value={selectedInspector} onValueChange={setSelectedInspector}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un inspecteur" />
              </SelectTrigger>
              <SelectContent>
                {inspectors
                  .filter(i => i.isAvailable)
                  .map(inspector => (
                    <SelectItem key={inspector.id} value={inspector.id}>
                      <div className="flex items-center gap-2">
                        <span>{inspector.name}</span>
                        <span className="text-xs text-gray-500">({inspector.completedInspections} inspections)</span>
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>

            {selectedInspector && (() => {
              const inspector = inspectors.find(i => i.id === selectedInspector);
              return inspector ? (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{inspector.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {inspector.rating}
                          <span>•</span>
                          {inspector.specializations.length} spécialités
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAssignInspector}
              disabled={!selectedInspector}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmer l&apos;assignation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPricing?.id ? 'Modifier le tarif' : 'Ajouter un tarif'}
            </DialogTitle>
            <DialogDescription>
              Configurez le prix pour ce type d&apos;inspection
            </DialogDescription>
          </DialogHeader>

          {editingPricing && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type d&apos;inspection</Label>
                <Select 
                  value={editingPricing.type} 
                  onValueChange={(val) => setEditingPricing({ ...editingPricing, type: val as InspectionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prix de base (DZD)</Label>
                <Input
                  type="number"
                  value={editingPricing.basePrice}
                  onChange={(e) => setEditingPricing({ ...editingPricing, basePrice: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Durée estimée (heures)</Label>
                <Input
                  type="number"
                  value={editingPricing.duration}
                  onChange={(e) => setEditingPricing({ ...editingPricing, duration: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingPricing.description}
                  onChange={(e) => setEditingPricing({ ...editingPricing, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setPricingDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePricing}>
              {editingPricing?.id ? 'Sauvegarder' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
