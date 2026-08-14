/**
 * AlgeriaTrade.dz - Enterprise Monitoring Dashboard
 * 
 * Real-time monitoring dashboard with:
 * - System health overview
 * - Performance metrics
 * - Active alerts
 * - Business KPIs
 * - Infrastructure status
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  Zap,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

// ===========================================
// Types
// ===========================================

interface MonitoringData {
  timestamp: string;
  
  // System Health
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
    environment: string;
  };
  
  // Performance Metrics
  performance: {
    requestsPerSecond: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    activeUsers: number;
    activeConnections: number;
  };
  
  // Infrastructure
  infrastructure: {
    cpu: {
      usage: number;
      cores: number;
      loadAvg: number[];
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: Array<{
      path: string;
      percentage: number;
      free: number;
    }>;
    network: {
      inbound: number;
      outbound: number;
    };
  };
  
  // Business Metrics
  business: {
    totalRevenue: number;
    ordersToday: number;
    newUsersToday: number;
    conversionRate: number;
    activeProducts: number;
    rfqCount: number;
  };
  
  // Alerts
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
    metric: string;
  }>;
}

// ===========================================
// Mock Data Generator (for demo)
// ===========================================

function generateMockMonitoringData(): MonitoringData {
  const now = new Date().toISOString();
  
  return {
    timestamp: now,
    
    health: {
      status: Math.random() > 0.9 ? 'degraded' : 'healthy',
      uptime: 99.95 + (Math.random() * 0.04),
      version: '2.4.1',
      environment: process.env.NODE_ENV || 'production',
    },
    
    performance: {
      requestsPerSecond: Math.round(50 + Math.random() * 150),
      avgResponseTime: Math.round(100 + Math.random() * 200),
      p95ResponseTime: Math.round(300 + Math.random() * 400),
      errorRate: Math.round(Math.random() * 100) / 100,
      activeUsers: Math.round(100 + Math.random() * 500),
      activeConnections: Math.round(20 + Math.random() * 80),
    },
    
    infrastructure: {
      cpu: {
        usage: Math.round(30 + Math.random() * 50),
        cores: 8,
        loadAvg: [
          Math.round((1 + Math.random() * 3) * 100) / 100,
          Math.round((1.5 + Math.random() * 2) * 100) / 100,
          Math.round((1.2 + Math.random() * 1.5) * 100) / 100,
        ],
      },
      memory: {
        used: Math.round(4 + Math.random() * 6), // GB
        total: 16,
        percentage: Math.round(25 + Math.random() * 40),
      },
      disk: [
        {
          path: '/',
          percentage: Math.round(40 + Math.random() * 30),
          free: Math.round(50 + Math.random() * 40),
        },
        {
          path: '/data',
          percentage: Math.round(60 + Math.random() * 25),
          free: Math.round(20 + Math.random() * 30),
        },
      ],
      network: {
        inbound: Math.round(Math.random() * 1000),
        outbound: Math.round(Math.random() * 500),
      },
    },
    
    business: {
      totalRevenue: Math.round(45000 + Math.random() * 15000),
      ordersToday: Math.round(50 + Math.random() * 100),
      newUsersToday: Math.round(10 + Math.random() * 40),
      conversionRate: Math.round((2 + Math.random() * 5) * 100) / 100,
      activeProducts: 1247,
      rfqCount: Math.round(80 + Math.random() * 120),
    },
    
    alerts: generateMockAlerts(),
  };
}

function generateMockAlerts(): MonitoringData['alerts'] {
  const alertTemplates = [
    { severity: 'warning' as const, message: 'High memory usage detected on web server', metric: 'memory.usage' },
    { severity: 'info' as const, message: 'Scheduled maintenance window starting in 1 hour', metric: 'maintenance' },
    { severity: 'critical' as const, message: 'Database connection pool nearing capacity', metric: 'db.pool' },
    { severity: 'warning' as const, message: 'Response time degradation on /api/products endpoint', metric: 'response_time' },
    { severity: 'info' as const, message: 'New deployment completed successfully', metric: 'deployment' },
  ];
  
  return alertTemplates
    .filter(() => Math.random() > 0.5)
    .slice(0, 3)
    .map((template, i) => ({
      id: `alert_${i}`,
      ...template,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
}

// ===========================================
// Sub-Components
// ===========================================

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  const config = {
    healthy: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Healthy' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Degraded' },
    unhealthy: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Unhealthy' },
  };

  const { icon: Icon, color, bg, label } = config[status];

  return (
    <Badge variant="outline" className={`${bg} ${color} border-current gap-1`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  description,
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          </div>
          
          {trend && (
            <div className={`flex items-center text-xs ${
              trend === 'up' ? 'text-red-600' : 
              trend === 'down' ? 'text-green-600' : 
              'text-gray-500'
            }`}>
              {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {trend === 'stable' && <Minus className="w-3 h-3" />}
              {trendValue && `${Math.abs(trendValue)}%`}
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="ml-1 text-sm text-gray-500">{unit}</span>
          )}
        </div>
        
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ 
  value, 
  max = 100, 
  colorClass = 'bg-blue-500',
  warningThreshold = 70,
  criticalThreshold = 90,
}: { 
  value: number; 
  max?: number; 
  colorClass?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}) {
  const percentage = (value / max) * 100;
  
  let actualColorClass = colorClass;
  if (percentage >= criticalThreshold) {
    actualColorClass = 'bg-red-500';
  } else if (percentage >= warningThreshold) {
    actualColorClass = 'bg-yellow-500';
  }

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className={`${actualColorClass} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

function AlertItem({ alert }: { alert: MonitoringData['alerts'][0] }) {
  const severityConfig = {
    info: { icon: Activity, color: 'border-blue-500 bg-blue-50 dark:bg-blue-950', textColor: 'text-blue-800 dark:text-blue-200' },
    warning: { icon: AlertTriangle, color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950', textColor: 'text-yellow-800 dark:text-yellow-200' },
    critical: { icon: XCircle, color: 'border-red-500 bg-red-50 dark:bg-red-950', textColor: 'text-red-800 dark:text-red-200' },
  };

  const { icon: Icon, color, textColor } = severityConfig[alert.severity];

  return (
    <div className={`p-3 border-l-4 ${color} rounded-r-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <Icon className={`w-4 h-4 mt-0.5 ${textColor}`} />
          <div>
            <p className={`font-medium ${textColor}`}>{alert.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(alert.timestamp).toLocaleString()} • {alert.metric}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={textColor}>
          {alert.severity}
        </Badge>
      </div>
    </div>
  );
}

// ===========================================
// Main Dashboard Component
// ===========================================

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('10');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch monitoring data
  const fetchMonitoringData = useCallback(async () => {
    try {
      // In production, this would call your API:
      // const response = await fetch('/api/admin/monitoring');
      // const data = await response.json();
      
      // For demo, use mock data
      const mockData = generateMockMonitoringData();
      setData(mockData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchMonitoringData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(
        fetchMonitoringData, 
        parseInt(refreshInterval) * 1000
      );
    }
    
    return () => clearInterval(interval);
  }, [fetchMonitoringData, autoRefresh, refreshInterval]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Monitoring Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system observability & performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>

          {/* Refresh interval selector */}
          <Select value={refreshInterval} onValueChange={setRefreshInterval}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">1 minute</SelectItem>
            </SelectContent>
          </Select>

          {/* Manual refresh */}
          <Button variant="outline" size="sm" onClick={fetchMonitoringData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border">
        <div className="flex items-center gap-4">
          <StatusBadge status={data.health.status} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            v{data.health.version} • {data.health.environment}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Uptime: <strong>{data.health.uptime.toFixed(2)}%</strong></span>
          <span>Last updated: {lastRefresh?.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({data.alerts.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Users"
              value={data.performance.activeUsers}
              icon={Users}
              trend="up"
              trendValue={12.5}
              description="Currently online"
            />
            <MetricCard
              title="Requests/sec"
              value={data.performance.requestsPerSecond}
              icon={Zap}
              trend="stable"
              trendValue={2.3}
              description="Average over last 5 min"
            />
            <MetricCard
              title="Avg Response Time"
              value={data.performance.avgResponseTime}
              unit="ms"
              icon={Activity}
              trend="down"
              trendValue={5.2}
              description={`P95: ${data.performance.p95ResponseTime}ms`}
            />
            <MetricCard
              title="Error Rate"
              value={data.performance.errorRate}
              unit="%"
              icon={AlertTriangle}
              trend="down"
              trendValue={0.3}
              description="Target: < 1%"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
                <CardDescription>Core service status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Web Server</span>
                  <StatusBadge status="healthy" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Gateway</span>
                  <StatusBadge status="healthy" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <StatusBadge status="healthy" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Redis Cache</span>
                  <StatusBadge status="healthy" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">CDN</span>
                  <StatusBadge status="healthy" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Alerts</CardTitle>
                <CardDescription>Latest system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.length > 0 ? (
                  data.alerts.slice(0, 3).map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>All systems operating normally</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CPU Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  CPU Usage
                </CardTitle>
                <CardDescription>
                  {data.infrastructure.cpu.cores} cores available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Current Usage</span>
                    <span className="font-medium">{data.infrastructure.cpu.usage}%</span>
                  </div>
                  <ProgressBar value={data.infrastructure.cpu.usage} />
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">1 min</p>
                    <p className="font-medium">{data.infrastructure.cpu.loadAvg[0]}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">5 min</p>
                    <p className="font-medium">{data.infrastructure.cpu.loadAvg[1]}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">15 min</p>
                    <p className="font-medium">{data.infrastructure.cpu.loadAvg[2]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="w-5 h-5" />
                  Memory Usage
                </CardTitle>
                <CardDescription>
                  {data.infrastructure.memory.used}GB / {data.infrastructure.memory.total}GB total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memory Used</span>
                    <span className="font-medium">{data.infrastructure.memory.percentage}%</span>
                  </div>
                  <ProgressBar value={data.infrastructure.memory.percentage} />
                </div>
                
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Heap Used</span>
                    <span>~{(data.infrastructure.memory.used * 0.6).toFixed(1)}GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Buffer Cache</span>
                    <span>~{(data.infrastructure.memory.used * 0.25).toFixed(1)}GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Available</span>
                    <span className="text-green-600">
                      {(data.infrastructure.memory.total - data.infrastructure.memory.used).toFixed(1)}GB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disk Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Disk Usage
                </CardTitle>
                <CardDescription>Storage partitions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.infrastructure.disk.map(disk => (
                  <div key={disk.path}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-mono">{disk.path}</span>
                      <span className="font-medium">{disk.percentage}% ({disk.free}GB free)</span>
                    </div>
                    <ProgressBar value={disk.percentage} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Network I/O */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Network I/O
                </CardTitle>
                <CardDescription>Current bandwidth usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                    <ArrowDownRight className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="text-xs text-gray-500">Inbound</p>
                    <p className="text-xl font-bold text-green-600">
                      {(data.infrastructure.network.inbound / 1024).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">MB/s</p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                    <ArrowUpRight className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-xs text-gray-500">Outbound</p>
                    <p className="text-xl font-bold text-blue-600">
                      {(data.infrastructure.network.outbound / 1024).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">MB/s</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Connections</span>
                    <span className="font-medium">{data.performance.activeConnections}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Requests/Second"
              value={data.performance.requestsPerSecond}
              icon={Zap}
              trend="up"
              trendValue={8.2}
            />
            <MetricCard
              title="Avg Response Time"
              value={data.performance.avgResponseTime}
              unit="ms"
              icon={Activity}
              trend="down"
              trendValue={3.1}
            />
            <MetricCard
              title="Error Rate"
              value={data.performance.errorRate}
              unit="%"
              icon={XCircle}
              trend="down"
              trendValue={0.5}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Endpoint Performance</CardTitle>
              <CardDescription>Top API endpoints by request volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Endpoint</th>
                      <th className="text-right p-2">Requests</th>
                      <th className="text-right p-2">Avg Time</th>
                      <th className="text-right p-2">P95</th>
                      <th className="text-right p-2">Errors</th>
                      <th className="text-right p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { path: '/api/products', req: 1250, avg: 45, p95: 120, err: 0.2 },
                      { path: '/api/search', req: 980, avg: 85, p95: 210, err: 0.5 },
                      { path: '/api/companies', req: 650, avg: 35, p95: 90, err: 0.1 },
                      { path: '/api/auth/login', req: 420, avg: 120, p95: 280, err: 1.2 },
                      { path: '/api/orders', req: 380, avg: 65, p95: 150, err: 0.3 },
                    ].map(endpoint => (
                      <tr key={endpoint.path} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2 font-mono text-xs">{endpoint.path}</td>
                        <td className="text-right p-2">{endpoint.req.toLocaleString()}</td>
                        <td className="text-right p-2">{endpoint.avg}ms</td>
                        <td className="text-right p-2">{endpoint.p95}ms</td>
                        <td className="text-right p-2">{endpoint.err}%</td>
                        <td className="text-right p-2">
                          <StatusBadge status={endpoint.err > 1 ? 'degraded' : 'healthy'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Today's Revenue"
              value={`$${(data.business.totalRevenue / 1000).toFixed(1)}K`}
              icon={TrendingUp}
              trend="up"
              trendValue={15.3}
            />
            <MetricCard
              title="Orders Today"
              value={data.business.ordersToday}
              icon={Server}
              trend="up"
              trendValue={8.7}
            />
            <MetricCard
              title="New Users"
              value={data.business.newUsersToday}
              icon={Users}
              trend="up"
              trendValue={22.1}
            />
            <MetricCard
              title="Conversion Rate"
              value={data.business.conversionRate}
              unit="%"
              icon={Zap}
              trend="up"
              trendValue={1.8}
            />
            <MetricCard
              title="Active Products"
              value={data.business.activeProducts}
              icon={Database}
              trend="stable"
              trendValue={2.1}
            />
            <MetricCard
              title="Open RFQs"
              value={data.business.rfqCount}
              icon={Globe}
              trend="down"
              trendValue={5.4}
            />
          </div>

          {/* Conversion Funnel Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Overview</CardTitle>
              <CardDescription>User journey from visit to purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: 'Product Views', count: 12450, rate: 100 },
                  { step: 'Add to Cart / RFQ', count: 2340, rate: 18.8 },
                  { step: 'Checkout / Quote Request', count: 890, rate: 38.0 },
                  { step: 'Payment / Order Confirm', count: 520, rate: 58.4 },
                  { step: 'Completed Orders', count: 485, rate: 93.3 },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-600">{item.step}</div>
                    
                    <div className="flex-1">
                      <ProgressBar 
                        value={item.rate} 
                        max={100}
                        colorClass={
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-indigo-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-pink-500' :
                          'bg-green-500'
                        }
                      />
                    </div>
                    
                    <div className="w-24 text-right">
                      <span className="font-medium">{item.count.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-1">({item.rate}%)</span>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t text-center text-sm text-gray-600">
                  Overall Conversion Rate:{' '}
                  <strong className="text-green-600">
                    {((485 / 12450) * 100).toFixed(2)}%
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <Badge variant="outline" className={
              data.alerts.some(a => a.severity === 'critical') ? 'text-red-600 border-red-600' :
              data.alerts.some(a => a.severity === 'warning') ? 'text-yellow-600 border-yellow-600' :
              'text-green-600 border-green-600'
            }>
              {data.alerts.length} active
            </Badge>
          </div>

          <div className="space-y-3">
            {data.alerts.length > 0 ? (
              data.alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    All Clear!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No active alerts at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Alert History Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Alert History (Last 24 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">2</p>
                  <p className="text-sm text-gray-600">Critical</p>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">5</p>
                  <p className="text-sm text-gray-600">Warnings</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-600">Info</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===========================================
// Exports
// ===========================================

export default MonitoringDashboard;
