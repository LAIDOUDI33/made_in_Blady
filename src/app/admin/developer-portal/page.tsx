'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Key,
  BarChart3,
  Webhook,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for admin dashboard
interface Developer {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  joinedAt: Date;
  apiKeysCount: number;
  totalRequests: number;
  lastActiveAt: Date;
}

interface AuditLogEntry {
  id: string;
  action: string;
  developerId: string;
  developerName: string;
  details: string;
  ipAddress: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

const MOCK_DEVELOPERS: Developer[] = [
  {
    id: 'dev_1',
    name: 'Ahmed Benali',
    email: 'ahmed@techcompany.dz',
    company: 'TechCompany SARL',
    plan: 'enterprise',
    status: 'active',
    joinedAt: new Date('2024-01-15'),
    apiKeysCount: 5,
    totalRequests: 125000,
    lastActiveAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 'dev_2',
    name: 'Sarah Meziani',
    email: 'sarah@ecommerce.dz',
    company: 'E-commerce Algeria',
    plan: 'pro',
    status: 'active',
    joinedAt: new Date('2024-02-20'),
    apiKeysCount: 3,
    totalRequests: 45200,
    lastActiveAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'dev_3',
    name: 'Karim Hadj',
    email: 'karim@startup.dz',
    company: 'StartupDZ',
    plan: 'pro',
    status: 'active',
    joinedAt: new Date('2024-03-01'),
    apiKeysCount: 2,
    totalRequests: 28900,
    lastActiveAt: new Date(Date.now() - 120 * 60 * 1000),
  },
  {
    id: 'dev_4',
    name: 'Fatima Zohra',
    email: 'fatima@logistics.dz',
    company: 'Logistics Plus',
    plan: 'free',
    status: 'suspended',
    joinedAt: new Date('2023-12-10'),
    apiKeysCount: 1,
    totalRequests: 950,
    lastActiveAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'dev_5',
    name: 'Omar Boudiaf',
    email: 'omar@agro.dz',
    company: 'AgroTech Solutions',
    plan: 'enterprise',
    status: 'active',
    joinedAt: new Date('2024-01-05'),
    apiKeysCount: 8,
    totalRequests: 234000,
    lastActiveAt: new Date(Date.now() - 15 * 60 * 1000),
  }
];

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'log_1', action: 'API_KEY_CREATED', developerId: 'dev_1', developerName: 'Ahmed Benali', details: 'Created new API key "Production v2"', ipAddress: '41.200.xxx.xxx', timestamp: new Date(Date.now() - 5 * 60 * 1000), severity: 'info' },
  { id: 'log_2', action: 'RATE_LIMIT_EXCEEDED', developerId: 'dev_4', developerName: 'Fatima Zohra', details: 'Exceeded rate limit (100 req/min) on /v2/products', ipAddress: '196.200.xxx.xxx', timestamp: new Date(Date.now() - 30 * 60 * 1000), severity: 'warning' },
  { id: 'log_3', action: 'WEBHOOK_FAILED', developerId: 'dev_2', developerName: 'Sarah Meziani', details: 'Webhook delivery failed after 3 retries to https://app.com/hook', ipAddress: '-', timestamp: new Date(Date.now() - 45 * 60 * 1000), severity: 'warning' },
  { id: 'log_4', action: 'ACCOUNT_SUSPENDED', developerId: 'dev_4', developerName: 'Fatima Zohra', details: 'Account suspended due to policy violation', ipAddress: 'admin', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), severity: 'error' },
  { id: 'log_5', action: 'PLAN_UPGRADED', developerId: 'dev_3', developerName: 'Karim Hadj', details: 'Upgraded from Free to Pro plan', ipAddress: '105.100.xxx.xxx', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), severity: 'info' },
];

const USAGE_BY_DEVELOPER = [
  { developer: 'Omar Boudiaf', requests: 234000, percentage: 38.2 },
  { developer: 'Ahmed Benali', requests: 125000, percentage: 20.4 },
  { developer: 'Sarah Meziani', requests: 45200, percentage: 7.4 },
  { developer: 'Karim Hadj', requests: 28900, percentage: 4.7 },
  { developer: 'Others', requests: 179900, percentage: 29.3 },
];

const WEBHOOK_DELIVERY_STATS = [
  { period: 'Last hour', delivered: 1245, failed: 12, avgTime: 145 },
  { period: 'Last 24h', delivered: 28900, failed: 234, avgTime: 138 },
  { period: 'Last 7d', delivered: 185000, failed: 1520, avgTime: 142 },
  { period: 'Last 30d', delivered: 780000, failed: 6200, avgTime: 140 },
];

const REVENUE_DATA = [
  { month: 'Jan', revenue: 299700, developers: 45 },
  { month: 'Feb', revenue: 349650, developers: 52 },
  { month: 'Mar', revenue: 399600, developers: 61 },
  { month: 'Apr', revenue: 449550, developers: 68 },
];

