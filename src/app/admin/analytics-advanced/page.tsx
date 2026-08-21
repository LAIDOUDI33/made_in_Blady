'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Shield,
  History,
  Settings,
  BarChart3,
  CalendarDays,
  Mail,
  MoreVertical,
  Search,
  Filter,
  Eye,
  Pause,
  Play
} from 'lucide-react';

// Import dashboard components
import { ExecutiveDashboard } from '@/components/analytics/ExecutiveDashboard';
import { CustomReportBuilder } from '@/components/analytics/CustomReportBuilder';

// Types
interface ScheduledJob {
  id: string;
  reportId: string;
  name: string;
  description?: string;
  frequency: string;
  time: string;
  format: string;
  recipients: string[];
  enabled: boolean;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastStatus: 'scheduled' | 'running' | 'completed' | 'failed';
  createdAt: Date;
}

interface ExportHistoryItem {
  id: string;
  reportName: string;
  format: string;
  filename: string;
  recordCount: number;
  exportedBy: string;
  exportedAt: Date;
  downloadUrl: string;
  size: string;
}

interface UserPermission {
  userId: string;
  userName: string;
  userEmail: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  canCreateReports: boolean;
  canExportData: boolean;
  canScheduleReports: boolean;
  canAccessAllMetrics: boolean;
  lastActive: Date;
}

// Mock data generators
const generateScheduledJobs = (): ScheduledJob[] => [
  {
    id: 'job-1',
    reportId: 'report-weekly-revenue',
    name: 'Weekly Revenue Report',
    description: 'Comprehensive weekly revenue breakdown',
    frequency: 'weekly',
    time: '08:00',
    format: 'pdf',
    recipients: ['ceo@algeriatrade.dz', 'finance@algeriatrade.dz'],
    enabled: true,
    nextRunAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastStatus: 'completed',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'job-2',
    reportId: 'report-monthly-kpis',
    name: 'Monthly KPI Dashboard',
    description: 'Key performance indicators summary',
    frequency: 'monthly',
    time: '06:00',
    format: 'excel',
    recipients: ['management@algeriatrade.dz'],
    enabled: true,
    nextRunAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    lastStatus: 'completed',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'job-3',
    reportId: 'report-daily-transactions',
    name: 'Daily Transaction Summary',
    description: 'Daily transaction volume and value',
    frequency: 'daily',
    time: '18:00',
    format: 'csv',
    recipients: ['ops@algeriatrace.dz', 'analytics@algeriatrade.dz'],
    enabled: false,
    nextRunAt: new Date(),
    lastRunAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastStatus: 'failed',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'job-4',
    reportId: 'report-quarterly-sector',
    name: 'Quarterly Sector Analysis',
    description: 'Industry sector performance analysis',
    frequency: 'quarterly',
    time: '09:00',
    format: 'pdf',
    recipients: ['board@algeriatrade.dz'],
    enabled: true,
    nextRunAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    lastRunAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    lastStatus: 'completed',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  }
];

const generateExportHistory = (): ExportHistoryItem[] => [
  {
    id: 'exp-1',
    reportName: 'Executive KPIs Q4 2024',
    format: 'pdf',
    filename: 'executive_kpis_q4_2024.pdf',
    recordCount: 1247,
    exportedBy: 'admin@algeriatrade.dz',
    exportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    downloadUrl: '#',
    size: '2.4 MB'
  },
  {
    id: 'exp-2',
    reportName: 'Wilaya Analytics Full Export',
    format: 'excel',
    filename: 'wilaya_analytics_2024.xlsx',
    recordCount: 58,
    exportedBy: 'analyst1@algeriatrade.dz',
    exportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    downloadUrl: '#',
    size: '856 KB'
  },
  {
    id: 'exp-3',
    reportName: 'Sector Performance Report',
    format: 'csv',
    filename: 'sector_performance_nov.csv',
    recordCount: 15,
    exportedBy: 'manager@algeriatrade.dz',
    exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    downloadUrl: '#',
    size: '124 KB'
  },
  {
    id: 'exp-4',
    reportName: 'Cohort Retention Analysis',
    format: 'pdf',
    filename: 'cohort_retention_analysis.pdf',
    recordCount: 2847,
    exportedBy: 'admin@algeriatrade.dz',
    exportedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    downloadUrl: '#',
    size: '4.1 MB'
  },
  {
    id: 'exp-5',
    reportName: 'Revenue Waterfall Monthly',
    format: 'excel',
    filename: 'revenue_waterfall_dec.xlsx',
    recordCount: 10,
    exportedBy: 'finance@algeriatrade.dz',
    exportedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    downloadUrl: '#',
    size: '345 KB'
  }
];

