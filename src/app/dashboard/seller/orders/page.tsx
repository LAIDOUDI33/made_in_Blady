'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/dashboard/DataTable';
import { OrderStatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  ShoppingCart,
  Eye,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Calendar,
  MapPin
} from 'lucide-react';

// Mock order data - in production this would come from API
interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerLocation: string;
  items: OrderItem[];
  itemsCount: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  notes?: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-045',
    buyerName: 'Sarl Bâtiment Plus',
    buyerLocation: 'Alger',
    items: [
      { id: '1', productName: 'Ciment Portland CEM I 42.5', quantity: 500, unitPrice: 6000, totalPrice: 3000000 },
      { id: '2', productName: 'Brique Creuse Rouge 12 trous', quantity: 2000, unitPrice: 14, totalPrice: 28000 },
    ],
    itemsCount: 2,
    subtotal: 3028000,
    taxAmount: 575320,
    shippingCost: 45000,
    totalAmount: 3648320,
    currency: 'DZD',
    status: 'PENDING',
    createdAt: '2024-01-15T10:30:00Z',
    deliveryName: 'Mohamed Karim',
    deliveryPhone: '+213 555 123 456',
    deliveryAddress: '123 Rue de la Liberté, Bab El Oued, Alger',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-044',
    buyerName: 'Ets. Nouara Import',
    buyerLocation: 'Oran',
    items: [
      { id: '1', productName: 'Acier HA Fe E400 Ø12', quantity: 25, unitPrice: 285000, totalPrice: 7125000 },
    ],
    itemsCount: 1,
    subtotal: 7125000,
    taxAmount: 1353750,
    shippingCost: 85000,
    totalAmount: 8563750,
    currency: 'DZD',
    status: 'CONFIRMED',
    createdAt: '2024-01-14T09:15:00Z',
    deliveryName: 'Nouara Benali',
    deliveryPhone: '+213 555 987 654',
    deliveryAddress: '45 Avenue Sidi El Houari, Oran',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-043',
    buyerName: 'Groupe Industriel Algérie',
    buyerLocation: 'Constantine',
    items: [
      { id: '1', productName: 'Sable de Carrière Lavé 0/4', quantity: 100, unitPrice: 3800, totalPrice: 380000 },
      { id: '2', productName: 'Gravier Concassé 8/16', quantity: 80, unitPrice: 4500, totalPrice: 360000 },
      { id: '3', productName: 'Ciment Portland CEM I 42.5', quantity: 200, unitPrice: 5900, totalPrice: 1180000 },
      { id: '4', productName: 'Poutrelle Précontrainte HP4', quantity: 50, unitPrice: 8500, totalPrice: 425000 },
      { id: '5', productName: 'Treillis Soudé ST25', quantity: 30, unitPrice: 5200, totalPrice: 156000 },
    ],
    itemsCount: 5,
    subtotal: 2501000,
    taxAmount: 475190,
    shippingCost: 125000,
    totalAmount: 3101190,
    currency: 'DZD',
    status: 'PROCESSING',
    createdAt: '2024-01-13T14:20:00Z',
    deliveryName: 'Amine Hadj',
    deliveryPhone: '+213 661 234 567',
    deliveryAddress: 'Zone Industrielle, Ain Abdeli, Constantine',
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-042',
    buyerName: 'Matières Premières SARL',
    buyerLocation: 'Blida',
    items: [
      { id: '1', productName: 'Ciment Portland CEM I 42.5', quantity: 300, unitPrice: 5850, totalPrice: 1755000 },
      { id: '2', productName: 'Chaux Hydraulique NHL 3.5', quantity: 50, unitPrice: 4200, totalPrice: 210000 },
    ],
    itemsCount: 2,
    subtotal: 1965000,
    taxAmount: 373350,
    shippingCost: 65000,
    totalAmount: 2403350,
    currency: 'DZD',
    status: 'SHIPPED',
    createdAt: '2024-01-12T11:45:00Z',
    deliveryName: 'Karim Meziane',
    deliveryPhone: '+213 555 456 789',
    deliveryAddress: 'Route de Chiffa, Blida',
  },
  {
    id: '5',
    orderNumber: 'ORD-2024-041',
    buyerName: 'Construction Moderne',
    buyerLocation: 'Setif',
    items: [
      { id: '1', productName: 'Brique Creuse Rouge 12 trous', quantity: 10000, unitPrice: 13.5, totalPrice: 135000 },
      { id: '2', productName: 'Enduit de Lissage', quantity: 500, unitPrice: 850, totalPrice: 425000 },
      { id: '3', productName: 'Peinture Façade Acrylique', quantity: 200, unitPrice: 1200, totalPrice: 240000 },
      { id: '4', phenotype: 'Colle Carrelage C2TE', quantity: 300, unitPrice: 750, totalPrice: 225000 },
    ],
    itemsCount: 4,
    subtotal: 1025000,
    taxAmount: 194750,
    shippingCost: 95000,
    totalAmount: 1314750,
    currency: 'DZD',
    status: 'DELIVERED',
    createdAt: '2024-01-10T08:30:00Z',
    deliveryName: 'Yasmine Bouzid',
    deliveryPhone: '+213 555 789 012',
    deliveryAddress: 'Quartier Industriel, Setif',
  },
  {
    id: '6',
    orderNumber: 'ORD-2024-040',
    buyerName: 'Rénovation Express',
    buyerLocation: 'Annaba',
    items: [
      { id: '1', productName: 'Peinture Intérieure Mat', quantity: 150, unitPrice: 980, totalPrice: 147000 },
    ],
    itemsCount: 1,
    subtotal: 147000,
    taxAmount: 27930,
    shippingCost: 25000,
    totalAmount: 199930,
    currency: 'DZD',
    status: 'COMPLETED',
    createdAt: '2024-01-08T16:00:00Z',
    deliveryName: 'Rachid Amrani',
    deliveryPhone: '+213 771 345 678',
    deliveryAddress: 'Cité 1000 Logements, Annaba',
  },
  {
    id: '7',
    orderNumber: 'ORD-2024-039',
    buyerName: 'Ancien Client SARL',
    buyerLocation: 'Tlemcen',
    items: [
      { id: '1', productName: 'Carrelage Sol 60x60 Gris', quantity: 400, unitPrice: 1800, totalPrice: 720000 },
    ],
    itemsCount: 1,
    subtotal: 720000,
    taxAmount: 136800,
    shippingCost: 55000,
    totalAmount: 911800,
    currency: 'DZD',
    status: 'CANCELLED',
    createdAt: '2024-01-05T12:15:00Z',
    notes: 'Annulé par l\'acheteur - problème de financement',
    deliveryName: 'Omar Tlemsani',
    deliveryPhone: '+213 661 890 123',
    deliveryAddress: 'Centre Ville, Tlemcen',
  },
];

