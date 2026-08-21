'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  MessageSquare,
  MapPin,
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MobileBottomNav, MobileFAB } from '@/components/mobile/MobileBottomNav';
import { MobileSwipeActions, SwipeableListItem } from '@/components/mobile/MobileSwipeActions';
import { MobileOfflineIndicator } from '@/components/mobile/MobileOfflineIndicator';

// ============ Types ============
type OrderStatus = 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'disputed';
type FilterTab = 'all' | 'active' | 'completed' | 'draft';

interface OrderItem {
  id: string;
  orderNumber: string;
  supplierName: string;
  supplierLogo?: string;
  status: OrderStatus;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: string;
  }>;
  total: string;
  currency: string;
  date: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  address: string;
  city: string;
}

// ============ Mock Data ============
const mockOrders: OrderItem[] = [
  {
    id: '1',
    orderNumber: 'AT-2024-1256',
    supplierName: 'Sider El Hadjar',
    status: 'processing',
    items: [
      { name: 'Steel Rebar B500B 12mm', quantity: 50, unitPrice: 'DZD 85,000/ton' },
      { name: 'Steel Rebar B500B 16mm', quantity: 30, unitPrice: 'DZD 82,000/ton' },
    ],
    total: 'DZD 6,610,000',
    currency: 'DZD',
    date: '2024-01-18',
    estimatedDelivery: '2024-01-25',
    address: 'Zone Industrielle Oued Smar',
    city: 'Alger',
  },
  {
    id: '2',
    orderNumber: 'AT-2024-1248',
    supplierName: "Ciment d'Algérie",
    status: 'shipped',
    items: [
      { name: 'Portland Cement CEM I 52.5R', quantity: 100, unitPrice: 'DZD 14,200/ton' },
    ],
    total: 'DZD 1,420,000',
    currency: 'DZD',
    date: '2024-01-15',
    estimatedDelivery: '2024-01-20',
    trackingNumber: 'ALG123456789',
    address: 'Route de Constantine Km 5',
    city: 'Setif',
  },
  {
    id: '3',
    orderNumber: 'AT-2024-1239',
    supplierName: 'Pharmal Algeria',
    status: 'delivered',
    items: [
      { name: 'Paracetamol 500mg (1000 tabs)', quantity: 20, unitPrice: 'DZD 850/pack' },
      { name: 'Amoxicillin 500mg (500 caps)', quantity: 10, unitPrice: 'DZD 2,400/pack' },
    ],
    total: 'DZD 41,000',
    currency: 'DZD',
    date: '2024-01-10',
    address: 'Cité 1000 Logements',
    city: 'Oran',
  },
  {
    id: '4',
    orderNumber: 'AT-2024-1230',
    supplierName: 'Tolga Trading',
    status: 'pending',
    items: [
      { name: 'Olive Oil Extra Virgin 5L', quantity: 50, unitPrice: 'DZD 3,200/unit' },
    ],
    total: 'DZD 160,000',
    currency: 'DZD',
    date: '2024-01-18',
    address: 'Zone Industrielle Ain M\'Lila',
    city: 'Oum El Bouaghi',
  },
  {
    id: '5',
    orderNumber: 'AT-2024-1221',
    supplierName: 'Condor Algeria',
    status: 'cancelled',
    items: [
      { name: 'Air Conditioner Split 12000 BTU', quantity: 5, unitPrice: 'DZD 65,000/unit' },
    ],
    total: 'DZD 325,000',
    currency: 'DZD',
    date: '2024-01-08',
    address: 'Centre Ville',
    city: 'Constantine',
  },
];

// ============ Status Configuration ============
const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Clock },
  processing: { label: 'Processing', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Package },
  confirmed: { label: 'Confirmed', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: CheckCircle2 },
  shipped: { label: 'Shipped', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  disputed: { label: 'Disputed', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: XCircle },
};

