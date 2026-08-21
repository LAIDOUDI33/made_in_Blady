'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Package,
  Calendar,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  FileText,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Download,
  Eye,
  Plus,
  ChevronRight,
  BarChart3,
  Activity,
  Truck,
  Shield,
  QrCode
} from 'lucide-react';

// Types
interface PilotProgram {
  id: string;
  companyName: string;
  industry: string;
  status: 'setup' | 'active' | 'review' | 'completed' | 'extended';
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  progress: number;
}

interface TimelineEvent {
  day: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'overdue';
  category: 'setup' | 'training' | 'active' | 'review';
}

interface ProductStats {
  registered: number;
  target: number;
  withEvents: number;
  withCertificates: number;
}

interface EventStats {
  total: number;
  today: number;
  thisWeek: number;
  successRate: number;
}

interface CertificateStats {
  issued: number;
  pending: number;
  verified: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  category: string;
}

// Mock Data
const mockPilot: PilotProgram = {
  id: 'pilot_saidal_001',
  companyName: 'SAIDAL SPA',
  industry: 'pharmaceuticals',
  status: 'active',
  startDate: '2024-01-15',
  endDate: '2024-01-29',
  currentDay: 8,
  totalDays: 14,
  progress: 57
};

const timelineEvents: TimelineEvent[] = [
  { day: 1, title: 'Account Setup', description: 'Complete registration and API key generation', status: 'completed', category: 'setup' },
  { day: 2, title: 'API Configuration', description: 'Configure webhooks and endpoints', status: 'completed', category: 'setup' },
  { day: 3, title: 'Product Catalog Upload', description: 'Upload initial product catalog (50+ SKUs)', status: 'completed', category: 'setup' },
  { day: 4, title: 'Data Validation', description: 'Validate and map ERP data', status: 'completed', category: 'setup' },
  { day: 5, title: 'Staff Training Day 1', description: 'Platform overview and mobile app training', status: 'completed', category: 'training' },
  { day: 6, title: 'Staff Training Day 2', description: 'Hands-on practice and certification workflows', status: 'completed', category: 'training' },
  { day: 7, title: 'Go-Live!', description: 'Process first live batch through system', status: 'completed', category: 'setup' },
  { day: 8, title: 'Active Monitoring', description: 'Monitor shipments and verify provenance data', status: 'current', category: 'active' },
  { day: 9, title: 'Shipment Tracking', description: 'Track minimum 3 end-to-end shipments', status: 'upcoming', category: 'active' },
  { day: 10, title: 'Exception Handling', description: 'Test exception scenarios and resolution', status: 'upcoming', category: 'active' },
  { day: 11, title: 'Certificate Generation', description: 'Issue first digital certificates', status: 'upcoming', category: 'active' },
  { day: 12, title: 'Certificate Verification', description: 'Test third-party certificate verification', status: 'upcoming', category: 'active' },
  { day: 13, title: 'Feedback Collection', description: 'Gather user and stakeholder feedback', status: 'upcoming', category: 'review' },
  { day: 14, title: 'Pilot Review Meeting', description: 'Review results and make rollout decision', status: 'upcoming', category: 'review' }
];

const mockProductStats: ProductStats = {
  registered: 67,
  target: 100,
  withEvents: 45,
  withCertificates: 23
};

const mockEventStats: EventStats = {
  total: 1234,
  today: 45,
  thisWeek: 312,
  successRate: 98.5
};

const mockCertificateStats: CertificateStats = {
  issued: 23,
  pending: 5,
  verified: 18
};

const mockSupportTickets: SupportTicket[] = [
  { id: 'TKT-001', subject: 'QR code not scanning on older devices', status: 'in_progress', priority: 'medium', createdAt: '2024-01-22', category: 'Technical' },
  { id: 'TKT-002', subject: 'Webhook delay notifications', status: 'open', priority: 'high', createdAt: '2024-01-23', category: 'Integration' },
  { id: 'TKT-003', subject: 'Request for additional user accounts', status: 'resolved', priority: 'low', createdAt: '2024-01-20', category: 'Account' },
  { id: 'TKT-004', subject: 'Certificate template customization', status: 'open', priority: 'medium', createdAt: '2024-01-23', category: 'Feature Request' }
];

const recentShipments = [
  { id: 'SHP-001', origin: 'Oued Smar Plant', destination: 'Oran Distribution', status: 'in_transit', products: 12, events: 15 },
  { id: 'SHP-002', origin: 'Constantine Facility', destination: 'Algiers Central', status: 'delivered', products: 8, events: 20 },
  { id: 'SHP-003', origin: 'Annaba Warehouse', destination: 'Tamanrasset Hospital', status: 'preparing', products: 25, events: 5 }
];

