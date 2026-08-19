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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Cpu,
  MemoryStick,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Server,
  BarChart3,
} from 'lucide-react';

// Types
interface EdgeFunctionMetrics {
  name: string;
  invocations: number;
  avgExecutionTime: number;
  p50Time: number;
  p95Time: number;
  p99Time: number;
  errorRate: number;
  errorCount: number;
  coldStarts: number;
  coldStartRate: number;
  avgMemoryMB: number;
  peakMemoryMB: number;
  status: 'healthy' | 'degraded' | 'critical';
}

interface EdgeFunctionMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Mock data generator
const generateMockFunctionData = (): EdgeFunctionMetrics[] => [
  {
    name: 'geo-router',
    invocations: 1250000 + Math.round(Math.random() * 100000),
    avgExecutionTime: 2.4 + Math.random() * 1.5,
    p50Time: 2.1 + Math.random(),
    p95Time: 8.5 + Math.random() * 5,
    p99Time: 15 + Math.random() * 10,
    errorRate: 0.0003 + Math.random() * 0.001,
    errorCount: Math.round(500 + Math.random() * 200),
    coldStarts: Math.round(2500 + Math.random() * 1000),
    coldStartRate: 0.002 + Math.random() * 0.002,
    avgMemoryMB: 45 + Math.random() * 10,
    peakMemoryMB: 85 + Math.random() * 20,
    status: 'healthy',
  },
  {
    name: 'bot-detector',
    invocations: 1180000 + Math.round(Math.random() * 90000),
    avgExecutionTime: 1.8 + Math.random(),
    p50Time: 1.6 + Math.random() * 0.5,
    p95Time: 5.2 + Math.random() * 3,
    p99Time: 9 + Math.random() * 6,
    errorRate: 0.0001 + Math.random() * 0.0005,
    errorCount: Math.round(150 + Math.random() * 80),
    coldStarts: Math.round(1800 + Math.random() * 700),
    coldStartRate: 0.0015 + Math.random() * 0.001,
    avgMemoryMB: 32 + Math.random() * 8,
    peakMemoryMB: 58 + Math.random() * 12,
    status: 'healthy',
  },
  {
    name: 'rate-limiter',
    invocations: 1320000 + Math.round(Math.random() * 110000),
    avgExecutionTime: 0.9 + Math.random() * 0.5,
    p50Time: 0.7 + Math.random() * 0.3,
    p95Time: 3.2 + Math.random() * 2,
    p99Time: 6 + Math.random() * 4,
    errorRate: 0.00005 + Math.random() * 0.0002,
    errorCount: Math.round(70 + Math.random() * 40),
    coldStarts: Math.round(1200 + Math.random() * 500),
    coldStartRate: 0.001 + Math.random() * 0.0008,
    avgMemoryMB: 25 + Math.random() * 5,
    peakMemoryMB: 42 + Math.random() * 8,
    status: 'healthy',
  },
  {
    name: 'ab-testing-engine',
    invocations: 850000 + Math.round(Math.random() * 70000),
    avgExecutionTime: 3.2 + Math.random() * 2,
    p50Time: 2.8 + Math.random() * 1.2,
    p95Time: 12 + Math.random() * 7,
    p99Time: 22 + Math.random() * 14,
    errorRate: 0.0008 + Math.random() * 0.002,
    errorCount: Math.round(800 + Math.random() * 300),
    coldStarts: Math.round(3500 + Math.random() * 1500),
    coldStartRate: 0.004 + Math.random() * 0.002,
    avgMemoryMB: 55 + Math.random() * 15,
    peakMemoryMB: 110 + Math.random() * 30,
    status: 'degraded',
  },
  {
    name: 'image-transformer',
    invocations: 420000 + Math.round(Math.random() * 40000),
    avgExecutionTime: 45 + Math.random() * 25,
    p50Time: 38 + Math.random() * 18,
    p95Time: 120 + Math.random() * 60,
    p99Time: 220 + Math.random() * 100,
    errorRate: 0.002 + Math.random() * 0.003,
    errorCount: Math.round(1000 + Math.random() * 400),
    coldStarts: Math.round(5200 + Math.random() * 2000),
    coldStartRate: 0.012 + Math.random() * 0.005,
    avgMemoryMB: 128 + Math.random() * 35,
    peakMemoryMB: 256 + Math.random() * 64,
    status: 'degraded',
  },
  {
    name: 'cache-policy-manager',
    invocations: 980000 + Math.round(Math.random() * 80000),
    avgExecutionTime: 1.5 + Math.random() * 0.8,
    p50Time: 1.3 + Math.random() * 0.5,
    p95Time: 4.8 + Math.random() * 2.5,
    p99Time: 9 + Math.random() * 5,
    errorRate: 0.0002 + Math.random() * 0.0008,
    errorCount: Math.round(220 + Math.random() * 100),
    coldStarts: Math.round(2100 + Math.random() * 900),
    coldStartRate: 0.0022 + Math.random() * 0.0012,
    avgMemoryMB: 38 + Math.random() * 8,
    peakMemoryMB: 72 + Math.random() * 16,
    status: 'healthy',
  },
  {
    name: 'auth-validator',
    invocations: 650000 + Math.round(Math.random() * 55000),
    avgExecutionTime: 8.5 + Math.random() * 4,
    p50Time: 7.2 + Math.random() * 3,
    p95Time: 28 + Math.random() * 15,
    p99Time: 52 + Math.random() * 25,
    errorRate: 0.005 + Math.random() * 0.01,
    errorCount: Math.round(3800 + Math.random() * 1500),
    coldStarts: Math.round(4800 + Math.random() * 1800),
    coldStartRate: 0.0075 + Math.random() * 0.003,
    avgMemoryMB: 68 + Math.random() * 18,
    peakMemoryMB: 135 + Math.random() * 32,
    status: 'critical',
  },
  {
    name: 'response-transformer',
    invocations: 720000 + Math.round(Math.random() * 60000),
    avgExecutionTime: 4.2 + Math.random() * 2.5,
    p50Time: 3.6 + Math.random() * 1.5,
    p95Time: 15 + Math.random() * 8,
    p99Time: 28 + Math.random() * 14,
    errorRate: 0.001 + Math.random() * 0.002,
    errorCount: Math.round(800 + Math.random() * 350),
    coldStarts: Math.round(2900 + Math.random() * 1200),
    coldStartRate: 0.004 + Math.random() * 0.002,
    avgMemoryMB: 48 + Math.random() * 12,
    peakMemoryMB: 92 + Math.random() * 22,
    status: 'healthy',
  },
];

