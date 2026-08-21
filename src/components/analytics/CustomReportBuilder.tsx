'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
  ScatterChart,
  LayoutGrid,
  Plus,
  Trash2,
  Download,
  Save,
  Clock,
  Filter,
  GripVertical,
  Search,
  CalendarDays,
  FileText,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRightLeft
} from 'lucide-react';

// Types
import { 
  MetricDefinition, 
  ReportConfig, 
  ScheduleConfig,
  AVAILABLE_METRICS,
  INDUSTRY_SECTORS,
  ALGERIAN_WILAYAS 
} from '@/lib/analytics/engine';

// ============== Chart Type Icons ==============

const chartTypeIcons: Record<string, React.ReactNode> = {
  bar: <BarChart3 className="w-5 h-5" />,
  line: <LineChart className="w-5 h-5" />,
  pie: <PieChartIcon className="w-5 h-5" />,
  scatter: <ScatterChart className="w-5 h-5" />,
  heatmap: <LayoutGrid className="w-5 h-5" />,
  area: <LineChart className="w-5 h-5" />
};

const chartTypeLabels: Record<string, string> = {
  bar: 'Bar Chart',
  line: 'Line Chart',
  pie: 'Pie Chart',
  scatter: 'Scatter Plot',
  heatmap: 'Heatmap',
  area: 'Area Chart'
};

// ============== Metric Category Colors ==============

const categoryColors: Record<string, string> = {
  revenue: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  orders: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  users: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  products: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  engagement: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  geographic: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  conversion: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  financial: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

// ============== Saved Template Interface ==============

interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<ReportConfig>;
  createdAt: Date;
  updatedAt: Date;
}

// ============== Main CustomReportBuilder Component ==============

interface CustomReportBuilderProps {
  onExport?: (config: ReportConfig) => void;
  className?: string;
}

