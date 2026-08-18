'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Truck,
  Package,
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Ship,
  Plane,
  Train,
  Star
} from 'lucide-react';

// Types
type ShipmentStatus = 'PENDING' | 'PROCESSING' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
type CarrierStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
type Incoterm = 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' | 'FAS' | 'FOB' | 'CFR' | 'CIF';

interface ShippingRate {
  id: string;
  origin: string; // Wilaya code or region
  originName: string;
  destination: string;
  destinationName: string;
  carrierId: string;
  carrierName: string;
  method: 'GROUND' | 'AIR' | 'SEA' | 'EXPRESS';
  basePrice: number;
  currency: string;
  pricePerKg: number;
  estimatedDays: { min: number; max: number };
  isActive: boolean;
}

interface Carrier {
  id: string;
  name: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  status: CarrierStatus;
  shippingMethods: ('GROUND' | 'AIR' | 'SEA' | 'EXPRESS')[];
  coverage: string[]; // Wilayas covered
  rating: number;
  totalDeliveries: number;
  onTimeRate: number;
}

interface IncotermConfig {
  incoterm: Incoterm;
  description: string;
  isActive: boolean;
  sellerResponsibilities: string[];
  buyerResponsibilities: string[];
}

interface ShipmentTracking {
  id: string;
  trackingNumber: string;
  orderId: string;
  customerName: string;
  carrierName: string;
  method: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  weight: number;
  cost: number;
  currency: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  createdAt: string;
}

interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
  type: 'INFO' | 'LOCATION_UPDATE' | 'DELIVERY_ATTEMPT' | 'EXCEPTION' | 'DELIVERED';
}

