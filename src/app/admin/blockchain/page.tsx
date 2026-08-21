'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ProvenanceTracker } from '@/components/blockchain/ProvenanceTracker';
import { CertificateGenerator } from '@/components/blockchain/CertificateGenerator';
import type {
  ProvenanceRecord,
  Certificate,
  SupplyChainEvent,
  SupplyChainStats,
  VerificationResult,
  SupplyChainEventType,
  ProductCategory
} from '@/lib/blockchain/types';
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  CATEGORY_LABELS,
  CERTIFICATE_TYPE_LABELS
} from '@/lib/blockchain/types';
import {
  Shield,
  Package,
  FileText,
  Activity,
  Search,
  RefreshCw,
  Download,
  Eye,
  QrCode,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  ChevronRight,
  ExternalLink,
  Lock,
  Unlock,
  Hash,
  MapPin,
  Calendar
} from 'lucide-react';

// Stats card component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  color = 'text-primary' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; positive: boolean };
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-muted`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
        {trend && (
          <div className={`mt-3 flex items-center gap-1 text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${!trend.positive ? 'rotate-180' : ''}`} />
            {trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Provenance record row component
function RecordRow({ 
  record, 
  onView 
}: { 
  record: ProvenanceRecord; 
  onView: (record: ProvenanceRecord) => void;
}) {
  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    verified: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Verified' },
    rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
    flagged: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800', label: 'Flagged' },
    expired: { icon: Clock, color: 'bg-gray-100 text-gray-800', label: 'Expired' }
  };
  
  const config = statusConfig[record.currentStatus];
  const StatusIcon = config.icon;
  
  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors group"
      onClick={() => onView(record)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-primary" />
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{record.productName}</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs font-mono text-muted-foreground">{record.batchNumber}</code>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[record.category]}</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {record.currentLocation.city}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {record.events.length} events
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(record.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        {record.isSealed ? (
          <Lock className="w-4 h-4 text-green-600" />
        ) : (
          <Unlock className="w-4 h-4 text-yellow-600" />
        )}
        <Badge variant="outline" className={`${config.color} hidden sm:flex`}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </div>
  );
}

// Event icon mapping (defined outside render)
const eventIconMap: Record<string, { emoji: string; colorClass: string }> = {
  manufacturing: { emoji: '🏭', colorClass: 'bg-green-100 text-green-600' },
  quality_control: { emoji: '✓', colorClass: 'bg-blue-100 text-blue-600' },
  shipping: { emoji: '🚢', colorClass: 'bg-amber-100 text-amber-600' },
  customs: { emoji: '🛃', colorClass: 'bg-red-100 text-red-600' },
  delivery: { emoji: '📦', colorClass: 'bg-emerald-100 text-emerald-600' },
};

// Event log item component
function EventLogItem({ event }: { event: SupplyChainEvent & { productName?: string } }) {
  const iconConfig = eventIconMap[event.eventType] || { emoji: '•', colorClass: 'bg-gray-100 text-gray-600' };
  
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className={`w-8 h-8 rounded-full ${iconConfig.colorClass} flex items-center justify-center shrink-0`}>
        <span>{iconConfig.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">
            {EVENT_TYPE_LABELS[event.eventType]}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(event.timestamp).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {event.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {event.productName && (
            <Badge variant="secondary" className="text-xs">{event.productName}</Badge>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.location.city}, {event.location.wilaya}
          </span>
        </div>
      </div>
    </div>
  );
}

// Certificate list item
function CertificateListItem({ certificate }: { certificate: Certificate }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {CERTIFICATE_TYPE_LABELS[certificate.type]}
          </span>
        </div>
        <code className="text-xs font-mono text-muted-foreground">
          {certificate.certificateNumber}
        </code>
        <p className="text-xs text-muted-foreground">
          {certificate.productName} • Issued by {certificate.issuer.name}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant={certificate.status === 'active' ? 'default' : 'secondary'}>
          {certificate.status}
        </Badge>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Main Admin Blockchain Page
export default function AdminBlockchainPage() {
  // State management
  const [records, setRecords] = useState<ProvenanceRecord[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [events, setEvents] = useState<(SupplyChainEvent & { productName?: string })[]>([]);
  const [stats, setStats] = useState<SupplyChainStats | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ProvenanceRecord | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch data functions
  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/blockchain/provenance?seed=true');
      const result = await response.json();
      if (result.success && result.data) {
        setRecords(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  }, []);
  
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/blockchain/provenance?stats=true');
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);
  
  const fetchCertificates = useCallback(async () => {
    try {
      const response = await fetch('/api/blockchain/certificates');
      const result = await response.json();
      if (result.success && result.data) {
        setCertificates(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    }
  }, []);
  
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/blockchain/events?limit=50');
      const result = await response.json();
      if (result.success && result.data) {
        setEvents(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, []);
  
  // Initial data load
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchRecords(),
        fetchStats(),
        fetchCertificates(),
        fetchEvents()
      ]);
      setIsLoading(false);
    };
    
    loadAllData();
  }, [fetchRecords, fetchStats, fetchCertificates, fetchEvents]);
  
  // Handle verification
  const handleVerify = async (identifier: string) => {
    try {
      const response = await fetch(`/api/blockchain/verify/${encodeURIComponent(identifier)}`);
      const result = await response.json();
      if (result.success) {
        setVerification(result.data);
        setSelectedRecord(result.data.record);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };
  
  // Handle certificate issuance
  const handleIssueCertificate = async (data: {
    provenanceId: string;
    type: string;
    issuer: { name: string; organization: string; title: string };
    expiryDate?: string;
    notes?: string;
  }) => {
    const response = await fetch('/api/blockchain/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (result.success) {
      await fetchCertificates();
      await fetchRecords();
      return result.data;
    }
    return null;
  };
  
  // Filtered records
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.productId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || record.currentStatus === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Blockchain Supply Chain
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage product provenance, certificates, and verification for AlgeriaTrade.dz
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            fetchRecords();
            fetchStats();
            fetchCertificates();
            fetchEvents();
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Records"
            value={stats.totalRecords}
            icon={Database}
            description="Product provenance records"
            trend={{ value: 12.5, positive: true }}
          />
          <StatCard
            title="Active Certificates"
            value={stats.certificatesIssued}
            icon={FileText}
            description="Digital certificates issued"
            color="text-blue-600"
          />
          <StatCard
            title="Events Logged"
            value={stats.totalEventsLogged.toLocaleString()}
            icon={Activity}
            description="Total supply chain events"
            color="text-purple-600"
          />
          <StatCard
            title="Avg Chain Length"
            value={stats.avgChainLength.toFixed(1)}
            icon={BarChart3}
            description="Average events per product"
            color="text-emerald-600"
          />
        </div>
      )}
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Quick Verify */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Quick Verify
                </CardTitle>
                <CardDescription>
                  Enter a product ID, batch number, or hash to verify authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter identifier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify(searchQuery)}
                    className="font-mono"
                  />
                  <Button onClick={() => handleVerify(searchQuery)}>
                    Verify
                  </Button>
                </div>
                
                {verification && (
                  <div className={`mt-4 p-4 rounded-lg ${verification.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {verification.isValid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold">
                        {verification.isValid ? 'Authenticity Verified' : 'Verification Failed'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {verification.checks.map((check, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {check.passed ? (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span>{check.checkName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Events
                </CardTitle>
                <CardDescription>Latest supply chain activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  {events.slice(0, 10).map((event, idx) => (
                    <EventLogItem key={idx} event={event} />
                  ))}
                  {events.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No events recorded yet
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Selected Record Detail */}
          {selectedRecord ? (
            <ProvenanceTracker
              record={selectedRecord}
              verification={verification}
              onVerify={handleVerify}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Select a Record</h3>
                <p className="text-muted-foreground">
                  Choose a provenance record from the Records tab or use quick verify above
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Records Tab */}
        <TabsContent value="records" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, batch, or product ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(cat => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Records List */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Provenance Records</CardTitle>
                  <CardDescription>{filteredRecords.length} records found</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                {filteredRecords.map((record) => (
                  <RecordRow
                    key={record.id}
                    record={record}
                    onView={(r) => {
                      setSelectedRecord(r);
                      setActiveTab('overview');
                    }}
                  />
                ))}
                {filteredRecords.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No records match your filters</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Certificates Tab */}
        <TabsContent value="certificates" className="mt-6 space-y-4">
          <CertificateGenerator
            availableRecords={records}
            onIssueCertificate={handleIssueCertificate}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Issued Certificates</CardTitle>
              <CardDescription>{certificates.length} total certificates</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[400px]">
                {certificates.map((cert) => (
                  <CertificateListItem key={cert.id} certificate={cert} />
                ))}
                {certificates.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No certificates issued yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Event Log</CardTitle>
              <CardDescription>All recorded supply chain events in chronological order</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[600px]">
                {events.map((event, idx) => (
                  <EventLogItem key={idx} event={event} />
                ))}
                {events.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No events logged yet</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tools Tab */}
        <TabsContent value="tools" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage blockchain data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    fetchRecords();
                    alert('Mock data reloaded!');
                  }}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Reload Mock Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Records (JSON)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Certificates (PDF)
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Blockchain system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Algorithm</span>
                    <code>SHA-256 + Proof-of-Work</code>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Difficulty</span>
                    <code>2 leading zeros</code>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Genesis Hash</span>
                    <code className="text-xs">0000...0000 (64 chars)</code>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">QR Error Correction</span>
                    <code>Level H (30% recovery)</code>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Storage</span>
                    <code>In-Memory (Demo)</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