export default function EdgeFunctionMonitor({
  className = '',
  autoRefresh = true,
  refreshInterval = 15000,
}: EdgeFunctionMonitorProps) {
  const [functionsData, setFunctionsData] = useState<EdgeFunctionMetrics[]>(generateMockFunctionData());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>('hour');
  const [sortBy, setSortBy] = useState<'invocations' | 'avgExecutionTime' | 'errorRate' | 'coldStartRate'>('invocations');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));
      setFunctionsData(generateMockFunctionData());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch edge function stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  const sortedData = [...functionsData].sort((a, b) => {
    switch (sortBy) {
      case 'invocations': return b.invocations - a.invocations;
      case 'avgExecutionTime': return b.avgExecutionTime - a.avgExecutionTime;
      case 'errorRate': return b.errorRate - a.errorRate;
      case 'coldStartRate': return b.coldStartRate - a.coldStartRate;
      default: return 0;
    }
  });

  // Calculate aggregate metrics
  const totalInvocations = functionsData.reduce((sum, f) => sum + f.invocations, 0);
  const totalErrors = functionsData.reduce((sum, f) => sum + f.errorCount, 0);
  const overallErrorRate = totalErrors / totalInvocations;
  const avgColdStartRate = functionsData.reduce((sum, f) => sum + f.coldStartRate, 0) / functionsData.length;
  const healthyCount = functionsData.filter(f => f.status === 'healthy').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            Edge Function Monitor
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time execution metrics for edge computing functions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invocations</p>
                <p className="text-2xl font-bold mt-1">{(totalInvocations / 1000000).toFixed(2)}M</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5% vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Error Rate</p>
                <p className="text-2xl font-bold mt-1">{(overallErrorRate * 100).toFixed(3)}%</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
              <TrendingDown className="w-4 h-4" />
              <span>-0.02% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Cold Start Rate</p>
                <p className="text-2xl font-bold mt-1">{(avgColdStartRate * 100).toFixed(2)}%</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <TrendingUp className="w-4 h-4" />
              <span>+0.3% increase</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healthy Functions</p>
                <p className="text-2xl font-bold mt-1">{healthyCount}/{functionsData.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <Progress 
              value={(healthyCount / functionsData.length) * 100} 
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="functions" className="w-full">
        <TabsList className="grid w-full max-w-md">
          <TabsTrigger value="functions" className="gap-1">
            <Server className="w-4 h-4" />
            Functions
          </TabsTrigger>
          <TabsTrigger value="execution-times" className="gap-1">
            <Clock className="w-4 h-4" />
            Execution Times
          </TabsTrigger>
          <TabsTrigger value="memory" className="gap-1">
            <Cpu className="w-4 h-4" />
            Memory Usage
          </TabsTrigger>
          <TabsTrigger value="cold-starts" className="gap-1">
            <Zap className="w-4 h-4" />
            Cold Starts
          </TabsTrigger>
        </TabsList>

        {/* Functions Overview Tab */}
        <TabsContent value="functions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Edge Functions</CardTitle>
                  <CardDescription>All active edge functions and their health status</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invocations">Invocations</SelectItem>
                      <SelectItem value="avgExecutionTime">Exec Time</SelectItem>
                      <SelectItem value="errorRate">Error Rate</SelectItem>
                      <SelectItem value="coldStartRate">Cold Start</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function</TableHead>
                    <TableHead className="text-right">Invocations</TableHead>
                    <TableHead className="text-right">Avg Time</TableHead>
                    <TableHead className="text-right">P95</TableHead>
                    <TableHead className="text-right">Error Rate</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((func) => (
                    <TableRow key={func.name} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${
                            func.status === 'healthy' ? 'text-emerald-500' :
                            func.status === 'degraded' ? 'text-amber-500' : 'text-red-500'
                          }`} />
                          <span className="font-medium font-mono">{func.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(func.invocations / 1000).toFixed(1)}K
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {func.avgExecutionTime.toFixed(1)}ms
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {func.p95Time.toFixed(0)}ms
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            func.errorRate < 0.001 ? 'default' :
                            func.errorRate < 0.005 ? 'secondary' : 'destructive'
                          }
                        >
                          {(func.errorRate * 100).toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            func.status === 'healthy' ? 'default' :
                            func.status === 'degraded' ? 'secondary' : 'destructive'
                          }
                          className={
                            func.status === 'healthy' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                            func.status === 'degraded' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                            undefined
                          }
                        >
                          {func.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Times Tab */}
        <TabsContent value="execution-times" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Time Distribution</CardTitle>
              <CardDescription>P50, P95, and P99 latency percentiles per function</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedData.map((func) => (
                  <div key={func.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono">{func.name}</span>
                        <Badge
                          variant={
                            func.avgExecutionTime < 5 ? 'default' :
                            func.avgExecutionTime < 20 ? 'secondary' : 'destructive'
                          }
                        >
                          Avg: {func.avgExecutionTime.toFixed(1)}ms
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-emerald-600">P50: {func.p50Time.toFixed(0)}ms</span>
                        <span className="text-amber-600">P95: {func.p95Time.toFixed(0)}ms</span>
                        <span className="text-red-600">P99: {func.p99Time.toFixed(0)}ms</span>
                      </div>
                    </div>
                    
                    {/* Visual latency bar */}
                    <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      {/* P50 zone (green) */}
                      <div
                        className="absolute left-0 top-0 h-full bg-emerald-500/60"
                        style={{ width: `${Math.min(100, (func.p50Time / 250) * 100)}%` }}
                      />
                      {/* P50-P95 zone (yellow) */}
                      <div
                        className="absolute top-0 h-full bg-amber-500/60"
                        style={{ 
                          left: `${Math.min(100, (func.p50Time / 250) * 100)}%`,
                          width: `${Math.min(100 - (func.p50Time / 250) * 100, ((func.p95Time - func.p50Time) / 250) * 100)}%`
                        }}
                      />
                      {/* P95-P99 zone (red) */}
                      <div
                        className="absolute top-0 h-full bg-red-500/60"
                        style={{
                          left: `${Math.min(100, (func.p95Time / 250) * 100)}%`,
                          width: `${Math.min(100 - (func.p95Time / 250) * 100, ((func.p99Time - func.p95Time) / 250) * 100)}%`
                        }}
                      />
                      
                      {/* Markers */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <div
                          className="absolute border-l-2 border-white h-4"
                          style={{ left: `${Math.min(98, (func.p50Time / 250) * 100)}%` }}
                        />
                        <div
                          className="absolute border-l-2 border-white h-4"
                          style={{ left: `${Math.min(98, (func.p95Time / 250) * 100)}%` }}
                        />
                        <div
                          className="absolute border-l-2 border-white h-4"
                          style={{ left: `${Math.min(98, (func.p99Time / 250) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-emerald-500/60 rounded" /> P50
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500/60 rounded" /> P50-P95
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500/60 rounded" /> P95-P99
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Usage Tab */}
        <TabsContent value="memory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Trends</CardTitle>
              <CardDescription>Average and peak memory consumption per function</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedData.map((func) => (
                  <div key={func.name} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-5 h-5 text-purple-500" />
                        <span className="font-medium font-mono">{func.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Avg: <strong>{func.avgMemoryMB.toFixed(0)} MB</strong></span>
                        <span>Peak: <strong className="text-amber-600">{func.peakMemoryMB.toFixed(0)} MB</strong></span>
                      </div>
                    </div>
                    
                    {/* Memory usage bar */}
                    <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, (func.avgMemoryMB / 256) * 100)}%` }}
                      />
                      {/* Peak marker */}
                      <div
                        className="absolute top-0 w-0.5 h-full bg-amber-500"
                        style={{ left: `${Math.min(98, (func.peakMemoryMB / 256) * 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 MB</span>
                      <span>128 MB</span>
                      <span>256 MB (limit)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cold Starts Tab */}
        <TabsContent value="cold-starts" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cold Start Frequency</CardTitle>
                <CardDescription>
                  How often each function experiences cold starts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedData.map((func) => (
                    <div key={func.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono">{func.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">
                            {func.coldStarts.toLocaleString()} starts
                          </span>
                          <Badge
                            variant={
                              func.coldStartRate < 0.003 ? 'default' :
                              func.coldStartRate < 0.007 ? 'secondary' : 'destructive'
                            }
                          >
                            {(func.coldStartRate * 100).toFixed(2)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={func.coldStartRate * 100 * 10} // Scale to visible range
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cold Start Impact Analysis</CardTitle>
                <CardDescription>
                  Functions with highest cold start impact on user experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...sortedData]
                    .sort((a, b) => (b.coldStartRate * b.invocations) - (a.coldStartRate * a.invocations))
                    .slice(0, 5)
                    .map((func, index) => {
                      const impactScore = func.coldStartRate * func.invocations * func.avgExecutionTime;
                      return (
                        <div key={func.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium font-mono">{func.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Impact Score: {impactScore.toFixed(0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-600">
                              {(func.coldStartRate * 100).toFixed(2)}%
                            </p>
                            <p className="text-xs text-muted-foreground">cold start rate</p>
                          </div>
                        </div>
                      );
                    })}
                  
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">Recommendation</p>
                        <p className="mt-1">
                          Consider implementing function warming or provisioned concurrency 
                          for high-impact functions like <strong>auth-validator</strong> and 
                          <strong> image-transformer</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Last updated: {lastUpdated.toLocaleTimeString()}
        {autoRefresh && ` • Auto-refreshing every ${(refreshInterval / 1000)}s`}
      </div>
    </div>
  );
}

export type { EdgeFunctionMonitorProps };