export default function AdminDeveloperPortalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Filter developers
  const filteredDevelopers = MOCK_DEVELOPERS.filter(dev => {
    const matchesSearch = !searchQuery || 
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
    const matchesPlan = planFilter === 'all' || dev.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate stats
  const totalDevelopers = MOCK_DEVELOPERS.length;
  const activeDevelopers = MOCK_DEVELOPERS.filter(d => d.status === 'active').length;
  const totalApiKeys = MOCK_DEVELOPERS.reduce((sum, d) => sum + d.apiKeysCount, 0);
  const totalRequests = MOCK_DEVELOPERS.reduce((sum, d) => sum + d.totalRequests, 0);
  const monthlyRevenue = REVENUE_DATA[REVENUE_DATA.length - 1].revenue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Developer Portal Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage API developers, monitor usage, and track revenue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AdminStatCard title="Total Developers" value={totalDevelopers} icon={<Users className="w-5 h-5" />} trend="+12%" />
        <AdminStatCard title="Active" value={activeDevelopers} icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} color="text-emerald-600" />
        <AdminStatCard title="API Keys" value={totalApiKeys} icon={<Key className="w-5 h-5" />} />
        <AdminStatCard title="Total Requests" value={(totalRequests / 1000).toFixed(0) + 'K'} icon={<Activity className="w-5 h-5" />} />
        <AdminStatCard title="Monthly Revenue" value={`${(monthlyRevenue / 1000).toFixed(0)}K DZD`} icon={<CreditCard className="w-5 h-5 text-purple-500" />} color="text-purple-600" />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="developers" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="developers" className="gap-1">
            <Users className="w-4 h-4" />
            Developers
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="gap-1">
            <Shield className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-1">
            <BarChart3 className="w-4 h-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1">
            <CreditCard className="w-4 h-4" />
            Revenue
          </TabsTrigger>
        </TabsList>

        {/* Developers Tab */}
        <TabsContent value="developers" className="mt-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Developers Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Developer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>API Keys</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevelopers.map(dev => (
                    <TableRow key={dev.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dev.name}</p>
                          <p className="text-sm text-muted-foreground">{dev.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{dev.company}</TableCell>
                      <TableCell>
                        <Badge variant={dev.plan === 'enterprise' ? 'default' : dev.plan === 'pro' ? 'secondary' : 'outline'}>
                          {dev.plan.charAt(0).toUpperCase() + dev.plan.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dev.status === 'active' ? 'default' : dev.status === 'suspended' ? 'destructive' : 'secondary'}>
                          {dev.status.charAt(0).toUpperCase() + dev.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{dev.apiKeysCount}</TableCell>
                      <TableCell>{dev.totalRequests.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-sm">{formatRelativeTime(dev.lastActiveAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredDevelopers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No developers found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit-log" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Track all important actions and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {MOCK_AUDIT_LOGS.map(log => (
                    <div key={log.id} className={`p-4 rounded-lg border ${
                      log.severity === 'error' ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' :
                      log.severity === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : ''
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {log.severity === 'error' ? (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          ) : log.severity === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <code className="text-sm font-medium">{log.action}</code>
                            <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{log.developerName}</span>
                              <span>IP: {log.ipAddress}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Usage by Developer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usage by Developer (Top 5)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {USAGE_BY_DEVELOPER.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={i === 3 ? 'italic text-muted-foreground' : ''}>{item.developer}</span>
                        <span className="text-muted-foreground">{item.requests.toLocaleString()} ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage by Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Popular Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { endpoint: '/v2/products', calls: 234000, percentage: 38 },
                    { endpoint: '/v2/search', calls: 168000, percentage: 27 },
                    { endpoint: '/v2/companies', calls: 89000, percentage: 14 },
                    { endpoint: '/v2/orders', calls: 67000, percentage: 11 },
                    { endpoint: '/v2/rfqs', calls: 55000, percentage: 9 },
                  ].map((ep, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <code className="text-sm font-mono min-w-[120px]">{ep.endpoint}</code>
                      <Progress value={ep.percentage} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground w-16 text-right">{ep.calls.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Webhooks Monitoring Tab */}
        <TabsContent value="webhooks" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            {WEBHOOK_DELIVERY_STATS.map(stat => (
              <Card key={stat.period}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{stat.period}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-semibold text-emerald-600">{stat.delivered.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-red-600">{stat.failed.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{stat.avgTime}ms</p>
                      <p className="text-xs text-muted-foreground">Avg Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {WEBHOOK_DELIVERY_STATS.map(stat => {
                  const successRate = ((stat.delivered / (stat.delivered + stat.failed)) * 100).toFixed(1);
                  return (
                    <div key={stat.period} className="flex items-center gap-4">
                      <span className="w-24 text-sm">{stat.period}</span>
                      <div className="flex-1">
                        <Progress value={parseFloat(successRate)} className="h-3" />
                      </div>
                      <span className={`w-16 text-right font-semibold ${
                        parseFloat(successRate) >= 99 ? 'text-emerald-600' :
                        parseFloat(successRate) >= 95 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {successRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold text-primary">{REVENUE_DATA[REVENUE_DATA.length - 1].revenue.toLocaleString()} DZD</p>
                <p className="text-sm text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  +13.2% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Paid Developers</p>
                <p className="text-3xl font-bold">{REVENUE_DATA[REVENUE_DATA.length - 1].developers}</p>
                <p className="text-sm text-muted-foreground mt-1">Out of {totalDevelopers} total</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Revenue/User</p>
                <p className="text-3xl font-bold">
                  {(REVENUE_DATA[REVENUE_DATA.length - 1].revenue / REVENUE_DATA[REVENUE_DATA.length - 1].developers).toLocaleString()} DZD
                </p>
                <p className="text-sm text-muted-foreground mt-1">Per paid developer</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {REVENUE_DATA.map((data, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-12 text-sm font-medium">{data.month}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(data.revenue / 500000) * 100}%` }}
                      >
                        <span className="text-xs font-medium text-primary-foreground">
                          {(data.revenue / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {data.developers} devs
                    </span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{REVENUE_DATA.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total YTD (DZD)</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{REVENUE_DATA.reduce((sum, d) => sum + d.developers, 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Dev Signups</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">89%</p>
                  <p className="text-xs text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function AdminStatCard({ 
  title, 
  value, 
  icon, 
  color = 'text-foreground',
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color?: string;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground uppercase tracking-wide">{title}</span>
          <div className={color}>{icon}</div>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {trend && (
          <p className="text-xs text-emerald-600 mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