const generateUserPermissions = (): UserPermission[] => [
  {
    userId: 'user-1',
    userName: 'Admin User',
    userEmail: 'admin@algeriatrade.dz',
    role: 'admin',
    canCreateReports: true,
    canExportData: true,
    canScheduleReports: true,
    canAccessAllMetrics: true,
    lastActive: new Date()
  },
  {
    userId: 'user-2',
    userName: 'Analytics Manager',
    userEmail: 'analytics@algeriatrade.dz',
    role: 'manager',
    canCreateReports: true,
    canExportData: true,
    canScheduleReports: true,
    canAccessAllMetrics: true,
    lastActive: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    userId: 'user-3',
    userName: 'Data Analyst',
    userEmail: 'analyst1@algeriatrade.dz',
    role: 'analyst',
    canCreateReports: true,
    canExportData: true,
    canScheduleReports: false,
    canAccessAllMetrics: false,
    lastActive: new Date(Date.now() - 120 * 60 * 1000)
  },
  {
    userId: 'user-4',
    userName: 'Finance Viewer',
    userEmail: 'finance@algeriatrade.dz',
    role: 'viewer',
    canCreateReports: false,
    canExportData: false,
    canScheduleReports: false,
    canAccessAllMetrics: false,
    lastActive: new Date(Date.now() - 300 * 60 * 1000)
  },
  {
    userId: 'user-5',
    userName: 'Operations Lead',
    userEmail: 'ops@algeriatrade.dz',
    role: 'manager',
    canCreateReports: true,
    canExportData: true,
    canScheduleReports: true,
    canAccessAllMetrics: false,
    lastActive: new Date(Date.now() - 600 * 60 * 1000)
  }
];

// ============== Main Admin Page Component ==============

