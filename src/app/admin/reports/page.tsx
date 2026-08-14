'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, FileText, BarChart3, PieChart, TrendingUp, Users, DollarSign, Package, Clock, Filter, RefreshCw, Eye, Trash2, Calendar } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  period: string;
  formats: string[];
  icon: string;
  category: string;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  format: string;
  status: 'completed' | 'processing' | 'failed';
  generatedAt: string;
  expiresAt: string;
  downloadUrl?: string;
  size?: number;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-sales',
    name: 'Rapport de Ventes Mensuel',
    description: "Vue d'ensemble complète des ventes avec tendances",
    type: 'sales_overview',
    period: 'month',
    formats: ['pdf', 'excel', 'csv'],
    icon: '📈',
    category: 'sales',
  },
  {
    id: 'product-performance',
    name: 'Performance des Produits',
    description: 'Analyse détaillée des produits les plus performants',
    type: 'product_performance',
    period: 'quarter',
    formats: ['pdf', 'excel'],
    icon: '🏆',
    category: 'products',
  },
  {
    id: 'geographic-analysis',
    name: 'Analyse Géographique',
    description: 'Répartition des ventes par région/pays',
    type: 'geographic_distribution',
    period: 'quarter',
    formats: ['pdf', 'html', 'excel'],
    icon: '🗺️',
    category: 'sales',
  },
  {
    id: 'rfq-summary',
    name: "Synthèse des Appels d'Offres",
    description: 'Statistiques sur les demandes de devis RFQ',
    type: 'rfq_analysis',
    period: 'month',
    formats: ['csv', 'excel', 'pdf'],
    icon: '📋',
    category: 'operations',
  },
  {
    id: 'user-growth',
    name: 'Croissance des Utilisateurs',
    description: "Évolution des inscriptions et de l'activité",
    type: 'user_growth',
    period: 'year',
    formats: ['pdf', 'json'],
    icon: '👥',
    category: 'users',
  },
  {
    id: 'revenue-by-category',
    name: 'Revenus par Catégorie',
    description: "Chiffre d'affaires par catégorie de produits",
    type: 'revenue_by_category',
    period: 'quarter',
    formats: ['pdf', 'excel', 'html'],
    icon: '💰',
    category: 'financial',
  },
  {
    id: 'payment-methods-report',
    name: 'Analyse des Paiements',
    description: "Statistiques d'utilisation des modes de paiement",
    type: 'payment_methods',
    period: 'month',
    formats: ['pdf', 'csv'],
    icon: '💳',
    category: 'financial',
  },
  {
    id: 'supplier-analytics',
    name: 'Analyse des Fournisseurs',
    description: 'Performance et activité des fournisseurs',
    type: 'supplier_analytics',
    period: 'quarter',
    formats: ['pdf', 'excel'],
    icon: '🏭',
    category: 'products',
  },
  {
    id: 'buyer-behavior',
    name: 'Comportement des Acheteurs',
    description: "Patterns d'achat et préférences",
    type: 'buyer_behavior',
    period: 'quarter',
    formats: ['pdf', 'json'],
    icon: '🛒',
    category: 'users',
  },
  {
    id: 'inventory-status',
    name: 'État des Stocks',
    description: 'Niveaux d\'inventaire et alertes',
    type: 'inventory_status',
    period: 'today',
    formats: ['excel', 'csv', 'pdf'],
    icon: '📦',
    category: 'operations',
  },
];

export default function AdminReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [generating, setGenerating] = useState<string | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports/history');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (templateId: string, format: string) => {
    setGenerating(templateId);
    
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          format,
          period: selectedPeriod,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to local state
        setReports(prev => [{
          id: data.reportId,
          templateId,
          name: REPORT_TEMPLATES.find(t => t.id === templateId)?.name || 'Report',
          format,
          status: data.status || 'processing',
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          downloadUrl: data.downloadUrl,
          size: data.size,
        }, ...prev]);

        // If completed, trigger download
        if (data.status === 'completed' && data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Error generating report');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      await fetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const filteredTemplates = REPORT_TEMPLATES.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
    return true;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="animate-pulse">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate, download, and manage business reports
          </p>
        </div>
        <Button variant="outline" onClick={fetchReports}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">Generated this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Templates</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{REPORT_TEMPLATES.length}</div>
            <p className="text-xs text-muted-foreground">Report types available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(reports.reduce((sum, r) => sum + (r.size || 0), 0) / 1024 / 1024).toFixed(1)} MB
            </div>
            <p className="text-xs text-muted-foreground">Total report storage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => {
                const date = new Date(r.generatedAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Generated this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Generate Reports
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled
          </TabsTrigger>
        </TabsList>

        {/* Generate Reports Tab */}
        <TabsContent value="generate" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="sales">📈 Sales</SelectItem>
                      <SelectItem value="products">📦 Products & Suppliers</SelectItem>
                      <SelectItem value="users">👥 Users</SelectItem>
                      <SelectItem value="financial">💰 Financial</SelectItem>
                      <SelectItem value="operations">⚙️ Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Period</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">📄 PDF Document</SelectItem>
                      <SelectItem value="excel">📊 Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">📋 CSV Data</SelectItem>
                      <SelectItem value="html">🌐 HTML Page</SelectItem>
                      <SelectItem value="json">{} JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Templates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {template.formats.map((format) => (
                        <Badge
                          key={format}
                          variant={selectedFormat === format ? 'default' : 'secondary'}
                          className="text-xs cursor-pointer"
                          onClick={() => setSelectedFormat(format)}
                        >
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => generateReport(template.id, selectedFormat)}
                      disabled={generating === template.id}
                    >
                      {generating === template.id ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-1 h-3 w-3" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports History</CardTitle>
              <CardDescription>
                Download or manage your previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading reports...
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No reports generated yet.</p>
                  <p className="text-sm">Go to the "Generate Reports" tab to create your first report.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          report.format === 'pdf' ? 'bg-red-100 text-red-600' :
                          report.format === 'excel' ? 'bg-green-100 text-green-600' :
                          report.format === 'csv' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(report.generatedAt).toLocaleDateString()} • {formatFileSize(report.size)} • {report.format.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(report.status)}
                        
                        {report.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReport(report.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>
                    Set up automatic report generation and delivery
                  </CardDescription>
                </div>
                <Button>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  New Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No scheduled reports yet.</p>
                <p className="text-sm">Create a schedule to automatically generate and email reports.</p>
              </div>
              
              {/* Example scheduled reports info */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Available Schedules:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Daily:</strong> Sales summary at 8:00 AM</li>
                  <li>• <strong>Weekly:</strong> Full analytics every Monday</li>
                  <li>• <strong>Monthly:</strong> Comprehensive business review on 1st</li>
                  <li>• <strong>Quarterly:</strong> Executive summary with trends</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
