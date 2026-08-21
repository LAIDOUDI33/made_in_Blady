'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
import { PilotOnboardingWizard } from '@/components/blockchain/pilot/PilotOnboardingWizard';
import { PilotDashboard } from '@/components/blockchain/pilot/PilotDashboard';
import { PilotMetrics } from '@/components/blockchain/pilot/PilotMetrics';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Settings,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  Building2,
  TrendingUp,
  BarChart3,
  FileText,
  MessageSquare,
  Rocket,
  Pill,
  Wheat,
  Factory,
  ChevronRight,
  Download,
  RefreshCw
} from 'lucide-react';

// Types
interface PilotProgram {
  id: string;
  companyId: string;
  companyName: string;
  industry: string;
  industryIcon: React.ReactNode;
  status: 'setup' | 'active' | 'review' | 'completed' | 'extended' | 'cancelled';
  template: string;
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  progress: number;
  stats: {
    productsRegistered: number;
    eventsLogged: number;
    certificatesIssued: number;
    activeUsers: number;
  };
  contactPerson: string;
  contactEmail: string;
  createdAt: string;
}

interface SupportRequest {
  id: string;
  pilotId: string;
  companyName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

// Mock Data for Active Pilots
const mockPilots: PilotProgram[] = [
  {
    id: 'pilot_saidal_001',
    companyId: 'comp_saidal_001',
    companyName: 'SAIDAL SPA',
    industry: 'pharmaceuticals',
    industryIcon: <Pill className="w-4 h-4" />,
    status: 'active',
    template: 'pharmaceutical',
    startDate: '2024-01-15',
    endDate: '2024-01-29',
    currentDay: 8,
    totalDays: 14,
    progress: 57,
    stats: { productsRegistered: 67, eventsLogged: 1234, certificatesIssued: 23, activeUsers: 12 },
    contactPerson: 'Dr. Karim Hadj',
    contactEmail: 'k.hadj@saidal.dz',
    createdAt: '2024-01-10'
  },
  {
    id: 'pilot_biskra_dates_001',
    companyId: 'comp_biskra_dates_001',
    companyName: 'Biskra Dates Cooperative',
    industry: 'agriculture-dates',
    industryIcon: <Wheat className="w-4 h-4" />,
    status: 'active',
    template: 'dates',
    startDate: '2024-01-18',
    endDate: '2024-02-01',
    currentDay: 5,
    totalDays: 14,
    progress: 36,
    stats: { productsRegistered: 23, eventsLogged: 456, certificatesIssued: 8, activeUsers: 7 },
    contactPerson: 'Mohamed Benali',
    contactEmail: 'm.benali@biskradates.coop.dz',
    createdAt: '2024-01-13'
  },
  {
    id: 'pilot_scimat_001',
    companyId: 'comp_scimat_001',
    companyName: 'SCIMAT (Cimenterie de Mascara)',
    industry: 'cement',
    industryIcon: <Factory className="w-4 h-4" />,
    status: 'setup',
    template: 'industrial',
    startDate: '2024-01-22',
    endDate: '2024-02-05',
    currentDay: 1,
    totalDays: 14,
    progress: 12,
    stats: { productsRegistered: 5, eventsLogged: 0, certificatesIssued: 0, activeUsers: 3 },
    contactPerson: 'Amine Boudiaf',
    contactEmail: 'a.boudiaf@scimat.dz',
    createdAt: '2024-01-18'
  },
  {
    id: 'pilot_tosyali_001',
    companyId: 'comp_tosyali_001',
    companyName: 'Tosyali Algeria',
    industry: 'steel',
    industryIcon: <Factory className="w-4 h-4" />,
    status: 'review',
    template: 'industrial',
    startDate: '2024-01-08',
    endDate: '2024-01-22',
    currentDay: 15,
    totalDays: 14,
    progress: 92,
    stats: { productsRegistered: 45, eventsLogged: 2890, certificatesIssued: 42, activeUsers: 18 },
    contactPerson: 'Yacine Mebarki',
    contactEmail: 'y.mebarki@tosyali.dz',
    createdAt: '2024-01-03'
  }
];

const mockSupportRequests: SupportRequest[] = [
  { id: 'SRQ-001', pilotId: 'pilot_saidal_001', companyName: 'SAIDAL SPA', subject: 'API rate limiting issue', priority: 'high', status: 'in_progress', createdAt: '2024-01-23' },
  { id: 'SRQ-002', pilotId: 'pilot_biskra_dates_001', companyName: 'Biskra Dates Coop', subject: 'Need help with certificate templates', priority: 'medium', status: 'open', createdAt: '2024-01-24' },
  { id: 'SRQ-003', pilotId: 'pilot_scimat_001', companyName: 'SCIMAT', subject: 'ERP integration questions', priority: 'low', status: 'open', createdAt: '2024-01-24' },
  { id: 'SRQ-004', pilotId: 'pilot_tosyali_001', companyName: 'Tosyali Algeria', subject: 'Request to extend pilot period', priority: 'medium', status: 'resolved', createdAt: '2024-01-22' }
];

// Pilot Templates Configuration
const pilotTemplates = [
  {
    id: 'pharmaceutical',
    name: 'Pharmaceutical Industry',
    nameAr: 'الصناعة الدوائية',
    icon: <Pill className="w-6 h-6" />,
    description: 'For pharmaceutical companies like SAIDAL, BIOPHARM, Pharmal',
    features: ['AMM/ANPP integration', 'GMP compliance tracking', 'Cold chain monitoring', 'Batch traceability'],
    targetCompanies: ['SAIDAL SPA', 'BIOPHARM', 'Pharmal', 'Biotic', 'Saidal Constantine'],
    color: 'bg-red-50 border-red-200'
  },
  {
    id: 'dates',
    name: 'Dates & Agriculture',
    nameAr: 'تمور وزراعة',
    icon: <Wheat className="w-6 h-6" />,
    description: 'For date producers in Biskra, Touggourt, and agricultural cooperatives',
    features: ['Organic certification (ONSSA)', 'PGI labeling', 'Harvest tracking', 'Export documentation'],
    targetCompanies: ['Biskra Dates Coop', 'Touggourt Dates', 'Ghardaïa Producers', 'Oasis Exporters'],
    color: 'bg-amber-50 border-amber-200'
  },
  {
    id: 'agricultural',
    name: 'General Agriculture',
    nameAr: 'زراعة عامة',
    icon: <Wheat className="w-6 h-6" />,
    description: 'For olive oil, citrus, cereals, and other agricultural products',
    features: ['Origin certification', 'Quality grades', 'Season tracking', 'Cooperative management'],
    targetCompanies: ['Olive Oil Producers Tizi Ouzou', 'Bejaia Citrus', 'Militia Cereals'],
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'industrial',
    name: 'Industrial Manufacturing',
    nameAr: 'صناعة تحويلية',
    icon: <Factory className="w-6 h-6" />,
    description: 'For cement, steel, construction materials manufacturers',
    features: ['QAISO certification', 'Quality testing integration', 'Customs documentation', 'Batch traceability'],
    targetCompanies: ['SCIMAT', 'ERCIM', 'Tosyali Algeria', 'AQS', 'Algéria Steel'],
    color: 'bg-gray-50 border-gray-200'
  }
];

export default function BlockchainPilotAdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPilot, setSelectedPilot] = useState<PilotProgram | null>(null);
  const [showNewPilotDialog, setShowNewPilotDialog] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Filter pilots based on search and filters
  const filteredPilots = mockPilots.filter(pilot => {
    const matchesSearch = pilot.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pilot.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pilot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary statistics
  const summaryStats = {
    total: mockPilots.length,
    active: mockPilots.filter(p => p.status === 'active').length,
    setup: mockPilots.filter(p => p.status === 'setup').length,
    review: mockPilots.filter(p => p.status === 'review').length,
    completed: mockPilots.filter(p => p.status === 'completed').length,
    avgProgress: Math.round(mockPilots.reduce((sum, p) => sum + p.progress, 0) / mockPilots.length)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'setup': return <Badge className="bg-yellow-100 text-yellow-800">Setup</Badge>;
      case 'review': return <Badge className="bg-purple-100 text-purple-800">Review</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'extended': return <Badge className="bg-indigo-100 text-indigo-800">Extended</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
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

  if (showOnboardingWizard) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowOnboardingWizard(false)}
          >
            ← Back to Admin Dashboard
          </Button>
          <h1 className="text-xl font-semibold">New Pilot Onboarding Wizard</h1>
          <div></div>
        </div>
        <PilotOnboardingWizard />
      </div>
    );
  }

  if (selectedPilot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPilot(null)}
              className="flex items-center gap-2"
            >
              ← Back to Pilot List
            </Button>
            <h1 className="text-lg font-semibold">{selectedPilot.companyName}</h1>
            <div className="flex items-center gap-2">
              {getStatusBadge(selectedPilot.status)}
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="max-w-7xl mx-auto p-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="metrics">Metrics & KPIs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <PilotDashboard />
          </TabsContent>
          
          <TabsContent value="metrics" className="mt-6">
            <PilotMetrics />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pilot Settings</CardTitle>
                <CardDescription>Configure pilot program parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Rocket className="w-8 h-8 text-purple-600" />
                Blockchain Pilot Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage customer onboarding programs for AlgeriaTrack.dz supply chain tracking
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={() => setShowOnboardingWizard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Pilot Program
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pilots" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Active Pilots ({summaryStats.active})
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Onboarding Queue ({summaryStats.setup})
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Support Requests
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-sm text-gray-500">Total Pilots</p>
                  <p className="text-3xl font-bold">{summaryStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-3xl font-bold text-blue-600">{summaryStats.active}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-sm text-gray-500">In Setup</p>
                  <p className="text-3xl font-bold text-yellow-600">{summaryStats.setup}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-sm text-gray-500">In Review</p>
                  <p className="text-3xl font-bold text-purple-600">{summaryStats.review}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-sm text-gray-500">Avg Progress</p>
                  <p className="text-3xl font-bold text-green-600">{summaryStats.avgProgress}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Pilot Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPilots.slice(0, 4).map((pilot) => (
                      <div 
                        key={pilot.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => setSelectedPilot(pilot)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            {pilot.industryIcon}
                          </div>
                          <div>
                            <p className="font-medium">{pilot.companyName}</p>
                            <p className="text-xs text-gray-500">Day {pilot.currentDay} of {pilot.totalDays}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(pilot.status)}
                          <p className="text-sm font-medium mt-1">{pilot.progress}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setShowOnboardingWizard(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Pilot Program
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Pilot Reports
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All Pilot Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Notifications
                  </Button>
                  
                  <Separator />
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Check our onboarding guide or contact support.
                    </p>
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                      View Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Active Pilots Tab */}
          <TabsContent value="pilots" className="mt-6 space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by company name or pilot ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="setup">Setup</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pilots Table */}
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Certificates</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPilots.map((pilot) => (
                      <TableRow key={pilot.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell>
                          <div 
                            className="font-medium"
                            onClick={() => setSelectedPilot(pilot)}
                          >
                            {pilot.companyName}
                          </div>
                          <div className="text-xs text-gray-500">{pilot.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {pilot.industryIcon}
                            <span className="capitalize">{pilot.industry.replace('-', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(pilot.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pilot.progress} className="w-20 h-2" />
                            <span className="text-sm">{pilot.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{pilot.currentDay}/{pilot.totalDays}</TableCell>
                        <TableCell>{pilot.stats.productsRegistered}</TableCell>
                        <TableCell>{pilot.stats.eventsLogged.toLocaleString()}</TableCell>
                        <TableCell>{pilot.stats.certificatesIssued}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{pilot.contactPerson}</div>
                            <div className="text-gray-500">{pilot.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredPilots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pilots found matching your criteria
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onboarding Queue Tab */}
          <TabsContent value="onboarding" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockPilots.filter(p => p.status === 'setup').map((pilot) => (
                <Card key={pilot.id} className={`border-l-4 ${pilot.template === 'pharmaceutical' ? 'border-l-red-400' : pilot.template === 'dates' ? 'border-l-amber-400' : 'border-l-gray-400'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{pilot.companyName}</CardTitle>
                        <CardDescription>Pilot ID: {pilot.id}</CardDescription>
                      </div>
                      {getStatusBadge(pilot.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Template:</span>
                          <p className="font-medium capitalize">{pilot.template}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Start Date:</span>
                          <p className="font-medium">{new Date(pilot.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Contact:</span>
                          <p className="font-medium">{pilot.contactPerson}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Progress:</span>
                          <p className="font-medium">{pilot.progress}%</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedPilot(pilot)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {mockPilots.filter(p => p.status === 'setup').length === 0 && (
                <Card className="col-span-2">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">All Caught Up!</h3>
                    <p className="text-gray-500 mt-1">No pilots currently in onboarding queue</p>
                    <Button className="mt-4" onClick={() => setShowOnboardingWizard(true)}>
                      Start New Pilot Onboarding
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Support Requests Tab */}
          <TabsContent value="support" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Support Requests</CardTitle>
                    <CardDescription>Manage support tickets from pilot customers</CardDescription>
                  </div>
                  <Badge variant="outline">{mockSupportRequests.length} open requests</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSupportRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">{request.id}</TableCell>
                        <TableCell className="font-medium">{request.companyName}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{request.subject}</TableCell>
                        <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                        <TableCell>
                          {request.status === 'open' && <Badge variant="secondary">Open</Badge>}
                          {request.status === 'in_progress' && <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>}
                          {request.status === 'resolved' && <Badge className="bg-green-100 text-green-800">Resolved</Badge>}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
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
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pilotTemplates.map((template) => (
                <Card key={template.id} className={`${template.color} cursor-pointer hover:shadow-md transition-shadow`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-gray-700">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">{template.nameAr}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Key Features:</p>
                      <ul className="space-y-1">
                        {template.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Target Companies:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.targetCompanies.slice(0, 3).map((company, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{company}</Badge>
                        ))}
                        {template.targetCompanies.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{template.targetCompanies.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setShowOnboardingWizard(true)}
                    >
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Custom Template Option */}
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Need a Custom Template?</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  We can create a customized pilot template tailored to your specific industry requirements. Contact our team to discuss your needs.
                </p>
                <Button variant="outline">
                  Request Custom Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