const columns = [
  {
    key: 'orderNumber' as const,
    label: 'N° Commande',
    sortable: true,
    render: (value: unknown) => (
      <span className="font-medium text-green-700">{String(value)}</span>
    ),
  },
  {
    key: 'buyerName' as const,
    label: 'Acheteur',
    sortable: true,
    render: (_: unknown, row: Order) => (
      <div>
        <p className="font-medium text-gray-900">{row.buyerName}</p>
        <p className="text-xs text-gray-500">{row.buyerLocation}</p>
      </div>
    ),
  },
  {
    key: 'itemsCount' as const,
    label: 'Articles',
    render: (value: unknown) => (
      <Badge variant="secondary">{value} article(s)</Badge>
    ),
  },
  {
    key: 'totalAmount' as const,
    label: 'Montant Total',
    sortable: true,
    render: (_: unknown, row: Order) => (
      <span className="font-semibold text-gray-900 whitespace-nowrap">
        {row.totalAmount.toLocaleString('fr-DZ')} {row.currency}
      </span>
    ),
  },
  {
    key: 'status' as const,
    label: 'Statut',
    render: (value: unknown) => <OrderStatusBadge status={String(value)} />,
  },
  {
    key: 'createdAt' as const,
    label: 'Date',
    sortable: true,
    render: (value: unknown) => (
      <span className="text-sm text-gray-500">
        {new Date(String(value)).toLocaleDateString('fr-FR')}
      </span>
    ),
  },
];

