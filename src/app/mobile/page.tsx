'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  PlusCircle,
  Search,
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  Package,
  AlertCircle,
  ChevronRight,
  Bell,
  ScanLine,
  Zap,
  ArrowRightLeft,
  Star,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { MobileOfflineIndicator } from '@/components/mobile/MobileOfflineIndicator';
import { QuickScanButton } from '@/components/mobile/MobileCameraScanner';

// ============ Types ============
interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

interface ActivityItem {
  id: string;
  type: 'order' | 'message' | 'negotiation' | 'payment';
  title: string;
  description: string;
  time: string;
  isUnread?: boolean;
}

interface NegotiationCard {
  id: string;
  productName: string;
  supplierName: string;
  currentOffer: string;
  yourPrice: string;
  status: 'pending' | 'countered' | 'accepted';
  timeLeft?: string;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  supplier: string;
  status: 'processing' | 'shipped' | 'delivered';
  total: string;
  date: string;
}

// ============ Data ============
const quickActions: QuickAction[] = [
  {
    id: 'rfq',
    label: 'New RFQ',
    icon: PlusCircle,
    href: '/rfqs/new',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    id: 'scan',
    label: 'Scan',
    icon: ScanLine,
    href: '#scan',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    href: '/search',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    href: '/mobile/chat',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

const todayActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'order',
    title: 'Order #AT-2024-1234',
    description: 'Shipped to Algiers',
    time: '2 hours ago',
    isUnread: true,
  },
  {
    id: '2',
    type: 'message',
    title: 'New message from SARL Technologie',
    description: 'Re: Price negotiation for steel pipes',
    time: '3 hours ago',
    isUnread: true,
  },
  {
    id: '3',
    type: 'negotiation',
    title: 'Counter offer received',
    description: 'Ciment d\'Algerie - 15% discount offered',
    time: '5 hours ago',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment confirmed',
    description: 'DZD 125,000 for Order #AT-2024-1198',
    time: 'Yesterday',
  },
];

const pendingNegotiations: NegotiationCard[] = [
  {
    id: '1',
    productName: 'Steel Pipes API 5L Grade B',
    supplierName: 'ArcelorMittal Algeria',
    currentOffer: 'DZD 89,500/ton',
    yourPrice: 'DZD 85,000/ton',
    status: 'countered',
    timeLeft: '2 days',
  },
  {
    id: '2',
    productName: 'Portland Cement CEM I 52.5R',
    supplierName: "Ciment d'Algerie",
    currentOffer: 'DZD 14,200/ton',
    yourPrice: 'DZD 13,800/ton',
    status: 'pending',
    timeLeft: '5 days',
  },
];

const recentOrders: OrderSummary[] = [
  {
    id: '1',
    orderNumber: 'AT-2024-1245',
    supplier: 'Sider El Hadjar',
    status: 'processing',
    total: 'DZD 245,000',
    date: 'Today',
  },
  {
    id: '2',
    orderNumber: 'AT-2024-1238',
    supplier: 'Pharmal Algeria',
    status: 'shipped',
    total: 'DZD 78,500',
    date: 'Yesterday',
  },
  {
    id: '3',
    orderNumber: 'AT-2024-1229',
    supplier: 'Tolga Trading',
    status: 'delivered',
    total: 'DZD 156,000',
    date: 'Jan 15',
  },
];