export function CustomReportBuilder({ onExport, className }: CustomReportBuilderProps) {
  // State
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['time']);
  const [chartType, setChartType] = useState<string>('bar');
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [compareRange, setCompareRange] = useState({
    enabled: false,
    start: '',
    end: ''
  });

  // Schedule state
  const [scheduleConfig, setScheduleConfig] = useState<Partial<ScheduleConfig>>({
    enabled: false,
    frequency: 'weekly',
    time: '08:00',
    format: 'pdf',
    recipients: []
  });

  // UI State
  const [activeTab, setActiveTab] = useState('metrics');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [metricSearchCategory, setMetricSearchCategory] = useState<string>('all');

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('algeriatrade_report_templates');
      if (saved) {
        const templates = JSON.parse(saved);
        setSavedTemplates(templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        })));
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }, []);

  // Get filtered metrics based on search
  const filteredMetrics = AVAILABLE_METRICS.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         metric.nameAr.includes(searchQuery) ||
                         metric.id.includes(searchQuery);
    const matchesCategory = metricSearchCategory === 'all' || metric.category === metricSearchCategory;
    return matchesSearch && matchesCategory;
  });

  // Group metrics by category
  const metricsByCategory = filteredMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, MetricDefinition[]>);

  // Toggle metric selection
  const toggleMetric = useCallback((metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  }, []);

  // Toggle dimension selection
  const toggleDimension = useCallback((dimension: string) => {
    setSelectedDimensions(prev =>
      prev.includes(dimension)
        ? prev.filter(d => d !== dimension)
        : [...prev, dimension]
    );
  }, []);

  // Generate report
  const handleGenerateReport = async () => {
    if (selectedMetrics.length === 0) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/analytics/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName || 'Custom Report',
          description: reportDescription,
          metrics: selectedMetrics,
          dimensions: selectedDimensions,
          startDate: dateRange.start,
          endDate: dateRange.end,
          compareStartDate: compareRange.enabled ? compareRange.start : undefined,
          compareEndDate: compareRange.enabled ? compareRange.end : undefined,
          chartType,
          scheduledExport: scheduleConfig.enabled ? scheduleConfig : undefined
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedReport(result.data);
        setActiveTab('preview');
      } else {
        console.error('Report generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save template
  const handleSaveTemplate = () => {
    if (!reportName.trim()) return;

    const template: SavedTemplate = {
      id: `template_${Date.now()}`,
      name: reportName,
      description: reportDescription,
      config: {
        metrics: selectedMetrics,
        dimensions: selectedDimensions,
        chartType,
        dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTemplates = [...savedTemplates, template];
    setSavedTemplates(updatedTemplates);
    
    localStorage.setItem('algeriatrade_report_templates', JSON.stringify(updatedTemplates));
    setShowSaveDialog(false);
  };

  // Load template
  const handleLoadTemplate = (template: SavedTemplate) => {
    setReportName(template.name);
    setReportDescription(template.description || '');
    setSelectedMetrics(template.config.metrics || []);
    setSelectedDimensions(template.config.dimensions || ['time']);
    setChartType(template.config.chartType || 'bar');
    setActiveTab('metrics');
  };

  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('algeriatrade_report_templates', JSON.stringify(updatedTemplates));
  };

  // Export report
  const handleExport = async (format: string) => {
    if (!generatedReport && selectedMetrics.length > 0) {
      await handleGenerateReport();
    }

    try {
      const response = await fetch(`/api/analytics/export?format=${format}&type=kpis`);
      const result = await response.json();
      
      if (result.success) {
        onExport?.({} as ReportConfig);
        alert(`Export ready: ${result.export.filename}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Custom Report Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build custom analytics reports with 40+ available metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={selectedMetrics.length === 0}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Report Template</DialogTitle>
                <DialogDescription>
                  Save current configuration for future use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Monthly Revenue Report"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-desc">Description</Label>
                  <Textarea
                    id="template-desc"
                    placeholder="Brief description of this report..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={!reportName.trim()}>
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={selectedMetrics.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleGenerateReport}
            disabled={selectedMetrics.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">Selected:</span>
            <Badge variant="secondary" className="gap-1">
              <BarChart3 className="w-3 h-3" />
              {selectedMetrics.length} Metrics
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Filter className="w-3 h-3" />
              {selectedDimensions.length} Dimensions
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {chartTypeIcons[chartType]}
              {chartTypeLabels[chartType]}
            </Badge>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs text-muted-foreground">
              {dateRange.start} → {dateRange.end}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="metrics" className="gap-1">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="dimensions" className="gap-1">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Dimensions</span>
          </TabsTrigger>
          <TabsTrigger value="visualization" className="gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Visualization</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Select Metrics</CardTitle>
                  <CardDescription>Choose from 40+ available KPIs ({selectedMetrics.length} selected)</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search metrics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  
                  <Select value={metricSearchCategory} onValueChange={setMetricSearchCategory}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="geographic">Geographic</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMetrics(AVAILABLE_METRICS.map(m => m.id))}
                  >
                    Select All
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMetrics([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {Object.entries(metricsByCategory).map(([category, metrics]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-foreground mb-3 capitalize flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${categoryColors[category]}`}>
                          {category}
                        </Badge>
                        <span className="text-xs font-normal text-muted-foreground">
                          ({metrics.filter(m => selectedMetrics.includes(m.id)).length}/{metrics.length})
                        </span>
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {metrics.map(metric => (
                          <div
                            key={metric.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedMetrics.includes(metric.id)
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:bg-muted/50'
                            }`}
                            onClick={() => toggleMetric(metric.id)}
                          >
                            <Checkbox
                              checked={selectedMetrics.includes(metric.id)}
                              onCheckedChange={() => toggleMetric(metric.id)}
                              className="mt-0.5"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {metric.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {metric.nameAr}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {metric.description}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {metric.unit}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {metric.format}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dimensions Tab */}
        <TabsContent value="dimensions" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dimension Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analysis Dimensions</CardTitle>
                <CardDescription>Select dimensions to break down your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'time', label: 'Time Period', description: 'Analyze trends over time', icon: <CalendarDays className="w-5 h-5" /> },
                  { id: 'wilaya', label: 'Wilaya (Geographic)', description: 'Breakdown by Algerian provinces', icon: <LayoutGrid className="w-5 h-5" /> },
                  { id: 'sector', label: 'Industry Sector', description: 'Group by business sector', icon: <BarChart3 className="w-5 h-5" /> },
                  { id: 'companySize', label: 'Company Size', description: 'Segment by company size', icon: <Filter className="w-5 h-5" /> }
                ].map(dim => (
                  <div
                    key={dim.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedDimensions.includes(dim.id)
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => toggleDimension(dim.id)}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedDimensions.includes(dim.id) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {dim.icon}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{dim.label}</p>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                    </div>
                    
                    <Checkbox
                      checked={selectedDimensions.includes(dim.id)}
                      onChange={() => {}}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Date Range Picker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Date Range
                </CardTitle>
                <CardDescription>Select your analysis period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Quick Range Buttons */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '7 Days', days: 7 },
                    { label: '30 Days', days: 30 },
                    { label: '90 Days', days: 90 },
                    { label: 'This Year', days: 365 },
                    { label: 'All Time', days: 730 }
                  ].map(range => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - range.days);
                        setDateRange({
                          start: start.toISOString().split('T')[0],
                          end: end.toISOString().split('T')[0]
                        });
                      }}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                <Separator />

                {/* Comparison Period */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="compare-toggle"
                      checked={compareRange.enabled}
                      onCheckedChange={(checked) => 
                        setCompareRange(prev => ({ ...prev, enabled: checked === true }))
                      }
                    />
                    <Label htmlFor="compare-toggle" className="cursor-pointer">
                      Enable comparison period
                    </Label>
                  </div>

                  {compareRange.enabled && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label>Compare Start</Label>
                        <Input
                          type="date"
                          value={compareRange.start}
                          onChange={(e) => setCompareRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Compare End</Label>
                        <Input
                          type="date"
                          value={compareRange.end}
                          onChange={(e) => setCompareRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Visualization Tab */}
        <TabsContent value="visualization" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chart Configuration</CardTitle>
              <CardDescription>Choose how to visualize your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chart Type Selector */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Chart Type</Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(chartTypeIcons).map(([type, icon]) => (
                    <div
                      key={type}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${
                        chartType === type
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setChartType(type)}
                    >
                      <div className={chartType === type ? 'text-primary' : 'text-muted-foreground'}>
                        {icon}
                      </div>
                      <span className="text-xs font-medium text-center">
                        {chartTypeLabels[type]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name..."
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-description">Description</Label>
                  <Input
                    id="report-description"
                    placeholder="Brief description..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview Area */}
              {generatedReport ? (
                <div className="p-6 bg-muted/30 rounded-lg border border-dashed">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-foreground">Report Generated Successfully</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {generatedReport.summary?.highlights?.slice(0, 4).map((highlight: string, idx: number) => (
                      <div key={idx} className="p-3 bg-background rounded-lg text-center">
                        <p className="text-sm font-semibold text-foreground">{highlight}</p>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Generated in {generatedReport.processingTimeMs?.toFixed(0)}ms • {generatedReport.summary?.totalMetrics} metrics • {new Date(generatedReport.generatedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="p-12 bg-muted/20 rounded-lg border border-dashed text-center">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Configure your report and click "Generate Report" to see a preview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Export Scheduling
              </CardTitle>
              <CardDescription>Automate report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Scheduling */}
              <div className="flex items-center gap-3 p-4 rounded-lg border">
                <Checkbox
                  id="schedule-enabled"
                  checked={scheduleConfig.enabled}
                  onCheckedChange={(checked) => 
                    setScheduleConfig(prev => ({ ...prev, enabled: checked === true }))
                  }
                />
                <div className="flex-1">
                  <Label htmlFor="schedule-enabled" className="cursor-pointer font-medium">
                    Enable Scheduled Exports
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate and send this report at regular intervals
                  </p>
                </div>
              </div>

              {scheduleConfig.enabled && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Frequency */}
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={scheduleConfig.frequency}
                        onValueChange={(value) => setScheduleConfig(prev => ({ ...prev, frequency: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <Label>Run Time</Label>
                      <Input
                        type="time"
                        value={scheduleConfig.time}
                        onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>

                    {/* Day of Week (for weekly) */}
                    {(scheduleConfig.frequency === 'weekly') && (
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select
                          value={String(scheduleConfig.dayOfWeek ?? 1)}
                          onValueChange={(value) => setScheduleConfig(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Format */}
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select
                        value={scheduleConfig.format}
                        onValueChange={(value) => setScheduleConfig(prev => ({ ...prev, format: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                          <SelectItem value="pdf">PDF Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="space-y-2">
                    <Label>Email Recipients</Label>
                    <Input
                      placeholder="email1@example.com, email2@example.com..."
                      value={scheduleConfig.recipients?.join(', ') || ''}
                      onChange={(e) => setScheduleConfig(prev => ({
                        ...prev,
                        recipients: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple emails with commas
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Saved Templates
                </span>
                <Badge variant="secondary">{savedTemplates.length} templates</Badge>
              </CardTitle>
              <CardDescription>
                Load previously saved report configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No saved templates yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a report configuration and save it as a template
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedTemplates.map(template => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground truncate">
                              {template.name}
                            </h4>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(template.config.metrics || []).slice(0, 3).map(metricId => {
                            const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
                            return metric ? (
                              <Badge key={metricId} variant="outline" className="text-[10px] px-1.5 py-0">
                                {metric.name.split(' ')[0]}
                              </Badge>
                            ) : null;
                          })}
                          {(template.config.metrics || []).length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{(template.config.metrics || []).length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            Updated {template.updatedAt.toLocaleDateString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadTemplate(template)}
                          >
                            Load
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CustomReportBuilder;