// ============ Main Component ============
export default function MobileOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders based on active tab and search
  const filteredOrders = mockOrders.filter((order) => {
    // Tab filter
    if (activeFilter === 'active') {
      return !['delivered', 'cancelled'].includes(order.status);
    }
    if (activeFilter === 'completed') {
      return order.status === 'delivered';
    }
    if (activeFilter === 'draft') {
      return order.status === 'pending';
    }
    
    // Search filter
    if (searchQuery) {
      return (
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return true;
  });

  // Get counts for each tab
  const tabCounts = {
    all: mockOrders.length,
    active: mockOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    completed: mockOrders.filter(o => o.status === 'delivered').length,
    draft: mockOrders.filter(o => o.status === 'pending').length,
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleBulkAction = (action: 'track' | 'contact' | 'cancel') => {
    console.log(`Bulk ${action} for orders:`, Array.from(selectedOrders));
    // Handle bulk action
  };

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'draft', label: 'Draft' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Offline Indicator */}
      <MobileOfflineIndicator position="top" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 pt-6 pb-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-colors min-w-[44px] min-h-[44px]",
                  showFilters ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-600"
                )}
                aria-label="Toggle filters"
              >
                <Filter className="w-5 h-5" />
              </button>
              {selectedOrders.size > 0 && (
                <Badge variant="default" className="h-7 px-3">
                  {selectedOrders.size} selected
                </Badge>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl
                text-sm placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white
                transition-all min-h-[48px]
              "
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[40px]",
                activeFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeFilter === tab.id ? "bg-white/20" : "bg-gray-200"
              )}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-3">
        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <div className="sticky top-[140px] z-20 bg-white rounded-xl p-3 shadow-md flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('track')} className="min-h-[36px]">
                Track
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('contact')} className="min-h-[36px]">
                Contact
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('cancel')} className="min-h-[36px]">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-sm text-gray-500">
              {activeFilter !== 'all' 
                ? `No ${activeFilter} orders` 
                : searchQuery 
                  ? `No results for "${searchQuery}"` 
                  : 'You haven\'t placed any orders yet'
              }
            </p>
            <Link href="/products">
              <Button className="mt-4 min-h-[44px]">Browse Products</Button>
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;

            return (
              <SwipeableListItem
                key={order.id}
                id={order.id}
                leftActions={[
                  {
                    id: 'select',
                    label: selectedOrders.has(order.id) ? 'Selected' : 'Select',
                    icon: selectedOrders.has(order.id) ? CheckCircle2 : Eye,
                    color: '#059669',
                    bgColor: '#059669',
                    action: () => toggleOrderSelection(order.id),
                  },
                ]}
                rightActions={[
                  {
                    id: 'track',
                    label: 'Track',
                    icon: MapPin,
                    color: '#2563eb',
                    bgColor: '#2563eb',
                    action: () => console.log('Track order:', order.id),
                  },
                  {
                    id: 'contact',
                    label: 'Contact',
                    icon: Phone,
                    color: '#059669',
                    bgColor: '#059669',
                    action: () => console.log('Contact supplier:', order.supplierName),
                  },
                ]}
                onActionComplete={(itemId, actionId) => console.log('Action complete:', itemId, actionId)}
              >
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <Link href={`/orders/${order.id}`} className="block">
                      {/* Status Bar */}
                      <div className={cn("px-4 py-2 flex items-center justify-between", config.bgColor)}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("w-4 h-4", config.color)} />
                          <span className={cn("text-xs font-semibold uppercase tracking-wide", config.color)}>
                            {config.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{order.date}</span>
                      </div>

                      {/* Main Content */}
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">{order.supplierName}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                        </div>

                        {/* Items Preview */}
                        <div className="mb-3">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 truncate mr-2">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-gray-500 shrink-0">{item.unitPrice}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-emerald-600 font-medium">
                              +{order.items.length - 2} more item(s)
                            </p>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>{order.city}</span>
                          </div>
                          <span className="font-bold text-gray-900">{order.total}</span>
                        </div>

                        {/* Quick Actions */}
                        {(order.trackingNumber || order.status === 'shipped') && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                            {order.trackingNumber && (
                              <Button size="sm" variant="outline" className="flex-1 text-xs min-h-[36px]">
                                <Truck className="w-3.5 h-3.5 mr-1" />
                                Track: {order.trackingNumber.slice(-8)}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="min-h-[36px] px-3">
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="min-h-[36px] px-3">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </SwipeableListItem>
            );
          })
        )}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav />

      {/* Floating Action Button - New Order */}
      <MobileFAB
        icon={Package}
        onClick={() => window.location.href = '/products'}
        label="New Order"
      />
    </div>
  );
}