// Status transitions map
const statusTransitions: Record<string, { nextStatus: string; label: string; icon: React.ElementType; variant: 'default' | 'outline' | 'destructive' }[]> = {
  PENDING: [
    { nextStatus: 'CONFIRMED', label: 'Confirmer', icon: CheckCircle2, variant: 'default' },
    { nextStatus: 'CANCELLED', label: 'Annuler', icon: XCircle, variant: 'destructive' },
  ],
  CONFIRMED: [
    { nextStatus: 'PROCESSING', label: 'En cours', icon: Package, variant: 'default' },
    { nextStatus: 'CANCELLED', label: 'Annuler', icon: XCircle, variant: 'destructive' },
  ],
  PROCESSING: [
    { nextStatus: 'SHIPPED', label: 'Expédier', icon: Truck, variant: 'default' },
  ],
  SHIPPED: [
    { nextStatus: 'DELIVERED', label: 'Livré', icon: CheckCircle2, variant: 'default' },
  ],
  DELIVERED: [
    { nextStatus: 'COMPLETED', label: 'Terminer', icon: CheckCircle2, variant: 'default' },
  ],
};

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  // Filter orders by status
  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    processing: orders.filter((o) => o.status === 'PROCESSING' || o.status === 'CONFIRMED').length,
    shipped: orders.filter((o) => o.status === 'SHIPPED').length,
    completed: orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED').length,
    revenue: orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    // Close detail dialog if open
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-gray-600 mt-1">Gérez et suivez vos commandes clients</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Cours</p>
                <p className="text-2xl font-bold text-orange-600">{stats.processing}</p>
              </div>
              <Package className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expédiées</p>
                <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenu</p>
                <p className="text-lg font-bold text-green-600">
                  {(stats.revenue / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Toutes', count: stats.total },
          { value: 'PENDING', label: 'En attente', count: stats.pending },
          { value: 'CONFIRMED', label: 'Confirmées', count: orders.filter(o => o.status === 'CONFIRMED').length },
          { value: 'PROCESSING', label: 'En cours', count: orders.filter(o => o.status === 'PROCESSING').length },
          { value: 'SHIPPED', label: 'Expédiées', count: stats.shipped },
          { value: 'DELIVERED', label: 'Livrées', count: orders.filter(o => o.status === 'DELIVERED').length },
          { value: 'COMPLETED', label: 'Terminées', count: orders.filter(o => o.status === 'COMPLETED').length },
          { value: 'CANCELLED', label: 'Annulées', count: orders.filter(o => o.status === 'CANCELLED').length },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
            className={statusFilter === tab.value ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {tab.label}
            <Badge 
              variant={statusFilter === tab.value ? 'secondary' : 'outline'} 
              className="ml-2"
            >
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filteredOrders}
            columns={columns}
            searchable={true}
            searchPlaceholder="Rechercher une commande..."
            searchKeys={['orderNumber', 'buyerName']}
            actions={(row) => (
              <>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => openOrderDetail(row)}
                >
                  <Eye className="mr-2 h-4 w-4" /> Voir Détails
                </DropdownMenuItem>
                {statusTransitions[row.status]?.map((action) => (
                  <DropdownMenuItem
                    key={action.nextStatus}
                    className={`cursor-pointer ${
                      action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''
                    }`}
                    onClick={() => handleUpdateStatus(row.id, action.nextStatus)}
                  >
                    <action.icon className="mr-2 h-4 w-4" /> {action.label}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            emptyMessage="Aucune commande trouvée"
          />
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  Commande {selectedOrder.orderNumber}
                  <OrderStatusBadge status={selectedOrder.status} />
                </DialogTitle>
                <DialogDescription>
                  Passée le {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(selectedOrder.createdAt).toLocaleTimeString('fr-FR')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Buyer Info */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Informations Acheteur</h4>
                  <p className="font-medium">{selectedOrder.buyerName}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" /> {selectedOrder.buyerLocation}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Adresse de Livraison</h4>
                  <p>{selectedOrder.deliveryName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.deliveryPhone}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.deliveryAddress}</p>
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Articles Commandés</h4>
                  <table className="w-full border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-medium text-gray-600">Produit</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-gray-600">Qté</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">P.U.</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="py-2 px-3 text-sm">{item.productName}</td>
                          <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-sm text-right">
                            {item.unitPrice.toLocaleString('fr-DZ')}
                          </td>
                          <td className="py-2 px-3 text-sm text-right font-medium">
                            {item.totalPrice.toLocaleString('fr-DZ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total:</span>
                    <span>{selectedOrder.subtotal.toLocaleString('fr-DZ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA:</span>
                    <span>{selectedOrder.taxAmount.toLocaleString('fr-DZ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison:</span>
                    <span>{selectedOrder.shippingCost.toLocaleString('fr-DZ')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">
                      {selectedOrder.totalAmount.toLocaleString('fr-DZ')} DZD
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Notes:</p>
                    <p className="text-sm text-yellow-700 mt-1">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                {statusTransitions[selectedOrder.status]?.map((action) => (
                  <Button
                    key={action.nextStatus}
                    variant={action.variant === 'destructive' ? 'destructive' : 'default'}
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, action.nextStatus);
                      if (action.nextStatus !== selectedOrder.status) {
                        // Only close for certain actions or keep open to show updated status
                      }
                    }}
                    className={action.variant === 'default' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
