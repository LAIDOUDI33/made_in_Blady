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
  Globe,
  Server,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { cdnManager, CDNStats, RegionalStats, formatBytes, formatPercent } from '@/lib/cdn/manager';

// Types
interface CDNDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Mock data for demonstration
const generateMockData = (): {
  globalCacheHitRatio: number;
  regionalPerformance: RegionalStats[];
  bandwidthSavings: { saved: number; total: number; percent: number };
  assetDeliveryTimes: { assetType: string; avgTime: number; p95: number; count: number }[];
  errorRatesByRegion: { region: string; errorRate: number; errors: number; requests: number }[];
} => ({
  globalCacheHitRatio: 0.892 + Math.random() * 0.05,
  regionalPerformance: [
    { region: 'Algiers', countryCode: 'DZ', requests: 285000, hitRate: 0.94, avgLatencyMs: 14, bandwidthBytes: 14250000000 },
    { region: 'Oran', countryCode: 'DZ', requests: 92000, hitRate: 0.91, avgLatencyMs: 24, bandwidthBytes: 4600000000 },
    { region: 'Constantine', countryCode: 'DZ', requests: 71000, hitRate: 0.89, avgLatencyMs: 35, bandwidthBytes: 3550000000 },
    { region: 'Blida', countryCode: 'DZ', requests: 45000, hitRate: 0.92, avgLatencyMs: 18, bandwidthBytes: 2250000000 },
    { region: 'Batna', countryCode: 'DZ', requests: 32000, hitRate: 0.87, avgLatencyMs: 42, bandwidthBytes: 1600000000 },
    { region: 'Setif', countryCode: 'DZ', requests: 28000, hitRate: 0.88, avgLatencyMs: 48, bandwidthBytes: 1400000000 },
    { region: 'Annaba', countryCode: 'DZ', requests: 24000, hitRate: 0.86, avgLatencyMs: 55, bandwidthBytes: 1200000000 },
    { region: 'Bejaia', countryCode: 'DZ', requests: 21000, hitRate: 0.87, avgLatencyMs: 52, bandwidthBytes: 1050000000 },
    { region: 'Tlemcen', countryCode: 'DZ', requests: 18000, hitRate: 0.85, avgLatencyMs: 68, bandwidthBytes: 900000000 },
    { region: 'Paris', countryCode: 'FR', requests: 52000, hitRate: 0.96, avgLatencyMs: 28, bandwidthBytes: 2600000000 },
    { region: 'Tunis', countryCode: 'TN', requests: 38000, hitRate: 0.84, avgLatencyMs: 52, bandwidthBytes: 1900000000 },
    { region: 'Casablanca', countryCode: 'MA', requests: 31000, hitRate: 0.82, avgLatencyMs: 72, bandwidthBytes: 1550000000 },
    { region: 'Dubai', countryCode: 'AE', requests: 22000, hitRate: 0.88, avgLatencyMs: 85, bandwidthBytes: 1100000000 },
  ],
  bandwidthSavings: {
    saved: 18500000000 + Math.round(Math.random() * 2000000000),
    total: 34000000000 + Math.round(Math.random() * 4000000000),
    percent: 0.54 + Math.random() * 0.08,
  },
  assetDeliveryTimes: [
    { assetType: 'Images (WebP)', avgTime: 45, p95: 120, count: 125000 },
    { assetType: 'JavaScript', avgTime: 32, p95: 85, count: 85000 },
    { assetType: 'CSS', avgTime: 28, p95: 65, count: 42000 },
    { assetType: 'Fonts (WOFF2)', avgTime: 38, p95: 90, count: 28000 },
    { assetType: 'API Responses', avgTime: 68, p95: 180, count: 95000 },
    { assetType: 'HTML Pages', avgTime: 52, p95: 140, count: 62000 },
    { assetType: 'Videos (HLS)', avgTime: 125, p95: 350, count: 12000 },
    { assetType: 'Documents (PDF)', avgTime: 95, p95: 250, count: 8000 },
  ],
  errorRatesByRegion: [
    { region: 'Algiers', errorRate: 0.0012, errors: 342, requests: 285000 },
    { region: 'Oran', errorRate: 0.0018, errors: 166, requests: 92000 },
    { region: 'Constantine', errorRate: 0.0021, errors: 149, requests: 71000 },
    { region: 'Paris', errorRate: 0.0008, errors: 42, requests: 52000 },
    { region: 'Tunis', errorRate: 0.0025, errors: 95, requests: 38000 },
    { region: 'Casablanca', errorRate: 0.0032, errors: 99, requests: 31000 },
    { region: 'Dubai', errorRate: 0.0015, errors: 33, requests: 22000 },
  ],
});