// Sample data
const sampleCarriers: Carrier[] = [
  {
    id: 'CAR001',
    name: 'Algerie Poste Express',
    contactEmail: 'express@algerieposte.dz',
    contactPhone: '+213 3000',
    status: 'ACTIVE',
    shippingMethods: ['GROUND', 'EXPRESS'],
    coverage: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'],
    rating: 4.2,
    totalDeliveries: 15420,
    onTimeRate: 87,
  },
  {
    id: 'CAR002',
    name: 'Yassir Logistics',
    contactEmail: 'business@yassir.dz',
    contactPhone: '+213 555 123 456',
    status: 'ACTIVE',
    shippingMethods: ['GROUND', 'EXPRESS'],
    coverage: ['16', '25', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
    rating: 4.5,
    totalDeliveries: 8930,
    onTimeRate: 92,
  },
  {
    id: 'CAR003',
    name: 'CTN Cargo',
    contactEmail: 'info@ctn.dz',
    contactPhone: '+213 661 987 654',
    status: 'ACTIVE',
    shippingMethods: ['GROUND', 'AIR', 'SEA'],
    coverage: ['*'], // National + International
    rating: 3.9,
    totalDeliveries: 5670,
    onTimeRate: 78,
  },
];

const sampleRates: ShippingRate[] = [
  {
    id: 'RATE001',
    origin: '16',
    originName: 'Alger',
    destination: '31',
    destinationName: 'Oran',
    carrierId: 'CAR001',
    carrierName: 'Algerie Poste Express',
    method: 'GROUND',
    basePrice: 800,
    currency: 'DZD',
    pricePerKg: 50,
    estimatedDays: { min: 2, max: 3 },
    isActive: true,
  },
  {
    id: 'RATE002',
    origin: '16',
    originName: 'Alger',
    destination: '31',
    destinationName: 'Oran',
    carrierId: 'CAR002',
    carrierName: 'Yassir Logistics',
    method: 'EXPRESS',
    basePrice: 1200,
    currency: 'DZD',
    pricePerKg: 80,
    estimatedDays: { min: 1, max: 1 },
    isActive: true,
  },
  {
    id: 'RATE003',
    origin: '16',
    originName: 'Alger',
    destination: '04',
    destinationName: 'Ouargla',
    carrierId: 'CAR001',
    carrierName: 'Algerie Poste Express',
    method: 'GROUND',
    basePrice: 1500,
    currency: 'DZD',
    pricePerKg: 100,
    estimatedDays: { min: 4, max: 7 },
    isActive: true,
  },
  {
    id: 'RATE004',
    origin: '31',
    originName: 'Oran',
    destination: '16',
    destinationName: 'Alger',
    carrierId: 'CAR002',
    carrierName: 'Yassir Logistics',
    method: 'EXPRESS',
    basePrice: 1200,
    currency: 'DZD',
    pricePerKg: 80,
    estimatedDays: { min: 1, max: 1 },
    isActive: true,
  },
  {
    id: 'RATE005',
    origin: '16',
    originName: 'Alger',
    destination: '23',
    destinationName: 'Constantine',
    carrierId: 'CAR003',
    carrierName: 'CTN Cargo',
    method: 'AIR',
    basePrice: 2500,
    currency: 'DZD',
    pricePerKg: 150,
    estimatedDays: { min: 1, max: 2 },
    isActive: false,
  },
];

const sampleIncoterms: IncotermConfig[] = [
  {
    incoterm: 'DDP',
    description: 'Rendu droits acquittés - Le vendeur assume tous les risques et coûts',
    isActive: true,
    sellerResponsibilities: ['Emballage', 'Export', 'Transport principal', 'Douane import', 'Livraison finale'],
    buyerResponsibilities: ['Déchargement', 'Importation formelle'],
  },
  {
    incoterm: 'DAP',
    description: 'Rendu au lieu de destination - Le vendeur livre au lieu convenu',
    isActive: true,
    sellerResponsibilities: ['Emballage', 'Export', 'Transport principal', 'Livraison finale'],
    buyerResponsibilities: ['Déchargement', 'Douane import', 'Taxes'],
  },
  {
    incoterm: 'EXW',
    description: 'À l\'usine (départ) - L\'acheteur assume tous les risques et coûts',
    isActive: true,
    sellerResponsibilities: ['Mise à disposition des marchandises'],
    buyerResponsibilities: ['Chargement', 'Transport principal', 'Assurance', 'Douane'],
  },
  {
    incoterm: 'FOB',
    description: 'Franco à bord - Le vendeur livre les marchandises à bord du navire',
    isActive: false,
    sellerResponsibilities: ['Emballage', 'Export', 'Livraison au port', 'Chargement'],
    buyerResponsibilities: ['Transport principal', 'Assurance', 'Douane import'],
  },
];

const sampleShipments: ShipmentTracking[] = [
  {
    id: 'SH001',
    trackingNumber: 'AP20240001234',
    orderId: 'ORD-2024-001',
    customerName: 'Karim Meziani',
    carrierName: 'Algerie Poste Express',
    method: 'GROUND',
    origin: 'Alger',
    destination: 'Oran',
    status: 'IN_TRANSIT',
    weight: 5.5,
    cost: 1075,
    currency: 'DZD',
    estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    events: [
      { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), location: 'Alger', description: 'Colis pris en charge', type: 'INFO' },
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location: 'Blida', description: 'En transit vers Oran', type: 'LOCATION_UPDATE' },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'SH002',
    trackingNumber: 'YL20240005678',
    orderId: 'ORD-2024-002',
    customerName: 'Fatima Zahra',
    carrierName: 'Yassir Logistics',
    method: 'EXPRESS',
    origin: 'Oran',
    destination: 'Alger',
    status: 'OUT_FOR_DELIVERY',
    weight: 2.3,
    cost: 1384,
    currency: 'DZD',
    estimatedDelivery: new Date().toISOString().split('T')[0],
    events: [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), location: 'Oran', description: 'Colis expédié', type: 'INFO' },
      { timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), location: 'Blida', description: 'Transit en cours', type: 'LOCATION_UPDATE' },
      { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), location: 'Alger', description: 'Arrivé au centre de distribution', type: 'LOCATION_UPDATE' },
      { timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), location: 'Alger', description: 'En cours de livraison', type: 'LOCATION_UPDATE' },
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'SH003',
    trackingNumber: 'CTN20240009999',
    orderId: 'ORD-2024-003',
    customerName: 'Ahmed Benali',
    carrierName: 'CTN Cargo',
    method: 'GROUND',
    origin: 'Alger',
    destination: 'Ouargla',
    status: 'PENDING',
    weight: 15,
    cost: 3000,
    currency: 'DZD',
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    events: [
      { timestamp: new Date().toISOString(), location: 'Alger', description: 'Commande créée, en attente de prise en charge', type: 'INFO' },
    ],
    createdAt: new Date().toISOString(),
  },
];

