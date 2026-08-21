'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Smartphone,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  MessageSquare,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  BarChart3,
  Globe,
  Apple,
  Monitor,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============ Types ============
interface NotificationStats {
  totalSent: number;
  delivered: number;
  opened: number;
  failed: number;
  byType: {
    order: number;
    negotiation: number;
    payment: number;
    call: number;
    system: number;
    message: number;
  };
}

interface DeviceRegistration {
  id: string;
  userId: string;
  platform: 'web' | 'ios' | 'android';
  registeredAt: string;
  lastActiveAt: string;
  status: 'active' | 'inactive' | 'unregistered';
}

interface SyncMetrics {
  totalSynced: number;
  pendingItems: number;
  failedItems: number;
  avgSyncTime: string;
  syncRate: number; // percentage
  byType: {
    orders: number;
    rfqs: number;
    messages: number;
    profiles: number;
  };
}

interface MobileUsageStats {
  totalUsers: number;
  activeUsers: number;
  pwaInstalls: number;
  mobileSessions: number;
  avgSessionDuration: string;
  bounceRate: number;
  topPages: Array<{ path: string; visits: number; avgTime: string }>;
  byPlatform: {
    web: number;
    ios: number;
    android: number;
  };
  byRegion: Array<{ region: string; users: number; percentage: number }>;
}

// ============ Mock Data ============
const mockNotificationStats: NotificationStats = {
  totalSent: 15420,
  delivered: 14890,
  opened: 12340,
  failed: 530,
  byType: {
    order: 5230,
    negotiation: 3890,
    payment: 2150,
    call: 890,
    system: 1840,
    message: 1420,
  },
};

const mockDeviceRegistrations: DeviceRegistration[] = [
  { id: 'dev-001', userId: 'user-001', platform: 'web', registeredAt: '2024-01-15T10:30:00Z', lastActiveAt: '2024-01-18T14:22:00Z', status: 'active' },
  { id: 'dev-002', userId: 'user-002', platform: 'android', registeredAt: '2024-01-14T08:15:00Z', lastActiveAt: '2024-01-18T12:45:00Z', status: 'active' },
  { id: 'dev-003', userId: 'user-003', platform: 'ios', registeredAt: '2024-01-13T16:42:00Z', lastActiveAt: '2024-01-17T09:30:00Z', status: 'inactive' },
  { id: 'dev-004', userId: 'user-004', platform: 'web', registeredAt: '2024-01-12T11:20:00Z', lastActiveAt: '2024-01-10T18:00:00Z', status: 'unregistered' },
  { id: 'dev-005', userId: 'user-005', platform: 'android', registeredAt: '2024-01-11T09:55:00Z', lastActiveAt: '2024-01-18T15:10:00Z', status: 'active' },
];

const mockSyncMetrics: SyncMetrics = {
  totalSynced: 42850,
  pendingItems: 127,
  failedItems: 23,
  avgSyncTime: '1.2s',
  syncRate: 98.7,
  byType: {
    orders: 15230,
    rfqs: 8940,
    messages: 12450,
    profiles: 6230,
  },
};

const mockUsageStats: MobileUsageStats = {
  totalUsers: 12847,
  activeUsers: 8432,
  pwaInstalls: 5621,
  mobileSessions: 45678,
  avgSessionDuration: '4m 32s',
  bounceRate: 28.5,
  topPages: [
    { path: '/mobile', visits: 12450, avgTime: '2m 15s' },
    { path: '/mobile/orders', visits: 8920, avgTime: '3m 45s' },
    { path: '/mobile/chat', visits: 7650, avgTime: '8m 20s' },
    { path: '/search', visits: 6340, avgTime: '1m 50s' },
    { path: '/products', visits: 5120, avgTime: '4m 10s' },
  ],
  byPlatform: {
    web: 6842,
    ios: 3256,
    android: 2749,
  },
  byRegion: [
    { region: 'Alger', users: 3245, percentage: 25.3 },
    { region: 'Oran', users: 2134, percentage: 16.6 },
    { region: 'Constantine', users: 1567, percentage: 12.2 },
    { region: 'Setif', users: 1234, percentage: 9.6 },
    { region: 'Annaba', users: 987, percentage: 7.7 },
    { region: 'Other', users: 3680, percentage: 28.6 },
  ],
};

