'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { OrderTimeline, OrderStatusBadge } from '@/components/buyer/OrderTimeline';
import {
  ShoppingCart,
  Search,
  Eye,
  RotateCcw,
  XCircle,
  Package,
  MapPin,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Mock orders data - in production this would come from API
const mockOrders = [
  {
    id: 'ORD-2024-089',
    orderNumber: 'ORD-2024-089',
    supplier: 'AcierPro SARL',
    supplierId: 'comp-001',
    items: [
      { id: '1', name: 'Acier HA Fe E400 Ø12', quantity: 25, unitPrice: 185000, totalPrice: 4625000 },
      { id: '2', name: 'Acier HA Fe E400 Ø10', quantity: 25, unitPrice: 175000, totalPrice: 4375000 }
    ],
    subtotal: 9000000,
    taxAmount: 450000,
    shippingCost: 150000,
    totalAmount: 9600000,
    currency: 'DZD',
    status: 'CONFIRMED' as const,
    notes: 'Livraison chantier Dar el Beida',
    deliveryName: 'Ahmed Benali',
    deliveryPhone: '+213 555 123 456',
    deliveryAddress: 'Chantier Bâtiment Plus, Rue des Frères, Dar el Beida',
    deliveryWilaya: 'Alger (16)',
    createdAt: '2024-01-14T10:30:00',
    updatedAt: '2024-01-14T16:45:00',
    trackingNumber: null,
  },
  {
    id: 'ORD-2024-088',
    orderNumber: 'ORD-2024-088',
    supplier: 'Cimenterie d\'Algérie',
    supplierId: 'comp-002',
    items: [
      { id: '3', name: 'Ciment Portland CEM I 42.5 (50kg)', quantity: 500, unitPrice: 12500, totalPrice: 6250000 }
    ],
    subtotal: 6250000,
    taxAmount: 312500,
    shippingCost: 200000,
    totalAmount: 6762500,
    currency: 'DZD',
    status: 'PROCESSING' as const,
    notes: '',
    deliveryName: 'Société BTP Constantine',
    deliveryPhone: '+213 555 987 654',
    deliveryAddress: 'Zone Industrielle Ain Smara, Constantine',
    deliveryWilaya: 'Constantine (25)',
    createdAt: '2024-01-12T09:15:00',
    updatedAt: '2024-01-13T11:20:00',
    trackingNumber: null,
  },
  {
    id: 'ORD-2024-087',
    orderNumber: 'ORD-2024-087',
    supplier: 'BâtimentPlus',
    supplierId: 'comp-003',
    items: [
      { id: '4', name: 'Brique Creuse 12 Trous 30x20x10', quantity: 10000, unitPrice: 14, totalPrice: 140000 },
      { id: '5', name: 'Brique Plâtrière 15x20x30', quantity: 5000, unitPrice: 18, totalPrice: 90000 },
      { id: '6', name: 'Mortier Prêt à l\'Emploi MPE 25kg', quantity: 200, unitPrice: 550, totalPrice: 110000 }
    ],
    subtotal: 340000,
    taxAmount: 17000,
    shippingCost: 25000,
    totalAmount: 382000,
    currency: 'DZD',
    status: 'SHIPPED' as const,
    notes: '',
    deliveryName: 'Karim Mansouri',
    deliveryPhone: '+213 661 234 567',
    deliveryAddress: 'Cité 1000 Logements, Blida',
    deliveryWilaya: 'Blida (09)',
    createdAt: '2024-01-10T14:30:00',
    updatedAt: '2024-01-12T08:00:00',
    trackingNumber: 'TRK-DZ-2024-78542',
  },
  {
    id: 'ORD-2024-086',
    orderNumber: 'ORD-2024-086',
    supplier: 'Villa Import SARL',
    supplierId: 'comp-004',
    items: [
      { id: '7', name: 'Peinture Facade Premium Blanc RAL 9010', quantity: 300, unitPrice: 2800, totalPrice: 840000 }
    ],
    subtotal: 840000,
    taxAmount: 42000,
    shippingCost: 18000,
    totalAmount: 900000,
    currency: 'DZD',
    status: 'DELIVERED' as const,
    notes: 'Appeler avant livraison',
    deliveryName: 'Entreprise Rénovation Alger',
    deliveryPhone: '+213 555 777 888',
    deliveryAddress: 'Rue Didouche Mourad, Alger Centre',
    deliveryWilaya: 'Alger (16)',
    createdAt: '2024-01-05T11:00:00',
    updatedAt: '2024-01-09T14:30:00',
    trackingNumber: 'TRK-DZ-2024-75231',
  },
  {
    id: 'ORD-2024-085',
    orderNumber: 'ORD-2024-085',
    supplier: 'Cimenterie d\'Algérie',
    supplierId: 'comp-002',
    items: [
      { id: '8', name: 'Ciment Portland CEM I 42.5 (50kg)', quantity: 200, unitPrice: 12500, totalPrice: 2500000 }
    ],
    subtotal: 2500000,
    taxAmount: 125000,
    shippingCost: 80000,
    totalAmount: 2705000,
    currency: 'DZD',
    status: 'COMPLETED' as const,
    notes: '',
    deliveryName: 'Ahmed Benali',
    deliveryPhone: '+213 555 123 456',
    deliveryAddress: 'Chantier Bâtiment Plus, Rue des Frères, Dar el Beida',
    deliveryWilaya: 'Alger (16)',
    createdAt: '2024-01-02T09:00:00',
    updatedAt: '2024-01-08T16:00:00',
    trackingNumber: 'TRK-DZ-2024-74152',
  },
];

type Order = typeof mockOrders[0];
type OrderStatus = Order['status'];

export default function BuyerOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle view detail
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // Handle reorder
  const handleReorder = (orderId: string) => {
    console.log('Reorder:', orderId);
  };

  // Handle cancel
  const handleCancel = (orderId: string) => {
    console.log('Cancel order:', orderId);
  };

  // Stats
  const activeOrders = mockOrders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length;
  const completedThisMonth = mockOrders.filter(o => o.status === 'COMPLETED').length;
  const totalSpent = mockOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
          <p className="text-gray-600 mt-1">Suivez et gérez vos commandes</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/products">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Nouvelle Commande
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Commandes Actives</p>
              <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Terminées ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{completedThisMonth}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Dépensé</p>
              <p className="text-2xl font-bold text-gray-900">{(totalSpent / 1000000).toFixed(1)}M DZD</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par N° commande ou fournisseur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                <SelectItem value="PROCESSING">En préparation</SelectItem>
                <SelectItem value="SHIPPED">Expédiée</SelectItem>
                <SelectItem value="DELIVERED">Livrée</SelectItem>
                <SelectItem value="COMPLETED">Terminée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              {/* Order Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600 flex-shrink-0 mt-0.5">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-green-700">{order.orderNumber}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                        <span>{order.supplier}</span>
                        <span>•</span>
                        <span>{order.items.length} article(s)</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-lg text-gray-900">
                        {(order.totalAmount / 1000).toLocaleString('fr-DZ')} K DZD
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(order);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(order.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedOrder === order.id && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Items List */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Articles Commandés</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.quantity.toLocaleString('fr-DZ')} × {item.unitPrice.toLocaleString('fr-DZ')} DZD
                              </p>
                            </div>
                            <span className="font-medium text-sm">
                              {item.totalPrice.toLocaleString('fr-DZ')} DZD
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sous-total</span>
                          <span>{order.subtotal.toLocaleString('fr-DZ')} DZD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">TVA (5%)</span>
                          <span>{order.taxAmount.toLocaleString('fr-DZ')} DZD</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Livraison</span>
                          <span>{order.shippingCost.toLocaleString('fr-DZ')} DZD</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span className="text-green-600">{order.totalAmount.toLocaleString('fr-DZ')} DZD</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Delivery Info */}
                    <div>
                      <OrderTimeline
                        currentStatus={order.status}
                        orderDate={order.createdAt}
                        trackingNumber={order.trackingNumber || undefined}
                        shippedDate={order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'COMPLETED' ? order.updatedAt : undefined}
                        deliveredDate={order.status === 'DELIVERED' || order.status === 'COMPLETED' ? order.updatedAt : undefined}
                        completedDate={order.status === 'COMPLETED' ? order.updatedAt : undefined}
                      />

                      <div className="mt-4 p-3 bg-white rounded-lg border space-y-2">
                        <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Adresse de Livraison
                        </h4>
                        <p className="text-sm text-gray-600">{order.deliveryName}</p>
                        <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                        <p className="text-sm text-gray-600">{order.deliveryWilaya}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.deliveryPhone}
                        </p>
                      </div>

                      {order.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> {order.notes}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReorder(order.id)}
                          className="flex-1"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Commander à nouveau
                        </Button>
                        
                        {order.status === 'DELIVERED' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 flex-1"
                          >
                            Confirmer Réception
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande trouvée</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Vous n\'avez pas encore passé de commande'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/products">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Commencer vos Achats
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail de la Commande</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Status & Supplier */}
              <div className="flex items-start justify-between">
                <div>
                  <OrderStatusBadge status={selectedOrder.status} />
                  <p className="text-sm text-gray-500 mt-2">
                    Fournisseur: <strong>{selectedOrder.supplier}</strong>
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Le {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">Articles</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">Prix Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity.toLocaleString('fr-DZ')}</TableCell>
                        <TableCell className="text-right">{item.unitPrice.toLocaleString('fr-DZ')} DZD</TableCell>
                        <TableCell className="text-right font-medium">{item.totalPrice.toLocaleString('fr-DZ')} DZD</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-4 space-y-1 text-sm text-right">
                  <p>Sous-total: <strong>{selectedOrder.subtotal.toLocaleString('fr-DZ')} DZD</strong></p>
                  <p>TVA: <strong>{selectedOrder.taxAmount.toLocaleString('fr-DZ')} DZD</strong></p>
                  <p>Livraison: <strong>{selectedOrder.shippingCost.toLocaleString('fr-DZ')} DZD</strong></p>
                  <Separator />
                  <p className="text-lg font-bold text-green-600">
                    Total: {selectedOrder.totalAmount.toLocaleString('fr-DZ')} DZD
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse de Livraison
                </h4>
                <p>{selectedOrder.deliveryName}</p>
                <p>{selectedOrder.deliveryAddress}</p>
                <p>{selectedOrder.deliveryWilaya}</p>
                <p className="flex items-center gap-1 mt-1">
                  <Phone className="h-4 w-4" /> {selectedOrder.deliveryPhone}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Fermer
                </Button>
                <Button variant="outline" onClick={() => handleReorder(selectedOrder.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Commander à nouveau
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
