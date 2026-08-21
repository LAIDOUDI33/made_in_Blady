'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings,
  Database,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Play,
  Pause,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Shield,
  Eye,
  Layers,
  Sliders,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ModelPerformance {
  id: string;
  name: string;
  type: 'forecasting' | 'classification' | 'recommendation' | 'anomaly-detection';
  status: 'active' | 'training' | 'inactive' | 'error';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  trainingDuration: number; // minutes
  inferenceTime: number; // milliseconds
  dataPoints: number;
  version: string;
}

interface PredictionAccuracy {
  modelId: string;
  modelName: string;
  period: string;
  actualValues: number[];
  predictedValues: number[];
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  directionAccuracy: number; // % of correct trend predictions
}

interface TrainingDataStats {
  totalRecords: number;
  categories: Array<{ name: string; count: number; percentage: number }>;
  dateRange: { start: Date; end: Date };
  qualityScore: number;
  missingData: number;
  outliers: number;
  lastUpdated: Date;
}

interface FeatureImportance {
  feature: string;
  importance: number;
  category: 'demographic' | 'behavioral' | 'transactional' | 'contextual';
  trend: 'increasing' | 'stable' | 'decreasing';
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_MODELS: ModelPerformance[] = [
  {
    id: 'model-001',
    name: 'Demand Forecasting v2.1',
    type: 'forecasting',
    status: 'active',
    accuracy: 0.89,
    precision: 0.87,
    recall: 0.91,
    f1Score: 0.89,
    lastTrained: new Date('2024-03-15'),
    trainingDuration: 145,
    inferenceTime: 23,
    dataPoints: 245000,
    version: '2.1.3',
  },
  {
    id: 'model-002',
    name: 'Price Optimization Engine',
    type: 'recommendation',
    status: 'active',
    accuracy: 0.84,
    precision: 0.82,
    recall: 0.86,
    f1Score: 0.84,
    lastTrained: new Date('2024-03-10'),
    trainingDuration: 98,
    inferenceTime: 15,
    dataPoints: 189000,
    version: '1.8.2',
  },
  {
    id: 'model-003',
    name: 'Churn Prediction Model',
    type: 'classification',
    status: 'active',
    accuracy: 0.92,
    precision: 0.88,
    recall: 0.94,
    f1Score: 0.91,
    lastTrained: new Date('2024-03-18'),
    trainingDuration: 67,
    inferenceTime: 8,
    dataPoints: 156000,
    version: '3.0.1',
  },
  {
    id: 'model-004',
    name: 'Supplier Risk Scorer',
    type: 'classification',
    status: 'training',
    accuracy: 0.86,
    precision: 0.84,
    recall: 0.88,
    f1Score: 0.86,
    lastTrained: new Date('2024-03-05'),
    trainingDuration: 120,
    inferenceTime: 12,
    dataPoints: 78000,
    version: '2.4.0',
  },
  {
    id: 'model-005',
    name: 'Product Matching AI',
    type: 'recommendation',
    status: 'active',
    accuracy: 0.91,
    precision: 0.89,
    recall: 0.93,
    f1Score: 0.91,
    lastTrained: new Date('2024-03-12'),
    trainingDuration: 203,
    inferenceTime: 35,
    dataPoints: 312000,
    version: '1.5.7',
  },
  {
    id: 'model-006',
    name: 'Anomaly Detector',
    type: 'anomaly-detection',
    status: 'inactive',
    accuracy: 0.78,
    precision: 0.75,
    recall: 0.82,
    f1Score: 0.78,
    lastTrained: new Date('2024-02-28'),
    trainingDuration: 56,
    inferenceTime: 5,
    dataPoints: 45000,
    version: '1.2.0',
  },
];

const MOCK_ACCURACY_DATA: PredictionAccuracy[] = [
  {
    modelId: 'model-001',
    modelName: 'Demand Forecasting',
    period: 'Last 30 Days',
    actualValues: [100, 115, 132, 128, 145, 152, 168, 175, 182, 190],
    predictedValues: [102, 118, 130, 131, 142, 155, 165, 178, 180, 188],
    mape: 3.2,
    rmse: 4.5,
    directionAccuracy: 90,
  },
  {
    modelId: 'model-003',
    modelName: 'Churn Prediction',
    period: 'Last 30 Days',
    actualValues: [45, 52, 48, 55, 50, 58, 62, 60, 65, 68],
    predictedValues: [43, 50, 51, 54, 52, 56, 64, 59, 63, 70],
    mape: 4.1,
    rmse: 2.3,
    directionAccuracy: 80,
  },
];

const MOCK_TRAINING_DATA: TrainingDataStats = {
  totalRecords: 1245000,
  categories: [
    { name: 'Transactions', count: 524000, percentage: 42.1 },
    { name: 'User Behavior', count: 312000, percentage: 25.1 },
    { name: 'Product Data', count: 198000, percentage: 15.9 },
    { name: 'Market Data', count: 125000, percentage: 10.0 },
    { name: 'External Signals', count: 86000, percentage: 6.9 },
  ],
  dateRange: { start: new Date('2022-01-01'), end: new Date('2024-03-20') },
  qualityScore: 94.5,
  missingData: 2450,
  outliers: 1234,
  lastUpdated: new Date('2024-03-19'),
};

const MOCK_FEATURE_IMPORTANCE: FeatureImportance[] = [
  { feature: 'Order Frequency', importance: 0.185, category: 'behavioral', trend: 'stable' },
  { feature: 'Average Order Value', importance: 0.162, category: 'transactional', trend: 'increasing' },
  { feature: 'Days Since Last Purchase', importance: 0.148, category: 'behavioral', trend: 'stable' },
  { feature: 'Category Preferences', importance: 0.125, category: 'behavioral', trend: 'increasing' },
  { feature: 'Price Sensitivity', importance: 0.112, category: 'behavioral', trend: 'decreasing' },
  { feature: 'Geographic Location', importance: 0.098, category: 'contextual', trend: 'stable' },
  { feature: 'Company Size (Segment)', importance: 0.085, category: 'demographic', trend: 'stable' },
  { feature: 'Payment History', importance: 0.085, category: 'transactional', trend: 'increasing' },
];

const COLORS = ['#16a34a', '#2563eb', '#ca8a04', '#dc2626', '#0891b2', '#9333ea', '#ea580c', '#db2777'];

// ============================================================================
// Sub-Components
// ============================================================================

function ModelStatusBadge({ status }: { status: ModelPerformance['status'] }) {
  const config = {
    active: { icon: CheckCircle2, label: 'Active', variant: 'default' as const, color: 'text-green-600' },
    training: { icon: RefreshCw, label: 'Training', variant: 'secondary' as const, color: 'text-blue-600' },
    inactive: { icon: Pause, label: 'Inactive', variant: 'outline' as const, color: 'text-gray-600' },
    error: { icon: XCircle, label: 'Error', variant: 'destructive' as const, color: 'text-red-600' },
  };
  
  const { icon: Icon, label, variant } = config[status];
  
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${status === 'training' ? 'animate-spin' : ''}`} />
      {label}
    </Badge>
  );
}

function ModelCard({ model, onAction }: { model: ModelPerformance; onAction: (id: string, action: string) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{model.name}</CardTitle>
            <CardDescription className="mt-1">v{model.version} • {model.type.replace('-', ' ')}</CardDescription>
          </div>
          <ModelStatusBadge status={model.status} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2 bg-muted/50 rounded-md text-center">
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="text-lg font-semibold">{(model.accuracy * 100).toFixed(0)}%</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-md text-center">
            <p className="text-xs text-muted-foreground">F1 Score</p>
            <p className="text-lg font-semibold">{(model.f1Score * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Performance Bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span>Precision</span>
            <span>{(model.precision * 100).toFixed(0)}%</span>
          </div>
          <Progress value={model.precision * 100} className="h-1.5" />
          
          <div className="flex items-center justify-between text-xs">
            <span>Recall</span>
            <span>{(model.recall * 100).toFixed(0)}%</span>
          </div>
          <Progress value={model.recall * 100} className="h-1.5" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{model.inferenceTime}ms</span>
          <span className="flex items-center gap-1"><Database className="h-3 w-3" />{(model.dataPoints / 1000).toFixed(0)}K records</span>
          <span>{model.lastTrained.toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onAction(model.id, 'retrain')}
            disabled={model.status === 'training'}
          >
            {model.status === 'training' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retrain
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction(model.id, 'details')}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction(model.id, 'settings')}>
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccuracyDashboard({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-[400px] w-full" /></CardContent>
      </Card>
    );
  }

  // Prepare chart data for accuracy over time
  const accuracyHistory = [
    { month: 'Oct', demand: 82, churn: 85, price: 78 },
    { month: 'Nov', demand: 84, churn: 87, price: 80 },
    { month: 'Dec', demand: 85, churn: 88, price: 81 },
    { month: 'Jan', demand: 86, churn: 89, price: 82 },
    { month: 'Feb', demand: 87, churn: 90, price: 83 },
    { month: 'Mar', demand: 89, churn: 92, price: 84 },
  ];

  const chartConfig: ChartConfig = {
    demand: { label: 'Demand Forecasting', color: '#16a34a' },
    churn: { label: 'Churn Prediction', color: '#2563eb' },
    price: { label: 'Price Optimization', color: '#ca8a04' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prediction Accuracy Dashboard</CardTitle>
            <CardDescription>Model performance metrics over time</CardDescription>
          </div>
          <Select defaultValue="30d">
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={accuracyHistory}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="demand" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="churn" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="price" stroke="#ca8a04" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Error Metrics Table */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Error Metrics by Model</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>MAPE (%)</TableHead>
                <TableHead>RMSE</TableHead>
                <TableHead>Trend Accuracy</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_ACCURACY_DATA.map((data) => (
                <TableRow key={data.modelId}>
                  <TableCell className="font-medium">{data.modelName}</TableCell>
                  <TableCell>
                    <span className={data.mape < 5 ? 'text-green-600' : data.mape < 10 ? 'text-yellow-600' : 'text-red-600'}>
                      {data.mape}%
                    </span>
                  </TableCell>
                  <TableCell>{data.rmse.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={data.directionAccuracy} className="w-16 h-2" />
                      <span className="text-sm">{data.directionAccuracy}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={data.directionAccuracy >= 85 ? 'default' : 'secondary'}>
                      {data.directionAccuracy >= 85 ? 'Good' : 'Acceptable'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DataManagementPanel({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-[400px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Training Data Management</CardTitle>
            <CardDescription>Overview of datasets used for model training</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Database className="h-4 w-4" />
              <span className="text-sm">Total Records</span>
            </div>
            <p className="text-2xl font-bold">{(MOCK_TRAINING_DATA.totalRecords / 1000000).toFixed(2)}M</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Quality Score</span>
            </div>
            <p className="text-2xl font-bold">{MOCK_TRAINING_DATA.qualityScore}%</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Missing Values</span>
            </div>
            <p className="text-2xl font-bold">{MOCK_TRAINING_DATA.missingData.toLocaleString()}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Last Updated</span>
            </div>
            <p className="text-lg font-bold">{MOCK_TRAINING_DATA.lastUpdated.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Data Distribution by Category</h4>
          <div className="space-y-3">
            {MOCK_TRAINING_DATA.categories.map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="w-32 text-sm truncate">{cat.name}</span>
                <div className="flex-1">
                  <Progress value={cat.percentage} className="h-3" />
                </div>
                <span className="w-20 text-sm text-right">{cat.count.toLocaleString()} ({cat.percentage}%)</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MOCK_TRAINING_DATA.categories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {MOCK_TRAINING_DATA.categories.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Sample
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Validate Data
          </Button>
          <Button variant="outline">
            <Layers className="h-4 w-4 mr-2" />
            View Schema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureImportanceVisualization({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-[450px] w-full" /></CardContent>
      </Card>
    );
  }

  const chartConfig: ChartConfig = {
    importance: { label: 'Importance Score', color: '#16a34a' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Feature Importance Analysis</CardTitle>
            <CardDescription>Key features driving prediction models</CardDescription>
          </div>
          <Badge variant="secondary">
            Churn Prediction Model
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Horizontal Bar Chart */}
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_FEATURE_IMPORTANCE} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 0.25]} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} width={140} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="importance" fill="#16a34a" radius={[0, 4, 4, 0]}>
                {MOCK_FEATURE_IMPORTANCE.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Feature Details Table */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Feature Details</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Importance</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_FEATURE_IMPORTANCE.map((feat) => (
                <TableRow key={feat.feature}>
                  <TableCell className="font-medium">{feat.feature}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={feat.importance * 400} className="w-16 h-2" />
                      <span className="text-sm">{(feat.importance * 100).toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{feat.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`flex items-center gap-1 ${
                      feat.trend === 'increasing' ? 'text-green-600' :
                      feat.trend === 'decreasing' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {feat.trend === 'increasing' && <TrendingUp className="h-3 w-3" />}
                      {feat.trend === 'decreasing' && <TrendingDown className="h-3 w-3" />}
                      {feat.trend}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Sliders className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemHealthPanel() {
  const systemMetrics = [
    { label: 'CPU Usage', value: 45, icon: Cpu, status: 'normal' as const },
    { label: 'Memory Usage', value: 68, icon: MemoryStick, status: 'warning' as const },
    { label: 'GPU Utilization', value: 32, icon: Activity, status: 'normal' as const },
    { label: 'Disk Space', value: 55, icon: HardDrive, status: 'normal' as const },
    { label: 'API Latency', value: 23, icon: Zap, status: 'normal' as const, unit: 'ms' },
    { label: 'Queue Depth', value: 12, icon: Layers, status: 'normal' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Health</CardTitle>
            <CardDescription>AI infrastructure status and resource utilization</CardDescription>
          </div>
          <Badge variant="default" className="bg-green-600">
            <Shield className="h-3 w-3 mr-1" />
            All Systems Operational
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {systemMetrics.map((metric) => (
            <div key={metric.label} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <metric.icon className="h-4 w-4" />
                  <span className="text-sm">{metric.label}</span>
                </div>
                <span className={`text-lg font-bold ${
                  metric.status === 'normal' ? 'text-green-600' :
                  metric.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {metric.value}{metric.unit || '%'}
                </span>
              </div>
              <Progress 
                value={metric.unit ? Math.min(metric.value * 2, 100) : metric.value} 
                className={`h-2 ${
                  metric.status === 'normal' ? '[&>div]:bg-green-500' :
                  metric.status === 'warning' ? '[&>div]:bg-yellow-500' :
                  '[&>div]:bg-red-500'
                }`} 
              />
            </div>
          ))}
        </div>

        {/* Active Processes */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Active Inference Jobs</h4>
          <div className="space-y-2">
            {[
              { name: 'Batch Demand Forecast', progress: 75, eta: '2m 14s' },
              { name: 'Supplier Risk Scoring', progress: 45, eta: '5m 32s' },
              { name: 'Price Optimization Run', progress: 100, eta: 'Complete' },
            ].map((job) => (
              <div key={job.name} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                <span className="flex-1 text-sm">{job.name}</span>
                <Progress value={job.progress} className="w-24 h-2" />
                <span className="text-xs text-muted-foreground w-16">{job.eta}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Admin Page Component
// ============================================================================

export default function AIIntelligenceAdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<ModelPerformance[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setModels(MOCK_MODELS);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleModelAction = (modelId: string, action: string) => {
    console.log(`Action ${action} for model ${modelId}`);
    
    if (action === 'retrain') {
      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, status: 'training' as const } : m
      ));
      
      // Simulate training completion
      setTimeout(() => {
        setModels(prev => prev.map(m => 
          m.id === modelId ? { ...m, status: 'active' as const, lastTrained: new Date(), version: incrementVersion(m.version) } : m
        ));
      }, 5000);
    }
  };

  function incrementVersion(version: string): string {
    const parts = version.split('.');
    parts[parts.length - 1] = String(parseInt(parts[parts.length - 1]) + 1);
    return parts.join('.');
  }

  const activeModels = models.filter(m => m.status === 'active').length;
  const trainingModels = models.filter(m => m.status === 'training').length;
  const avgAccuracy = models.length > 0 
    ? (models.reduce((sum, m) => sum + m.accuracy, 0) / models.length * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                AI Intelligence Center
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage machine learning models, monitor predictions, and oversee training data
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Run Diagnostics
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Models</p>
              <p className="text-2xl font-bold">{models.length}</p>
            </div>
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Active Models</p>
              <p className="text-2xl font-bold text-green-600">{activeModels}</p>
            </div>
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Training</p>
              <p className="text-2xl font-bold text-blue-600">{trainingModels}</p>
            </div>
            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Avg Accuracy</p>
              <p className="text-2xl font-bold text-purple-600">{avgAccuracy}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="models" className="space-y-6">
          <TabsList className="grid w-full lg:w-auto lg:inline-grid grid-cols-4">
            <TabsTrigger value="models">Model Management</TabsTrigger>
            <TabsTrigger value="accuracy">Prediction Accuracy</TabsTrigger>
            <TabsTrigger value="data">Training Data</TabsTrigger>
            <TabsTrigger value="features">Feature Importance</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-[200px] w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                models.map(model => (
                  <ModelCard 
                    key={model.id} 
                    model={model} 
                    onAction={handleModelAction}
                  />
                ))
              )}
            </div>

            <SystemHealthPanel />
          </TabsContent>

          <TabsContent value="accuracy" className="space-y-6">
            <AccuracyDashboard isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataManagementPanel isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <FeatureImportanceVisualization isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