// ============ Main Component ============
export default function AdminMobilePage() {
  const [selectedTab, setSelectedTab] = useState('notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('7d');

  // Calculate derived stats
  const deliveryRate = ((mockNotificationStats.delivered / mockNotificationStats.totalSent) * 100).toFixed(1);
  const openRate = ((mockNotificationStats.opened / mockNotificationStats.delivered) * 100).toFixed(1);

  // Filter devices
  const filteredDevices = mockDeviceRegistrations.filter(device => {
    const matchesSearch = device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || device.platform === platformFilter;
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  // Platform icons
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios': return <Apple className="w-4 h-4" />;
      case 'android': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // Status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'unregistered':
        return <Badge variant="outline" className="text-gray-500">Unregistered</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mobile PWA+ Dashboard</h1>
              <p className="text-sm text-gray-500">Monitor push notifications, offline sync & mobile usage</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 mt-4">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px]",
                  timeRange === range
                    ? "bg-violet-100 text-violet-700"
                    : "hover:bg-gray-100 text-gray-600"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 max-w-7xl mx-auto">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="notifications" className="gap-2 min-h-[44px]">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2 min-h-[44px]">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2 min-h-[44px]">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Offline Sync</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 min-h-[44px]">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Sent</p>
                      <p className="text-2xl font-bold text-gray-900">{mockNotificationStats.totalSent.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Send className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Delivery Rate</p>
                      <p className="text-2xl font-bold text-emerald-600">{deliveryRate}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Open Rate</p>
                      <p className="text-2xl font-bold text-violet-600">{openRate}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{mockNotificationStats.failed.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notifications by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockNotificationStats.byType).map(([type, count]) => {
                    const percentage = ((count / mockNotificationStats.totalSent) * 100).toFixed(1);
                    const typeColors: Record<string, string> = {
                      order: 'bg-blue-500',
                      negotiation: 'bg-purple-500',
                      payment: 'bg-green-500',
                      call: 'bg-orange-500',
                      system: 'bg-gray-500',
                      message: 'bg-cyan-500',
                    };

                    return (
                      <div key={type} className="flex items-center gap-4">
                        <div className="w-24 capitalize text-sm font-medium text-gray-700">{type}</div>
                        <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", typeColors[type])}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-sm font-semibold text-gray-900">{count.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            {/* Device Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {mockDeviceRegistrations.filter(d => d.status === 'active').length}
                    </p>
                    <p className="text-sm text-gray-500">Active Devices</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{mockDeviceRegistrations.length}</p>
                    <p className="text-sm text-gray-500">Total Registered</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {mockDeviceRegistrations.filter(d => d.status === 'unregistered').length}
                    </p>
                    <p className="text-sm text-gray-500">Unregistered</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by device ID or user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[44px]"
                  >
                    <option value="all">All Platforms</option>
                    <option value="web">Web</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[44px]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="unregistered">Unregistered</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Device List Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Registered Devices ({filteredDevices.length})</CardTitle>
                  <Button variant="outline" size="sm" className="min-h-[36px]">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Device ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Platform</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Active</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.map((device) => (
                        <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{device.id}</code>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-xs font-mono text-gray-700">{device.userId}</code>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              {getPlatformIcon(device.platform)}
                              <span className="capitalize">{device.platform}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(device.status)}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(device.lastActiveAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(device.registeredAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offline Sync Tab */}
          <TabsContent value="sync" className="space-y-6">
            {/* Sync Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-gray-500">Total Synced</p>
                      <p className="text-xl font-bold text-gray-900">{mockSyncMetrics.totalSynced.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">Pending Items</p>
                      <p className="text-xl font-bold text-orange-600">{mockSyncMetrics.pendingItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-500">Failed Items</p>
                      <p className="text-xl font-bold text-red-600">{mockSyncMetrics.failedItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-xl font-bold text-blue-600">{mockSyncMetrics.syncRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sync by Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sync Operations by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(mockSyncMetrics.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            type === 'orders' && "bg-blue-100",
                            type === 'rfqs' && "bg-purple-100",
                            type === 'messages' && "bg-green-100",
                            type === 'profiles' && "bg-orange-100"
                          )}>
                            {{
                              orders: <Package className="w-5 h-5 text-blue-600" />,
                              rfqs: <MessageSquare className="w-5 h-5 text-purple-600" />,
                              messages: <MessageSquare className="w-5 h-5 text-green-600" />,
                              profiles: <Users className="w-5 h-5 text-orange-600" />,
                            }[type]}
                          </div>
                          <span className="capitalize font-medium text-gray-700">{type}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sync Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Average Sync Time</span>
                        <span className="font-semibold">{mockSyncMetrics.avgSyncTime}</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-semibold">{mockSyncMetrics.syncRate}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                          style={{ width: `${mockSyncMetrics.syncRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>
                          Offline data is automatically synced when connectivity is restored. 
                          Failed items are retried up to 3 times before requiring manual intervention.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{mockUsageStats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 mt-1">+12% from last period</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Active Users (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{mockUsageStats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 mt-1">+8% from last period</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">PWA Installs</p>
                  <p className="text-2xl font-bold text-gray-900">{mockUsageStats.pwaInstalls.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 mt-1">+23% from last period</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 mb-1">Avg Session Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{mockUsageStats.avgSessionDuration}</p>
                  <p className="text-xs text-red-500 mt-1">-5% from last period</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pages */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Mobile Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockUsageStats.topPages.map((page, index) => (
                      <div key={page.path} className="flex items-center gap-4">
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-200 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-600" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{page.path}</p>
                          <p className="text-xs text-gray-500">Avg: {page.avgTime}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 shrink-0">
                          {page.visits.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Platform Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(mockUsageStats.byPlatform).map(([platform, count]) => {
                      const percentage = ((count / mockUsageStats.activeUsers) * 100).toFixed(1);
                      
                      return (
                        <div key={platform}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getPlatformIcon(platform)}
                              <span className="capitalize font-medium text-gray-700">{platform}</span>
                            </div>
                            <span className="text-sm text-gray-600">{count.toLocaleString()} ({percentage}%)</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                platform === 'web' && "bg-blue-500",
                                platform === 'ios' && "bg-gray-800",
                                platform === 'android' && "bg-green-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Regional Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Users by Region (Algeria)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockUsageStats.byRegion.map((region) => (
                      <div key={region.region} className="flex items-center gap-3">
                        <div className="w-24 text-sm font-medium text-gray-700 truncate">{region.region}</div>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                            style={{ width: `${region.percentage}%` }}
                          />
                        </div>
                        <div className="w-24 text-right text-sm">
                          <span className="font-semibold text-gray-900">{region.users.toLocaleString()}</span>
                          <span className="text-gray-500 ml-1">({region.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Bounce Rate</span>
                      <span className={cn(
                        "font-semibold",
                        mockUsageStats.bounceRate > 30 ? "text-red-600" : "text-emerald-600"
                      )}>
                        {mockUsageStats.bounceRate}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Mobile Sessions (30d)</span>
                      <span className="font-semibold text-gray-900">
                        {mockUsageStats.mobileSessions.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Install Rate</span>
                      <span className="font-semibold text-gray-900">
                        {((mockUsageStats.pwaInstalls / mockUsageStats.totalUsers) * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <Button variant="outline" className="w-full min-h-[44px]">
                        <Download className="w-4 h-4 mr-2" />
                        Export Full Analytics Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