const statusConfig: Record<ShipmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'outline', color: 'text-gray-700 bg-gray-100 border-gray-200' },
  PROCESSING: { label: 'Traitement', variant: 'secondary', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  IN_TRANSIT: { label: 'En transit', variant: 'default', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  OUT_FOR_DELIVERY: { label: 'En livraison', variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
  DELIVERED: { label: 'Livré', variant: 'default', color: 'bg-green-100 text-green-800 border-green-200' },
  RETURNED: { label: 'Retourné', variant: 'secondary', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  CANCELLED: { label: 'Annulé', variant: 'secondary', color: 'text-red-700 bg-red-50 border-red-200' },
};

const methodConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  GROUND: { label: 'Terrestre', icon: <Truck className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  AIR: { label: 'Aérien', icon: <Plane className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  SEA: { label: 'Maritime', icon: <Ship className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800' },
  EXPRESS: { label: 'Express', icon: <Package className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
};

export default function ShippingManagementPage() {
  const [carriers] = useState<Carrier[]>(sampleCarriers);
  const [rates, setRates] = useState<ShippingRate[]>(sampleRates);
  const [incoterms] = useState<IncotermConfig[]>(sampleIncoterms);
  const [shipments] = useState<ShipmentTracking[]>(sampleShipments);
  
  const [activeTab, setActiveTab] = useState('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Dialog states
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  
  // Shipment detail dialog
  const [shipmentDetailOpen, setShipmentDetailOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentTracking | null>(null);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    let result = [...shipments];
    
    if (statusFilter !== 'ALL') {
      result = result.filter(s => s.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.trackingNumber.toLowerCase().includes(query) ||
        s.orderId.toLowerCase().includes(query) ||
        s.customerName.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return result;
  }, [shipments, searchQuery, statusFilter]);

  // Stats
  const inTransitCount = shipments.filter(s => s.status === 'IN_TRANSIT').length;
  const outForDelivery = shipments.filter(s => s.status === 'OUT_FOR_DELIVERY').length;
  const deliveredToday = shipments.filter(s => 
    s.status === 'DELIVERED' && 
    s.actualDelivery &&
    new Date(s.actualDelivery).toDateString() === new Date().toDateString()
  ).length;
  const avgOnTimeRate = carriers.length > 0 
    ? Math.round(carriers.reduce((sum, c) => sum + c.onTimeRate, 0) / carriers.length)
    : 0;

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openRateDialog = (rate?: ShippingRate) => {
    setEditingRate(rate || {
      id: '',
      origin: '',
      originName: '',
      destination: '',
      destinationName: '',
      carrierId: '',
      carrierName: '',
      method: 'GROUND',
      basePrice: 0,
      currency: 'DZD',
      pricePerKg: 0,
      estimatedDays: { min: 1, max: 3 },
      isActive: true,
    });
    setRateDialogOpen(true);
  };

  const handleSaveRate = async () => {
    if (!editingRate) return;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingRate.id) {
      setRates(prev => prev.map(r => r.id === editingRate.id ? editingRate : r));
    } else {
      setRates(prev => [...prev, { ...editingRate, id: `RATE${Date.now()}` }]);
    }
    setRateDialogOpen(false);
  };

  const openShipmentDetail = (shipment: ShipmentTracking) => {
    setSelectedShipment(shipment);
    setShipmentDetailOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['Tracking', 'Commande', 'Client', 'Transporteur', 'Origine', 'Destination', 'Statut', 'Poids', 'Coût', 'Est. livraison'];
    const csvRows = filteredShipments.map(s => [
      s.trackingNumber,
      s.orderId,
      s.customerName,
      s.carrierName,
      s.origin,
      s.destination,
      statusConfig[s.status].label,
      `${s.weight} kg`,
      formatCurrency(s.cost),
      s.estimatedDelivery
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expeditions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration Expédition</h1>
          <p className="text-gray-500 mt-1">Gérez les transporteurs, tarifs et suivez les expéditions</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="En transit"
          value={inTransitCount}
          description="Expéditions en cours"
          icon={Truck}
          iconClassName="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="En livraison"
          value={outForDelivery}
          description="Aujourd'hui"
          icon={Package}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Livrées aujourd'hui"
          value={deliveredToday}
          description="Avec succès"
          icon={CheckCircle2}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Taux ponctualité"
          value={`${avgOnTimeRate}%`}
          description="Moyenne transporteurs"
          icon={TrendingUp}
          iconClassName="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tracking" className="gap-1">
            <Navigation className="h-4 w-4" /> Suivi ({shipments.length})
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-1">
            <DollarSign className="h-4 w-4" /> Tarifs ({rates.length})
          </TabsTrigger>
          <TabsTrigger value="carriers" className="gap-1">
            <Truck className="h-4 w-4" /> Transporteurs ({carriers.length})
          </TabsTrigger>
          <TabsTrigger value="incoterms" className="gap-1">
            <Settings className="h-4 w-4" /> Incoterms ({incoterms.filter(i => i.isActive).length})
          </TabsTrigger>
        </TabsList>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par numéro de suivi ou commande..."
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
                    <SelectItem value="PROCESSING">Traitement</SelectItem>
                    <SelectItem value="IN_TRANSIT">En transit</SelectItem>
                    <SelectItem value="OUT_FOR_DELIVERY">En livraison</SelectItem>
                    <SelectItem value="DELIVERED">Livré</SelectItem>
                    <SelectItem value="RETURNED">Retourné</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Shipments Table */}
          <Card>
            <CardContent className="p-0">
              {filteredShipments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead>Numéro de suivi</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Itinéraire</TableHead>
                        <TableHead>Transporteur</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden md:table-cell">Est. livraison</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShipments.map((shipment) => {
                        const status = statusConfig[shipment.status];
                        const method = methodConfig[shipment.method];
                        
                        return (
                          <TableRow key={shipment.id}>
                            <TableCell>
                              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{shipment.trackingNumber}</code>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{shipment.customerName}</p>
                              <p className="text-xs text-gray-500">{shipment.orderId}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                <span>{shipment.origin}</span>
                                <span className="text-gray-400">→</span>
                                <span>{shipment.destination}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{shipment.carrierName}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={method.color} variant="secondary">
                                {method.icon}
                                <span className="ml-1 hidden sm:inline">{method.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className={status.color}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm text-gray-600">{formatDate(shipment.estimatedDelivery)}</span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => openShipmentDetail(shipment)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir détails</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucune expédition trouvée</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rates Tab */}
        <TabsContent value="rates" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Matrice tarifaire</CardTitle>
                <CardDescription>Gérez les tarifs d&apos;expédition par origine/destination</CardDescription>
              </div>
              <Button onClick={() => openRateDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter un tarif
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origine</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Transporteur</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Prix de base</TableHead>
                      <TableHead>Prix/kg</TableHead>
                      <TableHead>Délai estimé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate) => (
                      <TableRow key={rate.id} className={!rate.isActive ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">{rate.originName}</TableCell>
                        <TableCell>{rate.destinationName}</TableCell>
                        <TableCell>{rate.carrierName}</TableCell>
                        <TableCell>
                          <Badge className={methodConfig[rate.method]?.color} variant="secondary">
                            {methodConfig[rate.method]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-700">{formatCurrency(rate.basePrice)}</span>
                        </TableCell>
                        <TableCell>{formatCurrency(rate.pricePerKg)}/kg</TableCell>
                        <TableCell>
                          {rate.estimatedDays.min}-{rate.estimatedDays.max} jours
                        </TableCell>
                        <TableCell>
                          <Badge variant={rate.isActive ? 'default' : 'secondary'}>
                            {rate.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openRateDialog(rate)}
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

        {/* Carriers Tab */}
        <TabsContent value="carriers" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carriers.map((carrier) => (
              <Card key={carrier.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        carrier.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Truck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{carrier.name}</h3>
                        <Badge variant={carrier.status === 'ACTIVE' ? 'default' : 'secondary'} 
                               className={carrier.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}>
                          {carrier.status === 'ACTIVE' ? 'Actif' : carrier.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-20 text-gray-500">Contact:</span>
                      <span>{carrier.contactEmail}</span>
                    </div>
                    
                    <div className="border-t pt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="font-semibold">{carrier.totalDeliveries.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Livraisons</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 justify-center">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{carrier.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">Note</p>
                      </div>
                      <div>
                        <p className="font-semibold text-green-600">{carrier.onTimeRate}%</p>
                        <p className="text-xs text-gray-500">Ponctualité</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Modes:</p>
                      <div className="flex flex-wrap gap-1">
                        {carrier.shippingMethods.map(method => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {methodConfig[method]?.label || method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-1 h-3 w-3" /> Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Voir détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Incoterms Tab */}
        <TabsContent value="incoterms" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incoterms.map((incoterm) => (
              <Card key={incoterm.incoterm} className={!incoterm.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{incoterm.incoterm}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{incoterm.incoterm}</CardTitle>
                      <Badge variant={incoterm.isActive ? 'default' : 'secondary'}>
                        {incoterm.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{incoterm.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-2">Responsabilités vendeur</p>
                    <ul className="space-y-1">
                      {incoterm.sellerResponsibilities.map((resp, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-2">Responsibilités acheteur</p>
                    <ul className="space-y-1">
                      {incoterm.buyerResponsibilities.map((resp, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-blue-500" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-1 h-3 w-3" /> Configurer
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Rate Editor Dialog */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRate?.id ? 'Modifier le tarif' : 'Ajouter un tarif'}
            </DialogTitle>
            <DialogDescription>
              Configurez le prix pour cet itinéraire d&apos;expédition
            </DialogDescription>
          </DialogHeader>

          {editingRate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origine</Label>
                  <Input
                    value={editingRate.originName}
                    onChange={(e) => setEditingRate({ ...editingRate, originName: e.target.value })}
                    placeholder="Ex: Alger"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    value={editingRate.destinationName}
                    onChange={(e) => setEditingRate({ ...editingRate, destinationName: e.target.value })}
                    placeholder="Ex: Oran"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Transporteur</Label>
                <Select 
                  value={editingRate.carrierId} 
                  onValueChange={(val) => {
                    const carrier = carriers.find(c => c.id === val);
                    setEditingRate({ ...editingRate, carrierId: val, carrierName: carrier?.name || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un transporteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map(carrier => (
                      <SelectItem key={carrier.id} value={carrier.id}>{carrier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Méthode d&apos;expédition</Label>
                <Select 
                  value={editingRate.method} 
                  onValueChange={(val) => setEditingRate({ ...editingRate, method: val as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GROUND">Terrestre</SelectItem>
                    <SelectItem value="AIR">Aérien</SelectItem>
                    <SelectItem value="SEA">Maritime</SelectItem>
                    <SelectItem value="EXPRESS">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix de base (DZD)</Label>
                  <Input
                    type="number"
                    value={editingRate.basePrice}
                    onChange={(e) => setEditingRate({ ...editingRate, basePrice: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prix par kg (DZD)</Label>
                  <Input
                    type="number"
                    value={editingRate.pricePerKg}
                    onChange={(e) => setEditingRate({ ...editingRate, pricePerKg: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Délai min (jours)</Label>
                  <Input
                    type="number"
                    value={editingRate.estimatedDays.min}
                    onChange={(e) => setEditingRate({ 
                      editingRate, 
                      estimatedDays: { ...editingRate.estimatedDays, min: Number(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Délai max (jours)</Label>
                  <Input
                    type="number"
                    value={editingRate.estimatedDays.max}
                    onChange={(e) => setEditingRate({ 
                      editingRate, 
                      estimatedDays: { ...editingRate.estimatedDays, max: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRate}>
              {editingRate?.id ? 'Sauvegarder' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipment Detail Dialog */}
      <Dialog open={shipmentDetailOpen} onOpenChange={setShipmentDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Détail de l&apos;expédition {selectedShipment?.trackingNumber}
            </DialogTitle>
            <DialogDescription>
              Suivi complet et historique de l&apos;expédition
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6 py-4">
              {/* Status and Key Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Statut</p>
                    <Badge variant={statusConfig[selectedShipment.status].variant} 
                           className={`${statusConfig[selectedShipment.status].color} mt-1`}>
                      {statusConfig[selectedShipment.status].label}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Poids</p>
                    <p className="text-lg font-bold mt-1">{selectedShipment.weight} kg</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Coût</p>
                    <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(selectedShipment.cost)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-gray-500">Est. livraison</p>
                    <p className="font-medium mt-1">{formatDate(selectedShipment.estimatedDelivery)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Route Info */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Itinéraire
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-semibold">{selectedShipment.origin}</p>
                      <p className="text-xs text-gray-500">Origine</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-0.5 flex-1 bg-gray-200" />
                      <Badge className={methodConfig[selectedShipment.method]?.color} variant="secondary">
                        {methodConfig[selectedShipment.method]?.icon}
                        <span className="ml-1">{methodConfig[selectedShipment.method]?.label}</span>
                      </Badge>
                      <div className="h-0.5 flex-1 bg-gray-200" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{selectedShipment.destination}</p>
                      <p className="text-xs text-gray-500">Destination</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Transporteur: <strong>{selectedShipment.carrierName}</strong>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Historique du suivi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedShipment.events.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            event.type === 'DELIVERED' ? 'bg-green-500' :
                            event.type === 'EXCEPTION' ? 'bg-red-500' :
                            event.type === 'DELIVERY_ATTEMPT' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                          {index < selectedShipment.events.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{event.description}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                            <span>•</span>
                            <span>{formatDateTime(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Eye icon for button
function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