export default function CDNDashboard({ 
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 
}: CDNDashboardProps) {
  const [data, setData] = useState<ReturnType<typeof generateMockData>>(generateMockData());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>('hour');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, fetch from API
      // const response = await fetch('/api/cdn/stats?period=' + selectedPeriod);
      // const result = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setData(generateMockData());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch CDN stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-7 h-7 text-primary" />
            CDN Performance Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring for AlgeriaTrade.dz content delivery network
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
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Ratio"
          value={formatPercent(data.globalCacheHitRatio)}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={{ value: 2.3, direction: 'up' }}
          color={data.globalCacheHitRatio > 0.9 ? 'emerald' : data.globalCacheHitRatio > 0.8 ? 'amber' : 'red'}
        />
        <MetricCard
          title="Bandwidth Saved"
          value={formatBytes(data.bandwidthSavings.saved)}
          subtitle={`of ${formatBytes(data.bandwidthSavings.total)} total`}
          icon={<HardDrive className="w-5 h-5" />}
          trend={{ value: 5.1, direction: 'up' }}
          color="blue"
        />
        <MetricCard
          title="Avg Latency"
          value={`${Math.round(data.regionalPerformance.reduce((sum, r) => sum + r.avgLatencyMs, 0) / data.regionalPerformance.length)}ms`}
          subtitle="across all regions"
          icon={<Clock className="w-5 h-5" />}
          trend={{ value: 1.2, direction: 'down' }}
          color="green"
        />
        <MetricCard
          title="Error Rate"
          value={formatPercent(
            data.errorRatesByRegion.reduce((sum, r) => sum + r.errors, 0) / 
            data.errorRatesByRegion.reduce((sum, r) => sum + r.requests, 0)
          )}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={{ value: 0.3, direction: 'down' }}
          color="purple"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="regional" className="w-full">
        <TabsList className="grid w-full max-w-lg">
          <TabsTrigger value="regional" className="gap-1">
            <MapPin className="w-4 h-4" />
            Regional Map
          </TabsTrigger>
          <TabsTrigger value="bandwidth" className="gap-1">
            <Activity className="w-4 h-4" />
            Bandwidth
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1">
            <Server className="w-4 h-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-1">
            <AlertTriangle className="w-4 h-4" />
            Errors
          </TabsTrigger>
        </TabsList>

        {/* Regional Performance Tab */}
        <TabsContent value="regional" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance (MENA Focus)</CardTitle>
              <CardDescription>
                Cache hit rates and latency across Algeria and neighboring regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted rounded-md text-sm font-medium text-muted-foreground">
                  <div className="col-span-3">Region</div>
                  <div className="col-span-2 text-right">Requests</div>
                  <div className="col-span-2 text-right">Hit Rate</div>
                  <div className="col-span-2 text-right">Avg Latency</div>
                  <div className="col-span-2 text-right">Bandwidth</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>

                {/* Data Rows - Sorted by requests descending */}
                {[...data.regionalPerformance]
                  .sort((a, b) => b.requests - a.requests)
                  .map((region, index) => (
                    <div
                      key={region.region}
                      className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-md hover:bg-muted/50 transition-colors ${
                        index < 3 ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{region.region}</span>
                        <Badge variant="outline" className="text-xs">{region.countryCode}</Badge>
                      </div>
                      <div className="col-span-2 text-right font-mono text-sm">
                        {(region.requests / 1000).toFixed(1)}K
                      </div>
                      <div className="col-span-2 text-right">
                        <Badge 
                          variant={region.hitRate > 0.9 ? 'default' : region.hitRate > 0.8 ? 'secondary' : 'destructive'}
                          className="font-mono"
                        >
                          {formatPercent(region.hitRate)}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`font-mono ${region.avgLatencyMs < 30 ? 'text-emerald-600' : region.avgLatencyMs < 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {region.avgLatencyMs}ms
                        </span>
                      </div>
                      <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
                        {formatBytes(region.bandwidthBytes)}
                      </div>
                      <div className="col-span-1 text-right">
                        {region.hitRate > 0.9 && region.avgLatencyMs < 40 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                        ) : region.hitRate > 0.8 ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-500 ml-auto" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Regions</p>
                  <p className="font-semibold">{data.regionalPerformance.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Algerian Regions</p>
                  <p className="font-semibold">
                    {data.regionalPerformance.filter(r => r.countryCode === 'DZ').length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Best Hit Rate</p>
                  <p className="font-semibold text-emerald-600">
                    {formatPercent(Math.max(...data.regionalPerformance.map(r => r.hitRate)))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lowest Latency</p>
                  <p className="font-semibold text-blue-600">
                    {Math.min(...data.regionalPerformance.map(r => r.avgLatencyMs))}ms
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bandwidth Savings Tab */}
        <TabsContent value="bandwidth" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bandwidth Savings Overview</CardTitle>
                <CardDescription>
                  Data served from cache vs origin server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Visual Progress */}
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-emerald-600">
                          Cache Savings
                        </span>
                      </div>
                      <span className="text-xs font-semibold inline-block text-emerald-600">
                        {formatPercent(data.bandwidthSavings.percent)}
                      </span>
                    </div>
                    <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${data.bandwidthSavings.percent * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">Saved</p>
                      <p className="text-xl font-bold text-emerald-800 dark:text-emerald-100">
                        {formatBytes(data.bandwidthSavings.saved)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">Total Served</p>
                      <p className="text-xl font-bold text-blue-800 dark:text-blue-100">
                        {formatBytes(data.bandwidthSavings.total)}
                      </p>
                    </div>
                  </div>

                  {/* Cost & Environmental Impact */}
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg space-y-3">
                    <h4 className="font-semibold text-sm">Impact Metrics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cost Savings (est.)</p>
                        <p className="font-bold text-lg">${(data.bandwidthSavings.saved * 0.00001).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CO₂ Reduction</p>
                        <p className="font-bold text-lg">{(data.bandwidthSavings.saved * 0.00000007).toFixed(2)} kg</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings by Provider</CardTitle>
                <CardDescription>
                  Multi-CDN distribution breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Cloudflare', weight: 60, savings: data.bandwidthSavings.saved * 0.60, color: 'bg-orange-500' },
                    { name: 'Fastly', weight: 25, savings: data.bandwidthSavings.saved * 0.25, color: 'bg-blue-500' },
                    { name: 'CloudFront', weight: 15, savings: data.bandwidthSavings.saved * 0.15, color: 'bg-purple-500' },
                  ].map(provider => (
                    <div key={provider.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-muted-foreground">{formatBytes(provider.savings)}</span>
                      </div>
                      <div className="overflow-hidden h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full ${provider.color} transition-all duration-500`}
                          style={{ width: `${provider.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asset Delivery Times Tab */}
        <TabsContent value="assets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Delivery Performance</CardTitle>
              <CardDescription>
                Average and P95 delivery times by content type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.assetDeliveryTimes.map(asset => (
                  <div key={asset.assetType} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{asset.assetType}</span>
                        <Badge variant="outline" className="text-xs">
                          {(asset.count / 1000).toFixed(1)}K requests
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Average</p>
                          <p className="font-mono font-semibold">{asset.avgTime}ms</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">P95</p>
                          <p className="font-mono font-semibold text-amber-600">{asset.p95}ms</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Visual bar for timing */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (asset.p95 / 300) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        Max: 300ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Rates Tab */}
        <TabsContent value="errors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Rates by Region</CardTitle>
              <CardDescription>
                HTTP errors and failure rates across regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.errorRatesByRegion.map(region => (
                  <div key={region.region} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{region.region}</span>
                        </div>
                        <Badge 
                          variant={
                            region.errorRate < 0.001 ? 'default' :
                            region.errorRate < 0.002 ? 'secondary' : 'destructive'
                          }
                        >
                          {formatPercent(region.errorRate)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{region.errors} errors</span>
                        <span>•</span>
                        <span>{region.requests.toLocaleString()} requests</span>
                      </div>
                    </div>
                    
                    {/* Error rate bar */}
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          region.errorRate < 0.001 ? 'bg-emerald-500' :
                          region.errorRate < 0.002 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(region.errorRate / 0.005) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer with last updated time */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Last updated: {lastUpdated.toLocaleTimeString()}
        {autoRefresh && ` • Auto-refreshing every ${(refreshInterval / 1000)}s`}
      </div>
    </div>
  );
}

// Sub-components

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' };
  color: 'emerald' | 'blue' | 'green' | 'purple' | 'amber' | 'red';
}

function MetricCard({ title, value, subtitle, icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
    amber: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    red: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function
function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

export type { CDNDashboardProps };