export function PilotDashboard() {
  const [selectedPilotId, setSelectedPilotId] = useState<string>(mockPilot.id);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500 animate-pulse';
      case 'upcoming': return 'bg-gray-300';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="secondary">Open</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'resolved': return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed': return <Badge variant="outline">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
      default: return <Badge>{priority}</Badge>;
    }
  };

  const getShipmentStatus = (status: string) => {
    switch (status) {
      case 'preparing': return <Badge variant="outline">Preparing</Badge>;
      case 'in_transit': return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>;
      case 'delivered': return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  // Calculate days remaining
  const daysRemaining = mockPilot.totalDays - mockPilot.currentDay;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pilot Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {mockPilot.companyName} - Blockchain Supply Chain Tracking Pilot
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPilotId} onValueChange={setSelectedPilotId}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={mockPilot.id}>{mockPilot.companyName}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`border-l-4 ${
        mockPilot.status === 'active' ? 'border-l-blue-500 bg-blue-50' :
        mockPilot.status === 'completed' ? 'border-l-green-500 bg-green-50' :
        'border-l-orange-500 bg-orange-50'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                mockPilot.status === 'active' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                <Activity className={`w-6 h-6 ${
                  mockPilot.status === 'active' ? 'text-blue-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {mockPilot.status === 'active' ? 'Pilot Active - Day ' + mockPilot.currentDay + ' of 14' :
                   mockPilot.status === 'completed' ? 'Pilot Completed' : 'Pilot Setup'}
                </p>
                <p className="text-sm text-gray-600">
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Final review phase'}
                  {' • '}Progress: {mockPilot.progress}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-semibold">{new Date(mockPilot.endDate).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <Progress value={mockPilot.progress} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Shipments
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Support
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Products Registered */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Products Registered</p>
                    <p className="text-3xl font-bold mt-1">{mockProductStats.registered}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Target: {mockProductStats.target} ({Math.round(mockProductStats.registered/mockProductStats.target*100)}%)
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <Progress 
                  value={(mockProductStats.registered / mockProductStats.target) * 100} 
                  className="mt-4 h-2"
                />
              </CardContent>
            </Card>

            {/* Events Logged */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Events Logged</p>
                    <p className="text-3xl font-bold mt-1">{mockEventStats.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Today: {mockEventStats.today} • This week: {mockEventStats.thisWeek}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">{mockEventStats.successRate}% Success Rate</span>
                </div>
              </CardContent>
            </Card>

            {/* Certificates Issued */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Certificates Issued</p>
                    <p className="text-3xl font-bold mt-1">{mockCertificateStats.issued}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Pending: {mockCertificateStats.pending} • Verified: {mockCertificateStats.verified}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Shield className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600">{Math.round(mockCertificateStats.verified/mockCertificateStats.issued*100)}% Verified</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <p className="text-3xl font-bold mt-1">12</p>
                    <p className="text-xs text-gray-500 mt-1">
                      85% of trained staff active today
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+2 from yesterday</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest supply chain events logged</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {[
                    { time: '10 min ago', event: 'WAREHOUSE_IN', product: 'Paracetamol 500mg', location: 'Oran DC', icon: Package },
                    { time: '25 min ago', event: 'QC_APPROVED', product: 'Amoxicillin 250mg', location: 'Oued Smar QC Lab', icon: CheckCircle2 },
                    { time: '1 hour ago', event: 'TRANSPORT', product: 'Ibuprofen 400mg', route: 'Algiers → Constantine', icon: Truck },
                    { time: '2 hours ago', event: 'CERTIFICATE_ISSUED', product: 'Batch BT-2024-0456', type: 'Origin Certificate', icon: Award },
                    { time: '3 hours ago', event: 'WAREHOUSE_OUT', product: 'Metformin 850mg', destination: 'Blida Pharmacy', icon: Package }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <activity.icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{activity.event.replace('_', ' ')}</p>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{activity.product}</p>
                        <p className="text-xs text-gray-400">{activity.location || activity.route || activity.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Statistics</CardTitle>
                <CardDescription>Pilot performance at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Tracking Coverage */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Tracking Coverage</span>
                      <span className="text-sm font-bold text-green-600">67%</span>
                    </div>
                    <Progress value={67} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1">Target: 80% by Day 10</p>
                  </div>

                  {/* Event Accuracy */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Event Accuracy</span>
                      <span className="text-sm font-bold text-green-600">98.5%</span>
                    </div>
                    <Progress value={98.5} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1">Target: 99% ✓ Exceeding</p>
                  </div>

                  {/* User Adoption */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">User Adoption</span>
                      <span className="text-sm font-bold text-blue-600">85%</span>
                    </div>
                    <Progress value={85} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1">Target: 85% ✓ On Track</p>
                  </div>

                  {/* Certificate Rate */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Certificate Rate</span>
                      <span className="text-sm font-bold text-yellow-600">51%</span>
                    </div>
                    <Progress value={51} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1">Target: 90% by Day 12</p>
                  </div>

                  <Separator />

                  {/* System Health */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">99.9%</p>
                      <p className="text-xs text-gray-500">Uptime</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">&lt;2s</p>
                      <p className="text-xs text-gray-500">Avg Response</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">0</p>
                      <p className="text-xs text-gray-500">Critical Issues</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">14-Day Pilot Timeline</CardTitle>
                  <CardDescription>Your progress through the pilot program</CardDescription>
                </div>
                <Badge variant="outline" className="text-base py-1 px-3">
                  Day {mockPilot.currentDay} of {mockPilot.totalDays}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Timeline Items */}
                <div className="space-y-6">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="relative flex gap-6">
                      {/* Timeline Dot */}
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
                        {event.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-white" />}
                        {event.status === 'current' && <Clock className="w-6 h-6 text-white" />}
                        {(event.status === 'upcoming' || event.status === 'overdue') && (
                          <span className="text-white font-bold text-sm">{event.day}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-6 ${event.status === 'current' ? 'bg-blue-50 -mx-4 px-4 py-4 rounded-lg border border-blue-200' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold ${event.status === 'current' ? 'text-blue-800' : ''}`}>
                                Day {event.day}: {event.title}
                              </h3>
                              {event.status === 'current' && (
                                <Badge className="bg-blue-600">Current</Badge>
                              )}
                              {event.status === 'completed' && (
                                <Badge className="bg-green-100 text-green-800">Completed</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                          </Badge>
                        </div>

                        {/* Current Day Actions */}
                        {event.status === 'current' && (
                          <div className="mt-4 flex gap-3">
                            <Button size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Task Checklist
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Shipments</h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Shipment
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono font-medium">{shipment.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {shipment.origin}
                        </div>
                      </TableCell>
                      <TableCell>{shipment.destination}</TableCell>
                      <TableCell>{getShipmentStatus(shipment.status)}</TableCell>
                      <TableCell>{shipment.products}</TableCell>
                      <TableCell>{shipment.events}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <QrCode className="w-12 h-12 mx-auto text-purple-600 mb-3" />
                <p className="text-3xl font-bold">{mockCertificateStats.issued}</p>
                <p className="text-sm text-gray-500">Total Issued</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-12 h-12 mx-auto text-yellow-600 mb-3" />
                <p className="text-3xl font-bold">{mockCertificateStats.pending}</p>
                <p className="text-sm text-gray-500">Pending Approval</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="w-12 h-12 mx-auto text-green-600 mb-3" />
                <p className="text-3xl font-bold">{mockCertificateStats.verified}</p>
                <p className="text-sm text-gray-500">Verified by Third Parties</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product/Batch</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { certNo: 'AT-CERT-2024-0001234', type: 'Origin Certificate', product: 'Paracetamol 500mg / BT-0456', date: '2024-01-22', status: 'verified' },
                    { certNo: 'AT-CERT-2024-0001235', type: 'GMP Compliance', product: 'Amoxicillin 250mg / BT-0457', date: '2024-01-21', status: 'issued' },
                    { certNo: 'AT-CERT-2024-0001236', type: 'Quality Certificate', product: 'Ibuprofen 400mg / BT-0458', date: '2024-01-20', status: 'pending' },
                    { certNo: 'AT-CERT-2024-0001237', type: 'Origin Certificate', product: 'Metformin 850mg / BT-0459', date: '2024-01-19', status: 'verified' }
                  ].map((cert, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{cert.certNo}</TableCell>
                      <TableCell>{cert.type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{cert.product}</TableCell>
                      <TableCell>{cert.date}</TableCell>
                      <TableCell>
                        {cert.status === 'verified' && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
                        {cert.status === 'issued' && <Badge className="bg-blue-100 text-blue-800">Issued</Badge>}
                        {cert.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Certificate Details</DialogTitle>
                              <DialogDescription>Digital certificate information and verification</DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-500">Certificate Number</Label>
                                  <p className="font-mono font-medium">{cert.certNo}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-500">Type</Label>
                                  <p className="font-medium">{cert.type}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-500">Issue Date</Label>
                                  <p className="font-medium">{cert.date}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-500">Status</Label>
                                  <p className="font-medium capitalize">{cert.status}</p>
                                </div>
                              </div>
                              <Separator />
                              <div>
                                <Label className="text-gray-500">Blockchain Verification</Label>
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                                  Hash: 0xabc123...def456<br/>
                                  TX: 0x789ghi...012jkl<br/>
                                  Confirmations: 12/12 ✓
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Button>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </Button>
                                <Button variant="outline">
                                  <QrCode className="w-4 h-4 mr-2" />
                                  QR Code
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Support Tickets</h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSupportTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono font-medium">{ticket.id}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{ticket.subject}</TableCell>
                      <TableCell><Badge variant="outline">{ticket.category}</Badge></TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-blue-900">Need Help?</h3>
                  <p className="text-blue-700 mt-1">
                    Our support team is available during your pilot program
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Live Chat
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PilotDashboard;