export default function AdvancedAnalyticsAdminPage() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showEditPermDialog, setShowEditPermDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
  
  // New job form state
  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    frequency: 'weekly',
    time: '08:00',
    format: 'pdf',
    recipients: ''
  });

  // Load data on mount
  useEffect(() => {
    setTimeout(() => {
      setScheduledJobs(generateScheduledJobs());
      setExportHistory(generateExportHistory());
      setUserPermissions(generateUserPermissions());
      setIsLoading(false);
    }, 800);
  }, []);

  // Toggle job status
  const toggleJobStatus = (jobId: string) => {
    setScheduledJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, enabled: !job.enabled } : job
    ));
  };

  // Delete job
  const deleteJob = (jobId: string) => {
    setScheduledJobs(prev => prev.filter(job => job.id !== jobId));
  };

  // Format date helper
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Advanced Analytics & Reporting
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business intelligence management for AlgeriaTrade.dz
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-1">
            <BarChart3 className="w-4 h-4 hidden sm:inline" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1">
            <FileText className="w-4 h-4 hidden sm:inline" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-1">
            <Clock className="w-4 h-4 hidden sm:inline" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-1">
            <Download className="w-4 h-4 hidden sm:inline" />
            Exports
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1">
            <Shield className="w-4 h-4 hidden sm:inline" />
            Access
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <ExecutiveDashboard />
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <CustomReportBuilder />
        </TabsContent>

        {/* Scheduled Jobs Tab */}
        <TabsContent value="scheduled" className="mt-6 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                    <p className="text-2xl font-bold">{scheduledJobs.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Jobs</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {scheduledJobs.filter(j => j.enabled).length}
                    </p>
                  </div>
                  <Play className="w-8 h-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paused Jobs</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {scheduledJobs.filter(j => !j.enabled).length}
                    </p>
                  </div>
                  <Pause className="w-8 h-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed Today</p>
                    <p className="text-2xl font-bold text-red-600">
                      {scheduledJobs.filter(j => j.lastStatus === 'failed').length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheduled Jobs Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Scheduled Report Jobs</CardTitle>
                <CardDescription>Manage automated report generation and delivery</CardDescription>
              </div>
              
              <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Scheduled Job</DialogTitle>
                    <DialogDescription>
                      Configure a new automated report generation schedule
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-name">Job Name</Label>
                      <Input
                        id="job-name"
                        placeholder="e.g., Weekly Executive Report"
                        value={newJob.name}
                        onChange={(e) => setNewJob(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="job-desc">Description</Label>
                      <Textarea
                        id="job-desc"
                        placeholder="What does this report contain?"
                        value={newJob.description}
                        onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select
                          value={newJob.frequency}
                          onValueChange={(value) => setNewJob(prev => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={newJob.time}
                          onChange={(e) => setNewJob(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select
                          value={newJob.format}
                          onValueChange={(value) => setNewJob(prev => ({ ...prev, format: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Recipients</Label>
                        <Input
                          placeholder="email@example.com"
                          value={newJob.recipients}
                          onChange={(e) => setNewJob(prev => ({ ...prev, recipients: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowNewJobDialog(false)} disabled={!newJob.name}>
                      Create Job
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : scheduledJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No scheduled jobs yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => setShowNewJobDialog(true)}
                  >
                    Create your first scheduled job
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledJobs.map(job => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{job.name}</p>
                            {job.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {job.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {job.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="uppercase text-sm font-medium">{job.format}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={job.lastStatus} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(job.nextRunAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {job.lastRunAt ? formatDate(job.lastRunAt) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleJobStatus(job.id)}>
                                {job.enabled ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" /> Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" /> Resume
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" /> View Logs
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteJob(job.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export History Tab */}
        <TabsContent value="exports" className="mt-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Download className="w-10 h-10 text-blue-500/50" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Exports</p>
                    <p className="text-2xl font-bold">{exportHistory.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-10 h-10 text-green-500/50" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">
                      {exportHistory.reduce((sum, e) => sum + e.recordCount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-10 h-10 text-purple-500/50" />
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">
                      {exportHistory.filter(e => Date.now() - e.exportedAt.getTime() < 7 * 24 * 60 * 60 * 1000).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export History Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Export History</CardTitle>
                  <CardDescription>Recent data exports and downloads</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search exports..." className="pl-8 w-[200px]" />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Exported By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exportHistory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{item.reportName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-xs">
                            {item.format}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.recordCount.toLocaleString()}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {item.exportedBy.split('@')[0]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(item.exportedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="mt-6 space-y-4">
          {/* Role Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { role: 'Admin', count: userPermissions.filter(u => u.role === 'admin').length, color: 'bg-purple-500' },
              { role: 'Manager', count: userPermissions.filter(u => u.role === 'manager').length, color: 'bg-blue-500' },
              { role: 'Analyst', count: userPermissions.filter(u => u.role === 'analyst').length, color: 'bg-green-500' },
              { role: 'Viewer', count: userPermissions.filter(u => u.role === 'viewer').length, color: 'bg-gray-500' }
            ].map(r => (
              <Card key={r.role}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${r.color}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">{r.role}s</p>
                      <p className="text-2xl font-bold">{r.count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* User Permissions Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    User Access Permissions
                  </CardTitle>
                  <CardDescription>Manage who can access reports and export data</CardDescription>
                </div>
                
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Create Reports</TableHead>
                      <TableHead>Export Data</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>All Metrics</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userPermissions.map(user => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.userName}</p>
                              <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.role === 'admin' ? 'default' :
                              user.role === 'manager' ? 'secondary' : 'outline'
                            }
                            className="capitalize"
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.canCreateReports ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.canExportData ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.canScheduleReports ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.canAccessAllMetrics ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((Date.now() - user.lastActive.getTime()) / (1000 * 60 * 60))}h ago
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditPermDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Permission Legend */}
          <Card className="bg-muted/50">
            <CardContent className="py-4">
              <h4 className="text-sm font-semibold mb-3">Permission Levels Explained</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="default" className="shrink-0 mt-0.5">Admin</Badge>
                  <span className="text-muted-foreground">Full access to all features and settings</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="shrink-0 mt-0.5">Manager</Badge>
                  <span className="text-muted-foreground">Can create, edit, and schedule all reports</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5">Analyst</Badge>
                  <span className="text-muted-foreground">Can create and export reports (limited metrics)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0 mt-0.5">Viewer</Badge>
                  <span className="text-muted-foreground">Read-only access to existing reports</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Permission Dialog */}
      <Dialog open={showEditPermDialog} onOpenChange={setShowEditPermDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Modify access rights for {selectedUser?.userName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{selectedUser.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.userEmail}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>User Role</Label>
                <Select defaultValue={selectedUser.role}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>Specific Permissions</Label>
                {[
                  { key: 'canCreateReports', label: 'Can create custom reports' },
                  { key: 'canExportData', label: 'Can export/download data' },
                  { key: 'canScheduleReports', label: 'Can schedule automated reports' },
                  { key: 'canAccessAllMetrics', label: 'Can access all metrics (including sensitive)' }
                ].map(perm => (
                  <div key={perm.key} className="flex items-center gap-3">
                    <Checkbox 
                      defaultChecked={selectedUser[perm.key as keyof UserPermission] as boolean}
                    />
                    <label className="text-sm cursor-pointer">{perm.label}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPermDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowEditPermDialog(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
