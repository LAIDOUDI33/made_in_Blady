'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Calendar,
  User,
  Building2,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  XCircle
} from 'lucide-react';

// Types
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED';

interface OrderData {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  companyName: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  itemsCount: number;
  deliveryWilaya: string;
  createdAt: string;
  updatedAt: string;
  disputeNotes?: string;
}

// Sample data
const sampleOrders: OrderData[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001234',
    buyerName: 'Fatima Zahra',
    buyerEmail: 'fatima.zahra@example.com',
    companyName: 'SARL Technologie Algerienne',
    status: 'CONFIRMED',
    subtotal: 450000,
    taxAmount: 22500,
    shippingCost: 2500,
    totalAmount: 475000,
    currency: 'DZD',
    itemsCount: 3,
    deliveryWilaya: 'Alger',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-001233',
    buyerName: 'Ahmed Benali',
    buyerEmail: 'ahmed.benali@example.com',
    companyName: 'EURL Industrie Moderne',
    status: 'PROCESSING',
    subtotal: 125000,
    taxAmount: 6250,
    shippingCost: 1500,
    totalAmount: 132750,
    currency: 'DZD',
    itemsCount: 1,
    deliveryWilaya: 'Oran',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-001232',
    buyerName: 'Samira Khelifi',
    buyerEmail: 'samira.khelifi@example.com',
    companyName: 'Sarl Agro Solutions',
    status: 'SHIPPED',
    subtotal: 89000,
    taxAmount: 4450,
    shippingCost: 3000,
    totalAmount: 96450,
    currency: 'DZD',
    itemsCount: 5,
    deliveryWilaya: 'Constantine',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-001231',
    buyerName: 'Youssef Ammar',
    buyerEmail: 'youssef.ammar@example.com',
    companyName: 'SARL Technologie Algerienne',
    status: 'DELIVERED',
    subtotal: 2100000,
    taxAmount: 105000,
    shippingCost: 5000,
    totalAmount: 2210000,
    currency: 'DZD',
    itemsCount: 2,
    deliveryWilaya: 'Blida',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    orderNumber: 'ORD-2024-001230',
    buyerName: 'Leila Haddad',
    buyerEmail: 'leila.haddad@example.com',
    companyName: 'EURL Industrie Moderne',
    status: 'CANCELLED',
    subtotal: 67000,
    taxAmount: 3350,
    shippingCost: 2000,
    totalAmount: 72350,
    currency: 'DZD',
    itemsCount: 1,
    deliveryWilaya: 'Annaba',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    disputeNotes: 'Acheteur a annulé - produit non disponible',
  },
];

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; icon: React.ReactNode }> = {
  PENDING: { 
    label: 'En attente', 
    variant: 'outline', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3 w-3" />
  },
  CONFIRMED: { 
    label: 'Confirmée', 
    variant: 'default', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  PROCESSING: { 
    label: 'En traitement', 
    variant: 'secondary', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Package className="h-3 w-3" />
  },
  SHIPPED: { 
    label: 'Expédiée', 
    variant: 'outline', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: <Truck className="h-3 w-3" />
  },
  DELIVERED: { 
    label: 'Livrée', 
    variant: 'secondary', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  CANCELLED: { 
    label: 'Annulée', 
    variant: 'destructive', 
    color: '',
    icon: <XCircle className="h-3 w-3" />
  },
  COMPLETED: { 
    label: 'Terminée', 
    variant: 'default', 
    color: 'bg-green-600 text-white border-green-700',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
};

export default function OrdersOverviewPage() {
  const [orders] = useState<OrderData[]>(sampleOrders);
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>(sampleOrders);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Dialog states
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [disputeNotes, setDisputeNotes] = useState('');

  // Apply filters
  React.useEffect(() => {
    let result = [...orders];
    
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.orderNumber.toLowerCase().includes(query) ||
        o.buyerName.toLowerCase().includes(query) ||
        o.companyName.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredOrders(result);
  }, [orders, statusFilter, searchQuery]);

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const processingCount = orders.filter(o => ['CONFIRMED', 'PROCESSING'].includes(o.status)).length;

  const formatPrice = (amount: number) => {
    return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K DZD`;
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

  const openOrderDetail = (order: OrderData) => {
    setSelectedOrder(order);
    setDisputeNotes(order.disputeNotes || '');
    setOrderDetailOpen(true);
  };

  const handleSaveDisputeNotes = () => {
    console.log('Saving dispute notes for order:', selectedOrder?.orderNumber, disputeNotes);
    setOrderDetailOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-500 mt-1">Suivez et gérez toutes les commandes de la plateforme</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exporter pour comptabilité
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-gray-500">Total commandes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{processingCount}</p>
                <p className="text-xs text-gray-500">En traitement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <span className="font-bold">DA</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                <p className="text-xs text-gray-500">Chiffre d&apos;affaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par N° commande, acheteur, fournisseur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                <SelectItem value="PROCESSING">En traitement</SelectItem>
                <SelectItem value="SHIPPED">Expédiée</SelectItem>
                <SelectItem value="DELIVERED">Livrée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
                <SelectItem value="COMPLETED">Terminée</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Date début"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Acheteur</TableHead>
                  <TableHead className="hidden lg:table-cell">Fournisseur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="hidden md:table-cell">Articles</TableHead>
                  <TableHead className="hidden xl:table-cell">Livraison</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status];
                  
                  return (
                    <TableRow 
                      key={order.id}
                      className={
                        order.status === 'CANCELLED' 
                          ? 'opacity-60 bg-red-50/20'
                          : ''
                      }
                    >
                      <TableCell>
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {order.orderNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.buyerName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">{order.buyerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span>{order.companyName}</span>
                        </div>
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
                      <TableCell>
                        <span className="font-semibold text-sm">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Package className="h-3.5 w-3.5" />
                          {order.itemsCount}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5" />
                          {order.deliveryWilaya}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
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
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => openOrderDetail(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> Voir détails
                            </DropdownMenuItem>
                            {order.status === 'PENDING' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-600">
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmer
                                </DropdownMenuItem>
                              </>
                            )}
                            {(order.status === 'CONFIRMED' || order.status === 'PROCESSING') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" /> Annuler
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
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucune commande trouvée</h3>
              <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Détails de la commande {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  Informations complètes sur la commande
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status and dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Statut</p>
                    <Badge 
                      variant={statusConfig[selectedOrder.status].variant}
                      className={statusConfig[selectedOrder.status].color}
                    >
                      {statusConfig[selectedOrder.status].icon}
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Date de création</p>
                    <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Acheteur
                    </h4>
                    <p className="font-medium">{selectedOrder.buyerName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.buyerEmail}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Fournisseur
                    </h4>
                    <p className="font-medium">{selectedOrder.companyName}</p>
                  </div>
                </div>

                {/* Delivery info */}
                <div className="p-4 border rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Livraison
                  </h4>
                  <p className="text-sm"><strong>Wilaya:</strong> {selectedOrder.deliveryWilaya}</p>
                </div>

                {/* Financial summary */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-3">
                    Résumé financier
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sous-total ({selectedOrder.itemsCount} articles)</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (5%)</span>
                      <span>{formatPrice(selectedOrder.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span>{formatPrice(selectedOrder.shippingCost)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-green-700">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Dispute resolution notes */}
                <div className="p-4 border rounded-lg">
                  <Label htmlFor="dispute-notes" className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Notes de résolution de litige
                  </Label>
                  <Textarea
                    id="dispute-notes"
                    placeholder="Ajoutez des notes concernant cette commande..."
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOrderDetailOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={handleSaveDisputeNotes}>
                  Sauvegarder les notes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return (
    <div className={`shrink-0 bg-border ${className}`} role="separator" />
  );
}