// ============ Main Page Component ============
export default function MobileDashboardPage() {
  const [greeting, setGreeting] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Count unread activities
    const unread = todayActivities.filter(a => a.isUnread).length;
    setUnreadCount(unread);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-amber-100 text-amber-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'countered': return 'bg-orange-100 text-orange-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'order': return Package;
      case 'message': return MessageSquare;
      case 'negotiation': return ArrowRightLeft;
      case 'payment': return Zap;
      default: return Bell;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Offline Indicator */}
      <MobileOfflineIndicator position="top" showDetails={false} />

      {/* Header */}
      <header className="bg-gradient-to-br from-emerald-600 to-teal-700 px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-emerald-100 text-sm">{greeting}</p>
            <h1 className="text-xl font-bold text-white">AlgeriaTrade</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/[role]/notifications"
              className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-emerald-600">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <Link
          href="/search"
          className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-h-[48px]"
        >
          <Search className="w-5 h-5 text-white/70" />
          <span className="text-white/70 text-sm">Search products, suppliers...</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-4 space-y-4">
        {/* Quick Actions Grid */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                
                if (action.id === 'scan') {
                  return (
                    <button
                      key={action.id}
                      onClick={() => setIsScannerOpen(true)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[80px]"
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.bgColor)}>
                        <IconComponent className={cn("w-6 h-6", action.color)} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[80px]"
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.bgColor)}>
                      <IconComponent className={cn("w-6 h-6", action.color)} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity Summary */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Today&apos;s Activity</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {todayActivities.length} updates
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {todayActivities.slice(0, 3).map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <Link
                    key={activity.id}
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[64px]"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      activity.type === 'order' && "bg-blue-100",
                      activity.type === 'message' && "bg-purple-100",
                      activity.type === 'negotiation' && "bg-orange-100",
                      activity.type === 'payment' && "bg-green-100"
                    )}>
                      <IconComponent className={cn(
                        "w-5 h-5",
                        activity.type === 'order' && "text-blue-600",
                        activity.type === 'message' && "text-purple-600",
                        activity.type === 'negotiation' && "text-orange-600",
                        activity.type === 'payment' && "text-green-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          activity.isUnread ? "text-gray-900" : "text-gray-700"
                        )}>
                          {activity.title}
                        </p>
                        {activity.isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{activity.time}</span>
                  </Link>
                );
              })}
            </div>
            
            {todayActivities.length > 3 && (
              <button className="w-full mt-2 py-2 text-sm text-emerald-600 font-medium">
                View all activity →
              </button>
            )}
          </CardContent>
        </Card>

        {/* Pending Negotiations */}
        {pendingNegotiations.length > 0 && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-3 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Pending Negotiations</CardTitle>
                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                  {pendingNegotiations.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {pendingNegotiations.map((negotiation) => (
                <Link
                  key={negotiation.id}
                  href={`/negotiations/${negotiation.id}`}
                  className="block p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                      {negotiation.productName}
                    </h3>
                    <Badge className={cn("text-xs", getStatusColor(negotiation.status))}>
                      {negotiation.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{negotiation.supplierName}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Their offer</p>
                        <p className="text-sm font-semibold text-gray-900">{negotiation.currentOffer}</p>
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Your price</p>
                        <p className="text-sm font-semibold text-emerald-600">{negotiation.yourPrice}</p>
                      </div>
                    </div>
                    {negotiation.timeLeft && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{negotiation.timeLeft}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <Link
                href="/mobile/orders"
                className="text-sm text-emerald-600 font-medium flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors min-h-[72px]"
                >
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                    order.status === 'processing' && "bg-blue-100",
                    order.status === 'shipped' && "bg-amber-100",
                    order.status === 'delivered' && "bg-emerald-100"
                  )}>
                    <Package className={cn(
                      "w-5 h-5",
                      order.status === 'processing' && "text-blue-600",
                      order.status === 'shipped' && "text-amber-600",
                      order.status === 'delivered' && "text-emerald-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                      <Badge variant="outline" className={cn("text-[10px]", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{order.supplier} • {order.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 shrink-0">{order.total}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Profile Views</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">247</p>
              <p className="text-xs text-emerald-600 mt-1">+12% this week</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">4.8</p>
              <p className="text-xs text-gray-500 mt-1">From 56 reviews</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav
        badges={{
          messages: 3,
          notifications: unreadCount,
          orders: recentOrders.filter(o => o.status !== 'delivered').length,
        }}
      />

      {/* Scanner Modal - Simplified for now */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <ScanLine className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">QR Scanner</h2>
            <p className="text-gray-600 mb-6">
              Scan QR codes to quickly access product information or verify authenticity.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsScannerOpen(false)}
                className="flex-1 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // In production, this would open the full scanner
                  alert('Scanner would open here');
                  setIsScannerOpen(false);
                }}
                className="flex-1 min-h-[44px]"
              >
                Open Scanner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
